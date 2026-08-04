// src/lib/tracking/material-access.ts -- SERVER-ONLY material engagement log.
//
// This reuses the project's existing Upstash/KV store. Each event holds a
// class slug, material format, timestamp, result and a one-way fingerprint of
// the existing CTOKEN. It deliberately never stores an email address, name or
// the raw access token in the analytics log.

import { createHash } from "node:crypto";
import { FORMAT_KEYS, type FormatKey } from "../access.ts";
import { isKvConfigured, kvPipeline } from "../kv.ts";
import type { ProviderStatus } from "./types.ts";

export const MATERIAL_ACCESS_FORMATS = [...FORMAT_KEYS, "quiz"] as const;
export type MaterialAccessFormat = (typeof MATERIAL_ACCESS_FORMATS)[number];

type MaterialAccessEvent = {
    classSlug: string;
    format: MaterialAccessFormat;
    timestamp: number;
    success: boolean;
    /** SHA-256 of the subscriber's existing CTOKEN -- non-PII and non-reversible. */
    subscriberRef: string;
};

export type MaterialAccessMetrics = ProviderStatus & {
    totalOpened: number;
    totalFailed: number;
    byClass: Array<{
        classSlug: string;
        formats: Array<{ format: MaterialAccessFormat; opened: number; failed: number }>;
    }>;
};

const ROOT = "jbc:material-access:v1";
const EVENT_LOG_LIMIT = 2_000;

function int(value: unknown): number {
    const n = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
    return Number.isFinite(n) ? n : 0;
}

function refForToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
}

function formatKey(slug: string, format: MaterialAccessFormat, result: "opened" | "failed"): string {
    return `${ROOT}:class:${slug}:format:${format}:${result}`;
}

function isMaterialFormat(value: string): value is MaterialAccessFormat {
    return (MATERIAL_ACCESS_FORMATS as readonly string[]).includes(value);
}

/**
 * Record one completed or failed material-access attempt. Counters are durable
 * for the dashboard; the detailed event list is capped to the newest 2,000
 * records so analytics cannot grow KV without bound.
 */
export async function recordMaterialAccess(input: {
    subscriberToken: string;
    classSlug: string;
    format: MaterialAccessFormat;
    success: boolean;
    timestamp?: number;
}): Promise<void> {
    if (!isKvConfigured || !input.subscriberToken || !input.classSlug || !isMaterialFormat(input.format)) {
        return;
    }

    const event: MaterialAccessEvent = {
        classSlug: input.classSlug,
        format: input.format,
        timestamp: Number.isFinite(input.timestamp) ? Number(input.timestamp) : Date.now(),
        success: input.success,
        subscriberRef: refForToken(input.subscriberToken),
    };
    const result = event.success ? "opened" : "failed";

    await kvPipeline([
        ["INCR", `${ROOT}:total:${result}`],
        ["INCR", formatKey(event.classSlug, event.format, result)],
        ["SADD", `${ROOT}:classes`, event.classSlug],
        ["SADD", `${ROOT}:class:${event.classSlug}:formats`, event.format],
        ["LPUSH", `${ROOT}:events`, JSON.stringify(event)],
        ["LTRIM", `${ROOT}:events`, 0, EVENT_LOG_LIMIT - 1],
    ]);
}

/** Read the durable per-class/per-format counters used by the internal panel. */
export async function readMaterialAccessMetrics(): Promise<MaterialAccessMetrics> {
    const empty = { totalOpened: 0, totalFailed: 0, byClass: [] as MaterialAccessMetrics["byClass"] };
    if (!isKvConfigured) {
        return {
            connected: false,
            hint: "Set the existing UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_URL and KV_REST_API_TOKEN) to record material engagement.",
            ...empty,
        };
    }

    try {
        const classResult = await kvPipeline<string[]>([["SMEMBERS", `${ROOT}:classes`]]);
        const classSlugs = Array.isArray(classResult?.[0])
            ? [...(classResult[0] as string[])].map(String).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
            : [];

        const formatsPerClass = await Promise.all(
            classSlugs.map(async (classSlug) => {
                const out = await kvPipeline<string[]>([["SMEMBERS", `${ROOT}:class:${classSlug}:formats`]]);
                const formats = Array.isArray(out?.[0])
                    ? (out[0] as string[]).filter(isMaterialFormat).sort()
                    : [];
                return { classSlug, formats };
            })
        );

        const reads = [
            ["GET", `${ROOT}:total:opened`],
            ["GET", `${ROOT}:total:failed`],
            ...formatsPerClass.flatMap(({ classSlug, formats }) =>
                formats.flatMap((format) => [
                    ["GET", formatKey(classSlug, format, "opened")],
                    ["GET", formatKey(classSlug, format, "failed")],
                ])
            ),
        ];
        const values = await kvPipeline(reads);
        if (!values) throw new Error("KV unavailable");

        let offset = 2;
        const byClass = formatsPerClass.map(({ classSlug, formats }) => ({
            classSlug,
            formats: formats.map((format) => {
                const opened = int(values[offset]);
                const failed = int(values[offset + 1]);
                offset += 2;
                return { format, opened, failed };
            }),
        }));

        return {
            connected: true,
            totalOpened: int(values[0]),
            totalFailed: int(values[1]),
            byClass,
        };
    } catch (err) {
        return {
            connected: true,
            error: err instanceof Error ? err.message : "Failed to read material-access metrics",
            ...empty,
        };
    }
}

/** Keeps the route handler's accepted format check in one place. */
export function isTrackableMaterialFormat(value: string): value is MaterialAccessFormat {
    return isMaterialFormat(value);
}

/** Type helper for callers which have already excluded the quiz. */
export function isDriveMaterialFormat(value: MaterialAccessFormat): value is FormatKey {
    return value !== "quiz";
}

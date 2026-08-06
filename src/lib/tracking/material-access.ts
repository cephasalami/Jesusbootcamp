// src/lib/tracking/material-access.ts -- SERVER-ONLY material engagement log.
//
// This reuses the project's existing Upstash/KV store. Each event holds a
// class slug, material format, timestamp, result and a one-way fingerprint of
// the existing CTOKEN. It deliberately never stores an email address, name or
// the raw access token in the analytics log.

import { createHash } from "node:crypto";
import { FORMAT_KEYS, type FormatKey } from "../access.ts";
import { isKvConfigured, kvPipeline, type KvCommand } from "../kv.ts";
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

/** One row of the recent-activity log, safe to render (no PII). */
export type MaterialAccessLogEntry = {
    classSlug: string;
    format: MaterialAccessFormat;
    timestamp: number;
    success: boolean;
    /** First 8 characters of the one-way subscriber hash — a stable pseudonym. */
    learner: string;
};

/** The drill-down view: who opened what, when — derived from the event log. */
export type MaterialAccessActivity = ProviderStatus & {
    /** Newest first, already trimmed to the requested limit. */
    events: MaterialAccessLogEntry[];
    /** Distinct subscribers present in the log (optionally within one class). */
    uniqueLearners: number;
    /** Daily opened/failed counts over `windowDays`, oldest first. */
    series: Array<{ date: string; opened: number; failed: number }>;
    windowDays: number;
    /** Events the log holds for this filter, before the display limit. */
    matched: number;
    /** Oldest event the capped log still remembers. */
    oldestMs: number | null;
    /** True when the log is at its 2,000-record cap, so it is a recent window. */
    capped: boolean;
};

const ROOT = "jbc:material-access:v1";
const EVENT_LOG_LIMIT = 2_000;

/**
 * A KV read for the DASHBOARD, as opposed to the fail-soft reads that serve
 * class delivery.
 *
 * kvPipeline returns null when KV is unreachable. Treating that as "no rows"
 * is far worse here than surfacing an error: an empty result renders as a
 * confident zero next to a "Live" badge, which is exactly the fabricated figure
 * this dashboard promises never to show. So retry once — the shared client uses
 * a deliberately tight 2s timeout that a multi-command pipeline can trip — and
 * then throw so the caller renders "needs attention" instead.
 */
async function kvRead<T = unknown>(commands: KvCommand[]): Promise<(T | null)[]> {
    for (let attempt = 1; attempt <= 2; attempt++) {
        const out = await kvPipeline<T>(commands);
        if (out) return out;
    }
    throw new Error("KV did not respond");
}

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
        const classResult = await kvRead<string[]>([["SMEMBERS", `${ROOT}:classes`]]);
        const classSlugs = Array.isArray(classResult[0])
            ? [...(classResult[0] as string[])].map(String).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
            : [];

        // One pipeline for every class's format set. Issuing these per class cost
        // an HTTP round trip each, which is what pushed a course with a handful
        // of classes past the KV client's timeout.
        const formatSets = classSlugs.length
            ? await kvRead<string[]>(
                  classSlugs.map((classSlug) => ["SMEMBERS", `${ROOT}:class:${classSlug}:formats`])
              )
            : [];
        const formatsPerClass = classSlugs.map((classSlug, index) => ({
            classSlug,
            formats: Array.isArray(formatSets[index])
                ? (formatSets[index] as string[]).filter(isMaterialFormat).sort()
                : [],
        }));

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
        const values = await kvRead(reads);

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

const ACTIVITY_WINDOW_DAYS = 14;

function utcDay(ms: number): string {
    return new Date(ms).toISOString().slice(0, 10);
}

function parseLogEntry(raw: unknown): MaterialAccessEvent | null {
    if (typeof raw !== "string") return null;
    try {
        const parsed = JSON.parse(raw) as Partial<MaterialAccessEvent>;
        if (!parsed || typeof parsed.classSlug !== "string" || typeof parsed.format !== "string") return null;
        if (!isMaterialFormat(parsed.format)) return null;
        const timestamp = Number(parsed.timestamp);
        if (!Number.isFinite(timestamp)) return null;
        return {
            classSlug: parsed.classSlug,
            format: parsed.format,
            timestamp,
            success: Boolean(parsed.success),
            subscriberRef: String(parsed.subscriberRef ?? ""),
        };
    } catch {
        return null;
    }
}

/**
 * Read the capped event log behind the counters. This is what makes a class row
 * openable: it answers "when did this happen and how many distinct people",
 * which the plain INCR counters cannot. Pass a `classSlug` for one class.
 */
export async function readMaterialAccessActivity(options: {
    classSlug?: string;
    limit?: number;
} = {}): Promise<MaterialAccessActivity> {
    const limit = Math.max(1, Math.min(options.limit ?? 40, EVENT_LOG_LIMIT));
    const empty = {
        events: [] as MaterialAccessLogEntry[],
        uniqueLearners: 0,
        series: [] as MaterialAccessActivity["series"],
        windowDays: ACTIVITY_WINDOW_DAYS,
        matched: 0,
        oldestMs: null,
        capped: false,
    };

    if (!isKvConfigured) {
        return {
            connected: false,
            hint: "Set the existing UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_URL and KV_REST_API_TOKEN) to record material engagement.",
            ...empty,
        };
    }

    try {
        const out = await kvRead<string[]>([["LRANGE", `${ROOT}:events`, 0, EVENT_LOG_LIMIT - 1]]);
        const rows = Array.isArray(out[0]) ? (out[0] as unknown[]) : [];

        const parsed = rows
            .map(parseLogEntry)
            .filter((event): event is MaterialAccessEvent => event !== null);
        const scoped = options.classSlug
            ? parsed.filter((event) => event.classSlug === options.classSlug)
            : parsed;
        scoped.sort((a, b) => b.timestamp - a.timestamp);

        // Pre-seed every day in the window so quiet days chart as zero, not as a gap.
        const days = new Map<string, { opened: number; failed: number }>();
        const todayStart = new Date(utcDay(Date.now()) + "T00:00:00.000Z").getTime();
        for (let i = ACTIVITY_WINDOW_DAYS - 1; i >= 0; i--) {
            days.set(utcDay(todayStart - i * 86_400_000), { opened: 0, failed: 0 });
        }

        const learners = new Set<string>();
        for (const event of scoped) {
            if (event.subscriberRef) learners.add(event.subscriberRef);
            const bucket = days.get(utcDay(event.timestamp));
            if (bucket) {
                if (event.success) bucket.opened += 1;
                else bucket.failed += 1;
            }
        }

        return {
            connected: true,
            events: scoped.slice(0, limit).map((event) => ({
                classSlug: event.classSlug,
                format: event.format,
                timestamp: event.timestamp,
                success: event.success,
                learner: event.subscriberRef.slice(0, 8) || "unknown",
            })),
            uniqueLearners: learners.size,
            series: Array.from(days, ([date, counts]) => ({ date, ...counts })),
            windowDays: ACTIVITY_WINDOW_DAYS,
            matched: scoped.length,
            oldestMs: parsed.length > 0 ? Math.min(...parsed.map((event) => event.timestamp)) : null,
            capped: parsed.length >= EVENT_LOG_LIMIT,
        };
    } catch (err) {
        return {
            connected: true,
            error: err instanceof Error ? err.message : "Failed to read the material-access log",
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

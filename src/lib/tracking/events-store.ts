// src/lib/tracking/events-store.ts — SERVER-ONLY first-party event store.
//
// A tiny analytics store built on Upstash Redis' REST API (plain fetch, no SDK
// dependency). It powers two things:
//   • recordEvent()   — called by the public /api/track collector on each event
//   • readFirstParty()— read by the /tracking dashboard to show the totals
//
// Everything degrades gracefully: with no Upstash env vars set, writes no-op and
// reads report `connected: false` with a setup hint. Nothing here ever throws
// into a request path.
//
// Setup (free tier is plenty): create an Upstash Redis DB (e.g. via the Vercel
// Marketplace) and set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.

import type { FirstPartyMetrics } from "@/lib/tracking/types";

// Accept the native Upstash names OR the KV_* names Vercel's integration injects.
const URL_ENV = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOKEN_ENV = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

const KEY = "jbc:evt";
const SERIES_DAYS = 14;

export const isEventsStoreConfigured = Boolean(URL_ENV && TOKEN_ENV);

/** Keep event names to a safe, bounded key charset. */
function cleanName(name: string): string {
  return String(name)
    .slice(0, 64)
    .replace(/[^a-zA-Z0-9_.:-]/g, "_");
}

function utcDay(offsetDays = 0): string {
  const ms = Date.now() - offsetDays * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}

type Cmd = (string | number)[];

/** Run a Redis command pipeline via Upstash REST. Returns raw `result` array. */
async function pipeline(commands: Cmd[]): Promise<unknown[]> {
  if (!URL_ENV || !TOKEN_ENV || commands.length === 0) return [];
  const res = await fetch(`${URL_ENV}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN_ENV}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Upstash ${res.status}: ${await res.text().catch(() => "")}`);
  }
  const json = (await res.json()) as Array<{ result?: unknown; error?: string }>;
  return json.map((entry) => (entry?.error ? null : entry?.result));
}

function toInt(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/**
 * Record one event. Fire-and-forget: never throws, no-ops when unconfigured.
 * Increments an all-time total, a per-name total, a per-day grand total, and
 * registers the name in a set so the dashboard can enumerate event types.
 */
export async function recordEvent(name: string): Promise<void> {
  if (!isEventsStoreConfigured) return;
  const n = cleanName(name);
  const today = utcDay(0);
  try {
    await pipeline([
      ["INCR", `${KEY}:total:${n}`],
      ["INCR", `${KEY}:total:__all`],
      ["INCR", `${KEY}:day:${today}:__all`],
      ["SADD", `${KEY}:names`, n],
    ]);
  } catch {
    // Collector must never fail a request over analytics.
  }
}

/** Read all-time totals + a recent daily series for the dashboard. */
export async function readFirstParty(): Promise<FirstPartyMetrics> {
  const empty = {
    totalEvents: 0,
    pageViews: 0,
    byEvent: [] as Array<{ name: string; total: number }>,
    series: [] as Array<{ date: string; count: number }>,
  };

  if (!isEventsStoreConfigured) {
    return {
      connected: false,
      hint: "Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to collect first-party events (page views, button clicks).",
      ...empty,
    };
  }

  try {
    const nameRes = await pipeline([["SMEMBERS", `${KEY}:names`]]);
    const names = Array.isArray(nameRes[0])
      ? (nameRes[0] as string[]).map(String)
      : [];

    const days = Array.from({ length: SERIES_DAYS }, (_, i) =>
      utcDay(SERIES_DAYS - 1 - i)
    );

    // One pipeline: grand total, each name's total, each day's total.
    const reads: Cmd[] = [
      ["GET", `${KEY}:total:__all`],
      ...names.map((n): Cmd => ["GET", `${KEY}:total:${n}`]),
      ...days.map((d): Cmd => ["GET", `${KEY}:day:${d}:__all`]),
    ];
    const out = await pipeline(reads);

    const totalEvents = toInt(out[0]);
    const byEvent = names
      .map((name, i) => ({ name, total: toInt(out[1 + i]) }))
      .sort((a, b) => b.total - a.total);
    const series = days.map((date, i) => ({
      date,
      count: toInt(out[1 + names.length + i]),
    }));
    const pageViews = byEvent.find((e) => e.name === "PageView")?.total ?? 0;

    return { connected: true, totalEvents, pageViews, byEvent, series };
  } catch (err) {
    return {
      connected: true,
      error: err instanceof Error ? err.message : "Failed to read event store",
      ...empty,
    };
  }
}

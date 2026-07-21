// src/lib/rate-limit.ts — SERVER-ONLY fixed-window rate limiter.
//
// Durable across serverless instances when Upstash Redis is configured (uses
// INCR + EXPIRE NX), and falls back to a per-instance in-memory window when it
// isn't. The in-memory path still meaningfully slows a single attacker even
// without Upstash; connect Upstash for cross-instance guarantees in production.
//
// Never throws into a request path — on any backend error it fails OPEN (allows
// the request) so a Redis blip can't lock out a legitimate admin.

// Accept the native Upstash names OR the KV_* names Vercel's integration injects.
const URL_ENV = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOKEN_ENV = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const upstashConfigured = Boolean(URL_ENV && TOKEN_ENV);

export type RateResult = {
  allowed: boolean;
  remaining: number;
  /** Seconds until the current window resets. */
  retryAfterSec: number;
};

// ── In-memory fallback (per-instance) ────────────────────────────────────────
const memory = new Map<string, { count: number; resetAt: number }>();

function memoryLimit(key: string, limit: number, windowSec: number): RateResult {
  const now = Date.now();
  let entry = memory.get(key);
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + windowSec * 1000 };
  }
  entry.count += 1;
  memory.set(key, entry);

  // Opportunistic cleanup so the map can't grow without bound.
  if (memory.size > 5000) {
    for (const [k, v] of memory) {
      if (now >= v.resetAt) memory.delete(k);
    }
  }

  const retryAfterSec = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
  return {
    allowed: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    retryAfterSec,
  };
}

// ── Upstash-backed limiter ───────────────────────────────────────────────────
async function upstashLimit(key: string, limit: number, windowSec: number): Promise<RateResult> {
  const redisKey = `rl:${key}`;
  const res = await fetch(`${URL_ENV}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN_ENV}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", redisKey],
      ["EXPIRE", redisKey, String(windowSec), "NX"],
      ["TTL", redisKey],
    ]),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Upstash ${res.status}`);
  const json = (await res.json()) as Array<{ result?: unknown }>;
  const count = Number(json[0]?.result ?? 0);
  const ttl = Number(json[2]?.result ?? windowSec);
  const retryAfterSec = ttl > 0 ? ttl : windowSec;
  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    retryAfterSec,
  };
}

/**
 * Consume one token for `key`. Returns `allowed: false` once more than `limit`
 * hits arrive within `windowSec`. Fails open on backend errors.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSec: number
): Promise<RateResult> {
  if (upstashConfigured) {
    try {
      return await upstashLimit(key, limit, windowSec);
    } catch {
      // Fall back to in-memory rather than locking anyone out.
      return memoryLimit(key, limit, windowSec);
    }
  }
  return memoryLimit(key, limit, windowSec);
}

/**
 * Best-effort client IP from proxy headers.
 *
 * Prefers `x-real-ip`, which Vercel (and most reverse proxies) set to the real
 * connecting IP and overwrite on the way in. `x-forwarded-for` is only a
 * fallback because its first hop is client-suppliable — keying a rate limiter
 * off XFF[0] alone would let an attacker rotate the header to dodge the limit.
 */
export function ipFromHeaders(headers: Headers): string {
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return "unknown";
}

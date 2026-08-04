// src/lib/kv.ts — SERVER-ONLY tiny JSON cache on Upstash Redis (REST).
//
// Reuses the credentials already configured for src/lib/rate-limit.ts (both the
// native UPSTASH_* names and the KV_* names Vercel's integration injects), so
// this adds NO new dependency and NO new service.
//
// Why it matters here: Vercel runs several serverless instances even in a
// single region, so a plain in-process Map is per-instance. The manifest cache
// and the subscriber/token index both want to be shared, and the manifest's
// "last known good" copy needs to survive an instance being recycled.
//
// Every function fails SOFT — a cache outage must never break a class page.
const URL_ENV = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOKEN_ENV = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

export const isKvConfigured = Boolean(URL_ENV && TOKEN_ENV);

export type KvCommand = (string | number)[];

async function command<T>(args: KvCommand): Promise<T | null> {
    if (!isKvConfigured) return null;
    try {
        const res = await fetch(URL_ENV as string, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${TOKEN_ENV}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(args.map(String)),
            cache: "no-store",
            // KV is an optimisation, never a reason for a class page or a
            // checkout to wait indefinitely during an external outage.
            signal: AbortSignal.timeout(2_000),
        });
        if (!res.ok) {
            console.warn(`[kv] ${args[0]} failed: ${res.status}`);
            return null;
        }
        const json = (await res.json()) as { result?: T };
        return (json?.result ?? null) as T | null;
    } catch (err) {
        console.warn(`[kv] ${args[0]} errored (non-fatal):`, err);
        return null;
    }
}

/**
 * Run a small group of Redis commands together. Like the single-command
 * helpers above, this fails softly: analytics must never make course delivery
 * fail if KV is temporarily unavailable.
 */
export async function kvPipeline<T = unknown>(commands: KvCommand[]): Promise<(T | null)[] | null> {
    if (!isKvConfigured || commands.length === 0) return commands.length === 0 ? [] : null;
    try {
        const res = await fetch(`${URL_ENV as string}/pipeline`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${TOKEN_ENV}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(commands.map((args) => args.map(String))),
            cache: "no-store",
            signal: AbortSignal.timeout(2_000),
        });
        if (!res.ok) {
            console.warn(`[kv] pipeline failed: ${res.status}`);
            return null;
        }
        const json = (await res.json()) as Array<{ result?: T; error?: string }>;
        return json.map((entry) => (entry?.error ? null : (entry?.result ?? null)) as T | null);
    } catch (err) {
        console.warn("[kv] pipeline errored (non-fatal):", err);
        return null;
    }
}

/** Read and JSON-parse a key. Returns null on miss or any failure. */
export async function kvGetJson<T>(key: string): Promise<T | null> {
    const raw = await command<string>(["GET", key]);
    if (raw == null) return null;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

/** JSON-serialise and store a key. `ttlSeconds <= 0` stores without expiry. */
export async function kvSetJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    const payload = JSON.stringify(value);
    if (ttlSeconds > 0) {
        await command(["SET", key, payload, "EX", Math.floor(ttlSeconds)]);
    } else {
        await command(["SET", key, payload]);
    }
}

/** Delete a key (used when a token is re-issued). */
export async function kvDel(key: string): Promise<void> {
    await command(["DEL", key]);
}

/** Add one value to a Redis set and keep the set for the requested lifetime. */
export async function kvSetAdd(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    const added = await command<number>(["SADD", key, value]);
    if (added == null) return false;
    if (ttlSeconds > 0) {
        const expires = await command<number>(["EXPIRE", key, Math.floor(ttlSeconds)]);
        if (expires !== 1) return false;
    }
    return true;
}

/** Read every member of a Redis set. Null means KV was unavailable. */
export async function kvSetMembers(key: string): Promise<string[] | null> {
    return command<string[]>(["SMEMBERS", key]);
}

// ── Class-subscriber cache keys ──────────────────────────────────────────────
// Defined here (rather than in subscriber.ts) so lib/mailchimp.ts can drop a
// stale snapshot the instant partner status changes, without importing
// subscriber.ts and creating an import cycle.

/** Cache key for a subscriber snapshot, keyed by email (never by raw token). */
export function subscriberCacheKey(email: string): string {
    // Lower-cased so the key matches however the address was typed.
    return `jbc:sub:${email.trim().toLowerCase()}`;
}

/** Stable Google Drive metadata (size/type/duration), shared across serverless instances. */
export function driveMetaCacheKey(fileId: string): string {
    return `jbc:drive-meta:${fileId.trim()}`;
}

/** Index key mapping an access token to the email that owns it. */
export function tokenIndexKey(token: string): string {
    return `jbc:ctoken:${token.trim()}`;
}

/** Index key for a device credential. Only a SHA-256 digest is used here. */
export function deviceIndexKey(tokenDigest: string): string {
    return `jbc:device:${tokenDigest.trim()}`;
}

/** Reverse index used to revoke all of one subscriber's device credentials. */
export function subscriberDevicesKey(email: string): string {
    return `jbc:devices:${email.trim().toLowerCase()}`;
}

/**
 * Drop a subscriber's cached snapshot so the next class-page request re-reads
 * Mailchimp. Called whenever partner status or course fields change, which is
 * what makes a cancellation take effect on the very next request rather than
 * after the cache TTL.
 */
export async function invalidateSubscriberCache(email: string): Promise<void> {
    if (!email) return;
    await kvDel(subscriberCacheKey(email));
}

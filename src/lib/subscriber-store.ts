// src/lib/subscriber-store.ts — SERVER-ONLY durable subscriber record.
//
// This is the system of record for class identity and entitlements. It exists
// so a class page can decide who someone is and what they may open WITHOUT
// calling Mailchimp on every request. Mailchimp remains the mailing platform
// and still receives every one of these values (see the note on writes below),
// but it is no longer on the read path.
//
// Why this is separate from lib/kv.ts's caches:
//
//   • DURABILITY. Every other KV key in this project is a cache with a TTL and
//     a fail-soft read. These records have NO expiry and their writes are
//     verified by reading back, because losing one costs a subscriber their
//     access token.
//
//   • FAIL-SOFT IS STILL PRESERVED ON READS. `readProfile` returns null when KV
//     is unreachable, exactly as it does for a genuine miss. Callers treat both
//     the same way — fall back to Mailchimp — so an Upstash outage degrades to
//     the old behaviour instead of locking anybody out. That matters: kv.ts
//     uses a deliberately tight 2s timeout that a slow network can trip.
//
// IMPORTANT — writes are still mirrored to Mailchimp, permanently, not just
// during a migration window. The class emails build their links from the
// `*|CTOKEN|*` merge tag, and the drip and partner journeys trigger on tags.
// So Mailchimp cannot become send-only while those emails exist. What this
// store buys is a read path that is fast, rate-limit-free and survives a
// Mailchimp outage — which is the hot path, hit on every class render and
// every file download.

import { isKvConfigured, kvGetJson, kvSetJson } from "./kv.ts";

/** One subscriber's identity and entitlements. */
export type SubscriberProfile = {
    email: string;
    /** Class-access token (the CTOKEN). An empty string means revoked. */
    token: string;
    /** Drip clock start as YYYY-MM-DD, or null when never stamped. */
    courseStart: string | null;
    /** True while the monthly partnership is active. */
    partner: boolean;
    /** Enrolled in the 90-day course — the old `jbc-course-start` tag. */
    enrolled: boolean;
    /** Last write, for debugging and for choosing a winner if we ever reconcile. */
    updatedAt: number;
};

/** Durable, no TTL. Versioned so the shape can change without a stale read. */
function profileKey(email: string): string {
    return `jbc:profile:v1:${email.trim().toLowerCase()}`;
}

/**
 * Read one subscriber's durable record.
 *
 * Returns null for a genuine miss AND for a KV failure — the caller cannot tell
 * them apart and should not need to: both mean "fall back to Mailchimp".
 */
export async function readProfile(email: string): Promise<SubscriberProfile | null> {
    const clean = String(email ?? "").trim().toLowerCase();
    if (!clean || !isKvConfigured) return null;
    const profile = await kvGetJson<SubscriberProfile>(profileKey(clean));
    // Guard against a partially-written or older record.
    if (!profile || typeof profile.email !== "string") return null;
    return { ...profile, email: clean };
}

/**
 * Merge a patch into the durable record and verify it landed.
 *
 * Throws when the write cannot be confirmed. Callers that are persisting an
 * access token MUST let that throw rather than reporting success — a token the
 * subscriber believes they have but which was never stored is worse than an
 * outright failure, because it fails later and silently.
 */
export async function writeProfile(
    email: string,
    patch: Partial<Omit<SubscriberProfile, "email" | "updatedAt">>
): Promise<SubscriberProfile> {
    const clean = String(email ?? "").trim().toLowerCase();
    if (!clean) throw new Error("An email is required to write a subscriber profile");
    if (!isKvConfigured) throw new Error("KV is not configured — cannot persist the subscriber profile");

    const existing = await readProfile(clean);
    const next: SubscriberProfile = {
        email: clean,
        token: patch.token ?? existing?.token ?? "",
        courseStart: patch.courseStart !== undefined ? patch.courseStart : (existing?.courseStart ?? null),
        partner: patch.partner ?? existing?.partner ?? false,
        enrolled: patch.enrolled ?? existing?.enrolled ?? false,
        updatedAt: Date.now(),
    };

    // ttl 0 => stored without expiry. This record must outlive every cache.
    await kvSetJson(profileKey(clean), next, 0);

    const confirmed = await kvGetJson<SubscriberProfile>(profileKey(clean));
    if (!confirmed || confirmed.updatedAt !== next.updatedAt) {
        throw new Error("The subscriber profile could not be verified after writing");
    }
    return next;
}

/**
 * Seed the record from whatever Mailchimp currently holds, without clobbering a
 * record we already own. Used by the read path so existing subscribers migrate
 * silently the first time they open a class.
 */
export async function backfillProfile(
    profile: Omit<SubscriberProfile, "updatedAt">
): Promise<void> {
    if (!isKvConfigured) return;
    const existing = await readProfile(profile.email);
    if (existing) return;
    try {
        await writeProfile(profile.email, {
            token: profile.token,
            courseStart: profile.courseStart,
            partner: profile.partner,
            enrolled: profile.enrolled,
        });
    } catch (err) {
        // A failed backfill is harmless for THIS request — the Mailchimp read
        // already served it and the next visit retries. But it must not be
        // silent: if these fail persistently the migration never progresses,
        // every read keeps falling back to Mailchimp, and the only symptom is
        // scripts/count-subscriber-profiles.mjs sitting at zero with no clue
        // why. Logging is the difference between "not exercised yet" and
        // "quietly broken".
        console.warn(`[subscriber-store] backfill failed for ${profile.email}:`, err);
    }
}

// src/lib/subscriber.ts — SERVER-ONLY subscriber identity for the class system.
//
// Mailchimp is the source of truth (this project has no database — confirmed:
// no ORM/DB dependency in package.json, and the only stores are Sanity for the
// blog and Upstash KV for rate limiting/caching).
//
// Identity flow:
//   ?t=<token>  →  KV index token→email  →  Mailchimp member  →  Subscriber
//   no/bad token →  email form  →  Mailchimp member  →  issue token  →  continue
//
// Caching (Part 4): a class email sends someone to several links in a row, and
// hitting the Mailchimp API on every class-page render would not scale past a
// handful of concurrent users. Snapshots are cached for SIXTY SECONDS, keyed by
// email. Partner changes explicitly bust that key (see lib/mailchimp.ts), so a
// cancellation still lands on the very next request.
import { randomBytes } from "crypto";
import {
    getMember,
    setCourseFields,
    COURSE_START_TAG,
    COURSE_START_FIELD,
    COURSE_TOKEN_FIELD,
} from "./mailchimp.ts";
import {
    kvGetJson,
    kvSetJson,
    kvDel,
    subscriberCacheKey,
    tokenIndexKey,
    isKvConfigured,
} from "./kv.ts";
import type { Subscriber } from "./access.ts";

/** Short by design: long enough to absorb a burst of clicks, short enough that
 *  any change we failed to explicitly invalidate still self-heals in a minute. */
const SNAPSHOT_TTL_SEC = 60;
/** The token→email index is durable; the token itself lives on the contact. */
export const TOKEN_INDEX_TTL_SEC = 400 * 24 * 60 * 60;

type Snapshot = {
    email: string;
    token: string;
    partner: boolean;
    courseStart: string | null;
    hasCourseTag: boolean;
};

/** Cryptographically random, unguessable access token. */
export function generateToken(): string {
    return randomBytes(32).toString("hex");
}

/** Today as YYYY-MM-DD (UTC) — the format written to COURSESTART. */
export function todayIso(): string {
    return new Date().toISOString().slice(0, 10);
}

/**
 * Parse COURSESTART into a Date. Returns null for missing/unparseable values so
 * access.ts can fail safe to the always-free classes.
 */
export function parseCourseStart(raw: string | undefined | null): Date | null {
    const text = String(raw ?? "").trim();
    if (!text) return null;
    // Accept YYYY-MM-DD (what we write) and full ISO timestamps.
    const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(text) ? `${text}T00:00:00Z` : text);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toSubscriber(snap: Snapshot): Subscriber {
    return {
        email: snap.email,
        token: snap.token,
        partner: snap.partner,
        courseStart: parseCourseStart(snap.courseStart),
    };
}

/** Build a snapshot from a live Mailchimp read. */
async function readSnapshot(email: string): Promise<Snapshot | null> {
    const member = await getMember(email);
    if (!member) return null;
    return {
        email: member.email,
        token: member.mergeFields[COURSE_TOKEN_FIELD] ?? "",
        // PARTNER is a text merge field; treat anything but an explicit "true" as false.
        partner: String(member.mergeFields.PARTNER ?? "").trim().toLowerCase() === "true",
        courseStart: member.mergeFields[COURSE_START_FIELD] ?? null,
        hasCourseTag: member.tags.includes(COURSE_START_TAG),
    };
}

/** Cached snapshot read (60s), falling back to a live read. */
async function getSnapshot(email: string, opts: { fresh?: boolean } = {}): Promise<Snapshot | null> {
    const key = subscriberCacheKey(email);
    if (!opts.fresh && isKvConfigured) {
        const hit = await kvGetJson<Snapshot>(key);
        if (hit) return hit;
    }
    const snap = await readSnapshot(email);
    if (snap) void kvSetJson(key, snap, SNAPSHOT_TTL_SEC);
    return snap;
}

/**
 * Issue (or re-issue) an access token for a contact: persist it as CTOKEN and
 * index token→email in KV so the `?t=` lookup is O(1) and never scans Mailchimp.
 * Also stamps COURSESTART when the contact doesn't have one yet.
 */
export async function issueToken(
    email: string,
    opts: { setCourseStartIfMissing?: boolean } = {}
): Promise<string> {
    const token = generateToken();
    const existing = await readSnapshot(email);

    const courseStart =
        opts.setCourseStartIfMissing && !existing?.courseStart ? todayIso() : undefined;

    await setCourseFields({ email, token, courseStart });
    await kvSetJson(tokenIndexKey(token), email.trim().toLowerCase(), TOKEN_INDEX_TTL_SEC);
    const indexedEmail = await kvGetJson<string>(tokenIndexKey(token));
    if (indexedEmail !== email.trim().toLowerCase()) {
        throw new Error("CTOKEN was written to Mailchimp but its KV index could not be verified");
    }
    // Remove the former reverse index too. The Mailchimp CTOKEN comparison
    // already rejects it, but deleting it makes one-person rotation a complete
    // revocation rather than leaving a stale email mapping for 400 days.
    if (existing?.token && existing.token !== token) {
        await kvDel(tokenIndexKey(existing.token));
    }
    return token;
}

/**
 * Revoke one subscriber's token without touching their course enrolment or any
 * other contact. They can later be issued a new token through the normal flow.
 */
export async function revokeToken(email: string): Promise<boolean> {
    const clean = String(email ?? "").trim().toLowerCase();
    if (!clean) return false;
    const existing = await readSnapshot(clean);
    if (!existing) return false;

    await setCourseFields({ email: clean, token: "" });
    if (existing.token) await kvDel(tokenIndexKey(existing.token));
    return true;
}

/**
 * Resolve a subscriber from the `?t=` token.
 *
 * The KV index is the fast path. If KV has been evicted (or was never written,
 * e.g. a token issued before this deploy) the token can't be reversed to an
 * email and we return null — the page then offers the email fallback form,
 * which re-issues a working token. That is the designed degradation, not a bug.
 */
export async function resolveByToken(token: string): Promise<Subscriber | null> {
    const clean = String(token ?? "").trim();
    // CTOKENs are exactly 32 random bytes encoded as hexadecimal. Keeping this
    // strict also guarantees an email address can never accidentally enter the
    // token lookup path.
    if (!/^[a-f0-9]{64}$/i.test(clean)) return null;

    const email = await kvGetJson<string>(tokenIndexKey(clean));
    if (!email) return null;

    const snap = await getSnapshot(email);
    if (!snap) return null;

    // A token is never sufficient on its own: removing the class tag must
    // revoke access immediately (or within the short snapshot-cache window).
    if (!snap.hasCourseTag) return null;

    // Defence in depth: the token in the index must still match the contact's
    // CTOKEN, so a re-issued token immediately invalidates the previous one.
    if (snap.token !== clean) {
        console.warn(`[subscriber] stale token presented for ${email} — CTOKEN has been re-issued`);
        return null;
    }
    return toSubscriber(snap);
}

/**
 * Resolve a subscriber by email (the fallback form), issuing a token if they
 * don't have one yet. Returns null when the address isn't on the audience.
 */
export async function resolveByEmail(
    email: string
): Promise<{ subscriber: Subscriber; token: string } | null> {
    const clean = String(email ?? "").trim().toLowerCase();
    if (!clean || !/^\S+@\S+\.\S+$/.test(clean)) return null;

    const snap = await getSnapshot(clean, { fresh: true });
    // Being somewhere in the audience is not class enrolment. The journey's
    // jbc-course-start tag is the source of truth for class access.
    if (!snap || !snap.hasCourseTag) return null;

    // Lazily mint a token for anyone tagged before this system existed, so no
    // manual backfill is needed for the token itself.
    if (!snap.token) {
        const token = await issueToken(clean, { setCourseStartIfMissing: false });
        const refreshed = await getSnapshot(clean, { fresh: true });
        return refreshed
            ? { subscriber: toSubscriber(refreshed), token }
            : { subscriber: toSubscriber({ ...snap, token }), token };
    }

    // Repair a missing KV index entry (eviction, or a token issued pre-deploy).
    await kvSetJson(tokenIndexKey(snap.token), clean, TOKEN_INDEX_TTL_SEC);
    const indexedEmail = await kvGetJson<string>(tokenIndexKey(snap.token));
    if (indexedEmail !== clean) {
        throw new Error("The subscriber token index could not be repaired");
    }
    return { subscriber: toSubscriber(snap), token: snap.token };
}

/** Bypass the snapshot cache — used by the verification script. */
export async function resolveByEmailFresh(email: string): Promise<Subscriber | null> {
    const snap = await getSnapshot(String(email).trim().toLowerCase(), { fresh: true });
    return snap?.hasCourseTag ? toSubscriber(snap) : null;
}

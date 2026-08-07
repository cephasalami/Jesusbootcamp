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
import { createHash, randomBytes } from "crypto";
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
    kvSetAdd,
    kvSetRemove,
    kvSetMembers,
    subscriberCacheKey,
    tokenIndexKey,
    deviceIndexKey,
    subscriberDevicesKey,
    isKvConfigured,
} from "./kv.ts";
import { readProfile, writeProfile, backfillProfile } from "./subscriber-store.ts";
import type { Subscriber } from "./access.ts";

/** Short by design: long enough to absorb a burst of clicks, short enough that
 *  any change we failed to explicitly invalidate still self-heals in a minute. */
const SNAPSHOT_TTL_SEC = 60;
/** The token→email index is durable; the token itself lives on the contact. */
export const TOKEN_INDEX_TTL_SEC = 400 * 24 * 60 * 60;
/** Device recognition lasts as long as the durable CTOKEN index. */
export const DEVICE_TOKEN_TTL_SEC = TOKEN_INDEX_TTL_SEC;
/** A subscriber can remain recognised on a phone, tablet, and computer. */
export const MAX_REMEMBERED_DEVICES = 3;
export const DEVICE_COOKIE_NAME = "__Host-jbc_device";
export const DEVICE_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: DEVICE_TOKEN_TTL_SEC,
    priority: "high" as const,
};

type Snapshot = {
    email: string;
    token: string;
    partner: boolean;
    courseStart: string | null;
    hasCourseTag: boolean;
};

type DeviceIndex = {
    email: string;
    /** Binds this device to the exact CTOKEN generation that created it. */
    ctokenDigest: string;
    /** Lets us remove the oldest remembered device when the cap is reached. */
    issuedAt: number;
};

// Keep issue order deterministic when two device cookies are minted in the
// same millisecond (useful both for the cap and for the test suite).
let lastDeviceIssuedAt = 0;
function nextDeviceIssuedAt(): number {
    lastDeviceIssuedAt = Math.max(Date.now(), lastDeviceIssuedAt + 1);
    return lastDeviceIssuedAt;
}

/** Cryptographically random, unguessable access token. */
export function generateToken(): string {
    return randomBytes(32).toString("hex");
}

function digestToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
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

/** Build a snapshot from a live Mailchimp read. The fallback, not the default. */
async function readSnapshotFromMailchimp(email: string): Promise<Snapshot | null> {
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

/**
 * Build a snapshot, preferring our own durable store.
 *
 * KV is the system of record, so a class render normally costs zero Mailchimp
 * calls. Mailchimp is consulted only when we have no record yet — an existing
 * subscriber from before this store existed, or a KV outage — and the result is
 * backfilled so the next request is served locally.
 *
 * Ordering matters: a KV failure and a genuine miss both return null from
 * readProfile, and both correctly fall through to Mailchimp. That is what stops
 * an Upstash blip from locking anybody out of their course.
 */
async function readSnapshot(email: string): Promise<Snapshot | null> {
    const profile = await readProfile(email);
    if (profile) {
        return {
            email: profile.email,
            token: profile.token,
            partner: profile.partner,
            courseStart: profile.courseStart,
            hasCourseTag: profile.enrolled,
        };
    }

    const fromMailchimp = await readSnapshotFromMailchimp(email);
    if (!fromMailchimp) return null;

    await backfillProfile({
        email: fromMailchimp.email,
        token: fromMailchimp.token,
        courseStart: fromMailchimp.courseStart,
        partner: fromMailchimp.partner,
        enrolled: fromMailchimp.hasCourseTag,
    });
    return fromMailchimp;
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
 * Remove every remembered device for one subscriber. A failed KV deletion does
 * not weaken revocation: device resolution also verifies the live CTOKEN
 * generation, so a blanked or rotated CTOKEN rejects any stale device index.
 */
export async function revokeDeviceTokens(email: string): Promise<boolean> {
    const clean = String(email ?? "").trim().toLowerCase();
    if (!clean) return false;

    const reverseKey = subscriberDevicesKey(clean);
    const tokenDigests = await kvSetMembers(reverseKey);
    if (tokenDigests == null) return false;

    await Promise.all(tokenDigests.map((digest) => kvDel(deviceIndexKey(digest))));
    await kvDel(reverseKey);
    return true;
}

/**
 * Issue a separate random device credential. The browser receives the raw
 * value; Redis only receives its digest. The stored CTOKEN digest makes a
 * subscriber-level revoke or rotation invalidate every device immediately.
 */
export async function issueDeviceToken(email: string): Promise<string> {
    const clean = String(email ?? "").trim().toLowerCase();
    if (!clean) throw new Error("A subscriber email is required for device recognition");

    const snap = await getSnapshot(clean, { fresh: true });
    if (!snap?.hasCourseTag || !/^[a-f0-9]{64}$/i.test(snap.token)) {
        throw new Error("Only an enrolled subscriber with a current CTOKEN can be remembered");
    }

    const deviceToken = generateToken();
    const tokenDigest = digestToken(deviceToken);
    const index: DeviceIndex = {
        email: clean,
        ctokenDigest: digestToken(snap.token),
        issuedAt: nextDeviceIssuedAt(),
    };
    const indexKey = deviceIndexKey(tokenDigest);
    const reverseKey = subscriberDevicesKey(clean);

    const existingDigests = await kvSetMembers(reverseKey);
    if (existingDigests == null) {
        throw new Error("Remembered devices could not be read from KV");
    }
    const existingIndexes = await Promise.all(
        existingDigests.map(async (digest) => ({
            digest,
            index: await kvGetJson<DeviceIndex>(deviceIndexKey(digest)),
        }))
    );
    const staleDigests = existingIndexes.filter((entry) => !entry.index).map((entry) => entry.digest);
    const liveDevices = existingIndexes
        .filter((entry): entry is { digest: string; index: DeviceIndex } => entry.index != null)
        .sort(
            (a, b) =>
                (Number.isFinite(a.index.issuedAt) ? a.index.issuedAt : 0) -
                    (Number.isFinite(b.index.issuedAt) ? b.index.issuedAt : 0) ||
                a.digest.localeCompare(b.digest)
        );
    // We add the new device below, so only the newest two existing devices may
    // remain. Old records from before `issuedAt` existed sort first and are
    // therefore safely cleaned up on the next device sign-in.
    const digestsToEvict = liveDevices
        .slice(0, Math.max(0, liveDevices.length - (MAX_REMEMBERED_DEVICES - 1)))
        .map((entry) => entry.digest);

    const removals = [...staleDigests, ...digestsToEvict];
    if (removals.length) {
        const removed = await Promise.all(
            removals.map(async (digest) => {
                await kvDel(deviceIndexKey(digest));
                return kvSetRemove(reverseKey, digest);
            })
        );
        if (removed.some((success) => !success)) {
            throw new Error("An old remembered device could not be revoked");
        }
    }

    await kvSetJson(indexKey, index, DEVICE_TOKEN_TTL_SEC);
    const reverseAdded = await kvSetAdd(reverseKey, tokenDigest, DEVICE_TOKEN_TTL_SEC);
    const [storedIndex, storedDigests] = await Promise.all([
        kvGetJson<DeviceIndex>(indexKey),
        kvSetMembers(reverseKey),
    ]);

    if (
        !reverseAdded ||
        storedIndex?.email !== clean ||
        storedIndex.ctokenDigest !== index.ctokenDigest ||
        !storedDigests?.includes(tokenDigest)
    ) {
        await kvDel(indexKey);
        throw new Error("The device identity could not be verified in KV");
    }

    return deviceToken;
}

/** Resolve a browser device, always checking fresh Mailchimp revocation state. */
export async function resolveByDeviceToken(deviceToken: string): Promise<Subscriber | null> {
    const clean = String(deviceToken ?? "").trim();
    if (!/^[a-f0-9]{64}$/i.test(clean)) return null;

    const index = await kvGetJson<DeviceIndex>(deviceIndexKey(digestToken(clean)));
    if (!index?.email || !index.ctokenDigest) return null;

    // Intentionally bypass the 60-second snapshot cache. A device credential is
    // a fallback bearer credential and must stop on the first request after a
    // Mailchimp enrolment revoke or CTOKEN rotation.
    const snap = await getSnapshot(index.email, { fresh: true });
    if (!snap?.hasCourseTag || !snap.token) return null;
    if (digestToken(snap.token) !== index.ctokenDigest) return null;

    return toSubscriber(snap);
}

/** URL CTOKEN remains authoritative; the device is only the fallback. */
export async function resolveSubscriberIdentity(
    urlToken: string,
    deviceToken: string
): Promise<{ subscriber: Subscriber; source: "url" | "device" } | null> {
    const urlSubscriber = await resolveByToken(urlToken);
    if (urlSubscriber) return { subscriber: urlSubscriber, source: "url" };

    const deviceSubscriber = await resolveByDeviceToken(deviceToken);
    return deviceSubscriber ? { subscriber: deviceSubscriber, source: "device" } : null;
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

    // 1) Our own store first, and verified — this is the system of record. If it
    //    cannot be written we must not hand back a token that nothing remembers.
    await writeProfile(email, {
        token,
        ...(courseStart ? { courseStart } : {}),
    });

    // 2) Mirror to Mailchimp. Still required, and not merely for compatibility:
    //    every class email builds its link from the *|CTOKEN|* merge tag, so a
    //    token that never reaches Mailchimp produces broken links in the drip.
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
    // Rotation is an individual revoke. Device indexes are deleted eagerly;
    // their CTOKEN-generation binding is the fail-safe if KV deletion fails.
    await revokeDeviceTokens(email);
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

    // Clear our record first. Revocation must take effect in the store the
    // access checks actually read, even if the Mailchimp write then fails.
    await writeProfile(clean, { token: "" });
    await setCourseFields({ email: clean, token: "" });
    if (existing.token) await kvDel(tokenIndexKey(existing.token));
    await revokeDeviceTokens(clean);
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

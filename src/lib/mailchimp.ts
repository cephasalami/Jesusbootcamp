// src/lib/mailchimp.ts — SERVER-ONLY Mailchimp helpers.
// Reuses the same direct-fetch + `apikey` auth pattern as
// src/app/api/subscribe/route.ts. Part 5 (fulfillment): we only apply purchase
// TAGS here; a Mailchimp automation keyed on those tags sends the actual
// delivery email with the download link.
import { createHash } from "crypto";
import { invalidateSubscriberCache } from "./kv.ts";

const API_KEY = process.env.MAILCHIMP_API_KEY;
const API_SERVER = process.env.MAILCHIMP_API_SERVER;
const AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID;

export const isMailchimpConfigured = Boolean(API_KEY && API_SERVER && AUDIENCE_ID);

/** Tag applied to everyone who opts in for the free Handbook (segments leads). */
export const SUBSCRIBER_TAG = "handbook-subscriber";

/** Trigger tag for the 90-day class sequence — must match the Mailchimp journey. */
export const COURSE_START_TAG = "jbc-course-start";

/** Mailchimp identifies members by the MD5 of the lower-cased email. */
function subscriberHash(email: string): string {
    return createHash("md5").update(email.trim().toLowerCase()).digest("hex");
}

/** Env guard + the per-member API base + auth headers, shared by all helpers. */
function memberEndpoint(email: string): { base: string; headers: Record<string, string> } {
    if (!API_KEY || !API_SERVER || !AUDIENCE_ID) {
        throw new Error("Mailchimp environment variables are missing");
    }
    if (!email) throw new Error("email is required");
    return {
        base: `https://${API_SERVER}.api.mailchimp.com/3.0/lists/${AUDIENCE_ID}/members/${subscriberHash(email)}`,
        headers: { Authorization: `apikey ${API_KEY}`, "Content-Type": "application/json" },
    };
}

function splitName(name?: string): { FNAME?: string; LNAME?: string } {
    if (!name) return {};
    const parts = name.trim().split(/\s+/);
    return { FNAME: parts[0], LNAME: parts.slice(1).join(" ") || undefined };
}

/** Apply purchase tags to a buyer (adds them to the audience if new). */
export function tagPurchase(opts: {
    email: string;
    name?: string;
    tags: string[];
}): Promise<void> {
    return upsertAndTag(opts);
}

/**
 * Add a free-Handbook subscriber to the audience and tag them
 * `handbook-subscriber` so leads can be segmented from buyers.
 */
export function subscribeToHandbook(opts: {
    email: string;
    name?: string;
}): Promise<void> {
    return upsertAndTag({ email: opts.email, name: opts.name, tags: [SUBSCRIBER_TAG] });
}

/**
 * Add a contact from the /join page and apply `jbc-course-start` — the trigger
 * tag for the 90-day Jesus Boot Camp class sequence.
 */
export function subscribeToCourse(opts: {
    email: string;
    name?: string;
}): Promise<void> {
    return upsertAndTag({ email: opts.email, name: opts.name, tags: [COURSE_START_TAG] });
}

/**
 * Ensure the contact is on the audience (subscribed if new) and apply the given
 * tags. Idempotent — safe to call more than once (e.g. a retried webhook).
 * Throws on Mailchimp failure so the caller can log / retry.
 */
async function upsertAndTag(opts: {
    email: string;
    name?: string;
    tags: string[];
}): Promise<void> {
    const { email, name, tags } = opts;

    if (!API_KEY || !API_SERVER || !AUDIENCE_ID) {
        throw new Error("Mailchimp environment variables are missing");
    }
    if (!email) throw new Error("tagPurchase: email is required");
    if (!tags.length) return;

    const base = `https://${API_SERVER}.api.mailchimp.com/3.0/lists/${AUDIENCE_ID}/members/${subscriberHash(
        email
    )}`;
    const headers = {
        Authorization: `apikey ${API_KEY}`,
        "Content-Type": "application/json",
    };

    // 1) Upsert the member. `status_if_new` only applies to brand-new members,
    //    so an existing subscriber's status is never downgraded.
    const merge_fields = splitName(name);
    const putRes = await fetch(base, {
        method: "PUT",
        headers,
        body: JSON.stringify({
            email_address: email,
            status_if_new: "subscribed",
            ...(merge_fields.FNAME ? { merge_fields } : {}),
        }),
    });
    if (putRes.status >= 400) {
        const detail = await putRes.text();
        throw new Error(`Mailchimp upsert failed (${putRes.status}): ${detail}`);
    }

    // 2) Apply the purchase tags — this is what the delivery automation fires on.
    const tagRes = await fetch(`${base}/tags`, {
        method: "POST",
        headers,
        body: JSON.stringify({
            tags: tags.map((name) => ({ name, status: "active" })),
        }),
    });
    if (tagRes.status >= 400) {
        const detail = await tagRes.text();
        throw new Error(`Mailchimp tagging failed (${tagRes.status}): ${detail}`);
    }
}

// ── Partnership (recurring subscription) ─────────────────────────────────────
// `partner-active` is the ACCESS SOURCE OF TRUTH: an automation keyed on it grants
// the extra material. So tag writes here THROW on failure (the webhook returns 500
// → Stripe retries). Merge-field writes are best-effort: the audience may not have
// PARTNER/PTIER/STRIPEID fields yet, and a missing merge field must never block the
// tag that actually gates access.

/**
 * Set (or update) a member's merge fields. Best-effort: never throws — a merge
 * field that doesn't exist in the audience yet returns 400 and is logged, not
 * fatal. Tags remain the authoritative signal.
 */
async function setMergeFieldsBestEffort(email: string, merge_fields: Record<string, string>): Promise<void> {
    try {
        const { base, headers } = memberEndpoint(email);
        const res = await fetch(base, {
            method: "PATCH",
            headers,
            body: JSON.stringify({ merge_fields }),
        });
        if (res.status >= 400) {
            const detail = await res.text();
            console.warn(`[mailchimp] merge-field update skipped (${res.status}): ${detail}`);
        }
    } catch (err) {
        console.warn(`[mailchimp] merge-field update errored (non-fatal):`, err);
    }
}

/** Add/remove tags in one call. `add` are set active, `remove` set inactive. */
async function updateTags(email: string, add: string[], remove: string[]): Promise<void> {
    if (!add.length && !remove.length) return;
    const { base, headers } = memberEndpoint(email);
    const tags = [
        ...add.map((name) => ({ name, status: "active" as const })),
        ...remove.map((name) => ({ name, status: "inactive" as const })),
    ];
    const res = await fetch(`${base}/tags`, { method: "POST", headers, body: JSON.stringify({ tags }) });
    if (res.status >= 400) {
        const detail = await res.text();
        throw new Error(`Mailchimp tag update failed (${res.status}): ${detail}`);
    }
}

/**
 * Mark a member as an ACTIVE partner: upsert them (subscribed if new), apply
 * `partner-active` + the current tier tag, clear any stale tier tags (handles a
 * tier change), and record PARTNER/PTIER/STRIPEID merge fields (best-effort).
 */
export async function activatePartner(opts: {
    email: string;
    name?: string;
    /** "25" | "50" | "100" | "custom" */
    tier: string;
    /** The ACTUAL monthly amount in whole dollars, for the PTIER merge field.
     *  Falls back to `tier` when absent. */
    amount?: string;
    stripeCustomerId?: string;
}): Promise<void> {
    const { email, name, tier, amount, stripeCustomerId } = opts;
    const { base, headers } = memberEndpoint(email);

    // Upsert the member first so tags/merge-fields have a target.
    const merge_fields = splitName(name);
    const putRes = await fetch(base, {
        method: "PUT",
        headers,
        body: JSON.stringify({
            email_address: email,
            status_if_new: "subscribed",
            ...(merge_fields.FNAME ? { merge_fields } : {}),
        }),
    });
    if (putRes.status >= 400) {
        const detail = await putRes.text();
        throw new Error(`Mailchimp upsert failed (${putRes.status}): ${detail}`);
    }

    const activeTierTag = tier === "custom" ? "partner-custom" : `partner-${tier}`;
    const allTierTags = ["partner-25", "partner-50", "partner-100", "partner-custom"];
    const staleTierTags = allTierTags.filter((t) => t !== activeTierTag);
    await updateTags(email, ["partner-active", activeTierTag], staleTierTags);

    await setMergeFieldsBestEffort(email, {
        PARTNER: "true",
        // Record the ACTUAL monthly gift (dollars), not a preset fallback.
        PTIER: amount ?? tier,
        ...(stripeCustomerId ? { STRIPEID: stripeCustomerId } : {}),
    });
    // Drop the cached class-page snapshot so a new partner's formats unlock on
    // their very next request. (Mirrors deactivatePartner — Part 6.)
    await invalidateSubscriberCache(email);
}

/**
 * Revoke partner status: remove `partner-active` + every tier tag and set
 * PARTNER=false. The member stays subscribed to the audience — we only strip the
 * partner signal so the access automation can gate them out.
 */
export async function deactivatePartner(opts: { email: string }): Promise<void> {
    const { email } = opts;
    await updateTags(email, [], [
        "partner-active",
        "partner-25",
        "partner-50",
        "partner-100",
        "partner-custom",
    ]);
    await setMergeFieldsBestEffort(email, { PARTNER: "false", PTIER: "" });
    // Drop the cached class-page snapshot so the revoke lands on the subscriber's
    // VERY NEXT request rather than after the cache TTL. (Part 6.)
    await invalidateSubscriberCache(email);
}

// ── Class delivery system ────────────────────────────────────────────────────
// Merge fields used by /class/[slug]:
//   PARTNER   "true" | "false"  — the live partner gate (already in use)
//   CTOKEN    per-subscriber access token for the ?t= URL contract
//   CSTART    YYYY-MM-DD, the drip clock's origin
//
// ⚠️ Mailchimp SILENTLY TRUNCATES merge-field tags to 10 characters. The
// obvious name `COURSESTART` (11 chars) is stored as `COURSESTAR`, so writes to
// `COURSESTART` are discarded and reads come back undefined — which would fail
// every subscriber safe to classes 1-4a forever, with no visible error. Hence
// the short tag. Keep any new tag <= 10 chars.
export const COURSE_START_FIELD = "CSTART";
export const COURSE_TOKEN_FIELD = "CTOKEN";
//
// NOTE: Mailchimp exposes no per-contact "when was this tag applied" timestamp,
// and `timestamp_opt` is the AUDIENCE join date — for the 1,361 contacts bulk
// imported in 2021 that is years before their course start, which would hand
// them the entire 90-class archive at once. COURSESTART is therefore the only
// safe source of the drip clock, and its absence must fail SAFE (see access.ts).

/** The subset of a Mailchimp member the class system needs. */
export type MailchimpMember = {
    email: string;
    status: string;
    tags: string[];
    mergeFields: Record<string, string>;
};

/**
 * Read a member by email. Returns null when they aren't on the audience (404),
 * which the caller treats as "unknown subscriber".
 */
export async function getMember(email: string): Promise<MailchimpMember | null> {
    const { base, headers } = memberEndpoint(email);
    const res = await fetch(
        `${base}?fields=email_address,status,tags,merge_fields`,
        { headers, cache: "no-store" }
    );
    if (res.status === 404) return null;
    if (res.status >= 400) {
        const detail = await res.text();
        throw new Error(`Mailchimp member read failed (${res.status}): ${detail}`);
    }
    const json = (await res.json()) as {
        email_address: string;
        status: string;
        tags?: Array<{ name: string }>;
        merge_fields?: Record<string, unknown>;
    };
    const mergeFields: Record<string, string> = {};
    for (const [k, v] of Object.entries(json.merge_fields ?? {})) {
        mergeFields[k] = v == null ? "" : String(v);
    }
    return {
        email: json.email_address,
        status: json.status,
        tags: (json.tags ?? []).map((t) => t.name),
        mergeFields,
    };
}

/**
 * Persist the class-access token (and optionally the course start date) onto the
 * contact. Best-effort on the merge-field write itself, but we surface failure
 * to the caller so a token that never persisted isn't treated as durable.
 */
export async function setCourseFields(opts: {
    email: string;
    token?: string;
    courseStart?: string;
}): Promise<void> {
    const fields: Record<string, string> = {};
    // An explicit empty string revokes this contact's token. `undefined` means
    // leave the merge field unchanged.
    if (opts.token !== undefined) fields[COURSE_TOKEN_FIELD] = opts.token;
    if (opts.courseStart) fields[COURSE_START_FIELD] = opts.courseStart;
    if (!Object.keys(fields).length) return;

    const { base, headers } = memberEndpoint(opts.email);
    const res = await fetch(base, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ merge_fields: fields }),
    });
    if (res.status >= 400) {
        const detail = await res.text();
        // Loud: a missing CTOKEN/COURSESTART merge field in the audience breaks
        // the whole class flow, so this must never be silently swallowed.
        console.error(
            `[mailchimp] setCourseFields FAILED for ${opts.email} (${res.status}): ${detail}`
        );
        throw new Error(`Mailchimp merge-field write failed (${res.status})`);
    }
    await invalidateSubscriberCache(opts.email);
}

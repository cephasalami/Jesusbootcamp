// src/lib/mailchimp.ts — SERVER-ONLY Mailchimp helpers.
// Reuses the same direct-fetch + `apikey` auth pattern as
// src/app/api/subscribe/route.ts. Part 5 (fulfillment): we only apply purchase
// TAGS here; a Mailchimp automation keyed on those tags sends the actual
// delivery email with the download link.
import { createHash } from "crypto";

const API_KEY = process.env.MAILCHIMP_API_KEY;
const API_SERVER = process.env.MAILCHIMP_API_SERVER;
const AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID;

/** Tag applied to everyone who opts in for the free Handbook (segments leads). */
export const SUBSCRIBER_TAG = "handbook-subscriber";

/** Mailchimp identifies members by the MD5 of the lower-cased email. */
function subscriberHash(email: string): string {
    return createHash("md5").update(email.trim().toLowerCase()).digest("hex");
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

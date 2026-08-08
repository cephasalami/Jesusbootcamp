// A completed payment should confirm a contact who is merely `pending` — but it
// must NEVER resurrect someone who unsubscribed or whose address was cleaned.
//
// That distinction is the whole point of this file. Getting it wrong in the
// permissive direction re-subscribes people against their wishes, which is both
// a compliance breach and a direct source of the spam complaints this domain is
// already suffering from.
import { createHash } from "node:crypto";
import { after, before, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";

process.env.MAILCHIMP_API_KEY = "test-key";
process.env.MAILCHIMP_API_SERVER = "test";
process.env.MAILCHIMP_AUDIENCE_ID = "test-audience";
process.env.KV_REST_API_URL = "https://kv.test";
process.env.KV_REST_API_TOKEN = "test-token";

const originalFetch = globalThis.fetch;
const memberHash = (email: string) => createHash("md5").update(email.trim().toLowerCase()).digest("hex");

/** email -> status currently held by the fake audience. */
const members = new Map<string, string>();
/** Every PUT body we saw, so a test can assert what was actually sent. */
let puts: Array<{ email: string; body: Record<string, unknown> }> = [];
/** Tag writes seen — proves fulfilment still happened. */
let tagWrites: string[] = [];
/** Emails Mailchimp will refuse to re-subscribe. */
const compliance = new Set<string>();

function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

before(() => {
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        // KV: accept and ignore. This suite is only about Mailchimp status.
        if (url.startsWith("https://kv.test")) return json({ result: null });

        if (url.includes("/members/")) {
            // Strip both the query string and any sub-resource (…/tags) so the
            // hash resolves for every endpoint, not just the bare member URL.
            const hash = url.split("/members/")[1].split("?")[0].split("/")[0];
            const email = [...members.keys()].find((e) => memberHash(e) === hash);

            // Status lookup performed before deciding whether to upgrade.
            if ((init?.method ?? "GET") === "GET") {
                if (!email) return json({ title: "Resource Not Found" }, 404);
                return json({ status: members.get(email) });
            }

            if (init?.method === "PUT") {
                const body = JSON.parse(String(init.body ?? "{}")) as Record<string, unknown>;
                const address = String(body.email_address ?? "");
                puts.push({ email: address, body });
                const existing = members.get(address);
                if (existing === undefined) members.set(address, String(body.status_if_new ?? "subscribed"));
                else if (typeof body.status === "string") members.set(address, body.status);
                return json({ id: "x", email_address: address });
            }

            if (init?.method === "POST") {
                tagWrites.push(email ?? "unknown");
                return json({}); // tag write
            }

            if (init?.method === "PATCH") {
                const body = JSON.parse(String(init.body ?? "{}")) as { status?: string };
                if (!email || !body.status) return json({});
                // Mailchimp refuses to re-subscribe a contact in a compliance
                // state (unsubscribed / spam complaint / hard bounce).
                if (compliance.has(email)) {
                    return json(
                        {
                            title: "Member In Compliance State",
                            detail: `${email} is in a compliance state and cannot be subscribed.`,
                        },
                        400
                    );
                }
                members.set(email, body.status);
                return json({ status: body.status });
            }
        }
        return json({}, 404);
    }) as typeof fetch;
});

after(() => {
    globalThis.fetch = originalFetch;
});

beforeEach(() => {
    members.clear();
    compliance.clear();
    puts = [];
    tagWrites = [];
});

const { tagPurchase } = await import("../src/lib/mailchimp.ts");

describe("a payment confirms a pending contact", () => {
    test("upgrades a pending buyer to subscribed", async () => {
        members.set("pending@example.com", "pending");
        await tagPurchase({ email: "pending@example.com", tags: ["purchased-power-for-hour"] });

        assert.equal(members.get("pending@example.com"), "subscribed");
        // The upsert itself must stay status-free: sending a status inline is
        // what turns a compliance-state 400 into a thrown, fulfilment-breaking
        // error. Confirmation belongs in the separate best-effort PATCH.
        assert.ok(
            puts.every((put) => put.body.status === undefined),
            "the upsert must never carry a status"
        );
    });

    test("NEVER resurrects someone who unsubscribed", async () => {
        members.set("optedout@example.com", "unsubscribed");
        await tagPurchase({ email: "optedout@example.com", tags: ["purchased-power-for-hour"] });

        assert.equal(members.get("optedout@example.com"), "unsubscribed");
        assert.equal(puts.at(-1)?.body.status, undefined, "must not send a status for an unsubscribed contact");
    });

    test("NEVER re-mails a cleaned (hard-bounced) address", async () => {
        members.set("bounced@example.com", "cleaned");
        await tagPurchase({ email: "bounced@example.com", tags: ["purchased-power-for-hour"] });

        assert.equal(members.get("bounced@example.com"), "cleaned");
        assert.equal(puts.at(-1)?.body.status, undefined);
    });

    test("leaves an already-subscribed buyer untouched", async () => {
        members.set("good@example.com", "subscribed");
        await tagPurchase({ email: "good@example.com", tags: ["purchased-power-for-hour"] });

        assert.equal(members.get("good@example.com"), "subscribed");
        assert.equal(puts.at(-1)?.body.status, undefined);
    });

    test("a compliance-state buyer is still tagged and never throws", async () => {
        members.set("blocked@example.com", "pending");
        compliance.add("blocked@example.com");

        await assert.doesNotReject(
            tagPurchase({ email: "blocked@example.com", tags: ["purchased-power-for-hour"] }),
            "a contact Mailchimp refuses to confirm must not break fulfilment"
        );

        assert.ok(tagWrites.includes("blocked@example.com"), "the purchase tag must still be applied");
        assert.equal(members.get("blocked@example.com"), "pending", "status stays as Mailchimp left it");
    });

    test("a brand-new buyer is created subscribed, not pending", async () => {
        await tagPurchase({ email: "fresh@example.com", tags: ["purchased-power-for-hour"] });

        assert.equal(members.get("fresh@example.com"), "subscribed");
        assert.equal(puts.at(-1)?.body.status_if_new, "subscribed");
    });
});

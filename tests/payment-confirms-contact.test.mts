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

function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

before(() => {
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        // KV: accept and ignore. This suite is only about Mailchimp status.
        if (url.startsWith("https://kv.test")) return json({ result: null });

        if (url.includes("/members/")) {
            const hash = url.split("/members/")[1].split("?")[0];
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

            if (init?.method === "POST") return json({}); // tag write
            if (init?.method === "PATCH") return json({});
        }
        return json({}, 404);
    }) as typeof fetch;
});

after(() => {
    globalThis.fetch = originalFetch;
});

beforeEach(() => {
    members.clear();
    puts = [];
});

const { tagPurchase } = await import("../src/lib/mailchimp.ts");

describe("a payment confirms a pending contact", () => {
    test("upgrades a pending buyer to subscribed", async () => {
        members.set("pending@example.com", "pending");
        await tagPurchase({ email: "pending@example.com", tags: ["purchased-power-for-hour"] });

        assert.equal(members.get("pending@example.com"), "subscribed");
        assert.equal(puts.at(-1)?.body.status, "subscribed");
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

    test("a brand-new buyer is created subscribed, not pending", async () => {
        await tagPurchase({ email: "fresh@example.com", tags: ["purchased-power-for-hour"] });

        assert.equal(members.get("fresh@example.com"), "subscribed");
        assert.equal(puts.at(-1)?.body.status_if_new, "subscribed");
    });
});

import { createHash } from "node:crypto";
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";

const originalFetch = globalThis.fetch;
const memberByEmail = new Map<string, { tags: string[]; token: string }>();
const kv = new Map<string, string>();

process.env.MAILCHIMP_API_KEY = "test-key";
process.env.MAILCHIMP_API_SERVER = "test";
process.env.MAILCHIMP_AUDIENCE_ID = "test-audience";
process.env.KV_REST_API_URL = "https://kv.test";
process.env.KV_REST_API_TOKEN = "test-token";

const memberHash = (email: string) =>
    createHash("md5").update(email.trim().toLowerCase()).digest("hex");

function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}

before(() => {
    globalThis.fetch = async (input, init) => {
        const url = String(input);
        if (url === "https://kv.test") {
            const args = JSON.parse(String(init?.body ?? "[]")) as string[];
            const [command, key, value] = args;
            if (command === "GET") return json({ result: kv.get(key) ?? null });
            if (command === "SET") {
                kv.set(key, value);
                return json({ result: "OK" });
            }
            if (command === "DEL") {
                kv.delete(key);
                return json({ result: 1 });
            }
        }

        const hash = url.match(/\/members\/([a-f0-9]{32})/i)?.[1];
        const member = [...memberByEmail.entries()].find(([email]) => memberHash(email) === hash);
        if (!member) return json({ detail: "Not found" }, 404);
        const [email, data] = member;
        return json({
            email_address: email,
            status: "subscribed",
            tags: data.tags.map((name) => ({ name })),
            merge_fields: { CTOKEN: data.token, CSTART: "2026-07-01", PARTNER: "false" },
        });
    };
});

after(() => {
    globalThis.fetch = originalFetch;
});

const { resolveClassLink } = await import("../src/lib/subscriber.ts");

describe("class-link identity", () => {
    test("accepts an email merge link only for a member with the course tag", async () => {
        const email = "enrolled@example.com";
        const token = "a".repeat(64);
        memberByEmail.set(email, { tags: ["jbc-course-start"], token });

        const access = await resolveClassLink(email);
        assert.equal(access?.usedEmail, true);
        assert.equal(access?.token, token);
        assert.equal(access?.subscriber.email, email);

        const tokenAccess = await resolveClassLink(token);
        assert.equal(tokenAccess?.usedEmail, false);
        assert.equal(tokenAccess?.subscriber.email, email);
    });

    test("rejects an audience member who does not have the course tag", async () => {
        const email = "not-enrolled@example.com";
        const token = "b".repeat(64);
        memberByEmail.set(email, { tags: [], token });
        kv.set(`jbc:ctoken:${token}`, JSON.stringify(email));

        assert.equal(await resolveClassLink(email), null);
        assert.equal(await resolveClassLink(token), null);
    });
});

import { createHash } from "node:crypto";
import { after, before, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";

const originalFetch = globalThis.fetch;
const memberByEmail = new Map<string, { tags: string[]; token: string }>();
const kv = new Map<string, string>();
const kvTtl = new Map<string, number>();

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
                const exAt = args.indexOf("EX");
                if (exAt >= 0) kvTtl.set(key, Number(args[exAt + 1]));
                return json({ result: "OK" });
            }
            if (command === "DEL") {
                const existed = kv.delete(key);
                kvTtl.delete(key);
                return json({ result: existed ? 1 : 0 });
            }
        }

        const hash = url.match(/\/members\/([a-f0-9]{32})/i)?.[1];
        const member = [...memberByEmail.entries()].find(([email]) => memberHash(email) === hash);
        if (!member) return json({ detail: "Not found" }, 404);
        const [email, data] = member;

        if (init?.method === "PATCH") {
            const body = JSON.parse(String(init.body ?? "{}")) as {
                merge_fields?: Record<string, string>;
            };
            if (body.merge_fields && "CTOKEN" in body.merge_fields) {
                data.token = body.merge_fields.CTOKEN;
            }
            return json({ email_address: email });
        }

        return json({
            email_address: email,
            status: "subscribed",
            tags: data.tags.map((name) => ({ name })),
            merge_fields: { CTOKEN: data.token, CSTART: "2026-07-01", PARTNER: "false" },
        });
    };
});

beforeEach(() => {
    memberByEmail.clear();
    kv.clear();
    kvTtl.clear();
});

after(() => {
    globalThis.fetch = originalFetch;
});

const {
    TOKEN_INDEX_TTL_SEC,
    issueToken,
    resolveByEmail,
    resolveByToken,
    revokeToken,
} = await import("../src/lib/subscriber.ts");

function seed(email: string, token: string, enrolled = true) {
    memberByEmail.set(email, { tags: enrolled ? ["jbc-course-start"] : [], token });
    kv.set(`jbc:ctoken:${token}`, JSON.stringify(email));
}

describe("class-link identity", () => {
    test("accepts a valid CTOKEN for an enrolled member", async () => {
        const email = "enrolled@example.com";
        const token = "a".repeat(64);
        seed(email, token);

        const subscriber = await resolveByToken(token);
        assert.equal(subscriber?.email, email);
        assert.equal(subscriber?.token, token);
    });

    test("never treats an email address in ?t= as an access token", async () => {
        const email = "enrolled@example.com";
        seed(email, "a".repeat(64));

        assert.equal(await resolveByToken(email), null);
    });

    test("rejects a valid token when the contact lacks the course tag", async () => {
        const email = "not-enrolled@example.com";
        const token = "b".repeat(64);
        seed(email, token, false);

        assert.equal(await resolveByToken(token), null);
    });

    test("manual email recovery repairs the same long-lived CTOKEN index", async () => {
        const email = "fallback@example.com";
        const token = "c".repeat(64);
        memberByEmail.set(email, { tags: ["jbc-course-start"], token });

        const found = await resolveByEmail(email);
        assert.equal(found?.token, token);
        assert.equal(kv.get(`jbc:ctoken:${token}`), JSON.stringify(email));
        assert.equal(kvTtl.get(`jbc:ctoken:${token}`), TOKEN_INDEX_TTL_SEC);
    });

    test("the token index outlives a 90-day course with substantial margin", () => {
        const ninetyDays = 90 * 24 * 60 * 60;
        const sixMonthMargin = 180 * 24 * 60 * 60;
        assert.ok(TOKEN_INDEX_TTL_SEC >= ninetyDays + sixMonthMargin);
        assert.equal(TOKEN_INDEX_TTL_SEC, 400 * 24 * 60 * 60);
    });

    test("rotates one subscriber's token and leaves every other subscriber untouched", async () => {
        const firstEmail = "rotate@example.com";
        const firstOldToken = "d".repeat(64);
        const secondEmail = "untouched@example.com";
        const secondToken = "e".repeat(64);
        seed(firstEmail, firstOldToken);
        seed(secondEmail, secondToken);

        const firstNewToken = await issueToken(firstEmail);
        assert.match(firstNewToken, /^[a-f0-9]{64}$/);
        assert.notEqual(firstNewToken, firstOldToken);
        assert.equal(kv.has(`jbc:ctoken:${firstOldToken}`), false);
        assert.equal(kvTtl.get(`jbc:ctoken:${firstNewToken}`), TOKEN_INDEX_TTL_SEC);
        assert.equal((await resolveByToken(firstNewToken))?.email, firstEmail);
        assert.equal(await resolveByToken(firstOldToken), null);
        assert.equal((await resolveByToken(secondToken))?.email, secondEmail);
    });

    test("revokes one subscriber's token without changing another subscriber", async () => {
        const firstEmail = "revoke@example.com";
        const firstToken = "f".repeat(64);
        const secondEmail = "still-valid@example.com";
        const secondToken = "1".repeat(64);
        seed(firstEmail, firstToken);
        seed(secondEmail, secondToken);

        assert.equal(await revokeToken(firstEmail), true);
        assert.equal(memberByEmail.get(firstEmail)?.token, "");
        assert.equal(kv.has(`jbc:ctoken:${firstToken}`), false);
        assert.equal(await resolveByToken(firstToken), null);
        // Mailchimp remains authoritative even if a Redis deletion were to
        // fail and leave the old reverse index behind.
        kv.set(`jbc:ctoken:${firstToken}`, JSON.stringify(firstEmail));
        assert.equal(await resolveByToken(firstToken), null);
        assert.equal((await resolveByToken(secondToken))?.email, secondEmail);
    });
});

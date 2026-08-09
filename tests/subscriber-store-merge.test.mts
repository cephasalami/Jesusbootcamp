// writeProfile MERGES a patch onto the stored record, so it must be able to
// tell "no record exists" from "the store did not answer".
//
// Conflating those is silent data loss: every field absent from the patch falls
// back to its default, so a courseStart-only write erases the access token and
// the subscriber is locked out of their classes. It happened to two live
// subscribers during an Upstash DNS blip, and the read-path backfill could not
// repair them, because a (broken) profile now existed.
import { after, before, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";

process.env.KV_REST_API_URL = "https://kv.test";
process.env.KV_REST_API_TOKEN = "test-token";

const originalFetch = globalThis.fetch;

/** key -> stored JSON string. */
const store = new Map<string, string>();
/** When true, every KV request fails the way a DNS outage does. */
let kvDown = false;

before(() => {
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        if (kvDown) throw new TypeError("fetch failed");

        const url = String(input);
        const body = JSON.parse(String(init?.body ?? "[]"));
        const commands: string[][] = url.endsWith("/pipeline") ? body : [body];

        const results = commands.map((args) => {
            const [command, key, value] = args;
            if (command === "GET") return { result: store.get(key) ?? null };
            if (command === "SET") {
                store.set(key, value);
                return { result: "OK" };
            }
            return { result: null };
        });

        const payload = url.endsWith("/pipeline") ? results : results[0];
        return new Response(JSON.stringify(payload), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    }) as typeof fetch;
});

after(() => {
    globalThis.fetch = originalFetch;
});

beforeEach(() => {
    store.clear();
    kvDown = false;
});

const { writeProfile, readProfile } = await import("../src/lib/subscriber-store.ts");

describe("writeProfile merges without losing fields", () => {
    test("a partial patch preserves everything it does not set", async () => {
        await writeProfile("a@example.com", { token: "t".repeat(64), enrolled: true });
        await writeProfile("a@example.com", { courseStart: "2026-08-09" });

        const profile = await readProfile("a@example.com");
        assert.equal(profile?.courseStart, "2026-08-09");
        assert.equal(profile?.token, "t".repeat(64), "the token must survive a courseStart-only write");
        assert.equal(profile?.enrolled, true);
    });

    test("REFUSES to write when the store cannot be read", async () => {
        await writeProfile("b@example.com", { token: "t".repeat(64), enrolled: true });
        const before = store.get("jbc:profile:v1:b@example.com");

        kvDown = true;
        await assert.rejects(
            writeProfile("b@example.com", { courseStart: "2026-08-09" }),
            /refusing to write/i,
            "merging onto an unknown record would erase the fields the patch omits"
        );

        kvDown = false;
        assert.equal(
            store.get("jbc:profile:v1:b@example.com"),
            before,
            "the stored record must be untouched after a refused write"
        );
        const profile = await readProfile("b@example.com");
        assert.equal(profile?.token, "t".repeat(64), "the token must still be intact");
    });

    test("a genuinely absent record is created, not refused", async () => {
        const created = await writeProfile("fresh@example.com", { courseStart: "2026-08-09" });
        assert.equal(created.courseStart, "2026-08-09");
        assert.equal(created.token, "", "a brand-new record legitimately has no token yet");
    });
});

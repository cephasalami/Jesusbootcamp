import assert from "node:assert/strict";
import { after, before, test } from "node:test";

const originalFetch = globalThis.fetch;
const strings = new Map<string, string>();
const sets = new Map<string, Set<string>>();
const lists = new Map<string, string[]>();

process.env.KV_REST_API_URL = "https://kv.material-test";
process.env.KV_REST_API_TOKEN = "material-test-token";

function json(body: unknown): Response {
    return new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } });
}

before(() => {
    globalThis.fetch = async (input, init) => {
        if (String(input) !== "https://kv.material-test/pipeline") {
            return new Response("Not found", { status: 404 });
        }
        const commands = JSON.parse(String(init?.body ?? "[]")) as string[][];
        const result = commands.map(([command, key, value, end]) => {
            if (command === "INCR") {
                const next = Number(strings.get(key) ?? "0") + 1;
                strings.set(key, String(next));
                return { result: next };
            }
            if (command === "SADD") {
                const set = sets.get(key) ?? new Set<string>();
                const existed = set.has(value);
                set.add(value);
                sets.set(key, set);
                return { result: existed ? 0 : 1 };
            }
            if (command === "LPUSH") {
                const list = lists.get(key) ?? [];
                list.unshift(value);
                lists.set(key, list);
                return { result: list.length };
            }
            if (command === "LTRIM") {
                const list = lists.get(key) ?? [];
                lists.set(key, list.slice(Number(value), Number(end) + 1));
                return { result: "OK" };
            }
            if (command === "SMEMBERS") return { result: [...(sets.get(key) ?? [])] };
            if (command === "GET") return { result: strings.get(key) ?? null };
            return { error: `Unsupported command: ${command}` };
        });
        return json(result);
    };
});

after(() => {
    globalThis.fetch = originalFetch;
});

test("material access stores non-PII event records and reads per-format counters", async () => {
    const { recordMaterialAccess, readMaterialAccessMetrics } = await import(
        "../src/lib/tracking/material-access.ts"
    );
    const token = "a".repeat(64);

    await recordMaterialAccess({ subscriberToken: token, classSlug: "4a", format: "pdf", success: true, timestamp: 1 });
    await recordMaterialAccess({ subscriberToken: token, classSlug: "4a", format: "quiz", success: false, timestamp: 2 });

    const metrics = await readMaterialAccessMetrics();
    assert.equal(metrics.connected, true);
    assert.equal(metrics.totalOpened, 1);
    assert.equal(metrics.totalFailed, 1);
    assert.deepEqual(metrics.byClass, [
        {
            classSlug: "4a",
            formats: [
                { format: "pdf", opened: 1, failed: 0 },
                { format: "quiz", opened: 0, failed: 1 },
            ],
        },
    ]);

    const event = JSON.parse(lists.get("jbc:material-access:v1:events")![0]);
    assert.equal(event.subscriberRef.length, 64);
    assert.notEqual(event.subscriberRef, token);
    assert.equal(JSON.stringify(event).includes(token), false);
    assert.equal(JSON.stringify(event).includes("@"), false);
});

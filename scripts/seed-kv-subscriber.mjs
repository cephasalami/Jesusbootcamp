// scripts/seed-kv-subscriber.mjs
// Local visual-testing helper. Seeds the KV token index + subscriber snapshot so
// /class/[slug] resolves a subscriber WITHOUT calling Mailchimp. Exercises the
// real resolveByToken -> getSnapshot cache-hit path; it grants nothing that the
// normal path wouldn't, and the snapshot expires on its own.
//
//   node --env-file=.env.local scripts/seed-kv-subscriber.mjs [--partner]
import { randomBytes } from "node:crypto";

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
if (!KV_URL) {
    console.error("No KV configured");
    process.exit(1);
}

const kv = async (args) => {
    const r = await fetch(KV_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify(args.map(String)),
    });
    if (!r.ok) throw new Error(`kv ${args[0]} failed ${r.status}`);
    return (await r.json()).result;
};

const partner = process.argv.includes("--partner");
const email = `kv-visual-test@example.com`;
const token = randomBytes(32).toString("hex");
// 4 days ago -> classes at sequence_position <= 5 are released.
const courseStart = new Date(Date.now() - 4 * 86400000).toISOString().slice(0, 10);

const snapshot = { email, token, partner, courseStart, hasCourseTag: true };

await kv(["SET", `jbc:ctoken:${token}`, JSON.stringify(email), "EX", "3600"]);
await kv(["SET", `jbc:sub:${email}`, JSON.stringify(snapshot), "EX", "3600"]);

console.log(`PARTNER=${partner}  CSTART=${courseStart}`);
console.log(`URL=http://localhost:3000/class/1?t=${token}`);
console.log(`TOKEN=${token}`);

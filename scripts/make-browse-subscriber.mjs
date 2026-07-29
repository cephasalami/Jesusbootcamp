// Creates a persistent test subscriber for manual/browser verification, and
// prints the URL to open. Pass --partner to make them a partner.
// Pass --delete <email> to clean up afterwards.
import { createHash, randomBytes } from "node:crypto";

const KEY = process.env.MAILCHIMP_API_KEY;
const SERVER = process.env.MAILCHIMP_API_SERVER;
const AUD = process.env.MAILCHIMP_AUDIENCE_ID;
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const H = { Authorization: `apikey ${KEY}`, "Content-Type": "application/json" };
const mc = `https://${SERVER}.api.mailchimp.com/3.0/lists/${AUD}`;
const hash = (e) => createHash("md5").update(e.trim().toLowerCase()).digest("hex");
const kv = (args) =>
    fetch(KV_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify(args.map(String)),
    }).then((r) => (r.ok ? r.json() : null));

const delIdx = process.argv.indexOf("--delete");
if (delIdx !== -1) {
    const email = process.argv[delIdx + 1];
    const r = await fetch(`${mc}/members/${hash(email)}/actions/delete-permanent`, { method: "POST", headers: H });
    await kv(["DEL", `jbc:sub:${email.toLowerCase()}`]);
    console.log(r.ok ? `deleted ${email}` : `delete failed ${r.status}`);
    process.exit(0);
}

const partner = process.argv.includes("--partner");
const EMAIL = `choicecycle+browse${Date.now()}@gmail.com`;
const TOKEN = randomBytes(32).toString("hex");
const start = new Date(Date.now() - 4 * 86400000).toISOString().slice(0, 10);

await fetch(`${mc}/members/${hash(EMAIL)}`, {
    method: "PUT", headers: H,
    body: JSON.stringify({ email_address: EMAIL, status_if_new: "subscribed" }),
});
await fetch(`${mc}/members/${hash(EMAIL)}/tags`, {
    method: "POST", headers: H,
    body: JSON.stringify({ tags: [{ name: "jbc-course-start", status: "active" }] }),
});
await fetch(`${mc}/members/${hash(EMAIL)}`, {
    method: "PATCH", headers: H,
    body: JSON.stringify({ merge_fields: { CTOKEN: TOKEN, CSTART: start, PARTNER: partner ? "true" : "false" } }),
});
await kv(["SET", `jbc:ctoken:${TOKEN}`, JSON.stringify(EMAIL.toLowerCase()), "EX", "7200"]);
await kv(["DEL", `jbc:sub:${EMAIL.toLowerCase()}`]);

console.log("EMAIL=" + EMAIL);
console.log("PARTNER=" + (partner ? "true" : "false") + "  CSTART=" + start);
console.log("URL=http://localhost:3000/class/4?t=" + TOKEN);

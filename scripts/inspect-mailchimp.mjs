// scripts/inspect-mailchimp.mjs
// Read-only audit of the live Mailchimp audience: which merge fields exist,
// and whether a per-contact signup timestamp is reliably available.
// Run: node --env-file=.env.local scripts/inspect-mailchimp.mjs
const KEY = process.env.MAILCHIMP_API_KEY;
const SERVER = process.env.MAILCHIMP_API_SERVER;
const AUD = process.env.MAILCHIMP_AUDIENCE_ID;
if (!KEY || !SERVER || !AUD) {
    console.error("Missing Mailchimp env");
    process.exit(1);
}
const H = { Authorization: `apikey ${KEY}`, "Content-Type": "application/json" };
const base = `https://${SERVER}.api.mailchimp.com/3.0`;

const mf = await (await fetch(`${base}/lists/${AUD}/merge-fields?count=100`, { headers: H })).json();
console.log("=== MERGE FIELDS ===");
for (const f of mf.merge_fields ?? []) {
    console.log(`  ${f.tag.padEnd(12)} ${String(f.type).padEnd(10)} req=${f.required}  "${f.name}"`);
}
const tags = (mf.merge_fields ?? []).map((f) => f.tag);
console.log("\nCTOKEN exists?     ", tags.includes("CTOKEN"));
console.log("COURSESTART exists?", tags.includes("COURSESTART"));
console.log("PARTNER exists?    ", tags.includes("PARTNER"));
console.log("PTIER exists?      ", tags.includes("PTIER"));

// What does a real member record expose for timestamps + tags?
const list = await (
    await fetch(`${base}/lists/${AUD}/members?count=3&fields=members.email_address,members.timestamp_opt,members.timestamp_signup,members.last_changed,members.tags,members.merge_fields,total_items`, { headers: H })
).json();
console.log("\n=== SAMPLE MEMBERS (total:", list.total_items, ") ===");
for (const m of list.members ?? []) {
    const masked = String(m.email_address).replace(/^(.{2}).*@/, "$1***@");
    console.log(`  ${masked}`);
    console.log(`     timestamp_opt=${m.timestamp_opt || "(empty)"}  timestamp_signup=${m.timestamp_signup || "(empty)"}`);
    console.log(`     tags=${JSON.stringify((m.tags ?? []).map((t) => t.name))}`);
    console.log(`     merge PARTNER=${m.merge_fields?.PARTNER ?? "-"} PTIER=${m.merge_fields?.PTIER ?? "-"} CTOKEN=${m.merge_fields?.CTOKEN ? "(set)" : "-"} COURSESTART=${m.merge_fields?.COURSESTART ?? "-"}`);
}

// Does the tag-segment endpoint expose when a tag was applied?
const segs = await (await fetch(`${base}/lists/${AUD}/segments?count=50&type=static`, { headers: H })).json();
console.log("\n=== STATIC SEGMENTS (tags) ===");
for (const s of segs.segments ?? []) {
    console.log(`  "${s.name}" members=${s.member_count} created=${s.created_at || "-"}`);
}

// Can we search by a merge field value (needed for CTOKEN lookup)?
console.log("\n=== SEARCH CAPABILITY PROBE ===");
const probe = await fetch(`${base}/search-members?query=nonexistent-token-probe-xyz`, { headers: H });
console.log("  /search-members status:", probe.status);

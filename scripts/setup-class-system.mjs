// scripts/setup-class-system.mjs
//
// Idempotent setup for the class delivery system. Safe to re-run.
//
//   node --env-file=.env.local scripts/setup-class-system.mjs          (dry run)
//   node --env-file=.env.local scripts/setup-class-system.mjs --apply  (writes)
//
// Creates the two Mailchimp merge fields the class system needs, the same way
// PARTNER / PTIER / STRIPEID were created:
//   CTOKEN       per-subscriber class access token (the ?t= in the URL)
//   COURSESTART  YYYY-MM-DD drip start date
//
// Optionally backfills COURSESTART for contacts already tagged jbc-course-start
// but missing a start date (--backfill). Without a start date those contacts
// fail SAFE to classes 1-4a only, so backfilling is what actually starts their
// drip clock. NOTE: Mailchimp exposes no per-contact "when was this tag applied"
// timestamp, and `timestamp_opt` is the audience join date — for the 1,361
// contacts bulk-imported in 2021 that is years off, which would unlock the whole
// archive at once. So the backfill deliberately uses TODAY, i.e. everyone starts
// the sequence together on launch day.
const KEY = process.env.MAILCHIMP_API_KEY;
const SERVER = process.env.MAILCHIMP_API_SERVER;
const AUD = process.env.MAILCHIMP_AUDIENCE_ID;
if (!KEY || !SERVER || !AUD) {
    console.error("Missing Mailchimp env vars.");
    process.exit(1);
}

const APPLY = process.argv.includes("--apply");
const BACKFILL = process.argv.includes("--backfill");
const H = { Authorization: `apikey ${KEY}`, "Content-Type": "application/json" };
const base = `https://${SERVER}.api.mailchimp.com/3.0`;
const COURSE_TAG = "jbc-course-start";

// ⚠️ Mailchimp SILENTLY TRUNCATES merge-field tags to 10 characters, so
// "COURSESTART" (11) becomes "COURSESTAR" — writes to the full name are then
// discarded and reads return undefined. Keep every tag <= 10 chars.
const MAX_TAG_LEN = 10;
const REQUIRED_FIELDS = [
    { tag: "CTOKEN", name: "Class access token", type: "text" },
    { tag: "CSTART", name: "Course start date (YYYY-MM-DD)", type: "text" },
];
/** Tags created by an earlier, buggy run that should be removed. */
const STALE_FIELDS = ["COURSESTAR", "COURSESTART"];

for (const f of REQUIRED_FIELDS) {
    if (f.tag.length > MAX_TAG_LEN) {
        console.error(`Refusing to create "${f.tag}" — Mailchimp truncates tags to ${MAX_TAG_LEN} chars.`);
        process.exit(1);
    }
}

console.log(APPLY ? "MODE: APPLY (writing)\n" : "MODE: DRY RUN (no writes) — pass --apply to write\n");

// ── 1. Merge fields ─────────────────────────────────────────────────────────
const existing = await (await fetch(`${base}/lists/${AUD}/merge-fields?count=100`, { headers: H })).json();
const have = new Set((existing.merge_fields ?? []).map((f) => f.tag));
console.log("Existing merge fields:", [...have].join(", "));

for (const field of REQUIRED_FIELDS) {
    if (have.has(field.tag)) {
        console.log(`  ✓ ${field.tag} already exists`);
        continue;
    }
    if (!APPLY) {
        console.log(`  → would CREATE ${field.tag} ("${field.name}", ${field.type})`);
        continue;
    }
    const res = await fetch(`${base}/lists/${AUD}/merge-fields`, {
        method: "POST",
        headers: H,
        // public:false keeps it out of subscriber-facing forms; required:false so
        // it can never block a signup.
        body: JSON.stringify({ tag: field.tag, name: field.name, type: field.type, required: false, public: false }),
    });
    const body = await res.json();
    if (!res.ok) {
        console.log(`  ✗ FAILED ${field.tag}: ${JSON.stringify(body)}`);
    } else if (body.tag !== field.tag) {
        // Belt and braces: prove Mailchimp stored the tag we asked for.
        console.log(`  ✗ ${field.tag} was STORED AS "${body.tag}" (truncated) — fix the tag name`);
    } else {
        console.log(`  ✓ CREATED ${field.tag}`);
    }
}

// Remove fields left behind by an earlier run that used a too-long tag.
for (const stale of STALE_FIELDS) {
    const found = (existing.merge_fields ?? []).find((f) => f.tag === stale);
    if (!found) continue;
    if (!APPLY) {
        console.log(`  → would DELETE stale field "${stale}"`);
        continue;
    }
    const res = await fetch(`${base}/lists/${AUD}/merge-fields/${found.merge_id}`, {
        method: "DELETE",
        headers: H,
    });
    console.log(res.ok ? `  ✓ DELETED stale field "${stale}"` : `  ✗ could not delete "${stale}": ${res.status}`);
}

// ── 2. Optional COURSESTART backfill ────────────────────────────────────────
if (BACKFILL) {
    console.log(`\nBackfilling COURSESTART for contacts tagged "${COURSE_TAG}" with no start date…`);
    const today = new Date().toISOString().slice(0, 10);

    // Find the tag's segment id, then page its members.
    const segs = await (await fetch(`${base}/lists/${AUD}/segments?count=200&type=static`, { headers: H })).json();
    const seg = (segs.segments ?? []).find((s) => s.name === COURSE_TAG);
    if (!seg) {
        console.log(`  (no "${COURSE_TAG}" segment found — nothing to do)`);
    } else {
        let offset = 0;
        let touched = 0;
        for (;;) {
            const page = await (
                await fetch(
                    `${base}/lists/${AUD}/segments/${seg.id}/members?count=100&offset=${offset}&fields=members.email_address,members.merge_fields,total_items`,
                    { headers: H }
                )
            ).json();
            const members = page.members ?? [];
            if (!members.length) break;
            for (const m of members) {
                if (m.merge_fields?.COURSESTART) continue;
                touched++;
                const masked = String(m.email_address).replace(/^(.{2}).*@/, "$1***@");
                if (!APPLY) {
                    console.log(`  → would SET COURSESTART=${today} for ${masked}`);
                    continue;
                }
                const hash = (await import("node:crypto"))
                    .createHash("md5")
                    .update(String(m.email_address).trim().toLowerCase())
                    .digest("hex");
                const r = await fetch(`${base}/lists/${AUD}/members/${hash}`, {
                    method: "PATCH",
                    headers: H,
                    body: JSON.stringify({ merge_fields: { COURSESTART: today } }),
                });
                console.log(r.ok ? `  ✓ ${masked} → ${today}` : `  ✗ ${masked}: ${r.status}`);
            }
            offset += members.length;
            if (offset >= (page.total_items ?? 0)) break;
        }
        console.log(`  ${touched} contact(s) needed a COURSESTART.`);
    }
}

console.log("\nDone.");
if (!APPLY) console.log("Re-run with --apply (and optionally --backfill) to make changes.");

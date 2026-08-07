// Read-only migration progress report for the KV subscriber store.
//
// Since src/lib/subscriber-store.ts became the system of record for class
// identity, records are seeded lazily — each subscriber's profile is written the
// first time they open a class. That makes the rollout invisible: if profiles
// were never being written, every request would silently fall back to Mailchimp
// and still work, and you would get none of the benefit. This counts them.
//
// Usage:
//   node --env-file=.env.local scripts/count-subscriber-profiles.mjs
//   node --env-file=.env.local scripts/count-subscriber-profiles.mjs --sample 5
//
// Never prints an access token. `--sample` shows a few records with the token
// reduced to present/absent, because a CTOKEN in a terminal scrollback or a
// pasted report is a working credential for someone's course.

const SAMPLE_FLAG = process.argv.indexOf("--sample");
const SAMPLE_SIZE = SAMPLE_FLAG >= 0 ? Math.max(0, Number.parseInt(process.argv[SAMPLE_FLAG + 1] ?? "5", 10)) : 0;

const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const apiKey = process.env.MAILCHIMP_API_KEY;
const server = process.env.MAILCHIMP_API_SERVER;
const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;

if (!redisUrl || !redisToken) {
    throw new Error("Missing UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN (or the KV_REST_API_* equivalents)");
}

const PROFILE_PREFIX = "jbc:profile:v1:";
const SCAN_BATCH = 500;
const READ_BATCH = 200;

async function fetchWithRetry(url, init, attempts = 4) {
    let lastError;
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            const res = await fetch(url, { ...init, signal: AbortSignal.timeout(20_000) });
            if (res.ok) return res;
            // 5xx is worth retrying; a 4xx will not fix itself.
            if (res.status < 500) return res;
            lastError = new Error(`HTTP ${res.status}`);
        } catch (error) {
            lastError = error;
        }
        if (attempt < attempts) await new Promise((r) => setTimeout(r, attempt * 400));
    }
    throw lastError;
}

/** Run a Redis pipeline over Upstash's REST API. */
async function redis(commands) {
    const res = await fetchWithRetry(`${redisUrl}/pipeline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${redisToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(commands.map((c) => c.map(String))),
    });
    if (!res.ok) throw new Error(`Upstash ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const json = await res.json();
    return json.map((entry) => (entry?.error ? null : entry?.result));
}

/**
 * Enumerate keys with SCAN, never KEYS. KEYS blocks the whole Redis instance
 * for the duration of the scan, which on a shared Upstash plan means stalling
 * live class-page reads.
 */
async function scanKeys(pattern) {
    const keys = [];
    let cursor = "0";
    do {
        const [result] = await redis([["SCAN", cursor, "MATCH", pattern, "COUNT", SCAN_BATCH]]);
        if (!Array.isArray(result)) break;
        cursor = String(result[0] ?? "0");
        for (const key of result[1] ?? []) keys.push(String(key));
    } while (cursor !== "0");
    // SCAN can return the same key twice across cursor pages.
    return [...new Set(keys)];
}

async function readProfiles(keys) {
    const out = [];
    for (let i = 0; i < keys.length; i += READ_BATCH) {
        const chunk = keys.slice(i, i + READ_BATCH);
        const values = await redis(chunk.map((k) => ["GET", k]));
        for (const raw of values) {
            if (typeof raw !== "string") continue;
            try {
                out.push(JSON.parse(raw));
            } catch {
                out.push(null); // counted as unreadable below
            }
        }
    }
    return out;
}

/** Total subscribed members, and how many carry the course-enrolment tag. */
async function mailchimpCounts() {
    if (!apiKey || !server || !audienceId) return null;
    const headers = { Authorization: `apikey ${apiKey}` };
    const base = `https://${server}.api.mailchimp.com/3.0/lists/${audienceId}`;
    try {
        const listRes = await fetchWithRetry(`${base}?fields=stats.member_count`, { headers });
        const stats = (await listRes.json())?.stats ?? {};

        // Tags are static segments, so the tag's segment carries a member_count.
        let enrolled = null;
        try {
            const tagRes = await fetchWithRetry(`${base}/tag-search?name=jbc-course-start`, { headers });
            const tag = ((await tagRes.json())?.tags ?? []).find((t) => t.name === "jbc-course-start");
            if (tag?.id) {
                const segRes = await fetchWithRetry(`${base}/segments/${tag.id}?fields=member_count`, { headers });
                enrolled = (await segRes.json())?.member_count ?? null;
            }
        } catch {
            // Non-fatal: the headline counts are still useful without it.
        }
        return { members: stats.member_count ?? null, enrolled };
    } catch (error) {
        console.warn(`  (Mailchimp comparison unavailable: ${error.message})`);
        return null;
    }
}

const pct = (part, whole) => (whole > 0 ? `${((part / whole) * 100).toFixed(1)}%` : "—");

console.log(`Scanning ${PROFILE_PREFIX}* …`);
const keys = await scanKeys(`${PROFILE_PREFIX}*`);
const profiles = await readProfiles(keys);

const readable = profiles.filter(Boolean);
const unreadable = profiles.length - readable.length;
const withToken = readable.filter((p) => typeof p.token === "string" && p.token.length > 0).length;
const enrolled = readable.filter((p) => p.enrolled === true).length;
const partners = readable.filter((p) => p.partner === true).length;
const withStart = readable.filter((p) => p.courseStart).length;

const mc = await mailchimpCounts();

console.log(`\nKV subscriber profiles`);
console.log(`  total records      ${keys.length}`);
if (unreadable > 0) console.log(`  UNREADABLE         ${unreadable}   <- corrupt JSON, investigate`);
console.log(`  with access token  ${withToken}  (${pct(withToken, readable.length)} of records)`);
console.log(`  course start set   ${withStart}  (${pct(withStart, readable.length)})`);
console.log(`  enrolled           ${enrolled}`);
console.log(`  active partners    ${partners}`);

if (mc) {
    console.log(`\nMailchimp comparison`);
    if (mc.members != null) console.log(`  subscribed members ${mc.members}`);
    if (mc.enrolled != null) {
        console.log(`  tagged enrolled    ${mc.enrolled}`);
        console.log(`\nMigration coverage   ${pct(keys.length, mc.enrolled)} of enrolled contacts have a KV profile`);
        console.log(`  Records are seeded when someone opens a class, so this rises as`);
        console.log(`  subscribers work through the course. It is not expected to reach 100%.`);
    }
}

if (SAMPLE_SIZE > 0) {
    console.log(`\nSample (tokens redacted)`);
    for (const p of readable.slice(0, SAMPLE_SIZE)) {
        console.log(
            `  ${p.email}  token=${p.token ? "present" : "ABSENT"}  start=${p.courseStart ?? "—"}` +
                `  enrolled=${p.enrolled}  partner=${p.partner}  updated=${
                    p.updatedAt ? new Date(p.updatedAt).toISOString().slice(0, 16).replace("T", " ") : "—"
                }`
        );
    }
}

if (keys.length === 0) {
    console.log(`\nNo profiles yet. Expected right after deploy — the first one appears`);
    console.log(`when a subscriber next opens a class. If this stays at 0 after real`);
    console.log(`class traffic, the backfill is not running and reads are silently`);
    console.log(`falling back to Mailchimp forever.`);
}

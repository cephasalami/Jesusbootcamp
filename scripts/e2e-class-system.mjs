// scripts/e2e-class-system.mjs
//
// End-to-end verification of the class delivery system against a RUNNING dev
// server and the REAL Mailchimp audience.
//
//   node --env-file=.env.local scripts/e2e-class-system.mjs
//
// Creates a disposable test contact (operator's own +alias address), drives the
// real /class/[slug] pages and the real /api/class/file proxy, flips PARTNER
// live to prove revocation, then permanently deletes the contact.
import { createHash, randomBytes } from "node:crypto";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const KEY = process.env.MAILCHIMP_API_KEY;
const SERVER = process.env.MAILCHIMP_API_SERVER;
const AUD = process.env.MAILCHIMP_AUDIENCE_ID;
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const H = { Authorization: `apikey ${KEY}`, "Content-Type": "application/json" };
const mc = `https://${SERVER}.api.mailchimp.com/3.0/lists/${AUD}`;
const hash = (e) => createHash("md5").update(e.trim().toLowerCase()).digest("hex");

const EMAIL = `choicecycle+jbcclass${Date.now()}@gmail.com`;
const TOKEN = randomBytes(32).toString("hex");

let pass = 0;
let fail = 0;
const ok = (cond, msg, extra = "") => {
    if (cond) {
        pass++;
        console.log(`  PASS  ${msg}`);
    } else {
        fail++;
        console.log(`  FAIL  ${msg}${extra ? `\n        ${extra}` : ""}`);
    }
};
const section = (s) => console.log(`\n=== ${s} ===`);

async function setMerge(fields) {
    const r = await fetch(`${mc}/members/${hash(EMAIL)}`, {
        method: "PATCH",
        headers: H,
        body: JSON.stringify({ merge_fields: fields }),
    });
    if (!r.ok) throw new Error(`merge write failed ${r.status}: ${await r.text()}`);
}

async function kv(args) {
    if (!KV_URL) return null;
    const r = await fetch(KV_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify(args.map(String)),
    });
    return r.ok ? (await r.json()).result : null;
}

/** Strip the token index + cached snapshot so the next read is truly live. */
async function bustCache() {
    await kv(["DEL", `jbc:sub:${EMAIL.toLowerCase()}`]);
}

/**
 * React streams each rendered string TWICE: once as real HTML and once inside
 * the RSC flight payload (<script>self.__next_f.push(...)</script>). Counting
 * occurrences in the raw response therefore double-counts every row. `visible`
 * strips script tags so counts reflect what is actually rendered.
 */
const stripScripts = (html) => html.replace(/<script[\s\S]*?<\/script>/gi, "");

const get = async (path) => {
    const r = await fetch(`${BASE}${path}`, { redirect: "manual" });
    const html = await r.text();
    return { status: r.status, html, visible: stripScripts(html), headers: r.headers };
};

const iso = (d) => d.toISOString().slice(0, 10);
const daysAgo = (n) => iso(new Date(Date.now() - n * 86_400_000));

/**
 * PREFLIGHT — the rest of this suite asserts against specific class slugs.
 * If a slug is missing from the manifest the page renders "class not found",
 * which does NOT contain the strings the checks look for — so a missing class
 * reads as a silent PASS ("class 2 is open") rather than a failure. That is
 * worse than useless, so refuse to run instead of reporting false confidence.
 */
const REQUIRED_SLUGS = ["1", "2", "3", "4a", "4", "5"];
async function preflight() {
    section("Preflight — required classes must exist in the manifest");
    const missing = [];
    for (const slug of REQUIRED_SLUGS) {
        const r = await get(`/class/${slug}`);
        const notFound = /couldn(&#x27;|')t find that class/.test(r.html);
        if (notFound) missing.push(slug);
    }
    if (missing.length) {
        console.log(`  FAIL  manifest is missing class slug(s): ${missing.join(", ")}`);
        console.log("");
        console.log("  This suite cannot produce a meaningful result against this manifest.");
        console.log("  A missing class renders 'class not found', which silently satisfies");
        console.log("  several checks (e.g. \"class 2 is open\") instead of failing them.");
        console.log("  Populate the Sheet with these slugs, or point CLASS_MANIFEST_SHEET_ID");
        console.log("  at a staging sheet, then re-run.");
        // Signalled rather than process.exit()ed so pending sockets close
        // cleanly instead of tripping a libuv assertion on Windows.
        const err = new Error("preflight");
        err.preflight = true;
        throw err;
    }
    ok(true, `all ${REQUIRED_SLUGS.length} required classes present (${REQUIRED_SLUGS.join(", ")})`);
}

try {
    await preflight();

    section("Setup â€” create a real test subscriber");
    const put = await fetch(`${mc}/members/${hash(EMAIL)}`, {
        method: "PUT",
        headers: H,
        body: JSON.stringify({ email_address: EMAIL, status_if_new: "subscribed" }),
    });
    ok(put.ok, `created test contact (${EMAIL})`, put.ok ? "" : await put.text());
    await fetch(`${mc}/members/${hash(EMAIL)}/tags`, {
        method: "POST",
        headers: H,
        body: JSON.stringify({ tags: [{ name: "jbc-course-start", status: "active" }] }),
    });
    // Signed up 4 days ago â†’ positions 1-5 released (classes 1,2,3,4a,4); class 5 locked.
    await setMerge({ CTOKEN: TOKEN, CSTART: daysAgo(4), PARTNER: "false" });
    // JSON-encoded to match kvSetJson/kvGetJson, which is what the app uses.
    await kv(["SET", `jbc:ctoken:${TOKEN}`, JSON.stringify(EMAIL.toLowerCase()), "EX", "3600"]);
    await bustCache();
    ok(true, `CSTART=${daysAgo(4)} (4 days ago), PARTNER=false, CTOKEN indexed`);

    section("Part 0 â€” /class/4 vs /class/4a resolve to DISTINCT classes");
    const c4 = await get(`/class/4?t=${TOKEN}`);
    const c4a = await get(`/class/4a?t=${TOKEN}`);
    ok(c4.status === 200, `/class/4 â†’ 200 (got ${c4.status})`);
    ok(c4a.status === 200, `/class/4a â†’ 200 (got ${c4a.status})`);
    ok(c4.html.includes("Class Four Title"), "/class/4 shows class 4's title");
    ok(
        c4a.html.includes("We&#x27;re ALL Laborers In The Harvest") ||
            c4a.html.includes("We're ALL Laborers In The Harvest"),
        "/class/4a shows 4a's title (NOT class 4's)"
    );
    ok(!c4a.html.includes("Class Four Title"), "/class/4a does NOT render class 4");

    section("Drip â€” signup 4 days ago");
    for (const slug of ["1", "2", "3", "4a", "4"]) {
        const r = await get(`/class/${slug}?t=${TOKEN}`);
        ok(r.status === 200 && !r.html.includes("hasn&#x27;t opened yet"), `class ${slug} is open`);
    }
    const c5 = await get(`/class/5?t=${TOKEN}`);
    ok(
        c5.html.includes("hasn&#x27;t opened yet") || c5.html.includes("hasn't opened yet"),
        "class 5 is time-locked"
    );
    const unlockDate = new Date(Date.now() + 86_400_000).toLocaleDateString("en-US", {
        weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
    });
    ok(c5.html.includes(unlockDate), `class 5 shows its REAL unlock date (${unlockDate})`);

    section("Partner gate â€” NON-partner on class 4");
    const nonPartner = await get(`/class/4?t=${TOKEN}`);
    // 5 gated formats + the quiz row (class 4 has a quiz_url in the fixture).
    const rowCount = (nonPartner.visible.match(/Unlocked for partners/g) ?? []).length;
    ok(rowCount === 6, `five formats + the quiz show as partner-locked (got ${rowCount})`);
    ok(nonPartner.visible.includes("Quiz</span>"), "the quiz row is visible to a non-partner");
    ok(!nonPartner.visible.includes("Take the Quiz"), "but its link is withheld");
    ok(!/viewform|forms\.gle/.test(nonPartner.html), "and the quiz URL never reaches a non-partner");
    ok(nonPartner.html.includes("/partner/join"), "locked formats link to /partner/join");
    for (const label of ["Class PDF", "Full teaching video", "Podcast (20 min)", "Video brief (10 min)", "PowerPoint", "Scripture list"]) {
        ok(nonPartner.html.includes(label), `all seven rows visible â€” "${label.replace("&amp;", "&")}"`);
    }
    const pdfLink = `/api/class/file?t=${TOKEN}&amp;slug=4&amp;format=pdf`;
    ok(nonPartner.html.includes(pdfLink), "PDF is openable (proxy link present)");

    section("Proxy authorisation â€” a non-partner cannot fetch a gated format directly");
    const vid = await fetch(`${BASE}/api/class/file?t=${TOKEN}&slug=4&format=video`);
    ok(vid.status === 403, `direct /api/class/file video â†’ 403 (got ${vid.status})`);
    const noTok = await fetch(`${BASE}/api/class/file?t=bogus-token-value-xxxxxxxxxxxx&slug=4&format=pdf`);
    ok(noTok.status === 401, `unknown token â†’ 401 (got ${noTok.status})`);
    const locked = await fetch(`${BASE}/api/class/file?t=${TOKEN}&slug=5&format=pdf`);
    ok(locked.status === 403, `not-yet-released class â†’ 403 (got ${locked.status})`);

    section("No Drive URL leaks for gated content");
    // Scans the RAW response on purpose: a Drive URL hidden in the RSC flight
    // payload would still be a leak, even though it isn't visibly rendered.
    const driveHits = (nonPartner.html.match(/drive\.google\.com/g) ?? []).length;
    ok(driveHits === 0, `no drive.google.com anywhere in class-4 HTML for a non-partner (found ${driveHits})`);
    ok(!nonPartner.html.includes("FAKE_PDF_FILE_ID_4"), "the PDF's Drive file ID never appears in page source");

    section("Partner unlock â€” PARTNER=true takes effect on the NEXT request");
    await setMerge({ PARTNER: "true" });
    await bustCache();
    const asPartner = await get(`/class/4?t=${TOKEN}`);
    ok(!asPartner.html.includes("Unlocked for partners"), "no format remains partner-locked");
    const openLinks = (asPartner.visible.match(/\/api\/class\/file\?/g) ?? []).length;
    ok(openLinks > 0, `open links rendered for a partner (${openLinks})`);

    section("Classes 1-4a are fully open to BOTH states");
    for (const partner of ["true", "false"]) {
        await setMerge({ PARTNER: partner });
        await bustCache();
        for (const slug of ["1", "2", "3", "4a"]) {
            const r = await get(`/class/${slug}?t=${TOKEN}`);
            const lockedRows = (r.visible.match(/Unlocked for partners/g) ?? []).length;
            ok(lockedRows === 0, `class ${slug} fully open (PARTNER=${partner})`);
        }
    }

    section("Cancellation â€” access is revoked on the very next request");
    await setMerge({ PARTNER: "true" });
    await bustCache();
    const before = await get(`/class/4?t=${TOKEN}`);
    ok(!before.html.includes("Unlocked for partners"), "partner has full access before cancelling");
    // Simulates what the Stripe cancellation webhook does (deactivatePartner
    // sets PARTNER=false AND invalidates the cached snapshot).
    await setMerge({ PARTNER: "false" });
    await bustCache();
    const after = await get(`/class/4?t=${TOKEN}`);
    const afterLocked = (after.visible.match(/Unlocked for partners/g) ?? []).length;
    ok(afterLocked === 6, `immediately after revoke, the five formats + quiz are locked again (got ${afterLocked})`);
    const vidAfter = await fetch(`${BASE}/api/class/file?t=${TOKEN}&slug=4&format=video`);
    ok(vidAfter.status === 403, `and the proxy refuses the gated format â†’ 403 (got ${vidAfter.status})`);

    section("Missing COURSESTART fails SAFE");
    await setMerge({ CSTART: "" });
    await bustCache();
    const safe4a = await get(`/class/4a?t=${TOKEN}`);
    const safe4 = await get(`/class/4?t=${TOKEN}`);
    ok(!safe4a.html.includes("hasn&#x27;t opened yet"), "class 4a still open without a start date");
    ok(safe4.html.includes("hasn&#x27;t opened yet"), "class 4 is NOT granted (no full-access fallback)");
    await setMerge({ CSTART: daysAgo(4) });
    await bustCache();

    section("Fallback â€” unrecognised ?t= offers the email lookup");
    const bad = await get(`/class/4?t=totally-unknown-token-abcdefghijklmn`);
    ok(bad.status === 200, "unknown token still renders a friendly page (not an error)");
    ok(bad.html.includes("find your place in the training"), "shows the email fallback form");
    ok(bad.html.includes("/join"), "and links to /join for people not enrolled");

    const idRes = await fetch(`${BASE}/api/class/identify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: EMAIL }),
    });
    const idJson = await idRes.json();
    ok(idRes.ok && idJson.found === true, "identify endpoint finds the real contact");
    ok(typeof idJson.token === "string" && idJson.token.length >= 32, "and returns a usable token");

    const missRes = await fetch(`${BASE}/api/class/identify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: `nobody${Date.now()}@example.com` }),
    });
    const missJson = await missRes.json();
    ok(missJson.found === false, "an unknown address is reported as not found (routed to /join)");

    section("Unknown class slug");
    const missing = await get(`/class/does-not-exist?t=${TOKEN}`);
    // NOTE: this route streams (loading.tsx), so the HTTP status is committed
    // before the slug is resolved and Next cannot turn it into a 404 afterwards.
    // Assert the CONTENT, which is what a subscriber actually sees.
    ok(
        missing.html.includes("couldn&#x27;t find that class") ||
            missing.html.includes("couldn't find that class"),
        "unknown slug shows a friendly 'class not found' page"
    );
    ok(!missing.html.includes("Class Four Title"), "and does not leak another class's content");
} catch (err) {
    if (!err?.preflight) {
        fail++;
        console.error("\nE2E ERROR:", err);
    }
} finally {
    console.log("\n=== Cleanup ===");
    try {
        const del = await fetch(`${mc}/members/${hash(EMAIL)}/actions/delete-permanent`, {
            method: "POST",
            headers: H,
        });
        console.log(del.ok ? "  PASS  test contact permanently deleted" : `  WARN  cleanup ${del.status}`);
    } catch (e) {
        console.log("  WARN  cleanup failed:", e.message);
    }
    await kv(["DEL", `jbc:ctoken:${TOKEN}`]);
    await bustCache();
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
}


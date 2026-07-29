// scripts/inspect-sheet.mjs
// Reads the REAL manifest Sheet through the real service account and reports
// exactly what is in it. Bypasses CLASS_MANIFEST_FIXTURE entirely.
//   node --env-file=.env.local scripts/inspect-sheet.mjs
import { JWT } from "google-auth-library";
import { parseManifestRows } from "../src/lib/manifest-parse.ts";

const RAW = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64;
const SHEET_ID = process.env.CLASS_MANIFEST_SHEET_ID;
const RANGE = process.env.CLASS_MANIFEST_RANGE ?? "A1:K200";

if (!RAW || !SHEET_ID) {
    console.error("Missing GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 or CLASS_MANIFEST_SHEET_ID");
    process.exit(1);
}

const text = RAW.trim().startsWith("{") ? RAW : Buffer.from(RAW.trim(), "base64").toString("utf8");
const creds = JSON.parse(text);
console.log("service account:", creds.client_email);
console.log("sheet id:", SHEET_ID);
console.log("range:", RANGE);

const client = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: [
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/spreadsheets.readonly",
    ],
});
const { token } = await client.getAccessToken();
console.log("access token minted:", Boolean(token));

const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(SHEET_ID)}/values/${encodeURIComponent(RANGE)}?majorDimension=ROWS`;

let res = null;
for (let attempt = 1; attempt <= 4; attempt++) {
    try {
        res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
            signal: AbortSignal.timeout(30000),
        });
        console.log(`sheets GET (attempt ${attempt}):`, res.status);
        break;
    } catch (err) {
        console.log(`sheets GET (attempt ${attempt}) FAILED: ${err?.cause?.code ?? err.message}`);
        if (attempt === 4) {
            console.error("\nCould not reach sheets.googleapis.com from this environment.");
            process.exit(2);
        }
        await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
}
if (!res.ok) {
    console.error((await res.text()).slice(0, 800));
    process.exit(1);
}
const json = await res.json();
const values = json.values ?? [];
console.log("raw rows returned:", values.length);
console.log("\n=== HEADER ROW ===");
console.log(JSON.stringify(values[0]));

const { classes, warnings } = parseManifestRows(values);
console.log(`\n=== PARSED: ${classes.length} classes, ${warnings.length} warning(s) ===`);
if (warnings.length) {
    console.log("WARNINGS:");
    for (const w of warnings) console.log("  •", w);
} else {
    console.log("(no warnings — every row parsed cleanly)");
}

console.log("\n=== CLASSES (release order) ===");
const ordered = [...classes].sort((a, b) => a.sequencePosition - b.sequencePosition);
for (const c of ordered.slice(0, 15)) {
    const formats = Object.keys(c.files).length;
    console.log(
        `  pos ${String(c.sequencePosition).padStart(3)}  slug ${String(c.slug).padEnd(5)} ` +
        `formats=${formats}/7 quiz=${c.quizUrl ? "yes" : "no "}  ${c.title.slice(0, 46)}`
    );
}
if (ordered.length > 15) console.log(`  … and ${ordered.length - 15} more`);

console.log("\n=== 4 vs 4a ===");
const four = classes.find((c) => c.slug.toLowerCase() === "4");
const fourA = classes.find((c) => c.slug.toLowerCase() === "4a");
console.log("  slug '4' :", four ? `pos ${four.sequencePosition} — ${four.title}` : "NOT PRESENT");
console.log("  slug '4a':", fourA ? `pos ${fourA.sequencePosition} — ${fourA.title}` : "NOT PRESENT");
if (four && fourA) {
    console.log("  distinct titles:", four.title !== fourA.title);
    console.log("  distinct positions:", four.sequencePosition !== fourA.sequencePosition);
    console.log("  4a sorts before 4:", fourA.sequencePosition < four.sequencePosition);
}

console.log("\n=== QUIZ URLS ===");
for (const c of ordered.filter((c) => c.quizUrl).slice(0, 10)) {
    console.log(`  ${c.slug.padEnd(5)} ${c.quizUrl}`);
}
const noQuiz = ordered.filter((c) => !c.quizUrl).length;
console.log(`  (${noQuiz} class(es) have no quiz_url — those render no quiz row)`);

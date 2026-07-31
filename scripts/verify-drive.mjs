// scripts/verify-drive.mjs
// First real exercise of the Drive path: reads the live manifest, then for each
// file id on the first class fetches metadata AND streams the first bytes,
// proving the service account can actually serve the files (not just the sheet).
import { JWT } from "google-auth-library";
import { parseManifestRows } from "../src/lib/manifest-parse.ts";

const RAW = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64;
const SHEET_ID = process.env.CLASS_MANIFEST_SHEET_ID;
const RANGE = process.env.CLASS_MANIFEST_RANGE ?? "A1:K200";
const PROXY_MAX = Number(process.env.CLASS_PROXY_MAX_BYTES ?? 4_000_000);

const text = RAW.trim().startsWith("{") ? RAW : Buffer.from(RAW.trim(), "base64").toString("utf8");
const creds = JSON.parse(text);
const client = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: [
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/spreadsheets.readonly",
    ],
});
const { token } = await client.getAccessToken();

const rq = async (url, init = {}, tries = 4) => {
    for (let i = 1; i <= tries; i++) {
        try {
            return await fetch(url, {
                ...init,
                headers: { Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
                signal: AbortSignal.timeout(30000),
            });
        } catch (e) {
            if (i === tries) throw e;
            await new Promise((r) => setTimeout(r, 1500 * i));
        }
    }
};

const sheet = await rq(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(SHEET_ID)}/values/${encodeURIComponent(RANGE)}?majorDimension=ROWS`
);
const { classes } = parseManifestRows((await sheet.json()).values ?? []);
console.log(`manifest: ${classes.length} class(es)\n`);

let proxied = 0;
let preview = 0;
let failed = 0;

for (const c of classes) {
    console.log(`=== class ${c.slug} — ${c.title} ===`);
    if (c.quizUrl) console.log(`  quiz_url: ${c.quizUrl}`);
    for (const [fmt, id] of Object.entries(c.files)) {
        const metaRes = await rq(
            `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?fields=id,name,mimeType,size&supportsAllDrives=true`
        );
        if (!metaRes.ok) {
            failed++;
            console.log(`  ${fmt.padEnd(11)} META FAILED ${metaRes.status} — ${(await metaRes.text()).slice(0, 120)}`);
            continue;
        }
        const meta = await metaRes.json();
        const size = meta.size ? Number(meta.size) : null;
        const route = size == null
            ? (fmt === "video" || fmt === "podcast" ? "preview" : "proxy")
            : (size <= PROXY_MAX ? "proxy" : "preview");
        if (route === "proxy") proxied++; else preview++;

        // Prove we can actually pull the bytes (Range keeps it to 1 KB).
        let bytesOk = "n/a (preview path)";
        if (route === "proxy") {
            const dl = await rq(
                `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?alt=media&supportsAllDrives=true`,
                { headers: { Range: "bytes=0-1023" } }
            );
            const buf = dl.ok ? Buffer.from(await dl.arrayBuffer()) : null;
            bytesOk = dl.ok ? `OK ${buf.length}B "${buf.subarray(0, 5).toString("latin1").replace(/[^\x20-\x7e]/g, ".")}"` : `FAILED ${dl.status}`;
            if (!dl.ok) failed++;
        }
        console.log(
            `  ${fmt.padEnd(11)} ${String(size ?? "?").padStart(9)}B  ${String(meta.mimeType).slice(0, 28).padEnd(30)} -> ${route.padEnd(7)} ${bytesOk}`
        );
    }
    const missing = 6 - Object.keys(c.files).length;
    if (missing > 0) console.log(`  (${missing} format(s) absent -> "Coming soon" rows)`);
}

console.log(`\nsummary: ${proxied} proxied, ${preview} preview, ${failed} failure(s)`);
process.exit(failed ? 1 : 0);

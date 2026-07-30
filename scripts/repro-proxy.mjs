// scripts/repro-proxy.mjs
// Reproduces the /api/class/file proxy path step by step against REAL Drive
// files, so we see which step actually throws rather than the generic
// "temporarily unavailable" the route converts everything into.
import { JWT } from "google-auth-library";
import { parseManifestRows } from "../src/lib/manifest-parse.ts";
import { contentDisposition } from "../src/lib/content-disposition.ts";

const RAW = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64;
const SHEET_ID = process.env.CLASS_MANIFEST_SHEET_ID;
const creds = JSON.parse(RAW.trim().startsWith("{") ? RAW : Buffer.from(RAW.trim(), "base64").toString("utf8"));
const client = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: [
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/spreadsheets.readonly",
    ],
});
const { token } = await client.getAccessToken();

const rq = async (url, init = {}, tries = 3) => {
    for (let i = 1; i <= tries; i++) {
        try {
            return await fetch(url, {
                ...init,
                headers: { Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
                signal: AbortSignal.timeout(30000),
            });
        } catch (e) {
            if (i === tries) throw e;
            await new Promise((r) => setTimeout(r, 1200 * i));
        }
    }
};

const sheetRes = await rq(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/A1:K200?majorDimension=ROWS`
);
const { classes } = parseManifestRows((await sheetRes.json()).values ?? []);
const klass = classes.find((c) => c.slug === "1");
console.log(`class 1: "${klass.title}"`);
console.log(`formats present: ${Object.keys(klass.files).join(", ")}\n`);

for (const fmt of ["pdf", "brief", "scriptures", "slides"]) {
    const fileId = klass.files[fmt];
    console.log(`════ format="${fmt}" fileId=${fileId ?? "(ABSENT)"} ════`);
    if (!fileId) {
        console.log("  -> no file id in manifest; route would 404\n");
        continue;
    }

    // STEP 1 — metadata (as getDriveFileMeta does)
    const metaRes = await rq(
        `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size&supportsAllDrives=true`
    );
    console.log(`  step1 meta      : HTTP ${metaRes.status}`);
    if (!metaRes.ok) {
        console.log("    body:", (await metaRes.text()).slice(0, 200));
        continue;
    }
    const meta = await metaRes.json();
    console.log(`    name="${meta.name}" mime=${meta.mimeType} size=${meta.size}`);

    // STEP 2 — byte stream (as fetchDriveFileStream does)
    const dl = await rq(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`
    );
    console.log(`  step2 alt=media : HTTP ${dl.status} hasBody=${Boolean(dl.body)}`);
    if (!dl.ok) {
        console.log("    body:", (await dl.text()).slice(0, 300));
        continue;
    }
    const contentType = dl.headers.get("content-type");
    const contentLength = dl.headers.get("content-length");
    console.log(`    upstream content-type=${contentType} content-length=${contentLength}`);

    // STEP 3 — build the response headers EXACTLY as the route does.
    try {
        const safeTitle = klass.title.replace(/[^\p{L}\p{N} \-_]/gu, "").trim() || `Class ${klass.slug}`;
        const ext = (meta?.name?.match(/\.[a-z0-9]+$/i)?.[0] ?? "").toLowerCase();
        // Now matches the route: hyphen, and the header value is built by the
        // shared sanitiser instead of raw interpolation.
        const filename = `JBC Class ${klass.slug} - ${safeTitle}${ext}`;
        console.log(`  step3 filename  : ${JSON.stringify(filename)}`);

        const headers = new Headers();
        headers.set("Content-Type", meta?.mimeType || contentType);
        headers.set("Content-Disposition", contentDisposition("inline", filename));
        if (contentLength) headers.set("Content-Length", contentLength);
        headers.set("Cache-Control", "private, no-store");
        headers.set("X-Content-Type-Options", "nosniff");
        console.log("  step3 headers   : OK");

        const bytes = Buffer.from(await dl.arrayBuffer());
        console.log(`  step4 body      : ${bytes.length} bytes, magic="${bytes.subarray(0, 4).toString("latin1").replace(/[^\x20-\x7e]/g, ".")}"`);
        console.log("  RESULT: would SUCCEED\n");
    } catch (err) {
        console.log(`  *** THREW: ${err.constructor.name}: ${err.message}`);
        console.log(`  *** This is caught by the route's generic catch and returned as`);
        console.log(`  *** "This file is temporarily unavailable. Please try again shortly." (502)\n`);
    }
}

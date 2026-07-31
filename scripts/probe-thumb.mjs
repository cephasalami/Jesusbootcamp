// Does Drive expose a usable video poster frame for our class files, and can the
// service account actually fetch it? Verify before building anything on it.
import { JWT } from "google-auth-library";
import { parseManifestRows } from "../src/lib/manifest-parse.ts";

const RAW = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64;
const SHEET_ID = process.env.CLASS_MANIFEST_SHEET_ID;
const creds = JSON.parse(RAW.trim().startsWith("{") ? RAW : Buffer.from(RAW.trim(), "base64").toString("utf8"));
const client = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ["https://www.googleapis.com/auth/drive.readonly", "https://www.googleapis.com/auth/spreadsheets.readonly"],
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

const sheet = await rq(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/A1:K200?majorDimension=ROWS`);
const { classes } = parseManifestRows((await sheet.json()).values ?? []);

for (const slug of ["1", "5"]) {
    const k = classes.find((c) => c.slug === slug);
    if (!k) continue;
    const fileId = k.files.video;
    console.log(`\n════ class ${slug} video=${fileId ?? "(none)"} ════`);
    if (!fileId) continue;

    const metaRes = await rq(
        `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size,thumbnailLink,hasThumbnail,videoMediaMetadata&supportsAllDrives=true`
    );
    console.log("  meta HTTP", metaRes.status);
    if (!metaRes.ok) { console.log("   ", (await metaRes.text()).slice(0, 200)); continue; }
    const meta = await metaRes.json();
    console.log("  mimeType     :", meta.mimeType);
    console.log("  hasThumbnail :", meta.hasThumbnail);
    console.log("  videoMeta    :", JSON.stringify(meta.videoMediaMetadata ?? null));
    console.log("  thumbnailLink:", meta.thumbnailLink ? meta.thumbnailLink.slice(0, 110) + "..." : "(none)");

    if (!meta.thumbnailLink) continue;

    // Can we fetch it WITH the bearer token?
    for (const [label, init] of [
        ["with auth   ", {}],
        ["no auth     ", { headers: { Authorization: undefined } }],
    ]) {
        try {
            const r = label.trim() === "no auth"
                ? await fetch(meta.thumbnailLink, { signal: AbortSignal.timeout(20000) })
                : await rq(meta.thumbnailLink);
            const ct = r.headers.get("content-type");
            let bytes = 0, magic = "";
            if (r.ok) { const b = Buffer.from(await r.arrayBuffer()); bytes = b.length; magic = b.subarray(0, 4).toString("latin1").replace(/[^\x20-\x7e]/g, "."); }
            console.log(`  fetch ${label}: HTTP ${r.status} ct=${ct} bytes=${bytes} magic="${magic}"`);
        } catch (e) {
            console.log(`  fetch ${label}: ERROR ${e.message}`);
        }
    }

    // Larger poster: thumbnailLink supports a size suffix (=s220 -> =s1600).
    const big = meta.thumbnailLink.replace(/=s\d+$/, "=s1600");
    try {
        const r = await rq(big);
        const b = r.ok ? Buffer.from(await r.arrayBuffer()) : null;
        console.log(`  fetch s1600  : HTTP ${r.status} bytes=${b ? b.length : 0}`);
    } catch (e) {
        console.log("  fetch s1600  : ERROR", e.message);
    }
}

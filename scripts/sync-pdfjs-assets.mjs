// scripts/sync-pdfjs-assets.mjs
//
// pdf.js runs its parser in a Web Worker and loads a few data files (character
// maps, the base-14 font metrics, the image-decoder wasm) at runtime by URL.
// None of that can be bundled, so it is copied out of node_modules into
// public/pdfjs at install and build time — which also guarantees the worker can
// never drift from the pdfjs-dist version the app imports.
//
// public/pdfjs is gitignored: it is generated, not authored.
//
// Runs from `postinstall` and `prebuild`, and is deliberately forgiving — a
// missing package must not break an install that has not finished yet.
import { cp, mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const from = path.join(root, "node_modules", "pdfjs-dist");
const to = path.join(root, "public", "pdfjs");

// The legacy build is transpiled further than the default one, so the viewer
// keeps working on the older phone browsers a good part of this audience uses.
const ASSETS = [
    ["legacy/build/pdf.worker.min.mjs", "pdf.worker.min.mjs"],
    ["cmaps", "cmaps"],
    ["standard_fonts", "standard_fonts"],
    ["wasm", "wasm"],
];

async function exists(target) {
    try {
        await stat(target);
        return true;
    } catch {
        return false;
    }
}

if (!(await exists(from))) {
    console.warn("[pdfjs] pdfjs-dist is not installed yet — skipping asset sync.");
    process.exit(0);
}

await rm(to, { recursive: true, force: true });
await mkdir(to, { recursive: true });

for (const [source, target] of ASSETS) {
    const src = path.join(from, source);
    if (!(await exists(src))) {
        console.warn(`[pdfjs] missing ${source} in pdfjs-dist — skipped.`);
        continue;
    }
    await cp(src, path.join(to, target), { recursive: true });
}

console.log(`[pdfjs] synced runtime assets to public/pdfjs`);

// src/lib/manifest.ts — SERVER-ONLY class manifest (the Google Sheet).
//
// Class metadata changes often and is edited by non-technical people, so NO
// file IDs are hardcoded anywhere in the codebase — this is the only source.
//
// Caching (Part 2): in-process for the fast path, plus Upstash KV so the cache
// and the "last known good" copy are shared across serverless instances and
// survive an instance being recycled. If the Sheet is unreachable when the
// cache expires we serve the last known good manifest and log loudly — a few
// stale minutes is far better than every class page breaking.
// Explicit .ts extensions (as in subscriber.ts, kv.ts and the rest of lib):
// Next resolves either form, but Node's ESM loader only resolves the explicit
// one — and `scripts/*.mts` import this module directly.
import { getAccessToken } from "./google-auth.ts";
import { kvGetJson, kvSetJson } from "./kv.ts";
import { parseManifestRows } from "./manifest-parse.ts";
import type { ClassRecord } from "./access.ts";
import { manifestColumnForMaterial, type MaterialLinkFormat } from "./material-link.ts";
import type { NewManifestClass } from "./manifest-class.ts";

const SHEET_ID = process.env.CLASS_MANIFEST_SHEET_ID;
/** A1 range covering every column through `sendgrid_template_id` (11 columns: A-K). */
const SHEET_RANGE = process.env.CLASS_MANIFEST_RANGE ?? "A1:K200";

const TTL_MS = 7 * 60 * 1000; // inside the 5-10 min window the spec asks for
const KV_KEY = "jbc:manifest:v1";
const KV_TTL_SEC = 24 * 60 * 60; // last-known-good survives well past a Sheets outage

export const isManifestConfigured = Boolean(SHEET_ID);

type CacheEntry = { classes: ClassRecord[]; fetchedAt: number };

let memo: CacheEntry | null = null;
let inflight: Promise<ClassRecord[]> | null = null;

/** Dev/test escape hatch: a local fixture so the page is runnable without Google credentials. */
function fixtureClasses(): ClassRecord[] | null {
    const raw = process.env.CLASS_MANIFEST_FIXTURE;
    if (!raw) return null;

    // SAFETY: a fixture must never mask a real, configured Sheet. Leaving one
    // set in an environment that has CLASS_MANIFEST_SHEET_ID would silently
    // serve test data to real subscribers — and would make a test suite "pass"
    // against fixture rows while appearing to exercise production data.
    if (SHEET_ID) {
        console.error(
            "[manifest] CLASS_MANIFEST_FIXTURE is set but CLASS_MANIFEST_SHEET_ID is also configured — " +
                "IGNORING the fixture and reading the real Sheet. Remove CLASS_MANIFEST_FIXTURE."
        );
        return null;
    }
    try {
        // Accept base64 OR raw JSON. Base64 is the documented form because
        // dotenv does not unescape \" inside a double-quoted value, so a raw
        // JSON fixture silently arrives as invalid JSON.
        const text = raw.trim().startsWith("{")
            ? raw
            : Buffer.from(raw.trim(), "base64").toString("utf8");
        const parsed = JSON.parse(text) as { values?: string[][] };
        const { classes, warnings } = parseManifestRows(parsed.values ?? []);
        if (warnings.length) console.warn(`[manifest] fixture warnings:\n  ${warnings.join("\n  ")}`);
        return classes;
    } catch (err) {
        console.error("[manifest] CLASS_MANIFEST_FIXTURE is not valid JSON:", err);
        return null;
    }
}

async function fetchFromSheet(): Promise<ClassRecord[] | null> {
    if (!SHEET_ID) return null;
    const token = await getAccessToken();
    if (!token) {
        console.error("[manifest] no Google access token — cannot read the manifest sheet");
        return null;
    }
    try {
        const url =
            `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(SHEET_ID)}` +
            `/values/${encodeURIComponent(SHEET_RANGE)}?majorDimension=ROWS`;

        // Observed in practice: the connection to sheets.googleapis.com
        // intermittently times out. Without a retry a single blip drops us to
        // the stale/empty path, so try a few times with a short backoff before
        // giving up. Total worst case stays well inside the function timeout.
        let res: Response | null = null;
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                res = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: "no-store",
                    signal: AbortSignal.timeout(8000),
                });
                break;
            } catch (err) {
                const reason = err instanceof Error ? err.message : "unknown";
                console.warn(`[manifest] Sheets read attempt ${attempt}/3 failed: ${reason}`);
                if (attempt === 3) return null;
                await new Promise((r) => setTimeout(r, 400 * attempt));
            }
        }
        if (!res) return null;

        if (!res.ok) {
            const detail = (await res.text()).slice(0, 300);
            console.error(`[manifest] Sheets read failed (${res.status}): ${detail}`);
            return null;
        }
        const json = (await res.json()) as { values?: string[][] };
        const { classes, warnings } = parseManifestRows(json.values ?? []);

        // Loud, per Part 2 — a skipped row is a content bug someone must fix.
        if (warnings.length) {
            console.warn(`[manifest] ${warnings.length} row warning(s):\n  ${warnings.join("\n  ")}`);
        }
        if (classes.length === 0) {
            console.error("[manifest] sheet produced 0 usable classes — refusing to cache an empty manifest");
            return null;
        }
        return classes;
    } catch (err) {
        console.error("[manifest] Sheets read errored:", err);
        return null;
    }
}

/**
 * The full class list. Never throws: on failure it degrades to the last known
 * good copy (in-process, then KV), and only returns [] if nothing has ever
 * loaded — in which case the page shows a friendly "temporarily unavailable".
 */
export async function getManifest(): Promise<ClassRecord[]> {
    const fixture = fixtureClasses();
    if (fixture) return fixture;

    if (memo && Date.now() - memo.fetchedAt < TTL_MS) return memo.classes;

    // Collapse concurrent refreshes so a cold cache doesn't fan out N Sheets calls.
    if (inflight) return inflight;

    inflight = (async () => {
        try {
            const fresh = await fetchFromSheet();
            if (fresh) {
                memo = { classes: fresh, fetchedAt: Date.now() };
                // Best-effort shared copy for other instances / cold starts.
                void kvSetJson(KV_KEY, fresh, KV_TTL_SEC);
                return fresh;
            }

            // ── Degrade: last known good ──
            if (memo) {
                console.error(
                    `[manifest] SERVING STALE manifest (${Math.round((Date.now() - memo.fetchedAt) / 1000)}s old) — Sheets unreachable`
                );
                // Push the expiry out so we retry on the next TTL rather than every request.
                memo = { classes: memo.classes, fetchedAt: Date.now() - TTL_MS + 60_000 };
                return memo.classes;
            }

            const shared = await kvGetJson<ClassRecord[]>(KV_KEY);
            if (shared?.length) {
                console.error("[manifest] SERVING STALE manifest from KV — Sheets unreachable and no local copy");
                memo = { classes: shared, fetchedAt: Date.now() - TTL_MS + 60_000 };
                return shared;
            }

            console.error("[manifest] NO manifest available (no fresh read, no cached copy)");
            return [];
        } finally {
            inflight = null;
        }
    })();

    return inflight;
}

/** Force the next getManifest() to re-read the sheet (used by tests/tools). */
export function invalidateManifestCache(): void {
    memo = null;
}

type ManifestWriteResult = { ok: true } | { ok: false; error: string };

/** Convert a zero-based spreadsheet column number into A1 notation. */
function a1Column(column: number): string {
    let value = column + 1;
    let letters = "";
    while (value > 0) {
        const remainder = (value - 1) % 26;
        letters = String.fromCharCode(65 + remainder) + letters;
        value = Math.floor((value - 1) / 26);
    }
    return letters;
}

/**
 * The manifest range is normally A1:K200. Respect a custom starting cell too
 * so a sheet tab prefix or a shifted range cannot put a write in the wrong
 * column or row.
 */
function rangeStart(range: string): { prefix: string; column: number; row: number } | null {
    const match = range.trim().match(/^(.*!|)([A-Za-z]+)(\d+)(?::[A-Za-z]+\d+)?$/);
    if (!match) return null;

    const letters = match[2].toUpperCase();
    let column = 0;
    for (const letter of letters) column = column * 26 + letter.charCodeAt(0) - 64;
    return { prefix: match[1], column: column - 1, row: Number(match[3]) };
}

async function readManifestRowsForWrite(token: string): Promise<string[][] | null> {
    if (!SHEET_ID) return null;
    const url =
        `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(SHEET_ID)}` +
        `/values/${encodeURIComponent(SHEET_RANGE)}?majorDimension=ROWS`;
    try {
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
            signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) {
            console.error(`[manifest] unable to read before material update (${res.status}): ${(await res.text()).slice(0, 300)}`);
            return null;
        }
        const json = (await res.json()) as { values?: unknown };
        return Array.isArray(json.values)
            ? json.values.map((row) => (Array.isArray(row) ? row.map((cell) => String(cell ?? "")) : []))
            : [];
    } catch (err) {
        console.error("[manifest] unable to read before material update:", err);
        return null;
    }
}

/**
 * Persist one material value from the protected dashboard. The sheet remains
 * the single source of truth: learner-facing class pages continue to resolve
 * every material fresh from this same manifest.
 */
export async function updateManifestMaterialLink(input: {
    classSlug: string;
    format: MaterialLinkFormat;
    value: string;
}): Promise<ManifestWriteResult> {
    if (!SHEET_ID) {
        return { ok: false, error: "The class manifest Sheet is not configured in this environment." };
    }
    if (fixtureClasses()) {
        return { ok: false, error: "Material links cannot be saved while a local manifest fixture is active." };
    }

    const token = await getAccessToken();
    if (!token) return { ok: false, error: "Google credentials are unavailable. Please try again later." };

    const rows = await readManifestRowsForWrite(token);
    if (!rows?.length) {
        return { ok: false, error: "The manifest Sheet could not be read before saving. Nothing was changed." };
    }

    const headers = rows[0].map((header) => header.trim().toLowerCase());
    const slugColumn = headers.indexOf("slug");
    const materialColumn = headers.indexOf(manifestColumnForMaterial(input.format));
    if (slugColumn === -1 || materialColumn === -1) {
        return {
            ok: false,
            error: `The manifest Sheet needs both a slug column and ${manifestColumnForMaterial(input.format)} column before this material can be saved.`,
        };
    }

    const wantSlug = input.classSlug.trim().toLowerCase();
    const matchingRows = rows
        .slice(1)
        .map((row, index) => ({ row, index: index + 1 }))
        .filter(({ row }) => row[slugColumn]?.trim().toLowerCase() === wantSlug);
    if (matchingRows.length !== 1) {
        return {
            ok: false,
            error:
                matchingRows.length === 0
                    ? "That class is no longer in the manifest Sheet. Refresh the page and try again."
                    : "The manifest Sheet has duplicate class slugs. Fix the duplicates before saving a material link.",
        };
    }

    const start = rangeStart(SHEET_RANGE);
    if (!start) {
        return { ok: false, error: "CLASS_MANIFEST_RANGE is not a supported A1 range, so no update was made." };
    }

    const rowNumber = start.row + matchingRows[0].index;
    const columnName = a1Column(start.column + materialColumn);
    const cell = `${start.prefix}${columnName}${rowNumber}`;
    const url =
        `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(SHEET_ID)}` +
        `/values/${encodeURIComponent(cell)}?valueInputOption=RAW`;

    try {
        const res = await fetch(url, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ values: [[input.value]] }),
            cache: "no-store",
            signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) {
            console.error(`[manifest] material update failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
            return {
                ok: false,
                error:
                    res.status === 403
                        ? "Google denied the update. Share the manifest Sheet with the service account as an Editor."
                        : "Google could not save the material link. Nothing was changed; please try again.",
            };
        }
    } catch (err) {
        console.error("[manifest] material update errored:", err);
        return { ok: false, error: "Google could not save the material link. Nothing was changed; please try again." };
    }

    invalidateManifestCache();
    return { ok: true };
}

/**
 * Append a brand-new class to the manifest. Every material cell is deliberately
 * blank: a class only becomes publishable as each Drive link is added through
 * the material manager, and an empty cell renders as "Coming soon" rather than
 * a broken learner link.
 */
export async function createManifestClass(input: NewManifestClass): Promise<ManifestWriteResult> {
    if (!SHEET_ID) {
        return { ok: false, error: "The class manifest Sheet is not configured in this environment." };
    }
    if (fixtureClasses()) {
        return { ok: false, error: "Classes cannot be created while a local manifest fixture is active." };
    }

    const token = await getAccessToken();
    if (!token) return { ok: false, error: "Google credentials are unavailable. Please try again later." };

    const rows = await readManifestRowsForWrite(token);
    if (!rows?.length) {
        return { ok: false, error: "The manifest Sheet could not be read before creating a class. Nothing was changed." };
    }

    const headers = rows[0].map((header) => header.trim().toLowerCase());
    const slugColumn = headers.indexOf("slug");
    const sequenceColumn = headers.indexOf("sequence_position");
    const titleColumn = headers.indexOf("title");
    if (slugColumn === -1 || sequenceColumn === -1 || titleColumn === -1) {
        return {
            ok: false,
            error: "The manifest Sheet needs slug, sequence_position and title columns before a class can be created.",
        };
    }

    const wantSlug = input.slug.toLowerCase();
    if (rows.slice(1).some((row) => row[slugColumn]?.trim().toLowerCase() === wantSlug)) {
        return { ok: false, error: `Class ${input.slug.toUpperCase()} already exists. Choose a different class slug.` };
    }
    if (rows.slice(1).some((row) => {
        const rawPosition = row[sequenceColumn]?.trim() ?? "";
        if (!/^\d+$/.test(rawPosition)) return false;
        return Number(rawPosition) === input.sequencePosition;
    })) {
        return {
            ok: false,
            error: `Release position ${input.sequencePosition} is already used. Choose the next unused position so the drip order stays clear.`,
        };
    }

    const row = headers.map((header) => {
        if (header === "slug") return input.slug;
        if (header === "sequence_position") return String(input.sequencePosition);
        if (header === "title") return input.title;
        return "";
    });
    const url =
        `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(SHEET_ID)}` +
        `/values/${encodeURIComponent(SHEET_RANGE)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ majorDimension: "ROWS", values: [row] }),
            cache: "no-store",
            signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) {
            console.error(`[manifest] class creation failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
            return {
                ok: false,
                error:
                    res.status === 403
                        ? "Google denied the update. Share the manifest Sheet with the service account as an Editor."
                        : "Google could not create the class. Nothing was changed; please try again.",
            };
        }
    } catch (err) {
        console.error("[manifest] class creation errored:", err);
        return { ok: false, error: "Google could not create the class. Nothing was changed; please try again." };
    }

    invalidateManifestCache();
    return { ok: true };
}

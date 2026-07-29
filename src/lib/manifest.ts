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
import { getAccessToken } from "./google-auth";
import { kvGetJson, kvSetJson } from "./kv";
import { parseManifestRows } from "./manifest-parse";
import type { ClassRecord } from "./access";

const SHEET_ID = process.env.CLASS_MANIFEST_SHEET_ID;
/** A1 range covering every column through `quiz_url` (11 columns: A-K). */
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

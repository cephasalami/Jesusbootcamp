// src/lib/manifest-parse.ts
//
// PURE parsing + validation of the class manifest (the Google Sheet). Kept free
// of network/auth imports so it can be unit-tested directly with `node --test`.
//
// One malformed row (a typo made while editing the sheet) must never take down
// every class page — bad rows are logged and skipped, good rows still load.
import type { ClassRecord, FormatKey } from "./access.ts";

/** Sheet header → ClassRecord.files key. */
const FILE_COLUMNS: Record<string, FormatKey> = {
    pdf_file_id: "pdf",
    video_file_id: "video",
    podcast_file_id: "podcast",
    brief_file_id: "brief",
    slides_file_id: "slides",
    scriptures_file_id: "scriptures",
};

export const REQUIRED_HEADERS = ["slug", "sequence_position", "title"] as const;

/**
 * Validate the `quiz_url` cell.
 *
 * This is a plain external link (typically a Google Form) — NOT a Drive file
 * id. It is never proxied, embedded, or sent to the Drive API.
 *
 * Returns the URL to use, or undefined to render no quiz row at all. Anything
 * rejected pushes a warning; nothing is ever silently accepted.
 */
export function validateQuizUrl(
    raw: string,
    label: string,
    warnings: string[]
): string | undefined {
    const value = String(raw ?? "").trim();
    if (!value) return undefined; // no quiz for this class — expected, not a warning

    let parsed: URL;
    try {
        parsed = new URL(value);
    } catch {
        warnings.push(`${label}: quiz_url "${value}" is not a valid URL — quiz row hidden`);
        return undefined;
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        warnings.push(
            `${label}: quiz_url must be http(s), got "${parsed.protocol}" — quiz row hidden`
        );
        return undefined;
    }

    // The mistake that has already happened once for real: pasting the Google
    // Forms EDITOR url. Subscribers must never receive that — at best they hit
    // a permission wall, at worst an editor could alter the live form. Rejected
    // outright rather than shipped to 2,000+ people.
    const isGoogleForm = /(^|\.)google\.com$/i.test(parsed.hostname) && /\/forms\//i.test(parsed.pathname);
    if (isGoogleForm && /\/edit\b/i.test(parsed.pathname)) {
        warnings.push(
            `${label}: quiz_url is a Google Forms EDITOR link (contains "/edit") — ` +
                `use the "Send → link" share URL (…/viewform) instead. Quiz row hidden: ${value}`
        );
        return undefined;
    }
    // Catch the same mistake on any other host too, but don't block it.
    if (!isGoogleForm && /\/edit\b/i.test(parsed.pathname)) {
        warnings.push(`${label}: quiz_url contains "/edit" — double-check this is a shareable link, not an editor view`);
    }

    return value;
}

export type ParseResult = {
    classes: ClassRecord[];
    /** Human-readable reasons rows were skipped — logged loudly by the caller. */
    warnings: string[];
};

/**
 * Parse raw `spreadsheets.values.get` output (row 1 = headers) into validated
 * ClassRecords.
 *
 * Validation rules:
 *  - `slug` must be non-empty and unique across all rows (first wins)
 *  - `sequence_position` must parse as an integer
 *  - empty file-ID cells are EXPECTED and fine — they render "Coming soon"
 */
export function parseManifestRows(rows: string[][]): ParseResult {
    const warnings: string[] = [];
    if (!rows || rows.length === 0) {
        return { classes: [], warnings: ["manifest sheet is empty"] };
    }

    const headers = (rows[0] ?? []).map((h) => String(h ?? "").trim().toLowerCase());
    const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
    if (missing.length) {
        return {
            classes: [],
            warnings: [`manifest sheet is missing required column(s): ${missing.join(", ")}`],
        };
    }

    const col = (name: string) => headers.indexOf(name);
    const slugIdx = col("slug");
    const seqIdx = col("sequence_position");
    const titleIdx = col("title");

    const classes: ClassRecord[] = [];
    const seenSlugs = new Set<string>();
    const seenPositions = new Map<number, string>();

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i] ?? [];
        const rowNo = i + 1; // 1-indexed, matching what the editor sees in Sheets

        // Skip visually-blank rows silently — trailing empties are normal.
        if (row.every((cell) => String(cell ?? "").trim() === "")) continue;

        const slug = String(row[slugIdx] ?? "").trim();
        if (!slug) {
            warnings.push(`row ${rowNo}: skipped — empty slug`);
            continue;
        }
        const slugKey = slug.toLowerCase();
        if (seenSlugs.has(slugKey)) {
            warnings.push(`row ${rowNo}: skipped — duplicate slug "${slug}"`);
            continue;
        }

        const rawSeq = String(row[seqIdx] ?? "").trim();
        // Strict: reject "4a", "", "abc", "1.5". Only a clean integer passes.
        if (!/^-?\d+$/.test(rawSeq)) {
            warnings.push(
                `row ${rowNo} (slug "${slug}"): skipped — sequence_position "${rawSeq}" is not an integer`
            );
            continue;
        }
        const sequencePosition = Number.parseInt(rawSeq, 10);
        // 0 is VALID and in real use: the live sheet's first row is slug "0",
        // position 0 — "Why The Jesus Boot Camp", the intro class. Requiring
        // >= 1 silently hid it from every subscriber. Only negatives are junk.
        if (!Number.isFinite(sequencePosition) || sequencePosition < 0) {
            warnings.push(
                `row ${rowNo} (slug "${slug}"): skipped — sequence_position ${rawSeq} must be >= 0`
            );
            continue;
        }
        if (seenPositions.has(sequencePosition)) {
            // Not fatal (the drip still works) but it means two classes unlock
            // on the same day — worth surfacing.
            warnings.push(
                `row ${rowNo} (slug "${slug}"): sequence_position ${sequencePosition} duplicates slug "${seenPositions.get(sequencePosition)}"`
            );
        }

        const files: Partial<Record<FormatKey, string>> = {};
        for (const [header, key] of Object.entries(FILE_COLUMNS)) {
            const idx = headers.indexOf(header);
            if (idx === -1) continue;
            const id = String(row[idx] ?? "").trim();
            if (id) files[key] = id;
        }

        // quiz_url is a plain external link, kept OUT of `files` so it can never
        // be mistaken for a Drive id and routed through lib/drive.ts.
        const quizIdx = headers.indexOf("quiz_url");
        const quizUrl =
            quizIdx === -1
                ? undefined
                : validateQuizUrl(String(row[quizIdx] ?? ""), `row ${rowNo} (slug "${slug}")`, warnings);

        seenSlugs.add(slugKey);
        seenPositions.set(sequencePosition, slug);
        classes.push({
            slug,
            sequencePosition,
            title: String(row[titleIdx] ?? "").trim() || `Class ${slug}`,
            files,
            ...(quizUrl ? { quizUrl } : {}),
        });
    }

    if (classes.length === 0) warnings.push("manifest produced 0 usable classes");
    return { classes, warnings };
}

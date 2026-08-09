// Normalisation for material links entered through the protected /tracking
// dashboard. Keeping it pure makes the browser preview and server-side save
// use exactly the same validation rules.

export const MATERIAL_LINK_FORMATS = [
    "pdf",
    "video",
    "podcast",
    "brief",
    "slides",
    "scriptures",
    "quiz",
] as const;

export type MaterialLinkFormat = (typeof MATERIAL_LINK_FORMATS)[number];

export const MATERIAL_LINK_LABELS: Record<MaterialLinkFormat, string> = {
    pdf: "Class PDF",
    video: "Full teaching video",
    podcast: "Podcast",
    brief: "Video overview",
    slides: "PowerPoint",
    scriptures: "Main points / scriptures",
    quiz: "Quiz",
};

const MANIFEST_COLUMNS: Record<MaterialLinkFormat, string> = {
    pdf: "pdf_file_id",
    video: "video_file_id",
    podcast: "podcast_file_id",
    brief: "brief_file_id",
    slides: "slides_file_id",
    scriptures: "scriptures_file_id",
    quiz: "quiz_url",
};

export function manifestColumnForMaterial(format: MaterialLinkFormat): string {
    return MANIFEST_COLUMNS[format];
}

const DRIVE_ID = /^[A-Za-z0-9_-]{10,}$/;

/** Return the Drive file ID from a share link, preview link, or already-pasted ID. */
export function driveFileIdFromInput(raw: string): string | null {
    const value = String(raw ?? "").trim();
    if (!value) return null;
    if (DRIVE_ID.test(value)) return value;

    let url: URL;
    try {
        url = new URL(value);
    } catch {
        return null;
    }
    if (url.protocol !== "https:" || !/(^|\.)(drive|docs)\.google\.com$/i.test(url.hostname)) {
        return null;
    }

    const idFromQuery = url.searchParams.get("id");
    if (idFromQuery && DRIVE_ID.test(idFromQuery)) return idFromQuery;

    const idFromPath = url.pathname.match(/\/(?:file|document|presentation|spreadsheets)\/d\/([^/]+)/i)?.[1];
    return idFromPath && DRIVE_ID.test(idFromPath) ? idFromPath : null;
}

/** Validate a public external link (the quiz is the sole non-Drive material). */
export function httpUrlFromInput(raw: string): string | null {
    const value = String(raw ?? "").trim();
    if (!value) return null;
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
    } catch {
        return null;
    }
}

/**
 * A Google Forms editor URL would give a learner an editor/permission error.
 * Match the manifest parser's protection here so an invalid link never looks
 * successful in the dashboard only to disappear from the public class page.
 */
export function quizUrlFromInput(raw: string): string | null {
    const value = httpUrlFromInput(raw);
    if (!value) return null;
    const url = new URL(value);
    const isGoogleForm = /(^|\.)google\.com$/i.test(url.hostname) && /\/forms\//i.test(url.pathname);
    return isGoogleForm && /\/edit\b/i.test(url.pathname) ? null : value;
}

/** The exact normalised value stored in the sheet for a material type. */
export function materialValueFromInput(format: MaterialLinkFormat, raw: string): string | null {
    return format === "quiz" ? quizUrlFromInput(raw) : driveFileIdFromInput(raw);
}

export function previewUrlForMaterial(format: MaterialLinkFormat, raw: string): string | null {
    if (format === "quiz") return quizUrlFromInput(raw);
    const fileId = driveFileIdFromInput(raw);
    return fileId ? `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/preview` : null;
}

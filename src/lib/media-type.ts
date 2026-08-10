// src/lib/media-type.ts
//
// PURE (no imports) so it can be unit-tested directly with `node --test`.
//
// Why this exists: we serve class media with `X-Content-Type-Options: nosniff`,
// which is the right call for a file proxy — but it also means the browser has
// to take our Content-Type at face value, with no chance to sniff its way to
// the correct decoder. Drive stores several of the podcasts as the legacy,
// never-registered `audio/x-m4a`, and Chromium's list of accepted media types
// is not the same on Android as it is on desktop. That combination plays a
// podcast on a laptop and leaves it silent on a phone.
//
// The bytes are AAC in an MP4 container either way; only the label is wrong.

/** Legacy or vendor-prefixed labels mapped to their registered equivalent. */
const ALIASES: Record<string, string> = {
    "audio/x-m4a": "audio/mp4",
    "audio/m4a": "audio/mp4",
    "audio/x-mp4": "audio/mp4",
    "audio/mp3": "audio/mpeg",
    "audio/x-mpeg": "audio/mpeg",
    "audio/x-mpeg-3": "audio/mpeg",
    "audio/x-wav": "audio/wav",
    "video/x-m4v": "video/mp4",
};

/**
 * Normalise a Content-Type for delivery to a browser, preserving any
 * parameters (`; codecs=...`). Falls back to a safe generic type when Drive
 * tells us nothing at all.
 */
export function normalizeMediaType(raw: string | null | undefined): string {
    const value = (raw ?? "").trim();
    if (!value) return "application/octet-stream";

    const semicolon = value.indexOf(";");
    const essence = (semicolon === -1 ? value : value.slice(0, semicolon)).trim().toLowerCase();
    const parameters = semicolon === -1 ? "" : value.slice(semicolon);

    return `${ALIASES[essence] ?? essence}${parameters}`;
}

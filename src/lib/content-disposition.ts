// src/lib/content-disposition.ts
//
// PURE (no imports) so it can be unit-tested directly with `node --test`.
//
// Why this exists: HTTP header values are ByteStrings — every character must be
// <= 255. Interpolating a class title straight into Content-Disposition made
// `Headers.set()` throw a TypeError the moment the value contained an em dash
// (U+2014 = 8212), which is exactly what the filename template used. The route
// caught that throw and returned the generic "temporarily unavailable", so
// EVERY file on the proxy path failed while the preview path (which builds no
// such header) kept working.
//
// Never interpolate untrusted or non-ASCII text into a header. Use this.

/**
 * Build a safe `Content-Disposition` value: a strictly printable-ASCII
 * `filename` for universal compatibility, plus an RFC 5987 `filename*` carrying
 * the real UTF-8 name for browsers that support it.
 */
export function contentDisposition(
    disposition: "inline" | "attachment",
    filename: string
): string {
    const ascii =
        filename
            .replace(/[\u2010-\u2015]/g, "-") // en/em dashes → hyphen
            .replace(/[\u2018\u2019]/g, "'") // curly single quotes
            .replace(/[\u201C\u201D]/g, "") // curly double quotes
            .normalize("NFKD") // é → e +  ́
            .replace(/[^\x20-\x7E]/g, "") // drop anything still non-ASCII
            .replace(/["\\]/g, "") // can't break out of the quoted string
            .replace(/[/\u0000-\u001F]/g, "") // no path separators or control chars
            .replace(/\s+/g, " ")
            .trim() || "download";

    return `${disposition}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

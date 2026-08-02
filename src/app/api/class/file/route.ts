import { NextResponse } from "next/server";
import { getManifest } from "@/lib/manifest";
import { resolveByToken } from "@/lib/subscriber";
import { evaluateAccess, findClassBySlug, FORMAT_KEYS, type FormatKey } from "@/lib/access";
import {
    fetchDriveFileStream,
    getDriveFileMeta,
    DriveUnavailableError,
    fetchDriveThumbnailStream,
    PROXY_MAX_BYTES,
} from "@/lib/drive";
import { rateLimit, ipFromHeaders } from "@/lib/rate-limit";
import { contentDisposition } from "@/lib/content-disposition";
import { classDownloadFilename } from "@/lib/class-download";

// Gated Drive proxy — the ONLY way a private class file reaches a browser.
//
// SECURITY: the client never names a Drive file. It sends `t` (their token),
// `slug` and `format`; the server resolves the subscriber, re-runs the full
// access check, and looks the file ID up in the manifest itself. So knowing (or
// guessing) a Drive file ID gets you nothing, and a non-partner cannot fetch a
// gated format by calling this route directly.
//
// GET /api/class/file?t=<token>&slug=4a&format=pdf[&download=1]

const LIMIT = 60;
const WINDOW_SEC = 60;

function isFormatKey(v: string): v is FormatKey {
    return (FORMAT_KEYS as readonly string[]).includes(v);
}

export async function GET(req: Request) {
    const url = new URL(req.url);
    const token = url.searchParams.get("t") ?? "";
    const slug = url.searchParams.get("slug") ?? "";
    const format = url.searchParams.get("format") ?? "";
    const wantsDownload = url.searchParams.get("download") === "1";
    const wantsThumb = url.searchParams.get("thumb") === "1";
    const wantsAudioStream = url.searchParams.get("stream") === "1" && format === "podcast";

    // Cheap abuse guard on a route that fans out to Google.
    const gate = await rateLimit(`classfile:${ipFromHeaders(req.headers)}`, LIMIT, WINDOW_SEC);
    if (!gate.allowed) {
        return NextResponse.json(
            { error: "Too many requests. Please try again in a moment." },
            { status: 429 }
        );
    }

    if (!isFormatKey(format)) {
        return NextResponse.json({ error: "Unknown format" }, { status: 400 });
    }

    const subscriber = await resolveByToken(token);
    if (!subscriber) {
        return NextResponse.json({ error: "Not authorised" }, { status: 401 });
    }

    const classes = await getManifest();
    const klass = findClassBySlug(classes, slug);
    if (!klass) {
        return NextResponse.json({ error: "Unknown class" }, { status: 404 });
    }

    // Re-run the SAME access logic the page used — never trust the page's word.
    const access = evaluateAccess(subscriber, klass);
    if (access.status !== "open") {
        return NextResponse.json({ error: "This class isn't available to you yet" }, { status: 403 });
    }
    if (access.formats[format] !== "open") {
        return NextResponse.json(
            { error: "This format requires an active partnership" },
            { status: 403 }
        );
    }

    const fileId = klass.files[format];
    if (!fileId) {
        return NextResponse.json({ error: "This file isn't available yet" }, { status: 404 });
    }

    try {
        const meta = await getDriveFileMeta(fileId);

        // Poster frame (?thumb=1). Deliberately placed AFTER every access check
        // above, so a preview image is gated exactly like the file it previews —
        // and the expiring googleusercontent URL never reaches the browser.
        if (wantsThumb) {
            if (!meta?.thumbnailLink) {
                return NextResponse.json({ error: "No preview image" }, { status: 404 });
            }
            const thumb = await fetchDriveThumbnailStream(meta);
            const thumbHeaders = new Headers();
            thumbHeaders.set("Content-Type", thumb.contentType);
            if (thumb.contentLength) thumbHeaders.set("Content-Length", thumb.contentLength);
            // Private, but worth caching in the subscriber's own browser.
            thumbHeaders.set("Cache-Control", "private, max-age=3600");
            thumbHeaders.set("X-Content-Type-Options", "nosniff");
            return new Response(thumb.body, { status: 200, headers: thumbHeaders });
        }

        // Defence in depth: the PAGE decides proxy-vs-preview, but this route is
        // publicly reachable, so refuse to stream something far too large for a
        // serverless response rather than timing out mid-transfer.
        if (meta?.size != null && meta.size > PROXY_MAX_BYTES && !wantsAudioStream) {
            console.warn(
                `[class/file] refusing to proxy ${klass.slug}/${format} — ${meta.size} bytes exceeds ${PROXY_MAX_BYTES}`
            );
            return NextResponse.json(
                { error: "This file is too large to open here. Please use the player on the class page." },
                { status: 413 }
            );
        }

        // `meta` is passed so a Docs Editors file is exported rather than
        // fetched with alt=media (which Drive refuses with a 403).
        const { body, contentType, contentLength, status, contentRange, suggestedExt } = await fetchDriveFileStream(
            fileId,
            meta,
            wantsAudioStream ? req.headers.get("range") ?? undefined : undefined
        );

        const safeTitle = klass.title.replace(/[^\p{L}\p{N} \-_]/gu, "").trim() || `Class ${klass.slug}`;
        // Prefer the extension implied by what we actually deliver (an exported
        // Doc arrives as PDF), falling back to the Drive file's own extension.
        const ext = suggestedExt ?? (meta?.name?.match(/\.[a-z0-9]+$/i)?.[0] ?? "").toLowerCase();
        const filename = wantsDownload
            ? classDownloadFilename(
                klass.slug,
                safeTitle,
                format,
                ext || (format === "pdf" || format === "scriptures" ? ".pdf" : "")
            )
            : `JBC Class ${klass.slug} - ${safeTitle}${ext}`;

        const headers = new Headers();
        // contentType already accounts for an export; never trust meta.mimeType
        // here, which for a Doc is application/vnd.google-apps.document.
        headers.set("Content-Type", contentType);
        // NEVER interpolate raw text into a header: a non-Latin-1 character
        // (em dash, curly quote, accented title) makes Headers.set() throw.
        // See lib/content-disposition.ts.
        headers.set(
            "Content-Disposition",
            contentDisposition(wantsDownload ? "attachment" : "inline", filename)
        );
        if (contentLength) headers.set("Content-Length", contentLength);
        if (wantsAudioStream) {
            headers.set("Accept-Ranges", "bytes");
            if (contentRange) headers.set("Content-Range", contentRange);
        }
        // Gated content — never cached by a shared proxy or CDN.
        headers.set("Cache-Control", "private, no-store");
        headers.set("X-Content-Type-Options", "nosniff");

        return new Response(body, { status, headers });
    } catch (err) {
        if (err instanceof DriveUnavailableError) {
            return NextResponse.json({ error: err.userMessage }, { status: err.status });
        }
        console.error(`[class/file] unexpected failure for ${klass.slug}/${format}:`, err);
        return NextResponse.json(
            { error: "This file is temporarily unavailable. Please try again shortly." },
            { status: 502 }
        );
    }
}

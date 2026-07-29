import { NextResponse } from "next/server";
import { getManifest } from "@/lib/manifest";
import { resolveByToken } from "@/lib/subscriber";
import { evaluateAccess, findClassBySlug, FORMAT_KEYS, type FormatKey } from "@/lib/access";
import { fetchDriveFileStream, getDriveFileMeta, DriveUnavailableError } from "@/lib/drive";
import { rateLimit, ipFromHeaders } from "@/lib/rate-limit";

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
        const { body, contentType, contentLength } = await fetchDriveFileStream(fileId);

        const safeTitle = klass.title.replace(/[^\p{L}\p{N} \-_]/gu, "").trim() || `Class ${klass.slug}`;
        const ext = (meta?.name?.match(/\.[a-z0-9]+$/i)?.[0] ?? "").toLowerCase();
        const filename = `JBC Class ${klass.slug} — ${safeTitle}${ext}`;

        const headers = new Headers();
        headers.set("Content-Type", meta?.mimeType || contentType);
        headers.set(
            "Content-Disposition",
            `${wantsDownload ? "attachment" : "inline"}; filename="${filename.replace(/"/g, "")}"`
        );
        if (contentLength) headers.set("Content-Length", contentLength);
        // Gated content — never cached by a shared proxy or CDN.
        headers.set("Cache-Control", "private, no-store");
        headers.set("X-Content-Type-Options", "nosniff");

        return new Response(body, { status: 200, headers });
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

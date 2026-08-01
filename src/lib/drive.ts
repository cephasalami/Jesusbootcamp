// src/lib/drive.ts — SERVER-ONLY Google Drive access.
//
// EVERY Drive call in the codebase goes through this one module, so rate-limit
// handling, error shaping and caching live in a single place (Part 1).
//
// Two ways a class file reaches a subscriber:
//   1. PROXIED  — fetched here with the service account and streamed back from
//      our own origin. The Drive URL is never exposed to the browser. Used for
//      everything comfortably under PROXY_MAX_BYTES (PDFs, slides,
//      Main Points/Scriptures documents).
//   2. PREVIEW  — for files too large to push through a serverless function
//      (video/audio), we reveal Drive's /preview embed URL, but ONLY after the
//      server-side access check has passed. See the honesty note on
//      `drivePreviewUrl` below.
import { getAccessToken, isGoogleConfigured } from "./google-auth";
import { readAudioDurationMs } from "./audio-duration";

export { isGoogleConfigured };

/**
 * Size ceiling for the proxy path, in bytes.
 *
 * Vercel's documented limit for a serverless function response is 4.5 MB when
 * buffered. We stream (which can exceed that), but a conservative default keeps
 * us clear of both that ceiling and the function timeout on a slow connection.
 * Overridable per-deployment once the real plan limits are confirmed in the
 * Vercel dashboard — see the note in the report.
 */
export const PROXY_MAX_BYTES = Number(process.env.CLASS_PROXY_MAX_BYTES ?? 4_000_000);

export type DriveFileMeta = {
    id: string;
    name: string;
    mimeType: string;
    /** Bytes. null when Drive doesn't report a size (e.g. Google-native docs). */
    size: number | null;
    /**
     * Drive's generated poster frame (for video, the first frame). A signed
     * googleusercontent URL that is fetchable WITHOUT auth and expires, so it is
     * never sent to the browser — /api/class/file?thumb=1 proxies it behind the
     * same access checks as the file itself.
     */
    thumbnailLink: string | null;
    /** Real audio duration read from the file header when Drive omits it. */
    durationMs: number | null;
};

/** A friendly, non-technical failure a subscriber can actually read. */
export class DriveUnavailableError extends Error {
    readonly userMessage: string;
    readonly status: number;
    constructor(userMessage: string, status = 502, detail?: string) {
        super(detail ?? userMessage);
        this.name = "DriveUnavailableError";
        this.userMessage = userMessage;
        this.status = status;
    }
}

const FRIENDLY_BUSY =
    "This file is temporarily unavailable — Google is rate-limiting downloads right now. Please try again in a few minutes.";
const FRIENDLY_GENERIC =
    "This file is temporarily unavailable. Please try again shortly.";

/**
 * Turn a Drive HTTP failure into a friendly error. Drive answers a throttled
 * download with 403 + a `downloadQuotaExceeded`/`rateLimitExceeded` reason, and
 * without this a subscriber would see a raw Google error page.
 */
async function driveFailure(res: Response, fileId: string): Promise<DriveUnavailableError> {
    let detail = "";
    try {
        detail = (await res.text()).slice(0, 500);
    } catch {
        /* body already consumed / unreadable */
    }
    const throttled =
        res.status === 429 ||
        (res.status === 403 && /quota|rate.?limit|userRateLimit/i.test(detail));

    if (throttled) {
        console.error(`[drive] THROTTLED on ${fileId} (${res.status}): ${detail}`);
        return new DriveUnavailableError(FRIENDLY_BUSY, 429, detail);
    }
    // A Docs Editors file reached via alt=media. Should no longer happen (we
    // route those through /export) but log it distinctly rather than burying it
    // in the generic message, since that is what hid this bug the first time.
    if (res.status === 403 && /binary content|Use Export/i.test(detail)) {
        console.error(
            `[drive] ${fileId} is a Docs Editors file and cannot be downloaded with alt=media — ` +
                `it must be exported. Detail: ${detail.slice(0, 200)}`
        );
        return new DriveUnavailableError(FRIENDLY_GENERIC, 502, detail);
    }
    if (res.status === 404) {
        console.error(`[drive] file not found: ${fileId}`);
        return new DriveUnavailableError("This file isn't available yet.", 404, detail);
    }
    console.error(`[drive] request failed for ${fileId} (${res.status}): ${detail}`);
    return new DriveUnavailableError(FRIENDLY_GENERIC, 502, detail);
}

// ── File metadata (cached — size drives the proxy-vs-preview decision) ───────
const metaCache = new Map<string, { value: DriveFileMeta; expires: number }>();
const META_TTL_MS = 10 * 60 * 1000;
const AUDIO_DURATION_SAMPLE_BYTES = 512 * 1024;

async function fetchDriveRange(
    fileId: string,
    token: string,
    start: number,
    end: number
): Promise<Uint8Array | null> {
    try {
        const res = await fetch(
            `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Range: `bytes=${start}-${end}`,
                },
                cache: "no-store",
                signal: AbortSignal.timeout(10_000),
            }
        );
        if (!res.ok) return null;
        return new Uint8Array(await res.arrayBuffer());
    } catch (err) {
        // Duration is helpful metadata, not a reason to make a class page fail.
        console.warn(`[drive] could not read audio duration for ${fileId}:`, err);
        return null;
    }
}

async function getAudioDurationMs(
    fileId: string,
    mimeType: string,
    size: number | null,
    token: string
): Promise<number | null> {
    if (!/^audio\//i.test(mimeType) || !size || size <= 0) return null;

    const firstLength = Math.min(size, AUDIO_DURATION_SAMPLE_BYTES);
    const firstBytes = await fetchDriveRange(fileId, token, 0, firstLength - 1);
    if (!firstBytes) return null;

    const firstResult = readAudioDurationMs({
        firstBytes,
        lastBytes: new Uint8Array(),
        fileSize: size,
        mimeType,
    });
    if (firstResult != null || size <= AUDIO_DURATION_SAMPLE_BYTES || /^audio\/mpeg$/i.test(mimeType)) {
        return firstResult;
    }

    const lastBytes = await fetchDriveRange(fileId, token, size - AUDIO_DURATION_SAMPLE_BYTES, size - 1);
    if (!lastBytes) return null;
    return readAudioDurationMs({ firstBytes, lastBytes, fileSize: size, mimeType });
}

/**
 * Fetch a file's name/mimeType/size. Cached in-process for 10 minutes: file
 * metadata is effectively static, and this call sits on the class-page render
 * path for every format row.
 */
export async function getDriveFileMeta(fileId: string): Promise<DriveFileMeta | null> {
    if (!fileId?.trim()) return null;
    const key = fileId.trim();

    const hit = metaCache.get(key);
    if (hit && hit.expires > Date.now()) return hit.value;

    const token = await getAccessToken();
    if (!token) return null;

    try {
        const res = await fetch(
            `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(key)}?fields=id,name,mimeType,size,thumbnailLink&supportsAllDrives=true`,
            { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
        );
        if (!res.ok) {
            // Metadata failure must not break the page — the caller falls back
            // to the preview path or a "temporarily unavailable" row.
            console.error(`[drive] meta failed for ${key}: ${res.status}`);
            return null;
        }
        const json = (await res.json()) as {
            id: string;
            name: string;
            mimeType: string;
            size?: string;
            thumbnailLink?: string;
        };
        const size = json.size ? Number(json.size) : null;
        const value: DriveFileMeta = {
            id: json.id,
            name: json.name,
            mimeType: json.mimeType,
            size,
            thumbnailLink: json.thumbnailLink ?? null,
            durationMs: await getAudioDurationMs(key, json.mimeType, size, token),
        };
        metaCache.set(key, { value, expires: Date.now() + META_TTL_MS });
        return value;
    } catch (err) {
        console.error(`[drive] meta errored for ${key}:`, err);
        return null;
    }
}

/**
 * Should this file be streamed through our proxy, or handed off to the Drive
 * preview iframe? Decided from the file's REAL size, never hardcoded by type.
 * Unknown size → preview (safer than risking a function timeout).
 */
export function shouldProxy(meta: DriveFileMeta | null): boolean {
    if (!meta) return false;
    if (meta.size == null) return false;
    return meta.size <= PROXY_MAX_BYTES;
}

/**
 * How a given format should be delivered.
 *
 * The decision is driven by the file's REAL reported size wherever Drive gives
 * us one. When it doesn't (metadata call failed, or a Google-native file that
 * reports no size) we fall back to format type — video and audio are the only
 * things realistically large enough to blow the function limit, and defaulting
 * documents to the proxy keeps them properly private.
 */
export function chooseDelivery(
    format: string,
    meta: DriveFileMeta | null
): "proxy" | "preview" {
    if (meta && meta.size != null) {
        return meta.size <= PROXY_MAX_BYTES ? "proxy" : "preview";
    }
    // Unknown size: fall back by format. `brief` belongs here too — the real
    // class-1 brief is a 40 MB mp4, and guessing "proxy" for it would try to
    // push 40 MB through a serverless function.
    return MEDIA_FORMATS.has(format) ? "preview" : "proxy";
}

/** Formats that are video/audio, and so are never safe to guess as proxyable. */
const MEDIA_FORMATS = new Set(["video", "podcast", "brief"]);

/**
 * Google-native files (Docs / Sheets / Slides) hold no binary content, so
 * `alt=media` answers 403 "Only files with binary content can be downloaded.
 * Use Export with Docs Editors files." They must go through /export instead.
 *
 * The real class-1 Main Points/Scriptures document is a Google Doc, which is why it failed with
 * the same generic message as the em-dash bug but for a completely different
 * reason.
 */
export function isGoogleNative(mimeType: string | undefined | null): boolean {
    return Boolean(mimeType && mimeType.startsWith("application/vnd.google-apps."));
}

/** What we export each Docs Editors type as. PDF reads and prints well and is
 *  what a subscriber actually wants for their Main Points/Scriptures document. */
const EXPORT_TARGETS: Record<string, { mimeType: string; ext: string }> = {
    "application/vnd.google-apps.document": { mimeType: "application/pdf", ext: ".pdf" },
    "application/vnd.google-apps.presentation": { mimeType: "application/pdf", ext: ".pdf" },
    "application/vnd.google-apps.spreadsheet": { mimeType: "application/pdf", ext: ".pdf" },
    "application/vnd.google-apps.drawing": { mimeType: "application/pdf", ext: ".pdf" },
};

export function exportTargetFor(mimeType: string): { mimeType: string; ext: string } {
    return EXPORT_TARGETS[mimeType] ?? { mimeType: "application/pdf", ext: ".pdf" };
}

/**
 * Stream a Drive file's bytes. The ONLY place the codebase downloads file
 * content. Throws DriveUnavailableError with a subscriber-readable message.
 *
 * Pass the already-fetched `meta` so we can tell a binary file (alt=media) from
 * a Docs Editors file (export) without a second metadata round trip.
 */
export async function fetchDriveFileStream(
    fileId: string,
    meta?: DriveFileMeta | null,
    range?: string
): Promise<{
    body: ReadableStream<Uint8Array>;
    contentType: string;
    contentLength: string | null;
    status: number;
    contentRange: string | null;
    /** Extension implied by the delivered bytes, e.g. ".pdf" for an exported Doc. */
    suggestedExt: string | null;
}> {
    if (!fileId?.trim()) throw new DriveUnavailableError("This file isn't available yet.", 404);

    const token = await getAccessToken();
    if (!token) {
        console.error("[drive] no access token — Google service account not configured");
        throw new DriveUnavailableError(FRIENDLY_GENERIC, 503);
    }

    const id = encodeURIComponent(fileId.trim());
    const native = isGoogleNative(meta?.mimeType);
    const target = native ? exportTargetFor(meta!.mimeType) : null;

    const url = target
        ? `https://www.googleapis.com/drive/v3/files/${id}/export?mimeType=${encodeURIComponent(target.mimeType)}`
        : `https://www.googleapis.com/drive/v3/files/${id}?alt=media&supportsAllDrives=true`;

    let res: Response;
    try {
        const headers = new Headers({ Authorization: `Bearer ${token}` });
        if (range) headers.set("Range", range);
        res = await fetch(url, { headers, cache: "no-store" });
    } catch (err) {
        console.error(`[drive] network error for ${fileId}:`, err);
        throw new DriveUnavailableError(FRIENDLY_GENERIC, 502);
    }

    if (!res.ok || !res.body) throw await driveFailure(res, fileId);

    return {
        body: res.body,
        contentType:
            target?.mimeType ?? res.headers.get("content-type") ?? "application/octet-stream",
        contentLength: res.headers.get("content-length"),
        status: res.status,
        contentRange: res.headers.get("content-range"),
        suggestedExt: target?.ext ?? null,
    };
}

/**
 * Stream Drive's generated poster frame for a file (for a video, its first
 * frame). Used to give the class hero a real preview image instead of a blank
 * panel.
 *
 * The underlying googleusercontent URL needs no auth and expires, so it is
 * never handed to the browser — callers proxy these bytes from our own origin
 * behind the normal access checks.
 */
export async function fetchDriveThumbnailStream(meta: DriveFileMeta): Promise<{
    body: ReadableStream<Uint8Array>;
    contentType: string;
    contentLength: string | null;
}> {
    if (!meta.thumbnailLink) {
        throw new DriveUnavailableError("No preview image for this file.", 404);
    }
    // Drive's default thumbnail is tiny (=s220). Ask for a hero-sized frame.
    const url = meta.thumbnailLink.replace(/=s\d+(-c)?$/, "=s1600");

    let res: Response;
    try {
        res = await fetch(url, { cache: "no-store" });
    } catch (err) {
        console.error(`[drive] thumbnail network error for ${meta.id}:`, err);
        throw new DriveUnavailableError(FRIENDLY_GENERIC, 502);
    }
    if (!res.ok || !res.body) throw await driveFailure(res, meta.id);

    return {
        body: res.body,
        contentType: res.headers.get("content-type") ?? "image/jpeg",
        contentLength: res.headers.get("content-length"),
    };
}

/**
 * Drive's embed URL for video/audio.
 *
 * ⚠️ HONESTY NOTE — this path is "unlisted, revealed only to authorised users
 * after a server-side check", NOT cryptographically sealed the way proxied
 * files are. The file itself stays unlisted (never "anyone with the link" in
 * search), and this URL is only rendered after the access check passes, but a
 * partner who copies it out of their page source could share that one file.
 * Accepted tradeoff at this budget; a signed-URL/CDN approach is the upgrade
 * path if this project's resources grow.
 */
export function drivePreviewUrl(fileId: string): string {
    return `https://drive.google.com/file/d/${encodeURIComponent(fileId.trim())}/preview`;
}

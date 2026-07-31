import { NextResponse } from "next/server";
import { getDownload, bookDownloadFilename } from "@/config/products";

// FIX 3 — force-download proxy.
// The book PDFs are hosted cross-origin on faithwithoutborders.us, and browsers
// IGNORE the HTML `download` attribute for cross-origin URLs — so a direct link
// just opens the PDF in the tab. Instead we fetch the file server-side and
// stream it back from OUR origin with `Content-Disposition: attachment`, which
// makes the browser download it with a clean, human-readable filename.
//
// Only known books with a configured downloadUrl are proxied (never an arbitrary
// URL from the client).
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
    const { slug } = await ctx.params;
    const download = getDownload(slug);
    if (!download) {
        return NextResponse.json({ error: "Unknown download" }, { status: 404 });
    }

    try {
        const upstream = await fetch(download.downloadUrl, { cache: "no-store", redirect: "follow" });
        if (!upstream.ok || !upstream.body) {
            return NextResponse.json({ error: "File is temporarily unavailable" }, { status: 502 });
        }

        const filename = bookDownloadFilename(download);
        const headers = new Headers();
        headers.set("Content-Type", "application/pdf");
        headers.set("Content-Disposition", `attachment; filename="${filename}"`);
        const len = upstream.headers.get("content-length");
        if (len) headers.set("Content-Length", len);
        // The link is gated behind a completed purchase; don't cache it publicly.
        headers.set("Cache-Control", "private, no-store");

        return new Response(upstream.body, { status: 200, headers });
    } catch {
        return NextResponse.json({ error: "Download failed" }, { status: 502 });
    }
}

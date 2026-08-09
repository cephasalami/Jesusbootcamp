"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import styles from "./page.module.css";

/**
 * Draws a proxied PDF page-by-page onto canvases.
 *
 * WHY THIS EXISTS: no mobile browser can render a PDF inside an <iframe>.
 * Chrome for Android replaces the frame with its own stub — a document glyph, a
 * filename taken from the URL's last path segment (so every class handout read
 * as "file", from /api/class/file) and a small "Open" button that hands the PDF
 * to an external app, dropping the learner out of their class. Drawing the
 * pages here looks the same on a phone and a desktop, and keeps the bytes on
 * the gated proxy instead of exposing a Drive URL.
 */

const ZOOM_STEPS = [1, 1.4, 2, 2.8] as const;
/** Horizontal room for the scroll container's padding. */
const GUTTER = 24;
/** Retina is worth paying for; 3x on an already-zoomed page is not. */
const MAX_PIXEL_RATIO = 2;
/**
 * Hard ceiling on a page's backing store. A canvas costs width x height x 4
 * bytes whatever the device claims it can do, and mobile Safari starts
 * discarding them well before it admits to a limit.
 */
const MAX_CANVAS_WIDTH = 2400;
/** Draw this far outside the viewport so scrolling stays ahead of rendering. */
const PRERENDER_MARGIN = "200% 0px";

type Pdfjs = typeof import("pdfjs-dist");

/** CSS size and render scale for one page at the current width and zoom. */
type PageLayout = { width: number; height: number; scale: number };
type Layout = { key: string; pages: PageLayout[] };

let pdfjsPromise: Promise<Pdfjs> | null = null;

/**
 * Load pdf.js on first open, never as part of the class page's bundle. The
 * legacy build is the transpiled one, so older phone browsers are still served.
 */
function loadPdfjs(): Promise<Pdfjs> {
    if (!pdfjsPromise) {
        const loading = import("pdfjs-dist/legacy/build/pdf.mjs").then((mod) => {
            // Copied out of node_modules by scripts/sync-pdfjs-assets.mjs, so the
            // worker can never drift from the version imported above.
            mod.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
            return mod;
        });
        pdfjsPromise = loading;
        // A failed load must not become the permanent answer — someone on a
        // flaky connection deserves a working retry.
        void loading.catch(() => {
            if (pdfjsPromise === loading) pdfjsPromise = null;
        });
    }
    return pdfjsPromise;
}

/** The proxy answers a refused or broken request with JSON, not a document. */
async function readErrorMessage(res: Response): Promise<string> {
    try {
        const body = (await res.json()) as { error?: unknown };
        if (typeof body.error === "string" && body.error) return body.error;
    } catch {
        /* not JSON — fall through to the generic message */
    }
    return "This file could not be opened. Please try again shortly.";
}

/** "%PDF". `scriptures` and `slides` share this route, so check before parsing. */
function isPdf(bytes: Uint8Array): boolean {
    return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
}

export default function PdfCanvas({
    src,
    downloadHref,
    label,
}: {
    src: string;
    /** Attachment URL, offered whenever rendering in the page is not possible. */
    downloadHref: string;
    label: string;
}) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const boxRefs = useRef<(HTMLDivElement | null)[]>([]);
    const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
    const docRef = useRef<PDFDocumentProxy | null>(null);
    const tasksRef = useRef(new Map<number, RenderTask>());
    /** Layout key each page was last drawn at, so a redraw is never repeated. */
    const drawnRef = useRef(new Map<number, string>());
    /** How far down the reader was before a zoom changed every page's height. */
    const scrollFractionRef = useRef(0);

    const [pageCount, setPageCount] = useState(0);
    const [layout, setLayout] = useState<Layout | null>(null);
    const [zoomStep, setZoomStep] = useState(0);
    const [width, setWidth] = useState(0);
    const [error, setError] = useState<string | null>(null);
    /** Set when the bytes are not a PDF: hand them to the browser instead. */
    const [blobHref, setBlobHref] = useState<string | null>(null);

    // ── Fetch and parse ─────────────────────────────────────────────────────
    // Mounted with key={src}, so this runs exactly once per document and never
    // has to unpick the state of a previous one.
    useEffect(() => {
        let cancelled = false;
        let objectUrl: string | null = null;
        const tasks = tasksRef.current;
        const drawn = drawnRef.current;

        (async () => {
            try {
                const res = await fetch(src, { credentials: "same-origin" });
                if (!res.ok) {
                    const message = await readErrorMessage(res);
                    if (!cancelled) setError(message);
                    return;
                }

                const bytes = new Uint8Array(await res.arrayBuffer());
                if (cancelled) return;

                if (!isPdf(bytes)) {
                    // Not a PDF (a proxied .pptx, say). Reuse the bytes already
                    // fetched rather than making the browser ask twice.
                    objectUrl = URL.createObjectURL(
                        new Blob([bytes], {
                            type: res.headers.get("content-type") ?? "application/octet-stream",
                        })
                    );
                    setBlobHref(objectUrl);
                    return;
                }

                const pdfjs = await loadPdfjs();
                if (cancelled) return;

                const doc = await pdfjs.getDocument({
                    data: bytes,
                    // Synced into public/pdfjs — see scripts/sync-pdfjs-assets.mjs.
                    cMapUrl: "/pdfjs/cmaps/",
                    cMapPacked: true,
                    standardFontDataUrl: "/pdfjs/standard_fonts/",
                    wasmUrl: "/pdfjs/wasm/",
                }).promise;

                if (cancelled) {
                    void doc.destroy();
                    return;
                }
                docRef.current = doc;
                boxRefs.current = new Array(doc.numPages).fill(null);
                canvasRefs.current = new Array(doc.numPages).fill(null);
                setPageCount(doc.numPages);
            } catch (err) {
                console.error("[pdf] could not render in page:", err);
                if (!cancelled) setError("This file could not be displayed here.");
            }
        })();

        return () => {
            cancelled = true;
            for (const task of tasks.values()) task.cancel();
            tasks.clear();
            drawn.clear();
            void docRef.current?.destroy();
            docRef.current = null;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [src]);

    // ── Track the width the pages have to fit into ──────────────────────────
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const observer = new ResizeObserver(([entry]) => {
            setWidth(Math.round(entry.contentRect.width));
        });
        observer.observe(el);
        setWidth(Math.round(el.clientWidth));
        return () => observer.disconnect();
    }, [pageCount]);

    // ── Measure every page, so the scrollbar is honest before anything is
    //    drawn. Measuring is cheap; rendering is what costs memory. ──────────
    useEffect(() => {
        const doc = docRef.current;
        if (!doc || !pageCount || width <= 0) return;

        let cancelled = false;
        const zoom = ZOOM_STEPS[zoomStep];
        const key = `${width}:${zoomStep}`;

        (async () => {
            const pages: PageLayout[] = [];
            for (let number = 1; number <= doc.numPages; number++) {
                const page = await doc.getPage(number);
                if (cancelled) return;
                const unscaled = page.getViewport({ scale: 1 });
                const scale = (Math.max(width - GUTTER, 240) / unscaled.width) * zoom;
                const viewport = page.getViewport({ scale });
                pages.push({
                    width: Math.floor(viewport.width),
                    height: Math.floor(viewport.height),
                    scale,
                });
            }
            if (!cancelled) setLayout({ key, pages });
        })();

        return () => {
            cancelled = true;
        };
    }, [pageCount, width, zoomStep]);

    const releasePage = useCallback((index: number) => {
        tasksRef.current.get(index)?.cancel();
        tasksRef.current.delete(index);
        drawnRef.current.delete(index);
        const canvas = canvasRefs.current[index];
        if (!canvas) return;
        // Zeroing the backing store is what actually returns the memory; the
        // CSS size stays, so the page keeps its place in the scroll.
        canvas.width = 0;
        canvas.height = 0;
    }, []);

    const renderPage = useCallback(async (index: number, current: Layout) => {
        const doc = docRef.current;
        const canvas = canvasRefs.current[index];
        const size = current.pages[index];
        if (!doc || !canvas || !size) return;
        if (drawnRef.current.get(index) === current.key) return;

        drawnRef.current.set(index, current.key);
        try {
            const page = await doc.getPage(index + 1);
            const viewport = page.getViewport({ scale: size.scale });
            const context = canvas.getContext("2d");
            if (!context) return;

            const ratio = Math.min(
                window.devicePixelRatio || 1,
                MAX_PIXEL_RATIO,
                MAX_CANVAS_WIDTH / viewport.width
            );
            canvas.width = Math.floor(viewport.width * ratio);
            canvas.height = Math.floor(viewport.height * ratio);

            const task = page.render({
                canvasContext: context,
                viewport,
                // The canvas is oversampled for the device's pixel ratio, so
                // pdf.js has to draw at that same ratio to fill it.
                transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0],
            });
            tasksRef.current.set(index, task);
            await task.promise;
        } catch {
            // A cancelled pass is the ordinary result of a zoom or a resize;
            // forget it so the page is drawn again when it is next needed.
            drawnRef.current.delete(index);
        } finally {
            tasksRef.current.delete(index);
        }
    }, []);

    // ── Draw only what is on (or near) the screen ───────────────────────────
    useEffect(() => {
        if (!layout) return;

        // Everything measured at the previous zoom is now the wrong size.
        for (let index = 0; index < layout.pages.length; index++) releasePage(index);

        // Keep the reader where they were when a zoom changed every height.
        const scroller = scrollRef.current;
        if (scroller && scrollFractionRef.current > 0) {
            scroller.scrollTop = scrollFractionRef.current * scroller.scrollHeight;
            scrollFractionRef.current = 0;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    const index = Number((entry.target as HTMLElement).dataset.page);
                    if (Number.isNaN(index)) continue;
                    if (entry.isIntersecting) void renderPage(index, layout);
                    else releasePage(index);
                }
            },
            { root: scroller, rootMargin: PRERENDER_MARGIN }
        );
        for (const box of boxRefs.current) if (box) observer.observe(box);
        return () => observer.disconnect();
    }, [layout, releasePage, renderPage]);

    const zoomBy = useCallback((direction: 1 | -1) => {
        const scroller = scrollRef.current;
        if (scroller && scroller.scrollHeight > 0) {
            scrollFractionRef.current = scroller.scrollTop / scroller.scrollHeight;
        }
        setZoomStep((step) => Math.min(Math.max(step + direction, 0), ZOOM_STEPS.length - 1));
    }, []);

    if (error) {
        return (
            <div className={styles.pdfViewer}>
                <div className={styles.pdfStatus}>
                    <p>{error}</p>
                    <div className={styles.pdfStatusActions}>
                        <a className={styles.pdfStatusBtn} href={downloadHref}>
                            Download {label}
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    // Whatever this file is, it is not a PDF — let the browser deal with it.
    if (blobHref) return <iframe src={blobHref} title={label} />;

    if (!pageCount) {
        return (
            <div className={styles.pdfViewer}>
                <div className={styles.pdfStatus}>
                    <p>Opening {label}…</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pdfViewer}>
            <div className={styles.pdfScroll} ref={scrollRef}>
                {Array.from({ length: pageCount }, (_, index) => {
                    const size = layout?.pages[index];
                    return (
                        <div
                            className={styles.pdfPage}
                            key={index}
                            data-page={index}
                            ref={(node) => {
                                boxRefs.current[index] = node;
                            }}
                        >
                            <canvas
                                ref={(node) => {
                                    canvasRefs.current[index] = node;
                                }}
                                style={
                                    size
                                        ? { width: `${size.width}px`, height: `${size.height}px` }
                                        : undefined
                                }
                                role="img"
                                aria-label={`${label} — page ${index + 1} of ${pageCount}`}
                            />
                        </div>
                    );
                })}
            </div>
            <div className={styles.pdfBar}>
                <button
                    type="button"
                    className={styles.pdfZoomBtn}
                    onClick={() => zoomBy(-1)}
                    disabled={zoomStep === 0}
                    aria-label="Zoom out"
                >
                    <Minus size={18} />
                </button>
                <span className={styles.pdfCount}>
                    {pageCount} page{pageCount === 1 ? "" : "s"}
                </span>
                <button
                    type="button"
                    className={styles.pdfZoomBtn}
                    onClick={() => zoomBy(1)}
                    disabled={zoomStep === ZOOM_STEPS.length - 1}
                    aria-label="Zoom in"
                >
                    <Plus size={18} />
                </button>
            </div>
        </div>
    );
}

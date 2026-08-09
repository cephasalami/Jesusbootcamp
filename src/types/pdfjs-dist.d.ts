// pdfjs-dist 6.x publishes no TypeScript declarations — its package.json still
// points `types` at a `types/` directory that is not in the tarball — so the
// slice of pdf.js the class PDF viewer actually uses is declared here, checked
// against node_modules/pdfjs-dist/build/pdf.mjs.
//
// Only src/app/class/[slug]/PdfCanvas.tsx imports pdf.js. Widen this when that
// file needs more, not speculatively.

declare module "pdfjs-dist" {
    export interface PageViewport {
        readonly width: number;
        readonly height: number;
    }

    export interface RenderTask {
        readonly promise: Promise<void>;
        cancel(): void;
    }

    export interface RenderParameters {
        canvasContext: CanvasRenderingContext2D;
        viewport: PageViewport;
        /** Defaults to `canvasContext.canvas`. */
        canvas?: HTMLCanvasElement;
        /** [a, b, c, d, e, f] — used here to draw at the device pixel ratio. */
        transform?: number[];
    }

    export interface PDFPageProxy {
        getViewport(parameters: { scale: number }): PageViewport;
        render(parameters: RenderParameters): RenderTask;
    }

    export interface PDFDocumentProxy {
        readonly numPages: number;
        getPage(pageNumber: number): Promise<PDFPageProxy>;
        destroy(): Promise<void>;
    }

    export interface PDFDocumentLoadingTask {
        readonly promise: Promise<PDFDocumentProxy>;
    }

    export interface GetDocumentParameters {
        data?: Uint8Array;
        url?: string;
        /** Character maps, needed for some non-Latin text. */
        cMapUrl?: string;
        cMapPacked?: boolean;
        /** Metrics for the base-14 fonts a PDF may not embed. */
        standardFontDataUrl?: string;
        /** Image-decoder wasm (JPEG 2000 and friends). */
        wasmUrl?: string;
    }

    export function getDocument(source: GetDocumentParameters): PDFDocumentLoadingTask;

    export const GlobalWorkerOptions: {
        workerSrc: string;
        workerPort: Worker | null;
    };
}

/** The transpiled build, for older phone browsers. Same API. */
declare module "pdfjs-dist/legacy/build/pdf.mjs" {
    export * from "pdfjs-dist";
}

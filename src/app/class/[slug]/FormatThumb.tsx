import {
    FileText,
    Play,
    Film,
    AudioLines,
    Headphones,
    Presentation,
    BookOpen,
    ClipboardCheck,
    Lock,
} from "lucide-react";
import styles from "./page.module.css";

/**
 * The little format "thumbnail" on each row of a class page.
 *
 * All glyphs come from lucide-react (already a project dependency — no new icon
 * pack, and nothing hand-drawn). What makes them readable at a glance is not a
 * different icon set but consistent treatment: one tile size, one radius, one
 * stroke weight, and a distinct colour per format, with a layered backdrop
 * glyph for the media types (a film frame behind a play button, sound waves
 * behind headphones) so video/brief/podcast can't be confused with each other.
 *
 * PURELY PRESENTATIONAL. `locked` only decides whether the corner padlock badge
 * is drawn — it does not gate anything. All access decisions stay in
 * lib/access.ts and are re-checked server-side by /api/class/file.
 */

export type ThumbKind =
    | "pdf"
    | "video"
    | "podcast"
    | "brief"
    | "slides"
    | "scriptures"
    | "quiz";

const TINT: Record<ThumbKind, string> = {
    pdf: styles.thumbPdf,
    video: styles.thumbVideo,
    podcast: styles.thumbPodcast,
    brief: styles.thumbBrief,
    slides: styles.thumbSlides,
    scriptures: styles.thumbScriptures,
    quiz: styles.thumbQuiz,
};

export default function FormatThumb({
    kind,
    locked = false,
    muted = false,
}: {
    kind: ThumbKind;
    locked?: boolean;
    muted?: boolean;
}) {
    return (
        <span
            className={[styles.thumb, TINT[kind], muted ? styles.thumbMuted : ""].join(" ")}
            aria-hidden="true"
        >
            {/* Backdrop glyph — gives each media type its own silhouette. */}
            {(kind === "video" || kind === "brief") && (
                <Film className={styles.thumbBack} size={30} strokeWidth={1.5} />
            )}
            {kind === "podcast" && (
                <AudioLines className={styles.thumbBack} size={30} strokeWidth={1.5} />
            )}

            {/* Foreground glyph. */}
            <span className={styles.thumbFront}>
                {kind === "pdf" && <FileText size={19} strokeWidth={2} />}
                {(kind === "video" || kind === "brief") && <Play size={17} strokeWidth={2.5} fill="currentColor" />}
                {kind === "podcast" && <Headphones size={18} strokeWidth={2} />}
                {kind === "slides" && <Presentation size={19} strokeWidth={2} />}
                {kind === "scriptures" && <BookOpen size={19} strokeWidth={2} />}
                {kind === "quiz" && <ClipboardCheck size={19} strokeWidth={2} />}
            </span>

            {locked && (
                <span className={styles.thumbLock}>
                    <Lock size={10} strokeWidth={2.5} />
                </span>
            )}
        </span>
    );
}

"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, Pause, Play, Share2, Check, MessageCircle, Volume2, X } from "lucide-react";
import { shouldPrebufferPodcast } from "@/lib/media-warmup";
import styles from "./page.module.css";

type TrackedMaterial = "video" | "brief" | "podcast" | "quiz";

function recordMaterialAccess(input: {
    token: string;
    slug: string;
    format: TrackedMaterial;
    success: boolean;
}) {
    // `keepalive` lets this reach the server when a quiz opens in another tab.
    // The server independently validates the token and entitlement, and never
    // exposes analytics data back to the browser.
    void fetch("/api/class/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        keepalive: true,
        body: JSON.stringify(input),
    }).catch(() => {
        // Tracking must not turn a playable lesson into a visible error.
    });
}

/**
 * Video player for the Drive `/preview` embed.
 *
 * The embed URL is computed server-side and ONLY passed here for a format the
 * subscriber is authorised to open. List-row videos use a focused popup; the
 * single class hero video mounts in place so it can start immediately.
 */
export function PreviewPlayer({
    src,
    label,
    classTitle,
    buttonClass,
    variant = "row",
    posterSrc,
    accessToken,
    classSlug,
    format,
}: {
    src: string;
    label: string;
    /** Adds the current class name wherever the popup identifies the video. */
    classTitle?: string;
    buttonClass: string;
    /** "hero" renders a full-width poster with a centred play badge. */
    variant?: "row" | "hero";
    /** Proxied poster frame (see /api/class/file?thumb=1). */
    posterSrc?: string;
    accessToken: string;
    classSlug: string;
    format: "video" | "brief";
}) {
    const [open, setOpen] = useState(false);
    const playerId = useId();
    const ownsHistoryEntry = useRef(false);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const playerLabel = classTitle ? `${label} - ${classTitle}` : label;

    useEffect(() => {
        // Opening a Drive iframe does not navigate away from the class page.
        // Add one same-URL history entry so the browser's Back button closes
        // the player rather than returning to the email/app that opened the class.
        const onPopState = () => {
            if (!ownsHistoryEntry.current) return;
            ownsHistoryEntry.current = false;
            setOpen(false);
        };
        window.addEventListener("popstate", onPopState);
        return () => window.removeEventListener("popstate", onPopState);
    }, []);

    useEffect(() => {
        // Only the material-list modal locks scroll and captures Escape. The
        // hero video plays inline and must leave the page behaving normally.
        if (!open || variant === "hero") return;
        const previousOverflow = document.body.style.overflow;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") closePlayer();
        };
        document.body.style.overflow = "hidden";
        closeButtonRef.current?.focus();
        window.addEventListener("keydown", onKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [open, variant]);

    function openPlayer() {
        recordMaterialAccess({ token: accessToken, slug: classSlug, format, success: true });
        if (variant === "hero") {
            setOpen(true);
            return;
        }
        window.history.pushState({ jbcPreviewPlayer: playerId }, "", window.location.href);
        ownsHistoryEntry.current = true;
        setOpen(true);
    }

    function closePlayer() {
        setOpen(false);
        if (ownsHistoryEntry.current) {
            // Going back removes only the same-URL player entry created above;
            // it leaves the class URL and its ?t= token intact.
            ownsHistoryEntry.current = false;
            window.history.back();
        }
    }

    if (open && variant === "hero") {
        const autoplaySrc = `${src}${src.includes("?") ? "&" : "?"}autoplay=1`;
        return (
            <div className={styles.heroVideoFrame} aria-label={`Playing ${playerLabel}`}>
                <iframe
                    src={autoplaySrc}
                    title={playerLabel}
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                />
            </div>
        );
    }

    if (!open && variant === "hero") {
        // Composed from real elements rather than CSS pseudo-elements: the
        // previous version drew the circle in CSS and tried to hide the button's
        // contents with `> *`, which cannot hide a bare text node — so a stray
        // "Play" label sat under the circle.
        return (
            <button
                type="button"
                className={buttonClass}
                onClick={openPlayer}
                aria-label={`Play ${label}`}
            >
                {posterSrc && (
                    /* eslint-disable-next-line @next/next/no-img-element -- proxied,
                       per-subscriber and short-lived; next/image would cache it. */
                    <img src={posterSrc} alt="" className={styles.heroPoster} loading="eager" />
                )}
                <span className={styles.heroMediaLabel}>{label}</span>
                <span className={styles.heroPlayBadge}>
                    <Play size={26} strokeWidth={0} fill="currentColor" />
                </span>
            </button>
        );
    }

    if (!open) {
        return (
            <button type="button" className={buttonClass} onClick={openPlayer}>
                <Play size={14} /> Play
            </button>
        );
    }

    return (
        <div
            className={styles.videoModalBackdrop}
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) closePlayer();
            }}
        >
            <section
                className={styles.videoModal}
                role="dialog"
                aria-modal="true"
                aria-label={`Playing ${playerLabel}`}
            >
                <header className={styles.videoModalHead}>
                    <span>Now playing: {playerLabel}</span>
                    <button
                        ref={closeButtonRef}
                        type="button"
                        className={styles.videoModalClose}
                        onClick={closePlayer}
                        aria-label={`Close ${playerLabel}`}
                    >
                        <X size={19} />
                    </button>
                </header>
                <div className={styles.videoModalFrame}>
                    <iframe
                        src={src}
                        title={playerLabel}
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                        loading="lazy"
                    />
                </div>
            </section>
        </div>
    );
}

/**
 * Keeps PDF handouts inside the class experience.  Opening a document in a
 * separate tab is particularly fragile in email apps: closing that tab often
 * returns a learner to the email rather than to their class.  This viewer
 * preserves the class underneath, and gives browser Back the same close-only
 * behaviour as the video popup.
 */
export function DocumentViewer({
    src,
    label,
    classTitle,
    buttonClass,
}: {
    src: string;
    label: string;
    classTitle: string;
    buttonClass: string;
}) {
    const [open, setOpen] = useState(false);
    const viewerId = useId();
    const ownsHistoryEntry = useRef(false);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const viewerLabel = `${label} - ${classTitle}`;

    useEffect(() => {
        const onPopState = () => {
            if (!ownsHistoryEntry.current) return;
            ownsHistoryEntry.current = false;
            setOpen(false);
        };
        window.addEventListener("popstate", onPopState);
        return () => window.removeEventListener("popstate", onPopState);
    }, []);

    useEffect(() => {
        if (!open) return;
        const previousOverflow = document.body.style.overflow;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") closeViewer();
        };
        document.body.style.overflow = "hidden";
        closeButtonRef.current?.focus();
        window.addEventListener("keydown", onKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [open]);

    function openViewer() {
        // This leaves the address (and its CTOKEN) unchanged while giving the
        // device Back button one local action: close the document viewer.
        window.history.pushState({ jbcDocumentViewer: viewerId }, "", window.location.href);
        ownsHistoryEntry.current = true;
        setOpen(true);
    }

    function closeViewer() {
        setOpen(false);
        if (ownsHistoryEntry.current) {
            ownsHistoryEntry.current = false;
            window.history.back();
        }
    }

    if (!open) {
        return (
            <button type="button" className={buttonClass} onClick={openViewer}>
                Open
            </button>
        );
    }

    return (
        <div
            className={styles.videoModalBackdrop}
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) closeViewer();
            }}
        >
            <section
                className={`${styles.videoModal} ${styles.documentModal}`}
                role="dialog"
                aria-modal="true"
                aria-label={`Viewing ${viewerLabel}`}
            >
                <header className={styles.videoModalHead}>
                    <span>{label}</span>
                    <button
                        ref={closeButtonRef}
                        type="button"
                        className={`${styles.videoModalClose} ${styles.documentModalClose}`}
                        onClick={closeViewer}
                        aria-label={`Back to class from ${viewerLabel}`}
                    >
                        <ArrowLeft size={18} />
                        <span>Back to class</span>
                    </button>
                </header>
                <div className={styles.documentModalFrame}>
                    <iframe src={src} title={viewerLabel} />
                </div>
            </section>
        </div>
    );
}

const WAVE_BARS = [34, 54, 82, 48, 68, 96, 58, 42, 74, 52, 88, 44, 63, 38, 76, 56, 92, 46, 70, 36];

/**
 * A compact, same-page podcast player. Its source is the authorised class-file
 * proxy, so native playback stays in this control instead of opening Drive's
 * embedded player or exposing the Drive URL to the subscriber.
 */
export function AudioPlayer({
    src,
    label,
    durationMs,
    accessToken,
    classSlug,
}: {
    src: string;
    label: string;
    durationMs: number | null;
    accessToken: string;
    classSlug: string;
}) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [preload, setPreload] = useState<"metadata" | "auto">("metadata");
    const [open, setOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [loadedDuration, setLoadedDuration] = useState(0);
    const [failed, setFailed] = useState(false);
    const totalSeconds = loadedDuration || (durationMs != null ? durationMs / 1000 : 0);
    const progress = totalSeconds > 0 ? Math.min(1, currentTime / totalSeconds) : 0;
    const durationLabel = formatAudioTime(totalSeconds) ?? "Audio";

    useEffect(() => {
        const navigatorWithConnection = navigator as Navigator & {
            connection?: { saveData?: boolean; effectiveType?: string };
        };
        if (!shouldPrebufferPodcast(navigatorWithConnection.connection)) return;

        // Let the class page paint before asking the browser to buffer a
        // podcast. This keeps the hero and class material list responsive.
        const timer = window.setTimeout(() => setPreload("auto"), 1_000);
        return () => window.clearTimeout(timer);
    }, []);

    async function togglePlayback() {
        const audio = audioRef.current;
        if (!audio) return;
        if (audio.paused) {
            try {
                setFailed(false);
                await audio.play();
                recordMaterialAccess({
                    token: accessToken,
                    slug: classSlug,
                    format: "podcast",
                    success: true,
                });
                setOpen(true);
            } catch {
                setFailed(true);
                recordMaterialAccess({
                    token: accessToken,
                    slug: classSlug,
                    format: "podcast",
                    success: false,
                });
            }
        } else {
            audio.pause();
            setOpen(false);
        }
    }

    return (
        <div className={styles.audioPlayer} aria-label={`${label} player`}>
            <audio
                ref={audioRef}
                src={src}
                preload={preload}
                onLoadedMetadata={(event) => setLoadedDuration(event.currentTarget.duration)}
                onDurationChange={(event) => setLoadedDuration(event.currentTarget.duration)}
                onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
                onPlay={() => setOpen(true)}
                onPause={() => setOpen(false)}
                onEnded={() => {
                    setOpen(false);
                    setCurrentTime(0);
                }}
                onError={() => setFailed(true)}
            />
            <button
                type="button"
                className={styles.audioLaunch}
                onClick={togglePlayback}
                aria-label={open ? `Pause ${label}` : `Play ${label}`}
            >
                <span className={styles.audioToggle} aria-hidden="true">
                    {open ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                </span>
                <span className={styles.audioBody}>
                    <span className={styles.audioStatus}>
                        <Volume2 size={13} /> {open ? "Playing" : "Audio lesson"}
                    </span>
                    <span className={styles.audioWave} aria-hidden="true">
                        {WAVE_BARS.map((height, index) => (
                            <i
                                key={index}
                                className={index / WAVE_BARS.length < progress ? styles.audioWavePlayed : undefined}
                                style={{ height: `${height}%` }}
                            />
                        ))}
                    </span>
                </span>
                <span className={styles.audioPrompt}>
                    {currentTime > 0 ? `${formatAudioTime(currentTime)} / ${durationLabel}` : durationLabel}
                </span>
            </button>
            {failed && <span className={styles.audioError}>The audio could not start. Please try again.</span>}
        </div>
    );
}

/** External quizzes still receive the same server-validated access event as
 * proxied materials and preview videos. */
export function QuizLink({
    href,
    className,
    accessToken,
    classSlug,
}: {
    href: string;
    className: string;
    accessToken: string;
    classSlug: string;
}) {
    return (
        <a
            className={className}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
                recordMaterialAccess({
                    token: accessToken,
                    slug: classSlug,
                    format: "quiz",
                    success: true,
                })
            }
        >
            Take the Quiz
        </a>
    );
}

function formatAudioTime(seconds: number): string | null {
    if (!Number.isFinite(seconds) || seconds <= 0) return null;
    const total = Math.floor(seconds);
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/** Copy-link + WhatsApp share. Paul's growth channel is WhatsApp specifically. */
export function ShareRow({
    url,
    title,
    className,
    buttonClass,
    waClass,
}: {
    url: string;
    title: string;
    className: string;
    buttonClass: string;
    waClass: string;
}) {
    const [copied, setCopied] = useState(false);

    const message = `${title} — a class from the Jesus Boot Camp. Free to read and share:\n${url}`;

    async function copy() {
        try {
            await navigator.clipboard.writeText(url);
        } catch {
            // Clipboard is unavailable in some in-app browsers — select-and-copy
            // still works from the visible link, so fail quietly.
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <section className={className}>
            <p>
                <strong>Pass it on.</strong> Someone in your contacts needs this class today.
            </p>
            <div>
                <a
                    className={waClass}
                    href={`https://wa.me/?text=${encodeURIComponent(message)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <MessageCircle size={15} /> Share on WhatsApp
                </a>
                <button type="button" className={buttonClass} onClick={copy}>
                    {copied ? <Check size={15} /> : <Share2 size={15} />}
                    {copied ? "Link copied" : "Copy link"}
                </button>
            </div>
        </section>
    );
}

"use client";

import { useState } from "react";
import { Play, Share2, Check, MessageCircle } from "lucide-react";
import styles from "./page.module.css";

/**
 * Video/audio player for the Drive `/preview` embed.
 *
 * The embed URL is computed server-side and ONLY passed here for a format the
 * subscriber is authorised to open. We mount the iframe on click rather than on
 * render so a class page with several media formats doesn't load multiple Drive
 * players at once on a phone.
 */
export function PreviewPlayer({
    src,
    label,
    buttonClass,
    frameClass,
    variant = "row",
    posterSrc,
}: {
    src: string;
    label: string;
    buttonClass: string;
    frameClass: string;
    /** "hero" renders a full-width poster with a centred play badge. */
    variant?: "row" | "hero";
    /** Proxied poster frame (see /api/class/file?thumb=1). */
    posterSrc?: string;
}) {
    const [open, setOpen] = useState(false);

    if (!open && variant === "hero") {
        // Composed from real elements rather than CSS pseudo-elements: the
        // previous version drew the circle in CSS and tried to hide the button's
        // contents with `> *`, which cannot hide a bare text node — so a stray
        // "Play" label sat under the circle.
        return (
            <button
                type="button"
                className={buttonClass}
                onClick={() => setOpen(true)}
                aria-label={`Play ${label}`}
            >
                {posterSrc && (
                    /* eslint-disable-next-line @next/next/no-img-element -- proxied,
                       per-subscriber and short-lived; next/image would cache it. */
                    <img src={posterSrc} alt="" className={styles.heroPoster} loading="eager" />
                )}
                <span className={styles.heroPlayBadge}>
                    <Play size={26} strokeWidth={0} fill="currentColor" />
                </span>
            </button>
        );
    }

    if (!open) {
        return (
            <button type="button" className={buttonClass} onClick={() => setOpen(true)}>
                <Play size={14} /> Play
            </button>
        );
    }

    return (
        <div className={frameClass}>
            <iframe
                src={src}
                title={label}
                allow="autoplay; encrypted-media"
                allowFullScreen
                loading="lazy"
            />
        </div>
    );
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

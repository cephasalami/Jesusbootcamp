import type { Metadata } from "next";
import Link from "next/link";
import { Lock, FileText, Video, Headphones, Clapperboard, Presentation, Layers, BookOpen, Clock, ClipboardCheck } from "lucide-react";
import { getManifest } from "@/lib/manifest";
import { resolveByToken } from "@/lib/subscriber";
import {
    evaluateAccess,
    findClassBySlug,
    inReleaseOrder,
    FORMAT_KEYS,
    FORMAT_LABELS,
    type FormatKey,
    type ClassRecord,
} from "@/lib/access";
import { getDriveFileMeta, chooseDelivery, drivePreviewUrl } from "@/lib/drive";
import IdentifyForm from "./IdentifyForm";
import { ShareRow, PreviewPlayer } from "./ClassClient";
import styles from "./page.module.css";

// Per-subscriber gated content — never indexed, never cached at the edge.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Class — Jesus Boot Camp",
    robots: { index: false, follow: false },
};

const FORMAT_ICONS: Record<FormatKey, React.ComponentType<{ size?: number }>> = {
    pdf: FileText,
    video: Video,
    podcast: Headphones,
    brief: Clapperboard,
    slides: Presentation,
    flashcards: Layers,
    scriptures: BookOpen,
};

/** Short blurb under each row so a locked format still sells itself. */
const FORMAT_BLURBS: Record<FormatKey, string> = {
    pdf: "The full class, ready to read, print or pass on.",
    video: "Watch the class taught in full.",
    podcast: "A passionate 20-minute explainer of the lesson.",
    brief: "The 10-minute version when time is short.",
    slides: "Teach it yourself from a platform.",
    flashcards: "Drill the lesson — great for teaching children.",
    scriptures: "Every scripture on the topic, in one list.",
};

function formatDate(d: Date): string {
    return d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
    });
}

function classNumberLabel(klass: ClassRecord): string {
    return `Class ${klass.slug.toUpperCase()}`;
}

export default async function ClassPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}) {
    const { slug } = await params;
    const sp = await searchParams;
    const token = typeof sp.t === "string" ? sp.t : "";

    const classes = await getManifest();

    // Manifest completely unavailable (no fresh read, no cached copy).
    if (classes.length === 0) {
        return (
            <main className={styles.page}>
                <div className={styles.shell}>
                    <div className={styles.notice}>
                        <h1 className={styles.noticeTitle}>The classes are temporarily unavailable</h1>
                        <p className={styles.noticeText}>
                            We&apos;re having trouble loading the class list right now. Please try
                            again in a few minutes — nothing is wrong with your access.
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    // Slug lookup is STRING-based. Never parseInt — parseInt("4a") === 4 would
    // silently serve class 4 to anyone opening /class/4a.
    const klass = findClassBySlug(classes, slug);
    if (!klass) {
        // Rendered inline rather than via notFound(): this route streams (see
        // loading.tsx), so the HTTP status is already committed by the time we
        // get here and a generic 404 page would be both status-200 anyway AND
        // less useful. A mangled link is the likeliest cause, so we say so and
        // offer a way onward. The page is noindex, so SEO is unaffected.
        return (
            <main className={styles.page}>
                <div className={styles.shell}>
                    <div className={styles.notice}>
                        <h1 className={styles.noticeTitle}>We couldn&apos;t find that class</h1>
                        <p className={styles.noticeText}>
                            The link may have been trimmed or mistyped on the way here. Open the
                            most recent class email again, or start from the beginning.
                        </p>
                        <p className={styles.noticeFoot}>
                            <Link href={token ? `/class/1?t=${encodeURIComponent(token)}` : "/join"}>
                                Go to class 1
                            </Link>
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    const subscriber = await resolveByToken(token);
    const access = evaluateAccess(subscriber, klass);

    if (access.status !== "unknown" && access.degraded) {
        // Loud: this points at a signup-flow bug, not just a display issue.
        console.error(
            `[class] DEGRADED ACCESS — subscriber ${subscriber?.email} has no usable COURSESTART; ` +
                `falling back to classes 1-4a only (requested ${klass.slug})`
        );
    }

    const ordered = inReleaseOrder(classes);
    const position = ordered.findIndex((c) => c.slug === klass.slug) + 1;

    // ── Check 1 — unknown subscriber ──
    if (access.status === "unknown") {
        return (
            <main className={styles.page}>
                <div className={styles.shell}>
                    <span className={styles.eyebrow}>{classNumberLabel(klass)}</span>
                    <h1 className={styles.title}>{klass.title}</h1>
                    <div className={styles.notice}>
                        <h2 className={styles.noticeTitle}>Let&apos;s find your place in the training</h2>
                        <p className={styles.noticeText}>
                            We couldn&apos;t recognise your personal class link — email apps sometimes
                            trim them. Enter the email address you signed up with and we&apos;ll take
                            you straight there.
                        </p>
                        <IdentifyForm slug={klass.slug} />
                        <p className={styles.noticeFoot}>
                            Not enrolled yet? <Link href="/join">Enlist in the Jesus Boot Camp</Link> —
                            it&apos;s free.
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    // ── Check 2 — released, but not to them yet ──
    if (access.status === "locked-time") {
        return (
            <main className={styles.page}>
                <div className={styles.shell}>
                    <span className={styles.eyebrow}>
                        {classNumberLabel(klass)} · {position} of {ordered.length}
                    </span>
                    <h1 className={styles.title}>{klass.title}</h1>

                    <div className={styles.lockedCard}>
                        <span className={styles.lockedIcon}>
                            <Clock size={26} />
                        </span>
                        <h2 className={styles.lockedTitle}>This class hasn&apos;t opened yet</h2>
                        {access.unlocksOn ? (
                            <p className={styles.lockedText}>
                                It unlocks for you on{" "}
                                <strong>{formatDate(access.unlocksOn)}</strong>. The training moves one
                                class at a time on purpose — so it&apos;s walked out, not skimmed.
                            </p>
                        ) : (
                            <p className={styles.lockedText}>
                                We couldn&apos;t work out your start date, so we&apos;ve opened the
                                first four classes for you. Reply to any class email and we&apos;ll get
                                this fixed.
                            </p>
                        )}
                        <Link href={`/class/1?t=${encodeURIComponent(token)}`} className={styles.lockedCta}>
                            Go to the classes you can open
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    // ── Check 3 — released: resolve how each open format is delivered ──
    const rows = await Promise.all(
        FORMAT_KEYS.map(async (key) => {
            const state = access.formats[key];
            const fileId = klass.files[key];
            if (state !== "open" || !fileId) {
                return { key, state, delivery: null as null | "proxy" | "preview", previewUrl: "" };
            }
            const meta = await getDriveFileMeta(fileId);
            const delivery = chooseDelivery(key, meta);
            return {
                key,
                state,
                delivery,
                // Only ever computed for a format this subscriber may open.
                previewUrl: delivery === "preview" ? drivePreviewUrl(fileId) : "",
            };
        })
    );

    const isPartner = Boolean(subscriber?.partner);
    // `access.quiz` is null when the class has no quiz_url — no row is rendered
    // at all in that case, rather than a dead link.
    const quizState = access.quiz;
    const lockedCount =
        rows.filter((r) => r.state === "locked-partner").length +
        (quizState === "locked-partner" ? 1 : 0);
    const shareUrl = `https://jesusbootcamp.org/class/${klass.slug}`;

    return (
        <main className={styles.page}>
            <div className={styles.shell}>
                <span className={styles.eyebrow}>
                    {classNumberLabel(klass)} · {position} of {ordered.length}
                </span>
                <h1 className={styles.title}>{klass.title}</h1>

                <ul className={styles.formats}>
                    {rows.map(({ key, state, delivery, previewUrl }) => {
                        const Icon = FORMAT_ICONS[key];
                        const href = `/api/class/file?t=${encodeURIComponent(token)}&slug=${encodeURIComponent(klass.slug)}&format=${key}`;

                        return (
                            <li
                                key={key}
                                className={[
                                    styles.row,
                                    state === "locked-partner" ? styles.rowLocked : "",
                                    state === "coming-soon" ? styles.rowSoon : "",
                                ].join(" ")}
                            >
                                <span className={styles.rowIcon} aria-hidden="true">
                                    {state === "locked-partner" ? <Lock size={19} /> : <Icon size={19} />}
                                </span>

                                <span className={styles.rowBody}>
                                    <span className={styles.rowLabel}>{FORMAT_LABELS[key]}</span>
                                    <span className={styles.rowBlurb}>
                                        {state === "coming-soon"
                                            ? "Coming soon"
                                            : state === "locked-partner"
                                              ? "Unlocked for partners"
                                              : FORMAT_BLURBS[key]}
                                    </span>
                                </span>

                                <span className={styles.rowAction}>
                                    {state === "coming-soon" && (
                                        <span className={styles.soonTag}>Coming soon</span>
                                    )}

                                    {state === "locked-partner" && (
                                        <Link href="/partner/join" className={styles.unlockBtn}>
                                            Unlock
                                        </Link>
                                    )}

                                    {state === "open" && delivery === "proxy" && (
                                        <>
                                            <a className={styles.openBtn} href={href} target="_blank" rel="noopener noreferrer">
                                                Open
                                            </a>
                                            <a className={styles.dlBtn} href={`${href}&download=1`}>
                                                Download
                                            </a>
                                        </>
                                    )}

                                    {state === "open" && delivery === "preview" && (
                                        <PreviewPlayer
                                            src={previewUrl}
                                            label={FORMAT_LABELS[key]}
                                            buttonClass={styles.openBtn}
                                            frameClass={styles.playerFrame}
                                        />
                                    )}
                                </span>
                            </li>
                        );
                    })}

                    {/* Quiz — an EXTERNAL link (typically a Google Form), never a
                        Drive file: no proxy, no embed, no Drive API call. Rendered
                        only when the class actually has a quiz_url. */}
                    {quizState !== null && (
                        <li
                            className={[
                                styles.row,
                                quizState === "locked-partner" ? styles.rowLocked : "",
                            ].join(" ")}
                        >
                            <span className={styles.rowIcon} aria-hidden="true">
                                {quizState === "locked-partner" ? <Lock size={19} /> : <ClipboardCheck size={19} />}
                            </span>
                            <span className={styles.rowBody}>
                                <span className={styles.rowLabel}>Quiz</span>
                                <span className={styles.rowBlurb}>
                                    {quizState === "locked-partner"
                                        ? "Unlocked for partners"
                                        : "Check what stuck — a few questions on this class."}
                                </span>
                            </span>
                            <span className={styles.rowAction}>
                                {quizState === "locked-partner" ? (
                                    <Link href="/partner/join" className={styles.unlockBtn}>
                                        Unlock
                                    </Link>
                                ) : (
                                    <a
                                        className={styles.openBtn}
                                        href={klass.quizUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Take the Quiz
                                    </a>
                                )}
                            </span>
                        </li>
                    )}
                </ul>

                {/* Persistent, low-key partner prompt — part of the page, never a modal. */}
                {!isPartner && lockedCount > 0 && (
                    <section className={styles.partnerPrompt}>
                        <div>
                            <h2 className={styles.promptTitle}>
                                {lockedCount} more {lockedCount === 1 ? "format" : "formats"} for this class
                            </h2>
                            <p className={styles.promptText}>
                                The class itself is always free. Partnering monthly — for any amount —
                                opens the video, podcast, brief, slides, flashcards and scripture list
                                on every class from here on.
                            </p>
                        </div>
                        <Link href="/partner/join" className={styles.promptCta}>
                            Become a Partner
                        </Link>
                    </section>
                )}

                {/* Multiplication is the whole model — make passing it on effortless. */}
                <ShareRow
                    url={shareUrl}
                    title={klass.title}
                    className={styles.share}
                    buttonClass={styles.shareBtn}
                    waClass={styles.shareWa}
                />
            </div>
        </main>
    );
}

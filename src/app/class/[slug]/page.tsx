import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { Lock, Clock, ChevronRight, CheckCircle2, PlayCircle, Sparkles } from "lucide-react";
import { getManifest } from "@/lib/manifest";
import {
    DEVICE_COOKIE_NAME,
    resolveSubscriberIdentity,
} from "@/lib/subscriber";
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
import { classDownloadFilename } from "@/lib/class-download";
import IdentifyForm from "./IdentifyForm";
import DeviceIdentityBootstrap from "./DeviceIdentityBootstrap";
import ClassMediaWarmup from "./ClassMediaWarmup";
import { AudioPlayer, DocumentViewer, ShareRow, PreviewPlayer, QuizLink } from "./ClassClient";
import FormatThumb, { type ThumbKind } from "./FormatThumb";
import styles from "./page.module.css";

// Per-subscriber gated content — never indexed, never cached at the edge.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Class — Jesus Boot Camp",
    robots: { index: false, follow: false },
};

/** Short blurb under each row so a locked format still sells itself. */
const FORMAT_BLURBS: Record<FormatKey, string> = {
    pdf: "The full class, ready to read, print or pass on.",
    video: "Watch the class taught in full.",
    podcast: "An audio explainer of the lesson.",
    brief: "The 10-minute version when time is short.",
    slides: "Teach it yourself from a platform.",
    scriptures: "The main points and scripture references, together in one document.",
};

/** The learner-facing material order. The full teaching video lives in the
 * hero when available, so it is deliberately last here only for its existing
 * "Coming soon" fallback state. */
const MATERIAL_ROW_ORDER: readonly FormatKey[] = [
    "pdf",
    "podcast",
    "brief",
    "scriptures",
    "slides",
    "video",
];

function formatDate(d: Date): string {
    return d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
    });
}

function shortDate(d: Date): string {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function classNumberLabel(klass: ClassRecord): string {
    return `Class ${klass.slug.toUpperCase()}`;
}

function formatAudioDuration(durationMs: number | null): string | null {
    if (durationMs == null || !Number.isFinite(durationMs) || durationMs <= 0) return null;
    const totalSeconds = Math.floor(durationMs / 1000);
    return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

/** Breadcrumb shown above every state, mirroring the reference layout. */
function Crumbs({ klass }: { klass?: ClassRecord }) {
    return (
        <nav className={styles.crumbs} aria-label="Breadcrumb">
            <Link href="/">Jesus Boot Camp</Link>
            <ChevronRight size={13} aria-hidden="true" />
            <span>Classes</span>
            {klass && (
                <>
                    <ChevronRight size={13} aria-hidden="true" />
                    <span className={styles.crumbCurrent}>{classNumberLabel(klass)}</span>
                </>
            )}
        </nav>
    );
}

function ClassHelpLink({ slug }: { slug: string }) {
    return (
        <p className={styles.helpLink}>
            Something not working or partner materials still locked?{" "}
            <Link href={`/contact?class=${encodeURIComponent(slug)}`}>Contact us</Link>.
        </p>
    );
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
                    <ClassHelpLink slug={slug} />
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
                    <Crumbs />
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
                    <ClassHelpLink slug={slug} />
                </div>
            </main>
        );
    }

    // `t` is a private, random CTOKEN only. An email address must never act as
    // an access credential because forwarded class emails are intentionally common.
    const deviceToken = (await cookies()).get(DEVICE_COOKIE_NAME)?.value ?? "";
    const identity = await resolveSubscriberIdentity(token, deviceToken);
    const subscriber = identity?.subscriber ?? null;
    // A device-recognised visit has no token in its page URL. Continue using
    // the subscriber's current CTOKEN for the existing file proxy and class
    // navigation; this keeps those already-tested authorization paths intact.
    const accessToken = identity?.source === "device" ? subscriber?.token ?? "" : token;
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
                {identity?.source === "url" && <DeviceIdentityBootstrap token={token} />}
                <div className={styles.shell}>
                    <Crumbs klass={klass} />
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
                    <ClassHelpLink slug={klass.slug} />
                </div>
            </main>
        );
    }

    // ── Check 2 — released, but not to them yet ──
    if (access.status === "locked-time") {
        return (
            <main className={styles.page}>
                <div className={styles.shell}>
                    <Crumbs klass={klass} />
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
                        <Link href={`/class/1?t=${encodeURIComponent(accessToken)}`} className={styles.lockedCta}>
                            Go to the classes you can open
                        </Link>
                    </div>
                    <ClassHelpLink slug={klass.slug} />
                </div>
            </main>
        );
    }

    // ── Check 3 — released: resolve how each open format is delivered ──
    type Delivery = "proxy" | "preview" | "audio";
    const rows = await Promise.all(
        FORMAT_KEYS.map(async (key) => {
            const state = access.formats[key];
            const fileId = klass.files[key];
            if (state !== "open" || !fileId) {
                return {
                    key,
                    state,
                    delivery: null as Delivery | null,
                    previewUrl: "",
                    audioUrl: "",
                    durationMs: null,
                };
            }
            const meta = await getDriveFileMeta(fileId);
            // Media always uses its tailored browser player: a compact audio
            // control for podcasts and a popup /preview embed for video.
            const delivery: Delivery =
                key === "podcast" ? "audio" : key === "video" || key === "brief" ? "preview" : chooseDelivery(key, meta);
            return {
                key,
                state,
                delivery,
                // Only ever computed for a format this subscriber may open.
                previewUrl: delivery === "preview" ? drivePreviewUrl(fileId) : "",
                audioUrl: delivery === "audio"
                    ? `/api/class/file?t=${encodeURIComponent(accessToken)}&slug=${encodeURIComponent(klass.slug)}&format=podcast&stream=1`
                    : "",
                durationMs: meta?.durationMs ?? null,
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
    const openCount =
        rows.filter((r) => r.state === "open").length + (quizState === "open" ? 1 : 0);
    const shareUrl = `https://jesusbootcamp.org/class/${klass.slug}`;

    // The hero player prefers an open Video Overview, then an open full video. Purely a display
    // choice — it reuses the row that already passed the access check.
    const heroRow =
        rows.find((r) => r.key === "video" && r.state === "open" && r.delivery === "preview") ??
        rows.find((r) => r.key === "brief" && r.state === "open" && r.delivery === "preview");
    const materialRows = [...(heroRow ? rows.filter((r) => r.key !== heroRow.key) : rows)].sort(
        (a, b) => MATERIAL_ROW_ORDER.indexOf(a.key) - MATERIAL_ROW_ORDER.indexOf(b.key)
    );
    // Remove only the promoted format. Missing video rows remain visible as "Coming soon."

    // Sidebar outline. `evaluateAccess` is pure and does no I/O, so this is just
    // the same decision re-read for display — it grants nothing.
    const outline = ordered.map((c) => {
        const a = evaluateAccess(subscriber, c);
        return {
            slug: c.slug,
            title: c.title,
            isCurrent: c.slug === klass.slug,
            locked: a.status === "locked-time",
            unlocksOn: a.status === "locked-time" ? a.unlocksOn : null,
        };
    });

    return (
        <main className={styles.page}>
            {identity?.source === "url" && <DeviceIdentityBootstrap token={token} />}
            <ClassMediaWarmup />
            <div className={styles.shell}>
                <Crumbs klass={klass} />

                <header className={styles.header}>
                    <h1 className={styles.title}>{klass.title}</h1>
                    <div className={styles.metaRow}>
                        <span className={styles.metaChip}>
                            <Sparkles size={13} /> {classNumberLabel(klass)}
                        </span>
                        <span className={styles.metaDot} aria-hidden="true" />
                        <span className={styles.metaItem}>
                            {position} of {ordered.length}
                        </span>
                        <span className={styles.metaDot} aria-hidden="true" />
                        <span className={styles.metaItem}>
                            {openCount} {openCount === 1 ? "format" : "formats"} available
                        </span>
                        {lockedCount > 0 && (
                            <>
                                <span className={styles.metaDot} aria-hidden="true" />
                                <span className={styles.metaItem}>
                                    <Lock size={12} /> {lockedCount} for partners
                                </span>
                            </>
                        )}
                    </div>
                </header>

                <div className={styles.layout}>
                    {/* ── Main column ── */}
                    <div className={styles.main}>
                        <section className={styles.hero}>
                            {heroRow ? (
                                <PreviewPlayer
                                    variant="hero"
                                    src={heroRow.previewUrl}
                                    label={FORMAT_LABELS[heroRow.key]}
                                    classTitle={klass.title}
                                    // Drive's own poster frame, proxied behind the
                                    // same access checks as the video itself.
                                    posterSrc={`/api/class/file?t=${encodeURIComponent(accessToken)}&slug=${encodeURIComponent(klass.slug)}&format=${heroRow.key}&thumb=1`}
                                    buttonClass={styles.heroPlay}
                                    accessToken={accessToken}
                                    classSlug={klass.slug}
                                    format={heroRow.key as "video" | "brief"}
                                />
                            ) : (
                                <div className={styles.heroPlaceholder}>
                                    <span className={styles.heroNumber}>{klass.slug.toUpperCase()}</span>
                                    <span className={styles.heroCaption}>{klass.title}</span>
                                </div>
                            )}
                        </section>

                        <section className={styles.panel}>
                            <div className={styles.panelHead}>
                                <h2 className={styles.panelTitle}>In this class</h2>
                                <span className={styles.panelNote}>
                                    {openCount} of {openCount + lockedCount} open to you
                                </span>
                            </div>

                            <ul className={styles.formats}>
                                {materialRows.map(({ key, state, delivery, previewUrl, audioUrl, durationMs }) => {
                                    const href = `/api/class/file?t=${encodeURIComponent(accessToken)}&slug=${encodeURIComponent(klass.slug)}&format=${key}`;
                                    const downloadFilename = key === "pdf" || key === "scriptures"
                                        ? classDownloadFilename(klass.slug, klass.title, key, ".pdf")
                                        : undefined;
                                    const duration = key === "podcast" ? formatAudioDuration(durationMs) : null;
                                    const formatLabel = key === "podcast" && duration
                                        ? `Podcast (${duration})`
                                        : FORMAT_LABELS[key];

                                    return (
                                        <li
                                            key={key}
                                            className={[
                                                styles.row,
                                                state === "locked-partner" ? styles.rowLocked : "",
                                                state === "coming-soon" ? styles.rowSoon : "",
                                            ].join(" ")}
                                        >
                                            <FormatThumb
                                                kind={key as ThumbKind}
                                                locked={state === "locked-partner"}
                                                muted={state === "coming-soon"}
                                            />

                                            <span className={styles.rowBody}>
                                                <span className={styles.rowLabel}>{formatLabel}</span>
                                                <span className={styles.rowBlurb}>
                                                    {state === "coming-soon"
                                                        ? "Coming soon"
                                                        : state === "locked-partner"
                                                          ? "Unlocked for partners"
                                                          : FORMAT_BLURBS[key]}
                                                </span>
                                            </span>

                                            <div className={styles.rowAction}>
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
                                                        <DocumentViewer
                                                            src={href}
                                                            label={FORMAT_LABELS[key]}
                                                            classTitle={klass.title}
                                                            buttonClass={styles.openBtn}
                                                        />
                                                        <a
                                                            className={styles.dlBtn}
                                                            href={`${href}&download=1`}
                                                            download={downloadFilename}
                                                        >
                                                            Download
                                                        </a>
                                                    </>
                                                )}

                                                {state === "open" && delivery === "preview" && (
                                                    <PreviewPlayer
                                                        src={previewUrl}
                                                        label={FORMAT_LABELS[key]}
                                                        classTitle={klass.title}
                                                        buttonClass={styles.openBtn}
                                                        accessToken={accessToken}
                                                        classSlug={klass.slug}
                                                        format={key as "video" | "brief"}
                                                    />
                                                )}

                                                {state === "open" && delivery === "audio" && (
                                                    <AudioPlayer
                                                        src={audioUrl}
                                                        label={formatLabel}
                                                        durationMs={durationMs}
                                                        accessToken={accessToken}
                                                        classSlug={klass.slug}
                                                    />
                                                )}
                                            </div>
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
                                        <FormatThumb kind="quiz" locked={quizState === "locked-partner"} />
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
                                                <QuizLink
                                                    href={klass.quizUrl!}
                                                    className={styles.openBtn}
                                                    accessToken={accessToken}
                                                    classSlug={klass.slug}
                                                />
                                            )}
                                        </span>
                                    </li>
                                )}
                            </ul>
                        </section>

                        <ShareRow
                            url={shareUrl}
                            title={klass.title}
                            className={styles.share}
                            buttonClass={styles.shareBtn}
                            waClass={styles.shareWa}
                        />

                        <ClassHelpLink slug={klass.slug} />
                    </div>

                    {/* ── Sidebar ── */}
                    <aside className={styles.sidebar}>
                        <section className={styles.panel}>
                            <div className={styles.panelHead}>
                                <h2 className={styles.panelTitle}>Class content</h2>
                                <span className={styles.panelNote}>{ordered.length} classes</span>
                            </div>
                            <ol className={styles.outline}>
                                {outline.map((c) => (
                                    <li key={c.slug}>
                                        {c.locked ? (
                                            <span className={`${styles.outlineRow} ${styles.outlineLocked}`}>
                                                <Lock size={14} className={styles.outlineIcon} />
                                                <span className={styles.outlineText}>
                                                    <span className={styles.outlineNum}>
                                                        {c.slug.toUpperCase()}
                                                    </span>
                                                    {c.title}
                                                </span>
                                                {c.unlocksOn && (
                                                    <span className={styles.outlineDate}>
                                                        {shortDate(c.unlocksOn)}
                                                    </span>
                                                )}
                                            </span>
                                        ) : (
                                            <Link
                                                href={`/class/${encodeURIComponent(c.slug)}?t=${encodeURIComponent(accessToken)}`}
                                                className={[
                                                    styles.outlineRow,
                                                    c.isCurrent ? styles.outlineCurrent : "",
                                                ].join(" ")}
                                                aria-current={c.isCurrent ? "page" : undefined}
                                            >
                                                {c.isCurrent ? (
                                                    <PlayCircle size={14} className={styles.outlineIcon} />
                                                ) : (
                                                    <CheckCircle2 size={14} className={styles.outlineIcon} />
                                                )}
                                                <span className={styles.outlineText}>
                                                    <span className={styles.outlineNum}>
                                                        {c.slug.toUpperCase()}
                                                    </span>
                                                    {c.title}
                                                </span>
                                            </Link>
                                        )}
                                    </li>
                                ))}
                            </ol>
                        </section>

                        {/* Persistent, low-key partner prompt — part of the page, never a modal. */}
                        {!isPartner && lockedCount > 0 && (
                            <section className={styles.partnerPrompt}>
                                <h2 className={styles.promptTitle}>
                                    {lockedCount} more {lockedCount === 1 ? "format" : "formats"} for this class
                                </h2>
                                <p className={styles.promptText}>
                                    The class itself is always free. Partnering monthly — for any
                                    amount — opens the full video, podcast, Video Overview, slides,
                                    Main Points/Scriptures and quiz on every class from here on.
                                </p>
                                <Link href="/partner/join" className={styles.promptCta}>
                                    Become a Partner
                                </Link>
                            </section>
                        )}
                    </aside>
                </div>
            </div>
        </main>
    );
}

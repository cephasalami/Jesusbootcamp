// src/lib/access.ts
//
// THE access rules for the class delivery system. Deliberately PURE — no
// imports, no Next.js, no network — so it can be unit-tested directly with
// `node --test` and reasoned about in one sitting. Every gate is evaluated at
// CLICK TIME from a freshly-read subscriber record; nothing here caches or
// stores a decision.
//
// Three checks run in order (see evaluateAccess):
//   1. Is this subscriber known?
//   2. Has this class been released to them yet? (drip, by sequence_position)
//   3. Which formats can they open? (partner gate, from class 4 onward)

/** The six per-class formats, in the display order Paul specified. */
export const FORMAT_KEYS = [
    "pdf",
    "video",
    "podcast",
    "brief",
    "slides",
    "scriptures",
] as const;

export type FormatKey = (typeof FORMAT_KEYS)[number];

/** Human labels for the format rows. */
export const FORMAT_LABELS: Record<FormatKey, string> = {
    pdf: "Class PDF",
    video: "Full teaching video",
    podcast: "Podcast (20 min)",
    brief: "Video brief (10 min)",
    slides: "PowerPoint",
    scriptures: "Scripture list",
};

/**
 * Classes with sequence_position <= this are FULLY open to everyone — no
 * partner check. That is classes 1, 2, 3 and 4a (positions 1-4). This is
 * load-bearing: 4a is the class that introduces partnership, so gating starts
 * at class 4 (position 5).
 */
export const FREE_THROUGH_SEQUENCE = 4;

/** A class row from the manifest (Google Sheet). */
export type ClassRecord = {
    /** URL segment: "1", "2", "3", "4a", "4" … "90". A STRING — never parse it. */
    slug: string;
    /** Real release order: 4a = 4, class 4 = 5. Always an integer. */
    sequencePosition: number;
    title: string;
    /** Drive file id per format. Missing/empty = "Coming soon". */
    files: Partial<Record<FormatKey, string>>;
    /**
     * External quiz link (e.g. a Google Form).
     *
     * Deliberately NOT part of `files` and NOT a FormatKey: it is a plain URL,
     * never a Drive file id. Nothing here is proxied, embedded or sent to the
     * Drive API — the class page links straight out to it in a new tab.
     * Undefined when the class has no quiz, in which case NO quiz row renders.
     */
    quizUrl?: string;
};

/** A subscriber resolved from Mailchimp. */
export type Subscriber = {
    email: string;
    /** Access token (CTOKEN merge field). */
    token: string;
    /** PARTNER merge field === "true", re-read live on every request. */
    partner: boolean;
    /** COURSESTART merge field parsed to a Date, or null when missing/unparseable. */
    courseStart: Date | null;
};

/** Per-format outcome shown on the class page. */
export type FormatState =
    /** Openable now. */
    | "open"
    /** Exists behind the partner gate — shown with a lock, links to /partner/join. */
    | "locked-partner"
    /** No file id in the manifest yet — shown greyed as "Coming soon". */
    | "coming-soon";

export type AccessResult =
    /** No subscriber could be identified (bad/absent token, unknown email). */
    | { status: "unknown" }
    /**
     * Known subscriber, but this class hasn't dripped to them yet.
     * `unlocksOn` is their REAL unlock date, or null when we can't compute one.
     */
    | { status: "locked-time"; unlocksOn: Date | null; degraded: boolean }
    /**
     * Released — `formats` says what they can actually open.
     *
     * `quiz` is separate from `formats` because the quiz is an external URL,
     * not a Drive file. It is `null` when the class has no quiz_url at all, in
     * which case the page renders no quiz row (never a broken link). When
     * present it follows the SAME gate as the other non-PDF formats.
     */
    | {
          status: "open";
          formats: Record<FormatKey, FormatState>;
          quiz: FormatState | null;
          degraded: boolean;
      };

const DAY_MS = 86_400_000;

/**
 * Whole days elapsed since course start, per the spec's formula:
 *   floor((now - start) / 1 day)
 * Negative (a start date in the future) clamps to 0.
 */
export function daysSinceSignup(courseStart: Date, now: Date): number {
    const diff = now.getTime() - courseStart.getTime();
    if (!Number.isFinite(diff)) return 0;
    return Math.max(0, Math.floor(diff / DAY_MS));
}

/** A class is released once `sequence_position <= daysSinceSignup + 1`. */
export function isReleased(sequencePosition: number, daysSince: number): boolean {
    return sequencePosition <= daysSince + 1;
}

/**
 * The exact moment a class unlocks: course start + (position - 1) days.
 * Inverse of `isReleased`, so the date shown to a subscriber always matches
 * the gate that's actually applied.
 */
export function unlockDateFor(sequencePosition: number, courseStart: Date): Date {
    return new Date(courseStart.getTime() + (sequencePosition - 1) * DAY_MS);
}

/** Classes 1-4a are free for everyone; from class 4 (position 5) the gate applies. */
export function isFreeForEveryone(sequencePosition: number): boolean {
    return sequencePosition <= FREE_THROUGH_SEQUENCE;
}

/**
 * Evaluate the three checks for one subscriber and one class.
 *
 * `degraded` is set when the subscriber is known but their COURSESTART is
 * missing/unparseable. In that case we FAIL SAFE to only classes 1-4a being
 * released — never full access, never a broken page — and the caller is
 * expected to log it loudly, since it points at a signup-flow bug.
 */
export function evaluateAccess(
    subscriber: Subscriber | null,
    klass: ClassRecord,
    now: Date = new Date()
): AccessResult {
    // ── Check 1 — is this subscriber known? ──
    if (!subscriber) return { status: "unknown" };

    const hasStart = subscriber.courseStart instanceof Date && !Number.isNaN(subscriber.courseStart.getTime());
    const degraded = !hasStart;

    // ── Check 2 — has this class been released to them yet? ──
    let released: boolean;
    let unlocksOn: Date | null = null;

    if (hasStart) {
        const start = subscriber.courseStart as Date;
        released = isReleased(klass.sequencePosition, daysSinceSignup(start, now));
        if (!released) unlocksOn = unlockDateFor(klass.sequencePosition, start);
    } else {
        // Fail safe: without a real start date, only the always-free intro
        // classes are considered released. No unlock date can be shown.
        released = isFreeForEveryone(klass.sequencePosition);
    }

    if (!released) return { status: "locked-time", unlocksOn, degraded };

    // ── Check 3 — which formats can they open? ──
    const free = isFreeForEveryone(klass.sequencePosition);
    const formats = {} as Record<FormatKey, FormatState>;

    for (const key of FORMAT_KEYS) {
        const fileId = klass.files[key];
        if (!fileId || !fileId.trim()) {
            // Never render a link to an empty file id.
            formats[key] = "coming-soon";
            continue;
        }
        if (free) {
            formats[key] = "open"; // classes 1-4a: everything open to everyone
        } else if (key === "pdf") {
            formats[key] = "open"; // the PDF is always free, forever
        } else {
            formats[key] = subscriber.partner ? "open" : "locked-partner";
        }
    }

    // The quiz is gated exactly like a non-PDF format, but lives outside
    // `formats` because it is a URL rather than a Drive file. No quiz_url →
    // null → the page renders no quiz row at all.
    const hasQuiz = Boolean(klass.quizUrl && klass.quizUrl.trim());
    const quiz: FormatState | null = !hasQuiz
        ? null
        : free || subscriber.partner
          ? "open"
          : "locked-partner";

    return { status: "open", formats, quiz, degraded };
}

/**
 * Look a class up by its URL slug. Case-insensitive and whitespace-tolerant so
 * "/class/4A" resolves like "/class/4a".
 *
 * NOTE: matching is on the slug STRING only. Never `parseInt` a slug —
 * `parseInt("4a") === 4`, which would silently collide class 4a with class 4.
 */
export function findClassBySlug(classes: ClassRecord[], slug: string): ClassRecord | undefined {
    const want = String(slug ?? "").trim().toLowerCase();
    if (!want) return undefined;
    return classes.find((c) => c.slug.trim().toLowerCase() === want);
}

/** Classes in true release order (by sequence_position), never by slug. */
export function inReleaseOrder(classes: ClassRecord[]): ClassRecord[] {
    return [...classes].sort((a, b) => a.sequencePosition - b.sequencePosition);
}

/** The next class after this one in release order, or undefined at the end. */
export function nextClass(classes: ClassRecord[], current: ClassRecord): ClassRecord | undefined {
    return inReleaseOrder(classes).find((c) => c.sequencePosition > current.sequencePosition);
}

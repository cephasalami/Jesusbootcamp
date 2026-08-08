// src/lib/drip.ts — WHO gets WHICH class email, and when.
//
// Deliberately PURE: no network, no KV, no Date.now() unless you pass it. The
// decision of whether to email a real person is the part most worth being able
// to prove, so it is separated from the machinery that performs the send.
//
// It reuses the SAME release rule as the class pages (access.ts `isReleased`),
// which matters more than it looks: if the drip and the gate ever disagree,
// somebody receives an email for a class that then refuses to open — the exact
// experience that makes people stop trusting the course.

import { daysSinceSignup, inReleaseOrder, isReleased, type ClassRecord } from "./access.ts";

/** Why a subscriber is not being emailed right now. */
export type SkipReason =
    /** No `jbc-course-start` — they never joined the course. */
    | "not-enrolled"
    /** No access token, so any link we sent would fail to identify them. */
    | "no-token"
    /** No start date. Fail safe rather than guess a drip clock. */
    | "no-course-start"
    /** Everything released so far has already been sent. The normal state. */
    | "up-to-date";

export type DripDecision =
    | { action: "send"; klass: ClassRecord; behind: number }
    | { action: "skip"; reason: SkipReason };

export type DripProfile = {
    enrolled: boolean;
    /** YYYY-MM-DD, or null when never stamped. */
    courseStart: string | null;
    /** Empty string means revoked. */
    token: string;
};

/** Parse a stored course start. Mirrors subscriber.ts so both agree on format. */
export function parseStart(raw: string | null | undefined): Date | null {
    const text = String(raw ?? "").trim();
    if (!text) return null;
    const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(text) ? `${text}T00:00:00Z` : text);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Decide the single next class email this subscriber should receive.
 *
 * Returns the EARLIEST released class they have not been sent — not simply
 * "the one that unlocked today". That difference is what makes a missed cron
 * run, a deploy gap or an outage self-healing: the sequence resumes where it
 * stopped instead of silently skipping a class nobody will ever receive.
 *
 * It returns at most ONE class per call by design. Someone who joined 40 days
 * ago and has never been mailed should not be sent 40 emails in one run — they
 * would mark it as spam, and rightly so. `behind` reports how many they are
 * owed so the caller can pace the catch-up.
 */
export function decideNextSend(input: {
    profile: DripProfile;
    classes: ClassRecord[];
    /** Class slugs already sent to this person. */
    sentSlugs: ReadonlySet<string>;
    now?: Date;
}): DripDecision {
    const { profile, classes, sentSlugs, now = new Date() } = input;

    if (!profile.enrolled) return { action: "skip", reason: "not-enrolled" };
    // A link without a token cannot identify anybody, so the email would land
    // them on the "we couldn't find that class" page. Better to send nothing.
    if (!profile.token) return { action: "skip", reason: "no-token" };

    const start = parseStart(profile.courseStart);
    // Never invent a start date. Guessing one either floods them with the whole
    // archive or silently holds back a class forever; both are worse than
    // skipping and letting the missing-CSTART audit surface it.
    if (!start) return { action: "skip", reason: "no-course-start" };

    const days = daysSinceSignup(start, now);
    const due = inReleaseOrder(classes).filter((klass) =>
        isReleased(klass.sequencePosition, days)
    );
    const unsent = due.filter((klass) => !sentSlugs.has(klass.slug));

    if (unsent.length === 0) return { action: "skip", reason: "up-to-date" };
    return { action: "send", klass: unsent[0], behind: unsent.length };
}

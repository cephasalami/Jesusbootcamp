// The drip decides whether a real person receives an email, so every branch
// here is worth pinning down. Two properties matter most:
//
//   • it never skips a class when a run is missed (catch-up resumes in order)
//   • it never sends more than one class per call, however far behind someone is
//
// Getting the second wrong means a subscriber who joined 40 days ago receives
// 40 emails at once and marks them as spam — which is precisely the reputation
// damage this whole effort is trying to undo.
import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { decideNextSend, parseStart } from "../src/lib/drip.ts";
import type { ClassRecord } from "../src/lib/access.ts";

function klass(slug: string, sequencePosition: number): ClassRecord {
    return { slug, sequencePosition, title: `Class ${slug}`, files: {} };
}

// Deliberately out of order, and including the "4a" slug that breaks numeric
// naming, so the code can never rely on array order or on parsing the slug.
const CLASSES: ClassRecord[] = [
    klass("2", 2),
    klass("4a", 4),
    klass("1", 1),
    klass("3", 3),
    klass("4", 5),
];

const START = "2026-08-01";
/** Day N of the course, as a Date. Day 1 is the start date itself. */
const dayOf = (n: number) => new Date(`2026-08-0${n}T09:00:00Z`);

const enrolled = { enrolled: true, courseStart: START, token: "a".repeat(64) };
const none: ReadonlySet<string> = new Set();

describe("drip: who gets which class", () => {
    test("sends class 1 on day one", () => {
        const decision = decideNextSend({
            profile: enrolled,
            classes: CLASSES,
            sentSlugs: none,
            now: dayOf(1),
        });
        assert.equal(decision.action, "send");
        assert.equal(decision.action === "send" && decision.klass.slug, "1");
    });

    test("moves to the next class once the previous is sent", () => {
        const decision = decideNextSend({
            profile: enrolled,
            classes: CLASSES,
            sentSlugs: new Set(["1"]),
            now: dayOf(2),
        });
        assert.equal(decision.action === "send" && decision.klass.slug, "2");
    });

    test("is up-to-date when everything released has been sent", () => {
        const decision = decideNextSend({
            profile: enrolled,
            classes: CLASSES,
            sentSlugs: new Set(["1", "2"]),
            now: dayOf(2),
        });
        assert.deepEqual(decision, { action: "skip", reason: "up-to-date" });
    });

    test("resumes in order after missed runs, never skipping ahead", () => {
        // Day 4: classes 1,2,3 and 4a are all released, but only 1 was sent.
        const decision = decideNextSend({
            profile: enrolled,
            classes: CLASSES,
            sentSlugs: new Set(["1"]),
            now: dayOf(4),
        });
        assert.equal(
            decision.action === "send" && decision.klass.slug,
            "2",
            "must resume at the oldest unsent class, not jump to today's"
        );
    });

    test("sends only ONE class however far behind, and reports the backlog", () => {
        const decision = decideNextSend({
            profile: enrolled,
            classes: CLASSES,
            sentSlugs: none,
            now: dayOf(5),
        });
        assert.equal(decision.action, "send");
        assert.equal(decision.action === "send" && decision.klass.slug, "1");
        assert.equal(
            decision.action === "send" && decision.behind,
            5,
            "all five are owed, but only one is returned"
        );
    });

    test("respects the same release rule as the class pages", () => {
        // Day 1: class 2 (position 2) is NOT yet released.
        const decision = decideNextSend({
            profile: enrolled,
            classes: CLASSES,
            sentSlugs: new Set(["1"]),
            now: dayOf(1),
        });
        assert.deepEqual(
            decision,
            { action: "skip", reason: "up-to-date" },
            "must not mail a class the gate would refuse to open"
        );
    });
});

describe("drip: who gets nothing", () => {
    test("skips someone not enrolled", () => {
        const decision = decideNextSend({
            profile: { ...enrolled, enrolled: false },
            classes: CLASSES,
            sentSlugs: none,
            now: dayOf(1),
        });
        assert.deepEqual(decision, { action: "skip", reason: "not-enrolled" });
    });

    test("skips someone with no access token", () => {
        const decision = decideNextSend({
            profile: { ...enrolled, token: "" },
            classes: CLASSES,
            sentSlugs: none,
            now: dayOf(1),
        });
        assert.deepEqual(decision, { action: "skip", reason: "no-token" });
    });

    test("skips — never guesses — when the start date is missing", () => {
        const decision = decideNextSend({
            profile: { ...enrolled, courseStart: null },
            classes: CLASSES,
            sentSlugs: none,
            now: dayOf(1),
        });
        assert.deepEqual(decision, { action: "skip", reason: "no-course-start" });
    });

    test("treats an unparseable start date as missing", () => {
        const decision = decideNextSend({
            profile: { ...enrolled, courseStart: "not a date" },
            classes: CLASSES,
            sentSlugs: none,
            now: dayOf(1),
        });
        assert.deepEqual(decision, { action: "skip", reason: "no-course-start" });
    });
});

describe("drip: start-date parsing", () => {
    test("accepts the YYYY-MM-DD we write, as UTC", () => {
        assert.equal(parseStart("2026-08-01")?.toISOString(), "2026-08-01T00:00:00.000Z");
    });

    test("accepts a full ISO timestamp", () => {
        assert.equal(parseStart("2026-08-01T12:30:00Z")?.toISOString(), "2026-08-01T12:30:00.000Z");
    });

    test("rejects junk and blanks rather than defaulting to today", () => {
        assert.equal(parseStart(""), null);
        assert.equal(parseStart(null), null);
        assert.equal(parseStart("soon"), null);
    });
});

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
    evaluateAccess,
    findClassBySlug,
    inReleaseOrder,
    nextClass,
    daysSinceSignup,
    unlockDateFor,
    FORMAT_KEYS,
    type ClassRecord,
    type Subscriber,
} from "../src/lib/access.ts";

// ── Fixtures ────────────────────────────────────────────────────────────────
// Deliberately includes the 4a/4 collision and out-of-order slugs.
const ALL_FILES = {
    pdf: "id_pdf",
    video: "id_video",
    podcast: "id_podcast",
    brief: "id_brief",
    slides: "id_slides",
    flashcards: "id_flash",
    scriptures: "id_scrip",
};

const CLASSES: ClassRecord[] = [
    { slug: "1", sequencePosition: 1, title: "Class One", files: { ...ALL_FILES } },
    { slug: "2", sequencePosition: 2, title: "Class Two", files: { ...ALL_FILES } },
    { slug: "3", sequencePosition: 3, title: "Class Three", files: { ...ALL_FILES } },
    { slug: "4a", sequencePosition: 4, title: "We're ALL Laborers In The Harvest", files: { ...ALL_FILES } },
    { slug: "4", sequencePosition: 5, title: "Class Four", files: { ...ALL_FILES } },
    { slug: "5", sequencePosition: 6, title: "Class Five", files: { ...ALL_FILES } },
];

const NOW = new Date("2026-07-25T12:00:00Z");
/** Signed up 6 days ago → daysSinceSignup = 6 → released through position 7. */
const SIX_DAYS_AGO = new Date("2026-07-19T12:00:00Z");

function sub(over: Partial<Subscriber> = {}): Subscriber {
    return {
        email: "test@example.com",
        token: "tok",
        partner: false,
        courseStart: SIX_DAYS_AGO,
        ...over,
    };
}

const cls = (slug: string) => findClassBySlug(CLASSES, slug)!;

// ════════════════════════════════════════════════════════════════════════════
// PART 0 — the 4a / 4 slug collision. parseInt("4a") === 4.
// ════════════════════════════════════════════════════════════════════════════
describe("PART 0 — slug routing: /class/4 vs /class/4a", () => {
    test("resolve to DISTINCT classes", () => {
        const four = findClassBySlug(CLASSES, "4");
        const fourA = findClassBySlug(CLASSES, "4a");
        assert.ok(four, "/class/4 must resolve");
        assert.ok(fourA, "/class/4a must resolve");
        assert.notEqual(four!.slug, fourA!.slug);
        assert.notEqual(four!.sequencePosition, fourA!.sequencePosition);
    });

    test("resolve to the CORRECT class each way round", () => {
        assert.equal(findClassBySlug(CLASSES, "4a")!.title, "We're ALL Laborers In The Harvest");
        assert.equal(findClassBySlug(CLASSES, "4a")!.sequencePosition, 4);
        assert.equal(findClassBySlug(CLASSES, "4")!.title, "Class Four");
        assert.equal(findClassBySlug(CLASSES, "4")!.sequencePosition, 5);
    });

    test("the parseInt trap would have collided them", () => {
        // Guards the exact bug: a numeric lookup maps both slugs to one class.
        assert.equal(parseInt("4a", 10), parseInt("4", 10));
        // Our lookup is string-based, so it does not.
        assert.notEqual(findClassBySlug(CLASSES, "4a"), findClassBySlug(CLASSES, "4"));
    });

    test("slug lookup is case/whitespace tolerant but never numeric-coerced", () => {
        assert.equal(findClassBySlug(CLASSES, "4A")!.slug, "4a");
        assert.equal(findClassBySlug(CLASSES, " 4a ")!.slug, "4a");
        assert.equal(findClassBySlug(CLASSES, "04"), undefined, "'04' must not match '4'");
        assert.equal(findClassBySlug(CLASSES, ""), undefined);
    });

    test("ordering and next-class use sequence_position, not slug text", () => {
        assert.deepEqual(
            inReleaseOrder(CLASSES).map((c) => c.slug),
            ["1", "2", "3", "4a", "4", "5"],
            "4a must sort BEFORE 4"
        );
        assert.equal(nextClass(CLASSES, cls("4a"))!.slug, "4", "after 4a comes 4");
        assert.equal(nextClass(CLASSES, cls("3"))!.slug, "4a", "after 3 comes 4a");
        assert.equal(nextClass(CLASSES, cls("5")), undefined);
    });
});

// ════════════════════════════════════════════════════════════════════════════
// PART 3 — the three access checks
// ════════════════════════════════════════════════════════════════════════════
describe("Check 1 — unknown subscriber", () => {
    test("no subscriber → status 'unknown' (never a crash or blank)", () => {
        assert.equal(evaluateAccess(null, cls("1"), NOW).status, "unknown");
        assert.equal(evaluateAccess(null, cls("90" in {} ? "90" : "5"), NOW).status, "unknown");
    });
});

describe("Check 2 — drip release", () => {
    // NOTE ON THE SPEC: Part 7 asks for "signup_date 6 days ago … cannot open
    // class 5". That is impossible under the formula Part 3 specifies:
    //   accessible = sequence_position <= daysSinceSignup + 1
    // At 6 days that releases positions 1-7, and class 5 is position 6 (4a
    // shifts everything after it), so class 5 IS open at 6 days. The formula is
    // the explicit contract, so it is kept as-is; the boundary the spec actually
    // cares about (1-4a + 4 open, 5 locked) occurs at FOUR days. Both are
    // asserted below. Flagged in the report.
    const FOUR_DAYS_AGO = new Date("2026-07-21T12:00:00Z");

    test("day maths", () => {
        assert.equal(daysSinceSignup(FOUR_DAYS_AGO, NOW), 4);
        assert.equal(daysSinceSignup(SIX_DAYS_AGO, NOW), 6);
    });

    test("signup 4 days ago: classes 1, 2, 3, 4a and 4 are released", () => {
        for (const slug of ["1", "2", "3", "4a", "4"]) {
            const r = evaluateAccess(sub({ courseStart: FOUR_DAYS_AGO }), cls(slug), NOW);
            assert.equal(r.status, "open", `class ${slug} should be open`);
        }
    });

    test("signup 4 days ago: class 5 (position 6) is NOT released, with its real unlock date", () => {
        const r = evaluateAccess(sub({ courseStart: FOUR_DAYS_AGO }), cls("5"), NOW);
        assert.equal(r.status, "locked-time");
        assert.ok(r.status === "locked-time" && r.unlocksOn instanceof Date);
        // position 6 unlocks at start + 5 days = 2026-07-26T12:00:00Z
        assert.equal(
            (r as { unlocksOn: Date }).unlocksOn.toISOString(),
            new Date("2026-07-26T12:00:00Z").toISOString()
        );
    });

    test("signup 6 days ago: class 5 IS open (documents the specified formula)", () => {
        assert.equal(evaluateAccess(sub({ courseStart: SIX_DAYS_AGO }), cls("5"), NOW).status, "open");
    });

    test("day 0 — signing up today releases class 1 immediately", () => {
        const r = evaluateAccess(sub({ courseStart: NOW }), cls("1"), NOW);
        assert.equal(r.status, "open");
        assert.equal(evaluateAccess(sub({ courseStart: NOW }), cls("2"), NOW).status, "locked-time");
    });

    test("the unlock date is exactly when isReleased flips (no off-by-one)", () => {
        const unlockAt = unlockDateFor(6, FOUR_DAYS_AGO);
        const justBefore = new Date(unlockAt.getTime() - 1000);
        const s = sub({ courseStart: FOUR_DAYS_AGO });
        assert.equal(evaluateAccess(s, cls("5"), justBefore).status, "locked-time");
        assert.equal(evaluateAccess(s, cls("5"), unlockAt).status, "open");
    });
});

describe("Check 2 — missing/unparseable COURSESTART fails SAFE", () => {
    test("only classes 1-4a are released; class 4 and beyond stay locked", () => {
        const s = sub({ courseStart: null });
        for (const slug of ["1", "2", "3", "4a"]) {
            const r = evaluateAccess(s, cls(slug), NOW);
            assert.equal(r.status, "open", `class ${slug} should still open`);
            assert.equal((r as { degraded: boolean }).degraded, true, "must flag degraded for loud logging");
        }
        const four = evaluateAccess(s, cls("4"), NOW);
        assert.equal(four.status, "locked-time", "must NOT grant full access");
        assert.equal((four as { unlocksOn: Date | null }).unlocksOn, null, "no date can be computed");
        assert.equal((four as { degraded: boolean }).degraded, true);
    });

    test("an Invalid Date is treated the same as missing", () => {
        const r = evaluateAccess(sub({ courseStart: new Date("nonsense") }), cls("4"), NOW);
        assert.equal(r.status, "locked-time");
        assert.equal((r as { degraded: boolean }).degraded, true);
    });
});

describe("Check 3 — partner gating", () => {
    test("class 4 (position 5), NON-partner: PDF open, other six locked", () => {
        const r = evaluateAccess(sub({ partner: false }), cls("4"), NOW);
        assert.equal(r.status, "open");
        const f = (r as { formats: Record<string, string> }).formats;
        assert.equal(f.pdf, "open", "PDF is free forever");
        for (const key of FORMAT_KEYS.filter((k) => k !== "pdf")) {
            assert.equal(f[key], "locked-partner", `${key} must be partner-gated`);
        }
        // All seven rows are still present — locked formats are shown, not hidden.
        assert.equal(Object.keys(f).length, 7);
    });

    test("class 4, PARTNER: all seven formats open", () => {
        const r = evaluateAccess(sub({ partner: true }), cls("4"), NOW);
        const f = (r as { formats: Record<string, string> }).formats;
        for (const key of FORMAT_KEYS) assert.equal(f[key], "open", `${key} should be open for a partner`);
    });

    test("classes 1, 2, 3, 4a: ALL formats open for BOTH partner and non-partner", () => {
        for (const partner of [false, true]) {
            for (const slug of ["1", "2", "3", "4a"]) {
                const r = evaluateAccess(sub({ partner }), cls(slug), NOW);
                const f = (r as { formats: Record<string, string> }).formats;
                for (const key of FORMAT_KEYS) {
                    assert.equal(f[key], "open", `class ${slug} ${key} (partner=${partner}) must be open`);
                }
            }
        }
    });

    test("cancellation takes effect on the very next evaluation", () => {
        const before = evaluateAccess(sub({ partner: true }), cls("4"), NOW);
        assert.equal((before as { formats: Record<string, string> }).formats.video, "open");
        // Same subscriber, PARTNER flipped false — no cached decision carries over.
        const after = evaluateAccess(sub({ partner: false }), cls("4"), NOW);
        assert.equal((after as { formats: Record<string, string> }).formats.video, "locked-partner");
        assert.equal((after as { formats: Record<string, string> }).formats.pdf, "open");
    });

    test("empty file id renders 'coming-soon', never a link — even for a partner", () => {
        const partial: ClassRecord = {
            slug: "7",
            sequencePosition: 7,
            title: "Partial",
            files: { pdf: "id_pdf", video: "", podcast: "   " },
        };
        const r = evaluateAccess(sub({ partner: true, courseStart: new Date("2026-01-01T00:00:00Z") }), partial, NOW);
        const f = (r as { formats: Record<string, string> }).formats;
        assert.equal(f.pdf, "open");
        assert.equal(f.video, "coming-soon", "empty string is not a file id");
        assert.equal(f.podcast, "coming-soon", "whitespace is not a file id");
        assert.equal(f.slides, "coming-soon", "absent key is coming-soon");
    });

    test("quiz follows the SAME gate as the other non-PDF formats", () => {
        const withQuiz: ClassRecord = {
            slug: "4",
            sequencePosition: 5, // gated tier
            title: "Class Four",
            files: { ...ALL_FILES },
            quizUrl: "https://docs.google.com/forms/d/e/1FAIpQLSabc/viewform",
        };
        const nonPartner = evaluateAccess(sub({ partner: false }), withQuiz, NOW);
        assert.equal((nonPartner as { quiz: string | null }).quiz, "locked-partner");
        const partner = evaluateAccess(sub({ partner: true }), withQuiz, NOW);
        assert.equal((partner as { quiz: string | null }).quiz, "open");
    });

    test("quiz is open to everyone on classes 1-4a, partner or not", () => {
        const freeWithQuiz: ClassRecord = {
            slug: "4a",
            sequencePosition: 4, // always-free tier
            title: "We're ALL Laborers In The Harvest",
            files: { ...ALL_FILES },
            quizUrl: "https://forms.gle/AbCdEf123",
        };
        for (const partner of [false, true]) {
            const r = evaluateAccess(sub({ partner }), freeWithQuiz, NOW);
            assert.equal((r as { quiz: string | null }).quiz, "open", `partner=${partner}`);
        }
    });

    test("no quiz_url → quiz is null so NO row renders (never a broken link)", () => {
        const r = evaluateAccess(sub({ partner: true }), cls("4"), NOW);
        assert.equal((r as { quiz: string | null }).quiz, null);
        // And an explicitly blank string counts as absent, not as a broken link.
        const blank: ClassRecord = { ...cls("4"), quizUrl: "   " };
        assert.equal((evaluateAccess(sub({ partner: true }), blank, NOW) as { quiz: string | null }).quiz, null);
    });

    test("a time-locked class never exposes a quiz state", () => {
        const later: ClassRecord = {
            slug: "9",
            sequencePosition: 40,
            title: "Far future",
            files: { ...ALL_FILES },
            quizUrl: "https://forms.gle/AbCdEf123",
        };
        const r = evaluateAccess(sub({ partner: true }), later, NOW);
        assert.equal(r.status, "locked-time");
        assert.equal("quiz" in r, false, "quiz is only decided once the class is released");
    });

    test("'coming-soon' outranks the partner lock (no link to a missing file)", () => {
        const partial: ClassRecord = {
            slug: "8",
            sequencePosition: 8,
            title: "Partial",
            files: { pdf: "id_pdf" },
        };
        const r = evaluateAccess(sub({ partner: false, courseStart: new Date("2026-01-01T00:00:00Z") }), partial, NOW);
        const f = (r as { formats: Record<string, string> }).formats;
        assert.equal(f.video, "coming-soon");
    });
});

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseManifestRows, validateQuizUrl } from "../src/lib/manifest-parse.ts";
import { findClassBySlug, inReleaseOrder } from "../src/lib/access.ts";

const HEADERS = [
    "slug",
    "sequence_position",
    "title",
    "pdf_file_id",
    "video_file_id",
    "podcast_file_id",
    "brief_file_id",
    "slides_file_id",
    "scriptures_file_id",
    "quiz_url",
];

/** Row builder that puts a quiz_url in the 10th column. */
const rowQ = (slug: string, seq: string, title: string, quiz: string) => [
    slug, seq, title, "pdf", "vid", "pod", "brief", "slides", "scrip", quiz,
];

const row = (slug: string, seq: string, title: string, ...files: string[]) => [
    slug,
    seq,
    title,
    ...files,
];

describe("manifest parsing", () => {
    test("parses a healthy sheet, preserving 4a as a string slug", () => {
        const { classes, warnings } = parseManifestRows([
            HEADERS,
            row("1", "1", "Class One", "pdf1", "vid1"),
            row("4a", "4", "We're ALL Laborers In The Harvest", "pdfA", "vidA"),
            row("4", "5", "Class Four", "pdf4"),
        ]);
        assert.equal(classes.length, 3);
        assert.equal(warnings.length, 0);

        const fourA = findClassBySlug(classes, "4a")!;
        assert.equal(fourA.slug, "4a", "slug stays a string");
        assert.equal(fourA.sequencePosition, 4);
        assert.equal(findClassBySlug(classes, "4")!.sequencePosition, 5);
        assert.deepEqual(inReleaseOrder(classes).map((c) => c.slug), ["1", "4a", "4"]);
    });

    test("empty file-ID cells are normal and simply omitted", () => {
        const { classes, warnings } = parseManifestRows([
            HEADERS,
            row("2", "2", "Class Two", "pdf2", "", "   "),
        ]);
        assert.equal(warnings.length, 0, "missing formats are expected, not warnings");
        assert.equal(classes[0].files.pdf, "pdf2");
        assert.equal(classes[0].files.video, undefined);
        assert.equal(classes[0].files.podcast, undefined);
    });

    // ── Part 7 requirement ──
    test("a row missing sequence_position is SKIPPED with a warning, others still load", () => {
        const { classes, warnings } = parseManifestRows([
            HEADERS,
            row("1", "1", "Good One", "pdf1"),
            row("2", "", "Missing Position", "pdf2"),
            row("3", "3", "Good Two", "pdf3"),
        ]);
        assert.equal(classes.length, 2, "the good rows still load");
        assert.deepEqual(classes.map((c) => c.slug), ["1", "3"]);
        assert.equal(findClassBySlug(classes, "2"), undefined);
        assert.equal(warnings.length, 1);
        assert.match(warnings[0], /row 3/);
        assert.match(warnings[0], /sequence_position/);
    });

    // Real-data regression: the live sheet opens with slug "0" / position 0 —
    // "Why The Jesus Boot Camp". Requiring >= 1 silently hid that whole class.
    test("sequence_position 0 is VALID (the real intro class)", () => {
        const { classes, warnings } = parseManifestRows([
            HEADERS.slice(0, 9),
            ["0", "0", "Why The Jesus Boot Camp", "pdf0"],
            ["1", "1", "What it means to be born again", "pdf1"],
        ]);
        assert.equal(warnings.length, 0, "position 0 must not warn");
        assert.equal(classes.length, 2);
        assert.equal(classes[0].slug, "0");
        assert.equal(classes[0].sequencePosition, 0);
        assert.deepEqual(inReleaseOrder(classes).map((c) => c.slug), ["0", "1"]);
    });

    test("a negative sequence_position is still rejected", () => {
        const { classes, warnings } = parseManifestRows([
            HEADERS.slice(0, 9),
            ["x", "-1", "Nope", "pdf"],
        ]);
        assert.equal(classes.length, 0);
        assert.match(warnings[0], />= 0/);
    });

    test("a non-integer sequence_position is skipped (including the '4a' trap)", () => {
        const { classes, warnings } = parseManifestRows([
            HEADERS,
            row("4a", "4a", "Position wrongly copied from slug", "pdf"),
            row("5", "6", "Fine", "pdf"),
        ]);
        assert.deepEqual(classes.map((c) => c.slug), ["5"]);
        assert.match(warnings[0], /not an integer/);
    });

    test("empty slug and duplicate slug rows are skipped", () => {
        const { classes, warnings } = parseManifestRows([
            HEADERS,
            row("", "1", "No slug", "pdf"),
            row("7", "7", "First wins", "pdfA"),
            row("7", "8", "Duplicate", "pdfB"),
        ]);
        assert.deepEqual(classes.map((c) => c.slug), ["7"]);
        assert.equal(classes[0].files.pdf, "pdfA");
        assert.equal(warnings.length, 2);
        assert.match(warnings.join(" "), /empty slug/);
        assert.match(warnings.join(" "), /duplicate slug/);
    });

    test("blank spacer rows are ignored silently", () => {
        const { classes, warnings } = parseManifestRows([
            HEADERS,
            row("1", "1", "One", "pdf"),
            ["", "", "", "", ""],
            [],
            row("2", "2", "Two", "pdf"),
        ]);
        assert.equal(classes.length, 2);
        assert.equal(warnings.length, 0);
    });

    test("a missing required column fails cleanly rather than throwing", () => {
        const { classes, warnings } = parseManifestRows([
            ["slug", "title"],
            ["1", "One"],
        ]);
        assert.equal(classes.length, 0);
        assert.match(warnings[0], /missing required column/);
    });

    test("an empty sheet does not throw", () => {
        assert.doesNotThrow(() => parseManifestRows([]));
        assert.equal(parseManifestRows([]).classes.length, 0);
    });

    // ── quiz_url (its own column, never a Drive file id) ──
    test("a valid quiz_url parses onto quizUrl, separate from files", () => {
        const url = "https://docs.google.com/forms/d/e/1FAIpQLSabc123/viewform";
        const { classes, warnings } = parseManifestRows([HEADERS, rowQ("1", "1", "One", url)]);
        assert.equal(warnings.length, 0);
        assert.equal(classes[0].quizUrl, url);
        // Critically: it must NOT be folded into the Drive file-id map.
        assert.equal(Object.values(classes[0].files).includes(url), false);
        assert.deepEqual(Object.keys(classes[0].files).sort(), [
            "brief", "pdf", "podcast", "scriptures", "slides", "video",
        ]);
    });

    test("an EMPTY quiz_url yields no quizUrl at all (no broken link, no warning)", () => {
        const { classes, warnings } = parseManifestRows([
            HEADERS,
            rowQ("1", "1", "One", ""),
            rowQ("2", "2", "Two", "   "),
        ]);
        assert.equal(warnings.length, 0, "an absent quiz is normal, not a warning");
        assert.equal(classes[0].quizUrl, undefined);
        assert.equal(classes[1].quizUrl, undefined);
        assert.equal("quizUrl" in classes[0], false, "key omitted entirely");
    });

    test("a sheet with no quiz_url column at all still parses", () => {
        const { classes, warnings } = parseManifestRows([
            HEADERS.slice(0, 10),
            ["1", "1", "One", "pdf"],
        ]);
        assert.equal(warnings.length, 0);
        assert.equal(classes[0].quizUrl, undefined);
    });

    // ── the real mistake that already happened once ──
    test("a Google Forms /edit link is FLAGGED and rejected", () => {
        const editUrl = "https://docs.google.com/forms/d/1AbC_dEfGhIjK/edit";
        const { classes, warnings } = parseManifestRows([HEADERS, rowQ("1", "1", "One", editUrl)]);
        assert.equal(warnings.length, 1, "must warn, never silently accept");
        assert.match(warnings[0], /EDITOR link/);
        assert.match(warnings[0], /viewform/, "warning tells the editor how to fix it");
        assert.ok(warnings[0].includes(editUrl), "warning names the offending URL");
        assert.equal(classes[0].quizUrl, undefined, "no /edit link is ever served to subscribers");
    });

    test("/edit is caught in the other Google Forms url shapes too", () => {
        for (const url of [
            "https://docs.google.com/forms/d/1AbC/edit",
            "https://docs.google.com/forms/d/1AbC/edit#responses",
            "https://docs.google.com/forms/d/1AbC/edit?usp=sharing",
            "https://forms.google.com/forms/d/1AbC/edit",
        ]) {
            const warnings: string[] = [];
            assert.equal(validateQuizUrl(url, "row 2", warnings), undefined, url);
            assert.match(warnings[0], /EDITOR link/, url);
        }
    });

    test("the legitimate /viewform link is accepted untouched", () => {
        for (const url of [
            "https://docs.google.com/forms/d/e/1FAIpQLSabc/viewform",
            "https://docs.google.com/forms/d/e/1FAIpQLSabc/viewform?usp=sf_link",
            "https://forms.gle/AbCdEf123",
        ]) {
            const warnings: string[] = [];
            assert.equal(validateQuizUrl(url, "row 2", warnings), url, url);
            assert.equal(warnings.length, 0, `${url} should not warn`);
        }
    });

    test("a non-URL or non-http quiz_url is rejected with a warning", () => {
        for (const bad of ["not a url", "quiz.html", "javascript:alert(1)", "ftp://x.com/q"]) {
            const warnings: string[] = [];
            assert.equal(validateQuizUrl(bad, "row 2", warnings), undefined, bad);
            assert.equal(warnings.length, 1, bad);
        }
    });

    test("a bad quiz_url does not discard the rest of the row", () => {
        const { classes, warnings } = parseManifestRows([
            HEADERS,
            rowQ("4a", "4", "Laborers", "https://docs.google.com/forms/d/1AbC/edit"),
        ]);
        assert.equal(classes.length, 1, "the class still loads");
        assert.equal(classes[0].slug, "4a");
        assert.equal(classes[0].files.pdf, "pdf", "its files are untouched");
        assert.equal(classes[0].quizUrl, undefined, "only the quiz is dropped");
        assert.equal(warnings.length, 1);
    });

    test("headers are matched case-insensitively and order-independently", () => {
        const { classes } = parseManifestRows([
            ["Title", "SLUG", "Sequence_Position", "PDF_File_ID"],
            ["Class One", "1", "1", "pdf1"],
        ]);
        assert.equal(classes.length, 1);
        assert.equal(classes[0].slug, "1");
        assert.equal(classes[0].title, "Class One");
        assert.equal(classes[0].files.pdf, "pdf1");
    });
});

describe("sendgrid_template_id column", () => {
    const H = ["slug", "sequence_position", "title", "sendgrid_template_id"];
    const VALID = `d-${"a1b2c3d4".repeat(4)}`;

    test("reads a valid dynamic template id", () => {
        const { classes, warnings } = parseManifestRows([H, ["1", "1", "Born Again", VALID]]);
        assert.equal(classes[0].sendgridTemplateId, VALID);
        assert.deepEqual(warnings, []);
    });

    test("a blank cell simply means no drip email for that class", () => {
        const { classes, warnings } = parseManifestRows([H, ["1", "1", "Born Again", "  "]]);
        assert.equal(classes[0].sendgridTemplateId, undefined);
        assert.deepEqual(warnings, [], "blank is normal, not a problem to report");
    });

    test("the column being absent entirely is fine", () => {
        const { classes, warnings } = parseManifestRows([
            ["slug", "sequence_position", "title"],
            ["1", "1", "Born Again"],
        ]);
        assert.equal(classes[0].sendgridTemplateId, undefined);
        assert.deepEqual(warnings, []);
    });

    test("rejects a malformed id loudly rather than failing at send time", () => {
        // A pasted template NAME is the likeliest mistake, and SendGrid would
        // answer an opaque 400 once per recipient.
        const { classes, warnings } = parseManifestRows([H, ["1", "1", "Born Again", "Class 1 Template"]]);
        assert.equal(classes[0].sendgridTemplateId, undefined, "must not pass a bad id through to SendGrid");
        assert.equal(warnings.length, 1);
        assert.match(warnings[0], /not a dynamic template id/);
    });

    test("rejects a legacy (non-dynamic) template id", () => {
        const legacy = "13b8f94f-bcae-4ec6-b752-70d6cb59f932";
        const { classes, warnings } = parseManifestRows([H, ["1", "1", "Born Again", legacy]]);
        assert.equal(classes[0].sendgridTemplateId, undefined);
        assert.match(warnings[0], /not a dynamic template id/);
    });
});

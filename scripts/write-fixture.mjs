// Appends/updates CLASS_MANIFEST_FIXTURE in .env.local (dev only).
import { readFileSync, writeFileSync } from "node:fs";

const HEADER = [
    "slug", "sequence_position", "title",
    "pdf_file_id", "video_file_id", "podcast_file_id", "brief_file_id",
    "slides_file_id", "scriptures_file_id",
    "quiz_url",
];
const all = (n) => [`FAKE_PDF_FILE_ID_${n}`, `FAKE_VID_${n}`, `FAKE_POD_${n}`, `FAKE_BRIEF_${n}`, `FAKE_SLIDES_${n}`, `FAKE_SCRIP_${n}`];

const GOOD_QUIZ = "https://docs.google.com/forms/d/e/1FAIpQLSfixture123/viewform";
// The exact mistake that has happened for real: the Google Forms EDITOR link.
const EDIT_QUIZ = "https://docs.google.com/forms/d/1BrokenEditorLink/edit";

const values = [
    HEADER,
    ["1", "1", "Class One Title", ...all("1"), GOOD_QUIZ],
    // class 2 has NO quiz — its row must not render at all.
    ["2", "2", "Class Two Title", ...all("2"), ""],
    // class 3 has the editor link — must warn and render no quiz row.
    ["3", "3", "Class Three Title", ...all("3"), EDIT_QUIZ],
    ["4a", "4", "We're ALL Laborers In The Harvest", ...all("4A"), "https://forms.gle/FixtureAbC123"],
    ["4", "5", "Class Four Title", ...all("4"), GOOD_QUIZ],
    ["5", "6", "Class Five Title", ...all("5"), GOOD_QUIZ],
    // A deliberately malformed row: missing sequence_position. Must be SKIPPED
    // with a warning, not crash the manifest.
    ["6", "", "Class Six Broken Row", ...all("6"), ""],
];

// Base64: a single unquoted token, so dotenv can't mangle the embedded quotes.
const b64 = Buffer.from(JSON.stringify({ values }), "utf8").toString("base64");
const line = `CLASS_MANIFEST_FIXTURE=${b64}`;
const path = ".env.local";
const existing = readFileSync(path, "utf8");
const cleaned = existing
    .split(/\r?\n/)
    .filter((l) => !l.startsWith("CLASS_MANIFEST_FIXTURE="))
    .join("\n")
    .replace(/\n+$/, "");
writeFileSync(path, `${cleaned}\n\n# DEV ONLY — remove once the real manifest Sheet is wired up.\n${line}\n`, "utf8");
console.log("fixture written:", values.length - 1, "rows (1 intentionally malformed)");

// Convert one Mailchimp class email into a SendGrid dynamic template.
//
// WHY THIS EXISTS
// Every class email arrives as a Mailchimp export and needs the same dozen
// transforms before SendGrid can send it. Doing that by hand is not merely slow
// — it is the kind of repetitive work where the ONE thing you forget is the
// thing that reaches subscribers. The two real defects found while converting
// classes 4b-15 by hand were both of that shape:
//
//   · /class/11 and /class/12 in the exports, when the manifest slugs are 11a
//     and 12a. A hardcoded link looks perfectly fine in review and 404s in the
//     inbox. Now impossible: the slug is checked against the manifest, and the
//     link is replaced with {{class_url}} regardless of what it pointed at.
//   · Class 14's export had Mailchimp's stock "Heading 1 / Getting started!"
//     starter template appended after </html>. Subscribers would have received
//     placeholder copy and a second unsubscribe block. Now truncated at the
//     first </html>.
//
// THE RULE THIS SCRIPT ENFORCES: fail loudly rather than ship quietly. An
// unrecognised *|MERGE|* tag, a missing manifest slug, or any failed output
// check aborts the run and writes nothing. A tag this script does not know how
// to convert would otherwise reach a subscriber as literal "*|FNAME|*" text.
//
//   node --env-file=.env.local scripts/convert-mailchimp-class-email.mts <slug> <export.html>
//   node --env-file=.env.local scripts/convert-mailchimp-class-email.mts <slug> <export.html> --apply
//
// Audits by default: prints what it would change and every check result.
// --apply writes emails/classes/<slug>.html, the cover, and the index entry.
// Uploading stays a separate step — scripts/upload-sendgrid-templates.mts.
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { getManifest } from "../src/lib/manifest.ts";

const args = process.argv.slice(2).filter((a) => a !== "--apply");
const apply = process.argv.includes("--apply");
const [slug, sourcePath] = args;

if (!slug || !sourcePath) {
    throw new Error(
        "Usage: convert-mailchimp-class-email.mts <slug> <export.html> [--apply]\n" +
            "The slug must match the class manifest — 11a, not 11."
    );
}

const REPO = path.resolve(import.meta.dirname, "..");
const outHtml = path.join(REPO, "emails", "classes", `${slug}.html`);
const coverName = `class-${slug}.png`;
const outCover = path.join(REPO, "public", "images", "email", coverName);
const indexPath = path.join(REPO, "emails", "index.json");

// ── 1. The slug must be a real class ────────────────────────────────────────
// A template whose slug is absent from the manifest can never be sent: the drip
// walks the manifest, so it would simply never be reached. Worse, the class
// page it links to renders "we couldn't find that class". Catching it here is
// the whole reason the manifest is loaded.
const manifest = await getManifest();
// ⚠️ An empty manifest means the Sheets read FAILED, not that there are no
// classes — getManifest degrades to [] when the network times out, which it
// does regularly here. Without this the next check reports "no class with slug
// X" and sends you looking for a Sheet row that is already present.
if (manifest.length === 0) {
    throw new Error(
        "The class manifest came back empty, which means the Google Sheets read failed —\n" +
            "it does not mean the slug is missing. Re-run; nothing was written."
    );
}
const klass = manifest.find((k) => k.slug === slug);
if (!klass) {
    const near = manifest.map((k) => k.slug).filter((s) => s.startsWith(slug) || slug.startsWith(s));
    throw new Error(
        `No class with slug "${slug}" in the manifest.` +
            (near.length ? `\nDid you mean: ${near.join(", ")}? Lettered slugs are common (4a, 11a, 12a).` : "")
    );
}

// ── 2. Read the export, and cut the accidental second document ──────────────
const raw = await readFile(sourcePath, "utf8");
const endOfDoc = raw.toLowerCase().indexOf("</html>");
let html = endOfDoc === -1 ? raw : raw.slice(0, endOfDoc + "</html>".length);
const trailingBytes = raw.length - html.length;

// ── 3. Transforms ───────────────────────────────────────────────────────────
const notes: string[] = [];
const before = html;

/** Collapse Mailchimp's two doctypes into one. Both present flips some clients
 *  into quirks mode, where the table widths render differently. */
html = html.replace(/<!DOCTYPE[^>]*>\s*<!doctype html>/i, `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">`);
html = html.replace(/<html lang="en">/i, `<html xmlns="http://www.w3.org/1999/xhtml" lang="en">`);

/** The greeting. *|FNAME|* renders as an empty string for the many subscribers
 *  with no first name on file, giving them a bare "Hi ,". The Handlebars block
 *  gives those people "Hi there," instead. */
if (/\*\|FNAME\|\*/.test(html)) {
    html = html.replace(
        /Hi \*\|FNAME\|\*,/g,
        "{{#if first_name}}Hi {{first_name}},{{else}}Hi there,{{/if}}"
    );
    notes.push("greeting → Handlebars block with a 'Hi there,' fallback");
}

/** The partner status line. */
if (/\*\|IF:PARTNER\|\*/.test(html)) {
    html = html.replace(
        /\*\|IF:PARTNER\|\*([\s\S]*?)\*\|ELSE:\|\*([\s\S]*?)\*\|END:IF\|\*/g,
        "{{#if is_partner}}$1{{else}}$2{{/if}}"
    );
    notes.push("*|IF:PARTNER|* → {{#if is_partner}}");
}

/** Class links. Replaced regardless of the number they point at — the export's
 *  number is guesswork, {{class_url}} is built from the manifest and cannot
 *  disagree with it. */
const linkCount = (html.match(/https:\/\/jesusbootcamp\.org\/class\/[^"']*/g) ?? []).length;
if (linkCount > 0) {
    html = html.replace(/https:\/\/jesusbootcamp\.org\/class\/[^"']*/g, "{{class_url}}");
    notes.push(`${linkCount} class link(s) → {{class_url}}`);
}

/** Unsubscribe. Without these SendGrid has no opt-out path at all, which is a
 *  CAN-SPAM problem rather than a cosmetic one. */
if (/\*\|UNSUB\|\*/.test(html)) {
    html = html.replace(/\*\|UNSUB\|\*/g, "<%asm_group_unsubscribe_raw_url%>");
    html = html.replace(/\*\|UPDATE_PROFILE\|\*/g, "<%asm_preferences_raw_url%>");
    notes.push("unsubscribe/preferences → SendGrid ASM tags");
}

/** The banner, off Paul's WordPress host and onto our own domain. */
if (/faithwithoutborders\.us/.test(html)) {
    html = html.replace(
        /https:\/\/faithwithoutborders\.us\/[^"']*/g,
        "https://jesusbootcamp.org/images/email/banner.png"
    );
    notes.push("banner → self-hosted");
}

/** The "What's Inside This Class" block, removed per Paul. Anchored on the
 *  heading and cut back to its enclosing <tr>, so it survives the whitespace
 *  and attribute-order differences between exports. */
// The exports label the block with a comment ("<!-- WHAT'S INSIDE THIS CLASS -->")
// that sits OUTSIDE the <tr>. Matching that first makes lastIndexOf("<tr") walk
// back to the previous row and delete the wrong block, so drop the label before
// looking for the real heading. Targeted rather than stripping all comments,
// which would take the Outlook <!--[if mso]> conditionals with it.
html = html.replace(/<!--[^>]*INSIDE THIS CLASS[^>]*-->\s*/gi, "");
const insideIdx = html.search(/What&rsquo;s Inside This Class|What's Inside This Class|What&#8217;s Inside/i);
if (insideIdx !== -1) {
    const trStart = html.lastIndexOf("<tr", insideIdx);
    const trEnd = html.indexOf("</tr>", insideIdx);
    if (trStart === -1 || trEnd === -1) {
        throw new Error("Found the \"What's Inside\" heading but could not find its enclosing <tr> — remove it by hand");
    }
    // The block nests tables, so the first </tr> after the heading is an inner
    // one. Walk outward until the <tr> open/close counts balance.
    let cursor = trStart;
    let depth = 0;
    let closeAt = -1;
    for (;;) {
        const nextOpen = html.indexOf("<tr", cursor + 1);
        const nextClose = html.indexOf("</tr>", cursor + 1);
        if (nextClose === -1) break;
        if (nextOpen !== -1 && nextOpen < nextClose) {
            depth++;
            cursor = nextOpen;
        } else {
            if (depth === 0) {
                closeAt = nextClose + "</tr>".length;
                break;
            }
            depth--;
            cursor = nextClose;
        }
    }
    if (closeAt === -1) throw new Error("Unbalanced <tr> around the \"What's Inside\" block — remove it by hand");
    html = html.slice(0, trStart) + html.slice(closeAt);
    notes.push("removed the \"What's Inside This Class\" block");
}

/** Outlook renders <b> inconsistently inside styled table cells. */
if (/<b>/i.test(html)) {
    html = html.replace(/<b>/gi, "<strong>").replace(/<\/b>/gi, "</strong>");
    notes.push("<b> → <strong>");
}

// ── 4. The partnership CTA ──────────────────────────────────────────────────
// access.ts sets FREE_THROUGH_SEQUENCE = 4, so positions 0-4 are free for
// everyone and partnership only starts changing what someone can open at
// position 5 (slug 4b). Asking before that point asks for money in exchange for
// nothing. The partial is read from disk rather than duplicated here so its
// copy has exactly one home.
const FREE_THROUGH_SEQUENCE = 4;
const wantsCta = klass.sequencePosition > FREE_THROUGH_SEQUENCE;
if (wantsCta && !/Upgrade to partnership/.test(html)) {
    const partial = await readFile(path.join(REPO, "emails", "partials", "partnership-cta.html"), "utf8");
    const block = partial.replace(/<!--[\s\S]*?-->\s*/, "").trimEnd();
    // Sits after the partner status line, which itself follows the class button
    // — so the ask lands next to the link, as Paul asked, not in the footer.
    const anchor = html.lastIndexOf("{{/if}}</p>");
    const rowEnd = anchor === -1 ? -1 : html.indexOf("</tr>", anchor);
    if (rowEnd === -1) {
        throw new Error("Could not find the partner status row to place the partnership CTA after — add it by hand");
    }
    const at = rowEnd + "</tr>".length;
    html =
        html.slice(0, at) +
        "\n\n            <!-- PARTNERSHIP CTA — hidden from existing partners. See\n" +
        "                 emails/partials/partnership-cta.html for why this starts at 4b. -->\n            " +
        block.split("\n").join("\n            ") +
        html.slice(at);
    notes.push(`partnership CTA inserted (sequence ${klass.sequencePosition} > ${FREE_THROUGH_SEQUENCE})`);
} else if (!wantsCta) {
    notes.push(`no partnership CTA — sequence ${klass.sequencePosition} is free for everyone`);
}

// ── 5. The cover ────────────────────────────────────────────────────────────
// Mailchimp CDN covers are ~2MB and stop resolving when the account closes.
// Resized to 600px and re-encoded, they land around 250KB.
const coverMatch = html.match(/https:\/\/mcusercontent\.com\/[^"']+/);
let coverReport = "no Mailchimp-hosted cover found";
if (coverMatch) {
    const res = await fetch(coverMatch[0], { signal: AbortSignal.timeout(60_000) });
    if (!res.ok) throw new Error(`Cover download failed: HTTP ${res.status}`);
    const src = Buffer.from(await res.arrayBuffer());
    const out = await sharp(src)
        .resize(600, null, { withoutEnlargement: true })
        .png({ quality: 82, compressionLevel: 9, palette: true })
        .toBuffer();
    coverReport = `${Math.round(src.length / 1024)}KB → ${Math.round(out.length / 1024)}KB as ${coverName}`;
    if (apply) await writeFile(outCover, out);
    html = html.replace(/https:\/\/mcusercontent\.com\/[^"']+/g, `https://jesusbootcamp.org/images/email/${coverName}`);
    notes.push("cover → self-hosted");
}

// ── 6. Refuse to ship anything unconverted ──────────────────────────────────
// Any *|TAG|* still present is one this script does not know about. It would
// reach a subscriber as literal text, so it is fatal rather than a warning.
const leftovers = [...new Set(html.match(/\*\|[^|]*\|\*/g) ?? [])];
if (leftovers.length > 0) {
    throw new Error(
        `Unconverted Mailchimp merge tag(s): ${leftovers.join(", ")}\n` +
            "These would reach subscribers as literal text. Add a transform above, or edit the export."
    );
}

// ── 7. The same checks used on every hand-built template ────────────────────
const imgs = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1]);
const checks: Array<[string, boolean]> = [
    ["no Mailchimp merge tags", !/\*\|/.test(html)],
    ["{{class_url}} present", html.includes("{{class_url}}")],
    ["no hardcoded /class/ link", !/href="https:\/\/jesusbootcamp\.org\/class\//.test(html)],
    ["ASM unsubscribe tag", html.includes("<%asm_group_unsubscribe_raw_url%>")],
    ["ASM preferences tag", html.includes("<%asm_preferences_raw_url%>")],
    ["no \"What's Inside\" block", !/What.{0,8}s Inside/i.test(html)],
    ["no external CDN images", !/mcusercontent|faithwithoutborders|cdn-images\.mailchimp/.test(html)],
    ["self-hosted images only", imgs.length > 0 && imgs.every((s) => s.startsWith("https://jesusbootcamp.org/images/email/"))],
    ["balanced {{#if}}", (html.match(/\{\{#if/g) ?? []).length === (html.match(/\{\{\/if\}\}/g) ?? []).length],
    ["balanced {{#unless}}", (html.match(/\{\{#unless/g) ?? []).length === (html.match(/\{\{\/unless\}\}/g) ?? []).length],
    ["exactly one doctype", (html.match(/<!doctype/gi) ?? []).length === 1],
    ["no Mailchimp starter boilerplate", !/mc:edit|Getting started!|templates\.mailchimp\.com/i.test(html)],
    [wantsCta ? "partnership CTA present" : "partnership CTA correctly absent", /Upgrade to partnership/.test(html) === wantsCta],
];
if (wantsCta) {
    checks.push([
        "CTA gated on is_partner",
        /\{\{#unless is_partner\}\}[\s\S]*Upgrade to partnership[\s\S]*\{\{\/unless\}\}/.test(html),
    ]);
}

console.log(`\nClass ${slug} — ${klass.title}  (sequence ${klass.sequencePosition})`);
if (trailingBytes > 0) {
    console.log(`\n⚠️  Cut ${trailingBytes} bytes after </html> — the export had a second document appended.`);
}
console.log(`\nTransforms (${before.length} → ${html.length} bytes):`);
for (const n of notes) console.log(`  · ${n}`);
console.log(`\nCover: ${coverReport}`);
console.log("\nChecks:");
let failed = 0;
for (const [name, ok] of checks) {
    if (!ok) failed++;
    console.log(`  ${ok ? "ok  " : "FAIL"}  ${name}`);
}
if (failed > 0) {
    throw new Error(`${failed} check(s) failed — nothing written.`);
}

// ── 8. Write ────────────────────────────────────────────────────────────────
if (!apply) {
    console.log(
        `\nAUDIT ONLY — nothing written. Re-run with --apply to write:\n` +
            `  emails/classes/${slug}.html\n` +
            (coverMatch ? `  public/images/email/${coverName}\n` : "") +
            `  the emails/index.json entry\n` +
            `\nThen upload:  node --env-file=.env.local scripts/upload-sendgrid-templates.mts --apply --only ${slug}`
    );
    process.exit(0);
}

const existed = existsSync(outHtml);
await writeFile(outHtml, html.trimEnd() + "\n");

// The subject follows the number the EMAIL BODY shows the reader, never the
// manifest slug — 11a and 12a are "Class 11" and "Class 12" to a subscriber,
// who has never seen the letter. Falls back to the slug when the body has no
// eyebrow to read.
const bodyNumber = html.match(/Jesus Boot Camp Class ([0-9.a-zA-Z]+)/)?.[1] ?? slug;
const index = JSON.parse(await readFile(indexPath, "utf8")) as {
    templates: Array<{ slug?: string; file: string; name: string; subject: string }>;
};
const entry = {
    slug,
    file: `classes/${slug}.html`,
    name: `JBC Class ${bodyNumber} — ${klass.title}`,
    subject: `Class ${bodyNumber} - ${klass.title}`,
};
const at = index.templates.findIndex((t) => t.slug === slug);
if (at === -1) {
    // Before the transactional entries, which have no slug and sort last.
    const firstTxn = index.templates.findIndex((t) => !t.slug);
    index.templates.splice(firstTxn === -1 ? index.templates.length : firstTxn, 0, entry);
} else {
    index.templates[at] = { ...index.templates[at], ...entry };
}
await writeFile(indexPath, JSON.stringify(index, null, 2) + "\n");

console.log(`\nAPPLIED`);
console.log(`  ${existed ? "updated" : "wrote"}  emails/classes/${slug}.html`);
if (coverMatch) console.log(`  wrote    public/images/email/${coverName}`);
console.log(`  ${at === -1 ? "added" : "updated"}  index entry — subject "${entry.subject}"`);
// The manifest stores titles in Title Case; the shipped subjects are sentence
// case ("Class 5 - God's gift to believers, the Holy Spirit"). Lower-casing
// automatically would wreck the proper nouns these titles are full of — Gospel,
// Holy Spirit, God's Word, New Testament — so the title is copied verbatim and
// flagged instead.
if (/[a-z] [A-Z][a-z]/.test(klass.title)) {
    console.log(
        `\n  ⚠️  Subject is Title Case, copied from the manifest. Shipped subjects are\n` +
            `      sentence case apart from proper nouns. Check emails/index.json.`
    );
}
console.log(`\nNext:  node --env-file=.env.local scripts/upload-sendgrid-templates.mts --apply --only ${slug}`);

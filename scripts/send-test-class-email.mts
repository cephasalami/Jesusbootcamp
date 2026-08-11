// Send ONE class email to named addresses, exactly as the drip would render it.
//
// This is a proofing tool, not a sending tool. It is deliberately separate from
// the drip: it never touches the send ledger, never enumerates subscribers, and
// only mails addresses typed on the command line. That means a test send cannot
// mark a real class as delivered, and cannot escape to the list.
//
// It renders with the RECIPIENT'S REAL PROFILE — their token, so the class link
// actually opens, and their real partner flag, so what they see is what they
// would have received. Use --partner true|false to force the other variant when
// you specifically want to proof the partnership CTA.
//
//   node --env-file=.env.local scripts/send-test-class-email.mts 4b a@x.com,b@y.com
//   node --env-file=.env.local scripts/send-test-class-email.mts 4b a@x.com --partner false
//   node --env-file=.env.local scripts/send-test-class-email.mts 4b a@x.com --template-id d-...
//   node --env-file=.env.local scripts/send-test-class-email.mts 4b a@x.com --force   (no token)
import { getManifest } from "../src/lib/manifest.ts";
import { readProfile } from "../src/lib/subscriber-store.ts";
import { sendTemplateEmail } from "../src/lib/email/sendgrid.ts";
import { SENDGRID_UNSUBSCRIBE_GROUPS } from "../src/config/sendgrid-groups.ts";

function flag(name: string): string | null {
    const i = process.argv.indexOf(`--${name}`);
    return i >= 0 ? (process.argv[i + 1] ?? null) : null;
}

const positional = process.argv.slice(2).filter((a, i, all) => {
    if (a.startsWith("--")) return false;
    return !(i > 0 && all[i - 1]?.startsWith("--"));
});

const slug = positional[0];
const recipients = (positional[1] ?? "")
    .split(/[\s,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

if (!slug || recipients.length === 0) {
    throw new Error("Usage: send-test-class-email.mts <class-slug> <email[,email...]> [--partner true|false] [--template-id d-...]");
}
if (!process.env.SENDGRID_API_KEY) throw new Error("SENDGRID_API_KEY is not set");

const forcedPartner = flag("partner");
if (forcedPartner !== null && forcedPartner !== "true" && forcedPartner !== "false") {
    throw new Error(`--partner must be "true" or "false", got "${forcedPartner}"`);
}

const classes = await getManifest();
const klass = classes.find((c) => c.slug === slug);
if (!klass) {
    throw new Error(`No class with slug "${slug}". The manifest has: ${classes.map((c) => c.slug).join(", ")}`);
}

// The Sheet is the source of truth, but a freshly uploaded template has not
// been pasted into it yet — hence the override, which is the whole reason a
// proof send exists before the id goes live.
const templateId = flag("template-id") ?? klass.sendgridTemplateId;
if (!templateId) {
    throw new Error(
        `Class "${slug}" has no sendgrid_template_id in the manifest Sheet. ` +
            `Pass --template-id d-... to proof it before pasting the id in.`
    );
}

console.log(`Class ${klass.slug} — ${klass.title}`);
console.log(`Template ${templateId}${flag("template-id") ? " (override)" : " (from the Sheet)"}\n`);

/**
 * readProfile returns null for BOTH "no such subscriber" and "KV timed out",
 * and a timeout here is not theoretical — one struck mid-run and sent a real
 * proof with an empty token, i.e. a dead class link, while reporting the
 * recipient as simply unenrolled. Retry before believing the absence.
 */
async function readProfileFirmly(email: string) {
    for (let attempt = 1; attempt <= 3; attempt++) {
        const profile = await readProfile(email);
        if (profile) return profile;
        if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 500));
    }
    return null;
}

const force = process.argv.includes("--force");
let failures = 0;
for (const email of recipients) {
    const profile = await readProfileFirmly(email);
    const token = profile?.token ?? "";

    // Mailing a class button that cannot open the class is worse than not
    // mailing at all — it reads as a broken site. --force is there for proofing
    // layout to someone who is not a subscriber and does not need the link.
    if (!token && !force) {
        failures++;
        console.log(`  SKIP  ${email.padEnd(32)} no token — the class link would be dead. Re-run with --force to send anyway.`);
        continue;
    }
    const isPartner = forcedPartner !== null ? forcedPartner === "true" : profile?.partner === true;

    const notes: string[] = [];
    if (!profile) notes.push("no KV profile — FORCED, class link is dead");
    if (forcedPartner !== null) notes.push(`partner forced to ${forcedPartner}`);

    const result = await sendTemplateEmail({
        to: email,
        templateId,
        category: `test-class-${klass.slug}`,
        unsubscribeGroupId: SENDGRID_UNSUBSCRIBE_GROUPS.classes,
        // Must match the drip's payload field-for-field, or the proof proves
        // nothing about what subscribers will actually receive.
        data: {
            first_name: "",
            ctoken: token,
            class_slug: klass.slug,
            class_title: klass.title,
            class_url: `https://jesusbootcamp.org/class/${klass.slug}?t=${token}`,
            is_partner: isPartner,
        },
    });

    const cta = isPartner ? "NO upgrade button (partner)" : "shows the upgrade button";
    if (result.ok) {
        console.log(`  sent  ${email.padEnd(32)} ${cta}${notes.length ? `  [${notes.join("; ")}]` : ""}`);
    } else {
        failures++;
        console.log(`  FAIL  ${email.padEnd(32)} ${result.status} ${result.detail}`);
    }
}

console.log(
    `\nNothing was written to the send ledger — these addresses will still receive ` +
        `class ${klass.slug} normally when the drip reaches them.`
);
if (failures > 0) process.exitCode = 1;

// Seed the KV subscriber store from Mailchimp, for every contact the class
// system cares about.
//
// WHY THIS EXISTS
// Profiles are normally written lazily — the first time someone opens a class,
// readSnapshot falls back to Mailchimp and backfills. That is fine for the read
// path but useless for an app-owned drip, which has to ENUMERATE subscribers to
// know who to email. A subscriber who never opens a class never gets a profile,
// so the drip would never see them.
//
// WHAT IT SEEDS, AND WHY BOTH HALVES MATTER
//   1. The profile  (token, courseStart, partner, enrolled)
//   2. The send ledger — every class ALREADY RELEASED to that person is marked
//      as sent.
//
// (2) is not optional and is the reason this is one script rather than two.
// Mailchimp's automation has been mailing these people for weeks. If the drip
// started against a profile with an empty ledger, it would consider every
// released class unsent and begin working through the backlog from class 1 —
// re-sending a subscriber material they received a month ago. On a domain
// already fighting for inbox placement that is the single most damaging thing
// we could do. Seeding costs nothing if wrong (they simply resume from today);
// not seeding is unrecoverable once the emails have gone.
//
// Audits by default. --apply is required before anything is written.
//
//   node --env-file=.env.local scripts/backfill-subscriber-profiles.mts
//   node --env-file=.env.local scripts/backfill-subscriber-profiles.mts --apply
//   node --env-file=.env.local scripts/backfill-subscriber-profiles.mts --apply --overwrite
import { getManifest } from "../src/lib/manifest.ts";
import { daysSinceSignup, inReleaseOrder, isReleased } from "../src/lib/access.ts";
import { parseStart } from "../src/lib/drip.ts";
import { readProfile, writeProfile } from "../src/lib/subscriber-store.ts";
import { markAlreadySent, readSentSlugs } from "../src/lib/drip-ledger.ts";

const apply = process.argv.includes("--apply");
const overwrite = process.argv.includes("--overwrite");

const apiKey = process.env.MAILCHIMP_API_KEY;
const server = process.env.MAILCHIMP_API_SERVER;
const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;
if (!apiKey || !server || !audienceId) throw new Error("Missing Mailchimp environment variables");
if (!(process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL)) {
    throw new Error("Missing Upstash/KV environment variables");
}

const headers = { Authorization: `apikey ${apiKey}` };
const apiBase = `https://${server}.api.mailchimp.com/3.0/lists/${audienceId}`;

type Member = {
    email_address: string;
    status: string;
    tags?: Array<{ name: string }>;
    merge_fields?: Record<string, string>;
};

async function get<T>(path: string): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= 5; attempt++) {
        try {
            const res = await fetch(`${apiBase}${path}`, {
                headers,
                signal: AbortSignal.timeout(30_000),
            });
            const json = await res.json();
            if (!res.ok) throw new Error((json as { title?: string }).title ?? `HTTP ${res.status}`);
            return json as T;
        } catch (error) {
            lastError = error;
            if (attempt < 5) await new Promise((r) => setTimeout(r, attempt * 1_200));
        }
    }
    throw lastError;
}

/** Every member carrying a tag, following pagination. */
async function membersWithTag(tag: string): Promise<Member[]> {
    const search = await get<{ tags?: Array<{ id: number; name: string }> }>(
        `/tag-search?name=${encodeURIComponent(tag)}`
    );
    const found = (search.tags ?? []).find((t) => t.name === tag);
    if (!found) return [];

    const all: Member[] = [];
    let offset = 0;
    for (;;) {
        const page = await get<{ members?: Member[]; total_items?: number }>(
            `/segments/${found.id}/members?count=200&offset=${offset}` +
                `&fields=members.email_address,members.status,members.tags,members.merge_fields,total_items`
        );
        const batch = page.members ?? [];
        all.push(...batch);
        offset += batch.length;
        if (batch.length === 0 || offset >= (page.total_items ?? 0)) break;
    }
    return all;
}

const classes = await getManifest();
if (classes.length === 0) throw new Error("The class manifest is empty — refusing to seed a ledger from nothing");

// Course members drive the drip; partners matter because the class gate reads
// the partner flag from the profile once one exists.
const [enrolledMembers, partnerMembers] = await Promise.all([
    membersWithTag("jbc-course-start"),
    membersWithTag("partner-active"),
]);

const byEmail = new Map<string, Member>();
for (const member of [...enrolledMembers, ...partnerMembers]) {
    byEmail.set(member.email_address.trim().toLowerCase(), member);
}

const now = new Date();
const summary = {
    considered: byEmail.size,
    enrolled: enrolledMembers.length,
    partners: partnerMembers.length,
    profileExists: 0,
    profileWritten: 0,
    ledgerSeeded: 0,
    ledgerAlready: 0,
    missingToken: 0,
    missingCourseStart: 0,
    failed: 0,
};
const problems: string[] = [];

for (const [email, member] of byEmail) {
    const merge = member.merge_fields ?? {};
    const tags = (member.tags ?? []).map((t) => t.name);
    const token = String(merge.CTOKEN ?? "").trim();
    const courseStart = String(merge.CSTART ?? "").trim() || null;
    const profile = {
        email,
        token,
        courseStart,
        partner: String(merge.PARTNER ?? "").trim().toLowerCase() === "true",
        enrolled: tags.includes("jbc-course-start"),
    };

    if (!token) {
        summary.missingToken++;
        problems.push(`${email}: no CTOKEN — the drip will skip them until one is issued`);
    }
    if (!courseStart) {
        summary.missingCourseStart++;
        problems.push(`${email}: no CSTART — the drip will skip them, and classes stay capped at 4a`);
    }

    // Which classes has Mailchimp already released to this person?
    const start = parseStart(courseStart);
    const releasedSlugs = start
        ? inReleaseOrder(classes)
              .filter((klass) => isReleased(klass.sequencePosition, daysSinceSignup(start, now)))
              .map((klass) => klass.slug)
        : [];

    const existing = await readProfile(email);
    if (existing && !overwrite) summary.profileExists++;

    if (!apply) {
        if (!existing || overwrite) summary.profileWritten++;
        if (releasedSlugs.length > 0) summary.ledgerSeeded++;
        continue;
    }

    try {
        if (!existing || overwrite) {
            await writeProfile(email, {
                token: profile.token,
                courseStart: profile.courseStart,
                partner: profile.partner,
                enrolled: profile.enrolled,
            });
            summary.profileWritten++;
        }

        if (releasedSlugs.length > 0) {
            const alreadyLogged = await readSentSlugs(email);
            // A non-empty ledger means this person is already under the drip's
            // control — re-seeding could only mask a genuine gap.
            if (alreadyLogged && alreadyLogged.size > 0) {
                summary.ledgerAlready++;
            } else if (await markAlreadySent(email, releasedSlugs)) {
                summary.ledgerSeeded++;
            } else {
                summary.failed++;
                problems.push(`${email}: ledger seed FAILED — the drip may re-send released classes`);
            }
        }
    } catch (error) {
        summary.failed++;
        problems.push(`${email}: ${error instanceof Error ? error.message : String(error)}`);
    }
}

console.log(apply ? "APPLIED" : "AUDIT ONLY — re-run with --apply to write");
console.log(JSON.stringify(summary, null, 2));

if (problems.length > 0) {
    console.log(`\n${problems.length} contact(s) need attention:`);
    for (const line of problems.slice(0, 60)) console.log(`  ${line}`);
    if (problems.length > 60) console.log(`  … and ${problems.length - 60} more`);
}

if (!apply) {
    console.log(
        "\nNothing was written. --apply seeds BOTH the profile and the send ledger;\n" +
            "the ledger marks already-released classes as sent so the drip resumes\n" +
            "where Mailchimp left off instead of restarting anyone at class 1."
    );
}

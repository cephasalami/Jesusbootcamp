// Repair enrolled contacts that have no CSTART (and, where also absent, no
// CTOKEN), so they can progress past the free intro classes.
//
// WHY THEY ARE STUCK
// access.ts fails SAFE when a subscriber has no start date: only the classes
// that are free for everyone (1, 2, 3 and 4a) count as released, and no unlock
// date can be shown. So these people can open the intro classes and nothing
// beyond, permanently, with no explanation on the page — while the drip keeps
// skipping them for the same reason.
//
// WHY CSTART IS STAMPED AS TODAY, NEVER BACKDATED
// There is no reliable record of when someone was enrolled. Mailchimp exposes
// no "when was this tag applied" timestamp, and `timestamp_opt` is the AUDIENCE
// join date — for the contacts bulk-imported in 2021 that is years before their
// course start, and backdating to it would release the entire 90-class archive
// at once. Today is the only defensible choice: they keep everything they can
// already open and resume from here.
//
// WHY MOST OF THEM DO NOT GET A NEW TOKEN
// issueToken() mints a NEW CTOKEN and revokes remembered devices, which would
// break the ?t= links in every class email these people have already received.
// A contact that already has a valid token therefore gets a CSTART write only.
// Only a contact with no token at all is issued one.
//
// Audits by default; --apply is required to write.
//
//   node --env-file=.env.local scripts/repair-missing-course-start.mts
//   node --env-file=.env.local scripts/repair-missing-course-start.mts --apply
import { setCourseFields } from "../src/lib/mailchimp.ts";
import { issueToken, todayIso } from "../src/lib/subscriber.ts";
import { writeProfile } from "../src/lib/subscriber-store.ts";

const apply = process.argv.includes("--apply");

const apiKey = process.env.MAILCHIMP_API_KEY;
const server = process.env.MAILCHIMP_API_SERVER;
const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;
if (!apiKey || !server || !audienceId) throw new Error("Missing Mailchimp environment variables");

const headers = { Authorization: `apikey ${apiKey}` };
const apiBase = `https://${server}.api.mailchimp.com/3.0/lists/${audienceId}`;

type Member = { email_address: string; status: string; merge_fields?: Record<string, string> };

async function get<T>(path: string): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= 5; attempt++) {
        try {
            const res = await fetch(`${apiBase}${path}`, { headers, signal: AbortSignal.timeout(30_000) });
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

const search = await get<{ tags?: Array<{ id: number; name: string }> }>(
    "/tag-search?name=jbc-course-start"
);
const tag = (search.tags ?? []).find((t) => t.name === "jbc-course-start");
if (!tag) throw new Error("The jbc-course-start tag does not exist");

const enrolled: Member[] = [];
let offset = 0;
for (;;) {
    const page = await get<{ members?: Member[]; total_items?: number }>(
        `/segments/${tag.id}/members?count=200&offset=${offset}` +
            `&fields=members.email_address,members.status,members.merge_fields,total_items`
    );
    const batch = page.members ?? [];
    enrolled.push(...batch);
    offset += batch.length;
    if (batch.length === 0 || offset >= (page.total_items ?? 0)) break;
}

const broken = enrolled.filter((m) => {
    const merge = m.merge_fields ?? {};
    return !String(merge.CSTART ?? "").trim() || !String(merge.CTOKEN ?? "").trim();
});

// A run that finds nothing to do is the expected steady state; a run that finds
// EVERYTHING broken means the merge fields did not come back and writing would
// stamp today's date across the whole course.
if (broken.length > 0 && broken.length === enrolled.length) {
    throw new Error(
        `All ${enrolled.length} enrolled contacts look broken — refusing to write. ` +
            "That pattern means the merge fields were not returned, not that everyone is genuinely missing a start date."
    );
}

const today = todayIso();
console.log(apply ? "APPLYING" : "AUDIT ONLY — re-run with --apply to write");
console.log(`${enrolled.length} enrolled, ${broken.length} need repair\n`);

let repaired = 0;
let failed = 0;

for (const member of broken) {
    const email = member.email_address.trim().toLowerCase();
    const merge = member.merge_fields ?? {};
    const hasToken = Boolean(String(merge.CTOKEN ?? "").trim());
    const hasStart = Boolean(String(merge.CSTART ?? "").trim());
    const plan = hasToken ? `stamp CSTART=${today}` : `issue CTOKEN + stamp CSTART=${today}`;

    if (!apply) {
        console.log(`  · ${email.padEnd(30)} ${plan}`);
        continue;
    }

    try {
        if (!hasToken) {
            // issueToken writes both merge fields, the KV token index and the
            // profile, so it covers everything this contact is missing.
            await issueToken(email, { setCourseStartIfMissing: true });
        } else {
            // Deliberately NOT issueToken: their existing links must keep working.
            if (!hasStart) {
                await setCourseFields({ email, courseStart: today });
                await writeProfile(email, { courseStart: today });
            }
        }
        repaired += 1;
        console.log(`  + ${email.padEnd(30)} ${plan}`);
    } catch (error) {
        failed += 1;
        console.log(`  ! ${email.padEnd(30)} FAILED: ${error instanceof Error ? error.message : String(error)}`);
    }
}

if (apply) {
    console.log(`\nrepaired ${repaired}, failed ${failed}`);
    if (repaired > 0) {
        console.log(
            "Their 90 days start today, so the drip will send class 1 on its next run.\n" +
                "The ledger was seeded from what was already released, which for a contact\n" +
                "with no start date was nothing — so they begin at the beginning, correctly."
        );
    }
} else {
    console.log("\nNothing was written. --apply performs the repair.");
}

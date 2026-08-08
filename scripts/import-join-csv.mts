// Import a CSV of contacts an admin is personally vouching for.
//
// ⚠️ This used to POST to the public /api/join endpoint. It must NOT: /join is
// now DOUBLE OPT-IN, so every contact imported that way lands as `pending`,
// never clicks a confirmation they did not ask for, and Mailchimp refuses to
// run the class automation for them. The symptom is silent and total — the
// contact exists, looks fine in the audience, and receives nothing. That is
// almost certainly what happened to the batch added by hand.
//
// It now calls the vouched-enrolment path directly (same as the "Enrol by hand"
// screen at /tracking/enroll), which adds them as confirmed and starts the
// sequence. Only run this on people who genuinely expect to hear from us.
//
// The script audits by default; --apply is required to write anything.
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { enrolVouchedContact } from "../src/lib/mailchimp.ts";
import { issueToken } from "../src/lib/subscriber.ts";

type Contact = { email: string; firstName: string };
type Enrollment = {
    email: string;
    found: boolean;
    enrolled: boolean;
    error?: string;
};

const apply = process.argv.includes("--apply");
const verify = process.argv.includes("--verify") || process.argv.includes("--only-unenrolled");
const onlyUnenrolled = process.argv.includes("--only-unenrolled");
const fileArg = process.argv.find((argument) => argument.startsWith("--file="));
const file = fileArg?.slice("--file=".length);
const batchSize = 15;
// Short courtesy pause between batches. This used to be 60s to survive
// /api/join's 20-per-minute IP limit; calling the library directly removes that
// constraint, so this only paces Mailchimp's API now.
const batchPauseMs = 2_000;

if (!file) throw new Error('Usage: --file="C:\\path\\contacts.csv" [--apply] [--verify] [--only-unenrolled]');

function parseCsv(text: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let value = "";
    let quoted = false;

    for (let index = 0; index < text.length; index++) {
        const character = text[index];
        if (quoted && character === '"' && text[index + 1] === '"') {
            value += '"';
            index++;
        } else if (character === '"') {
            quoted = !quoted;
        } else if (!quoted && character === ",") {
            row.push(value);
            value = "";
        } else if (!quoted && (character === "\n" || character === "\r")) {
            if (character === "\r" && text[index + 1] === "\n") index++;
            row.push(value);
            if (row.some((field) => field.trim())) rows.push(row);
            row = [];
            value = "";
        } else {
            value += character;
        }
    }
    row.push(value);
    if (row.some((field) => field.trim())) rows.push(row);
    return rows;
}

function hasValidToken(value: unknown): boolean {
    return /^[a-f0-9]{64}$/i.test(String(value ?? "").trim());
}

function hasValidCourseStart(value: unknown): boolean {
    const text = String(value ?? "").trim();
    if (!text) return false;
    const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(text) ? `${text}T00:00:00Z` : text);
    return !Number.isNaN(parsed.getTime());
}

async function mapWithConcurrency<T, R>(items: T[], work: (item: T) => Promise<R>, limit = 5): Promise<R[]> {
    const results = new Array<R>(items.length);
    let next = 0;
    async function worker() {
        while (next < items.length) {
            const index = next++;
            results[index] = await work(items[index]);
        }
    }
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
    return results;
}

async function verifyEnrollment(contactsToVerify: Contact[]): Promise<Enrollment[]> {
    const apiKey = process.env.MAILCHIMP_API_KEY;
    const server = process.env.MAILCHIMP_API_SERVER;
    const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;
    if (!apiKey || !server || !audienceId) {
        throw new Error("Mailchimp environment variables are required for enrollment verification");
    }
    const apiBase = `https://${server}.api.mailchimp.com/3.0/lists/${audienceId}/members/`;

    return mapWithConcurrency(contactsToVerify, async ({ email }) => {
        const hash = createHash("md5").update(email).digest("hex");
        let response: Response | null = null;
        let lastError = "";
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const candidate = await fetch(`${apiBase}${hash}?fields=email_address,tags,merge_fields`, {
                    headers: { Authorization: `apikey ${apiKey}` },
                    signal: AbortSignal.timeout(15_000),
                });
                if (candidate.status < 500 || attempt === 3) {
                    response = candidate;
                    break;
                }
                lastError = `Mailchimp returned ${candidate.status}`;
            } catch (error) {
                lastError = String(error);
            }
            await new Promise((resolve) => setTimeout(resolve, attempt * 500));
        }

        if (!response) return { email, found: false, enrolled: false, error: lastError || "Mailchimp read failed" };
        try {
            if (response.status === 404) return { email, found: false, enrolled: false };
            if (!response.ok) return { email, found: false, enrolled: false, error: `Mailchimp returned ${response.status}` };
            const member = (await response.json()) as {
                tags?: Array<{ name?: string }>;
                merge_fields?: Record<string, unknown>;
            };
            const tags = (member.tags ?? []).map((tag) => tag.name);
            const fields = member.merge_fields ?? {};
            return {
                email,
                found: true,
                enrolled:
                    tags.includes("jbc-course-start") &&
                    hasValidToken(fields.CTOKEN) &&
                    hasValidCourseStart(fields.CSTART),
            };
        } catch (error) {
            return { email, found: false, enrolled: false, error: String(error) };
        }
    });
}

const rows = parseCsv(await readFile(file, "utf8"));
const headers = rows.shift()?.map((header) => header.trim().toLowerCase()) ?? [];
const emailColumn = headers.indexOf("email address");
const firstNameColumn = headers.indexOf("first name");
if (emailColumn < 0) throw new Error('CSV must contain an "Email Address" column');

const invalid: Array<{ row: number; email: string }> = [];
const seen = new Set<string>();
const contacts: Contact[] = [];
for (const [index, row] of rows.entries()) {
    const email = String(row[emailColumn] ?? "").trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        invalid.push({ row: index + 2, email });
        continue;
    }
    if (seen.has(email)) continue;
    seen.add(email);
    contacts.push({
        email,
        firstName: String(firstNameColumn >= 0 ? (row[firstNameColumn] ?? "") : "").trim(),
    });
}

console.log(JSON.stringify({ mode: apply ? "apply" : verify ? "verification" : "audit", rows: rows.length, uniqueValid: contacts.length, invalid }, null, 2));
if (verify && !apply) {
    const current = await verifyEnrollment(contacts);
    const needsJoin = current.filter((result) => !result.enrolled);
    console.log(JSON.stringify({ enrolled: current.length - needsJoin.length, needsJoin }, null, 2));
    if (current.some((result) => result.error)) process.exitCode = 1;
    process.exit();
}
if (!apply) process.exit(0);
if (invalid.length) throw new Error("The CSV has invalid email addresses; no contacts were submitted.");

const sourceContacts = [...contacts];
if (onlyUnenrolled) {
    const before = await verifyEnrollment(sourceContacts);
    const verificationErrors = before.filter((result) => result.error);
    if (verificationErrors.length) {
        throw new Error(`Could not safely resume: ${verificationErrors.length} Mailchimp enrollment reads failed`);
    }
    const enrolled = new Set(before.filter((result) => result.enrolled).map((result) => result.email));
    contacts.splice(0, contacts.length, ...sourceContacts.filter((contact) => !enrolled.has(contact.email)));
    console.log(JSON.stringify({ alreadyEnrolled: enrolled.size, remainingToSubmit: contacts.length }, null, 2));
}

const results: Array<{ email: string; status: number; success: boolean; error?: string }> = [];

/**
 * Enrol one vouched contact: add as CONFIRMED + course tag, then issue their
 * access token and stamp the drip clock. Both steps matter — a contact with the
 * tag but no CTOKEN/CSTART reaches a class page and is failed safe to only the
 * free intro classes, with no unlock date to show them.
 */
async function submit(contact: Contact): Promise<{ email: string; status: number; success: boolean; error?: string }> {
    let lastError = "";
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            await enrolVouchedContact({
                email: contact.email,
                ...(contact.firstName ? { name: contact.firstName } : {}),
            });
            await issueToken(contact.email, { setCourseStartIfMissing: true });
            return { email: contact.email, status: 200, success: true };
        } catch (error) {
            lastError = error instanceof Error ? error.message : String(error);
            if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 1_500));
        }
    }
    return { email: contact.email, status: 0, success: false, error: lastError || "Enrolment failed" };
}

for (let offset = 0; offset < contacts.length; offset += batchSize) {
    const batch = contacts.slice(offset, offset + batchSize);
    for (const contact of batch) results.push(await submit(contact));
    const completed = Math.min(offset + batch.length, contacts.length);
    console.log(JSON.stringify({ progress: `${completed}/${contacts.length}`, succeeded: results.filter((result) => result.success).length }, null, 2));
    if (completed < contacts.length) await new Promise((resolve) => setTimeout(resolve, batchPauseMs));
}

const failures = results.filter((result) => !result.success);
console.log(JSON.stringify({ submitted: results.length, succeeded: results.length - failures.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;

if (verify && !failures.length) {
    const after = await verifyEnrollment(sourceContacts);
    const verificationFailures = after.filter((result) => !result.enrolled);
    console.log(JSON.stringify({ verified: after.length - verificationFailures.length, verificationFailures }, null, 2));
    if (verificationFailures.length) process.exitCode = 1;
}

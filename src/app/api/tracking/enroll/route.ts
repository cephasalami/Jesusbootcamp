import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifySessionToken, TRACKING_COOKIE } from "@/lib/tracking-auth";
import { enrolVouchedContact } from "@/lib/mailchimp";
import { issueToken } from "@/lib/subscriber";

// Bulk hand-enrolment for people an admin is personally vouching for.
//
// This exists because /join is double opt-in: someone added on their behalf
// never clicks a confirmation they did not ask for, so they sit `pending`
// forever and the class automation never runs for them. That is the exact
// failure Paul reported — names handed over to be added, then "they never
// received the emails".
//
// Gated by the SAME session cookie as the /tracking dashboard. It can enrol
// anybody, so it must never become reachable without that.
export const dynamic = "force-dynamic";

/** Keep one request bounded: Mailchimp writes are sequential and rate-limited. */
const MAX_PER_REQUEST = 200;

type Result = { email: string; status: "enrolled" | "failed"; detail?: string };

function parseEmails(raw: unknown): string[] {
    const text = typeof raw === "string" ? raw : Array.isArray(raw) ? raw.join("\n") : "";
    const seen = new Set<string>();
    for (const line of text.split(/[\s,;]+/)) {
        const email = line.trim().toLowerCase();
        // Deliberately permissive: the admin pasted these, we only reject
        // anything that clearly is not an address.
        if (/^\S+@\S+\.\S+$/.test(email)) seen.add(email);
    }
    return [...seen];
}

export async function POST(req: Request) {
    const cookieStore = await cookies();
    if (!verifySessionToken(cookieStore.get(TRACKING_COOKIE)?.value)) {
        return NextResponse.json({ error: "Not authorised." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const emails = parseEmails(body?.emails);
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    if (emails.length === 0) {
        return NextResponse.json({ error: "No valid email addresses found." }, { status: 400 });
    }
    if (emails.length > MAX_PER_REQUEST) {
        return NextResponse.json(
            { error: `Too many at once. Paste up to ${MAX_PER_REQUEST} addresses per batch.` },
            { status: 400 }
        );
    }

    const results: Result[] = [];
    for (const email of emails) {
        try {
            // Add as subscribed + tag, which is what triggers the class journey.
            await enrolVouchedContact({ email, ...(emails.length === 1 && name ? { name } : {}) });
            // Then issue the access token and start their drip clock today.
            // Without this they reach a class page with no CTOKEN and no CSTART,
            // which fails safe to only the free intro classes.
            await issueToken(email, { setCourseStartIfMissing: true });
            results.push({ email, status: "enrolled" });
        } catch (err) {
            results.push({
                email,
                status: "failed",
                detail: err instanceof Error ? err.message : "Unknown error",
            });
        }
    }

    const enrolled = results.filter((r) => r.status === "enrolled").length;
    return NextResponse.json({
        submitted: emails.length,
        enrolled,
        failed: results.length - enrolled,
        results,
    });
}

import { NextResponse } from "next/server";
import { getManifest } from "@/lib/manifest";
import { decideNextSend } from "@/lib/drip";
import { readSentSlugs, recordSent } from "@/lib/drip-ledger";
import { listProfileEmails, readProfile } from "@/lib/subscriber-store";
import { isSendGridConfigured, sendTemplateEmail } from "@/lib/email/sendgrid";
import { SENDGRID_UNSUBSCRIBE_GROUPS } from "@/config/sendgrid-groups";

// The daily class drip.
//
// This is the only code in the project that emails a list of people, so it is
// built to be boring and hard to fire by accident:
//
//   • CRON_SECRET is required. Without it this URL is a public "email
//     everyone" button.
//   • DRIP_ENABLED must be explicitly "true". It ships OFF, so the route can
//     be deployed and watched doing nothing before it is trusted.
//   • ?dryRun=1 reports exactly who would receive what and sends nothing.
//   • MAX_SENDS_PER_RUN caps the blast radius of any bug.
//   • DRIP_ALLOWLIST restricts sending to named addresses, which is how the
//     warm-up sends to a small engaged segment rather than everyone.
//
// Vercel Hobby runs crons once per day, UTC, and may fire anywhere inside the
// scheduled hour. A daily drip fits that exactly; nothing here assumes a
// precise time, and `decideNextSend` resumes in order if a run is missed.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Hard ceiling per invocation. A bug cannot mail the whole list. */
const MAX_SENDS_PER_RUN = Number(process.env.DRIP_MAX_SENDS_PER_RUN ?? 50);

type Outcome = {
    email: string;
    slug?: string;
    result: "sent" | "would-send" | "skipped" | "failed";
    detail?: string;
};

function allowlist(): Set<string> | null {
    const raw = String(process.env.DRIP_ALLOWLIST ?? "").trim();
    if (!raw) return null;
    return new Set(
        raw
            .split(/[\s,;]+/)
            .map((entry) => entry.trim().toLowerCase())
            .filter(Boolean)
    );
}

export async function GET(req: Request) {
    const url = new URL(req.url);
    const dryRun = url.searchParams.get("dryRun") === "1";

    // 1) Authorisation. Vercel Cron sends `Authorization: Bearer $CRON_SECRET`.
    const secret = process.env.CRON_SECRET;
    if (!secret) {
        return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 503 });
    }
    if (req.headers.get("authorization") !== `Bearer ${secret}`) {
        return NextResponse.json({ error: "Not authorised." }, { status: 401 });
    }

    // 2) The kill switch. Checked AFTER auth so an unauthorised caller cannot
    //    probe whether the drip is live.
    const enabled = process.env.DRIP_ENABLED === "true";
    if (!enabled && !dryRun) {
        return NextResponse.json({
            skipped: "DRIP_ENABLED is not 'true' — nothing was sent.",
            hint: "Add ?dryRun=1 to preview who would receive what.",
        });
    }

    if (!dryRun && !isSendGridConfigured) {
        return NextResponse.json({ error: "SENDGRID_API_KEY is not set." }, { status: 503 });
    }

    const classes = await getManifest();
    if (classes.length === 0) {
        // A Sheets outage degrades to the last known good copy; an empty list
        // means even that is gone. Sending nothing is the only safe response.
        return NextResponse.json({ error: "Class manifest unavailable — sending nothing." }, { status: 503 });
    }

    const emails = await listProfileEmails();
    if (emails === null) {
        return NextResponse.json({ error: "Subscriber store unreadable — sending nothing." }, { status: 503 });
    }

    const only = allowlist();
    const outcomes: Outcome[] = [];
    let sent = 0;

    for (const email of emails) {
        if (sent >= MAX_SENDS_PER_RUN) {
            outcomes.push({ email, result: "skipped", detail: "per-run cap reached" });
            continue;
        }
        if (only && !only.has(email)) continue;

        const profile = await readProfile(email);
        if (!profile) {
            outcomes.push({ email, result: "skipped", detail: "profile unreadable" });
            continue;
        }

        // FAIL CLOSED: a null ledger means we cannot tell what has already been
        // sent, and a duplicate is far worse than a delay.
        const alreadySent = await readSentSlugs(email);
        if (alreadySent === null) {
            outcomes.push({ email, result: "skipped", detail: "ledger unreadable" });
            continue;
        }

        const decision = decideNextSend({ profile, classes, sentSlugs: alreadySent });
        if (decision.action === "skip") {
            // "up-to-date" is the normal steady state and would drown the log.
            if (decision.reason !== "up-to-date") {
                outcomes.push({ email, result: "skipped", detail: decision.reason });
            }
            continue;
        }

        const { klass } = decision;
        if (!klass.sendgridTemplateId) {
            outcomes.push({
                email,
                slug: klass.slug,
                result: "skipped",
                detail: "no sendgrid_template_id in the manifest for this class",
            });
            continue;
        }

        if (dryRun) {
            outcomes.push({ email, slug: klass.slug, result: "would-send" });
            sent += 1;
            continue;
        }

        const send = await sendTemplateEmail({
            to: email,
            templateId: klass.sendgridTemplateId,
            category: `class-${klass.slug}`,
            unsubscribeGroupId: SENDGRID_UNSUBSCRIBE_GROUPS.classes,
            data: {
                first_name: "",
                ctoken: profile.token,
                class_slug: klass.slug,
                class_title: klass.title,
                class_url: `https://jesusbootcamp.org/class/${klass.slug}?t=${profile.token}`,
            },
        });

        if (!send.ok) {
            outcomes.push({ email, slug: klass.slug, result: "failed", detail: send.detail });
            continue;
        }

        sent += 1;
        // Record AFTER a confirmed send. The reverse order would mean a failed
        // send is remembered as delivered and that class is never retried.
        if (!(await recordSent(email, klass.slug))) {
            // The email HAS gone out but we failed to remember it, so the next
            // run would send it again. Loud, because only a human can reconcile.
            console.error(
                `[drip] SENT ${klass.slug} to ${email} but FAILED to record it — ` +
                    `the next run may duplicate this email`
            );
            outcomes.push({ email, slug: klass.slug, result: "sent", detail: "LEDGER WRITE FAILED" });
            continue;
        }
        outcomes.push({ email, slug: klass.slug, result: "sent" });
    }

    return NextResponse.json({
        mode: dryRun ? "dry-run" : "live",
        considered: emails.length,
        sent: dryRun ? 0 : sent,
        wouldSend: dryRun ? sent : 0,
        capped: sent >= MAX_SENDS_PER_RUN,
        allowlisted: only ? only.size : null,
        outcomes,
    });
}

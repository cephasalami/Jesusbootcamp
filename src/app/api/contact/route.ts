import { NextResponse } from "next/server";
import {
    CONTACT_EMAIL,
    CONTACT_EMAILS,
    CONTACT_FROM_EMAIL,
    deliverContactEmail,
    deliverContactNotification,
    validateContactMessage,
} from "@/lib/contact";
import { ipFromHeaders, rateLimit } from "@/lib/rate-limit";

const CONTACT_LIMIT = 5;
const CONTACT_WINDOW_SEC = 10 * 60;

export async function POST(request: Request) {
    const gate = await rateLimit(
        `contact:${ipFromHeaders(request.headers)}`,
        CONTACT_LIMIT,
        CONTACT_WINDOW_SEC
    );

    if (!gate.allowed) {
        return NextResponse.json(
            { error: "Too many messages. Please wait a few minutes and try again." },
            { status: 429, headers: { "Retry-After": String(gate.retryAfterSec) } }
        );
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Please complete the contact form." }, { status: 400 });
    }

    // Quietly accept the hidden honeypot so bots cannot learn how to bypass it.
    if (
        body &&
        typeof body === "object" &&
        typeof (body as Record<string, unknown>).website === "string" &&
        (body as Record<string, unknown>).website
    ) {
        return NextResponse.json({ success: true });
    }

    const validation = validateContactMessage(body);
    if (!validation.ok) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const transactionalKey = process.env.MAILCHIMP_TRANSACTIONAL_API_KEY?.trim();
    const webhookUrl = process.env.CONTACT_WEBHOOK_URL?.trim();
    if (!transactionalKey && !webhookUrl) {
        return NextResponse.json(
            {
                error: "Online message delivery is not configured yet. Please email us directly.",
                email: CONTACT_EMAIL,
            },
            { status: 503 }
        );
    }

    try {
        if (transactionalKey) {
            await deliverContactEmail(
                transactionalKey,
                CONTACT_EMAILS,
                CONTACT_FROM_EMAIL,
                validation.value
            );
        } else if (webhookUrl) {
            await deliverContactNotification(webhookUrl, validation.value);
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(
            "[contact] Notification delivery failed:",
            error instanceof Error ? error.message : "Unknown webhook error"
        );
        return NextResponse.json(
            {
                error: "We could not send your message just now. Please email us directly.",
                email: CONTACT_EMAIL,
            },
            { status: 502 }
        );
    }
}

import { NextResponse } from "next/server";
import { subscribeToHandbook } from "@/lib/mailchimp";
import { rateLimit, ipFromHeaders } from "@/lib/rate-limit";

// Free Handbook opt-in. Upserts the email into the audience (subscribed if new)
// and applies the `handbook-subscriber` tag automatically — a Mailchimp
// automation keyed on either "subscribes to audience" or that tag delivers the
// Handbook. Idempotent: a returning subscriber succeeds (no "already subscribed"
// wall), so they flow straight on into the funnel.
//
// Rate-limited per IP so this public write endpoint can't be scripted to flood
// the Mailchimp audience with junk / non-consenting contacts.
const SUBSCRIBE_LIMIT = 20;
const SUBSCRIBE_WINDOW_SEC = 60;

export async function POST(req: Request) {
    try {
        const ip = ipFromHeaders(req.headers);
        const gate = await rateLimit(`subscribe:${ip}`, SUBSCRIBE_LIMIT, SUBSCRIBE_WINDOW_SEC);
        if (!gate.allowed) {
            return NextResponse.json(
                { error: "Too many attempts. Please try again in a minute." },
                { status: 429 }
            );
        }

        const { email } = await req.json();

        if (!email || typeof email !== "string" || !email.includes("@")) {
            return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
        }

        await subscribeToHandbook({ email });

        return NextResponse.json({ success: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Server error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import { subscribeToCourse } from "@/lib/mailchimp";
import { rateLimit, ipFromHeaders } from "@/lib/rate-limit";

// FIX 7 — /join signup. Upserts the contact into the audience (subscribed if
// new), captures first name if given, and applies `jbc-course-start` — the
// trigger tag for the 90-day class sequence. Rate-limited per IP so this public
// write endpoint can't be scripted to flood the audience.
const JOIN_LIMIT = 20;
const JOIN_WINDOW_SEC = 60;

export async function POST(req: Request) {
    try {
        const ip = ipFromHeaders(req.headers);
        const gate = await rateLimit(`join:${ip}`, JOIN_LIMIT, JOIN_WINDOW_SEC);
        if (!gate.allowed) {
            return NextResponse.json(
                { error: "Too many attempts. Please try again in a minute." },
                { status: 429 }
            );
        }

        const body = await req.json().catch(() => ({}));
        const email = typeof body?.email === "string" ? body.email.trim() : "";
        const firstName = typeof body?.firstName === "string" ? body.firstName.trim() : "";

        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
            return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
        }

        await subscribeToCourse({ email, name: firstName || undefined });

        return NextResponse.json({ success: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Server error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

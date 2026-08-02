import { NextResponse } from "next/server";
import {
    DEVICE_COOKIE_NAME,
    DEVICE_COOKIE_OPTIONS,
    issueDeviceToken,
    resolveByEmail,
} from "@/lib/subscriber";
import { rateLimit, ipFromHeaders } from "@/lib/rate-limit";

// Fallback identification for a class link whose `?t=` is missing, mangled by an
// email client's link wrapper, or issued before this system existed.
//
// Looks the address up against the EXISTING Mailchimp helper (no second client,
// no second signup endpoint — someone who isn't on the audience is sent to
// /join, which is already built). On success it issues/repairs their token and
// returns it so the caller can continue to the class they were trying to reach.
//
// Deliberately does NOT reveal whether an address is on the list in a way that
// differs by timing or wording beyond a single boolean — this endpoint is public.
const LIMIT = 10;
const WINDOW_SEC = 60;

export async function POST(req: Request) {
    const gate = await rateLimit(`classid:${ipFromHeaders(req.headers)}`, LIMIT, WINDOW_SEC);
    if (!gate.allowed) {
        return NextResponse.json(
            { error: "Too many attempts. Please try again in a minute." },
            { status: 429 }
        );
    }

    const body = await req.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    try {
        const found = await resolveByEmail(email);
        if (!found) {
            return NextResponse.json({
                found: false,
                message:
                    "We couldn't find that email on the Jesus Boot Camp list. You can join free — it only takes a moment.",
            });
        }
        const response = NextResponse.json({ found: true, token: found.token });
        try {
            const deviceToken = await issueDeviceToken(found.subscriber.email);
            response.cookies.set(DEVICE_COOKIE_NAME, deviceToken, DEVICE_COOKIE_OPTIONS);
        } catch (deviceError) {
            // Device recognition is a convenience layer. A transient KV outage
            // must not stop a correctly identified subscriber from continuing
            // with their normal CTOKEN link.
            console.error(
                `[class/identify] could not remember the device for ${found.subscriber.email}:`,
                deviceError
            );
        }
        return response;
    } catch (err) {
        console.error(`[class/identify] lookup failed for ${email}:`, err);
        return NextResponse.json(
            { error: "Something went wrong looking that up. Please try again shortly." },
            { status: 500 }
        );
    }
}

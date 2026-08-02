import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ipFromHeaders, rateLimit } from "@/lib/rate-limit";
import {
    DEVICE_COOKIE_NAME,
    DEVICE_COOKIE_OPTIONS,
    issueDeviceToken,
    resolveByDeviceToken,
    resolveByToken,
} from "@/lib/subscriber";

const LIMIT = 30;
const WINDOW_SEC = 60;

/** Remember a browser after it opens a genuine CTOKEN class link. */
export async function POST(req: Request) {
    const origin = req.headers.get("origin");
    if (origin && origin !== new URL(req.url).origin) {
        return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
    }

    const gate = await rateLimit(`classdevice:${ipFromHeaders(req.headers)}`, LIMIT, WINDOW_SEC);
    if (!gate.allowed) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const subscriber = await resolveByToken(token);
    if (!subscriber) {
        return NextResponse.json({ error: "Not authorised" }, { status: 401 });
    }

    const cookieStore = await cookies();
    const existingToken = cookieStore.get(DEVICE_COOKIE_NAME)?.value ?? "";
    const existingSubscriber = await resolveByDeviceToken(existingToken);
    if (existingSubscriber?.email === subscriber.email) {
        return NextResponse.json({ remembered: true });
    }

    try {
        const deviceToken = await issueDeviceToken(subscriber.email);
        const response = NextResponse.json({ remembered: true });
        response.cookies.set(DEVICE_COOKIE_NAME, deviceToken, DEVICE_COOKIE_OPTIONS);
        return response;
    } catch (error) {
        console.error(`[class/device] could not remember ${subscriber.email}:`, error);
        return NextResponse.json({ error: "Device recognition is temporarily unavailable" }, { status: 503 });
    }
}

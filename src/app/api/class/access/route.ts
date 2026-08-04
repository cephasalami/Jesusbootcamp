// POST /api/class/access
//
// Tracks material types that do not pass through the Drive proxy: Drive
// preview videos and external quizzes. The server re-resolves the existing
// CTOKEN and repeats the class/format entitlement check before recording.

import { getManifest } from "@/lib/manifest";
import { evaluateAccess, findClassBySlug } from "@/lib/access";
import { resolveByToken } from "@/lib/subscriber";
import {
    isTrackableMaterialFormat,
    recordMaterialAccess,
} from "@/lib/tracking/material-access";
import { rateLimit, ipFromHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const ACCESS_LIMIT = 120;
const ACCESS_WINDOW_SEC = 60;

export async function POST(request: Request): Promise<Response> {
    const silent = () => new Response(null, { status: 204 });

    try {
        const gate = await rateLimit(
            `class-access:${ipFromHeaders(request.headers)}`,
            ACCESS_LIMIT,
            ACCESS_WINDOW_SEC
        );
        if (!gate.allowed) return silent();

        const body = (await request.json()) as {
            token?: unknown;
            slug?: unknown;
            format?: unknown;
            success?: unknown;
        };
        const token = typeof body.token === "string" ? body.token : "";
        const slug = typeof body.slug === "string" ? body.slug.trim() : "";
        const format = typeof body.format === "string" ? body.format.trim() : "";
        const requestedSuccess = body.success === true;

        if (!slug || !isTrackableMaterialFormat(format)) return silent();

        const subscriber = await resolveByToken(token);
        if (!subscriber) return silent();

        const klass = findClassBySlug(await getManifest(), slug);
        if (!klass) return silent();

        const access = evaluateAccess(subscriber, klass);
        const allowed =
            access.status === "open" &&
            (format === "quiz"
                ? Boolean(klass.quizUrl && access.quiz === "open")
                : access.formats[format] === "open");

        await recordMaterialAccess({
            subscriberToken: subscriber.token,
            classSlug: klass.slug,
            format,
            success: requestedSuccess && allowed,
        });
    } catch {
        // Analytics must never stop a learner opening a video or quiz.
    }

    return silent();
}

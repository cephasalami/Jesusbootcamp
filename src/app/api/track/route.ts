// src/app/api/track/route.ts — PUBLIC first-party event collector.
//
// The site's client code (via src/lib/track.ts and the fbq wrappers) POSTs
// events here. We record a compact, non-PII count in the event store. This
// endpoint is intentionally public (any site visitor fires events) — it only
// increments counters and never returns stored data.
//
// Hardening: event names must match a strict pattern (prevents key injection and
// unbounded key cardinality), and each client IP is rate-limited so the counters
// can't be cheaply inflated / used to run up datastore cost. Abuse is dropped
// silently (still 204) so a bad actor gets no useful signal. It no-ops when no
// event store is configured.

import { recordEvent } from "@/lib/tracking/events-store";
import { rateLimit, ipFromHeaders } from "@/lib/rate-limit";

// Never prerender / cache — this is a write endpoint.
export const dynamic = "force-dynamic";

// A legit visitor fires a handful of events per page; 120/min/IP is generous
// for real use while capping automated inflation.
const TRACK_LIMIT = 120;
const TRACK_WINDOW_SEC = 60;

// Standard/known events are PascalCase words; allow letters, digits, underscore.
const NAME_RE = /^[A-Za-z][A-Za-z0-9_]{0,39}$/;

export async function POST(request: Request): Promise<Response> {
  const drop = () => new Response(null, { status: 204 });
  try {
    const ip = ipFromHeaders(request.headers);
    const gate = await rateLimit(`track:${ip}`, TRACK_LIMIT, TRACK_WINDOW_SEC);
    if (!gate.allowed) return drop(); // silently ignore over-limit traffic

    const body = (await request.json()) as { name?: unknown };
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (NAME_RE.test(name)) {
      await recordEvent(name);
    }
  } catch {
    // Malformed body / no store — swallow. Collection is best-effort.
  }
  return drop();
}

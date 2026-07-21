// src/lib/track.ts — first-party event beacon (client-side).
//
// Sends a lightweight event to our own collector at /api/track so we own a copy
// of the same signals we send to Meta (page views, button clicks, checkout
// intents, conversions). The collector stores an event-NAME count only (see
// src/app/api/track/route.ts and events-store.ts), so we deliberately send just
// the name — no path or params — to avoid shipping data that is never stored and
// to keep any PII out of the beacon. It never throws and never blocks a user
// interaction; failures are swallowed on purpose.

/** Fire a first-party event by name. Safe to call anywhere on the client. */
export function postTrackEvent(name: string): void {
  if (typeof window === "undefined") return;
  try {
    const body = JSON.stringify({ name });

    // sendBeacon survives page unloads (e.g. a click that navigates away).
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon("/api/track", blob)) return;
    }

    // Fallback: keepalive fetch, fire-and-forget.
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Never let analytics break a user flow.
  }
}

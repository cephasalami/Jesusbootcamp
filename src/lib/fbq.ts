// Meta Pixel event helpers.
//
// The base pixel (`window.fbq`) is loaded site-wide from the root layout
// (`src/app/layout.tsx`). These wrappers fire standard events on top of it and
// no-op safely when the pixel isn't available — e.g. during SSR, or when an ad
// blocker prevents `fbevents.js` from loading — so tracking can never throw or
// break a user flow.
//
// Every wrapper ALSO mirrors the event to our own first-party collector
// (`postTrackEvent` -> /api/track) so the /tracking dashboard can report the
// exact same signals we send to Meta, without depending on the Meta API. The
// mirror is fire-and-forget and no-ops when no event store is configured.

import { postTrackEvent } from "@/lib/track";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Fire a Meta Pixel standard event. No-ops if the pixel hasn't loaded.
 * `options` carries Meta's optional fields (e.g. `{ eventID }` for browser↔server
 * deduplication of Purchase events).
 */
export function trackFbEvent(
  event: string,
  params?: Record<string, unknown>,
  options?: { eventID?: string }
): void {
  postTrackEvent(event); // mirror the event NAME to our first-party collector
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  if (options) window.fbq("track", event, params, options);
  else window.fbq("track", event, params);
}

/** Fire a Meta Pixel custom event. No-ops if the pixel hasn't loaded. */
export function trackFbCustomEvent(
  event: string,
  params?: Record<string, unknown>
): void {
  postTrackEvent(event); // mirror the event NAME to our first-party collector
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("trackCustom", event, params);
}

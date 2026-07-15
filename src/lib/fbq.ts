// Meta Pixel event helpers.
//
// The base pixel (`window.fbq`) is loaded site-wide from the root layout
// (`src/app/layout.tsx`). These wrappers fire standard events on top of it and
// no-op safely when the pixel isn't available — e.g. during SSR, or when an ad
// blocker prevents `fbevents.js` from loading — so tracking can never throw or
// break a user flow.

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/** Fire a Meta Pixel standard event. No-ops if the pixel hasn't loaded. */
export function trackFbEvent(
  event: string,
  params?: Record<string, unknown>
): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("track", event, params);
}

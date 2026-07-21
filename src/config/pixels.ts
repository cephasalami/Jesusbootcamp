// src/config/pixels.ts
//
// SINGLE SOURCE OF TRUTH for the tracking pixels installed on the site and the
// events we fire on top of them. The root layout reads META_PIXEL_ID from here,
// and the /tracking dashboard renders PIXELS + TRACKED_EVENTS so Paul can see,
// at a glance, exactly what is instrumented. Add a new pixel or event here and
// it shows up on the dashboard automatically.

export type PixelProvider =
  | "meta"
  | "ga4"
  | "google-ads"
  | "tiktok"
  | "pinterest"
  | "other";

export type TrackingPixel = {
  /** The pixel / tag ID as it appears in the ad platform. */
  id: string;
  provider: PixelProvider;
  /** Human label for the dashboard. */
  label: string;
  /** Where on the site it loads. */
  scope: string;
  /** Is it live in the current deploy? */
  active: boolean;
};

export type TrackedEvent = {
  /** Event name sent to the pixel (and to our first-party collector). */
  name: string;
  /** "standard" = platform standard event; "custom" = trackCustom. */
  kind: "standard" | "custom" | "auto";
  /** Plain-English description of when it fires. */
  when: string;
  /** Where in the site it is fired from. */
  where: string;
};

// ── Meta Pixel ───────────────────────────────────────────────────────────────
// This ID is loaded site-wide from src/app/layout.tsx. Keep it here so there is
// exactly one place to change it.
export const META_PIXEL_ID = "1551632843016917";

/** Graph API version used by the Meta Ads Insights provider. Overridable. */
export const META_GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v21.0";

// ── The pixels installed on the site ─────────────────────────────────────────
export const PIXELS: TrackingPixel[] = [
  {
    id: META_PIXEL_ID,
    provider: "meta",
    label: "Meta Pixel — Jesus Boot Camp",
    scope: "Site-wide (all pages, root layout)",
    active: true,
  },
  // Add more pixels here as they are installed, e.g. GA4 / Google Ads / TikTok.
];

// ── Events we fire (kept in sync with the code that fires them) ───────────────
// Auto = fired automatically by the pixel base code / page-view tracker.
export const TRACKED_EVENTS: TrackedEvent[] = [
  {
    name: "PageView",
    kind: "auto",
    when: "Every page load / route change",
    where: "Root layout (Meta base) + first-party page-view tracker",
  },
  {
    name: "InitiateCheckout",
    kind: "standard",
    when: "Buyer clicks a Buy / checkout button",
    where: "power-for-the-hour, power-for-the-hour-book, while-you-were-busy",
  },
  {
    name: "Purchase",
    kind: "standard",
    when: "Payment succeeds (main order + one-click upsell), deduped by PI id",
    where: "checkout confirmation page",
  },
  {
    name: "Lead",
    kind: "standard",
    when: "Handbook / newsletter signup form submitted",
    where: "handbook, homepage lead magnet, final CTA",
  },
  {
    name: "DonateIntent",
    kind: "custom",
    when: "Partner / donate button clicked",
    where: "partner, while-you-were-busy",
  },
  {
    name: "VideoPlay",
    kind: "custom",
    when: "Handbook overview video played",
    where: "handbook",
  },
];

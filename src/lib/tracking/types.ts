// src/lib/tracking/types.ts — shared shapes for the /tracking dashboard.
//
// Every provider returns a `connected` flag so the dashboard can render an
// honest "Not connected" state (with a setup hint) instead of ever showing
// fabricated numbers when a data source hasn't been wired up yet.

export type ProviderStatus = {
  connected: boolean;
  /** One-line reason shown when not connected (e.g. which env var to set). */
  hint?: string;
  /** Populated when a connected provider still errored on this request. */
  error?: string;
};

/** Real conversions + revenue from Stripe. */
export type StripeMetrics = ProviderStatus & {
  /** Rolling window in days that the numbers below cover. */
  windowDays: number;
  /** Successful (paid, non-refunded) charges in the window = conversions. */
  conversions: number;
  /** Net revenue in cents (captured minus refunded) in the window. */
  revenueCents: number;
  today: { conversions: number; revenueCents: number };
  /** Units sold per book in the window (attributed from order metadata tags). */
  bookSales: Array<{ slug: string; title: string; units: number }>;
  /** Most recent successful charges, newest first. */
  recent: Array<{
    amountCents: number;
    createdMs: number;
    email: string | null;
    description: string | null;
  }>;
  /** True if the window hit the scan cap (numbers are a lower bound). */
  capped: boolean;
};

/** "Forms filled" — audience / lead signups from Mailchimp. */
export type MailchimpMetrics = ProviderStatus & {
  windowDays: number;
  /** Currently subscribed members. */
  totalSubscribers: number;
  /** All contacts (subscribed + unsubscribed + non-subscribed). */
  totalContacts: number;
  /** New opt-in signups within the recent activity window. */
  newSignupsWindow: number;
  /** Most recent signups, newest first. */
  recent: Array<{ email: string; ms: number }>;
  /** Daily signup counts (oldest first) for a small chart. */
  series: Array<{ date: string; count: number }>;
};

/** Ad-side impressions / clicks / spend from the Meta Marketing API. */
export type MetaAdsMetrics = ProviderStatus & {
  datePreset: string;
  impressions: number;
  clicks: number;
  /** Click-through rate as a percentage (e.g. 1.8 = 1.8%). */
  ctr: number;
  /** Average cost per click in the account currency. */
  cpc: number;
  /** Spend in the account currency (major units, e.g. dollars). */
  spend: number;
  reach: number;
  /** Purchases attributed by the pixel (from the `actions` breakdown). */
  purchases: number;
  currency: string;
  campaigns: Array<{
    name: string;
    impressions: number;
    clicks: number;
    ctr: number;
    spend: number;
    purchases: number;
  }>;
};

/** First-party events we collected ourselves (page views, button clicks). */
export type FirstPartyMetrics = ProviderStatus & {
  /** Total events recorded, all-time. */
  totalEvents: number;
  /** All-time first-party page views. */
  pageViews: number;
  /** Per-event-name all-time totals, sorted desc. */
  byEvent: Array<{ name: string; total: number }>;
  /** Daily total-event counts for the recent series (oldest first). */
  series: Array<{ date: string; count: number }>;
};

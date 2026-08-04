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
  /** Amount refunded in cents on charges created inside the window. */
  refundedCents: number;
  today: { conversions: number; revenueCents: number };
  /** Units sold per book in the window (attributed from order metadata tags). */
  bookSales: Array<{ slug: string; title: string; units: number }>;
  /** Orders that included the order bump (from the checkout's `bump` metadata). */
  bumpOrders: number;
  /** One row per UTC day in the window, oldest first. */
  series: Array<{ date: string; revenueCents: number; conversions: number }>;
  /** Most recent successful charges, newest first. */
  recent: Array<{
    id: string;
    amountCents: number;
    createdMs: number;
    email: string | null;
    description: string | null;
    /** "main" for a book checkout, "upsell", or null when unlabelled. */
    kind: string | null;
    /** Card brand + last four when the charge was paid by card. */
    card: string | null;
    country: string | null;
    refundedCents: number;
  }>;
  /** True if the window hit the scan cap (numbers are a lower bound). */
  capped: boolean;
};

/** Monthly partnership subscriptions (the /partner/join recurring gifts). */
export type PartnerSubscriptionMetrics = ProviderStatus & {
  /** Subscriptions in `active` or `trialing`. */
  activeCount: number;
  /** Subscriptions Stripe is retrying (`past_due` / `unpaid` / `incomplete`). */
  atRiskCount: number;
  /** Cancelled subscriptions still inside the scanned set. */
  canceledCount: number;
  /** Normalised monthly recurring revenue in cents across active subscriptions. */
  mrrCents: number;
  /** Active subscriptions grouped by the monthly amount they pay. */
  byAmount: Array<{ amountCents: number; count: number }>;
  /** Newest subscriptions first. */
  recent: Array<{
    id: string;
    email: string | null;
    name: string | null;
    amountCents: number;
    status: string;
    createdMs: number;
    cancelAtPeriodEnd: boolean;
  }>;
  /** True if the scan hit its page cap (counts are a lower bound). */
  capped: boolean;
};

/** "Forms filled" — audience / lead signups from Mailchimp. */
export type MailchimpMetrics = ProviderStatus & {
  windowDays: number;
  /** Currently subscribed members. */
  totalSubscribers: number;
  /** All contacts (subscribed + unsubscribed + non-subscribed). */
  totalContacts: number;
  /** Members who opted out. */
  unsubscribeCount: number;
  /** Addresses Mailchimp removed after repeated hard bounces. */
  cleanedCount: number;
  /** Audience-wide average open rate as a percentage. */
  avgOpenRate: number;
  /** Audience-wide average click rate as a percentage. */
  avgClickRate: number;
  /** When Mailchimp last sent a campaign to this audience. */
  lastCampaignSentAt: number | null;
  /** New opt-in signups within the recent activity window. */
  newSignupsWindow: number;
  /** Opt-outs within the recent activity window. */
  newUnsubsWindow: number;
  /** Most recent signups, newest first. */
  recent: Array<{ email: string; ms: number; status: string | null; source: string | null }>;
  /** Daily signup counts (oldest first) for a small chart. */
  series: Array<{ date: string; count: number }>;
  /** Daily opt-out counts, aligned with `series`. */
  unsubSeries: Array<{ date: string; count: number }>;
};

/** Read-only engagement summary for every sent Mailchimp campaign. */
export type MailchimpCampaignMetrics = ProviderStatus & {
  /** Number of sent campaigns returned by Mailchimp's Reports endpoint. */
  totalCampaigns: number;
  /** Sum across campaigns; a subscriber can contribute to more than one. */
  totalOpens: number;
  /** Sum of unique campaign clickers across campaigns. */
  totalClicks: number;
  /** Total emails delivered across every sent campaign. */
  totalRecipients: number;
  /** The data is cached server-side to protect Mailchimp's API. */
  cachedAt: number | null;
  campaigns: Array<{
    id: string;
    title: string;
    sentAt: number | null;
    emailsSent: number;
    opens: number;
    openRate: number;
    clicks: number;
    clickRate: number;
  }>;
};

/** The full Mailchimp report for ONE sent campaign (the drill-down view). */
export type MailchimpCampaignDetail = ProviderStatus & {
  cachedAt: number | null;
  campaign: {
    id: string;
    title: string;
    subject: string;
    previewText: string;
    fromName: string;
    sentAt: number | null;
    emailsSent: number;
    abuseReports: number;
    unsubscribed: number;
    hardBounces: number;
    softBounces: number;
    syntaxErrors: number;
    opensTotal: number;
    uniqueOpens: number;
    openRate: number;
    lastOpenAt: number | null;
    clicksTotal: number;
    uniqueClicks: number;
    uniqueSubscriberClicks: number;
    clickRate: number;
    lastClickAt: number | null;
    forwards: number;
    forwardOpens: number;
    /** Subscribers who clicked, divided by subscribers who opened. */
    clickToOpenRate: number | null;
  } | null;
  /** Most-clicked links inside the email, best first. */
  links: Array<{ url: string; clicks: number; uniqueClicks: number; clickPercentage: number }>;
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
  /** Daily spend/clicks over the window, oldest first. Empty if Meta omits it. */
  series: Array<{ date: string; spend: number; clicks: number; impressions: number }>;
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

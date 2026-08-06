import Link from "next/link";
import { Database, ShieldCheck } from "lucide-react";
import { readStripeMetrics } from "@/lib/tracking/stripe-metrics";
import { readPartnerSubscriptions } from "@/lib/tracking/stripe-subscriptions";
import { readMetaAds } from "@/lib/tracking/meta-ads";
import { readFirstParty } from "@/lib/tracking/events-store";
import { readMailchimpMetrics } from "@/lib/tracking/mailchimp-metrics";
import { readMailchimpCampaignMetrics } from "@/lib/tracking/mailchimp-campaign-metrics";
import { readMaterialAccessMetrics } from "@/lib/tracking/material-access";
import { Panel, ScreenHeader, SourceBadge, sourceState, type SourceState } from "../../ui";
import { fmtDateTime, fmtWhen, renderedAt } from "../../format";
import styles from "../../tracking.module.css";

export const dynamic = "force-dynamic";

type Row = {
  label: string;
  state: SourceState;
  feeds: string;
  screen: { href: string; label: string };
  env: string[];
  /** Setup hint when disconnected, error text when failing, freshness when live. */
  status: string;
};

export default async function SourcesScreen() {
  const [stripe, partners, meta, first, audience, campaigns, materials] = await Promise.all([
    readStripeMetrics(),
    readPartnerSubscriptions(),
    readMetaAds(),
    readFirstParty(),
    readMailchimpMetrics(),
    readMailchimpCampaignMetrics(),
    readMaterialAccessMetrics(),
  ]);

  /** Live sources describe their own freshness; broken ones describe the fault. */
  const note = (source: { connected: boolean; hint?: string; error?: string }, live: string) =>
    !source.connected ? (source.hint ?? "Not configured.") : source.error ? source.error : live;

  const rows: Row[] = [
    {
      label: "Course access log",
      state: sourceState(materials.connected, materials.error),
      feeds: "Material opens, failures, per-class engagement and the recent-activity timeline.",
      screen: { href: "/tracking/course", label: "Course access" },
      env: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
      status: note(materials, "Counters read live on every load; the event log keeps the newest 2,000 records."),
    },
    {
      label: "Mailchimp campaign reports",
      state: sourceState(campaigns.connected, campaigns.error),
      feeds: "Sent-email opens, clicks, bounces, unsubscribes and clicked links.",
      screen: { href: "/tracking/email", label: "Email" },
      env: ["MAILCHIMP_API_KEY", "MAILCHIMP_API_SERVER", "MAILCHIMP_AUDIENCE_ID"],
      status: note(
        campaigns,
        campaigns.cachedAt
          ? `Cached ${fmtWhen(campaigns.cachedAt)} · refreshes every 15 minutes.`
          : "Refreshing the report cache now."
      ),
    },
    {
      label: "Mailchimp audience",
      state: sourceState(audience.connected, audience.error),
      feeds: "Subscriber count, signups, opt-outs and the list-wide open and click rates.",
      screen: { href: "/tracking/audience", label: "Audience" },
      env: ["MAILCHIMP_API_KEY", "MAILCHIMP_API_SERVER", "MAILCHIMP_AUDIENCE_ID"],
      status: note(audience, `Read live on every load · ${audience.windowDays}-day activity window.`),
    },
    {
      label: "First-party events",
      state: sourceState(first.connected, first.error),
      feeds: "Page views, leads, checkout starts and purchases collected by our own beacon.",
      screen: { href: "/tracking/audience", label: "Audience" },
      env: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
      status: note(first, "Written by /api/track as events happen; totals are all-time."),
    },
    {
      label: "Stripe payments",
      state: sourceState(stripe.connected, stripe.error),
      feeds: "Revenue, orders, average order value, book units and the recent-orders list.",
      screen: { href: "/tracking/sales", label: "Sales" },
      env: ["STRIPE_SECRET_KEY"],
      status: note(
        stripe,
        `Read live on every load · rolling ${stripe.windowDays}-day window${stripe.capped ? " · scan hit its page cap" : ""}.`
      ),
    },
    {
      label: "Stripe subscriptions",
      state: sourceState(partners.connected, partners.error),
      feeds: "Active monthly partners, recurring revenue and failing payments.",
      screen: { href: "/tracking/sales", label: "Sales" },
      env: ["STRIPE_SECRET_KEY"],
      status: note(partners, "Read live on every load · amounts normalised to a monthly figure."),
    },
    {
      label: "Meta Ads",
      state: sourceState(meta.connected, meta.error),
      feeds: "Impressions, reach, clicks, spend, pixel purchases and per-campaign delivery.",
      screen: { href: "/tracking/ads", label: "Acquisition" },
      env: ["META_ACCESS_TOKEN", "META_AD_ACCOUNT_ID"],
      status: note(meta, `Read live on every load · ${meta.datePreset} window.`),
    },
  ];

  const live = rows.filter((row) => row.state === "live").length;
  const failing = rows.filter((row) => row.state === "err");

  return (
    <>
      <ScreenHeader
        eyebrow="Data sources"
        title="Where every number comes from"
        subtitle="Each screen is built only from the sources listed here. When one is unavailable the dashboard says so rather than showing an estimate."
        meta={
          <>
            <span className={styles.liveDot} />
            {live} of {rows.length} live · checked {fmtDateTime(renderedAt())}
          </>
        }
      />

      {failing.length > 0 ? (
        <p className={styles.errorBanner}>
          {failing.length === 1
            ? `${failing[0].label} is configured but failing.`
            : `${failing.length} sources are configured but failing.`}{" "}
          See the status column below.
        </p>
      ) : null}

      <Panel
        icon={<Database size={18} />}
        title="Source health"
        subtitle="Configuration, purpose and current state of every provider."
        wide
      >
        <div className={styles.sourceList}>
          {rows.map((row) => (
            <article key={row.label} className={styles.sourceRow}>
              <div className={styles.sourceRowHead}>
                <strong>{row.label}</strong>
                <SourceBadge state={row.state} />
              </div>
              <p className={styles.sourceFeeds}>{row.feeds}</p>
              <p className={styles.sourceStatus}>{row.status}</p>
              <div className={styles.sourceEnv}>
                {row.env.map((name) => (
                  <code key={name}>{name}</code>
                ))}
              </div>
              <Link className={styles.cardLink} href={row.screen.href}>
                {row.screen.label} screen
              </Link>
            </article>
          ))}
        </div>
      </Panel>

      <Panel
        icon={<ShieldCheck size={18} />}
        title="Reporting rules"
        subtitle="The guarantees this dashboard makes about its own numbers."
        wide
      >
        <ul className={styles.ruleList}>
          <li>
            <strong>Nothing is estimated.</strong> Every figure is read from a provider on request. A
            source that has not been configured renders &ldquo;Not connected&rdquo; with its setup hint;
            one that is configured but failing renders &ldquo;Needs attention&rdquo; with the error. Neither
            ever falls back to a zero, because a zero is indistinguishable from a real one.
          </li>
          <li>
            <strong>Windows are labelled.</strong> Stripe and Meta report a rolling 30 days; Mailchimp
            audience activity reports 30 days; course access and first-party event totals are all-time.
          </li>
          <li>
            <strong>Percentages are normalised once.</strong> Mailchimp returns campaign rates as
            fractions and list rates as percentages; both are converted to percentages in the reader, so
            every screen shows the same scale.
          </li>
          <li>
            <strong>The access log holds no personal data.</strong> Learners appear as a one-way hash of
            their existing access token — never an email, name or raw token.
          </li>
          <li>
            <strong>Caps are disclosed.</strong> Where a scan is bounded (Stripe orders and
            subscriptions, the 2,000-record access log) the screen says so, so a capped total is never
            read as a complete one.
          </li>
        </ul>
      </Panel>
    </>
  );
}

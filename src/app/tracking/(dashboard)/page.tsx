import {
  Activity,
  BookOpen,
  CircleDollarSign,
  Mail,
  MousePointer2,
  Users,
} from "lucide-react";
import { readStripeMetrics } from "@/lib/tracking/stripe-metrics";
import { readMetaAds } from "@/lib/tracking/meta-ads";
import { readFirstParty } from "@/lib/tracking/events-store";
import { readMailchimpMetrics } from "@/lib/tracking/mailchimp-metrics";
import { readMailchimpCampaignMetrics } from "@/lib/tracking/mailchimp-campaign-metrics";
import { readMaterialAccessMetrics } from "@/lib/tracking/material-access";
import { getManifest } from "@/lib/manifest";
import {
  BarChart,
  CardLink,
  EmptySource,
  ErrorBanner,
  MetricCard,
  Panel,
  ScreenHeader,
  ShareBar,
  SourceBadge,
  sourceState,
} from "../ui";
import { fmtDateTime, fmtInt, fmtPct, fmtUsdCents, renderedAt, share } from "../format";
import styles from "../tracking.module.css";

export const dynamic = "force-dynamic";

/** The site's real funnel, in the order the events fire. */
const FUNNEL = [
  { event: "PageView", label: "Page views", note: "Any page on the site" },
  { event: "Lead", label: "Leads", note: "Handbook and Join form submits" },
  { event: "InitiateCheckout", label: "Checkouts started", note: "Book checkout opened" },
  { event: "Purchase", label: "Purchases", note: "Confirmation page reached" },
] as const;

export default async function OverviewScreen() {
  const [stripe, meta, first, mailchimp, campaigns, materials, classes] = await Promise.all([
    readStripeMetrics(),
    readMetaAds(),
    readFirstParty(),
    readMailchimpMetrics(),
    readMailchimpCampaignMetrics(),
    readMaterialAccessMetrics(),
    getManifest(),
  ]);

  const stripeOk = stripe.connected && !stripe.error;
  const mailchimpOk = mailchimp.connected && !mailchimp.error;
  const campaignsOk = campaigns.connected && !campaigns.error;
  const materialsOk = materials.connected && !materials.error;

  const classTitles = new Map(classes.map((klass) => [klass.slug, klass.title]));
  const materialClasses = materials.byClass.map((klass) => ({
    ...klass,
    title: classTitles.get(klass.classSlug) ?? `Class ${klass.classSlug.toUpperCase()}`,
    opened: klass.formats.reduce((sum, format) => sum + format.opened, 0),
  }));
  const mostAccessed = [...materialClasses].sort((a, b) => b.opened - a.opened)[0] ?? null;
  const leastAccessed = [...materialClasses].sort((a, b) => a.opened - b.opened)[0] ?? null;
  const topCampaign = [...campaigns.campaigns].sort((a, b) => b.opens - a.opens)[0] ?? null;

  const eventTotal = (name: string) =>
    first.byEvent.find((event) => event.name === name)?.total ?? 0;
  const funnel = FUNNEL.map((step, index, all) => {
    const count = eventTotal(step.event);
    const previous = index === 0 ? count : eventTotal(all[index - 1].event);
    return { ...step, count, rate: index === 0 ? null : share(count, previous) };
  });
  const funnelMax = Math.max(1, ...funnel.map((step) => step.count));

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? "morning" : greetingHour < 18 ? "afternoon" : "evening";

  const sources = [
    { label: "Course access log", state: sourceState(materials.connected, materials.error) },
    { label: "Mailchimp campaigns", state: sourceState(campaigns.connected, campaigns.error) },
    { label: "Mailchimp audience", state: sourceState(mailchimp.connected, mailchimp.error) },
    { label: "First-party events", state: sourceState(first.connected, first.error) },
    { label: "Stripe", state: sourceState(stripe.connected, stripe.error) },
    { label: "Meta Ads", state: sourceState(meta.connected, meta.error) },
  ];
  const liveCount = sources.filter((source) => source.state === "live").length;

  return (
    <>
      <ScreenHeader
        eyebrow="Performance overview"
        title={`Good ${greeting}, team.`}
        subtitle="The headline number from each area of the ministry. Open any card to see the detail behind it."
        meta={
          <>
            <span className={styles.liveDot} />
            {liveCount} of {sources.length} sources live · refreshed {fmtDateTime(renderedAt())}
          </>
        }
      />

      <section className={styles.overviewGrid} aria-label="Headline metrics">
        <MetricCard
          icon={<BookOpen size={16} />}
          label="Material opens"
          value={materialsOk ? fmtInt(materials.totalOpened) : "—"}
          detail={materialsOk ? "Successful opens and downloads, all-time" : "Course access log not connected"}
          muted={!materialsOk}
          accent
          href="/tracking/course"
        />
        <MetricCard
          icon={<Mail size={16} />}
          label="Email opens"
          value={campaignsOk ? fmtInt(campaigns.totalOpens) : "—"}
          detail={campaignsOk ? `Unique opens across ${fmtInt(campaigns.totalCampaigns)} sent campaigns` : "Mailchimp reports not connected"}
          muted={!campaignsOk}
          href="/tracking/email"
        />
        <MetricCard
          icon={<Users size={16} />}
          label="Subscribers"
          value={mailchimpOk ? fmtInt(mailchimp.totalSubscribers) : "—"}
          detail={mailchimpOk ? `${fmtInt(mailchimp.newSignupsWindow)} new in the last ${mailchimp.windowDays} days` : "Mailchimp audience not connected"}
          muted={!mailchimpOk}
          href="/tracking/audience"
        />
        <MetricCard
          icon={<CircleDollarSign size={16} />}
          label="Revenue"
          value={stripeOk ? fmtUsdCents(stripe.revenueCents) : "—"}
          detail={stripeOk ? `${fmtInt(stripe.conversions)} orders in the last ${stripe.windowDays} days` : "Stripe not connected"}
          muted={!stripeOk}
          href="/tracking/sales"
        />
      </section>

      <section className={styles.overviewSplit}>
        <Panel
          icon={<Activity size={18} />}
          title="Site funnel"
          subtitle="First-party events we collect ourselves, all-time."
          state={sourceState(first.connected, first.error)}
          action={<CardLink href="/tracking/audience">All events</CardLink>}
        >
          {!first.connected ? (
            <EmptySource
              title="On-site activity is not available"
              hint={<>Connect the existing KV store to record <code>PageView</code>, lead and checkout events.</>}
            />
          ) : first.error ? (
            <ErrorBanner label="Event store error" message={first.error} />
          ) : (
            <>
              <ol className={styles.funnel}>
                {funnel.map((step) => (
                  <li key={step.event}>
                    <div className={styles.funnelRow}>
                      <span className={styles.funnelLabel}>{step.label}</span>
                      <strong className={styles.funnelValue}>{fmtInt(step.count)}</strong>
                      <span className={styles.funnelRate}>
                        {step.rate == null ? "start" : `${fmtPct(step.rate, 1)} of previous step`}
                      </span>
                    </div>
                    <ShareBar percent={(step.count / funnelMax) * 100} />
                    <small>{step.note}</small>
                  </li>
                ))}
              </ol>
              {stripeOk ? (
                <p className={styles.funnelNote}>
                  Stripe confirms <strong>{fmtInt(stripe.conversions)}</strong> paid orders in the last{" "}
                  {stripe.windowDays} days. The Purchase count above is all-time and browser-side, so the
                  two are expected to differ.
                </p>
              ) : null}
            </>
          )}
        </Panel>

        <Panel
          icon={<MousePointer2 size={18} />}
          title="Event volume"
          subtitle="Total tracked events per day over the last two weeks."
          state={sourceState(first.connected, first.error)}
        >
          {first.connected && !first.error ? (
            <>
              <div className={styles.activityFigures}>
                <strong>{fmtInt(first.totalEvents)}</strong>
                <span>tracked events all-time</span>
              </div>
              <BarChart
                series={first.series}
                label="First-party events over recent days"
                emptyLabel="No first-party activity has been recorded yet."
              />
            </>
          ) : (
            <EmptySource
              title="No event series yet"
              hint="Events appear here as soon as the collector records its first page view."
            />
          )}
        </Panel>
      </section>

      <section className={styles.overviewSplit}>
        <Panel
          icon={<BookOpen size={18} />}
          title="Course engagement"
          subtitle="Which classes learners actually open."
          state={sourceState(materials.connected, materials.error)}
          action={<CardLink href="/tracking/course">Open</CardLink>}
        >
          {!materialsOk ? (
            <EmptySource
              title="Course access log is not available"
              hint="Class-by-class engagement appears once the access log is connected."
            />
          ) : (
            <div className={styles.focusList}>
              <div>
                <span>Most accessed</span>
                <strong>{mostAccessed ? `Class ${mostAccessed.classSlug.toUpperCase()}` : "—"}</strong>
                <small>
                  {mostAccessed
                    ? `${fmtInt(mostAccessed.opened)} opens · ${mostAccessed.title}`
                    : "No access data yet"}
                </small>
              </div>
              <div>
                <span>Least accessed</span>
                <strong>{leastAccessed ? `Class ${leastAccessed.classSlug.toUpperCase()}` : "—"}</strong>
                <small>
                  {leastAccessed
                    ? `${fmtInt(leastAccessed.opened)} opens · ${leastAccessed.title}`
                    : "No access data yet"}
                </small>
              </div>
              <div>
                <span>Failed attempts</span>
                <strong>{fmtInt(materials.totalFailed)}</strong>
                <small>Logged after a validation or delivery failure</small>
              </div>
            </div>
          )}
        </Panel>

        <Panel
          icon={<Mail size={18} />}
          title="Best performing email"
          subtitle="The sent campaign with the most unique opens."
          state={sourceState(campaigns.connected, campaigns.error)}
          action={<CardLink href="/tracking/email">All campaigns</CardLink>}
        >
          {!campaignsOk ? (
            <EmptySource
              title="Campaign reporting is not available"
              hint="Sent-email performance appears once Mailchimp reporting is connected."
            />
          ) : (
            <>
              <div className={styles.emailLeader}>
                <span className={styles.leaderIcon}>
                  <Mail size={20} />
                </span>
                <div>
                  <strong>{topCampaign?.title ?? "No sent campaigns yet"}</strong>
                  <p>
                    {topCampaign
                      ? `${fmtInt(topCampaign.opens)} unique opens · ${fmtPct(topCampaign.openRate)} open rate`
                      : "Mailchimp report data will appear here."}
                  </p>
                  {topCampaign ? (
                    <CardLink href={`/tracking/email/${topCampaign.id}`}>Open this report</CardLink>
                  ) : null}
                </div>
              </div>
              <div className={styles.miniStats}>
                <span>
                  <strong>{fmtInt(campaigns.totalCampaigns)}</strong>sent campaigns
                </span>
                <span>
                  <strong>{fmtInt(campaigns.totalClicks)}</strong>unique clicks
                </span>
              </div>
            </>
          )}
        </Panel>
      </section>

      <section className={styles.sourceStrip}>
        <div className={styles.sourceStripHead}>
          <h2>Data sources</h2>
          <CardLink href="/tracking/sources">Details</CardLink>
        </div>
        <div className={styles.sourceStripRow}>
          {sources.map((source) => (
            <span key={source.label} className={styles.sourceChip}>
              {source.label}
              <SourceBadge state={source.state} />
            </span>
          ))}
        </div>
      </section>
    </>
  );
}

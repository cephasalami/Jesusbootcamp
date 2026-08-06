import Link from "next/link";
import { ArrowUpRight, Mail, MousePointer2, Send, Users } from "lucide-react";
import { readMailchimpCampaignMetrics } from "@/lib/tracking/mailchimp-campaign-metrics";
import { readMailchimpMetrics } from "@/lib/tracking/mailchimp-metrics";
import {
  EmptySource,
  ErrorBanner,
  MetricCard,
  Panel,
  ScreenHeader,
  SourceBadge,
  TableCard,
  sourceState,
  unavailableDetail,
} from "../../ui";
import { fmtDate, fmtInt, fmtPct, fmtWhen, share } from "../../format";
import styles from "../../tracking.module.css";

export const dynamic = "force-dynamic";

const PER_PAGE = 50;

/**
 * Smallest send that can win or lose the best/worst panels. Without a floor a
 * one-recipient test send scores 100% and permanently owns "best open rate",
 * which is true but useless — and reads as a broken statistic.
 */
const MIN_SEND_FOR_RANKING = 50;

type Campaign = Awaited<ReturnType<typeof readMailchimpCampaignMetrics>>["campaigns"][number];

const SORTS = {
  sent: { label: "Newest", compare: (a: Campaign, b: Campaign) => (b.sentAt ?? 0) - (a.sentAt ?? 0) },
  opens: { label: "Most opens", compare: (a: Campaign, b: Campaign) => b.opens - a.opens },
  openRate: { label: "Open rate", compare: (a: Campaign, b: Campaign) => b.openRate - a.openRate },
  clicks: { label: "Most clicks", compare: (a: Campaign, b: Campaign) => b.clicks - a.clicks },
  recipients: {
    label: "Largest send",
    compare: (a: Campaign, b: Campaign) => b.emailsSent - a.emailsSent,
  },
} as const;

type SortKey = keyof typeof SORTS;

function isSortKey(value: unknown): value is SortKey {
  return typeof value === "string" && value in SORTS;
}

export default async function EmailScreen(props: PageProps<"/tracking/email">) {
  const params = await props.searchParams;
  const sort: SortKey = isSortKey(params.sort) ? params.sort : "sent";
  const requestedPage = Number.parseInt(String(params.page ?? "1"), 10);

  const [reports, audience] = await Promise.all([
    readMailchimpCampaignMetrics(),
    readMailchimpMetrics(),
  ]);

  const state = sourceState(reports.connected, reports.error);

  const sorted = [...reports.campaigns].sort(SORTS[sort].compare);
  const pageCount = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const page = Math.min(Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1), pageCount);
  const visible = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Weighted across every send — not an average of averages, which would let a
  // 12-recipient test email swing the number as hard as a 2,000-person send.
  const weightedOpenRate = share(reports.totalOpens, reports.totalRecipients);
  const weightedClickRate = share(reports.totalClicks, reports.totalRecipients);

  const rankable = reports.campaigns.filter((c) => c.emailsSent >= MIN_SEND_FOR_RANKING);
  const best = [...rankable].sort((a, b) => b.openRate - a.openRate)[0] ?? null;
  const worst = [...rankable].sort((a, b) => a.openRate - b.openRate)[0] ?? null;

  const link = (next: { sort?: SortKey; page?: number }) => {
    const query = new URLSearchParams();
    const nextSort = next.sort ?? sort;
    const nextPage = next.page ?? 1;
    if (nextSort !== "sent") query.set("sort", nextSort);
    if (nextPage > 1) query.set("page", String(nextPage));
    const qs = query.toString();
    return qs ? `/tracking/email?${qs}` : "/tracking/email";
  };

  return (
    <>
      <ScreenHeader
        eyebrow="Email performance"
        title="Sent campaign reports"
        subtitle="Live Mailchimp report data for every campaign this audience has been sent, cached server-side for 15 minutes."
        meta={
          <>
            <SourceBadge state={state} />
            <span>{reports.cachedAt ? `Report cache refreshed ${fmtWhen(reports.cachedAt)}` : "Refreshing report cache"}</span>
            {audience.connected && !audience.error && audience.lastCampaignSentAt ? (
              <span>Last send {fmtWhen(audience.lastCampaignSentAt)}</span>
            ) : null}
          </>
        }
      />

      {!reports.connected ? (
        <EmptySource
          title="Mailchimp campaign reporting is not connected"
          hint={
            <>
              Set <code>MAILCHIMP_API_KEY</code>, <code>MAILCHIMP_API_SERVER</code> and{" "}
              <code>MAILCHIMP_AUDIENCE_ID</code>.
            </>
          }
        />
      ) : reports.error ? (
        <ErrorBanner label="Mailchimp campaign report error" message={reports.error} />
      ) : (
        <>
          <section className={styles.overviewGrid} aria-label="Email totals">
            <MetricCard
              icon={<Send size={16} />}
              label="Sent campaigns"
              value={fmtInt(reports.totalCampaigns)}
              detail={`${fmtInt(reports.totalRecipients)} emails delivered in total`}
              accent
            />
            <MetricCard
              icon={<Mail size={16} />}
              label="Unique opens"
              value={fmtInt(reports.totalOpens)}
              detail={
                weightedOpenRate == null
                  ? "No sends recorded"
                  : `${fmtPct(weightedOpenRate)} of all emails delivered`
              }
            />
            <MetricCard
              icon={<MousePointer2 size={16} />}
              label="Unique clicks"
              value={fmtInt(reports.totalClicks)}
              detail={
                weightedClickRate == null
                  ? "No sends recorded"
                  : `${fmtPct(weightedClickRate)} of all emails delivered`
              }
            />
            <MetricCard
              icon={<Users size={16} />}
              label="Audience open rate"
              value={
                audience.connected && !audience.error ? fmtPct(audience.avgOpenRate) : "—"
              }
              detail={
                audience.connected && !audience.error
                  ? `Mailchimp's own list average · ${fmtPct(audience.avgClickRate)} click rate`
                  : unavailableDetail(audience, "Mailchimp audience")
              }
              muted={!(audience.connected && !audience.error)}
              href="/tracking/audience"
            />
          </section>

          <section className={styles.overviewSplit}>
            <Panel
              icon={<Mail size={18} />}
              title="Best open rate"
              subtitle={`The campaign that landed hardest, among sends of at least ${MIN_SEND_FOR_RANKING} recipients.`}
              state={state}
            >
              {best ? (
                <div className={styles.emailLeader}>
                  <span className={styles.leaderIcon}>
                    <Mail size={20} />
                  </span>
                  <div>
                    <strong>{best.title}</strong>
                    <p>
                      {fmtPct(best.openRate)} open rate · {fmtInt(best.opens)} unique opens of{" "}
                      {fmtInt(best.emailsSent)} sent · {fmtDate(best.sentAt)}
                    </p>
                    <Link className={styles.cardLink} href={`/tracking/email/${best.id}`}>
                      Open this report <ArrowUpRight size={13} />
                    </Link>
                  </div>
                </div>
              ) : (
                <EmptySource title="No sent campaigns yet" hint="Reports appear here after the first send." />
              )}
            </Panel>

            <Panel
              icon={<Mail size={18} />}
              title="Lowest open rate"
              subtitle={`Worth a look — subject line, send time or list segment. Sends under ${MIN_SEND_FOR_RANKING} recipients are excluded.`}
              state={state}
            >
              {worst ? (
                <div className={styles.emailLeader}>
                  <span className={`${styles.leaderIcon} ${styles.leaderIconWarn}`}>
                    <Mail size={20} />
                  </span>
                  <div>
                    <strong>{worst.title}</strong>
                    <p>
                      {fmtPct(worst.openRate)} open rate · {fmtInt(worst.opens)} unique opens of{" "}
                      {fmtInt(worst.emailsSent)} sent · {fmtDate(worst.sentAt)}
                    </p>
                    <Link className={styles.cardLink} href={`/tracking/email/${worst.id}`}>
                      Open this report <ArrowUpRight size={13} />
                    </Link>
                  </div>
                </div>
              ) : (
                <EmptySource title="No sent campaigns yet" hint="Reports appear here after the first send." />
              )}
            </Panel>
          </section>

          <Panel
            icon={<Send size={18} />}
            title="All campaigns"
            subtitle="Select any campaign to open its full report, including bounces, unsubscribes and the links people clicked."
            state={state}
            wide
          >
            <div className={styles.filterBar} role="group" aria-label="Sort campaigns">
              {(Object.keys(SORTS) as SortKey[]).map((key) => (
                <Link
                  key={key}
                  href={link({ sort: key, page: 1 })}
                  className={key === sort ? styles.chipActive : styles.chip}
                  aria-current={key === sort ? "true" : undefined}
                >
                  {SORTS[key].label}
                </Link>
              ))}
            </div>

            <TableCard
              meta={
                <>
                  <span>
                    Showing {fmtInt(visible.length)} of {fmtInt(sorted.length)} campaigns
                  </span>
                  <span>
                    Page {page} of {pageCount}
                  </span>
                </>
              }
              tall
            >
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Sent</th>
                    <th className={styles.num}>Recipients</th>
                    <th className={styles.num}>Opens</th>
                    <th className={styles.num}>Open rate</th>
                    <th className={styles.num}>Clicks</th>
                    <th className={styles.num}>Click rate</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 ? (
                    <tr>
                      <td colSpan={7} className={styles.emptyCell}>
                        No sent Mailchimp campaigns found yet.
                      </td>
                    </tr>
                  ) : (
                    visible.map((campaign) => (
                      <tr key={campaign.id}>
                        <td className={styles.campaignName}>
                          <Link className={styles.rowLink} href={`/tracking/email/${campaign.id}`}>
                            {campaign.title}
                          </Link>
                        </td>
                        <td>{fmtDate(campaign.sentAt)}</td>
                        <td className={styles.num}>{fmtInt(campaign.emailsSent)}</td>
                        <td className={styles.num}>{fmtInt(campaign.opens)}</td>
                        <td className={styles.num}>{fmtPct(campaign.openRate)}</td>
                        <td className={styles.num}>{fmtInt(campaign.clicks)}</td>
                        <td className={styles.num}>{fmtPct(campaign.clickRate)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </TableCard>

            {pageCount > 1 ? (
              <nav className={styles.pager} aria-label="Campaign pages">
                <Link
                  className={page > 1 ? styles.chip : styles.chipDisabled}
                  href={link({ page: Math.max(1, page - 1) })}
                  aria-disabled={page === 1}
                >
                  ← Newer
                </Link>
                <span>
                  Page {page} of {pageCount}
                </span>
                <Link
                  className={page < pageCount ? styles.chip : styles.chipDisabled}
                  href={link({ page: Math.min(pageCount, page + 1) })}
                  aria-disabled={page === pageCount}
                >
                  Older →
                </Link>
              </nav>
            ) : null}
          </Panel>
        </>
      )}
    </>
  );
}

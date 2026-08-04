import { Link2, Mail, MousePointer2, TriangleAlert, UserMinus } from "lucide-react";
import { readMailchimpCampaignDetail } from "@/lib/tracking/mailchimp-campaign-metrics";
import {
  BackLink,
  EmptySource,
  ErrorBanner,
  MetricCard,
  Panel,
  ScreenHeader,
  ShareBar,
  SourceBadge,
  StatGrid,
  TableCard,
  sourceState,
} from "../../../ui";
import { fmtDateTime, fmtInt, fmtPct, fmtWhen, share, tidyUrl } from "../../../format";
import styles from "../../../tracking.module.css";

export const dynamic = "force-dynamic";

export default async function CampaignDetailScreen(props: PageProps<"/tracking/email/[id]">) {
  const { id } = await props.params;
  const report = await readMailchimpCampaignDetail(id);
  const state = sourceState(report.connected, report.error);
  const campaign = report.campaign;

  const bounces = campaign ? campaign.hardBounces + campaign.softBounces + campaign.syntaxErrors : 0;
  const bounceRate = campaign ? share(bounces, campaign.emailsSent) : null;
  const unsubRate = campaign ? share(campaign.unsubscribed, campaign.emailsSent) : null;
  const maxLinkClicks = Math.max(1, ...report.links.map((link) => link.clicks));

  return (
    <>
      <BackLink href="/tracking/email" label="All campaigns" />
      <ScreenHeader
        eyebrow="Campaign report"
        title={campaign?.title ?? "Campaign report"}
        subtitle={
          campaign?.subject
            ? `Subject line: “${campaign.subject}”`
            : "Full Mailchimp report for this send."
        }
        meta={
          <>
            <SourceBadge state={state} />
            {campaign ? <span>Sent {fmtDateTime(campaign.sentAt)}</span> : null}
            {report.cachedAt ? <span>Cached {fmtWhen(report.cachedAt)}</span> : null}
          </>
        }
      />

      {!report.connected ? (
        <EmptySource
          title="Mailchimp campaign reporting is not connected"
          hint={
            <>
              Set <code>MAILCHIMP_API_KEY</code>, <code>MAILCHIMP_API_SERVER</code> and{" "}
              <code>MAILCHIMP_AUDIENCE_ID</code>.
            </>
          }
        />
      ) : report.error ? (
        <ErrorBanner label="Mailchimp report error" message={report.error} />
      ) : !campaign ? (
        <EmptySource title="No report for this campaign" hint="Mailchimp returned no data for this id." />
      ) : (
        <>
          <section className={styles.overviewGrid} aria-label="Campaign headline metrics">
            <MetricCard
              icon={<Mail size={16} />}
              label="Unique opens"
              value={fmtInt(campaign.uniqueOpens)}
              detail={`${fmtPct(campaign.openRate)} of ${fmtInt(campaign.emailsSent)} delivered`}
              accent
            />
            <MetricCard
              icon={<MousePointer2 size={16} />}
              label="Subscribers who clicked"
              value={fmtInt(campaign.uniqueSubscriberClicks)}
              detail={
                campaign.clickToOpenRate == null
                  ? `${fmtPct(campaign.clickRate)} click rate`
                  : `${fmtPct(campaign.clickToOpenRate)} of openers clicked`
              }
            />
            <MetricCard
              icon={<UserMinus size={16} />}
              label="Unsubscribes"
              value={fmtInt(campaign.unsubscribed)}
              detail={unsubRate == null ? "No recipients" : `${fmtPct(unsubRate)} of this send`}
            />
            <MetricCard
              icon={<TriangleAlert size={16} />}
              label="Bounces"
              value={fmtInt(bounces)}
              detail={
                bounceRate == null
                  ? "No recipients"
                  : `${fmtPct(bounceRate)} of this send · ${fmtInt(campaign.hardBounces)} hard`
              }
            />
          </section>

          <Panel
            icon={<Mail size={18} />}
            title="Full delivery report"
            subtitle="Every figure Mailchimp exposes for this campaign."
            state={state}
            wide
          >
            <StatGrid
              items={[
                { label: "Emails delivered", value: fmtInt(campaign.emailsSent) },
                { label: "Total opens", value: fmtInt(campaign.opensTotal), hint: "Includes repeat opens" },
                { label: "Unique opens", value: fmtInt(campaign.uniqueOpens) },
                { label: "Open rate", value: fmtPct(campaign.openRate) },
                { label: "Last open", value: fmtWhen(campaign.lastOpenAt) },
                { label: "Total clicks", value: fmtInt(campaign.clicksTotal), hint: "Includes repeat clicks" },
                { label: "Unique clicks", value: fmtInt(campaign.uniqueClicks) },
                { label: "Click rate", value: fmtPct(campaign.clickRate) },
                { label: "Last click", value: fmtWhen(campaign.lastClickAt) },
                { label: "Hard bounces", value: fmtInt(campaign.hardBounces) },
                { label: "Soft bounces", value: fmtInt(campaign.softBounces) },
                { label: "Syntax errors", value: fmtInt(campaign.syntaxErrors) },
                { label: "Unsubscribed", value: fmtInt(campaign.unsubscribed) },
                { label: "Spam complaints", value: fmtInt(campaign.abuseReports) },
                { label: "Forwards", value: fmtInt(campaign.forwards) },
                { label: "Forward opens", value: fmtInt(campaign.forwardOpens) },
              ]}
            />
            {campaign.previewText ? (
              <p className={styles.footnote}>Preview text: “{campaign.previewText}”</p>
            ) : null}
          </Panel>

          <Panel
            icon={<Link2 size={18} />}
            title="Links people clicked"
            subtitle="Ranked by total clicks, with Mailchimp's tracking parameters stripped for readability."
            state={state}
            wide
          >
            {report.links.length === 0 ? (
              <EmptySource
                title="No link clicks recorded"
                hint="Either this campaign contained no tracked links, or nobody has clicked one yet."
              />
            ) : (
              <TableCard>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Link</th>
                      <th className={styles.num}>Clicks</th>
                      <th className={styles.num}>Unique</th>
                      <th className={styles.num}>Share</th>
                      <th>Relative</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.links.map((link) => (
                      <tr key={link.url}>
                        <td className={styles.linkCell} title={link.url}>
                          {tidyUrl(link.url)}
                        </td>
                        <td className={styles.num}>{fmtInt(link.clicks)}</td>
                        <td className={styles.num}>{fmtInt(link.uniqueClicks)}</td>
                        <td className={styles.num}>{fmtPct(link.clickPercentage, 1)}</td>
                        <td>
                          <ShareBar percent={(link.clicks / maxLinkClicks) * 100} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableCard>
            )}
          </Panel>
        </>
      )}
    </>
  );
}

import { Activity, MousePointer2, UserMinus, UserPlus, Users } from "lucide-react";
import { readMailchimpMetrics } from "@/lib/tracking/mailchimp-metrics";
import { readFirstParty } from "@/lib/tracking/events-store";
import {
  BarChart,
  EmptySource,
  ErrorBanner,
  MetricCard,
  Panel,
  ScreenHeader,
  ShareBar,
  SourceBadge,
  TableCard,
  sourceState,
} from "../../ui";
import { fmtDateTime, fmtInt, fmtPct, fmtWhen, share } from "../../format";
import styles from "../../tracking.module.css";

export const dynamic = "force-dynamic";

export default async function AudienceScreen() {
  const [audience, first] = await Promise.all([readMailchimpMetrics(), readFirstParty()]);

  const audienceState = sourceState(audience.connected, audience.error);
  const firstState = sourceState(first.connected, first.error);
  const audienceOk = audience.connected && !audience.error;
  const firstOk = first.connected && !first.error;

  const netGrowth = audience.newSignupsWindow - audience.newUnsubsWindow;
  const churn = share(audience.unsubscribeCount, audience.totalSubscribers + audience.unsubscribeCount);
  const maxEvent = Math.max(1, ...first.byEvent.map((event) => event.total));

  return (
    <>
      <ScreenHeader
        eyebrow="Audience"
        title="Who is joining, and what they do on the site"
        subtitle="Mailchimp is the source of truth for signups — every form on the site posts to it. The event table below is our own first-party collector."
        meta={
          <>
            <SourceBadge state={audienceState} />
            {audienceOk ? <span>Window: last {audience.windowDays} days</span> : null}
            {audienceOk && audience.lastCampaignSentAt ? (
              <span>Last campaign sent {fmtWhen(audience.lastCampaignSentAt)}</span>
            ) : null}
          </>
        }
      />

      {!audience.connected ? (
        <EmptySource
          title="Audience data is not connected"
          hint={
            <>
              Set <code>MAILCHIMP_API_KEY</code>, <code>MAILCHIMP_API_SERVER</code> and{" "}
              <code>MAILCHIMP_AUDIENCE_ID</code> to read real subscriber figures.
            </>
          }
        />
      ) : audience.error ? (
        <ErrorBanner label="Mailchimp audience error" message={audience.error} />
      ) : (
        <>
          <section className={styles.overviewGrid} aria-label="Audience totals">
            <MetricCard
              icon={<Users size={16} />}
              label="Subscribers"
              value={fmtInt(audience.totalSubscribers)}
              detail="Currently subscribed members"
              accent
            />
            <MetricCard
              icon={<UserPlus size={16} />}
              label="New signups"
              value={fmtInt(audience.newSignupsWindow)}
              detail={`Last ${audience.windowDays} days · net ${netGrowth >= 0 ? "+" : ""}${fmtInt(netGrowth)} after opt-outs`}
            />
            <MetricCard
              icon={<UserMinus size={16} />}
              label="Unsubscribed"
              value={fmtInt(audience.unsubscribeCount)}
              detail={
                churn == null
                  ? `${fmtInt(audience.newUnsubsWindow)} in the last ${audience.windowDays} days`
                  : `${fmtPct(churn, 1)} of everyone who ever joined · ${fmtInt(audience.newUnsubsWindow)} recently`
              }
            />
            <MetricCard
              icon={<Activity size={16} />}
              label="Cleaned addresses"
              value={fmtInt(audience.cleanedCount)}
              detail="Removed by Mailchimp after repeated hard bounces"
            />
          </section>

          <section className={styles.overviewSplit}>
            <Panel
              icon={<UserPlus size={18} />}
              title="Signups per day"
              subtitle={`Opt-ins reported by Mailchimp over the last ${audience.windowDays} days.`}
              state={audienceState}
            >
              <BarChart
                series={audience.series}
                label="Mailchimp signups per day"
                emptyLabel="No recent signup activity has been reported."
              />
            </Panel>

            <Panel
              icon={<UserMinus size={18} />}
              title="Opt-outs per day"
              subtitle="The same window, so a spike can be lined up against a send."
              state={audienceState}
            >
              <BarChart
                series={audience.unsubSeries}
                label="Mailchimp unsubscribes per day"
                emptyLabel="No opt-outs reported in this window."
              />
            </Panel>
          </section>

          <Panel
            icon={<Users size={18} />}
            title="Newest members"
            subtitle="The most recent opt-ins, newest first, straight from the audience."
            state={audienceState}
            wide
          >
            {audience.recent.length === 0 ? (
              <EmptySource title="No recent signups" hint="New members appear here as soon as a form is submitted." />
            ) : (
              <TableCard>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Joined</th>
                      <th>Status</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audience.recent.map((member) => (
                      <tr key={`${member.email}-${member.ms}`}>
                        <td>{member.email}</td>
                        <td title={fmtDateTime(member.ms)}>{fmtWhen(member.ms)}</td>
                        <td>
                          <span
                            className={member.status === "subscribed" ? styles.pillOk : styles.pillMuted}
                          >
                            {member.status ?? "unknown"}
                          </span>
                        </td>
                        <td>{member.source || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableCard>
            )}
          </Panel>
        </>
      )}

      <Panel
        icon={<MousePointer2 size={18} />}
        title="First-party events"
        subtitle="Every event name our own collector has recorded, all-time. These mirror what the Meta pixel receives, without depending on Meta."
        state={firstState}
        wide
      >
        {!first.connected ? (
          <EmptySource
            title="First-party events are not connected"
            hint={
              <>
                Set <code>UPSTASH_REDIS_REST_URL</code> and <code>UPSTASH_REDIS_REST_TOKEN</code> to
                collect page views and button clicks.
              </>
            }
          />
        ) : first.error ? (
          <ErrorBanner label="Event store error" message={first.error} />
        ) : (
          <>
            <div className={styles.activityFigures}>
              <strong>{fmtInt(first.totalEvents)}</strong>
              <span>tracked events all-time across {fmtInt(first.byEvent.length)} event types</span>
            </div>
            <BarChart
              series={first.series}
              label="First-party events per day"
              emptyLabel="No first-party activity has been recorded yet."
            />
            {first.byEvent.length === 0 ? null : (
              <TableCard>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th className={styles.num}>Total</th>
                      <th className={styles.num}>Share</th>
                      <th>Relative</th>
                    </tr>
                  </thead>
                  <tbody>
                    {first.byEvent.map((event) => {
                      const pct = share(event.total, first.totalEvents);
                      return (
                        <tr key={event.name}>
                          <td>
                            <strong>{event.name}</strong>
                          </td>
                          <td className={styles.num}>{fmtInt(event.total)}</td>
                          <td className={styles.num}>{pct == null ? "—" : fmtPct(pct, 1)}</td>
                          <td>
                            <ShareBar percent={(event.total / maxEvent) * 100} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </TableCard>
            )}
          </>
        )}
      </Panel>

      {firstOk && audienceOk ? (
        <p className={styles.footnote}>
          Mailchimp counts a signup once per member; the <code>Lead</code> event above counts every form
          submit, including repeat submissions from the same person. The two are expected to differ.
        </p>
      ) : null}
    </>
  );
}

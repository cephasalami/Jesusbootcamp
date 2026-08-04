import Link from "next/link";
import { BookOpen, CircleAlert, Layers, Users } from "lucide-react";
import {
  readMaterialAccessActivity,
  readMaterialAccessMetrics,
  type MaterialAccessFormat,
} from "@/lib/tracking/material-access";
import { getManifest } from "@/lib/manifest";
import {
  EmptySource,
  ErrorBanner,
  MetricCard,
  Panel,
  ScreenHeader,
  ShareBar,
  SourceBadge,
  StackedBarChart,
  TableCard,
  sourceState,
} from "../../ui";
import { fmtInt, fmtPct, fmtWhen, materialFormatLabel, share } from "../../format";
import styles from "../../tracking.module.css";

export const dynamic = "force-dynamic";

export default async function CourseAccessScreen() {
  const [materials, activity, classes] = await Promise.all([
    readMaterialAccessMetrics(),
    readMaterialAccessActivity({ limit: 30 }),
    getManifest(),
  ]);

  const state = sourceState(materials.connected, materials.error);
  const classTitles = new Map(classes.map((klass) => [klass.slug, klass.title]));

  const rows = materials.byClass
    .map((klass) => {
      const opened = klass.formats.reduce((sum, format) => sum + format.opened, 0);
      const failed = klass.formats.reduce((sum, format) => sum + format.failed, 0);
      return {
        slug: klass.classSlug,
        title: classTitles.get(klass.classSlug) ?? "Not in the current manifest",
        formats: klass.formats.length,
        opened,
        failed,
        successRate: share(opened, opened + failed),
      };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug, undefined, { numeric: true }));

  const maxOpened = Math.max(1, ...rows.map((row) => row.opened));
  const totalAttempts = materials.totalOpened + materials.totalFailed;
  const successRate = share(materials.totalOpened, totalAttempts);

  // Format mix across every class — which delivery format the audience prefers.
  const byFormat = new Map<MaterialAccessFormat, { opened: number; failed: number }>();
  for (const klass of materials.byClass) {
    for (const format of klass.formats) {
      const entry = byFormat.get(format.format) ?? { opened: 0, failed: 0 };
      entry.opened += format.opened;
      entry.failed += format.failed;
      byFormat.set(format.format, entry);
    }
  }
  const formatRows = Array.from(byFormat, ([format, counts]) => ({ format, ...counts })).sort(
    (a, b) => b.opened - a.opened
  );

  return (
    <>
      <ScreenHeader
        eyebrow="Course access"
        title="Who is opening the classes"
        subtitle="Every successful and failed learner access attempt, logged when a class material is opened or downloaded."
        meta={
          <>
            <SourceBadge state={state} />
            {activity.connected && !activity.error ? (
              <span>
                Activity log holds {fmtInt(activity.matched)} recent events
                {activity.capped ? " (at its 2,000-record cap)" : ""}
              </span>
            ) : null}
          </>
        }
      />

      {!materials.connected ? (
        <EmptySource
          title="Material logging needs the existing KV store"
          hint={
            <>
              Set <code>UPSTASH_REDIS_REST_URL</code> and <code>UPSTASH_REDIS_REST_TOKEN</code> (or
              Vercel&apos;s <code>KV_REST_API_*</code> values).
            </>
          }
        />
      ) : materials.error ? (
        <ErrorBanner label="Course access log error" message={materials.error} />
      ) : (
        <>
          <section className={styles.overviewGrid} aria-label="Course access totals">
            <MetricCard
              icon={<BookOpen size={16} />}
              label="Successful opens"
              value={fmtInt(materials.totalOpened)}
              detail="All-time, across every class and format"
              accent
            />
            <MetricCard
              icon={<CircleAlert size={16} />}
              label="Failed attempts"
              value={fmtInt(materials.totalFailed)}
              detail={
                successRate == null
                  ? "No attempts recorded yet"
                  : `${fmtPct(successRate, 1)} of attempts succeeded`
              }
            />
            <MetricCard
              icon={<Users size={16} />}
              label="Distinct learners"
              value={activity.connected && !activity.error ? fmtInt(activity.uniqueLearners) : "—"}
              detail={
                activity.connected && !activity.error
                  ? "Unique people in the recent activity log"
                  : "Activity log unavailable"
              }
              muted={!(activity.connected && !activity.error)}
            />
            <MetricCard
              icon={<Layers size={16} />}
              label="Classes with activity"
              value={fmtInt(rows.length)}
              detail={`${fmtInt(classes.length)} classes in the manifest`}
            />
          </section>

          <Panel
            icon={<BookOpen size={18} />}
            title="Class by class"
            subtitle="Open a class to see its formats, timeline and recent activity."
            state={state}
            wide
          >
            <TableCard
              meta={
                <>
                  <span>{fmtInt(materials.totalOpened)} opens</span>
                  <span>{fmtInt(materials.totalFailed)} failures</span>
                  <span>{fmtInt(rows.length)} classes</span>
                </>
              }
              tall
            >
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Class</th>
                    <th className={styles.num}>Formats</th>
                    <th className={styles.num}>Opened</th>
                    <th className={styles.num}>Failed</th>
                    <th className={styles.num}>Success</th>
                    <th>Share of opens</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={styles.emptyCell}>
                        No course material access has been recorded yet.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.slug}>
                        <td>
                          <Link className={styles.rowLink} href={`/tracking/course/${row.slug}`}>
                            <strong>Class {row.slug.toUpperCase()}</strong>
                            <small>{row.title}</small>
                          </Link>
                        </td>
                        <td className={styles.num}>{fmtInt(row.formats)}</td>
                        <td className={styles.num}>{fmtInt(row.opened)}</td>
                        <td className={styles.num}>{fmtInt(row.failed)}</td>
                        <td className={styles.num}>
                          {row.successRate == null ? "—" : fmtPct(row.successRate, 0)}
                        </td>
                        <td>
                          <ShareBar percent={(row.opened / maxOpened) * 100} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </TableCard>
          </Panel>

          <section className={styles.overviewSplit}>
            <Panel
              icon={<Layers size={18} />}
              title="Format preference"
              subtitle="Which delivery format learners choose across all classes."
              state={state}
            >
              {formatRows.length === 0 ? (
                <EmptySource title="No formats opened yet" hint="Format preference appears after the first class material is opened." />
              ) : (
                <table className={`${styles.table} ${styles.compactTable}`}>
                  <thead>
                    <tr>
                      <th>Format</th>
                      <th className={styles.num}>Opened</th>
                      <th className={styles.num}>Failed</th>
                      <th className={styles.num}>Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formatRows.map((row) => {
                      const pct = share(row.opened, materials.totalOpened);
                      return (
                        <tr key={row.format}>
                          <td>{materialFormatLabel(row.format)}</td>
                          <td className={styles.num}>{fmtInt(row.opened)}</td>
                          <td className={styles.num}>{fmtInt(row.failed)}</td>
                          <td className={styles.num}>{pct == null ? "—" : fmtPct(pct, 1)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </Panel>

            <Panel
              icon={<BookOpen size={18} />}
              title="Access over time"
              subtitle={`Opens and failures per day over the last ${activity.windowDays} days.`}
              state={sourceState(activity.connected, activity.error)}
            >
              {activity.error ? (
                <ErrorBanner label="Activity log error" message={activity.error} />
              ) : (
                <StackedBarChart
                  series={activity.series}
                  label="Course material access per day"
                  emptyLabel="No access events in the recent window."
                />
              )}
            </Panel>
          </section>

          <Panel
            icon={<Users size={18} />}
            title="Recent activity"
            subtitle="The newest access attempts. Learners are shown as a one-way hash — no email or name is ever stored in this log."
            state={sourceState(activity.connected, activity.error)}
            wide
          >
            {activity.error ? (
              <ErrorBanner label="Activity log error" message={activity.error} />
            ) : activity.events.length === 0 ? (
              <EmptySource
                title="No recent access events"
                hint="Each time a learner opens a class material it will appear here within seconds."
              />
            ) : (
              <TableCard>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Class</th>
                      <th>Material</th>
                      <th>Learner</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activity.events.map((event, index) => (
                      <tr key={`${event.timestamp}-${event.learner}-${index}`}>
                        <td>{fmtWhen(event.timestamp)}</td>
                        <td>
                          <Link className={styles.rowLink} href={`/tracking/course/${event.classSlug}`}>
                            Class {event.classSlug.toUpperCase()}
                          </Link>
                        </td>
                        <td>{materialFormatLabel(event.format)}</td>
                        <td className={styles.mono}>{event.learner}</td>
                        <td>
                          <span className={event.success ? styles.pillOk : styles.pillBad}>
                            {event.success ? "Opened" : "Failed"}
                          </span>
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

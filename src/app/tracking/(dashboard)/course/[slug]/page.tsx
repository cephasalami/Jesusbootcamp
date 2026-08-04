import { notFound } from "next/navigation";
import { BookOpen, CircleAlert, Layers, Users } from "lucide-react";
import {
  MATERIAL_ACCESS_FORMATS,
  readMaterialAccessActivity,
  readMaterialAccessMetrics,
  type MaterialAccessFormat,
} from "@/lib/tracking/material-access";
import { getManifest } from "@/lib/manifest";
import { FREE_THROUGH_SEQUENCE, type FormatKey } from "@/lib/access";
import {
  BackLink,
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
} from "../../../ui";
import { fmtInt, fmtPct, fmtWhen, materialFormatLabel, share } from "../../../format";
import styles from "../../../tracking.module.css";

export const dynamic = "force-dynamic";

export default async function ClassDetailScreen(props: PageProps<"/tracking/course/[slug]">) {
  const { slug } = await props.params;

  const [materials, activity, classes] = await Promise.all([
    readMaterialAccessMetrics(),
    readMaterialAccessActivity({ classSlug: slug, limit: 40 }),
    getManifest(),
  ]);

  const klass = classes.find((entry) => entry.slug === slug) ?? null;
  const counters = materials.byClass.find((entry) => entry.classSlug === slug) ?? null;

  // A slug that is in neither the manifest nor the access log is a bad URL — but
  // only conclude that when both sources actually answered. A Sheets or KV
  // outage must never turn a real class into a 404.
  const manifestLoaded = classes.length > 0;
  const logLoaded = materials.connected && !materials.error;
  if (manifestLoaded && logLoaded && !klass && !counters) notFound();

  const state = sourceState(materials.connected, materials.error);
  const counted = new Map<MaterialAccessFormat, { opened: number; failed: number }>(
    (counters?.formats ?? []).map((format) => [
      format.format,
      { opened: format.opened, failed: format.failed },
    ])
  );

  // Show every format the class actually offers, plus anything the log has seen,
  // so a format with traffic but no manifest entry can never hide.
  const offered = new Set<MaterialAccessFormat>();
  for (const format of MATERIAL_ACCESS_FORMATS) {
    const inManifest =
      format === "quiz" ? Boolean(klass?.quizUrl) : Boolean(klass?.files?.[format as FormatKey]);
    if (inManifest || counted.has(format)) offered.add(format);
  }

  const formatRows = Array.from(offered, (format) => {
    const counts = counted.get(format) ?? { opened: 0, failed: 0 };
    const published =
      format === "quiz" ? Boolean(klass?.quizUrl) : Boolean(klass?.files?.[format as FormatKey]);
    return {
      format,
      published,
      opened: counts.opened,
      failed: counts.failed,
      successRate: share(counts.opened, counts.opened + counts.failed),
    };
  }).sort((a, b) => b.opened - a.opened);

  const opened = formatRows.reduce((sum, row) => sum + row.opened, 0);
  const failed = formatRows.reduce((sum, row) => sum + row.failed, 0);
  const maxOpened = Math.max(1, ...formatRows.map((row) => row.opened));
  const successRate = share(opened, opened + failed);
  const shareOfCourse = share(opened, materials.totalOpened);
  const partnerGated = klass ? klass.sequencePosition > FREE_THROUGH_SEQUENCE : null;

  return (
    <>
      <BackLink href="/tracking/course" label="All classes" />
      <ScreenHeader
        eyebrow={`Class ${slug.toUpperCase()}`}
        title={klass?.title ?? `Class ${slug.toUpperCase()}`}
        subtitle={
          klass
            ? `Release position ${klass.sequencePosition} in the drip sequence. ${
                partnerGated
                  ? "Non-PDF formats sit behind the partner gate."
                  : "Fully open to every subscriber."
              }`
            : "This class slug appears in the access log but is not in the current manifest."
        }
        meta={
          <>
            <SourceBadge state={state} />
            {shareOfCourse != null ? <span>{fmtPct(shareOfCourse, 1)} of all course opens</span> : null}
          </>
        }
      />

      {!materials.connected ? (
        <EmptySource
          title="Course access log is not connected"
          hint="Per-class engagement appears once the KV credentials are set."
        />
      ) : materials.error ? (
        <ErrorBanner label="Course access log error" message={materials.error} />
      ) : (
        <>
          <section className={styles.overviewGrid} aria-label="Class totals">
            <MetricCard
              icon={<BookOpen size={16} />}
              label="Opens"
              value={fmtInt(opened)}
              detail="Successful opens and downloads for this class"
              accent
            />
            <MetricCard
              icon={<CircleAlert size={16} />}
              label="Failed attempts"
              value={fmtInt(failed)}
              detail={successRate == null ? "No attempts yet" : `${fmtPct(successRate, 1)} succeeded`}
            />
            <MetricCard
              icon={<Users size={16} />}
              label="Distinct learners"
              value={activity.connected && !activity.error ? fmtInt(activity.uniqueLearners) : "—"}
              detail={
                activity.connected && !activity.error
                  ? `In the last ${fmtInt(activity.matched)} logged events for this class`
                  : "Activity log unavailable"
              }
              muted={!(activity.connected && !activity.error)}
            />
            <MetricCard
              icon={<Layers size={16} />}
              label="Formats published"
              value={fmtInt(formatRows.filter((row) => row.published).length)}
              detail={klass ? "Live file links in the manifest" : "Class is not in the manifest"}
              muted={!klass}
            />
          </section>

          <Panel
            icon={<Layers size={18} />}
            title="Format breakdown"
            subtitle="Every format this class publishes, and what learners did with it."
            state={state}
            wide
          >
            {formatRows.length === 0 ? (
              <EmptySource
                title="No formats recorded"
                hint="This class has no published materials and no logged access attempts."
              />
            ) : (
              <TableCard>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Material</th>
                      <th>Published</th>
                      <th className={styles.num}>Opened</th>
                      <th className={styles.num}>Failed</th>
                      <th className={styles.num}>Success</th>
                      <th>Share within class</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formatRows.map((row) => (
                      <tr key={row.format}>
                        <td>
                          <strong>{materialFormatLabel(row.format)}</strong>
                        </td>
                        <td>
                          <span className={row.published ? styles.pillOk : styles.pillMuted}>
                            {row.published ? "Live" : "Not in manifest"}
                          </span>
                        </td>
                        <td className={styles.num}>{fmtInt(row.opened)}</td>
                        <td className={styles.num}>{fmtInt(row.failed)}</td>
                        <td className={styles.num}>
                          {row.successRate == null ? "—" : fmtPct(row.successRate, 0)}
                        </td>
                        <td>
                          <ShareBar percent={(row.opened / maxOpened) * 100} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableCard>
            )}
          </Panel>

          <Panel
            icon={<BookOpen size={18} />}
            title="Access over time"
            subtitle={`Opens and failures for this class over the last ${activity.windowDays} days.`}
            state={sourceState(activity.connected, activity.error)}
            wide
          >
            {activity.error ? (
              <ErrorBanner label="Activity log error" message={activity.error} />
            ) : (
              <StackedBarChart
                series={activity.series}
                label={`Access to class ${slug} per day`}
                emptyLabel="No access events for this class in the recent window."
              />
            )}
          </Panel>

          <Panel
            icon={<Users size={18} />}
            title="Recent activity"
            subtitle="Newest attempts first. Learners appear as a one-way hash — this log never stores an email or name."
            state={sourceState(activity.connected, activity.error)}
            wide
          >
            {activity.error ? (
              <ErrorBanner label="Activity log error" message={activity.error} />
            ) : activity.events.length === 0 ? (
              <EmptySource
                title="No recent events for this class"
                hint="The log keeps the newest 2,000 events across all classes, so older activity may have rolled off."
              />
            ) : (
              <TableCard>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Material</th>
                      <th>Learner</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activity.events.map((event, index) => (
                      <tr key={`${event.timestamp}-${event.learner}-${index}`}>
                        <td>{fmtWhen(event.timestamp)}</td>
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

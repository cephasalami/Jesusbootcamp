// Presentational building blocks shared by every /tracking screen.
//
// Rule for this whole folder: a component never invents a number. When a source
// is unavailable it renders a "Not connected" state with the setup hint instead
// of a placeholder value, so nothing on screen can be mistaken for real data.

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { fmtDayLabel, fmtInt } from "./format";
import styles from "./tracking.module.css";

export type SourceState = "live" | "off" | "err";

export function sourceState(connected: boolean, error?: string): SourceState {
  return !connected ? "off" : error ? "err" : "live";
}

/**
 * Why a card has no number. "Not connected" and "failing right now" are very
 * different situations for whoever is reading the dashboard — the first is a
 * setup task, the second is an outage — so never describe one as the other.
 */
export function unavailableDetail(
  source: { connected: boolean; error?: string },
  label: string
): string {
  return source.error ? `${label} is not responding right now` : `${label} not connected`;
}

export function SourceBadge({ state }: { state: SourceState }) {
  const label = state === "live" ? "Live" : state === "err" ? "Needs attention" : "Not connected";
  return <span className={`${styles.sourceBadge} ${styles[`source${state}`]}`}>{label}</span>;
}

/** The title block at the top of a screen. */
export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  meta,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  meta?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className={styles.screenHeader}>
      <div className={styles.screenHeaderCopy}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1>{title}</h1>
        <p className={styles.screenSubtitle}>{subtitle}</p>
        {meta ? <div className={styles.screenMeta}>{meta}</div> : null}
      </div>
      {children ? <div className={styles.screenHeaderAside}>{children}</div> : null}
    </header>
  );
}

/** Breadcrumb-style back link used on the drill-down screens. */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link className={styles.backLink} href={href}>
      ← {label}
    </Link>
  );
}

export function MetricCard({
  icon,
  label,
  value,
  detail,
  muted = false,
  accent = false,
  href,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  muted?: boolean;
  accent?: boolean;
  /** When set the whole card becomes a link into the screen that explains it. */
  href?: string;
}) {
  const body = (
    <>
      <div className={styles.metricHead}>
        {icon ? <span className={styles.metricIcon}>{icon}</span> : null}
        <span className={styles.metricLabel}>{label}</span>
        {href ? <ArrowUpRight className={styles.metricGo} size={14} /> : null}
      </div>
      <strong className={`${styles.metricValue} ${muted ? styles.metricMuted : ""}`}>{value}</strong>
      <span className={styles.metricDetail}>{detail}</span>
    </>
  );

  const className = `${styles.metricCard} ${accent ? styles.metricCardAccent : ""} ${
    href ? styles.metricCardLink : ""
  }`;

  return href ? (
    <Link className={className} href={href}>
      {body}
    </Link>
  ) : (
    <article className={className}>{body}</article>
  );
}

export function SectionHeading({
  icon,
  title,
  subtitle,
  state,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle: string;
  state?: SourceState;
  action?: React.ReactNode;
}) {
  return (
    <div className={styles.sectionHeading}>
      {icon ? <span className={styles.sectionIcon}>{icon}</span> : null}
      <div className={styles.sectionHeadingCopy}>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {action}
      {state ? <SourceBadge state={state} /> : null}
    </div>
  );
}

export function EmptySource({ title, hint }: { title: string; hint: React.ReactNode }) {
  return (
    <div className={styles.emptySource}>
      <strong>{title}</strong>
      <p>{hint}</p>
    </div>
  );
}

export function ErrorBanner({ label, message }: { label: string; message: string }) {
  return (
    <p className={styles.errorBanner}>
      {label}: {message}
    </p>
  );
}

/** A rounded surface with a heading — the standard container on every screen. */
export function Panel({
  title,
  subtitle,
  state,
  action,
  icon,
  children,
  wide = false,
}: {
  title: string;
  subtitle: string;
  state?: SourceState;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <section className={`${styles.dataCard} ${wide ? styles.dataCardWide : ""}`}>
      <SectionHeading icon={icon} title={title} subtitle={subtitle} state={state} action={action} />
      {children}
    </section>
  );
}

export function CardLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link className={styles.cardLink} href={href}>
      {children} <ArrowUpRight size={13} />
    </Link>
  );
}

/**
 * A single-series column chart. `series` is already dense (one entry per day),
 * so an empty day is a real zero rather than a missing point.
 */
export function BarChart({
  series,
  label,
  emptyLabel,
  formatValue = (value: number) => fmtInt(value),
}: {
  series: Array<{ date: string; count: number }>;
  label: string;
  emptyLabel: string;
  formatValue?: (value: number) => string;
}) {
  if (series.length === 0) return <p className={styles.chartEmpty}>{emptyLabel}</p>;
  const max = Math.max(1, ...series.map((day) => day.count));
  const total = series.reduce((sum, day) => sum + day.count, 0);
  return (
    <figure className={styles.chart} aria-label={label}>
      <div className={styles.chartBars}>
        {series.map((day) => (
          <span
            key={day.date}
            className={styles.chartBar}
            style={{ height: `${Math.max(3, (day.count / max) * 100)}%` }}
            title={`${fmtDayLabel(day.date)}: ${formatValue(day.count)}`}
          />
        ))}
      </div>
      <figcaption className={styles.chartAxis}>
        <span>{fmtDayLabel(series[0].date)}</span>
        <span className={styles.chartPeak}>
          peak {formatValue(max)} · {formatValue(total)} total
        </span>
        <span>{fmtDayLabel(series[series.length - 1].date)}</span>
      </figcaption>
    </figure>
  );
}

/** Two-series column chart: successes stacked under failures. */
export function StackedBarChart({
  series,
  label,
  emptyLabel,
}: {
  series: Array<{ date: string; opened: number; failed: number }>;
  label: string;
  emptyLabel: string;
}) {
  const max = Math.max(1, ...series.map((day) => day.opened + day.failed));
  if (series.length === 0 || max === 1) {
    const anything = series.some((day) => day.opened + day.failed > 0);
    if (!anything) return <p className={styles.chartEmpty}>{emptyLabel}</p>;
  }
  return (
    <figure className={styles.chart} aria-label={label}>
      <div className={styles.chartBars}>
        {series.map((day) => (
          <span
            key={day.date}
            className={styles.chartStack}
            title={`${fmtDayLabel(day.date)}: ${day.opened} opened, ${day.failed} failed`}
          >
            <span
              className={styles.chartSegFailed}
              style={{ height: `${(day.failed / max) * 100}%` }}
            />
            <span
              className={styles.chartSegOpened}
              style={{ height: `${Math.max(day.opened > 0 ? 3 : 0, (day.opened / max) * 100)}%` }}
            />
          </span>
        ))}
      </div>
      <figcaption className={styles.chartAxis}>
        <span>{fmtDayLabel(series[0].date)}</span>
        <span className={styles.chartLegend}>
          <i className={styles.dotOpened} /> opened <i className={styles.dotFailed} /> failed
        </span>
        <span>{fmtDayLabel(series[series.length - 1].date)}</span>
      </figcaption>
    </figure>
  );
}

/** Horizontal proportion bar used for "share of total" rows. */
export function ShareBar({ percent }: { percent: number }) {
  return (
    <span className={styles.shareBar} aria-hidden="true">
      <span style={{ width: `${Math.max(2, Math.min(100, percent))}%` }} />
    </span>
  );
}

export function TableCard({
  meta,
  children,
  tall = false,
}: {
  meta?: React.ReactNode;
  children: React.ReactNode;
  tall?: boolean;
}) {
  return (
    <div className={styles.tableCard}>
      {meta ? <div className={styles.tableMeta}>{meta}</div> : null}
      <div className={`${styles.tableWrap} ${tall ? styles.tableWrapTall : ""}`}>{children}</div>
    </div>
  );
}

/** Label/value pairs for the detail screens. */
export function StatGrid({
  items,
}: {
  items: Array<{ label: string; value: string; hint?: string }>;
}) {
  return (
    <dl className={styles.statGrid}>
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
          {item.hint ? <small>{item.hint}</small> : null}
        </div>
      ))}
    </dl>
  );
}

export function Footnote({ children }: { children: React.ReactNode }) {
  return <p className={styles.footnote}>{children}</p>;
}

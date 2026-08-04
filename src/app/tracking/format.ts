// Shared formatters for every /tracking screen. Kept in one place so a number
// never renders one way on the overview and another way on a detail screen.

import { FORMAT_LABELS } from "@/lib/access";
import type { MaterialAccessFormat } from "@/lib/tracking/material-access";

export const fmtInt = (value: number) => Math.round(value).toLocaleString("en-US");

/** The quiz is tracked alongside the Drive formats but has no FORMAT_LABELS entry. */
export function materialFormatLabel(format: MaterialAccessFormat): string {
  return format === "quiz" ? "Quiz" : FORMAT_LABELS[format];
}

/** Percentages arrive already scaled (12.5 means 12.5%). */
export const fmtPct = (value: number, digits = 2) => `${value.toFixed(digits)}%`;

export const fmtUsdCents = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/** Compact money for tight cells — $1.2k rather than $1,240.00. */
export function fmtUsdCentsShort(cents: number): string {
  const dollars = cents / 100;
  if (Math.abs(dollars) >= 10_000) return `$${(dollars / 1000).toFixed(1)}k`;
  return fmtUsdCents(cents);
}

export function fmtMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

/** Relative time for anything recent, an absolute date once it is old. */
export function fmtWhen(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms)) return "—";
  const diff = Date.now() - ms;
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function fmtDate(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms)) return "—";
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * The moment this response was rendered.
 *
 * Every dashboard screen is `dynamic = "force-dynamic"` and runs once per
 * request on the server, so "now" is a stable property of the response rather
 * than something that can drift between re-renders on the client.
 */
export function renderedAt(): number {
  return Date.now();
}

export function fmtDateTime(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms)) return "—";
  return new Date(ms).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

/** "2026-08-04" -> "Aug 4" for chart axes. */
export function fmtDayLabel(day: string): string {
  const ms = Date.parse(`${day}T00:00:00.000Z`);
  if (!Number.isFinite(ms)) return day;
  return new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

/** Share of a total as a percentage, or null when the total is zero. */
export function share(part: number, total: number): number | null {
  return total > 0 ? (part / total) * 100 : null;
}

/** Strip Mailchimp's tracking params so a clicked link is readable. */
export function tidyUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete("mc_cid");
    parsed.searchParams.delete("mc_eid");
    const text = `${parsed.host}${parsed.pathname}${parsed.search}`.replace(/\/$/, "");
    return text.length > 78 ? `${text.slice(0, 76)}…` : text;
  } catch {
    return url.length > 78 ? `${url.slice(0, 76)}…` : url;
  }
}

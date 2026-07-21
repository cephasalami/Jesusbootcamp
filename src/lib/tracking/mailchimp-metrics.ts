// src/lib/tracking/mailchimp-metrics.ts — SERVER-ONLY.
//
// "Forms filled" — the newsletter / free-Handbook signup forms all POST to
// /api/subscribe, which adds the person to the Mailchimp audience. So Mailchimp
// is the source of truth for form submissions. This reads real audience numbers
// with the same credentials /api/subscribe already uses (no new setup needed).

import type { MailchimpMetrics } from "@/lib/tracking/types";

const API_KEY = process.env.MAILCHIMP_API_KEY;
const API_SERVER = process.env.MAILCHIMP_API_SERVER;
const AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID;
const WINDOW_DAYS = 30;

export const isMailchimpConfigured = Boolean(API_KEY && API_SERVER && AUDIENCE_ID);

function num(v: unknown): number {
  const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : 0;
}

export async function readMailchimpMetrics(): Promise<MailchimpMetrics> {
  const base = {
    windowDays: WINDOW_DAYS,
    totalSubscribers: 0,
    totalContacts: 0,
    newSignupsWindow: 0,
    recent: [] as MailchimpMetrics["recent"],
    series: [] as MailchimpMetrics["series"],
  };

  if (!isMailchimpConfigured) {
    return {
      connected: false,
      hint: "Set MAILCHIMP_API_KEY, MAILCHIMP_API_SERVER and MAILCHIMP_AUDIENCE_ID to show form / lead signups.",
      ...base,
    };
  }

  const root = `https://${API_SERVER}.api.mailchimp.com/3.0/lists/${AUDIENCE_ID}`;
  const headers = { Authorization: `apikey ${API_KEY}` };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);

  async function get(path: string): Promise<Record<string, unknown>> {
    const res = await fetch(`${root}${path}`, {
      headers,
      cache: "no-store",
      signal: controller.signal,
    });
    const json = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      throw new Error((json?.title as string) || `Mailchimp ${res.status}`);
    }
    return json;
  }

  try {
    const [list, activity, members] = await Promise.all([
      get("?fields=stats.member_count,stats.total_contacts"),
      get(`/activity?count=${WINDOW_DAYS}&fields=activity.day,activity.subs`),
      get(
        "/members?sort_field=timestamp_opt&sort_dir=DESC&count=8&fields=members.email_address,members.timestamp_opt,members.timestamp_signup"
      ),
    ]);

    const stats = (list.stats as Record<string, unknown>) ?? {};
    const activityRows = (activity.activity as Array<{ day?: string; subs?: unknown }>) ?? [];
    const memberRows =
      (members.members as Array<{
        email_address?: string;
        timestamp_opt?: string;
        timestamp_signup?: string;
      }>) ?? [];

    const newSignupsWindow = activityRows.reduce((sum, r) => sum + num(r.subs), 0);

    // Mailchimp returns activity newest-first; reverse for an oldest-first series.
    const series = [...activityRows]
      .reverse()
      .map((r) => ({ date: String(r.day ?? "").slice(0, 10), count: num(r.subs) }));

    const recent = memberRows
      .map((m) => {
        const ts = m.timestamp_opt || m.timestamp_signup || "";
        const ms = ts ? Date.parse(ts) : NaN;
        return { email: m.email_address ?? "", ms };
      })
      .filter((r) => r.email);

    return {
      connected: true,
      windowDays: WINDOW_DAYS,
      totalSubscribers: num(stats.member_count),
      totalContacts: num(stats.total_contacts),
      newSignupsWindow,
      recent,
      series,
    };
  } catch (err) {
    return {
      connected: true,
      error:
        err instanceof Error
          ? err.name === "AbortError"
            ? "Mailchimp request timed out"
            : err.message
          : "Failed to read Mailchimp",
      ...base,
    };
  } finally {
    clearTimeout(timeout);
  }
}

// src/lib/tracking/mailchimp-campaign-metrics.ts -- SERVER-ONLY.
//
// Mailchimp's read-only Reports endpoint is the source of the real sent-email
// engagement figures. Results live in the existing KV store for 15 minutes so
// refreshing /tracking never turns into one Mailchimp API request per page load.

import { isKvConfigured, kvGetJson, kvSetJson } from "../kv.ts";
import type { MailchimpCampaignMetrics } from "./types.ts";

const API_KEY = process.env.MAILCHIMP_API_KEY;
const API_SERVER = process.env.MAILCHIMP_API_SERVER;
const AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID;

const CACHE_KEY = "jbc:tracking:mailchimp-campaign-reports:v1";
const CACHE_TTL_SEC = 15 * 60;
const PAGE_SIZE = 1_000;

export const isMailchimpCampaignReportingConfigured = Boolean(API_KEY && API_SERVER && AUDIENCE_ID);

type CachedMetrics = {
    cachedAt: number;
    metrics: Omit<MailchimpCampaignMetrics, "cachedAt">;
};

let memoryCache: CachedMetrics | null = null;
let refreshInFlight: Promise<MailchimpCampaignMetrics> | null = null;

function num(value: unknown): number {
    const parsed = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
    return Number.isFinite(parsed) ? parsed : 0;
}

function fromCache(cached: CachedMetrics): MailchimpCampaignMetrics {
    return { ...cached.metrics, cachedAt: cached.cachedAt };
}

function validCache(value: CachedMetrics | null): value is CachedMetrics {
    return Boolean(
        value &&
        Number.isFinite(value.cachedAt) &&
        Date.now() - value.cachedAt < CACHE_TTL_SEC * 1_000 &&
        value.metrics?.connected &&
        Array.isArray(value.metrics.campaigns)
    );
}

async function readCached(): Promise<CachedMetrics | null> {
    if (validCache(memoryCache)) return memoryCache;
    if (!isKvConfigured) return null;
    const cached = await kvGetJson<CachedMetrics>(CACHE_KEY);
    if (validCache(cached)) {
        memoryCache = cached;
        return cached;
    }
    return null;
}

async function fetchSentCampaignReports(): Promise<MailchimpCampaignMetrics> {
    const empty = { totalCampaigns: 0, totalOpens: 0, totalClicks: 0, campaigns: [] as MailchimpCampaignMetrics["campaigns"] };
    if (!isMailchimpCampaignReportingConfigured) {
        return {
            connected: false,
            hint: "Set MAILCHIMP_API_KEY, MAILCHIMP_API_SERVER and MAILCHIMP_AUDIENCE_ID to load sent-campaign reports.",
            cachedAt: null,
            ...empty,
        };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    const base = `https://${API_SERVER}.api.mailchimp.com/3.0/reports`;
    const fields = [
        "total_items",
        "reports.id",
        "reports.campaign_title",
        "reports.subject_line",
        "reports.send_time",
        "reports.emails_sent",
        "reports.opens.unique_opens",
        "reports.opens.open_rate",
        "reports.clicks.unique_clicks",
        "reports.clicks.click_rate",
    ].join(",");

    try {
        const campaigns: MailchimpCampaignMetrics["campaigns"] = [];
        let offset = 0;
        let totalItems = Infinity;

        while (offset < totalItems) {
            const query = new URLSearchParams({
                count: String(PAGE_SIZE),
                offset: String(offset),
                fields,
            });
            const response = await fetch(`${base}?${query}`, {
                headers: { Authorization: `apikey ${API_KEY}` },
                cache: "no-store",
                signal: controller.signal,
            });
            const json = (await response.json()) as Record<string, unknown>;
            if (!response.ok) {
                throw new Error((json.title as string) || `Mailchimp ${response.status}`);
            }

            const reports = Array.isArray(json.reports) ? json.reports as Array<Record<string, unknown>> : [];
            totalItems = num(json.total_items);
            for (const report of reports) {
                const opens = (report.opens as Record<string, unknown> | undefined) ?? {};
                const clicks = (report.clicks as Record<string, unknown> | undefined) ?? {};
                const sentAt = typeof report.send_time === "string" ? Date.parse(report.send_time) : NaN;
                campaigns.push({
                    id: String(report.id ?? ""),
                    title: String(report.campaign_title || report.subject_line || "Untitled campaign"),
                    sentAt: Number.isFinite(sentAt) ? sentAt : null,
                    emailsSent: num(report.emails_sent),
                    opens: num(opens.unique_opens),
                    openRate: num(opens.open_rate),
                    clicks: num(clicks.unique_clicks),
                    clickRate: num(clicks.click_rate),
                });
            }
            offset += reports.length;
            if (reports.length === 0) break;
        }

        campaigns.sort((a, b) => (b.sentAt ?? 0) - (a.sentAt ?? 0));
        return {
            connected: true,
            cachedAt: null,
            totalCampaigns: campaigns.length,
            totalOpens: campaigns.reduce((sum, campaign) => sum + campaign.opens, 0),
            totalClicks: campaigns.reduce((sum, campaign) => sum + campaign.clicks, 0),
            campaigns,
        };
    } catch (err) {
        return {
            connected: true,
            error:
                err instanceof Error
                    ? err.name === "AbortError"
                        ? "Mailchimp report request timed out"
                        : err.message
                    : "Failed to read Mailchimp campaign reports",
            cachedAt: null,
            ...empty,
        };
    } finally {
        clearTimeout(timeout);
    }
}

/**
 * Fetch sent-campaign opens and clicks from GET /reports. A cache hit avoids
 * Mailchimp entirely; the small in-process cache is a fallback if KV is down.
 */
export async function readMailchimpCampaignMetrics(): Promise<MailchimpCampaignMetrics> {
    const cached = await readCached();
    if (cached) return fromCache(cached);

    if (!refreshInFlight) {
        refreshInFlight = (async () => {
            const metrics = await fetchSentCampaignReports();
            if (!metrics.connected || metrics.error) return metrics;

            const cacheableMetrics: Omit<MailchimpCampaignMetrics, "cachedAt"> = {
                connected: metrics.connected,
                ...(metrics.hint ? { hint: metrics.hint } : {}),
                totalCampaigns: metrics.totalCampaigns,
                totalOpens: metrics.totalOpens,
                totalClicks: metrics.totalClicks,
                campaigns: metrics.campaigns,
            };
            const cacheEntry: CachedMetrics = {
                cachedAt: Date.now(),
                metrics: cacheableMetrics,
            };
            memoryCache = cacheEntry;
            if (isKvConfigured) await kvSetJson(CACHE_KEY, cacheEntry, CACHE_TTL_SEC);
            return fromCache(cacheEntry);
        })();
    }

    try {
        return await refreshInFlight;
    } finally {
        refreshInFlight = null;
    }
}

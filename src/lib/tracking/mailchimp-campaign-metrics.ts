// src/lib/tracking/mailchimp-campaign-metrics.ts -- SERVER-ONLY.
//
// Mailchimp's read-only Reports endpoint is the source of the real sent-email
// engagement figures. Results live in the existing KV store for 15 minutes so
// refreshing /tracking never turns into one Mailchimp API request per page load.

import { isKvConfigured, kvGetJson, kvSetJson } from "../kv.ts";
import type { MailchimpCampaignDetail, MailchimpCampaignMetrics } from "./types.ts";

const API_KEY = process.env.MAILCHIMP_API_KEY;
const API_SERVER = process.env.MAILCHIMP_API_SERVER;
const AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID;

// v2: rates are now stored as percentages, so a v1 payload must not be reused.
const CACHE_KEY = "jbc:tracking:mailchimp-campaign-reports:v2";
const DETAIL_CACHE_PREFIX = "jbc:tracking:mailchimp-campaign-report:v1:";
const CACHE_TTL_SEC = 15 * 60;
const PAGE_SIZE = 1_000;
/** Top links shown on a campaign drill-down. */
const LINK_LIMIT = 15;

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
    const empty = { totalCampaigns: 0, totalOpens: 0, totalClicks: 0, totalRecipients: 0, campaigns: [] as MailchimpCampaignMetrics["campaigns"] };
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
                    // Report rates arrive as FRACTIONS (0.0904 = 9.04%). Scale once
                    // here so every consumer can treat these as percentages.
                    openRate: num(opens.open_rate) * 100,
                    clicks: num(clicks.unique_clicks),
                    clickRate: num(clicks.click_rate) * 100,
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
            totalRecipients: campaigns.reduce((sum, campaign) => sum + campaign.emailsSent, 0),
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

function parseTime(value: unknown): number | null {
    if (typeof value !== "string" || !value) return null;
    const ms = Date.parse(value);
    return Number.isFinite(ms) ? ms : null;
}

/**
 * The drill-down for ONE campaign: everything GET /reports/{id} exposes plus the
 * links people actually clicked. Cached per campaign for the same 15 minutes as
 * the list, so opening a row repeatedly costs Mailchimp nothing.
 */
export async function readMailchimpCampaignDetail(id: string): Promise<MailchimpCampaignDetail> {
    const empty = { campaign: null, links: [] as MailchimpCampaignDetail["links"] };
    if (!isMailchimpCampaignReportingConfigured) {
        return {
            connected: false,
            hint: "Set MAILCHIMP_API_KEY, MAILCHIMP_API_SERVER and MAILCHIMP_AUDIENCE_ID to open a campaign report.",
            cachedAt: null,
            ...empty,
        };
    }
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) {
        return { connected: true, error: "Unknown campaign id.", cachedAt: null, ...empty };
    }

    const cacheKey = `${DETAIL_CACHE_PREFIX}${id}`;
    if (isKvConfigured) {
        const cached = await kvGetJson<{ cachedAt: number; detail: MailchimpCampaignDetail }>(cacheKey);
        if (cached?.detail?.campaign && Date.now() - cached.cachedAt < CACHE_TTL_SEC * 1_000) {
            return { ...cached.detail, cachedAt: cached.cachedAt };
        }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    const base = `https://${API_SERVER}.api.mailchimp.com/3.0/reports/${id}`;

    try {
        async function get(path: string): Promise<Record<string, unknown>> {
            const response = await fetch(`${base}${path}`, {
                headers: { Authorization: `apikey ${API_KEY}` },
                cache: "no-store",
                signal: controller.signal,
            });
            const json = (await response.json()) as Record<string, unknown>;
            if (!response.ok) throw new Error((json.title as string) || `Mailchimp ${response.status}`);
            return json;
        }

        const [report, clickDetails] = await Promise.all([
            get(""),
            get(`/click-details?count=${LINK_LIMIT}`).catch(() => ({}) as Record<string, unknown>),
        ]);

        const opens = (report.opens as Record<string, unknown> | undefined) ?? {};
        const clicks = (report.clicks as Record<string, unknown> | undefined) ?? {};
        const bounces = (report.bounces as Record<string, unknown> | undefined) ?? {};
        const forwards = (report.forwards as Record<string, unknown> | undefined) ?? {};
        const uniqueOpens = num(opens.unique_opens);
        const subscriberClicks = num(clicks.unique_subscriber_clicks);

        const detail: MailchimpCampaignDetail = {
            connected: true,
            cachedAt: null,
            campaign: {
                id,
                title: String(report.campaign_title || report.subject_line || "Untitled campaign"),
                subject: String(report.subject_line ?? ""),
                previewText: String(report.preview_text ?? ""),
                fromName: String(report.email_from_name ?? ""),
                sentAt: parseTime(report.send_time),
                emailsSent: num(report.emails_sent),
                abuseReports: num(report.abuse_reports),
                unsubscribed: num(report.unsubscribed),
                hardBounces: num(bounces.hard_bounces),
                softBounces: num(bounces.soft_bounces),
                syntaxErrors: num(bounces.syntax_errors),
                opensTotal: num(opens.opens_total),
                uniqueOpens,
                openRate: num(opens.open_rate) * 100,
                lastOpenAt: parseTime(opens.last_open),
                clicksTotal: num(clicks.clicks_total),
                uniqueClicks: num(clicks.unique_clicks),
                uniqueSubscriberClicks: subscriberClicks,
                clickRate: num(clicks.click_rate) * 100,
                lastClickAt: parseTime(clicks.last_click),
                forwards: num(forwards.forwards_count),
                forwardOpens: num(forwards.forwards_opens),
                clickToOpenRate: uniqueOpens > 0 ? (subscriberClicks / uniqueOpens) * 100 : null,
            },
            links: (Array.isArray(clickDetails.urls_clicked) ? clickDetails.urls_clicked : [])
                .map((entry) => {
                    const link = entry as Record<string, unknown>;
                    return {
                        url: String(link.url ?? ""),
                        clicks: num(link.total_clicks),
                        uniqueClicks: num(link.unique_clicks),
                        clickPercentage: num(link.click_percentage) * 100,
                    };
                })
                .filter((link) => link.url)
                .sort((a, b) => b.clicks - a.clicks),
        };

        if (isKvConfigured) {
            await kvSetJson(cacheKey, { cachedAt: Date.now(), detail }, CACHE_TTL_SEC);
        }
        return detail;
    } catch (err) {
        return {
            connected: true,
            error:
                err instanceof Error
                    ? err.name === "AbortError"
                        ? "Mailchimp report request timed out"
                        : err.message
                    : "Failed to read the campaign report",
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
                totalRecipients: metrics.totalRecipients,
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

// src/lib/tracking/meta-ads.ts — SERVER-ONLY.
//
// Real ad-side metrics (impressions, clicks, CTR, CPC, spend, reach, pixel
// purchases) pulled live from the Meta Marketing API's Insights endpoint. This
// is the "series pixels" ad-campaign view.
//
// Setup: create a System User in Meta Business settings, generate a token with
// the `ads_read` permission, then set:
//   META_ACCESS_TOKEN     the token
//   META_AD_ACCOUNT_ID    your ad account id (e.g. act_1234567890 or 1234567890)
//   META_GRAPH_VERSION    optional, defaults to v21.0 (see config/pixels.ts)

import { META_GRAPH_VERSION } from "@/config/pixels";
import type { MetaAdsMetrics } from "@/lib/tracking/types";

const TOKEN = process.env.META_ACCESS_TOKEN;
const RAW_ACCOUNT = process.env.META_AD_ACCOUNT_ID;
const DATE_PRESET = "last_30d";
const PURCHASE_ACTIONS = new Set([
  "purchase",
  "offsite_conversion.fb_pixel_purchase",
  "omni_purchase",
]);

export const isMetaAdsConfigured = Boolean(TOKEN && RAW_ACCOUNT);

function accountId(): string {
  const id = String(RAW_ACCOUNT);
  return id.startsWith("act_") ? id : `act_${id}`;
}

function num(v: unknown): number {
  const n = parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
}

type InsightRow = {
  campaign_name?: string;
  impressions?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  spend?: string;
  reach?: string;
  actions?: Array<{ action_type: string; value: string }>;
};

function purchasesFrom(row: InsightRow): number {
  if (!Array.isArray(row.actions)) return 0;
  return row.actions
    .filter((a) => PURCHASE_ACTIONS.has(a.action_type))
    .reduce((sum, a) => sum + num(a.value), 0);
}

async function graphGet(
  path: string,
  params: Record<string, string>,
  signal: AbortSignal
): Promise<Record<string, unknown>> {
  const qs = new URLSearchParams({ ...params, access_token: TOKEN! });
  const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${path}?${qs}`;
  const res = await fetch(url, { cache: "no-store", signal });
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const err = json?.error as { message?: string } | undefined;
    throw new Error(err?.message || `Meta API ${res.status}`);
  }
  return json;
}

export async function readMetaAds(): Promise<MetaAdsMetrics> {
  const base = {
    datePreset: DATE_PRESET,
    impressions: 0,
    clicks: 0,
    ctr: 0,
    cpc: 0,
    spend: 0,
    reach: 0,
    purchases: 0,
    currency: "USD",
    campaigns: [] as MetaAdsMetrics["campaigns"],
  };

  if (!isMetaAdsConfigured) {
    return {
      connected: false,
      hint: "Set META_ACCESS_TOKEN and META_AD_ACCOUNT_ID (token needs ads_read) to show ad impressions, clicks and spend.",
      ...base,
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const act = accountId();
    const [account, campaignsRes, meta] = await Promise.all([
      graphGet(
        `${act}/insights`,
        {
          level: "account",
          date_preset: DATE_PRESET,
          fields: "impressions,clicks,ctr,cpc,spend,reach,actions",
        },
        controller.signal
      ),
      graphGet(
        `${act}/insights`,
        {
          level: "campaign",
          date_preset: DATE_PRESET,
          limit: "25",
          fields: "campaign_name,impressions,clicks,ctr,spend,actions",
        },
        controller.signal
      ),
      graphGet(act, { fields: "currency" }, controller.signal),
    ]);

    const row = ((account.data as InsightRow[]) ?? [])[0] ?? {};
    const campaignRows = (campaignsRes.data as InsightRow[]) ?? [];

    const campaigns = campaignRows
      .map((c) => ({
        name: c.campaign_name || "(unnamed campaign)",
        impressions: num(c.impressions),
        clicks: num(c.clicks),
        ctr: num(c.ctr),
        spend: num(c.spend),
        purchases: purchasesFrom(c),
      }))
      .sort((a, b) => b.spend - a.spend);

    return {
      connected: true,
      datePreset: DATE_PRESET,
      impressions: num(row.impressions),
      clicks: num(row.clicks),
      ctr: num(row.ctr),
      cpc: num(row.cpc),
      spend: num(row.spend),
      reach: num(row.reach),
      purchases: purchasesFrom(row),
      currency: (meta.currency as string) || "USD",
      campaigns,
    };
  } catch (err) {
    return {
      connected: true,
      error:
        err instanceof Error
          ? err.name === "AbortError"
            ? "Meta API request timed out"
            : err.message
          : "Failed to read Meta Ads",
      ...base,
    };
  } finally {
    clearTimeout(timeout);
  }
}

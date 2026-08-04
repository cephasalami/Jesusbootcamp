import { BarChart3, CircleDollarSign, Eye, Gauge, Megaphone, MousePointer2 } from "lucide-react";
import { readMetaAds } from "@/lib/tracking/meta-ads";
import { readStripeMetrics } from "@/lib/tracking/stripe-metrics";
import {
  BarChart,
  EmptySource,
  ErrorBanner,
  Footnote,
  MetricCard,
  Panel,
  ScreenHeader,
  ShareBar,
  SourceBadge,
  TableCard,
  sourceState,
} from "../../ui";
import { fmtInt, fmtMoney, fmtPct, fmtUsdCents, share } from "../../format";
import styles from "../../tracking.module.css";

export const dynamic = "force-dynamic";

export default async function AcquisitionScreen() {
  const [meta, stripe] = await Promise.all([readMetaAds(), readStripeMetrics()]);

  const state = sourceState(meta.connected, meta.error);
  const metaOk = meta.connected && !meta.error;
  const stripeOk = stripe.connected && !stripe.error;

  const costPerPurchase = meta.purchases > 0 ? meta.spend / meta.purchases : null;
  const costPerOrder = metaOk && stripeOk && stripe.conversions > 0 ? meta.spend / stripe.conversions : null;
  const clickToSale = metaOk && stripeOk && meta.clicks > 0 ? share(stripe.conversions, meta.clicks) : null;
  const grossReturn = metaOk && stripeOk && meta.spend > 0 ? stripe.revenueCents / 100 / meta.spend : null;
  const maxSpend = Math.max(1, ...meta.campaigns.map((campaign) => campaign.spend));
  const spendSeries = meta.series.map((day) => ({ date: day.date, count: day.spend }));

  return (
    <>
      <ScreenHeader
        eyebrow="Acquisition"
        title="Meta advertising"
        subtitle="Delivery and cost figures pulled live from the Meta Marketing API, alongside what Stripe actually recorded in the same period."
        meta={
          <>
            <SourceBadge state={state} />
            {metaOk ? <span>Window: {meta.datePreset.replace("last_", "last ").replace("d", " days")}</span> : null}
          </>
        }
      />

      {!meta.connected ? (
        <EmptySource
          title="Meta Ads is not connected"
          hint={
            <>
              Set <code>META_ACCESS_TOKEN</code> (needs the <code>ads_read</code> permission) and{" "}
              <code>META_AD_ACCOUNT_ID</code> to load real ad delivery data. Everything else on this
              dashboard works without it.
            </>
          }
        />
      ) : meta.error ? (
        <ErrorBanner label="Meta Ads error" message={meta.error} />
      ) : (
        <>
          <section className={styles.overviewGrid} aria-label="Ad delivery totals">
            <MetricCard
              icon={<CircleDollarSign size={16} />}
              label="Spend"
              value={fmtMoney(meta.spend, meta.currency)}
              detail={`${fmtMoney(meta.cpc, meta.currency)} average cost per click`}
              accent
            />
            <MetricCard
              icon={<BarChart3 size={16} />}
              label="Impressions"
              value={fmtInt(meta.impressions)}
              detail={`${fmtInt(meta.reach)} people reached`}
            />
            <MetricCard
              icon={<MousePointer2 size={16} />}
              label="Ad clicks"
              value={fmtInt(meta.clicks)}
              detail={`${fmtPct(meta.ctr)} click-through rate`}
            />
            <MetricCard
              icon={<Eye size={16} />}
              label="Pixel purchases"
              value={fmtInt(meta.purchases)}
              detail={
                costPerPurchase == null
                  ? "Meta has attributed no purchases yet"
                  : `${fmtMoney(costPerPurchase, meta.currency)} per attributed purchase`
              }
            />
          </section>

          <Panel
            icon={<Gauge size={18} />}
            title="Ads against real payments"
            subtitle="Meta's own attribution can differ from what Stripe banked. These compare the two directly over the same period."
            state={state}
            wide
          >
            <div className={styles.inlineMetrics}>
              <MetricCard
                label="Cost per paid order"
                value={costPerOrder == null ? "—" : fmtMoney(costPerOrder, meta.currency)}
                detail="Ad spend ÷ Stripe orders"
                muted={costPerOrder == null}
              />
              <MetricCard
                label="Ad click to sale"
                value={clickToSale == null ? "—" : fmtPct(clickToSale)}
                detail="Stripe orders ÷ ad clicks"
                muted={clickToSale == null}
              />
              <MetricCard
                label="Revenue per $1 spent"
                value={grossReturn == null ? "—" : `${grossReturn.toFixed(2)}×`}
                detail="All Stripe revenue ÷ all ad spend"
                muted={grossReturn == null}
              />
              <MetricCard
                label="Stripe revenue"
                value={stripeOk ? fmtUsdCents(stripe.revenueCents) : "—"}
                detail={stripeOk ? `${fmtInt(stripe.conversions)} paid orders` : "Stripe not connected"}
                muted={!stripeOk}
                href="/tracking/sales"
              />
            </div>
            <Footnote>
              These are whole-account ratios, not attributed conversions: they compare total ad spend
              with total revenue in the same window, including sales that never came from an ad.
            </Footnote>
          </Panel>

          <Panel
            icon={<CircleDollarSign size={18} />}
            title="Spend per day"
            subtitle="Daily delivery over the reporting window."
            state={state}
            wide
          >
            <BarChart
              series={spendSeries}
              label="Meta ad spend per day"
              emptyLabel="Meta returned no daily breakdown for this window."
              formatValue={(value) => fmtMoney(value, meta.currency)}
            />
          </Panel>

          <Panel
            icon={<Megaphone size={18} />}
            title="Campaigns"
            subtitle="Every campaign that delivered in this window, biggest spender first."
            state={state}
            wide
          >
            {meta.campaigns.length === 0 ? (
              <EmptySource
                title="No campaign delivery in this window"
                hint="Campaigns appear here once they start spending."
              />
            ) : (
              <TableCard tall>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Campaign</th>
                      <th className={styles.num}>Impressions</th>
                      <th className={styles.num}>Clicks</th>
                      <th className={styles.num}>CTR</th>
                      <th className={styles.num}>Spend</th>
                      <th className={styles.num}>Purchases</th>
                      <th>Share of spend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meta.campaigns.map((campaign) => (
                      <tr key={campaign.name}>
                        <td className={styles.campaignName}>{campaign.name}</td>
                        <td className={styles.num}>{fmtInt(campaign.impressions)}</td>
                        <td className={styles.num}>{fmtInt(campaign.clicks)}</td>
                        <td className={styles.num}>{fmtPct(campaign.ctr)}</td>
                        <td className={styles.num}>{fmtMoney(campaign.spend, meta.currency)}</td>
                        <td className={styles.num}>{fmtInt(campaign.purchases)}</td>
                        <td>
                          <ShareBar percent={(campaign.spend / maxSpend) * 100} />
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

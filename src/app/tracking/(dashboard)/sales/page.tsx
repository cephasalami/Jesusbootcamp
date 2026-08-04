import { BookOpen, CircleDollarSign, Gauge, HeartHandshake, ReceiptText } from "lucide-react";
import { readStripeMetrics } from "@/lib/tracking/stripe-metrics";
import { readPartnerSubscriptions } from "@/lib/tracking/stripe-subscriptions";
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
import { fmtDateTime, fmtInt, fmtPct, fmtUsdCents, fmtWhen, share } from "../../format";
import styles from "../../tracking.module.css";

export const dynamic = "force-dynamic";

/** Subscription statuses that should read as a problem, not as revenue. */
const RISK_STATUSES = new Set(["past_due", "unpaid", "incomplete", "incomplete_expired"]);

export default async function SalesScreen() {
  const [stripe, partners] = await Promise.all([readStripeMetrics(), readPartnerSubscriptions()]);

  const state = sourceState(stripe.connected, stripe.error);
  const partnerState = sourceState(partners.connected, partners.error);
  const ok = stripe.connected && !stripe.error;
  const partnersOk = partners.connected && !partners.error;

  const totalBookUnits = stripe.bookSales.reduce((sum, book) => sum + book.units, 0);
  const aov = stripe.conversions > 0 ? stripe.revenueCents / stripe.conversions : null;
  const bumpRate = share(stripe.bumpOrders, stripe.conversions);
  const maxUnits = Math.max(1, ...stripe.bookSales.map((book) => book.units));
  const revenueSeries = stripe.series.map((day) => ({ date: day.date, count: day.revenueCents }));

  return (
    <>
      <ScreenHeader
        eyebrow="Sales"
        title="Books and partnerships"
        subtitle={`Successful, non-refunded Stripe payments from the last ${stripe.windowDays} days, plus every monthly partnership subscription.`}
        meta={
          <>
            <SourceBadge state={state} />
            {ok ? <span>{fmtUsdCents(stripe.today.revenueCents)} today ({fmtInt(stripe.today.conversions)} orders)</span> : null}
            {ok && stripe.refundedCents > 0 ? <span>{fmtUsdCents(stripe.refundedCents)} refunded</span> : null}
          </>
        }
      />

      {!stripe.connected ? (
        <EmptySource
          title="Stripe is not connected"
          hint={
            <>
              Set <code>STRIPE_SECRET_KEY</code> to load sales, revenue and subscriptions.
            </>
          }
        />
      ) : stripe.error ? (
        <ErrorBanner label="Stripe error" message={stripe.error} />
      ) : (
        <>
          <section className={styles.overviewGrid} aria-label="Sales totals">
            <MetricCard
              icon={<CircleDollarSign size={16} />}
              label="Revenue"
              value={fmtUsdCents(stripe.revenueCents)}
              detail={`Net of refunds, last ${stripe.windowDays} days`}
              accent
            />
            <MetricCard
              icon={<ReceiptText size={16} />}
              label="Orders"
              value={fmtInt(stripe.conversions)}
              detail={
                bumpRate == null
                  ? "Successful payments"
                  : `${fmtInt(stripe.bumpOrders)} included the order bump (${fmtPct(bumpRate, 0)})`
              }
            />
            <MetricCard
              icon={<Gauge size={16} />}
              label="Average order"
              value={aov == null ? "—" : fmtUsdCents(aov)}
              detail="Revenue divided by orders"
              muted={aov == null}
            />
            <MetricCard
              icon={<HeartHandshake size={16} />}
              label="Monthly partners"
              value={partnersOk ? fmtInt(partners.activeCount) : "—"}
              detail={
                partnersOk
                  ? `${fmtUsdCents(partners.mrrCents)} recurring per month`
                  : "Subscription data unavailable"
              }
              muted={!partnersOk}
            />
          </section>

          <Panel
            icon={<CircleDollarSign size={18} />}
            title="Revenue per day"
            subtitle={`Net revenue for each of the last ${stripe.windowDays} days. Quiet days are real zeroes, not gaps.`}
            state={state}
            wide
          >
            <BarChart
              series={revenueSeries}
              label="Stripe revenue per day"
              emptyLabel="No payments in this window."
              formatValue={(value) => fmtUsdCents(value)}
            />
          </Panel>

          <Panel
            icon={<ReceiptText size={18} />}
            title="Recent orders"
            subtitle="The newest successful payments, with what was bought and how it was paid."
            state={state}
            wide
          >
            {stripe.recent.length === 0 ? (
              <EmptySource
                title="No orders in this window"
                hint={`Nothing has been paid in the last ${stripe.windowDays} days.`}
              />
            ) : (
              <TableCard
                meta={
                  <>
                    <span>{fmtInt(stripe.recent.length)} most recent shown</span>
                    <span>{fmtInt(stripe.conversions)} orders in the window</span>
                  </>
                }
                tall
              >
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Customer</th>
                      <th>Bought</th>
                      <th>Payment</th>
                      <th className={styles.num}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stripe.recent.map((order) => (
                      <tr key={order.id}>
                        <td title={fmtDateTime(order.createdMs)}>{fmtWhen(order.createdMs)}</td>
                        <td>{order.email ?? "—"}</td>
                        <td>
                          <strong>{order.description ?? "Payment"}</strong>
                          {order.kind ? <small>{order.kind}</small> : null}
                        </td>
                        <td>
                          {order.card ?? "—"}
                          {order.country ? <small>{order.country}</small> : null}
                        </td>
                        <td className={styles.num}>
                          {fmtUsdCents(order.amountCents)}
                          {order.refundedCents > 0 ? (
                            <small className={styles.refund}>
                              −{fmtUsdCents(order.refundedCents)} refunded
                            </small>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableCard>
            )}
            {stripe.capped ? (
              <Footnote>
                The scan stopped at its page cap, so the totals above are a lower bound for this window.
              </Footnote>
            ) : null}
          </Panel>

          <Panel
            icon={<BookOpen size={18} />}
            title="Book sales"
            subtitle="Units attributed from the purchase tags each order writes into its Stripe metadata."
            state={state}
            wide
          >
            {stripe.bookSales.length === 0 ? (
              <EmptySource
                title="No book sales in this window"
                hint="Units appear here as soon as a book checkout completes."
              />
            ) : (
              <TableCard>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Book</th>
                      <th className={styles.num}>Units</th>
                      <th className={styles.num}>Share</th>
                      <th>Relative</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stripe.bookSales.map((book) => {
                      const pct = share(book.units, totalBookUnits);
                      return (
                        <tr key={book.slug}>
                          <td>
                            <strong>{book.title}</strong>
                            <small>{book.slug}</small>
                          </td>
                          <td className={styles.num}>{fmtInt(book.units)}</td>
                          <td className={styles.num}>{pct == null ? "—" : fmtPct(pct, 1)}</td>
                          <td>
                            <ShareBar percent={(book.units / maxUnits) * 100} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </TableCard>
            )}
          </Panel>
        </>
      )}

      <Panel
        icon={<HeartHandshake size={18} />}
        title="Monthly partnerships"
        subtitle="Recurring gifts from /partner/join. Amounts are normalised to a monthly figure, so a non-monthly price could never inflate the total."
        state={partnerState}
        wide
      >
        {!partners.connected ? (
          <EmptySource
            title="Subscriptions require Stripe"
            hint={
              <>
                Set <code>STRIPE_SECRET_KEY</code> to read partnership subscriptions.
              </>
            }
          />
        ) : partners.error ? (
          <ErrorBanner label="Stripe subscription error" message={partners.error} />
        ) : (
          <>
            <div className={styles.inlineMetrics}>
              <MetricCard
                label="Active partners"
                value={fmtInt(partners.activeCount)}
                detail="Active or trialing subscriptions"
              />
              <MetricCard
                label="Monthly recurring"
                value={fmtUsdCents(partners.mrrCents)}
                detail="Committed income per month"
              />
              <MetricCard
                label="Payment failing"
                value={fmtInt(partners.atRiskCount)}
                detail="Stripe is retrying these"
              />
              <MetricCard
                label="Ended"
                value={fmtInt(partners.canceledCount)}
                detail="Cancelled or expired"
              />
            </div>

            {partners.byAmount.length > 0 ? (
              <div className={styles.tierRow}>
                {partners.byAmount.map((tier) => (
                  <span key={tier.amountCents} className={styles.tierChip}>
                    <strong>{fmtUsdCents(tier.amountCents)}/mo</strong>
                    {fmtInt(tier.count)} {tier.count === 1 ? "partner" : "partners"}
                  </span>
                ))}
              </div>
            ) : null}

            {partners.recent.length === 0 ? (
              <EmptySource
                title="No partnership subscriptions yet"
                hint="The first monthly partner will appear here immediately after checkout."
              />
            ) : (
              <TableCard>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Partner</th>
                      <th>Started</th>
                      <th className={styles.num}>Monthly</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partners.recent.map((sub) => (
                      <tr key={sub.id}>
                        <td>
                          <strong>{sub.name ?? sub.email ?? "Unnamed partner"}</strong>
                          {sub.name && sub.email ? <small>{sub.email}</small> : null}
                        </td>
                        <td title={fmtDateTime(sub.createdMs)}>{fmtWhen(sub.createdMs)}</td>
                        <td className={styles.num}>{fmtUsdCents(sub.amountCents)}</td>
                        <td>
                          <span
                            className={
                              RISK_STATUSES.has(sub.status)
                                ? styles.pillBad
                                : sub.status === "active" || sub.status === "trialing"
                                  ? styles.pillOk
                                  : styles.pillMuted
                            }
                          >
                            {sub.status}
                            {sub.cancelAtPeriodEnd ? " · ending" : ""}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableCard>
            )}
            {partners.capped ? (
              <Footnote>
                The subscription scan hit its page cap, so these counts are a lower bound.
              </Footnote>
            ) : null}
          </>
        )}
      </Panel>
    </>
  );
}

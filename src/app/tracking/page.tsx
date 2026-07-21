import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken, TRACKING_COOKIE } from "@/lib/tracking-auth";
import { readStripeMetrics } from "@/lib/tracking/stripe-metrics";
import { readMetaAds } from "@/lib/tracking/meta-ads";
import { readFirstParty } from "@/lib/tracking/events-store";
import { readMailchimpMetrics } from "@/lib/tracking/mailchimp-metrics";
import { PIXELS, TRACKED_EVENTS } from "@/config/pixels";
import Toolbar from "./Toolbar";
import styles from "./tracking.module.css";

// Always render fresh: reads cookies + live third-party data.
export const dynamic = "force-dynamic";

// ── Formatting helpers ───────────────────────────────────────────────────────
const fmtInt = (n: number) => Math.round(n).toLocaleString("en-US");
const fmtUsdCents = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
const fmtPct = (n: number) => `${n.toFixed(2)}%`;

function fmtMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function fmtWhen(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Small presentational helpers (server components) ─────────────────────────
function Kpi({
  label,
  value,
  sub,
  muted,
}: {
  label: string;
  value: string;
  sub: string;
  muted?: boolean;
}) {
  return (
    <div className={styles.kpi}>
      <p className={styles.kpiLabel}>{label}</p>
      <p className={`${styles.kpiValue} ${muted ? styles.kpiValueMuted : ""}`}>{value}</p>
      <p className={styles.kpiSub}>{sub}</p>
    </div>
  );
}

function Chip({ state }: { state: "live" | "off" | "err" }) {
  if (state === "live") return <span className={`${styles.chip} ${styles.chipLive}`}>Connected</span>;
  if (state === "err") return <span className={`${styles.chip} ${styles.chipErr}`}>Error</span>;
  return <span className={`${styles.chip} ${styles.chipOff}`}>Not connected</span>;
}

function NotConnected({ title, hint }: { title: string; hint: React.ReactNode }) {
  return (
    <div className={styles.notConnected}>
      <p className={styles.notConnectedTitle}>{title}</p>
      <p className={styles.connectHint}>{hint}</p>
    </div>
  );
}

export default async function TrackingDashboard() {
  // ── Gate ──────────────────────────────────────────────────────────────────
  const cookieStore = await cookies();
  if (!verifySessionToken(cookieStore.get(TRACKING_COOKIE)?.value)) {
    redirect("/tracking/login");
  }

  // ── Gather data (each provider catches its own errors) ──────────────────────
  const [stripe, meta, first, mailchimp] = await Promise.all([
    readStripeMetrics(),
    readMetaAds(),
    readFirstParty(),
    readMailchimpMetrics(),
  ]);

  const metaOk = meta.connected && !meta.error;
  const stripeOk = stripe.connected && !stripe.error;
  const firstOk = first.connected && !first.error;
  const mcOk = mailchimp.connected && !mailchimp.error;

  const metaState = !meta.connected ? "off" : meta.error ? "err" : "live";
  const stripeState = !stripe.connected ? "off" : stripe.error ? "err" : "live";
  const firstState = !first.connected ? "off" : first.error ? "err" : "live";
  const mcState = !mailchimp.connected ? "off" : mailchimp.error ? "err" : "live";

  const totalBookUnits = stripeOk ? stripe.bookSales.reduce((s, b) => s + b.units, 0) : 0;
  const mcSeriesMax = mcOk ? Math.max(1, ...mailchimp.series.map((d) => d.count)) : 1;
  // First-party form-fill signal = Lead events we mirror on form submit.
  const firstPartyLeads = firstOk
    ? first.byEvent.find((e) => e.name === "Lead")?.total ?? 0
    : 0;

  // ── Cross-source derived metrics ────────────────────────────────────────────
  const aov =
    stripeOk && stripe.conversions > 0 ? stripe.revenueCents / stripe.conversions : null;
  const convRate =
    stripeOk && metaOk && meta.clicks > 0 ? (stripe.conversions / meta.clicks) * 100 : null;
  const costPerConv =
    stripeOk && metaOk && stripe.conversions > 0 ? meta.spend / stripe.conversions : null;

  const buttonClicks = firstOk ? Math.max(0, first.totalEvents - first.pageViews) : 0;
  const seriesMax = firstOk ? Math.max(1, ...first.series.map((d) => d.count)) : 1;

  const updated = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <h1 className={styles.title}>Tracking &amp; Analytics</h1>
              <p className={styles.subtitle}>
                Pixels, ad performance, on-site engagement and real conversions in one place.
                Every number is read live from its source — nothing on this page is simulated or
                estimated.
              </p>
            </div>
            <Toolbar />
          </div>
          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <span className={`${styles.dot} ${styles.dotLive}`} /> Connected &amp; live
            </span>
            <span className={styles.legendItem}>
              <span className={`${styles.dot} ${styles.dotOff}`} /> Not connected yet
            </span>
            <span className={styles.legendItem}>
              <span className={`${styles.dot} ${styles.dotErr}`} /> Connected, errored
            </span>
            <span className={styles.legendItem} style={{ marginLeft: "auto" }}>
              Last updated {updated}
            </span>
          </div>
        </header>

        {/* Top-line snapshot */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Snapshot</h2>
            <span className={styles.sourceTag}>Ads · last 30 days &nbsp;|&nbsp; Sales · last 30 days</span>
          </div>
          <div className={styles.grid}>
            <Kpi
              label="Impressions"
              value={metaOk ? fmtInt(meta.impressions) : "—"}
              sub={metaOk ? "Meta Ads · ad impressions" : "Meta Ads not connected"}
              muted={!metaOk}
            />
            <Kpi
              label="Clicks"
              value={metaOk ? fmtInt(meta.clicks) : "—"}
              sub={metaOk ? `CTR ${fmtPct(meta.ctr)}` : "Meta Ads not connected"}
              muted={!metaOk}
            />
            <Kpi
              label="Ad Spend"
              value={metaOk ? fmtMoney(meta.spend, meta.currency) : "—"}
              sub={metaOk ? "Meta Ads · last 30d" : "Meta Ads not connected"}
              muted={!metaOk}
            />
            <Kpi
              label="Conversions"
              value={stripeOk ? fmtInt(stripe.conversions) : "—"}
              sub={stripeOk ? `Stripe · ${stripe.today.conversions} today` : "Stripe not connected"}
              muted={!stripeOk}
            />
            <Kpi
              label="Revenue"
              value={stripeOk ? fmtUsdCents(stripe.revenueCents) : "—"}
              sub={stripeOk ? `Stripe · ${fmtUsdCents(stripe.today.revenueCents)} today` : "Stripe not connected"}
              muted={!stripeOk}
            />
            <Kpi
              label="Books sold"
              value={stripeOk ? fmtInt(totalBookUnits) : "—"}
              sub={stripeOk ? "Stripe · units, last 30d" : "Stripe not connected"}
              muted={!stripeOk}
            />
            <Kpi
              label="Form fills"
              value={mcOk ? fmtInt(mailchimp.newSignupsWindow) : "—"}
              sub={mcOk ? `Mailchimp · new in ${mailchimp.windowDays}d` : "Mailchimp not connected"}
              muted={!mcOk}
            />
            <Kpi
              label="Page Views"
              value={firstOk ? fmtInt(first.pageViews) : "—"}
              sub={firstOk ? "First-party · all-time" : "Event store not connected"}
              muted={!firstOk}
            />
          </div>
        </section>

        {/* Ad performance — Meta */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Ad performance</h2>
            <span className={styles.sourceTag}>
              Source: Meta Marketing API &nbsp; <Chip state={metaState} />
            </span>
          </div>

          {!meta.connected ? (
            <NotConnected
              title="Connect Meta Ads to see impressions, clicks &amp; spend"
              hint={
                <>
                  Add a Meta System-User token with the <code>ads_read</code> permission as{" "}
                  <code>META_ACCESS_TOKEN</code> and your account as <code>META_AD_ACCOUNT_ID</code>{" "}
                  (e.g. <code>act_1234567890</code>).
                </>
              }
            />
          ) : (
            <>
              {meta.error ? <p className={styles.errorBanner}>Meta API error: {meta.error}</p> : null}
              <div className={styles.grid} style={{ marginBottom: "0.85rem" }}>
                <Kpi label="Reach" value={fmtInt(meta.reach)} sub="Unique accounts" />
                <Kpi label="CTR" value={fmtPct(meta.ctr)} sub="Click-through rate" />
                <Kpi label="CPC" value={fmtMoney(meta.cpc, meta.currency)} sub="Avg cost / click" />
                <Kpi label="Pixel purchases" value={fmtInt(meta.purchases)} sub="Attributed by pixel" />
                <Kpi
                  label="Cost / conversion"
                  value={costPerConv != null ? fmtMoney(costPerConv, meta.currency) : "—"}
                  sub="Spend ÷ Stripe sales"
                  muted={costPerConv == null}
                />
                <Kpi
                  label="Ad → sale rate"
                  value={convRate != null ? fmtPct(convRate) : "—"}
                  sub="Stripe sales ÷ ad clicks"
                  muted={convRate == null}
                />
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Campaign</th>
                      <th className={styles.num}>Impressions</th>
                      <th className={styles.num}>Clicks</th>
                      <th className={styles.num}>CTR</th>
                      <th className={styles.num}>Spend</th>
                      <th className={styles.num}>Purchases</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meta.campaigns.length === 0 ? (
                      <tr>
                        <td colSpan={6} className={styles.muted}>
                          No campaign data in the last 30 days.
                        </td>
                      </tr>
                    ) : (
                      meta.campaigns.map((c) => (
                        <tr key={c.name}>
                          <td>{c.name}</td>
                          <td className={styles.num}>{fmtInt(c.impressions)}</td>
                          <td className={styles.num}>{fmtInt(c.clicks)}</td>
                          <td className={styles.num}>{fmtPct(c.ctr)}</td>
                          <td className={styles.num}>{fmtMoney(c.spend, meta.currency)}</td>
                          <td className={styles.num}>{fmtInt(c.purchases)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        {/* Conversions & revenue — Stripe */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Conversions &amp; revenue</h2>
            <span className={styles.sourceTag}>
              Source: Stripe &nbsp; <Chip state={stripeState} />
            </span>
          </div>

          {!stripe.connected ? (
            <NotConnected
              title="Connect Stripe to show real sales"
              hint={<>Set <code>STRIPE_SECRET_KEY</code> to show real conversions and revenue.</>}
            />
          ) : (
            <>
              {stripe.error ? (
                <p className={styles.errorBanner}>Stripe error: {stripe.error}</p>
              ) : null}
              <div className={styles.grid} style={{ marginBottom: "0.85rem" }}>
                <Kpi label="Conversions (30d)" value={fmtInt(stripe.conversions)} sub="Successful charges" />
                <Kpi label="Revenue (30d)" value={fmtUsdCents(stripe.revenueCents)} sub="Net of refunds" />
                <Kpi label="Today" value={fmtInt(stripe.today.conversions)} sub={`${fmtUsdCents(stripe.today.revenueCents)} today`} />
                <Kpi
                  label="Avg order value"
                  value={aov != null ? fmtUsdCents(aov) : "—"}
                  sub="Revenue ÷ conversions"
                  muted={aov == null}
                />
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Customer</th>
                      <th>Item</th>
                      <th className={styles.num}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stripe.recent.length === 0 ? (
                      <tr>
                        <td colSpan={4} className={styles.muted}>
                          No successful charges in the last 30 days.
                        </td>
                      </tr>
                    ) : (
                      stripe.recent.map((r, i) => (
                        <tr key={i}>
                          <td className={styles.mono}>{fmtWhen(r.createdMs)}</td>
                          <td>{r.email ?? <span className={styles.muted}>—</span>}</td>
                          <td>{r.description ?? <span className={styles.muted}>—</span>}</td>
                          <td className={styles.num}>{fmtUsdCents(r.amountCents)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {stripe.capped ? (
                <p className={styles.kpiSub}>
                  Showing the {stripe.windowDays}-day window; older/oldest charges beyond the scan
                  cap aren&apos;t included, so totals are a lower bound.
                </p>
              ) : null}
            </>
          )}
        </section>

        {/* Book sales — Stripe (attributed from order metadata) */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Book sales</h2>
            <span className={styles.sourceTag}>
              Source: Stripe order metadata &nbsp; <Chip state={stripeState} />
            </span>
          </div>

          {!stripeOk ? (
            <NotConnected
              title="Per-book sales need Stripe connected"
              hint={
                <>
                  Once <code>STRIPE_SECRET_KEY</code> is set, each order is attributed to the
                  book(s) it contains — main product, order bump and one-click upsell.
                </>
              }
            />
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Book</th>
                    <th className={styles.num}>Units sold (30d)</th>
                    <th className={styles.num}>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {stripe.bookSales.length === 0 ? (
                    <tr>
                      <td colSpan={3} className={styles.muted}>
                        No book sales in the last 30 days.
                      </td>
                    </tr>
                  ) : (
                    stripe.bookSales.map((b) => (
                      <tr key={b.slug}>
                        <td>{b.title}</td>
                        <td className={styles.num}>{fmtInt(b.units)}</td>
                        <td className={styles.num}>
                          {totalBookUnits > 0 ? fmtPct((b.units / totalBookUnits) * 100) : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                  {stripe.bookSales.length > 0 ? (
                    <tr>
                      <td>
                        <strong>Total units</strong>
                      </td>
                      <td className={styles.num}>
                        <strong>{fmtInt(totalBookUnits)}</strong>
                      </td>
                      <td className={styles.num} />
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* On-site engagement — first-party */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>On-site engagement &amp; button clicks</h2>
            <span className={styles.sourceTag}>
              Source: First-party collector &nbsp; <Chip state={firstState} />
            </span>
          </div>

          {!first.connected ? (
            <NotConnected
              title="Turn on the first-party event store to count page views &amp; button clicks"
              hint={
                <>
                  Create an Upstash Redis database and set <code>UPSTASH_REDIS_REST_URL</code> and{" "}
                  <code>UPSTASH_REDIS_REST_TOKEN</code>. The site already sends events (PageView,
                  InitiateCheckout, Lead, DonateIntent, VideoPlay) — they&apos;ll start counting the
                  moment the store is connected.
                </>
              }
            />
          ) : (
            <>
              {first.error ? (
                <p className={styles.errorBanner}>Event store error: {first.error}</p>
              ) : null}
              <div className={styles.grid} style={{ marginBottom: "0.85rem" }}>
                <Kpi label="Page views" value={fmtInt(first.pageViews)} sub="All-time" />
                <Kpi label="Button / action events" value={fmtInt(buttonClicks)} sub="Checkout, leads, donate, video" />
                <Kpi label="Total events" value={fmtInt(first.totalEvents)} sub="All event types" />
              </div>

              {/* 14-day sparkline */}
              {first.series.length > 0 ? (
                <div className={styles.card} style={{ marginBottom: "0.85rem" }}>
                  <p className={styles.kpiLabel}>Events — last {first.series.length} days</p>
                  <div className={styles.spark}>
                    {first.series.map((d) => (
                      <div
                        key={d.date}
                        className={styles.sparkBar}
                        style={{ height: `${(d.count / seriesMax) * 100}%` }}
                        title={`${d.date}: ${d.count}`}
                      />
                    ))}
                  </div>
                  <div className={styles.sparkLabels}>
                    <span>{first.series[0]?.date}</span>
                    <span>{first.series[first.series.length - 1]?.date}</span>
                  </div>
                </div>
              ) : null}

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th className={styles.num}>Count (all-time)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {first.byEvent.length === 0 ? (
                      <tr>
                        <td colSpan={2} className={styles.muted}>
                          No events recorded yet.
                        </td>
                      </tr>
                    ) : (
                      first.byEvent.map((e) => (
                        <tr key={e.name}>
                          <td>{e.name}</td>
                          <td className={styles.num}>{fmtInt(e.total)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        {/* Forms filled — Mailchimp (+ first-party) */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Forms filled</h2>
            <span className={styles.sourceTag}>
              Source: Mailchimp audience &nbsp; <Chip state={mcState} />
            </span>
          </div>

          {!mailchimp.connected ? (
            <NotConnected
              title="Connect Mailchimp to show form &amp; lead signups"
              hint={
                <>
                  Set <code>MAILCHIMP_API_KEY</code>, <code>MAILCHIMP_API_SERVER</code> and{" "}
                  <code>MAILCHIMP_AUDIENCE_ID</code>. Every newsletter / free-Handbook form already
                  posts to <code>/api/subscribe</code> → Mailchimp, so signups will appear here.
                </>
              }
            />
          ) : (
            <>
              {mailchimp.error ? (
                <p className={styles.errorBanner}>Mailchimp error: {mailchimp.error}</p>
              ) : null}
              <div className={styles.grid} style={{ marginBottom: "0.85rem" }}>
                <Kpi label="Total subscribers" value={fmtInt(mailchimp.totalSubscribers)} sub="Currently subscribed" />
                <Kpi
                  label={`New signups (${mailchimp.windowDays}d)`}
                  value={fmtInt(mailchimp.newSignupsWindow)}
                  sub="Opt-ins via forms"
                />
                <Kpi label="Total contacts" value={fmtInt(mailchimp.totalContacts)} sub="All-time audience" />
                <Kpi
                  label="Form-fill events"
                  value={firstOk ? fmtInt(firstPartyLeads) : "—"}
                  sub="First-party Lead events"
                  muted={!firstOk}
                />
              </div>

              {mailchimp.series.some((d) => d.count > 0) ? (
                <div className={styles.card} style={{ marginBottom: "0.85rem" }}>
                  <p className={styles.kpiLabel}>Signups — last {mailchimp.series.length} days</p>
                  <div className={styles.spark}>
                    {mailchimp.series.map((d) => (
                      <div
                        key={d.date}
                        className={styles.sparkBar}
                        style={{ height: `${(d.count / mcSeriesMax) * 100}%` }}
                        title={`${d.date}: ${d.count}`}
                      />
                    ))}
                  </div>
                  <div className={styles.sparkLabels}>
                    <span>{mailchimp.series[0]?.date}</span>
                    <span>{mailchimp.series[mailchimp.series.length - 1]?.date}</span>
                  </div>
                </div>
              ) : null}

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Recent signup</th>
                      <th className={styles.num}>When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mailchimp.recent.length === 0 ? (
                      <tr>
                        <td colSpan={2} className={styles.muted}>
                          No signups yet.
                        </td>
                      </tr>
                    ) : (
                      mailchimp.recent.map((r, i) => (
                        <tr key={i}>
                          <td>{r.email}</td>
                          <td className={styles.num}>
                            {Number.isFinite(r.ms) ? fmtWhen(r.ms) : "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        {/* Pixels & events installed (always available — read from config) */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Pixels installed</h2>
            <span className={styles.sourceTag}>Source: site configuration</span>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Pixel ID</th>
                  <th>Scope</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {PIXELS.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className={styles.pill}>{p.provider}</span> {p.label}
                    </td>
                    <td className={styles.mono}>{p.id}</td>
                    <td className={styles.muted}>{p.scope}</td>
                    <td>{p.active ? <Chip state="live" /> : <Chip state="off" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Events fired */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Events being tracked</h2>
            <span className={styles.sourceTag}>Sent to Meta + first-party collector</span>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Type</th>
                  <th>Fires when</th>
                  <th>Where</th>
                </tr>
              </thead>
              <tbody>
                {TRACKED_EVENTS.map((e) => (
                  <tr key={e.name}>
                    <td className={styles.mono}>{e.name}</td>
                    <td>
                      <span className={styles.pill}>{e.kind}</span>
                    </td>
                    <td className={styles.muted}>{e.when}</td>
                    <td className={styles.muted}>{e.where}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className={styles.footerNote}>
          <strong>How the numbers are sourced.</strong> Ad impressions, clicks, CTR, CPC and spend
          come from the Meta Marketing API for your ad account. Conversions, revenue and per-book
          sales come from Stripe (successful, non-refunded charges; books attributed from each
          order&apos;s metadata). Forms filled / lead signups come from your Mailchimp audience. Page
          views and button/action clicks come from a first-party collector that mirrors every pixel
          event to our own store. Anything marked <em>Not connected</em> simply needs its credentials
          added in the environment — until then it shows a dash, never a made-up figure.
        </p>
      </div>
    </main>
  );
}

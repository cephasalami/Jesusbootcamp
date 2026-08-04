import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  Activity,
  BarChart3,
  BookOpen,
  CircleDollarSign,
  Database,
  Gauge,
  LayoutDashboard,
  Mail,
  Megaphone,
  MousePointer2,
  ReceiptText,
  ShieldCheck,
  Users,
} from "lucide-react";
import { verifySessionToken, TRACKING_COOKIE } from "@/lib/tracking-auth";
import { readStripeMetrics } from "@/lib/tracking/stripe-metrics";
import { readMetaAds } from "@/lib/tracking/meta-ads";
import { readFirstParty } from "@/lib/tracking/events-store";
import { readMailchimpMetrics } from "@/lib/tracking/mailchimp-metrics";
import { readMailchimpCampaignMetrics } from "@/lib/tracking/mailchimp-campaign-metrics";
import { readMaterialAccessMetrics, type MaterialAccessFormat } from "@/lib/tracking/material-access";
import { getManifest } from "@/lib/manifest";
import { FORMAT_LABELS } from "@/lib/access";
import Toolbar from "./Toolbar";
import styles from "./tracking.module.css";

export const dynamic = "force-dynamic";

type SourceState = "live" | "off" | "err";

const fmtInt = (value: number) => Math.round(value).toLocaleString("en-US");
const fmtPct = (value: number) => `${value.toFixed(2)}%`;
const fmtUsdCents = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function fmtMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function fmtWhen(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtSentAt(ms: number | null): string {
  if (ms == null) return "—";
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function materialFormatLabel(format: MaterialAccessFormat): string {
  return format === "quiz" ? "Quiz" : FORMAT_LABELS[format];
}

function sourceState(connected: boolean, error?: string): SourceState {
  return !connected ? "off" : error ? "err" : "live";
}

function SourceBadge({ state }: { state: SourceState }) {
  const label = state === "live" ? "Live" : state === "err" ? "Needs attention" : "Not connected";
  return <span className={`${styles.sourceBadge} ${styles[`source${state}`]}`}>{label}</span>;
}

function MetricCard({
  icon,
  label,
  value,
  detail,
  muted = false,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  muted?: boolean;
  accent?: boolean;
}) {
  return (
    <article className={`${styles.metricCard} ${accent ? styles.metricCardAccent : ""}`}>
      <div className={styles.metricHead}>
        <span className={styles.metricIcon}>{icon}</span>
        <span className={styles.metricLabel}>{label}</span>
      </div>
      <strong className={`${styles.metricValue} ${muted ? styles.metricMuted : ""}`}>{value}</strong>
      <span className={styles.metricDetail}>{detail}</span>
    </article>
  );
}

function SectionHeading({
  icon,
  title,
  subtitle,
  state,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  state: SourceState;
}) {
  return (
    <div className={styles.sectionHeading}>
      <span className={styles.sectionIcon}>{icon}</span>
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <SourceBadge state={state} />
    </div>
  );
}

function EmptySource({ title, hint }: { title: string; hint: React.ReactNode }) {
  return (
    <div className={styles.emptySource}>
      <strong>{title}</strong>
      <p>{hint}</p>
    </div>
  );
}

function ActivityBars({
  series,
  label,
  emptyLabel,
}: {
  series: Array<{ date: string; count: number }>;
  label: string;
  emptyLabel: string;
}) {
  if (series.length === 0) return <p className={styles.chartEmpty}>{emptyLabel}</p>;
  const max = Math.max(1, ...series.map((day) => day.count));
  return (
    <div className={styles.chart} aria-label={label}>
      <div className={styles.chartBars}>
        {series.map((day) => (
          <span
            key={day.date}
            className={styles.chartBar}
            style={{ height: `${Math.max(3, (day.count / max) * 100)}%` }}
            title={`${day.date}: ${day.count}`}
          />
        ))}
      </div>
      <div className={styles.chartAxis}>
        <span>{series[0]?.date}</span>
        <span>{series[series.length - 1]?.date}</span>
      </div>
    </div>
  );
}

export default async function TrackingDashboard() {
  const cookieStore = await cookies();
  if (!verifySessionToken(cookieStore.get(TRACKING_COOKIE)?.value)) {
    redirect("/tracking/login");
  }

  const [stripe, meta, first, mailchimp, campaignReports, materials, classes] = await Promise.all([
    readStripeMetrics(),
    readMetaAds(),
    readFirstParty(),
    readMailchimpMetrics(),
    readMailchimpCampaignMetrics(),
    readMaterialAccessMetrics(),
    getManifest(),
  ]);

  const stripeOk = stripe.connected && !stripe.error;
  const metaOk = meta.connected && !meta.error;
  const firstOk = first.connected && !first.error;
  const campaignsOk = campaignReports.connected && !campaignReports.error;
  const materialsOk = materials.connected && !materials.error;

  const stripeState = sourceState(stripe.connected, stripe.error);
  const metaState = sourceState(meta.connected, meta.error);
  const firstState = sourceState(first.connected, first.error);
  const mailchimpState = sourceState(mailchimp.connected, mailchimp.error);
  const campaignState = sourceState(campaignReports.connected, campaignReports.error);
  const materialState = sourceState(materials.connected, materials.error);

  const totalBookUnits = stripeOk ? stripe.bookSales.reduce((sum, book) => sum + book.units, 0) : 0;
  const firstPartyLeads = firstOk ? first.byEvent.find((event) => event.name === "Lead")?.total ?? 0 : 0;
  const classTitles = new Map(classes.map((klass) => [klass.slug, klass.title]));
  const materialClasses = materials.byClass
    .map((klass) => ({
      ...klass,
      title: classTitles.get(klass.classSlug) ?? `Class ${klass.classSlug.toUpperCase()}`,
      opened: klass.formats.reduce((sum, format) => sum + format.opened, 0),
    }))
    .sort((a, b) => a.classSlug.localeCompare(b.classSlug, undefined, { numeric: true }));
  const mostAccessedClass = [...materialClasses].sort((a, b) => b.opened - a.opened)[0] ?? null;
  const leastAccessedClass = [...materialClasses].sort((a, b) => a.opened - b.opened)[0] ?? null;
  const mostOpenedEmail = [...campaignReports.campaigns].sort((a, b) => b.opens - a.opens)[0] ?? null;
  const leastOpenedEmail = [...campaignReports.campaigns].sort((a, b) => a.opens - b.opens)[0] ?? null;
  const aov = stripeOk && stripe.conversions > 0 ? stripe.revenueCents / stripe.conversions : null;
  const costPerConversion = stripeOk && metaOk && stripe.conversions > 0 ? meta.spend / stripe.conversions : null;
  const conversionRate = stripeOk && metaOk && meta.clicks > 0 ? (stripe.conversions / meta.clicks) * 100 : null;
  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? "morning" : greetingHour < 18 ? "afternoon" : "evening";
  const updated = new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

  const sources = [
    { label: "Course access log", state: materialState, note: "KV event counters" },
    { label: "Mailchimp campaigns", state: campaignState, note: "Sent email reports" },
    { label: "Mailchimp audience", state: mailchimpState, note: "Subscribers and signups" },
    { label: "First-party events", state: firstState, note: "Page and action events" },
    { label: "Stripe", state: stripeState, note: "Paid, non-refunded charges" },
    { label: "Meta Ads", state: metaState, note: "Advertising performance" },
  ];

  return (
    <main className={styles.page}>
      <div className={styles.appShell}>
        <aside className={styles.sidebar}>
          <a className={styles.brand} href="#overview" aria-label="Jesus Boot Camp dashboard overview">
            <span className={styles.brandMark}>J</span>
            <span>
              <strong>Jesus Boot Camp</strong>
              <small>Owner dashboard</small>
            </span>
          </a>
          <nav className={styles.sideNav} aria-label="Dashboard sections">
            <a className={styles.sideNavCurrent} href="#overview"><LayoutDashboard size={17} />Overview</a>
            <a href="#materials"><BookOpen size={17} />Course access</a>
            <a href="#campaigns"><Mail size={17} />Email performance</a>
            <a href="#growth"><Activity size={17} />Growth</a>
            <a href="#sales"><CircleDollarSign size={17} />Sales</a>
            <a href="#sources"><Database size={17} />Data sources</a>
          </nav>
          <div className={styles.sideNote}>
            <ShieldCheck size={17} />
            <span>Private, password-protected reporting. No dashboard figure is estimated.</span>
          </div>
        </aside>

        <div className={styles.workspace}>
          <header className={styles.topbar}>
            <div className={styles.breadcrumb}><Gauge size={15} /> Live reporting <span>•</span> Last refreshed {updated}</div>
            <Toolbar />
          </header>

          <div className={styles.content}>
            <section id="overview" className={styles.hero}>
              <div className={styles.heroCopy}>
                <p className={styles.eyebrow}>Performance overview</p>
                <h1>Good {greeting}, team.</h1>
                <p>Course participation, email engagement, audience growth, sales and acquisition in one protected place.</p>
              </div>
              <div className={styles.heroStatus}>
                <span className={styles.liveDot} /> Live sources refresh as new provider data becomes available
              </div>
            </section>

            <section className={styles.overviewGrid} aria-label="Live performance snapshot">
              <MetricCard icon={<BookOpen size={16} />} label="Material opens" value={materialsOk ? fmtInt(materials.totalOpened) : "—"} detail={materialsOk ? "Successful opens and downloads" : "Course access log not connected"} muted={!materialsOk} accent />
              <MetricCard icon={<Mail size={16} />} label="Email opens" value={campaignsOk ? fmtInt(campaignReports.totalOpens) : "—"} detail={campaignsOk ? "Unique opens across sent campaigns" : "Mailchimp reports not connected"} muted={!campaignsOk} />
              <MetricCard icon={<MousePointer2 size={16} />} label="Website page views" value={firstOk ? fmtInt(first.pageViews) : "—"} detail={firstOk ? "All-time first-party events" : "First-party events not connected"} muted={!firstOk} />
              <MetricCard icon={<ReceiptText size={16} />} label="Revenue" value={stripeOk ? fmtUsdCents(stripe.revenueCents) : "—"} detail={stripeOk ? "Successful charges in the last 30 days" : "Stripe not connected"} muted={!stripeOk} />
            </section>

            <section className={styles.dashboardGrid}>
              <article className={`${styles.panel} ${styles.activityPanel}`}>
                <div className={styles.panelHead}>
                  <div>
                    <p className={styles.panelLabel}>On-site activity</p>
                    <h2>Event volume</h2>
                  </div>
                  <SourceBadge state={firstState} />
                </div>
                {first.connected && !first.error ? (
                  <>
                    <div className={styles.activityFigures}>
                      <strong>{fmtInt(first.totalEvents)}</strong>
                      <span>tracked events all-time</span>
                    </div>
                    <ActivityBars series={first.series} label="First-party events over recent days" emptyLabel="No first-party activity has been recorded yet." />
                  </>
                ) : (
                  <EmptySource title="On-site activity is not available" hint={<>Connect the existing KV store to record <code>PageView</code>, lead and action events.</>} />
                )}
              </article>

              <article className={styles.panel}>
                <div className={styles.panelHead}>
                  <div>
                    <p className={styles.panelLabel}>Course engagement</p>
                    <h2>Access focus</h2>
                  </div>
                  <SourceBadge state={materialState} />
                </div>
                <div className={styles.focusList}>
                  <div><span>Most accessed</span><strong>{mostAccessedClass ? `Class ${mostAccessedClass.classSlug.toUpperCase()}` : "—"}</strong><small>{mostAccessedClass ? `${fmtInt(mostAccessedClass.opened)} opens · ${mostAccessedClass.title}` : "No access data yet"}</small></div>
                  <div><span>Least accessed</span><strong>{leastAccessedClass ? `Class ${leastAccessedClass.classSlug.toUpperCase()}` : "—"}</strong><small>{leastAccessedClass ? `${fmtInt(leastAccessedClass.opened)} opens · ${leastAccessedClass.title}` : "No access data yet"}</small></div>
                  <div><span>Failed attempts</span><strong>{materialsOk ? fmtInt(materials.totalFailed) : "—"}</strong><small>{materialsOk ? "Logged after validation or delivery failure" : "Course access log not connected"}</small></div>
                </div>
              </article>

              <article className={styles.panel}>
                <div className={styles.panelHead}>
                  <div>
                    <p className={styles.panelLabel}>Email performance</p>
                    <h2>Campaign leader</h2>
                  </div>
                  <SourceBadge state={campaignState} />
                </div>
                <div className={styles.emailLeader}>
                  <span className={styles.leaderIcon}><Mail size={20} /></span>
                  <div>
                    <strong>{mostOpenedEmail?.title ?? "No sent campaigns yet"}</strong>
                    <p>{mostOpenedEmail ? `${fmtInt(mostOpenedEmail.opens)} unique opens · ${fmtPct(mostOpenedEmail.openRate)} open rate` : "Mailchimp report data will appear here."}</p>
                  </div>
                </div>
                <div className={styles.miniStats}>
                  <span><strong>{campaignsOk ? fmtInt(campaignReports.totalCampaigns) : "—"}</strong>sent campaigns</span>
                  <span><strong>{campaignsOk ? fmtInt(campaignReports.totalClicks) : "—"}</strong>unique clicks</span>
                </div>
              </article>
            </section>

            <section id="materials" className={styles.dataSection}>
              <SectionHeading icon={<BookOpen size={18} />} title="Course material access" subtitle="Every successful or failed learner access attempt, aggregated by class and format." state={materialState} />
              {!materials.connected ? (
                <EmptySource title="Material logging needs the existing KV store" hint={<>Set <code>UPSTASH_REDIS_REST_URL</code> and <code>UPSTASH_REDIS_REST_TOKEN</code> (or Vercel&apos;s <code>KV_REST_API_*</code> values).</>} />
              ) : materials.error ? (
                <p className={styles.errorBanner}>Course access log error: {materials.error}</p>
              ) : (
                <div className={styles.tableCard}>
                  <div className={styles.tableMeta}><span>{fmtInt(materials.totalOpened)} successful opens</span><span>{fmtInt(materials.totalFailed)} failed attempts</span></div>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead><tr><th>Class</th><th>Material</th><th className={styles.num}>Opened</th><th className={styles.num}>Failed</th></tr></thead>
                      <tbody>
                        {materialClasses.length === 0 ? <tr><td colSpan={4} className={styles.emptyCell}>No course material access has been recorded yet.</td></tr> : materialClasses.flatMap((klass) => klass.formats.map((format, index) => (
                          <tr key={`${klass.classSlug}-${format.format}`}>
                            <td>{index === 0 ? <><strong>Class {klass.classSlug.toUpperCase()}</strong><small>{klass.title}</small></> : null}</td>
                            <td>{materialFormatLabel(format.format)}</td><td className={styles.num}>{fmtInt(format.opened)}</td><td className={styles.num}>{fmtInt(format.failed)}</td>
                          </tr>
                        )))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>

            <section id="campaigns" className={styles.dataSection}>
              <SectionHeading icon={<Mail size={18} />} title="Sent email campaigns" subtitle="Real Mailchimp campaign report data, cached server-side for 15 minutes." state={campaignState} />
              {!campaignReports.connected ? (
                <EmptySource title="Mailchimp campaign reporting is not connected" hint={<>Set <code>MAILCHIMP_API_KEY</code>, <code>MAILCHIMP_API_SERVER</code> and <code>MAILCHIMP_AUDIENCE_ID</code>.</>} />
              ) : campaignReports.error ? (
                <p className={styles.errorBanner}>Mailchimp campaign report error: {campaignReports.error}</p>
              ) : (
                <div className={styles.tableCard}>
                  <div className={styles.tableMeta}><span>{fmtInt(campaignReports.totalCampaigns)} sent campaigns</span><span>{fmtInt(campaignReports.totalOpens)} unique opens</span><span>{fmtInt(campaignReports.totalClicks)} unique clicks</span><span>{campaignReports.cachedAt ? `Cached ${fmtWhen(campaignReports.cachedAt)}` : "Refreshing report cache"}</span></div>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead><tr><th>Sent email</th><th>Sent</th><th className={styles.num}>Recipients</th><th className={styles.num}>Opens</th><th className={styles.num}>Open rate</th><th className={styles.num}>Clicks</th><th className={styles.num}>Click rate</th></tr></thead>
                      <tbody>{campaignReports.campaigns.length === 0 ? <tr><td colSpan={7} className={styles.emptyCell}>No sent Mailchimp campaigns found yet.</td></tr> : campaignReports.campaigns.map((campaign) => <tr key={campaign.id}><td className={styles.campaignName}>{campaign.title}</td><td>{fmtSentAt(campaign.sentAt)}</td><td className={styles.num}>{fmtInt(campaign.emailsSent)}</td><td className={styles.num}>{fmtInt(campaign.opens)}</td><td className={styles.num}>{fmtPct(campaign.openRate)}</td><td className={styles.num}>{fmtInt(campaign.clicks)}</td><td className={styles.num}>{fmtPct(campaign.clickRate)}</td></tr>)}</tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>

            <section id="growth" className={styles.twoColumnSection}>
              <article className={styles.dataCard}>
                <SectionHeading icon={<Users size={18} />} title="Audience growth" subtitle="Mailchimp audience and opt-in activity." state={mailchimpState} />
                {!mailchimp.connected ? <EmptySource title="Audience data is not connected" hint={<>Connect Mailchimp to read real subscriber and signup figures.</>} /> : mailchimp.error ? <p className={styles.errorBanner}>Mailchimp audience error: {mailchimp.error}</p> : <>
                  <div className={styles.inlineMetrics}><MetricCard icon={<Users size={15} />} label="Subscribers" value={fmtInt(mailchimp.totalSubscribers)} detail="Currently subscribed" /><MetricCard icon={<Mail size={15} />} label="New signups" value={fmtInt(mailchimp.newSignupsWindow)} detail={`Last ${mailchimp.windowDays} days`} /><MetricCard icon={<MousePointer2 size={15} />} label="Form events" value={firstOk ? fmtInt(firstPartyLeads) : "—"} detail="First-party lead signals" muted={!firstOk} /></div>
                  <ActivityBars series={mailchimp.series} label="Mailchimp signups over recent days" emptyLabel="No recent signup activity has been reported." />
                </>}
              </article>

              <article className={styles.dataCard}>
                <SectionHeading icon={<Megaphone size={18} />} title="Acquisition" subtitle="Meta advertising and site action performance." state={metaState} />
                {!meta.connected ? <EmptySource title="Meta Ads is not connected" hint={<>Set <code>META_ACCESS_TOKEN</code> and <code>META_AD_ACCOUNT_ID</code> to load real ad delivery data.</>} /> : meta.error ? <p className={styles.errorBanner}>Meta Ads error: {meta.error}</p> : <div className={styles.inlineMetrics}><MetricCard icon={<BarChart3 size={15} />} label="Impressions" value={fmtInt(meta.impressions)} detail="Last 30 days" /><MetricCard icon={<MousePointer2 size={15} />} label="Ad clicks" value={fmtInt(meta.clicks)} detail={`CTR ${fmtPct(meta.ctr)}`} /><MetricCard icon={<CircleDollarSign size={15} />} label="Spend" value={fmtMoney(meta.spend, meta.currency)} detail={costPerConversion != null ? `${fmtMoney(costPerConversion, meta.currency)} per conversion` : "No conversion cost yet"} /><MetricCard icon={<Gauge size={15} />} label="Ad to sale" value={conversionRate != null ? fmtPct(conversionRate) : "—"} detail="Stripe conversions divided by ad clicks" muted={conversionRate == null} /></div>}
              </article>
            </section>

            <section id="sales" className={styles.twoColumnSection}>
              <article className={styles.dataCard}>
                <SectionHeading icon={<CircleDollarSign size={18} />} title="Sales and revenue" subtitle="Successful, non-refunded Stripe charges from the last 30 days." state={stripeState} />
                {!stripe.connected ? <EmptySource title="Stripe is not connected" hint={<>Set <code>STRIPE_SECRET_KEY</code> to load sales and revenue.</>} /> : stripe.error ? <p className={styles.errorBanner}>Stripe error: {stripe.error}</p> : <div className={styles.inlineMetrics}><MetricCard icon={<ReceiptText size={15} />} label="Conversions" value={fmtInt(stripe.conversions)} detail="Successful charges" /><MetricCard icon={<CircleDollarSign size={15} />} label="Revenue" value={fmtUsdCents(stripe.revenueCents)} detail={`${fmtUsdCents(stripe.today.revenueCents)} today`} /><MetricCard icon={<Gauge size={15} />} label="Average order" value={aov != null ? fmtUsdCents(aov) : "—"} detail="Revenue divided by conversions" muted={aov == null} /><MetricCard icon={<BookOpen size={15} />} label="Books sold" value={fmtInt(totalBookUnits)} detail="Units in this period" /></div>}
              </article>

              <article className={styles.dataCard}>
                <SectionHeading icon={<ReceiptText size={18} />} title="Book sales" subtitle="Units attributed from the real Stripe order metadata." state={stripeState} />
                {!stripeOk ? <EmptySource title="Book sales require Stripe" hint={<>Connect Stripe to attribute main products, order bumps and upsells.</>} /> : <div className={styles.tableWrap}><table className={`${styles.table} ${styles.compactTable}`}><thead><tr><th>Book</th><th className={styles.num}>Units</th><th className={styles.num}>Share</th></tr></thead><tbody>{stripe.bookSales.length === 0 ? <tr><td colSpan={3} className={styles.emptyCell}>No book sales in the last 30 days.</td></tr> : stripe.bookSales.map((book) => <tr key={book.slug}><td>{book.title}</td><td className={styles.num}>{fmtInt(book.units)}</td><td className={styles.num}>{totalBookUnits > 0 ? fmtPct((book.units / totalBookUnits) * 100) : "—"}</td></tr>)}</tbody></table></div>}
              </article>
            </section>

            <section id="sources" className={styles.dataSection}>
              <SectionHeading icon={<Database size={18} />} title="Data-source health" subtitle="Every dashboard value is read from these real sources. Unavailable sources never show invented values." state="live" />
              <div className={styles.sourceGrid}>{sources.map((source) => <article key={source.label} className={styles.sourceCard}><div><strong>{source.label}</strong><span>{source.note}</span></div><SourceBadge state={source.state} /></article>)}</div>
              {leastOpenedEmail ? <p className={styles.footnote}>Lowest current email open count: <strong>{leastOpenedEmail.title}</strong> ({fmtInt(leastOpenedEmail.opens)} unique opens).</p> : null}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

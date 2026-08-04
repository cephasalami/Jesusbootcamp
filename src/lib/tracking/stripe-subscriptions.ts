// src/lib/tracking/stripe-subscriptions.ts — SERVER-ONLY.
//
// The monthly partnership gifts created by /partner/join are Stripe
// Subscriptions, so they never show up fully in a one-off charge report: a
// subscription that renews next week is real committed income today. This reads
// them straight from Stripe with the key the checkout already uses.
//
// Amounts come from the subscription's own items (preset tier price OR the
// inline `price_data` used for an "any amount" gift), normalised to a monthly
// figure so yearly/weekly prices could never silently distort MRR.

import type Stripe from "stripe";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import type { PartnerSubscriptionMetrics } from "@/lib/tracking/types";

const MAX_PAGES = 5;
const PAGE_SIZE = 100;
const RECENT_LIMIT = 25;

const ACTIVE = new Set(["active", "trialing"]);
const AT_RISK = new Set(["past_due", "unpaid", "incomplete"]);

/** Normalise any recurring price to what it bills in one month, in cents. */
function monthlyCents(item: Stripe.SubscriptionItem): number {
  const price = item.price;
  const unit = price?.unit_amount ?? 0;
  const quantity = item.quantity ?? 1;
  const recurring = price?.recurring;
  if (!recurring) return 0;
  const every = recurring.interval_count || 1;
  const perMonth =
    recurring.interval === "year"
      ? 1 / (12 * every)
      : recurring.interval === "week"
        ? 52 / (12 * every)
        : recurring.interval === "day"
          ? 365 / (12 * every)
          : 1 / every;
  return Math.round(unit * quantity * perMonth);
}

function subscriptionCents(sub: Stripe.Subscription): number {
  return sub.items.data.reduce((sum, item) => sum + monthlyCents(item), 0);
}

export async function readPartnerSubscriptions(): Promise<PartnerSubscriptionMetrics> {
  const base = {
    activeCount: 0,
    atRiskCount: 0,
    canceledCount: 0,
    mrrCents: 0,
    byAmount: [] as PartnerSubscriptionMetrics["byAmount"],
    recent: [] as PartnerSubscriptionMetrics["recent"],
    capped: false,
  };

  if (!isStripeConfigured) {
    return {
      connected: false,
      hint: "Set STRIPE_SECRET_KEY to show monthly partnership subscriptions.",
      ...base,
    };
  }

  try {
    const stripe = getStripe();
    let activeCount = 0;
    let atRiskCount = 0;
    let canceledCount = 0;
    let mrrCents = 0;
    const amounts = new Map<number, number>();
    const recent: PartnerSubscriptionMetrics["recent"] = [];

    let startingAfter: string | undefined;
    let capped = false;

    for (let page = 0; page < MAX_PAGES; page++) {
      const res = await stripe.subscriptions.list({
        status: "all",
        limit: PAGE_SIZE,
        expand: ["data.customer"],
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      });

      for (const sub of res.data) {
        const cents = subscriptionCents(sub);
        if (ACTIVE.has(sub.status)) {
          activeCount += 1;
          mrrCents += cents;
          amounts.set(cents, (amounts.get(cents) ?? 0) + 1);
        } else if (AT_RISK.has(sub.status)) {
          atRiskCount += 1;
        } else {
          canceledCount += 1;
        }

        if (recent.length < RECENT_LIMIT) {
          const customer =
            sub.customer && typeof sub.customer !== "string" && !sub.customer.deleted
              ? sub.customer
              : null;
          recent.push({
            id: sub.id,
            email: customer?.email ?? (sub.metadata?.email || null),
            name: customer?.name ?? (sub.metadata?.name || null),
            amountCents: cents,
            status: sub.status,
            createdMs: sub.created * 1000,
            cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
          });
        }
      }

      if (!res.has_more) break;
      startingAfter = res.data[res.data.length - 1]?.id;
      if (page === MAX_PAGES - 1) capped = true;
    }

    recent.sort((a, b) => b.createdMs - a.createdMs);

    return {
      connected: true,
      activeCount,
      atRiskCount,
      canceledCount,
      mrrCents,
      byAmount: Array.from(amounts, ([amountCents, count]) => ({ amountCents, count })).sort(
        (a, b) => b.amountCents - a.amountCents
      ),
      recent,
      capped,
    };
  } catch (err) {
    return {
      connected: true,
      error: err instanceof Error ? err.message : "Failed to read Stripe subscriptions",
      ...base,
    };
  }
}

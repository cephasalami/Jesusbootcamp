// src/lib/tracking/stripe-metrics.ts — SERVER-ONLY.
//
// Real conversions, revenue AND per-book sales, read live from Stripe using the
// secret key the checkout already uses. No new infrastructure.
//
// We list PaymentIntents (not charges) because the checkout writes rich metadata
// onto each PaymentIntent — `product`, `bump`, and `tags` (one purchase tag per
// book sold). That metadata is what lets us attribute sales to individual books.
// We expand `latest_charge` to get the captured/refunded amounts for accurate
// net revenue.

import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { BOOK_BY_TAG } from "@/config/products";
import type { StripeMetrics } from "@/lib/tracking/types";

const WINDOW_DAYS = 30;
const MAX_PAGES = 5; // up to 500 orders scanned — bounds dashboard latency.
const PAGE_SIZE = 100;

function startOfUtcTodayMs(): number {
  return new Date(new Date().toISOString().slice(0, 10) + "T00:00:00.000Z").getTime();
}

function parseTags(raw: unknown): string[] {
  return String(raw ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function readStripeMetrics(): Promise<StripeMetrics> {
  const base = {
    windowDays: WINDOW_DAYS,
    conversions: 0,
    revenueCents: 0,
    today: { conversions: 0, revenueCents: 0 },
    bookSales: [] as StripeMetrics["bookSales"],
    recent: [] as StripeMetrics["recent"],
    capped: false,
  };

  if (!isStripeConfigured) {
    return {
      connected: false,
      hint: "Set STRIPE_SECRET_KEY to show real conversions and revenue.",
      ...base,
    };
  }

  try {
    const stripe = getStripe();
    const gte = Math.floor((Date.now() - WINDOW_DAYS * 86_400_000) / 1000);
    const todayStartMs = startOfUtcTodayMs();

    let conversions = 0;
    let revenueCents = 0;
    let todayConversions = 0;
    let todayRevenueCents = 0;
    const recent: StripeMetrics["recent"] = [];
    // slug -> { title, units }
    const books = new Map<string, { title: string; units: number }>();

    let startingAfter: string | undefined;
    let capped = false;

    for (let page = 0; page < MAX_PAGES; page++) {
      const res = await stripe.paymentIntents.list({
        created: { gte },
        limit: PAGE_SIZE,
        expand: ["data.latest_charge"],
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      });

      for (const pi of res.data) {
        if (pi.status !== "succeeded") continue;

        const charge =
          pi.latest_charge && typeof pi.latest_charge !== "string" ? pi.latest_charge : null;
        const captured = charge?.amount_captured ?? pi.amount_received ?? pi.amount;
        const net = Math.max(0, captured - (charge?.amount_refunded ?? 0));
        const createdMs = pi.created * 1000;

        conversions += 1;
        revenueCents += net;
        if (createdMs >= todayStartMs) {
          todayConversions += 1;
          todayRevenueCents += net;
        }

        // Attribute one unit per purchase tag to the matching book. Non-book
        // tags (e.g. the general buyer/segmentation tag) are skipped so they
        // don't show up as phantom rows in the Book sales panel.
        const tags = parseTags(pi.metadata?.tags);
        const titles: string[] = [];
        for (const tag of tags) {
          const book = BOOK_BY_TAG[tag];
          if (!book) continue;
          titles.push(book.title);
          const entry = books.get(book.slug) ?? { title: book.title, units: 0 };
          entry.units += 1;
          books.set(book.slug, entry);
        }

        if (recent.length < 8) {
          recent.push({
            amountCents: net,
            createdMs,
            email:
              pi.receipt_email ??
              charge?.billing_details?.email ??
              (typeof pi.metadata?.email === "string" ? pi.metadata.email : null),
            description:
              titles.length > 0 ? titles.join(" + ") : charge?.description ?? pi.description ?? null,
          });
        }
      }

      if (!res.has_more) break;
      startingAfter = res.data[res.data.length - 1]?.id;
      if (page === MAX_PAGES - 1) capped = true;
    }

    recent.sort((a, b) => b.createdMs - a.createdMs);

    const bookSales = Array.from(books.entries())
      .map(([slug, v]) => ({ slug, title: v.title, units: v.units }))
      .sort((a, b) => b.units - a.units);

    return {
      connected: true,
      windowDays: WINDOW_DAYS,
      conversions,
      revenueCents,
      today: { conversions: todayConversions, revenueCents: todayRevenueCents },
      bookSales,
      recent,
      capped,
    };
  } catch (err) {
    return {
      connected: true,
      error: err instanceof Error ? err.message : "Failed to read Stripe",
      ...base,
    };
  }
}

// src/lib/meta-capi.ts — SERVER-ONLY Meta Conversions API (CAPI).
//
// Fires a server-side Purchase event straight to Meta from the Stripe webhook,
// so a conversion is recorded even when the browser pixel never fires — e.g. a
// delayed/redirect payment that settles after the buyer closed the tab, or a
// visitor with an ad blocker. It uses `event_id = PaymentIntent.id`, identical
// to the client pixel's `eventID`, so Meta DEDUPLICATES the browser and server
// events into a single conversion (no double-counting).
//
// Setup: create a Conversions API access token for the pixel in Meta Events
// Manager and set META_CAPI_TOKEN. No-ops (safe) when it isn't configured.

import { createHash } from "node:crypto";
import type Stripe from "stripe";
import { META_PIXEL_ID, META_GRAPH_VERSION } from "@/config/pixels";
import { BOOK_BY_TAG } from "@/config/products";

const TOKEN = process.env.META_CAPI_TOKEN;

export const isMetaCapiConfigured = Boolean(TOKEN && META_PIXEL_ID);

/** Meta requires PII to be SHA-256 hashed, lower-cased and trimmed. */
function hash(value: string): string {
    return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

/**
 * Send a Purchase to the Conversions API for a succeeded PaymentIntent (works
 * for both the main order and the one-click upsell). Best-effort: never throws.
 */
export async function sendCapiPurchase(pi: Stripe.PaymentIntent): Promise<void> {
    if (!isMetaCapiConfigured) return;
    try {
        const email =
            pi.receipt_email ??
            (typeof pi.metadata?.email === "string" ? pi.metadata.email : undefined);

        const contentIds = String(pi.metadata?.tags ?? "")
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
            .map((tag) => BOOK_BY_TAG[tag]?.slug)
            .filter(Boolean) as string[];

        const body = {
            data: [
                {
                    event_name: "Purchase",
                    event_time: pi.created, // unix seconds
                    event_id: pi.id, // dedup with the client pixel's eventID
                    action_source: "website",
                    event_source_url: "https://jesusbootcamp.org/checkout",
                    user_data: email ? { em: [hash(email)] } : {},
                    custom_data: {
                        currency: (pi.currency || "usd").toUpperCase(),
                        value: (pi.amount_received ?? pi.amount) / 100,
                        content_type: "product",
                        ...(contentIds.length
                            ? { content_ids: contentIds, num_items: contentIds.length }
                            : {}),
                    },
                },
            ],
        };

        const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${META_PIXEL_ID}/events?access_token=${TOKEN}`;
        await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            cache: "no-store",
        });
    } catch {
        // Best-effort — a CAPI failure must never break Stripe fulfillment.
    }
}

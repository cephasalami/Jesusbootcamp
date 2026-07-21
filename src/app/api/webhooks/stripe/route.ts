import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { tagPurchase } from "@/lib/mailchimp";
import { sendCapiPurchase } from "@/lib/meta-capi";

// PART 5 — Fulfillment. Verify the Stripe signature, then on a successful
// PaymentIntent apply the purchase tags in Mailchimp (a Mailchimp automation
// keyed on those tags sends the delivery email). Handles BOTH the main order
// and the one-click upsell, since both fire payment_intent.succeeded.
//
// Signature verification needs the RAW body — App Router route handlers give it
// via `await req.text()`, so no body-parser config is required.
export async function POST(req: Request) {
    if (!isStripeConfigured) {
        return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
    }
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
        return NextResponse.json({ error: "Webhook secret is not configured" }, { status: 500 });
    }
    const stripe = getStripe();

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
        return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
        const rawBody = await req.text();
        event = stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch (err) {
        const message = err instanceof Error ? err.message : "invalid";
        return NextResponse.json({ error: `Signature verification failed: ${message}` }, { status: 400 });
    }

    if (event.type === "payment_intent.succeeded") {
        const pi = event.data.object as Stripe.PaymentIntent;
        const email = pi.receipt_email ?? pi.metadata?.email ?? "";
        const name = pi.metadata?.name;
        const tags = String(pi.metadata?.tags ?? "")
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);

        // Server-side Meta Purchase (Conversions API). Best-effort, deduped
        // against the browser pixel by event_id = PI id. Fires for BOTH the main
        // order and the one-click upsell (both emit payment_intent.succeeded).
        // Also recovers conversions the client pixel misses (ad blockers, delayed
        // payments where the buyer already left the confirmation page).
        await sendCapiPurchase(pi);

        if (email && tags.length) {
            try {
                await tagPurchase({ email, name, tags });
            } catch (err) {
                // 500 tells Stripe to retry so a transient Mailchimp failure
                // doesn't silently drop a delivery.
                const message = err instanceof Error ? err.message : "fulfillment error";
                return NextResponse.json({ error: message }, { status: 500 });
            }
        }
    }

    return NextResponse.json({ received: true });
}

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { tagPurchase, activatePartner, deactivatePartner } from "@/lib/mailchimp";
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

    // Confirms the endpoint is actually reached in prod (the #1 suspect for the
    // "paid but no email" bug). Visible in Vercel logs and Stripe's event dashboard.
    console.log(`[webhook] received ${event.type} (${event.id})`);

    // ── Book checkout (one-time) ─────────────────────────────────────────────
    // Only genuine book intents (`kind` main/upsell) are book orders. A
    // partnership subscription's first invoice ALSO emits payment_intent.succeeded
    // — we must NOT fulfill or fire a Meta "Purchase" for those; they're handled
    // by the invoice.paid branch below.
    if (event.type === "payment_intent.succeeded") {
        const pi = event.data.object as Stripe.PaymentIntent;
        const kind = pi.metadata?.kind;
        if (kind === "main" || kind === "upsell") {
            const email = pi.receipt_email ?? pi.metadata?.email ?? "";
            const name = pi.metadata?.name;
            const tags = String(pi.metadata?.tags ?? "")
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean);

            // Server-side Meta Purchase (Conversions API). Best-effort, deduped
            // against the browser pixel by event_id = PI id. Fires for BOTH the
            // main order and the one-click upsell. Also recovers conversions the
            // client pixel misses (ad blockers, delayed payments where the buyer
            // already left the confirmation page).
            await sendCapiPurchase(pi);

            if (email && tags.length) {
                try {
                    await tagPurchase({ email, name, tags });
                    console.log(`[webhook] tagged ${email} with [${tags.join(", ")}] (kind=${kind})`);
                } catch (err) {
                    // 500 tells Stripe to retry so a transient Mailchimp failure
                    // doesn't silently drop a delivery. Logged loudly so a failed
                    // tag write is never swallowed.
                    const message = err instanceof Error ? err.message : "fulfillment error";
                    console.error(`[webhook] Mailchimp tag write FAILED for ${email}: ${message}`);
                    return NextResponse.json({ error: message }, { status: 500 });
                }
            } else {
                console.warn(
                    `[webhook] ${kind} PI ${pi.id} not tagged — email=${Boolean(email)} tags=${tags.length}`
                );
            }
        }
    }

    // ── Partnership subscription: ACTIVATE ───────────────────────────────────
    // invoice.paid fires for the first charge (billing_reason
    // "subscription_create") AND every renewal ("subscription_cycle"). Re-asserting
    // the tags each cycle is intentional and idempotent — it also self-heals a
    // partner who was revoked after a failed payment and has now paid again.
    if (event.type === "invoice.paid") {
        const invoice = event.data.object as Stripe.Invoice;
        const details = invoice.parent?.subscription_details;
        const meta = details?.metadata ?? null;
        if (meta?.source === "partner") {
            const email = (meta.email || invoice.customer_email || "").trim();
            const tier = meta.tier || "";
            const name = meta.name || invoice.customer_name || undefined;
            // `amount` metadata is in cents — record the actual monthly gift in dollars.
            const amountCents = meta.amount ? Number(meta.amount) : NaN;
            const amount = Number.isFinite(amountCents) ? String(amountCents / 100) : undefined;
            const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
            if (email && tier) {
                try {
                    await activatePartner({ email, name, tier, amount, stripeCustomerId: customerId });
                    console.log(`[webhook] partner activated ${email} tier=${tier} amount=${amount}`);
                } catch (err) {
                    const message = err instanceof Error ? err.message : "partner activation error";
                    return NextResponse.json({ error: message }, { status: 500 });
                }
            }
        }
    }

    // ── Partnership subscription: REVOKE on cancellation ─────────────────────
    if (event.type === "customer.subscription.deleted") {
        const sub = event.data.object as Stripe.Subscription;
        if (sub.metadata?.source === "partner") {
            const email = (sub.metadata.email || "").trim();
            if (email) {
                try {
                    await deactivatePartner({ email });
                } catch (err) {
                    const message = err instanceof Error ? err.message : "partner revoke error";
                    return NextResponse.json({ error: message }, { status: 500 });
                }
            }
        }
    }

    // ── Partnership subscription: REVOKE on terminal payment failure ─────────
    // invoice.payment_failed fires on EACH failed attempt. We only revoke once
    // Stripe has exhausted its retries (next_payment_attempt === null) — the
    // spec's "repeated failure", not a single soft decline mid-dunning.
    if (event.type === "invoice.payment_failed") {
        const invoice = event.data.object as Stripe.Invoice;
        const details = invoice.parent?.subscription_details;
        const meta = details?.metadata ?? null;
        if (meta?.source === "partner" && invoice.next_payment_attempt === null) {
            const email = (meta.email || invoice.customer_email || "").trim();
            if (email) {
                try {
                    await deactivatePartner({ email });
                } catch (err) {
                    const message = err instanceof Error ? err.message : "partner revoke error";
                    return NextResponse.json({ error: message }, { status: 500 });
                }
            }
        }
    }

    return NextResponse.json({ received: true });
}

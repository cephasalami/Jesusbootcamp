import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import {
    PARTNER_CURRENCY,
    PARTNER_INTERVAL,
    getPartnerTier,
    partnerPriceId,
    partnerProductId,
    isValidCustomAmountCents,
} from "@/config/partner";

// Called when the partner clicks "Partner With Us" on /partner/join. Creates a
// Customer + a monthly Subscription with `payment_behavior: default_incomplete`,
// then returns the first invoice's client_secret so the embedded Payment Element
// can confirm the first charge inline (deferred-intent flow — no redirect).
//
// FIX 8 — accepts EITHER a preset `tier` (uses the fixed price) OR a
// `customAmountCents` "any amount" gift (uses an inline recurring price_data
// under the shared partnership product). The amount is ALWAYS re-validated
// server-side. Email/name/tier/amount are stored in SUBSCRIPTION metadata, which
// Stripe snapshots onto each invoice's `parent.subscription_details.metadata`, so
// the fulfillment webhook can read the buyer (and the ACTUAL amount) without an
// extra API call.
export async function POST(req: Request) {
    try {
        if (!isStripeConfigured) {
            return NextResponse.json(
                { error: "Partner subscriptions are not configured." },
                { status: 500 }
            );
        }

        const body = await req.json().catch(() => ({}));
        const tierId = typeof body?.tier === "string" ? body.tier : "";
        const rawCustom =
            typeof body?.customAmountCents === "number" ? Math.round(body.customAmountCents) : null;
        const email = typeof body?.email === "string" ? body.email.trim() : "";
        const name = typeof body?.name === "string" ? body.name.trim() : "";

        if (!name) {
            return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
        }
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
        }

        // Resolve the subscription item + authoritative amount from either a preset
        // tier or a validated custom amount.
        let item: Stripe.SubscriptionCreateParams.Item;
        let amountCents: number;
        let tierLabel: string;

        const preset = getPartnerTier(tierId);
        if (preset) {
            const priceId = partnerPriceId(preset.id);
            if (!priceId) {
                return NextResponse.json({ error: "This tier isn't available right now." }, { status: 500 });
            }
            item = { price: priceId };
            amountCents = preset.amountCents;
            tierLabel = preset.id;
        } else if (rawCustom !== null) {
            if (!isValidCustomAmountCents(rawCustom)) {
                return NextResponse.json(
                    { error: "Please enter a monthly amount of at least $1." },
                    { status: 400 }
                );
            }
            const productId = partnerProductId();
            if (!productId) {
                return NextResponse.json(
                    { error: "Custom amounts aren't available right now." },
                    { status: 500 }
                );
            }
            item = {
                price_data: {
                    currency: PARTNER_CURRENCY,
                    product: productId,
                    unit_amount: rawCustom,
                    recurring: { interval: PARTNER_INTERVAL },
                },
            };
            amountCents = rawCustom;
            tierLabel = "custom";
        } else {
            return NextResponse.json({ error: "Choose or enter a monthly amount." }, { status: 400 });
        }

        const stripe = getStripe();

        // `amount` (in cents) rides in metadata so the webhook records the ACTUAL
        // gift in the tier merge field, never a preset fallback.
        const meta = { source: "partner", tier: tierLabel, amount: String(amountCents), email, name };

        const customer = await stripe.customers.create({ email, name, metadata: meta });

        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [item],
            payment_behavior: "default_incomplete",
            payment_settings: { save_default_payment_method: "on_subscription" },
            // API version 2026-06-24 exposes the first-charge client_secret on the
            // invoice's `confirmation_secret` (there is no invoice.payment_intent).
            expand: ["latest_invoice.confirmation_secret"],
            metadata: meta,
        });

        const invoice = subscription.latest_invoice as Stripe.Invoice | null;
        const clientSecret = invoice?.confirmation_secret?.client_secret;
        if (!clientSecret) {
            return NextResponse.json(
                { error: "Could not initialize payment. Please try again." },
                { status: 500 }
            );
        }

        return NextResponse.json({
            clientSecret,
            subscriptionId: subscription.id,
            currency: PARTNER_CURRENCY,
            amount: amountCents,
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Server error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

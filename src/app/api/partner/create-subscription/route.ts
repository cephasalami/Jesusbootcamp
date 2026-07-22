import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import {
    PARTNER_CURRENCY,
    getPartnerTier,
    partnerPriceId,
    isPartnerConfigured,
    type PartnerTierId,
} from "@/config/partner";

// Called when the partner clicks "Partner With Us" on /partner/join. Creates a
// Customer + a monthly Subscription with `payment_behavior: default_incomplete`,
// then returns the first invoice's client_secret so the embedded Payment Element
// can confirm the first charge inline (deferred-intent flow — no redirect).
//
// The tier's amount/price is ALWAYS resolved server-side from the registry; the
// client only sends the tier id. Email/name/tier are stored in SUBSCRIPTION
// metadata, which Stripe snapshots onto each invoice's
// `parent.subscription_details.metadata`, so the fulfillment webhook can read the
// buyer without an extra API call.
export async function POST(req: Request) {
    try {
        if (!isStripeConfigured || !isPartnerConfigured()) {
            return NextResponse.json(
                { error: "Partner subscriptions are not configured." },
                { status: 500 }
            );
        }

        const body = await req.json().catch(() => ({}));
        const tierId = (typeof body?.tier === "string" ? body.tier : "") as PartnerTierId;
        const email = typeof body?.email === "string" ? body.email.trim() : "";
        const name = typeof body?.name === "string" ? body.name.trim() : "";

        const tier = getPartnerTier(tierId);
        if (!tier) {
            return NextResponse.json({ error: `Unknown tier '${tierId}'` }, { status: 400 });
        }
        if (!name) {
            return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
        }
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
        }

        const priceId = partnerPriceId(tierId);
        if (!priceId) {
            return NextResponse.json({ error: "This tier isn't available right now." }, { status: 500 });
        }

        const stripe = getStripe();

        const customer = await stripe.customers.create({
            email,
            name,
            metadata: { source: "partner", tier: tierId },
        });

        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: priceId }],
            payment_behavior: "default_incomplete",
            payment_settings: { save_default_payment_method: "on_subscription" },
            // API version 2026-06-24 exposes the first-charge client_secret on the
            // invoice's `confirmation_secret` (there is no invoice.payment_intent).
            expand: ["latest_invoice.confirmation_secret"],
            metadata: { source: "partner", tier: tierId, email, name },
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
            amount: tier.amountCents,
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Server error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

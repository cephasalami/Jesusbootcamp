import { NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import {
    getCheckout,
    getBook,
    CURRENCY,
    orderTotalCents,
    orderTags,
    assertCheckoutValid,
} from "@/config/products";

// On checkout load, create a PaymentIntent for the product's base price, with
// setup_future_usage: 'off_session' so the saved card can power the one-click
// upsell with the buyer's consent. `slug` selects the product; the amount is
// ALWAYS derived server-side from the registry (never trusted from the client).
export async function POST(req: Request) {
    try {
        if (!isStripeConfigured) {
            return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
        }

        const body = await req.json().catch(() => ({}));
        const slug = typeof body?.slug === "string" ? body.slug : "";
        const checkout = getCheckout(slug);
        if (!checkout) {
            return NextResponse.json({ error: `Unknown product '${slug}'` }, { status: 400 });
        }
        assertCheckoutValid(slug);

        // A bump only counts if this checkout actually configures one.
        const bump = Boolean(body?.bump) && Boolean(checkout.bump);
        const stripe = getStripe();

        // A dedicated Customer is what lets us re-charge the saved card for the
        // post-purchase upsell.
        const customer = await stripe.customers.create();

        const amount = orderTotalCents(slug, bump);
        const pi = await stripe.paymentIntents.create({
            amount,
            currency: CURRENCY,
            customer: customer.id,
            setup_future_usage: "off_session",
            // FIX 5 (dashboard route): keep automatic payment methods so Apple/
            // Google Pay stay available — they tokenize to CARDS, so they're
            // off-session compatible and don't break the one-click upsell (FIX 2).
            // Stripe LINK is disabled account-wide in the Stripe Dashboard instead:
            // that removes both the wrong-account prefill AND the bank/ACH method
            // that can't be re-charged off-session, without costing one-tap mobile
            // checkout. The buyer's typed email is passed as the billing email at
            // confirm so the two never disagree.
            automatic_payment_methods: { enabled: true },
            metadata: {
                kind: "main",
                product: slug,
                bump: String(bump),
                tags: orderTags(slug, bump).join(","),
            },
        });

        return NextResponse.json({
            clientSecret: pi.client_secret,
            paymentIntentId: pi.id,
            amount,
            title: getBook(slug)?.title ?? slug,
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Server error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

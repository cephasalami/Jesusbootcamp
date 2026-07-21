import { NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getCheckout, orderTotalCents, orderTags } from "@/config/products";

// Update the PaymentIntent amount when the order bump is toggled, all on ONE
// PaymentIntent (a single charge). Also used at "Pay" time to attach the buyer's
// name/email so the fulfillment webhook can tag the right person.
//
// The amount is ALWAYS recomputed server-side from the slug — the client only
// sends a `bump` boolean, never a price. We also assert the PaymentIntent
// belongs to the same product, so a client can't repoint an existing PI at a
// cheaper product's slug.
export async function POST(req: Request) {
    try {
        if (!isStripeConfigured) {
            return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
        }
        const stripe = getStripe();

        const body = await req.json().catch(() => ({}));
        const paymentIntentId: string | undefined = body?.paymentIntentId;
        const slug = typeof body?.slug === "string" ? body.slug : "";
        if (!paymentIntentId) {
            return NextResponse.json({ error: "paymentIntentId is required" }, { status: 400 });
        }
        const checkout = getCheckout(slug);
        if (!checkout) {
            return NextResponse.json({ error: `Unknown product '${slug}'` }, { status: 400 });
        }

        const bump = Boolean(body?.bump) && Boolean(checkout.bump);
        const name: string | undefined = body?.name?.trim() || undefined;
        const email: string | undefined = body?.email?.trim() || undefined;

        // Verify the PI is for this product before re-pricing it.
        const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (pi.metadata?.product && pi.metadata.product !== slug) {
            return NextResponse.json(
                { error: "PaymentIntent does not match product" },
                { status: 400 }
            );
        }

        const amount = orderTotalCents(slug, bump);

        // Keep buyer details on the Customer so the saved card is attributable.
        if (email && typeof pi.customer === "string") {
            await stripe.customers.update(pi.customer, {
                email,
                ...(name ? { name } : {}),
            });
        }

        const updated = await stripe.paymentIntents.update(paymentIntentId, {
            amount,
            ...(email ? { receipt_email: email } : {}),
            metadata: {
                kind: "main",
                product: slug,
                bump: String(bump),
                tags: orderTags(slug, bump).join(","),
                ...(email ? { email } : {}),
                ...(name ? { name } : {}),
            },
        });

        return NextResponse.json({ amount: updated.amount });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Server error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

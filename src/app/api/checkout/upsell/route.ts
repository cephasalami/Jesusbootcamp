import { NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getUpsell, CURRENCY } from "@/config/products";

// One-click post-purchase upsell. Stripe has no built-in "upsell" toggle; this
// is the documented save-and-reuse pattern: create a NEW PaymentIntent against
// the saved Customer + PaymentMethod with off_session + confirm, charging
// immediately with no form and no redirect.
//
// The upsell product is derived from the ORIGINAL order's product slug (in its
// metadata) — never from the client — and its price comes from the registry.
export async function POST(req: Request) {
    if (!isStripeConfigured) {
        return NextResponse.json({ ok: false, reason: "Stripe is not configured" }, { status: 500 });
    }
    try {
        const stripe = getStripe();

        const body = await req.json().catch(() => ({}));
        const paymentIntentId: string | undefined = body?.paymentIntentId;
        if (!paymentIntentId) {
            return NextResponse.json({ ok: false, reason: "paymentIntentId is required" }, { status: 400 });
        }

        // The original order carries the saved card + customer + product slug.
        const original = await stripe.paymentIntents.retrieve(paymentIntentId);

        // Only a genuine MAIN order can spawn an upsell — never another upsell
        // (prevents an upsell PI from being used as a parent to chain charges).
        if (original.metadata?.kind !== "main") {
            return NextResponse.json({ ok: false, reason: "not_a_main_order" }, { status: 400 });
        }
        // Permanent one-upsell-per-order guard (survives the ~24h idempotency-key
        // window): once an order has been upsold, never charge it again.
        if (original.metadata?.upsold === "true") {
            return NextResponse.json({ ok: false, reason: "already_upsold" });
        }

        const slug = original.metadata?.product ?? "";
        const upsell = getUpsell(slug);
        if (!upsell) {
            return NextResponse.json({ ok: false, reason: "no_upsell" });
        }

        const customer =
            typeof original.customer === "string" ? original.customer : original.customer?.id;
        const paymentMethod =
            typeof original.payment_method === "string"
                ? original.payment_method
                : original.payment_method?.id;

        if (original.status !== "succeeded" || !customer || !paymentMethod) {
            return NextResponse.json(
                { ok: false, reason: "No reusable payment method for this order" },
                { status: 400 }
            );
        }

        const email = original.receipt_email ?? original.metadata?.email ?? undefined;
        const name = original.metadata?.name ?? undefined;

        try {
            const upsellPi = await stripe.paymentIntents.create(
                {
                    amount: upsell.priceCents,
                    currency: CURRENCY,
                    customer,
                    payment_method: paymentMethod,
                    off_session: true,
                    confirm: true,
                    metadata: {
                        kind: "upsell",
                        product: upsell.book.slug,
                        parent_payment_intent: paymentIntentId,
                        tags: upsell.book.mailchimpTag,
                        ...(email ? { email } : {}),
                        ...(name ? { name } : {}),
                    },
                },
                // Idempotent per original order so a double-click / retry can't
                // create a second upsell charge.
                { idempotencyKey: `upsell_${paymentIntentId}` }
            );

            if (upsellPi.status === "succeeded") {
                // Permanently record that this order has been upsold, so a reload
                // / re-POST can never charge again (best-effort — the idempotency
                // key above still guards if this update momentarily fails).
                try {
                    await stripe.paymentIntents.update(paymentIntentId, {
                        metadata: {
                            ...original.metadata,
                            upsold: "true",
                            upsell_payment_intent: upsellPi.id,
                        },
                    });
                } catch {
                    /* non-fatal — the charge already succeeded */
                }
                return NextResponse.json({
                    ok: true,
                    eventId: upsellPi.id,
                    amountCents: upsell.priceCents,
                    contentId: upsell.book.slug,
                    title: upsell.book.title,
                    downloadUrl: upsell.book.downloadUrl || null,
                });
            }
            // e.g. requires_action — the bank wants step-up auth. We don't block
            // or retry; the first purchase is untouched.
            return NextResponse.json({ ok: false, reason: "authentication_required" });
        } catch (chargeErr) {
            // Declines / off-session authentication errors land here. This is a
            // SEPARATE PaymentIntent, so the completed first sale is unaffected.
            const code =
                typeof chargeErr === "object" && chargeErr && "code" in chargeErr
                    ? String((chargeErr as { code?: string }).code)
                    : "charge_failed";
            return NextResponse.json({ ok: false, reason: code });
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : "Server error";
        return NextResponse.json({ ok: false, reason: message }, { status: 500 });
    }
}

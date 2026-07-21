import { NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getBook, getUpsell, formatUsd, BOOK_BY_TAG } from "@/config/products";

// Read-only summary for the confirmation page: what was purchased, whether a
// one-click upsell can be offered, and machine values (amount, content ids) so
// the confirmation page can fire an accurate Meta Purchase event. Returns no
// secrets. The product slug comes from the PaymentIntent metadata (source of
// truth), never from the client.
export async function GET(req: Request) {
    try {
        if (!isStripeConfigured) {
            return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
        }
        const stripe = getStripe();
        const url = new URL(req.url);
        const id = url.searchParams.get("payment_intent");
        // Stripe appends this to the confirmation redirect; the inline-success
        // path passes it too. Only the buyer's own browser holds it.
        const clientSecret = url.searchParams.get("payment_intent_client_secret");
        if (!id) {
            return NextResponse.json({ error: "payment_intent is required" }, { status: 400 });
        }

        const pi = await stripe.paymentIntents.retrieve(id);
        const paid = pi.status === "succeeded";

        // The PaymentIntent id is NOT a secret here (it's used as the Meta pixel
        // event id and appears in the URL), so only expose the buyer's email when
        // the request also carries the matching client_secret — proving it's the
        // browser that actually completed this payment.
        const ownsOrder = Boolean(clientSecret && pi.client_secret && clientSecret === pi.client_secret);
        const slug = pi.metadata?.product ?? "";
        const mainBook = getBook(slug);

        // Every book actually charged, resolved from the order's Mailchimp tags
        // (this reflects main + any bump). Falls back to the main product.
        const purchasedBooks = String(pi.metadata?.tags ?? "")
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
            .map((tag) => BOOK_BY_TAG[tag])
            .filter(Boolean);
        const books = purchasedBooks.length > 0 ? purchasedBooks : mainBook ? [mainBook] : [];
        const items = books.length > 0 ? books.map((b) => b.title) : ["Your book"];
        const contentIds = books.length > 0 ? books.map((b) => b.slug) : [slug];

        // Instant on-page download links for each purchased book that has one.
        // Gated on ownership (client_secret) just like the email — a bare PI id
        // must not hand out the product.
        const downloads = ownsOrder
            ? books
                  .filter((b) => b.downloadUrl)
                  .map((b) => ({ title: b.title, url: b.downloadUrl as string }))
            : [];

        const upsell = getUpsell(slug);
        const alreadyUpsold = pi.metadata?.upsold === "true";
        const canUpsell =
            paid && Boolean(pi.customer) && Boolean(pi.payment_method) && Boolean(upsell) && !alreadyUpsold;

        return NextResponse.json({
            paid,
            slug,
            items,
            contentIds,
            amountCents: pi.amount,
            downloads,
            email: ownsOrder ? pi.receipt_email ?? pi.metadata?.email ?? null : null,
            upsell: upsell
                ? {
                      available: canUpsell,
                      slug: upsell.book.slug,
                      title: upsell.book.title,
                      blurb: upsell.book.blurb,
                      price: formatUsd(upsell.priceCents),
                      image: upsell.book.image ?? null,
                  }
                : { available: false, slug: null, title: null, blurb: null, price: null, image: null },
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Server error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

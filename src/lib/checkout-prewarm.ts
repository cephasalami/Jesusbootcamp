// src/lib/checkout-prewarm.ts — CLIENT-ONLY checkout PaymentIntent pre-warmer.
//
// Level 2 of the checkout speed-up: when a visitor shows buy-intent on a landing
// page, we start creating the PaymentIntent immediately and stash the in-flight
// request in a module singleton. Because Next.js client-side navigation (the
// <Link> from landing → /checkout) preserves the JS runtime, the checkout page
// can CONSUME that same request instead of starting a fresh round-trip after it
// mounts — so the card form is ready sooner.
//
// Fallbacks are automatic: a hard load / direct arrival at /checkout finds no
// prewarmed entry and creates its own intent as before.

export type PrewarmedIntent = { clientSecret: string; paymentIntentId: string };

type Entry = { slug: string; promise: Promise<PrewarmedIntent | null>; ts: number };

let entry: Entry | null = null;
// A prewarmed base-price intent is safe to reuse for a while; the checkout's
// update-intent re-syncs the amount on bump toggle and at submit anyway.
const TTL_MS = 15 * 60 * 1000;

/**
 * Kick off (or reuse) a PaymentIntent for `slug`. Idempotent: a fresh in-flight
 * or resolved prewarm for the same slug is left alone. No-op on the server.
 */
export function prewarmCheckoutIntent(slug: string): void {
    if (typeof window === "undefined") return;
    if (entry && entry.slug === slug && Date.now() - entry.ts < TTL_MS) return;

    const promise = fetch("/api/checkout/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, bump: false }),
    })
        .then((r) => r.json())
        .then((d) =>
            d?.clientSecret
                ? { clientSecret: d.clientSecret as string, paymentIntentId: d.paymentIntentId as string }
                : null
        )
        .catch(() => null);

    entry = { slug, promise, ts: Date.now() };
}

/**
 * Consume a prewarmed intent for `slug` (one-time). Returns the pending/resolved
 * request, or null if there's no fresh prewarm — in which case the caller should
 * create the intent itself.
 */
export function consumeCheckoutIntent(slug: string): Promise<PrewarmedIntent | null> | null {
    if (!entry || entry.slug !== slug || Date.now() - entry.ts > TTL_MS) return null;
    const { promise } = entry;
    entry = null; // one-time use — a reload creates a fresh intent
    return promise;
}

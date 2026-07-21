// src/lib/stripe.ts — SERVER-ONLY Stripe client.
// Never import this from a client component (it reads the secret key).
import Stripe from "stripe";

let cached: Stripe | null = null;

export const isStripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);

/**
 * Returns a lazily-constructed singleton Stripe client. Built on first use
 * (never at import time) because `new Stripe("")` THROWS — so an unconfigured
 * environment still boots and the checkout routes can return a clean 500 via
 * `isStripeConfigured` before ever calling this.
 *
 * apiVersion is intentionally omitted so the SDK uses the version it was built
 * against (keeps the TypeScript types and runtime in lockstep).
 */
export function getStripe(): Stripe {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!cached) {
        cached = new Stripe(key, {
            typescript: true,
            appInfo: { name: "jesusbootcamp-checkout" },
        });
    }
    return cached;
}

// src/lib/stripe-client.ts — CLIENT-ONLY Stripe.js loader singleton.
//
// One shared loadStripe() promise for the whole app so the library is fetched
// and initialized ONCE. Pre-warming it on a landing page (see StripePrewarm)
// means the checkout's Payment Element reuses the already-loaded instance and
// mounts far faster — the big win on slow mobile / the Facebook in-app browser.

import { loadStripe, type Stripe } from "@stripe/stripe-js";

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

let promise: Promise<Stripe | null> | null = null;

/**
 * Returns the shared Stripe.js promise (loading it on first call), or null if no
 * publishable key is configured. Safe to call repeatedly from any client
 * component — the script is injected only once.
 */
export function getStripePromise(): Promise<Stripe | null> | null {
    if (!PUBLISHABLE_KEY) return null;
    if (!promise) promise = loadStripe(PUBLISHABLE_KEY);
    return promise;
}

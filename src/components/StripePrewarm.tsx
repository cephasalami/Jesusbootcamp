"use client";

import { useEffect } from "react";
import { preconnect, prefetchDNS } from "react-dom";
import { getStripePromise } from "@/lib/stripe-client";

// Level 1 checkout speed-up. Drop this on any page that leads to /checkout. It
// warms the connection to Stripe and downloads Stripe.js WHILE the visitor reads
// the offer, so the Payment Element mounts fast when they click through — the
// difference is largest on slow mobile / the Facebook in-app browser.

export default function StripePrewarm() {
    // Warm DNS/TLS to Stripe's origins during render (React dedupes these).
    preconnect("https://js.stripe.com");
    prefetchDNS("https://js.stripe.com");

    useEffect(() => {
        // Kick off the Stripe.js download after paint so it never competes with
        // the landing page's own render.
        getStripePromise();
    }, []);

    return null;
}

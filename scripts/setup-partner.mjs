// scripts/setup-partner.mjs
//
// Idempotently creates the three monthly partnership products + recurring prices
// in Stripe (TEST mode) and prints the price IDs to paste into .env.local.
// Also runs a one-off PROBE: creates a `default_incomplete` subscription with no
// payment method so we can inspect exactly where the first-invoice client_secret
// lives for this SDK/API version (it has moved across recent API versions), then
// cleans the probe up.
//
// Run:  node --env-file=.env.local scripts/setup-partner.mjs
//
// Safe to run repeatedly: prices are looked up by `lookup_key` and reused.

import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
    console.error("STRIPE_SECRET_KEY missing — run with: node --env-file=.env.local scripts/setup-partner.mjs");
    process.exit(1);
}
if (!key.startsWith("sk_test")) {
    console.error(`Refusing to run: STRIPE_SECRET_KEY is not a TEST key (starts with '${key.slice(0, 7)}'). This script is test-mode only.`);
    process.exit(1);
}

const stripe = new Stripe(key, { appInfo: { name: "jbc-partner-setup" } });

const TIERS = [
    { id: "25", amountCents: 2500, lookupKey: "partner_monthly_25", name: "Kingdom Partner — $25/mo" },
    { id: "50", amountCents: 5000, lookupKey: "partner_monthly_50", name: "Kingdom Partner — $50/mo" },
    { id: "100", amountCents: 10000, lookupKey: "partner_monthly_100", name: "Kingdom Partner — $100/mo" },
];

async function ensurePrice(tier) {
    // Reuse an existing price by lookup_key if present.
    const existing = await stripe.prices.list({ lookup_keys: [tier.lookupKey], active: true, limit: 1 });
    if (existing.data.length) {
        return { priceId: existing.data[0].id, reused: true, productId: existing.data[0].product };
    }
    const product = await stripe.products.create({
        name: tier.name,
        metadata: { jbc_partner_tier: tier.id },
    });
    const price = await stripe.prices.create({
        product: product.id,
        unit_amount: tier.amountCents,
        currency: "usd",
        recurring: { interval: "month" },
        lookup_key: tier.lookupKey,
        metadata: { jbc_partner_tier: tier.id },
    });
    return { priceId: price.id, reused: false, productId: product.id };
}

async function probeClientSecretShape(priceId) {
    const customer = await stripe.customers.create({ metadata: { jbc_probe: "true" } });
    const sub = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
        expand: ["latest_invoice.payment_intent", "latest_invoice.confirmation_secret"],
        metadata: { jbc_probe: "true" },
    });
    const invoice = sub.latest_invoice || {};
    const report = {
        subscriptionStatus: sub.status,
        latestInvoiceKeys: Object.keys(invoice),
        hasPaymentIntentObject: typeof invoice.payment_intent === "object" && invoice.payment_intent !== null,
        paymentIntentClientSecret:
            typeof invoice.payment_intent === "object" && invoice.payment_intent
                ? String(invoice.payment_intent.client_secret || "").slice(0, 14) + "…"
                : null,
        confirmationSecretClientSecret: invoice.confirmation_secret?.client_secret
            ? String(invoice.confirmation_secret.client_secret).slice(0, 14) + "…"
            : null,
    };
    // Clean up the probe.
    await stripe.subscriptions.cancel(sub.id).catch(() => {});
    await stripe.customers.del(customer.id).catch(() => {});
    return report;
}

(async () => {
    console.log("== Creating / verifying partnership prices (TEST mode) ==\n");
    const results = [];
    for (const tier of TIERS) {
        const r = await ensurePrice(tier);
        results.push({ tier: tier.id, ...r });
        console.log(`  $${tier.amountCents / 100}/mo  ${r.reused ? "reused" : "created"}  ${r.priceId}`);
    }

    console.log("\n== Paste these into .env.local ==\n");
    const envByTier = Object.fromEntries(results.map((r) => [r.tier, r.priceId]));
    console.log(`STRIPE_PARTNER_PRICE_25=${envByTier["25"]}`);
    console.log(`STRIPE_PARTNER_PRICE_50=${envByTier["50"]}`);
    console.log(`STRIPE_PARTNER_PRICE_100=${envByTier["100"]}`);

    console.log("\n== Probe: where does the first-invoice client_secret live? ==\n");
    const probe = await probeClientSecretShape(envByTier["25"]);
    console.log(JSON.stringify(probe, null, 2));
})().catch((e) => {
    console.error("\nSetup failed:", e?.message || e);
    process.exit(1);
});

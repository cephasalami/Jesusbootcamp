// src/config/partner.ts
//
// SINGLE SOURCE OF TRUTH for the monthly partnership subscription at
// /partner/join. Mirrors the philosophy of src/config/products.ts: the amount is
// ALWAYS resolved server-side (the client only ever sends a tier id), and the
// real Stripe price id lives in an env var, never in the client bundle.
//
// Access model (confirmed with Paul): Mailchimp is the source of truth. A
// successful subscription tags the member `partner-active` + `partner-<tier>`;
// an automation keyed on `partner-active` grants the actual extra material. This
// file does NOT grant access on its own.
//
// ⚠️ OFFER-FRAMING NOTE (go-live still pending Paul's explicit OK): the copy is
// now taken verbatim from Paul's "Global Expansion" letter, which states the
// model directly — the CORE classes are always free ("completely FREE OF
// CHARGE"), the EXTRA material is the partner benefit at "$25 or more", and
// anyone who can't afford it "will still receive all the classes in full as a
// PDF". That reconciles with the live /partner PayPal page's freewill framing
// (core is never withheld). Per Paul's instruction we still flag the paywall
// framing as pending his sign-off before it goes live. See PartnerCTA and the
// /partner/join pitch copy, marked with the same note.

import { formatUsd } from "./products";

export const PARTNER_CURRENCY = "usd";
export const PARTNER_INTERVAL = "month" as const;

// FIX 8 — custom ("any amount") monthly gifts. Amounts outside this range are
// rejected server-side.
export const PARTNER_MIN_CENTS = 100; // $1 minimum
export const PARTNER_MAX_CENTS = 100_000; // $1,000 sanity cap

export type PartnerTierId = "25" | "50" | "100";

export type PartnerTier = {
    id: PartnerTierId;
    amountCents: number;
    /** Short values-line on the selectable card — Paul's live /partner wording. */
    label: string;
    /** Env var holding the Stripe recurring price id (TEST mode for now). */
    priceEnv: string;
};

// Amounts are authoritative here; labels are grounded in the Global Expansion
// letter's own framing ($25+ unlocks the extra material; $50/$100 are for
// "primary champions" meeting foundational operational needs).
export const PARTNER_TIERS: PartnerTier[] = [
    { id: "25", amountCents: 2500, label: "Unlocks all the extra material", priceEnv: "STRIPE_PARTNER_PRICE_25" },
    { id: "50", amountCents: 5000, label: "Primary champion of the vision", priceEnv: "STRIPE_PARTNER_PRICE_50" },
    { id: "100", amountCents: 10000, label: "Primary champion of the vision", priceEnv: "STRIPE_PARTNER_PRICE_100" },
];

// ── Mailchimp tags (the access source of truth) ──────────────────────────────
export const PARTNER_ACTIVE_TAG = "partner-active";
export function partnerTierTag(id: PartnerTierId): string {
    return `partner-${id}`;
}
export const ALL_PARTNER_TIER_TAGS = PARTNER_TIERS.map((t) => partnerTierTag(t.id));
/** Every partner tag we ever apply — used to fully revoke on cancel/failure. */
export const ALL_PARTNER_TAGS = [PARTNER_ACTIVE_TAG, ...ALL_PARTNER_TIER_TAGS];
/** Tags a live partner at the given tier should carry. */
export function activePartnerTags(id: PartnerTierId): string[] {
    return [PARTNER_ACTIVE_TAG, partnerTierTag(id)];
}

// ── Lookups ──────────────────────────────────────────────────────────────────
export function getPartnerTier(id: string): PartnerTier | undefined {
    return PARTNER_TIERS.find((t) => t.id === id);
}

/** Server-only: resolve the Stripe price id for a tier (reads env lazily). */
export function partnerPriceId(id: PartnerTierId): string | undefined {
    const tier = getPartnerTier(id);
    return tier ? process.env[tier.priceEnv] : undefined;
}

/** Server-only: reverse a Stripe price id back to a tier (webhook fulfillment). */
export function tierByPriceId(priceId: string): PartnerTier | undefined {
    return PARTNER_TIERS.find((t) => process.env[t.priceEnv] === priceId);
}

/** True when all three tier prices are wired up (server-side guard). */
export function isPartnerConfigured(): boolean {
    return PARTNER_TIERS.every((t) => Boolean(process.env[t.priceEnv]));
}

/** Server-only: the shared Stripe product id for custom ("any amount") gifts. */
export function partnerProductId(): string | undefined {
    return process.env.STRIPE_PARTNER_PRODUCT;
}

/** Validate a custom monthly amount, in cents. */
export function isValidCustomAmountCents(cents: unknown): cents is number {
    return (
        typeof cents === "number" &&
        Number.isInteger(cents) &&
        cents >= PARTNER_MIN_CENTS &&
        cents <= PARTNER_MAX_CENTS
    );
}

// ── Client-safe display DTO (no env, no secrets) ─────────────────────────────
export type PartnerTierView = {
    id: PartnerTierId;
    amountCents: number;
    label: string;
    /** Pre-formatted "$25" for display. */
    amountLabel: string;
};

export function partnerTierViews(): PartnerTierView[] {
    return PARTNER_TIERS.map((t) => ({
        id: t.id,
        amountCents: t.amountCents,
        label: t.label,
        amountLabel: formatUsd(t.amountCents),
    }));
}

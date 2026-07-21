// src/config/products.ts
//
// SINGLE SOURCE OF TRUTH for the on-site Stripe checkout at /checkout/[slug].
//
// Two registries:
//   • BOOKS      — the catalog of sellable books (price, image, Mailchimp tag).
//   • CHECKOUTS  — per-product checkout wiring: which book is the main product,
//                  and its optional order-bump / one-click upsell.
//
// Prices are ALWAYS resolved server-side from these registries (never trusted
// from the client). All books are $5. Prices are in cents (Stripe's unit).

export type Book = {
    /** Stable slug; also the /checkout/[slug] segment and Mailchimp tag key. */
    slug: string;
    title: string;
    /** One short line: what the book offers. */
    blurb: string;
    /** Price in cents. */
    priceCents: number;
    /** Public product image (path under /public). Optional. */
    image?: string;
    /** Mailchimp tag applied on successful purchase (fulfillment automation). */
    mailchimpTag: string;
    /**
     * Hosted PDF link. When set, the buyer gets an instant "Download now" button
     * on the confirmation page (email delivery stays as the backup). Leave empty
     * until the file is hosted, and the page falls back to email-only delivery.
     */
    downloadUrl?: string;
};

export const CURRENCY = "usd";

/** Every book is $5. Change here to reprice the whole catalog. */
export const BOOK_PRICE_CENTS = 500;

// ── The catalog of sellable books ────────────────────────────────────────────
export const BOOKS: Record<string, Book> = {
    "power-for-the-hour": {
        slug: "power-for-the-hour",
        title: "Power For The Hour",
        blurb: "The essential scriptures every disciple must memorize.",
        priceCents: BOOK_PRICE_CENTS,
        image: "/images/power-for-the-hour/power-for-the-hour-paperback.webp",
        mailchimpTag: "purchased-power-for-hour",
        downloadUrl:
            "https://faithwithoutborders.us/wp-content/uploads/2026/07/POWER-For-The-Hour-Book-Final-7-16.pdf",
    },
    "while-you-were-busy": {
        slug: "while-you-were-busy",
        title: "While You Were Busy",
        blurb: "Take your lead back in the home before the culture takes it.",
        priceCents: BOOK_PRICE_CENTS,
        image: "/images/while-you-were-busy/while-you-were-busy-cover.png",
        mailchimpTag: "purchased-while-you-were-busy",
        downloadUrl:
            "https://faithwithoutborders.us/wp-content/uploads/2026/07/While-You-were-Busy-booklet-7-16.pdf",
    },
    // Add new approved books here, then wire them into a CHECKOUT below.
};

/** A secondary offer (order-bump or one-click upsell) inside a checkout. */
export type Offer = { slug: string; priceCents: number };

export type Checkout = {
    /** Main product slug (must exist in BOOKS). */
    productSlug: string;
    /** Optional pre-payment order bump shown on the checkout page. */
    bump?: Offer;
    /** Optional post-purchase one-click upsell shown on the confirmation page. */
    upsell?: Offer;
};

// ═════════════════ THE CHECKOUTS — one per sellable product ══════════════════
// Only two real books exist, so each checkout offers the OTHER book as its
// one-click upsell (there is no third book for a distinct order bump AND upsell,
// so the bump slot is intentionally left empty until a third book is approved).
export const CHECKOUTS: Record<string, Checkout> = {
    "power-for-the-hour": {
        productSlug: "power-for-the-hour",
        // bump: (add when a 3rd approved book exists)
        upsell: { slug: "while-you-were-busy", priceCents: BOOK_PRICE_CENTS },
    },
    "while-you-were-busy": {
        productSlug: "while-you-were-busy",
        upsell: { slug: "power-for-the-hour", priceCents: BOOK_PRICE_CENTS },
    },
};

// ── Lookups ──────────────────────────────────────────────────────────────────
export function getBook(slug: string): Book | undefined {
    return BOOKS[slug];
}
export function getCheckout(slug: string): Checkout | undefined {
    return CHECKOUTS[slug];
}

/** Format cents as `$X.XX`, or `$5` when it's a whole dollar amount. */
export function formatUsd(cents: number): string {
    return cents % 100 === 0 ? `$${cents / 100}` : `$${(cents / 100).toFixed(2)}`;
}

// ── Server-authoritative pricing (NEVER trust a client-supplied amount) ───────

/** Base product price + order bump if selected & configured, in cents. */
export function orderTotalCents(slug: string, bump: boolean): number {
    const checkout = requireCheckout(slug);
    const base = BOOKS[checkout.productSlug].priceCents;
    return base + (bump && checkout.bump ? checkout.bump.priceCents : 0);
}

/** Mailchimp per-book delivery tags for the main order (main product + bump). */
export function orderTags(slug: string, bump: boolean): string[] {
    const checkout = requireCheckout(slug);
    const tags = [BOOKS[checkout.productSlug].mailchimpTag];
    if (bump && checkout.bump) tags.push(BOOKS[checkout.bump.slug].mailchimpTag);
    return tags;
}

/** The one-click upsell for a checkout, or null if none is configured. */
export function getUpsell(slug: string): { book: Book; priceCents: number } | null {
    const checkout = getCheckout(slug);
    if (!checkout?.upsell) return null;
    const book = BOOKS[checkout.upsell.slug];
    if (!book) return null;
    return { book, priceCents: checkout.upsell.priceCents };
}

function requireCheckout(slug: string): Checkout {
    const checkout = CHECKOUTS[slug];
    if (!checkout) throw new Error(`[products] unknown checkout '${slug}'`);
    return checkout;
}

/**
 * Fail loudly (server-side) on a misconfigured checkout. Called from the API
 * routes so it never trips the client bundle. Tolerates a missing bump/upsell
 * (only two books exist today); distinctness only matters when both are set.
 */
export function assertCheckoutValid(slug: string): void {
    const checkout = requireCheckout(slug);
    if (!BOOKS[checkout.productSlug])
        throw new Error(`[products] product '${checkout.productSlug}' not in BOOKS`);
    for (const offer of [checkout.bump, checkout.upsell]) {
        if (offer && !BOOKS[offer.slug])
            throw new Error(`[products] offer '${offer.slug}' not in BOOKS`);
        if (offer && offer.slug === checkout.productSlug)
            throw new Error(`[products] offer '${offer.slug}' cannot equal the main product`);
    }
    if (checkout.bump && checkout.upsell && checkout.bump.slug === checkout.upsell.slug)
        throw new Error(`[products] bump and upsell must be different books ('${slug}')`);
}

// ── Client-safe display DTO (no secrets; prices are display-only) ─────────────
export type CheckoutView = {
    slug: string;
    product: { slug: string; title: string; blurb: string; image?: string; priceCents: number };
    bump?: { slug: string; title: string; blurb: string; priceCents: number };
    hasUpsell: boolean;
};

/** Build the client display DTO for a checkout, or null if the slug is unknown. */
export function getCheckoutView(slug: string): CheckoutView | null {
    const checkout = CHECKOUTS[slug];
    if (!checkout) return null;
    const p = BOOKS[checkout.productSlug];
    if (!p) return null;
    const bumpBook = checkout.bump ? BOOKS[checkout.bump.slug] : undefined;
    return {
        slug,
        product: { slug: p.slug, title: p.title, blurb: p.blurb, image: p.image, priceCents: p.priceCents },
        bump:
            checkout.bump && bumpBook
                ? { slug: bumpBook.slug, title: bumpBook.title, blurb: bumpBook.blurb, priceCents: checkout.bump.priceCents }
                : undefined,
        hasUpsell: Boolean(checkout.upsell && BOOKS[checkout.upsell.slug]),
    };
}

// ── Reverse tag lookup (used by the /tracking dashboard for book attribution) ─
export const ALL_BOOKS: Book[] = Object.values(BOOKS);
export const BOOK_BY_TAG: Record<string, Book> = Object.fromEntries(
    ALL_BOOKS.map((b) => [b.mailchimpTag, b])
);

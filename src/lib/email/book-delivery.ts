// src/lib/email/book-delivery.ts — SERVER-ONLY.
//
// Delivers the book(s) a buyer just paid for, from our own app, instead of
// relying on a Mailchimp automation keyed on the purchase tags.
//
// This is the fulfilment path, so the failure modes are not symmetric with the
// class drip:
//
//   • Not sending  → someone paid and received nothing. The worst outcome here,
//                    and historically the "paid but no email" complaint.
//   • Sending twice → mildly embarrassing on a receipt.
//
// So this leans the opposite way to the drip: it retries, it surfaces failure
// to the caller so Stripe will retry the webhook, and the ledger exists to stop
// duplicates rather than to stop sends.

import { BOOK_BY_TAG } from "../../config/products.ts";
import { isKvConfigured, kvGetJson, kvSetJson } from "../kv.ts";
import { sendTemplateEmail } from "./sendgrid.ts";

/** Set to the SendGrid dynamic template id once the delivery email exists. */
const TEMPLATE_ID = process.env.SENDGRID_BOOK_DELIVERY_TEMPLATE_ID;

const SITE = "https://jesusbootcamp.org";
/** Durable: a delivered email can never be un-delivered. */
const NO_EXPIRY = 0;

function deliveryKey(paymentIntentId: string): string {
    return `jbc:delivered:v1:${paymentIntentId}`;
}

export type DeliveryResult =
    | { status: "sent"; books: string[] }
    | { status: "already-sent" }
    | { status: "nothing-to-deliver" }
    | { status: "not-configured" }
    | { status: "failed"; detail: string };

/**
 * Email the download links for a completed purchase.
 *
 * Keyed on the PaymentIntent id, not the email address: someone buying the same
 * book twice is a real second purchase and should get a second email, whereas
 * Stripe re-delivering one webhook should not.
 */
export async function sendBookDelivery(input: {
    email: string;
    name?: string;
    /** Purchase tags from the PaymentIntent metadata. */
    tags: string[];
    paymentIntentId: string;
}): Promise<DeliveryResult> {
    const { email, name, tags, paymentIntentId } = input;

    // Resolve tags to real books. Non-book tags (segmentation, buyer flags) are
    // skipped so they cannot produce an email with an empty download list.
    const books = tags
        .map((tag) => BOOK_BY_TAG[tag])
        .filter((book): book is NonNullable<typeof book> => Boolean(book))
        .filter((book, index, all) => all.findIndex((b) => b.slug === book.slug) === index);

    if (books.length === 0) return { status: "nothing-to-deliver" };
    if (!TEMPLATE_ID) return { status: "not-configured" };

    // Idempotency. A KV failure here means we cannot tell whether this was
    // already delivered — and for fulfilment, sending a possible duplicate
    // beats withholding something already paid for, so we continue.
    if (isKvConfigured) {
        const already = await kvGetJson<{ sentAt: number }>(deliveryKey(paymentIntentId));
        if (already) return { status: "already-sent" };
    }

    const send = await sendTemplateEmail({
        to: email,
        templateId: TEMPLATE_ID,
        category: "book-delivery",
        // A newsletter opt-out must never suppress something already paid for.
        unsubscribeGroupId: "transactional",
        data: {
            first_name: name?.trim().split(/\s+/)[0] ?? "",
            // Pluralised here rather than in the template. SendGrid's Handlebars
            // has a limited helper set ({{#equals}}, not {{#eq}}), and a wrong
            // helper name fails silently by rendering nothing — an empty <h1>
            // that nobody would notice until a buyer saw it.
            heading: books.length === 1 ? "Your download is ready" : "Your downloads are ready",
            // Handlebars renders this with {{#each books}}.
            books: books.map((book) => ({
                title: book.title,
                // Our own proxy, not the raw cross-origin PDF: it forces a real
                // download with a clean filename and keeps every link in the
                // email on the sending domain.
                url: `${SITE}/api/download/${book.slug}`,
            })),
        },
    });

    if (!send.ok) return { status: "failed", detail: send.detail };

    if (isKvConfigured) {
        // Best-effort. Failing to record means a retry may duplicate the email,
        // which is the acceptable direction for a purchase.
        await kvSetJson(deliveryKey(paymentIntentId), { sentAt: Date.now() }, NO_EXPIRY);
    }
    return { status: "sent", books: books.map((book) => book.title) };
}

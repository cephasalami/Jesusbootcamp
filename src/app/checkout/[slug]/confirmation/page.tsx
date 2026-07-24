"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, Sparkles, Download } from "lucide-react";
import { trackFbEvent } from "@/lib/fbq";
import styles from "./page.module.css";

type OrderInfo = {
    paid: boolean;
    slug: string;
    items: string[];
    contentIds: string[];
    amountCents: number;
    downloads: Array<{ title: string; url: string }>;
    email: string | null;
    upsell: {
        available: boolean;
        slug: string | null;
        title: string | null;
        blurb: string | null;
        description: string | null;
        price: string | null;
        image: string | null;
    };
};

type UpsellState = "idle" | "charging" | "added" | "failed";

/**
 * Fire a Meta Purchase exactly once per PaymentIntent. Guarded by sessionStorage
 * keyed on the PI id so a confirmation-page reload can't double-count, and
 * tagged with eventID = PI id so the server-side Conversions API event (fired
 * from the Stripe webhook) deduplicates against this browser event.
 */
function firePurchaseOnce(piId: string, params: Record<string, unknown>) {
    if (!piId) return;
    const key = `fb_purchase_${piId}`;
    try {
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, "1");
    } catch {
        /* storage blocked — still fire, at worst we over-count on reload */
    }
    trackFbEvent("Purchase", params, { eventID: piId });
}

export default function ConfirmationPage() {
    const piIdRef = useRef<string | null>(null);
    const [order, setOrder] = useState<OrderInfo | null>(null);
    const [loadErr, setLoadErr] = useState<string | null>(null);
    const [upsell, setUpsell] = useState<UpsellState>("idle");
    const [upsellDownload, setUpsellDownload] = useState<string | null>(null);

    // Read the PaymentIntent id from the URL (Stripe appends it on redirect; we
    // also pass it through for inline card success).
    useEffect(() => {
        let active = true;
        const search = new URLSearchParams(window.location.search);
        const id = search.get("payment_intent");
        // Stripe appends this on redirect; the inline-success path passes it too.
        // It proves ownership so the order endpoint will return the buyer's email.
        const clientSecret = search.get("payment_intent_client_secret");
        piIdRef.current = id;
        (async () => {
            if (!id) {
                if (active) setLoadErr("no-id");
                return;
            }
            try {
                const qs = new URLSearchParams({ payment_intent: id });
                if (clientSecret) qs.set("payment_intent_client_secret", clientSecret);
                const r = await fetch(`/api/checkout/order?${qs.toString()}`);
                const d = (await r.json()) as OrderInfo & { error?: string };
                if (!active) return;
                if (d?.error) {
                    setLoadErr(d.error);
                } else {
                    setOrder(d);
                    // Conversion tracking — fire Purchase for the main order.
                    if (d.paid) {
                        firePurchaseOnce(id, {
                            value: (d.amountCents ?? 0) / 100,
                            currency: "USD",
                            content_ids: d.contentIds,
                            content_name: d.items.join(" + "),
                            content_type: "product",
                            num_items: d.items.length,
                        });
                    }
                }
            } catch {
                if (active) setLoadErr("load-failed");
            }
        })();
        return () => {
            active = false;
        };
    }, []);

    // One click charges the saved card via the server; no form, no redirect. A
    // failure here never affects the completed first purchase.
    async function acceptUpsell() {
        if (!piIdRef.current || upsell === "charging" || upsell === "added") return;
        setUpsell("charging");
        try {
            const r = await fetch("/api/checkout/upsell", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentIntentId: piIdRef.current }),
            });
            const d = await r.json();
            if (d?.ok) {
                setUpsell("added");
                if (d.downloadUrl) setUpsellDownload(String(d.downloadUrl));
                // Conversion tracking — fire Purchase for the upsell (its own PI).
                firePurchaseOnce(String(d.eventId), {
                    value: (d.amountCents ?? 0) / 100,
                    currency: "USD",
                    content_ids: [d.contentId],
                    content_name: d.title ?? order?.upsell.title ?? "Upsell",
                    content_type: "product",
                    num_items: 1,
                });
            } else {
                setUpsell("failed");
            }
        } catch {
            setUpsell("failed");
        }
    }

    const items = order?.items ?? [];
    const itemList =
        items.length >= 2 ? `${items.slice(0, -1).join(", ")} and ${items.at(-1)}` : items[0] ?? "Your book";
    const downloads = order?.downloads ?? [];
    const showUpsell = Boolean(order?.paid && order?.upsell?.available);

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.container}>
                <div className={styles.iconWrap} aria-hidden="true">
                    <CheckCircle2 size={46} strokeWidth={2} />
                </div>

                {order?.paid ? (
                    <>
                        <h1 className={`${styles.headingDisplay} ${styles.h1}`}>You&apos;re in.</h1>
                        {downloads.length > 0 ? (
                            <p className={styles.lead}>
                                {downloads.length > 1
                                    ? `Your ${itemList} are ready — download them below.`
                                    : `Your ${itemList} is ready — download it below.`}{" "}
                                We&apos;re also sending{" "}
                                {order.email ? (
                                    <>
                                        a copy to <strong>{order.email}</strong>
                                    </>
                                ) : (
                                    "a copy to your email"
                                )}
                                . If it hasn&apos;t arrived in a few minutes, check your spam folder
                                or just use the download button above.
                            </p>
                        ) : (
                            <p className={styles.lead}>
                                Your payment went through. We&apos;re sending {itemList} to{" "}
                                {order.email ? <strong>{order.email}</strong> : "your email"} — if it
                                hasn&apos;t arrived in a few minutes, check your spam folder.
                            </p>
                        )}
                        {downloads.length > 0 && (
                            <div className={styles.downloads}>
                                {downloads.map((d) => (
                                    <a
                                        key={d.url}
                                        href={d.url}
                                        download
                                        className={styles.downloadButton}
                                    >
                                        <Download size={17} /> Download {d.title}
                                    </a>
                                ))}
                                <p className={styles.downloadNote}>
                                    Tip: open it on your phone and add it to your home screen.
                                </p>
                            </div>
                        )}
                    </>
                ) : order && !order.paid ? (
                    <>
                        <h1 className={`${styles.headingDisplay} ${styles.h1}`}>Almost there…</h1>
                        <p className={styles.lead}>
                            Your payment is processing. You&apos;ll get a confirmation email as
                            soon as it clears.
                        </p>
                    </>
                ) : loadErr ? (
                    <>
                        <h1 className={`${styles.headingDisplay} ${styles.h1}`}>Thank you.</h1>
                        <p className={styles.lead}>
                            If your payment went through, you&apos;ll have a Stripe receipt. If your
                            book doesn&apos;t reach you shortly, just reply to that receipt and
                            we&apos;ll send it right over.
                        </p>
                    </>
                ) : (
                    <p className={styles.lead}>Loading your order…</p>
                )}

                {/* Exactly ONE upsell, a different book than the main product. */}
                {showUpsell && order && upsell !== "added" && (
                    <div className={styles.upsell}>
                        <div className={styles.upsellTag}>
                            <Sparkles size={13} /> Wait — one more thing
                        </div>
                        <p className={styles.upsellHook}>
                            Don&apos;t close this page just yet. You don&apos;t want to miss the book
                            that pairs with what you just grabbed — and you can add it in a single
                            click.
                        </p>

                        <div className={styles.upsellCard}>
                            {order.upsell.image && (
                                <div className={styles.upsellCover}>
                                    <Image
                                        src={order.upsell.image}
                                        alt={`${order.upsell.title} cover`}
                                        width={150}
                                        height={200}
                                        className={styles.upsellCoverImg}
                                    />
                                </div>
                            )}
                            <div className={styles.upsellBody}>
                                <h2 className={`${styles.headingDisplay} ${styles.upsellTitle}`}>
                                    {order.upsell.title}
                                </h2>
                                <div className={styles.upsellPrice}>
                                    <span className={styles.upsellPriceAmount}>
                                        {order.upsell.price}
                                    </span>
                                    <span className={styles.upsellPriceUnit}>
                                        one-time · instant PDF
                                    </span>
                                </div>
                                <p className={styles.upsellDesc}>{order.upsell.description}</p>
                            </div>
                        </div>

                        <p className={styles.upsellOneClick}>
                            One click, using the card you already entered — no forms, nothing to
                            re-enter.
                        </p>
                        <button
                            type="button"
                            className={styles.upsellButton}
                            onClick={acceptUpsell}
                            disabled={upsell === "charging"}
                        >
                            {upsell === "charging"
                                ? "Adding…"
                                : `Yes — add ${order.upsell.title} for ${order.upsell.price}`}
                        </button>
                        {upsell === "failed" && (
                            <div className={styles.upsellFail} role="alert">
                                <p className={styles.upsellFailText}>
                                    That charge didn&apos;t go through — your first order is all set
                                    and unaffected. You can still grab {order.upsell.title}:
                                </p>
                                {order.upsell.slug && (
                                    <Link
                                        href={`/checkout/${order.upsell.slug}`}
                                        className={styles.upsellFallbackLink}
                                    >
                                        Get {order.upsell.title} for {order.upsell.price} →
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Success state for the second sale. */}
                {upsell === "added" && order && (
                    <>
                        <div className={styles.upsellAdded}>
                            <CheckCircle2 size={18} /> Added — {order.upsell.title} is yours.
                            Download it below; we&apos;re sending it to your email too.
                        </div>
                        {upsellDownload && (
                            <div className={styles.downloads} style={{ marginTop: 14 }}>
                                <a href={upsellDownload} download className={styles.downloadButton}>
                                    <Download size={17} /> Download {order.upsell.title}
                                </a>
                            </div>
                        )}
                    </>
                )}

                <Link href="/" className={styles.homeLink}>
                    Back to Jesus Boot Camp →
                </Link>
            </div>
        </div>
    );
}

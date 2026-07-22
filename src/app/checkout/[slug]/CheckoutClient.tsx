"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
    loadStripe,
} from "@stripe/stripe-js";
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";
import { Lock, ShieldCheck, Zap } from "lucide-react";
import styles from "./page.module.css";
import { formatUsd, type CheckoutView } from "@/config/products";

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
// Loaded once at module scope (Stripe recommends this).
const stripePromise = PUBLISHABLE_KEY ? loadStripe(PUBLISHABLE_KEY) : null;

// If the Payment Element hasn't reported `ready` within this window, we assume a
// mount hiccup and rebuild it (same PaymentIntent, so no extra charge). Stripe's
// element usually paints in well under a second; a generous timeout avoids
// remounting a form that's merely on a slow connection.
const READY_TIMEOUT_MS = 8000;
// How many automatic rebuilds before we fall back to a manual "reload" prompt.
const MAX_ATTEMPTS = 2;

export default function CheckoutClient({ view }: { view: CheckoutView }) {
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
    const [initError, setInitError] = useState<string | null>(null);

    // Bumping `attempt` re-keys <Elements>, which tears down and rebuilds the
    // Stripe element from scratch — our recovery path when a load paints blank.
    const [attempt, setAttempt] = useState(0);

    // Buyer-entered state lives here (above <Elements>) so a recovery remount
    // never wipes what they've already typed.
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [bump, setBump] = useState(false);

    // Create the PaymentIntent (base price) as soon as the page loads.
    useEffect(() => {
        let cancelled = false;
        fetch("/api/checkout/create-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug: view.slug, bump: false }),
        })
            .then((r) => r.json())
            .then((d) => {
                if (cancelled) return;
                if (d.clientSecret) {
                    setClientSecret(d.clientSecret);
                    setPaymentIntentId(d.paymentIntentId);
                } else {
                    setInitError(d.error || "Could not start checkout.");
                }
            })
            .catch(() => !cancelled && setInitError("Could not start checkout."));
        return () => {
            cancelled = true;
        };
    }, [view.slug]);

    const requestRemount = useCallback(() => {
        setAttempt((a) => a + 1);
    }, []);

    if (!stripePromise) {
        return (
            <div className={styles.pageWrapper}>
                <div className={styles.container}>
                    <div className={styles.configNotice}>
                        <strong>Checkout isn&apos;t configured yet.</strong>
                        <p>
                            Add <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> (and the server
                            Stripe keys) to <code>.env.local</code> to enable payments. See{" "}
                            <code>.env.example</code>.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <span className={styles.brand}>JESUS BOOT CAMP</span>
                    <span className={styles.secure}>
                        <Lock size={13} /> Secure checkout
                    </span>
                </header>

                {initError ? (
                    <div className={styles.errorBox}>{initError}</div>
                ) : !clientSecret ? (
                    <div className={styles.loading}>Loading secure checkout…</div>
                ) : (
                    <Elements
                        key={attempt}
                        stripe={stripePromise}
                        options={{
                            clientSecret,
                            appearance: {
                                theme: "stripe",
                                variables: {
                                    // NOTE: no custom `fontFamily` here on purpose — the
                                    // Stripe element runs in its own cross-origin iframe and
                                    // can't see the page's Poppins @font-face, so referencing
                                    // it only added a font-load timing dependency for a font
                                    // that always fell back anyway.
                                    colorPrimary: "#2D6A4F",
                                    borderRadius: "10px",
                                },
                            },
                        }}
                    >
                        <CheckoutForm
                            view={view}
                            paymentIntentId={paymentIntentId as string}
                            attempt={attempt}
                            canRetry={attempt < MAX_ATTEMPTS}
                            onRequestRemount={requestRemount}
                            name={name}
                            setName={setName}
                            email={email}
                            setEmail={setEmail}
                            bump={bump}
                            setBump={setBump}
                        />
                    </Elements>
                )}
            </div>
        </div>
    );
}

function CheckoutForm({
    view,
    paymentIntentId,
    attempt,
    canRetry,
    onRequestRemount,
    name,
    setName,
    email,
    setEmail,
    bump,
    setBump,
}: {
    view: CheckoutView;
    paymentIntentId: string;
    attempt: number;
    canRetry: boolean;
    onRequestRemount: () => void;
    name: string;
    setName: (v: string) => void;
    email: string;
    setEmail: (v: string) => void;
    bump: boolean;
    setBump: (v: boolean) => void;
}) {
    const stripe = useStripe();
    const elements = useElements();

    const BASE = view.product.priceCents;
    const BUMP = view.bump?.priceCents ?? 0;
    const hasBump = Boolean(view.bump);
    const CONFIRMATION_PATH = `/checkout/${view.slug}/confirmation`;

    const [submitting, setSubmitting] = useState(false);
    const [bumpUpdating, setBumpUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Payment Element render lifecycle. `paymentReady` gates the Pay button and
    // hides the skeleton; `hardFailed` shows a manual reload prompt once we've
    // exhausted automatic rebuilds.
    const [paymentReady, setPaymentReady] = useState(false);
    const [hardFailed, setHardFailed] = useState(false);
    const paymentWrapRef = useRef<HTMLDivElement | null>(null);

    const total = BASE + (bump ? BUMP : 0);
    const itemCount = bump ? 2 : 1;

    // ── Blank-render safety net ────────────────────────────────────────────
    // The Stripe Payment Element occasionally lays out (reserves height) but
    // never paints its inputs — an intermittent cross-origin-iframe compositor
    // bug that surfaces no console error. We defend on two fronts:
    //   1) a watchdog that rebuilds the element if `ready` never fires, and
    //   2) a repaint "nudge" once it IS ready, to force the browser to
    //      re-composite the iframe in case it painted blank.

    // Watchdog: if the element hasn't reported `ready` shortly after mount,
    // rebuild it (or surface a reload prompt once retries are spent).
    useEffect(() => {
        if (paymentReady) return;
        const t = setTimeout(() => {
            if (canRetry) onRequestRemount();
            else setHardFailed(true);
        }, READY_TIMEOUT_MS);
        return () => clearTimeout(t);
        // Re-arm per mount attempt.
    }, [attempt, paymentReady, canRetry, onRequestRemount]);

    // Force the browser to re-rasterize the Stripe iframe's layer. Toggling a
    // GPU transform (not display) re-composites without making Stripe re-measure
    // to a zero-height container, so it can't itself cause a blank render.
    const nudgeRepaint = useCallback(() => {
        const el = paymentWrapRef.current;
        if (!el) return;
        el.style.transform = "translateZ(0)";
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (paymentWrapRef.current) paymentWrapRef.current.style.transform = "";
            });
        });
    }, []);

    function handlePaymentReady() {
        setPaymentReady(true);
        setHardFailed(false);
        // Nudge immediately and once more shortly after, covering both a paint
        // that lands late and one that arrived blank.
        nudgeRepaint();
        setTimeout(nudgeRepaint, 400);
    }

    function handlePaymentLoadError() {
        if (canRetry) onRequestRemount();
        else setHardFailed(true);
    }

    // Toggling the bump updates the SAME PaymentIntent's amount server-side, so
    // the whole order is a single charge.
    async function toggleBump(next: boolean) {
        setBump(next);
        setBumpUpdating(true);
        try {
            await fetch("/api/checkout/update-intent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentIntentId, slug: view.slug, bump: next }),
            });
        } catch {
            /* amount is recomputed & re-synced at submit anyway */
        } finally {
            setBumpUpdating(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!stripe || !elements || submitting) return;
        setError(null);

        if (!name.trim()) return setError("Please enter your full name.");
        if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Please enter a valid email address.");

        setSubmitting(true);

        // Sync the final amount + attach name/email so the fulfillment webhook can
        // tag the right buyer, then confirm the payment on this page (no redirect
        // for cards).
        try {
            await fetch("/api/checkout/update-intent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentIntentId, slug: view.slug, bump, name, email }),
            });
        } catch {
            setError("Something went wrong preparing your order. Please try again.");
            setSubmitting(false);
            return;
        }

        const { error: confirmErr, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}${CONFIRMATION_PATH}`,
                payment_method_data: { billing_details: { name, email } },
            },
            redirect: "if_required",
        });

        if (confirmErr) {
            setError(confirmErr.message || "Your payment could not be completed.");
            setSubmitting(false);
            return;
        }

        // Card success resolves inline — send them to the confirmation (+ upsell).
        // Pass the client_secret (as Stripe's redirect flow does) so the
        // confirmation page can prove ownership and show the buyer their email.
        const piId = paymentIntent?.id ?? paymentIntentId;
        const cs = paymentIntent?.client_secret ?? "";
        const qs = new URLSearchParams({ payment_intent: piId });
        if (cs) qs.set("payment_intent_client_secret", cs);
        window.location.assign(`${CONFIRMATION_PATH}?${qs.toString()}`);
    }

    return (
        <form className={styles.card} onSubmit={handleSubmit} noValidate>
            {/* ── Live order summary ── */}
            <section className={styles.summary}>
                <div className={styles.summaryHead}>
                    <span>Order summary</span>
                    <span className={styles.itemCount}>
                        {itemCount} {itemCount === 1 ? "item" : "items"}
                    </span>
                </div>
                <div className={styles.summaryRow}>
                    <span>{view.product.title}</span>
                    <span>{formatUsd(BASE)}</span>
                </div>
                {hasBump && bump && view.bump && (
                    <div className={styles.summaryRow}>
                        <span>{view.bump.title}</span>
                        <span>{formatUsd(BUMP)}</span>
                    </div>
                )}
                <div className={styles.summaryTotal}>
                    <span>Total</span>
                    <span>{formatUsd(total)}</span>
                </div>
            </section>

            {/* ── Optional order bump ── */}
            {hasBump && view.bump && (
                <label className={`${styles.bump} ${bump ? styles.bumpOn : ""}`}>
                    <input
                        type="checkbox"
                        className={styles.bumpCheckbox}
                        checked={bump}
                        disabled={bumpUpdating}
                        onChange={(e) => toggleBump(e.target.checked)}
                    />
                    <span className={styles.bumpBody}>
                        <span className={styles.bumpTitle}>
                            Yes, add {view.bump.title} for {formatUsd(BUMP)} more
                        </span>
                        <span className={styles.bumpLine}>{view.bump.blurb}</span>
                    </span>
                </label>
            )}

            {/* ── Two fields only ── */}
            <div className={styles.fields}>
                <label className={styles.field}>
                    <span className={styles.fieldLabel}>Full name</span>
                    <input
                        type="text"
                        className={styles.input}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                        placeholder="Jane Doe"
                    />
                </label>
                <label className={styles.field}>
                    <span className={styles.fieldLabel}>Email</span>
                    <input
                        type="email"
                        className={styles.input}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        inputMode="email"
                        placeholder="you@email.com"
                    />
                    <span className={styles.fieldHint}>
                        Your book is delivered here — no account needed.
                    </span>
                </label>
            </div>

            {/* ── Embedded Payment Element (card / Apple Pay / Google Pay) ── */}
            <div className={styles.paymentWrap} ref={paymentWrapRef}>
                {!paymentReady && !hardFailed && (
                    <div className={styles.paymentSkeleton} aria-hidden="true">
                        <span className={styles.paymentSkeletonText}>
                            Loading secure card form…
                        </span>
                    </div>
                )}
                {hardFailed ? (
                    <div className={styles.retryBox} role="alert">
                        <p className={styles.retryText}>
                            The secure card form didn&apos;t load. Reload the page to try
                            again — your details are safe and you won&apos;t be charged twice.
                        </p>
                        <button
                            type="button"
                            className={styles.retryButton}
                            onClick={() => window.location.reload()}
                        >
                            Reload checkout
                        </button>
                    </div>
                ) : (
                    <PaymentElement
                        onReady={handlePaymentReady}
                        onLoadError={handlePaymentLoadError}
                        options={{
                            layout: "tabs",
                            // We collect name + email in our own two fields above.
                            fields: { billingDetails: { name: "never", email: "never" } },
                        }}
                    />
                )}
            </div>

            {error && (
                <div className={styles.errorBox} role="alert">
                    {error}
                </div>
            )}

            {/* Genuine consent before the card is saved for the one-click upsell. */}
            {view.hasUpsell && (
                <p className={styles.consent}>
                    A one-time optional offer may be shown after purchase, using the same
                    payment method — no need to re-enter your card.
                </p>
            )}

            <button
                type="submit"
                className={styles.payButton}
                disabled={!stripe || !paymentReady || submitting || bumpUpdating}
            >
                {submitting
                    ? "Processing…"
                    : !paymentReady
                    ? "Loading…"
                    : `Pay ${formatUsd(total)}`}
            </button>

            <div className={styles.trustRow}>
                <span>
                    <Lock size={13} /> Secure &amp; encrypted
                </span>
                <span>
                    <Zap size={13} /> Instant delivery
                </span>
                <span>
                    <ShieldCheck size={13} /> 30-day guarantee
                </span>
            </div>
        </form>
    );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Lock, ShieldCheck, Heart, Check } from "lucide-react";
import styles from "./page.module.css";
import { formatUsd } from "@/config/products";
import type { PartnerTierView, PartnerTierId } from "@/config/partner";

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
// Loaded once at module scope (Stripe recommends this).
const stripePromise = PUBLISHABLE_KEY ? loadStripe(PUBLISHABLE_KEY) : null;

// Blank-render safety net (same rationale as the book checkout): the Stripe
// Payment Element occasionally lays out but paints blank on some loads.
const READY_TIMEOUT_MS = 8000;
const MAX_ATTEMPTS = 2;

// Copy below is taken VERBATIM from Paul's "Global Expansion" letter — do not
// reword. The paywall framing (extra material at $25+/mo; core classes always
// free) is his own; per Paul's instruction it stays flagged as pending his
// explicit sign-off before go-live. See src/config/partner.ts.
const UNLOCKS = [
    "An actual video of each class",
    "A passionate 20 minute audio podcast, providing a full explainer of each lesson",
    "A shorter 10 minute video brief of each class",
    "A PowerPoint presentation for those who want to teach it from a platform",
    "A digital Flashcard and a Quiz of each class to help teach children",
    "A targeted topical list of ALL scripture verses on the topic",
];

export default function PartnerJoinClient({ tiers }: { tiers: PartnerTierView[] }) {
    // Default to the middle tier so the Payment Element has an amount at mount;
    // the giver can change it freely.
    const defaultTier = tiers[Math.floor(tiers.length / 2)] ?? tiers[0];
    const [tierId, setTierId] = useState<PartnerTierId>(defaultTier.id);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    // Re-keying <Elements> rebuilds the Stripe element from scratch (recovery
    // path when a load paints blank). Buyer state lives here so a rebuild never
    // wipes it.
    const [attempt, setAttempt] = useState(0);
    const requestRemount = useCallback(() => setAttempt((a) => a + 1), []);

    const selectedTier = tiers.find((t) => t.id === tierId) ?? defaultTier;

    // Elements is created in deferred `subscription` mode with a FIXED initial
    // amount; tier changes are applied imperatively via elements.update() inside
    // the child, so the element never remounts on a tier switch.
    const initialAmount = useRef(selectedTier.amountCents).current;
    const elementsOptions = useMemo(
        () =>
            ({
                mode: "subscription" as const,
                amount: initialAmount,
                currency: "usd",
                appearance: {
                    theme: "stripe" as const,
                    variables: { colorPrimary: "#2D6A4F", borderRadius: "10px" },
                },
            }),
        [initialAmount]
    );

    if (!stripePromise) {
        return (
            <div className={styles.pageWrapper}>
                <div className={styles.container}>
                    <div className={styles.configNotice}>
                        <strong>Partnership checkout isn&apos;t configured yet.</strong>
                        <p>
                            Add <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> and the partner
                            price ids to <code>.env.local</code> to enable it.
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

                {/* ── The pitch — verbatim from Paul's Global Expansion letter ── */}
                <section className={styles.pitch}>
                    <span className={styles.pitchEyebrow}>A word from Paul Joseph, Founder</span>
                    <h1 className={styles.pitchTitle}>We Are ALL Laborers in the Harvest</h1>
                    <p className={styles.pitchLead}>
                        We will always offer the core classes of the Jesus Boot Camp completely
                        FREE OF CHARGE to anyone who wants to grow in faith and reach others with
                        the life-changing Gospel. Moving forward, the extra material below will be
                        made available to those who partner with us with a monthly donation of $25
                        or more:
                    </p>
                    <ul className={styles.unlockList}>
                        {UNLOCKS.map((u) => (
                            <li key={u} className={styles.unlockItem}>
                                <Check size={15} className={styles.unlockCheck} /> {u}
                            </li>
                        ))}
                    </ul>
                    <p className={styles.pitchNote}>
                        If you can&apos;t afford to partner you will still receive all the classes
                        in full as a PDF file that you can share with others. By partnering, you are
                        putting &ldquo;wind in our sails&rdquo; to finance the global expansion and
                        translation of this curriculum.
                    </p>
                </section>

                <div className={styles.card}>
                    {/* ── Tier selection (a values decision, shown as cards) ── */}
                    <div className={styles.tierGroup} role="radiogroup" aria-label="Choose your monthly partnership">
                        {tiers.map((t) => {
                            const active = t.id === tierId;
                            return (
                                <button
                                    key={t.id}
                                    type="button"
                                    role="radio"
                                    aria-checked={active}
                                    className={`${styles.tierCard} ${active ? styles.tierCardActive : ""}`}
                                    onClick={() => setTierId(t.id)}
                                >
                                    <span className={styles.tierAmount}>{t.amountLabel}</span>
                                    <span className={styles.tierPer}>/month</span>
                                    <span className={styles.tierLabel}>{t.label}</span>
                                    {active && <Check size={16} className={styles.tierCheck} />}
                                </button>
                            );
                        })}
                    </div>

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
                                Your extra material is delivered here — no account needed.
                            </span>
                        </label>
                    </div>

                    <Elements key={attempt} stripe={stripePromise} options={elementsOptions}>
                        <PartnerPaymentSection
                            selectedTier={selectedTier}
                            tierId={tierId}
                            name={name}
                            email={email}
                            attempt={attempt}
                            canRetry={attempt < MAX_ATTEMPTS}
                            onRequestRemount={requestRemount}
                        />
                    </Elements>
                </div>
            </div>
        </div>
    );
}

function PartnerPaymentSection({
    selectedTier,
    tierId,
    name,
    email,
    attempt,
    canRetry,
    onRequestRemount,
}: {
    selectedTier: PartnerTierView;
    tierId: PartnerTierId;
    name: string;
    email: string;
    attempt: number;
    canRetry: boolean;
    onRequestRemount: () => void;
}) {
    const stripe = useStripe();
    const elements = useElements();

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [paymentReady, setPaymentReady] = useState(false);
    const [hardFailed, setHardFailed] = useState(false);
    const paymentWrapRef = useRef<HTMLDivElement | null>(null);

    const CONFIRMATION_PATH = "/partner/join/confirmation";
    const amountLabel = formatUsd(selectedTier.amountCents);

    // Keep the deferred Elements amount in sync when the giver switches tier, so
    // the Payment Element (and any wallet buttons) reflect the right figure. The
    // server still re-resolves the real amount from the tier at submit.
    useEffect(() => {
        if (elements) elements.update({ amount: selectedTier.amountCents });
    }, [elements, selectedTier.amountCents]);

    // Watchdog: rebuild the element if `ready` never fires; manual reload once
    // retries are spent.
    useEffect(() => {
        if (paymentReady) return;
        const t = setTimeout(() => {
            if (canRetry) onRequestRemount();
            else setHardFailed(true);
        }, READY_TIMEOUT_MS);
        return () => clearTimeout(t);
    }, [attempt, paymentReady, canRetry, onRequestRemount]);

    // Force the browser to re-rasterize the Stripe iframe's layer if it painted
    // blank. Toggling a GPU transform (not display) can't make Stripe re-measure
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
        nudgeRepaint();
        setTimeout(nudgeRepaint, 400);
    }

    function handlePaymentLoadError() {
        if (canRetry) onRequestRemount();
        else setHardFailed(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!stripe || !elements || submitting) return;
        setError(null);

        if (!name.trim()) return setError("Please enter your full name.");
        if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Please enter a valid email address.");

        setSubmitting(true);

        // Deferred flow: validate the element, create the subscription server-side
        // (amount resolved authoritatively from the tier), then confirm the first
        // invoice's payment inline.
        const { error: submitError } = await elements.submit();
        if (submitError) {
            setError(submitError.message || "Please check your payment details.");
            setSubmitting(false);
            return;
        }

        let clientSecret: string;
        try {
            const res = await fetch("/api/partner/create-subscription", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tier: tierId, name, email }),
            });
            const data = await res.json();
            if (!res.ok || !data.clientSecret) {
                throw new Error(data.error || "Could not start your partnership.");
            }
            clientSecret = data.clientSecret;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
            setSubmitting(false);
            return;
        }

        const firstName = name.trim().split(/\s+/)[0] || "";
        const returnQs = new URLSearchParams({ tier: tierId, name: firstName });
        const { error: confirmErr } = await stripe.confirmPayment({
            elements,
            clientSecret,
            confirmParams: {
                return_url: `${window.location.origin}${CONFIRMATION_PATH}?${returnQs.toString()}`,
                payment_method_data: { billing_details: { name, email } },
            },
            redirect: "if_required",
        });

        if (confirmErr) {
            setError(confirmErr.message || "Your payment could not be completed.");
            setSubmitting(false);
            return;
        }

        // Card success resolves inline (wallets may have redirected already).
        window.location.assign(`${CONFIRMATION_PATH}?${returnQs.toString()}`);
    }

    return (
        <form className={styles.payForm} onSubmit={handleSubmit} noValidate>
            <div className={styles.paymentWrap} ref={paymentWrapRef}>
                {!paymentReady && !hardFailed && (
                    <div className={styles.paymentSkeleton} aria-hidden="true">
                        <span className={styles.paymentSkeletonText}>Loading secure card form…</span>
                    </div>
                )}
                {hardFailed ? (
                    <div className={styles.retryBox} role="alert">
                        <p className={styles.retryText}>
                            The secure card form didn&apos;t load. Reload the page to try again —
                            you won&apos;t be charged twice.
                        </p>
                        <button
                            type="button"
                            className={styles.retryButton}
                            onClick={() => window.location.reload()}
                        >
                            Reload
                        </button>
                    </div>
                ) : (
                    <PaymentElement
                        onReady={handlePaymentReady}
                        onLoadError={handlePaymentLoadError}
                        options={{
                            layout: "tabs",
                            // Name + email are collected in our own two fields above.
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

            <p className={styles.recurringNote}>
                <Heart size={13} /> This is a recurring monthly gift. Cancel anytime — one email
                and it stops.
            </p>

            <button
                type="submit"
                className={styles.payButton}
                disabled={!stripe || !paymentReady || submitting}
            >
                {submitting
                    ? "Processing…"
                    : !paymentReady
                    ? "Loading…"
                    : `Partner With Us at ${amountLabel}/month`}
            </button>

            <div className={styles.trustRow}>
                <span>
                    <Lock size={13} /> Secure &amp; encrypted
                </span>
                <span>
                    <ShieldCheck size={13} /> Cancel anytime
                </span>
            </div>
        </form>
    );
}

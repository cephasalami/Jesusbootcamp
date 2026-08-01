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

// Blank-render safety net (same NON-DESTRUCTIVE approach as the book checkout):
// never rebuild the element on a timer (that destroys a slow-but-working mobile
// load and causes resize churn + blank collapse). Nudge a repaint if it's slow,
// offer a MANUAL reload only after a long wait, and rebuild ONLY on a real
// `loaderror`.
const NUDGE_AT_MS = 6000;
const HARD_FAIL_MS = 22000;
const MAX_ATTEMPTS = 2;
const CUSTOM_MIN_CENTS = 100; // $1 — mirrors PARTNER_MIN_CENTS server-side

type Selection = PartnerTierId | "custom";

// Copy below is taken VERBATIM from Paul's "Global Expansion" letter — do not
// reword. The paywall framing (extra material at $25+/mo; core classes always
// free) is his own; per Paul's instruction it stays flagged as pending his
// explicit sign-off before go-live. See src/config/partner.ts.
// 7-item list from Paul's letter. The ALL-CAPS words are kept in caps AND bold
// per his explicit instruction. Rendered with the same checkmark style as before.
const UNLOCKS = [
    <>An actual <strong>VIDEO</strong> of each class</>,
    <>A passionate 20 minute audio <strong>PODCAST</strong>, providing a full explainer of each lesson</>,
    <>A shorter 10 minute <strong>VIDEO OVERVIEW</strong> of each class</>,
    <>A <strong>POWERPOINT</strong> presentation for those who want to teach it from a platform</>,
    <>A <strong>QUIZ</strong> of each class to help teach children</>,
    <>A targeted list of the class&apos;s <strong>MAIN POINTS</strong> for your study group</>,
    <>
        A <strong>TOPICAL LIST</strong> of <strong>ALL SCRIPTURE</strong> verses on the topic for
        those who wish to proclaim, memorize, and strengthen the particular area of their walk with
        the Lord.
    </>,
];

/** Parse a dollar string to whole cents, or 0 when invalid/empty. */
function dollarsToCents(v: string): number {
    const n = parseFloat(v);
    return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0;
}

export default function PartnerJoinClient({ tiers }: { tiers: PartnerTierView[] }) {
    // Default to the middle preset so the Payment Element has an amount at mount;
    // the giver can change it freely (including "Other amount").
    const defaultTier = tiers[Math.floor(tiers.length / 2)] ?? tiers[0];
    const [selection, setSelection] = useState<Selection>(defaultTier.id);
    const [customDollars, setCustomDollars] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    // Re-keying <Elements> rebuilds the Stripe element from scratch (recovery
    // path when a load paints blank). Buyer state lives here so a rebuild never
    // wipes it.
    const [attempt, setAttempt] = useState(0);
    const requestRemount = useCallback(() => setAttempt((a) => a + 1), []);

    const customCents = dollarsToCents(customDollars);
    const presetTier = selection === "custom" ? undefined : tiers.find((t) => t.id === selection);
    const effectiveCents = selection === "custom" ? customCents : presetTier?.amountCents ?? 0;

    // Elements is created in deferred `subscription` mode with a FIXED initial
    // amount; amount changes are applied imperatively via elements.update() inside
    // the child, so the element never remounts on a selection change.
    const [initialAmount] = useState(defaultTier.amountCents);
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
                        the life-changing Gospel.
                    </p>
                    <p className={styles.pitchLead}>
                        However, when you <em>invest in the &ldquo;Jesus Boot Camp&rdquo;</em>, you
                        are funding a <em>plug-and-play discipleship tool</em> that you can take
                        directly into your church, your network, or your city to build
                        self-sustaining hubs of active Christianity.
                    </p>
                    <p className={styles.pitchLead}>
                        Therefore we need your financial partnership to allow us to{" "}
                        <em>produce</em> this curriculum at the highest tier of quality,{" "}
                        <em>translate</em> it, scale <em>digital</em> access worldwide, and get it
                        into the hands of &ldquo;disciplers&rdquo; globally who are desperate for a
                        reproducible model.
                    </p>
                    <p className={styles.pitchLead}>
                        Moving forward, the <strong>extra material</strong> below will be made
                        available to those who partner with us with a monthly donation of any
                        amount:
                    </p>
                    <ul className={styles.unlockList}>
                        {UNLOCKS.map((u, i) => (
                            <li key={i} className={styles.unlockItem}>
                                <Check size={15} className={styles.unlockCheck} /> <span>{u}</span>
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
                    <p className={styles.anyAmountLine}>
                        Partner with a monthly donation of <strong>any amount</strong> — every gift
                        fuels the mission.
                    </p>

                    {/* ── Amount selection: presets + "Other amount" ── */}
                    <div
                        className={styles.tierGroup}
                        role="radiogroup"
                        aria-label="Choose your monthly partnership"
                    >
                        {tiers.map((t) => {
                            const active = selection === t.id;
                            return (
                                <button
                                    key={t.id}
                                    type="button"
                                    role="radio"
                                    aria-checked={active}
                                    className={`${styles.tierCard} ${active ? styles.tierCardActive : ""}`}
                                    onClick={() => setSelection(t.id)}
                                >
                                    <span className={styles.tierAmount}>{t.amountLabel}</span>
                                    <span className={styles.tierPer}>/month</span>
                                    <span className={styles.tierLabel}>{t.label}</span>
                                    {active && <Check size={16} className={styles.tierCheck} />}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        type="button"
                        role="radio"
                        aria-checked={selection === "custom"}
                        className={`${styles.otherCard} ${selection === "custom" ? styles.otherCardActive : ""}`}
                        onClick={() => setSelection("custom")}
                    >
                        <span>Other amount</span>
                        {selection === "custom" && <Check size={16} className={styles.tierCheck} />}
                    </button>

                    {selection === "custom" && (
                        <label className={styles.customWrap}>
                            <span className={styles.customCurrency}>$</span>
                            <input
                                type="number"
                                inputMode="decimal"
                                min={1}
                                step={1}
                                className={styles.customInput}
                                value={customDollars}
                                onChange={(e) => setCustomDollars(e.target.value)}
                                placeholder="Enter amount"
                                aria-label="Custom monthly amount in dollars"
                                autoFocus
                            />
                            <span className={styles.customPer}>/month</span>
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
                                Your extra material is delivered here — no account needed.
                            </span>
                        </label>
                    </div>

                    <Elements key={attempt} stripe={stripePromise} options={elementsOptions}>
                        <PartnerPaymentSection
                            selection={selection}
                            tierId={selection === "custom" ? null : selection}
                            customCents={customCents}
                            effectiveCents={effectiveCents}
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
    selection,
    tierId,
    customCents,
    effectiveCents,
    name,
    email,
    attempt,
    canRetry,
    onRequestRemount,
}: {
    selection: Selection;
    tierId: PartnerTierId | null;
    customCents: number;
    effectiveCents: number;
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
    const customTooLow = selection === "custom" && customCents < CUSTOM_MIN_CENTS;
    const amountLabel = effectiveCents > 0 ? formatUsd(effectiveCents) : "$0";

    // Keep the deferred Elements amount in sync as the giver changes their choice.
    // Guard against invalid (< $1) amounts so we never push 0 into Stripe.
    useEffect(() => {
        if (elements && effectiveCents >= CUSTOM_MIN_CENTS) {
            elements.update({ amount: effectiveCents });
        }
    }, [elements, effectiveCents]);

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

    // Slow-load handling: nudge a repaint if it hasn't painted, then (much later)
    // offer a MANUAL reload. Never auto-rebuilds — a slow mobile load finishes on
    // its own; only a genuine `loaderror` triggers a rebuild.
    useEffect(() => {
        if (paymentReady) return;
        const nudge = setTimeout(nudgeRepaint, NUDGE_AT_MS);
        const fail = setTimeout(() => setHardFailed(true), HARD_FAIL_MS);
        return () => {
            clearTimeout(nudge);
            clearTimeout(fail);
        };
    }, [attempt, paymentReady, nudgeRepaint]);

    function handlePaymentReady() {
        setPaymentReady(true);
        setHardFailed(false);
        nudgeRepaint();
        setTimeout(nudgeRepaint, 400);
        setTimeout(nudgeRepaint, 1500);
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
        if (selection === "custom" && customCents < CUSTOM_MIN_CENTS) {
            return setError("Please enter a monthly amount of at least $1.");
        }

        setSubmitting(true);

        // Deferred flow: validate the element, create the subscription server-side
        // (amount re-validated authoritatively there), then confirm the first
        // invoice's payment inline.
        const { error: submitError } = await elements.submit();
        if (submitError) {
            setError(submitError.message || "Please check your payment details.");
            setSubmitting(false);
            return;
        }

        const payload =
            selection === "custom"
                ? { customAmountCents: customCents, name, email }
                : { tier: tierId, name, email };

        let clientSecret: string;
        try {
            const res = await fetch("/api/partner/create-subscription", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
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
        const returnQs = new URLSearchParams({
            tier: selection,
            amount: String(effectiveCents / 100),
            name: firstName,
        });
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
                disabled={!stripe || !paymentReady || submitting || customTooLow}
            >
                {submitting
                    ? "Processing…"
                    : !paymentReady
                    ? "Loading…"
                    : customTooLow
                    ? "Enter an amount ($1 min)"
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

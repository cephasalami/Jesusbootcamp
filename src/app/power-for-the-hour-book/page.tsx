"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import AOS from "aos";
import "aos/dist/aos.css";
import {
    Flame,
    Hand,
    Shield,
    ShieldCheck,
    Check,
    Lock,
    Zap,
    Smartphone,
} from "lucide-react";
import styles from "./page.module.css";
import { trackFbEvent } from "@/lib/fbq";

// Standalone sales page for cold ad traffic. No discount code — unlike the
// /power-for-the-hour upsell. Do not merge the two.
//
// Sells through the on-site embedded Stripe checkout so buyers never leave the
// domain. Price matches the catalog $5 offer in BOOKS in src/config/products.ts.
const CHECKOUT_URL = "/checkout/power-for-the-hour";
const PRICE = 5;

export default function PowerForTheHourBookPage() {
    const [showStickyBar, setShowStickyBar] = useState(false);

    useEffect(() => {
        AOS.init({ duration: 600, once: true, easing: "ease-out" });
    }, []);

    useEffect(() => {
        const onScroll = () => setShowStickyBar(window.scrollY > 560);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Fire InitiateCheckout when a visitor clicks through to the on-site checkout.
    // The Purchase event fires later on the checkout confirmation page, so this
    // records accurate checkout intent at the top of the funnel.
    const handleCheckoutClick = () => {
        trackFbEvent("InitiateCheckout", {
            value: PRICE,
            currency: "USD",
            content_name: "Power for the Hour",
            content_ids: ["3229"],
            content_type: "product",
        });
    };

    return (
        <div className={styles.pageWrapper}>
            {/* ═══ HERO / CORE OFFER ═══ */}
            <section className={styles.heroSection}>
                <div className={styles.container}>
                    <div className={styles.heroGrid}>
                        {/* LEFT — Text */}
                        <div data-aos="fade-up">
                            <div className={styles.labelWrapper}>
                                <span className={styles.labelText}>
                                    SCRIPTURE YOU CAN CARRY BY HEART
                                </span>
                            </div>

                            <h1 className={`${styles.headingDisplay} ${styles.heroH1}`}>
                                The Right Scripture, Ready When You Need It Most.
                            </h1>

                            <p className={styles.heroSub}>
                                <strong>Power for the Hour</strong> puts the essential scriptures
                                every disciple needs — for identity, evangelism, and standing firm
                                — into your heart. Memorized. Ready. Yours forever.
                            </p>

                            <ul className={styles.heroChecklist}>
                                <li>
                                    <span className={styles.checkIcon}>
                                        <Check size={14} strokeWidth={3} />
                                    </span>
                                    The essential verses for identity, evangelism &amp; standing
                                    firm — in one place
                                </li>
                                <li>
                                    <span className={styles.checkIcon}>
                                        <Check size={14} strokeWidth={3} />
                                    </span>
                                    Organized so you can memorize them, use them, and teach them
                                </li>
                                <li>
                                    <span className={styles.checkIcon}>
                                        <Check size={14} strokeWidth={3} />
                                    </span>
                                    A digital copy (PDF) to add to your phone&apos;s home
                                    screen — for easy access when memorizing
                                </li>
                            </ul>

                            <div className={styles.priceBlock}>
                                <span className={`${styles.headingDisplay} ${styles.priceNow}`}>
                                    $5
                                </span>
                                <span className={styles.priceUnit}>
                                    One-time · Instant PDF
                                </span>
                            </div>

                            <p className={styles.savingsLine}>
                                A one-time payment of $5 — no subscription, no hidden fees.
                                Instant digital delivery to any device.
                            </p>

                            <Link
                                href={CHECKOUT_URL}
                                onClick={handleCheckoutClick}
                                className={styles.ctaButton}
                            >
                                Get Power for the Hour — $5
                                <span className={styles.ctaArrow} aria-hidden="true">
                                    →
                                </span>
                            </Link>

                            <div className={styles.trustRow}>
                                <span className={styles.trustItem}>
                                    <Lock size={14} /> Secure checkout
                                </span>
                                <span className={styles.trustItem}>
                                    <Zap size={14} /> Instant digital delivery
                                </span>
                                <span className={styles.trustItem}>
                                    <ShieldCheck size={14} /> 30-day guarantee
                                </span>
                            </div>
                        </div>

                        {/* RIGHT — Book Mockup */}
                        <div
                            className={styles.mockupImageWrapper}
                            data-aos="fade-up"
                            data-aos-delay="100"
                        >
                            <div className={styles.mockupGlow} aria-hidden="true" />
                            <Image
                                src="/images/power-for-the-hour/power-for-the-hour-paperback.webp"
                                alt="Power for the Hour by Paul Joseph — Book Mockup"
                                width={900}
                                height={1179}
                                className={styles.mockupImage}
                                preload
                            />
                            <div className={styles.mockupBadge} aria-hidden="true">
                                <span className={styles.badgeSmall}>INSTANT</span>
                                <span className={styles.badgeBig}>PDF</span>
                                <span className={styles.badgeSmall}>DELIVERY</span>
                            </div>
                            <div className={styles.mockupCaption}>
                                <Smartphone size={13} /> A digital copy to add to your
                                phone&apos;s home screen — easy access while you memorize
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ WHAT IS POWER FOR THE HOUR ═══ */}
            <section className={styles.whatSection}>
                <div className={styles.whatContainer}>
                    <h2
                        className={`${styles.headingDisplay} ${styles.sectionH2}`}
                        data-aos="fade-up"
                    >
                        The Scriptures Every Disciple Must Know. Memorized.
                    </h2>
                    <p className={styles.sectionSub} data-aos="fade-up">
                        These are the verses every disciple should carry by heart — the
                        essential scriptures for identity, evangelism, and standing firm,
                        organized so you can memorize them, use them, and teach them.
                    </p>

                    <div className={styles.benefitsGrid}>
                        {/* Block 1 */}
                        <div className={styles.benefitCard} data-aos="fade-up">
                            <div className={styles.benefitIcon}>
                                <Flame size={22} />
                            </div>
                            <h3 className={styles.benefitLabel}>Know Who You Are</h3>
                            <p className={styles.benefitText}>
                                The key scriptures on identity, purpose, and calling — so no
                                attack on your faith can shake what you know about yourself.
                            </p>
                        </div>

                        {/* Block 2 */}
                        <div
                            className={styles.benefitCard}
                            data-aos="fade-up"
                            data-aos-delay="100"
                        >
                            <div className={styles.benefitIcon}>
                                <Hand size={22} />
                            </div>
                            <h3 className={styles.benefitLabel}>
                                Share the Gospel Confidently
                            </h3>
                            <p className={styles.benefitText}>
                                The exact scriptures for sharing the message of Christ —
                                organized so you never freeze when someone asks the hard
                                questions.
                            </p>
                        </div>

                        {/* Block 3 */}
                        <div
                            className={styles.benefitCard}
                            data-aos="fade-up"
                            data-aos-delay="200"
                        >
                            <div className={styles.benefitIcon}>
                                <Shield size={22} />
                            </div>
                            <h3 className={styles.benefitLabel}>
                                Stand Firm Under Pressure
                            </h3>
                            <p className={styles.benefitText}>
                                When doubt, fear, or opposition comes — these are the verses
                                that hold the line. Memorized. Ready.
                            </p>
                        </div>

                        {/* Block 4 */}
                        <div
                            className={styles.benefitCard}
                            data-aos="fade-up"
                            data-aos-delay="300"
                        >
                            <div className={styles.benefitIcon}>
                                <svg
                                    width="22"
                                    height="22"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <circle cx="12" cy="12" r="3" />
                                    <circle cx="12" cy="12" r="7" opacity="0.5" />
                                    <circle cx="12" cy="12" r="11" opacity="0.25" />
                                </svg>
                            </div>
                            <h3 className={styles.benefitLabel}>Multiply Your Impact</h3>
                            <p className={styles.benefitText}>
                                Teach these scriptures to others. This is how one disciple
                                becomes five. Then twenty-five. Then more.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ AUTHOR ═══ */}
            <section className={styles.authorSection}>
                <div className={styles.authorCard} data-aos="fade-up">
                    <Image
                        src="/images/paul-joseph.jpg"
                        alt="Paul Joseph — Founder of Jesus Boot Camp"
                        width={200}
                        height={200}
                        className={styles.authorPhoto}
                    />
                    <div className={styles.authorContent}>
                        <div className={styles.authorEyebrow}>A Note From the Founder</div>
                        <h2 className={`${styles.headingDisplay} ${styles.authorName}`}>
                            Paul Joseph
                        </h2>
                        <div className={styles.authorRole}>
                            Founder &amp; Author, Jesus Boot Camp
                        </div>
                        <p className={styles.authorBio}>
                            &ldquo;When I wrote the{" "}
                            <em>Handbook for a Disciple of Jesus</em> — now used by
                            teachers, preachers, and churches around the world — I kept
                            seeing the same thing: many are born again, but few are made
                            into disciples. <strong>Power for the Hour</strong>{" "}
                            is my answer. These are the verses I believe every disciple should
                            carry by heart — and today I want to put them in your hands
                            for less than the cost of lunch.&rdquo;
                        </p>
                    </div>
                </div>
            </section>

            {/* ═══ FINAL CTA / OFFER BOX ═══ */}
            <section className={styles.finalCtaSection}>
                <div className={styles.finalCtaContainer} data-aos="fade-up">
                    <h2 className={`${styles.headingDisplay} ${styles.finalH2}`}>
                        Carry the Essential Scriptures With You.
                    </h2>
                    <p className={styles.finalSub}>
                        A one-time payment. Instant digital delivery. Yours to keep and read
                        on any device.
                    </p>

                    <div className={styles.offerBox}>
                        <div className={styles.offerBoxHeader}>
                            INSTANT DIGITAL EDITION · PDF
                        </div>
                        <div className={styles.offerBoxBody}>
                            <div className={styles.offerBoxTop}>
                                <Image
                                    src="/images/power-for-the-hour/power-for-the-hour-paperback.webp"
                                    alt="Power for the Hour — Digital Edition"
                                    width={900}
                                    height={1179}
                                    className={styles.offerBoxImage}
                                />
                                <div>
                                    <h3
                                        className={`${styles.headingDisplay} ${styles.offerBoxTitle}`}
                                    >
                                        Power for the Hour
                                    </h3>
                                    <div className={styles.offerBoxSubtitle}>
                                        Instant Digital Copy · PDF
                                    </div>
                                </div>
                            </div>

                            <ul className={styles.offerList}>
                                <li>
                                    <span className={styles.checkIcon}>
                                        <Check size={14} strokeWidth={3} />
                                    </span>
                                    The essential scriptures for identity, evangelism &amp;
                                    standing firm
                                </li>
                                <li>
                                    <span className={styles.checkIcon}>
                                        <Check size={14} strokeWidth={3} />
                                    </span>
                                    Organized to memorize, use, and teach
                                </li>
                                <li>
                                    <span className={styles.checkIcon}>
                                        <Check size={14} strokeWidth={3} />
                                    </span>
                                    A digital copy to add to your phone&apos;s home screen —
                                    easy access while you memorize
                                </li>
                                <li>
                                    <span className={styles.checkIcon}>
                                        <Check size={14} strokeWidth={3} />
                                    </span>
                                    30-day money-back guarantee
                                </li>
                            </ul>

                            <div className={styles.finalPriceBlock}>
                                <span
                                    className={`${styles.headingDisplay} ${styles.priceNow} ${styles.priceFinal}`}
                                >
                                    $5
                                </span>
                                <span className={styles.priceUnit}>One-time payment</span>
                            </div>

                            <Link
                                href={CHECKOUT_URL}
                                onClick={handleCheckoutClick}
                                className={`${styles.ctaButton} ${styles.finalCtaButton}`}
                            >
                                Get Power for the Hour — $5
                                <span className={styles.ctaArrow} aria-hidden="true">
                                    →
                                </span>
                            </Link>

                            <p className={styles.securityLine}>
                                🔒 Secure checkout · One-time payment · Instant digital
                                copy (PDF) for your phone
                            </p>
                        </div>
                    </div>

                    <div className={styles.guaranteeBox} data-aos="fade-up">
                        <div className={styles.guaranteeIcon}>
                            <ShieldCheck size={30} />
                        </div>
                        <div>
                            <div className={styles.guaranteeTitle}>
                                30-Day Money-Back Guarantee
                            </div>
                            <p className={styles.guaranteeText}>
                                If Power for the Hour doesn&apos;t strengthen your walk with
                                God, reply to your delivery email within 30 days and we&apos;ll
                                refund your $5 — no questions asked. And the digital copy
                                is yours to keep.
                            </p>
                        </div>
                    </div>

                    {/* Soft cross-link — an additional free resource, not a decline. */}
                    <div className={styles.softLinkSection}>
                        <Link href="/handbook" className={styles.softLink}>
                            Also want the free Handbook for a Disciple of Jesus? Get it here
                            →
                        </Link>
                    </div>
                </div>
            </section>

            {/* ═══ STICKY MOBILE CTA BAR ═══ */}
            <div
                className={`${styles.stickyBar} ${
                    showStickyBar ? styles.stickyBarVisible : ""
                }`}
                aria-hidden={!showStickyBar}
            >
                <div className={styles.stickyBarPrice}>
                    <span className={`${styles.headingDisplay} ${styles.stickyBarNew}`}>
                        $5
                    </span>
                </div>
                <Link
                    href={CHECKOUT_URL}
                    onClick={handleCheckoutClick}
                    className={styles.stickyBarButton}
                    tabIndex={showStickyBar ? 0 : -1}
                >
                    Get the Book →
                </Link>
            </div>
        </div>
    );
}

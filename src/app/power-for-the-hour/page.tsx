"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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

const CHECKOUT_URL =
    "https://faithwithoutborders.us/cart/?add-to-cart=3229&code=BOOTCAMP5";
const OFFER_MINUTES = 15;

/** Session-persisted countdown so a refresh doesn't reset the clock. */
function useOfferCountdown() {
    const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

    useEffect(() => {
        const KEY = "pfth-offer-deadline";
        let deadline = Number(sessionStorage.getItem(KEY));
        if (!deadline || Number.isNaN(deadline) || deadline < Date.now() - 24 * 60 * 60 * 1000) {
            deadline = Date.now() + OFFER_MINUTES * 60 * 1000;
            sessionStorage.setItem(KEY, String(deadline));
        }
        const tick = () =>
            setSecondsLeft(Math.max(0, Math.round((deadline - Date.now()) / 1000)));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    return secondsLeft;
}

function formatTime(totalSeconds: number) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
}

export default function PowerForTheHourPage() {
    const secondsLeft = useOfferCountdown();
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

    return (
        <div className={styles.pageWrapper}>
            {/* ═══ SECTION 1: PROGRESS BAR ═══ */}
            <div className={styles.progressBar}>
                <div className={`${styles.progressStep} ${styles.stepCompleted}`}>
                    ✓ Handbook Requested
                </div>
                <span className={styles.progressChevron}>›</span>
                <div className={`${styles.progressStep} ${styles.stepCurrent}`}>
                    → Special Offer
                </div>
                <span className={styles.progressChevron}>›</span>
                <div className={`${styles.progressStep} ${styles.stepUpcoming}`}>
                    Download
                </div>
            </div>

            {/* ═══ SECTION 2: STICKY URGENCY BANNER + COUNTDOWN ═══ */}
            <div className={styles.urgencyBanner}>
                <span>⚡ ONE-TIME OFFER</span>
                <span className={styles.bannerDivider}>·</span>
                {secondsLeft === null ? (
                    <span>This special price disappears when you leave this page</span>
                ) : secondsLeft > 0 ? (
                    <span>
                        This page expires in{" "}
                        <span className={styles.timerDigits} aria-hidden="true">
                            {formatTime(secondsLeft)}
                        </span>
                    </span>
                ) : (
                    <span>Offer expiring — complete your order now</span>
                )}
            </div>

            {/* ═══ SECTION 3: HERO / CORE OFFER ═══ */}
            <section className={styles.heroSection}>
                <div className={styles.container}>
                    <div className={styles.heroGrid}>
                        {/* LEFT — Text */}
                        <div data-aos="fade-up">
                            <div className={styles.labelWrapper}>
                                <span className={styles.labelText}>
                                    WAIT — BEFORE YOUR HANDBOOK ARRIVES...
                                </span>
                            </div>

                            <h1 className={`${styles.headingDisplay} ${styles.heroH1}`}>
                                The Right Scripture, Ready When You Need It Most.
                            </h1>

                            <p className={styles.heroSub}>
                                Your free Handbook shows you every scripture for every
                                situation. <strong>Power for the Hour</strong> puts the most
                                essential ones in your heart — memorized, ready, yours forever.
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
                                    Instant digital download (PDF) — read it on your phone,
                                    nothing ships to your door
                                </li>
                            </ul>

                            <div className={styles.priceBlock}>
                                <span className={styles.priceOriginal}>$15</span>
                                <span className={`${styles.headingDisplay} ${styles.priceNow}`}>
                                    $5
                                </span>
                                <span className={styles.priceTag}>Save 67% Today</span>
                            </div>

                            <p className={styles.savingsLine}>
                                One-time payment of $5 — total. No hidden fees, no
                                subscription. This price is not available anywhere else.
                            </p>

                            <a href={CHECKOUT_URL} className={styles.ctaButton} role="button">
                                Yes — Add Power for the Hour for $5
                                <span className={styles.ctaArrow} aria-hidden="true">
                                    →
                                </span>
                            </a>

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
                                src="/images/power-for-the-hour/power-for-the-hour-book.webp"
                                alt="Power for the Hour by Paul Joseph — Book Mockup"
                                width={900}
                                height={1186}
                                className={styles.mockupImage}
                                preload
                            />
                            <div className={styles.mockupBadge} aria-hidden="true">
                                <span className={styles.badgeSmall}>ONLY</span>
                                <span className={styles.badgeBig}>$5</span>
                                <span className={styles.badgeSmall}>TODAY</span>
                            </div>
                            <div className={styles.mockupCaption}>
                                <Smartphone size={13} /> Digital edition · Instant PDF
                                download — no physical book is shipped
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ SECTION 4: WHAT IS POWER FOR THE HOUR ═══ */}
            <section className={styles.whatSection}>
                <div className={styles.whatContainer}>
                    <h2
                        className={`${styles.headingDisplay} ${styles.sectionH2}`}
                        data-aos="fade-up"
                    >
                        The Scriptures Every Disciple Must Know. Memorized.
                    </h2>
                    <p className={styles.sectionSub} data-aos="fade-up">
                        The Handbook gives you every scripture for every situation.
                        Power for the Hour takes it deeper — giving you the essential
                        verses every disciple must have memorized.
                    </p>

                    <div className={styles.benefitsGrid}>
                        {/* Block 1 */}
                        <div className={styles.benefitCard} data-aos="fade-up">
                            <div className={styles.benefitIcon}>
                                <Flame size={22} />
                            </div>
                            <div className={styles.benefitLabel}>Know Who You Are</div>
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
                            <div className={styles.benefitLabel}>
                                Share the Gospel Confidently
                            </div>
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
                            <div className={styles.benefitLabel}>
                                Stand Firm Under Pressure
                            </div>
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
                            <div className={styles.benefitLabel}>Multiply Your Impact</div>
                            <p className={styles.benefitText}>
                                Teach these scriptures to others. This is how one disciple
                                becomes five. Then twenty-five. Then more.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ SECTION 5: AUTHOR ═══ */}
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
                        <div className={`${styles.headingDisplay} ${styles.authorName}`}>
                            Paul Joseph
                        </div>
                        <div className={styles.authorRole}>
                            Founder &amp; Author, Jesus Boot Camp
                        </div>
                        <p className={styles.authorBio}>
                            &ldquo;When I wrote the{" "}
                            <em>Handbook for a Disciple of Jesus</em> — now used in
                            prisons, churches, and youth groups around the world — I kept
                            seeing the same thing: many are born again, but few are made
                            into disciples. <strong>Power for the Hour</strong>{" "}
                            is my answer. These are the verses I believe every disciple should
                            carry by heart — and today I want to put them in your hands
                            for less than the cost of lunch.&rdquo;
                        </p>
                    </div>
                </div>
            </section>

            {/* ═══ SECTION 6: SOCIAL PROOF ═══ */}
            <section className={styles.socialSection}>
                <div className={styles.socialContainer}>
                    <h2
                        className={`${styles.headingDisplay} ${styles.socialH2}`}
                        data-aos="fade-up"
                    >
                        What Disciples Who Have Both Books Are Saying
                    </h2>

                    <div className={styles.socialGrid}>
                        {/* Card 1 */}
                        <div className={styles.quoteCard} data-aos="fade-up">
                            <div className={styles.quoteStars}>★★★★★</div>
                            <p className={styles.quoteText}>
                                &ldquo;I read the Handbook first and it changed how I think about
                                Scripture. Power for the Hour took it to another level — I have
                                these verses in my heart now. I&apos;m a different man.&rdquo;
                            </p>
                            <div className={styles.quoteAuthor}>
                                <Image
                                    src="/images/power-for-the-hour/david_avatar.png"
                                    alt="David T."
                                    width={48}
                                    height={48}
                                    className={styles.avatar}
                                />
                                <div>
                                    <div className={styles.authorNameSmall}>David T.</div>
                                    <div className={styles.authorLocation}>Georgia, USA</div>
                                </div>
                            </div>
                        </div>

                        {/* Card 2 */}
                        <div className={styles.quoteCard} data-aos="fade-up" data-aos-delay="100">
                            <div className={styles.quoteStars}>★★★★★</div>
                            <p className={styles.quoteText}>
                                &ldquo;We give both books to every new leader in our church.
                                Together they create a disciple who knows the Word and knows how
                                to use it. $5 for this kind of foundation is remarkable.&rdquo;
                            </p>
                            <div className={styles.quoteAuthor}>
                                <Image
                                    src="/images/power-for-the-hour/ruth_avatar.png"
                                    alt="Pastor Ruth M."
                                    width={48}
                                    height={48}
                                    className={styles.avatar}
                                />
                                <div>
                                    <div className={styles.authorNameSmall}>Pastor Ruth M.</div>
                                    <div className={styles.authorLocation}>Texas, USA</div>
                                </div>
                            </div>
                        </div>

                        {/* Card 3 */}
                        <div className={styles.quoteCard} data-aos="fade-up" data-aos-delay="200">
                            <div className={styles.quoteStars}>★★★★★</div>
                            <p className={styles.quoteText}>
                                &ldquo;I almost clicked &lsquo;No Thanks.&rsquo; I am so glad I
                                didn&apos;t. This book plus the Handbook is the discipleship
                                curriculum I never had growing up.&rdquo;
                            </p>
                            <div className={styles.quoteAuthor}>
                                <Image
                                    src="/images/power-for-the-hour/marco_avatar.png"
                                    alt="Marco R."
                                    width={48}
                                    height={48}
                                    className={styles.avatar}
                                />
                                <div>
                                    <div className={styles.authorNameSmall}>Marco R.</div>
                                    <div className={styles.authorLocation}>California, USA</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ SECTION 7: FINAL CTA / OFFER BOX ═══ */}
            <section className={styles.finalCtaSection}>
                <div className={styles.finalCtaContainer} data-aos="fade-up">
                    <h2 className={`${styles.headingDisplay} ${styles.finalH2}`}>
                        Get Both Books Working Together.
                    </h2>
                    <p className={styles.finalSub}>
                        This $5 offer is only available right now — on this page, this one
                        time. Once you leave, the price returns to $15.
                    </p>

                    <div className={styles.offerBox}>
                        <div className={styles.offerBoxHeader}>⚡ YOUR ONE-TIME OFFER</div>
                        <div className={styles.offerBoxBody}>
                            <div className={styles.offerBoxTop}>
                                <Image
                                    src="/images/power-for-the-hour/power-for-the-hour-book.webp"
                                    alt="Power for the Hour — Digital Edition"
                                    width={900}
                                    height={1186}
                                    className={styles.offerBoxImage}
                                />
                                <div className={styles.offerBoxTitleWrap}>
                                    <div
                                        className={`${styles.headingDisplay} ${styles.offerBoxTitle}`}
                                    >
                                        Power for the Hour
                                    </div>
                                    <div className={styles.offerBoxSubtitle}>
                                        Instant Digital Download · PDF
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
                                    Instant digital download — read on any device (or print
                                    your own copy). No physical book is shipped.
                                </li>
                                <li>
                                    <span className={styles.checkIcon}>
                                        <Check size={14} strokeWidth={3} />
                                    </span>
                                    30-day money-back guarantee
                                </li>
                            </ul>

                            <div className={styles.finalPriceBlock}>
                                <span className={styles.priceOriginal}>$15</span>
                                <span
                                    className={`${styles.headingDisplay} ${styles.priceNow} ${styles.priceFinal}`}
                                >
                                    $5
                                </span>
                                <span className={styles.priceTag}>One-Time Offer</span>
                            </div>

                            <a
                                href={CHECKOUT_URL}
                                className={`${styles.ctaButton} ${styles.finalCtaButton}`}
                                role="button"
                            >
                                Yes — Add Power for the Hour for $5
                                <span className={styles.ctaArrow} aria-hidden="true">
                                    →
                                </span>
                            </a>

                            <p className={styles.securityLine}>
                                🔒 Secure checkout · One-time $5 payment — no hidden fees ·
                                Digital download only (no physical book shipped)
                            </p>
                        </div>
                    </div>

                    <div className={styles.guaranteeBox} data-aos="fade-up">
                        <div className={styles.guaranteeIcon}>
                            <ShieldCheck size={30} />
                        </div>
                        <div className={styles.guaranteeContent}>
                            <div className={styles.guaranteeTitle}>
                                30-Day Money-Back Guarantee
                            </div>
                            <p className={styles.guaranteeText}>
                                If Power for the Hour doesn&apos;t strengthen your walk with
                                God, reply to your delivery email within 30 days and we&apos;ll
                                refund your $5 — no questions asked. And the download is
                                yours to keep.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ SECTION 8: DECLINE LINK ═══ */}
            <div className={styles.declineSection} data-aos="fade-up">
                <a href="/thank-you?order=handbook" className={styles.declineLink}>
                    No thanks — I don&apos;t want this offer. Just send me the free Handbook.
                </a>
                <p className={styles.declineNote}>
                    Your free Handbook will be delivered to your inbox regardless of your choice.
                </p>
            </div>

            {/* ═══ STICKY MOBILE CTA BAR ═══ */}
            <div
                className={`${styles.stickyBar} ${
                    showStickyBar ? styles.stickyBarVisible : ""
                }`}
                aria-hidden={!showStickyBar}
            >
                <div className={styles.stickyBarPrice}>
                    <span className={styles.stickyBarOld}>$15</span>
                    <span className={`${styles.headingDisplay} ${styles.stickyBarNew}`}>
                        $5
                    </span>
                </div>
                <a
                    href={CHECKOUT_URL}
                    className={styles.stickyBarButton}
                    tabIndex={showStickyBar ? 0 : -1}
                >
                    Get the Book →
                </a>
            </div>
        </div>
    );
}

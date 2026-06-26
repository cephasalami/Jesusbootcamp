"use client";

import { useEffect } from "react";
import Image from "next/image";
import AOS from "aos";
import "aos/dist/aos.css";
import { Flame, Hand, Shield } from "lucide-react";
import styles from "./page.module.css";

export default function PowerForTheHourPage() {
    useEffect(() => {
        AOS.init({ duration: 600, once: true, easing: "ease-out" });
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

            {/* ═══ SECTION 2: STICKY URGENCY BANNER ═══ */}
            <div className={styles.urgencyBanner}>
                ⚡ ONE-TIME OFFER · This special price disappears when you leave this page
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
                                This Book Was Made To Go With It.
                            </h1>

                            <p className={styles.heroSub}>
                                While your free Handbook is on its way — there&apos;s one more tool
                                every serious disciple needs. And for the next few minutes,
                                it&apos;s yours at a fraction of the normal price.
                            </p>

                            <div className={styles.priceBlock}>
                                <span className={styles.priceOriginal}>$15</span>
                                <span className={`${styles.headingDisplay} ${styles.priceNow}`}>$5</span>
                                <span className={styles.priceTag}>Today Only</span>
                            </div>

                            <p className={styles.savingsLine}>
                                You save $10 — 67% off the regular price. This offer is not
                                available anywhere else.
                            </p>

                            <a
                                href="https://faithwithoutborders.us/cart/?add-to-cart=3229&code=BOOTCAMP5"
                                className={styles.ctaButton}
                                role="button"
                            >
                                ✓ Yes — Add Power for the Hour for $5
                            </a>

                            <p className={styles.securityLine}>
                                🔒 Secure checkout · Instant digital delivery · No subscription
                            </p>
                        </div>

                        {/* RIGHT — Book Mockup */}
                        <div className={styles.mockupImageWrapper} data-aos="fade-up" data-aos-delay="100">
                            <Image
                                src="/images/power-for-the-hour/power_book_mockup.png"
                                alt="Power for the Hour by Paul Joseph — Book Mockup"
                                width={420}
                                height={540}
                                className={styles.mockupImage}
                                priority
                            />
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
                        verses every disciple must have memorized. For identity. For
                        evangelism. For standing firm when it counts most.
                    </p>

                    <div className={styles.benefitsGrid}>
                        {/* Block 1 */}
                        <div className={styles.benefitBlock} data-aos="fade-up">
                            <div className={styles.benefitIcon}>
                                <Flame size={24} />
                            </div>
                            <div className={styles.benefitContent}>
                                <div className={styles.benefitLabel}>Know Who You Are</div>
                                <p className={styles.benefitText}>
                                    The key scriptures on identity, purpose, and calling — so no
                                    attack on your faith can shake what you know about yourself.
                                </p>
                            </div>
                        </div>

                        {/* Block 2 */}
                        <div className={styles.benefitBlock} data-aos="fade-up" data-aos-delay="100">
                            <div className={styles.benefitIcon}>
                                <Hand size={24} />
                            </div>
                            <div className={styles.benefitContent}>
                                <div className={styles.benefitLabel}>Share the Gospel Confidently</div>
                                <p className={styles.benefitText}>
                                    The exact scriptures for sharing the message of Christ —
                                    organized so you never freeze when someone asks the hard questions.
                                </p>
                            </div>
                        </div>

                        {/* Block 3 */}
                        <div className={styles.benefitBlock} data-aos="fade-up" data-aos-delay="200">
                            <div className={styles.benefitIcon}>
                                <Shield size={24} />
                            </div>
                            <div className={styles.benefitContent}>
                                <div className={styles.benefitLabel}>Stand Firm Under Pressure</div>
                                <p className={styles.benefitText}>
                                    When doubt, fear, or opposition comes — these are the verses
                                    that hold the line. Memorized. Ready.
                                </p>
                            </div>
                        </div>

                        {/* Block 4 */}
                        <div className={styles.benefitBlock} data-aos="fade-up" data-aos-delay="300">
                            <div className={styles.benefitIcon}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="3" />
                                    <circle cx="12" cy="12" r="7" opacity="0.5" />
                                    <circle cx="12" cy="12" r="11" opacity="0.25" />
                                </svg>
                            </div>
                            <div className={styles.benefitContent}>
                                <div className={styles.benefitLabel}>Multiply Your Impact</div>
                                <p className={styles.benefitText}>
                                    Teach these scriptures to others. This is how one disciple
                                    becomes five. Then twenty-five. Then more.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ SECTION 5: SOCIAL PROOF ═══ */}
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
                                    <div className={styles.authorName}>David T.</div>
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
                                    <div className={styles.authorName}>Pastor Ruth M.</div>
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
                                    <div className={styles.authorName}>Marco R.</div>
                                    <div className={styles.authorLocation}>California, USA</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ SECTION 6: FINAL CTA ═══ */}
            <section className={styles.finalCtaSection}>
                <div className={styles.finalCtaContainer} data-aos="fade-up">
                    <h2 className={`${styles.headingDisplay} ${styles.finalH2}`}>
                        Don&apos;t Miss This.
                    </h2>
                    <p className={styles.finalSub}>
                        This $5 offer is only available right now — on this page, this one
                        time. Once you leave, the price returns to $15.
                    </p>

                    <div className={styles.finalPriceBlock}>
                        <span className={styles.priceOriginal}>$15</span>
                        <span className={`${styles.headingDisplay} ${styles.priceNow}`} style={{ fontSize: "clamp(40px, 8vw, 56px)" }}>
                            $5
                        </span>
                        <span className={styles.priceTag}>ONE-TIME OFFER</span>
                    </div>

                    <a
                        href="https://faithwithoutborders.us/cart/?add-to-cart=3229&code=BOOTCAMP5"
                        className={styles.finalCtaButton}
                        role="button"
                    >
                        ✓ Add Power for the Hour — Just $5
                    </a>

                    <p className={styles.securityLine}>
                        🔒 Secure checkout · Instant PDF delivery · One-time payment
                    </p>
                </div>
            </section>

            {/* ═══ SECTION 7: DECLINE LINK ═══ */}
            <div className={styles.declineSection} data-aos="fade-up">
                <a href="/thank-you?order=handbook" className={styles.declineLink}>
                    No thanks — I don&apos;t want this offer. Just send me the free Handbook.
                </a>
                <p className={styles.declineNote}>
                    Your free Handbook will be delivered to your inbox regardless of your choice.
                </p>
            </div>
        </div>
    );
}

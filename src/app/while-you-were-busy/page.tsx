"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import AOS from "aos";
import "aos/dist/aos.css";
import {
    Check,
    Lock,
    Zap,
    Smartphone,
    ShieldCheck,
    Shield,
    Compass,
    VolumeX,
    BookOpen,
    CalendarCheck,
    ScrollText,
    HelpCircle,
    Gift,
} from "lucide-react";
import styles from "./page.module.css";
import { trackFbEvent, trackFbCustomEvent } from "@/lib/fbq";

// The book is a WooCommerce simple product (#5090) on the Faith Without Borders
// store. Adding it straight to the cart mirrors the Power for the Hour flow.
const CHECKOUT_URL = "/checkout/while-you-were-busy";
// External product page hosts the "give any amount" pay-what-you-can gift option
// — link here for readers who want to donate instead of paying the $5 price.
const PRODUCT_URL = "https://faithwithoutborders.us/product/while-you-were-busy/";
const PRICE = 5;

// What the system quietly teaches while parents are busy (from the book's
// wake-up premise). Rendered as a row of chips.
const SYSTEM_TEACHES = [
    "What to love",
    "What to believe",
    "What to admire",
    "What to laugh at",
    "What to accept as normal",
];

// The book's table of contents — shown so readers see the substance they get.
const CHAPTERS = [
    "The Goal of Excellent Parenting",
    "When Modern Life Drowns the Heartcries of the Home",
    "It Starts with Surrender",
    "The Divine Purpose of the Family",
    "Parents as the First Teachers and Strongest Influence",
    "Discipline, Boundaries, and the Formation of Character",
    "Truth in the Home: Guarding Children from False Influences",
    "The Need for a Godly Example",
    "Strength for Parenting: God as Our Parenting Partner",
    "A Practical Pathway for Excellent Parenting",
    "A 21-Day Family Reset Practice",
    "Key Scriptures for Parents",
];

export default function WhileYouWereBusyPage() {
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

    // The purchase completes off-site on faithwithoutborders.us, so a true
    // Purchase event can't fire from here — this records accurate checkout
    // intent. (The real Purchase event belongs on the store's confirmation page.)
    const handleCheckoutClick = () => {
        trackFbEvent("InitiateCheckout", {
            value: PRICE,
            currency: "USD",
            content_name: "While You Were Busy",
            content_ids: ["5090"],
            content_type: "product",
        });
    };

    const handleDonateClick = () => {
        trackFbCustomEvent("DonateIntent", {
            content_name: "While You Were Busy",
        });
    };

    return (
        <div className={styles.pageWrapper}>
            {/* ═══ ANNOUNCEMENT BAR ═══ */}
            <div className={styles.announcementBar}>
                <strong>New Release</strong> — While You Were Busy by Paul Joseph · Instant
                Digital Download
            </div>

            {/* ═══ HERO ═══ */}
            <section className={styles.heroSection}>
                <div className={styles.container}>
                    <div className={styles.heroGrid}>
                        {/* LEFT — Text */}
                        <div data-aos="fade-up">
                            <div className={styles.labelWrapper}>
                                <span className={styles.labelText}>
                                    THE PARENTING WAKE-UP CALL
                                </span>
                            </div>

                            <h1 className={`${styles.headingDisplay} ${styles.heroH1}`}>
                                Who Is Raising Your Children <em>While You Are Busy?</em>
                            </h1>

                            <p className={styles.heroSub}>
                                While you&apos;re working late, scrolling your feed, or just
                                trying to survive the day, a multi-billion-dollar industry is
                                training your children. Screens teach. Culture teaches. The
                                system teaches. <strong>While You Were Busy</strong> is a bold
                                call to stop drifting and take your God-given place back in the
                                home.
                            </p>

                            <ul className={styles.heroChecklist}>
                                <li>
                                    <span className={styles.checkIcon}>
                                        <Check size={14} strokeWidth={3} />
                                    </span>
                                    Why your home drifts &ldquo;while everyone is busy&rdquo; —
                                    and how to stop it
                                </li>
                                <li>
                                    <span className={styles.checkIcon}>
                                        <Check size={14} strokeWidth={3} />
                                    </span>
                                    How to reclaim your role as your child&apos;s first teacher
                                    and strongest influence
                                </li>
                                <li>
                                    <span className={styles.checkIcon}>
                                        <Check size={14} strokeWidth={3} />
                                    </span>
                                    A practical pathway to rebuild the home — including a 21-Day
                                    Family Reset you can start this week
                                </li>
                            </ul>

                            <div className={styles.priceBlock}>
                                <span className={`${styles.headingDisplay} ${styles.priceNow}`}>
                                    $5
                                </span>
                                <span className={styles.priceUnit}>· Instant PDF download</span>
                            </div>

                            <Link
                                href={CHECKOUT_URL}
                                onClick={handleCheckoutClick}
                                className={styles.ctaButton}
                            >
                                Get the Book — Take Your Lead Back
                                <span className={styles.ctaArrow} aria-hidden="true">
                                    →
                                </span>
                            </Link>

                            <div>
                                <a
                                    href={PRODUCT_URL}
                                    onClick={handleDonateClick}
                                    className={styles.donateLink}
                                >
                                    Money tight? Pay what you can — give a gift of any amount and
                                    still receive your copy →
                                </a>
                            </div>

                            <div className={styles.trustRow}>
                                <span className={styles.trustItem}>
                                    <Lock size={14} /> Secure checkout
                                </span>
                                <span className={styles.trustItem}>
                                    <Zap size={14} /> Instant delivery
                                </span>
                                <span className={styles.trustItem}>
                                    <Smartphone size={14} /> Read on any device
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
                                src="/images/while-you-were-busy/while-you-were-busy-cover.png"
                                alt="While You Were Busy by Paul Joseph — book cover"
                                width={1500}
                                height={1174}
                                className={styles.mockupImage}
                                preload
                            />
                            <div className={styles.mockupBadge} aria-hidden="true">
                                <span className={styles.badgeSmall}>BRAND</span>
                                <span className={styles.badgeBig}>NEW</span>
                                <span className={styles.badgeSmall}>RELEASE</span>
                            </div>
                            <div className={styles.mockupCaption}>
                                <Smartphone size={13} /> Instant digital download · Read on any
                                device
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ DRIFT / WAKE-UP ═══ */}
            <section className={styles.driftSection}>
                <div className={styles.driftInner} data-aos="fade-up">
                    <div className={styles.driftLabel}>The Experiment Is Over</div>
                    <h2 className={`${styles.headingDisplay} ${styles.driftH2}`}>
                        Your home does not drift all at once. <em>It drifts while everyone is
                        busy.</em>
                    </h2>
                    <p className={styles.driftLead}>
                        While parents are working, rushing, scrolling, and surviving, the
                        system quietly steps in and teaches your children what to love, what to
                        believe, and what to accept as normal. Children are not formed by
                        accident — they are shaped by atmosphere, example, discipline, and
                        repeated influence. <strong>If parents do not build a framework, the
                        world will.</strong>
                    </p>

                    <div className={styles.teachGrid}>
                        {SYSTEM_TEACHES.map((item) => (
                            <div className={styles.teachChip} key={item}>
                                <span>It teaches</span>
                                {item}
                            </div>
                        ))}
                    </div>

                    <p className={styles.driftClose}>
                        This is not written to condemn tired parents. <em>It is written to
                        restore courage.</em>
                    </p>
                </div>
            </section>

            {/* ═══ PULL-QUOTE BAND ═══ */}
            <section className={styles.quoteBand}>
                <div className={styles.quoteBandInner} data-aos="fade-up">
                    <p className={styles.quoteBandText}>
                        If you don&apos;t lead, you&apos;re just a roommate. <em>If you
                        don&apos;t set the rules, the screen does.</em>
                    </p>
                    <div className={styles.quoteBandCite}>— From While You Were Busy</div>
                </div>
            </section>

            {/* ═══ RECLAIM / THREE PILLARS ═══ */}
            <section className={styles.reclaimSection}>
                <div className={styles.reclaimInner}>
                    <h2
                        className={`${styles.headingDisplay} ${styles.sectionH2}`}
                        data-aos="fade-up"
                    >
                        Stop Managing the Mess. Start Building a Fortress.
                    </h2>
                    <p className={styles.sectionSub} data-aos="fade-up">
                        This book is a wake-up call for the parent who is tired of losing. It
                        gives you three moves to take your home back.
                    </p>

                    <div className={styles.pillarsGrid}>
                        <div className={styles.pillarCard} data-aos="fade-up">
                            <div className={styles.pillarIcon}>
                                <VolumeX size={24} />
                            </div>
                            <div className={styles.pillarStep}>Move 01</div>
                            <h3 className={styles.pillarTitle}>Kill the Noise</h3>
                            <p className={styles.pillarText}>
                                Turn off the unnecessary programming that is quietly rotting your
                                family&apos;s connection — and make room for truth, presence, and
                                real conversation.
                            </p>
                        </div>

                        <div
                            className={styles.pillarCard}
                            data-aos="fade-up"
                            data-aos-delay="100"
                        >
                            <div className={styles.pillarIcon}>
                                <Compass size={24} />
                            </div>
                            <div className={styles.pillarStep}>Move 02</div>
                            <h3 className={styles.pillarTitle}>Take the Lead</h3>
                            <p className={styles.pillarText}>
                                Stop asking for permission to be the parent. Your habits are their
                                blueprint — lead the home with truth, love, discipline, prayer,
                                and godly example.
                            </p>
                        </div>

                        <div
                            className={styles.pillarCard}
                            data-aos="fade-up"
                            data-aos-delay="200"
                        >
                            <div className={styles.pillarIcon}>
                                <Shield size={24} />
                            </div>
                            <div className={styles.pillarStep}>Move 03</div>
                            <h3 className={styles.pillarTitle}>Build the Framework</h3>
                            <p className={styles.pillarText}>
                                Discipline isn&apos;t an outburst of anger — it&apos;s a consistent
                                wall of protection. Give your children a foundation the
                                world&apos;s chaos cannot crack.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ WHAT'S INSIDE / CHAPTERS ═══ */}
            <section className={styles.insideSection}>
                <div className={styles.insideInner}>
                    <h2
                        className={`${styles.headingDisplay} ${styles.sectionH2}`}
                        data-aos="fade-up"
                    >
                        What&apos;s Inside the Book
                    </h2>
                    <p className={styles.sectionSub} data-aos="fade-up">
                        Twelve chapters that move from the heart of the problem to a concrete,
                        day-by-day plan for rebuilding the home.
                    </p>

                    <ol className={styles.chaptersGrid}>
                        {CHAPTERS.map((title, i) => (
                            <li
                                className={styles.chapterItem}
                                key={title}
                                data-aos="fade-up"
                                data-aos-delay={(i % 2) * 60}
                            >
                                <span className={`${styles.headingDisplay} ${styles.chapterNum}`}>
                                    {String(i + 1).padStart(2, "0")}
                                </span>
                                <span className={styles.chapterTitle}>{title}</span>
                            </li>
                        ))}
                    </ol>

                    <div className={styles.insideMetaRow} data-aos="fade-up">
                        <span className={styles.insideMetaChip}>
                            <BookOpen size={16} /> 12 practical chapters
                        </span>
                        <span className={styles.insideMetaChip}>
                            <CalendarCheck size={16} /> Ends with a 21-Day Family Reset
                        </span>
                        <span className={styles.insideMetaChip}>
                            <ScrollText size={16} /> Closes with key scriptures for parents
                        </span>
                    </div>
                </div>
            </section>

            {/* ═══ AUTHOR ═══ */}
            <section className={styles.authorSection}>
                <div className={styles.authorCard} data-aos="fade-up">
                    <Image
                        src="/images/paul-joseph.jpg"
                        alt="Paul Joseph — author of While You Were Busy"
                        width={200}
                        height={200}
                        className={styles.authorPhoto}
                    />
                    <div className={styles.authorContent}>
                        <div className={styles.authorEyebrow}>A Note From the Author</div>
                        <h2 className={`${styles.headingDisplay} ${styles.authorName}`}>
                            Paul Joseph
                        </h2>
                        <div className={styles.authorRole}>
                            Author, Missionary &amp; Founder of Jesus Boot Camp
                        </div>
                        <p className={styles.authorBio}>
                            &ldquo;Parenting is not just providing food, education, and
                            opportunities. It is the hidden labor of shaping the heart,
                            character, and future of a child. I did not write this book to
                            condemn tired parents — I wrote it to restore courage.{" "}
                            <strong>The experiment is over. It is time to stop the drift, guard
                            the home, and take your lead back.</strong>&rdquo;
                        </p>
                    </div>
                </div>
            </section>

            {/* ═══ SCRIPTURE BAND ═══ */}
            <section className={styles.scriptureBand}>
                <p className={`${styles.headingDisplay} ${styles.scriptureVerse}`} data-aos="fade-up">
                    &ldquo;Train up a child in the way he should go: <em>and when he is old, he
                    will not depart from it.</em>&rdquo;
                </p>
                <div className={styles.scriptureRef} data-aos="fade-up">
                    Proverbs 22:6
                </div>
            </section>

            {/* ═══ FINAL OFFER ═══ */}
            <section className={styles.finalCtaSection}>
                <div className={styles.finalCtaContainer} data-aos="fade-up">
                    <h2 className={`${styles.headingDisplay} ${styles.finalH2}`}>
                        The World Is Playing for Keeps. It&apos;s Time You Did, Too.
                    </h2>
                    <p className={styles.finalSub}>
                        Get your copy of While You Were Busy and start rebuilding your home
                        today.
                    </p>

                    <div className={styles.offerBox}>
                        <div className={styles.offerBoxHeader}>
                            ⚡ Instant Digital Download
                        </div>
                        <div className={styles.offerBoxBody}>
                            <div className={styles.offerBoxTop}>
                                <Image
                                    src="/images/while-you-were-busy/while-you-were-busy-cover.png"
                                    alt="While You Were Busy — digital edition"
                                    width={1500}
                                    height={1174}
                                    className={styles.offerBoxImage}
                                />
                                <div>
                                    <h3
                                        className={`${styles.headingDisplay} ${styles.offerBoxTitle}`}
                                    >
                                        While You Were Busy
                                    </h3>
                                    <div className={styles.offerBoxSubtitle}>
                                        Digital Edition · PDF
                                    </div>
                                </div>
                            </div>

                            <ul className={styles.offerList}>
                                <li>
                                    <span className={styles.checkIcon}>
                                        <Check size={14} strokeWidth={3} />
                                    </span>
                                    All 12 chapters — ending with a 21-Day Family Reset and key
                                    scriptures for parents
                                </li>
                                <li>
                                    <span className={styles.checkIcon}>
                                        <Check size={14} strokeWidth={3} />
                                    </span>
                                    A practical framework to kill the noise, take the lead, and
                                    rebuild the home
                                </li>
                                <li>
                                    <span className={styles.checkIcon}>
                                        <Check size={14} strokeWidth={3} />
                                    </span>
                                    Written to restore courage — for tired parents, not perfect
                                    ones
                                </li>
                                <li>
                                    <span className={styles.checkIcon}>
                                        <Check size={14} strokeWidth={3} />
                                    </span>
                                    Instant PDF — yours to keep and read on any device
                                </li>
                            </ul>

                            <div className={styles.finalPriceBlock}>
                                <span
                                    className={`${styles.headingDisplay} ${styles.priceNow} ${styles.priceFinal}`}
                                >
                                    $5
                                </span>
                                <span className={styles.priceUnit}>one-time</span>
                            </div>

                            <Link
                                href={CHECKOUT_URL}
                                onClick={handleCheckoutClick}
                                className={`${styles.ctaButton} ${styles.finalCtaButton}`}
                            >
                                Get My Copy — Instant PDF
                                <span className={styles.ctaArrow} aria-hidden="true">
                                    →
                                </span>
                            </Link>

                            <p className={styles.donateRow}>
                                Money tight right now?{" "}
                                <a href={PRODUCT_URL} onClick={handleDonateClick}>
                                    Give a gift of any amount
                                </a>{" "}
                                and still receive your copy.
                            </p>

                            <p className={styles.securityLine}>
                                🔒 Secure checkout · Instant digital delivery · Read on any device
                            </p>
                        </div>
                    </div>

                    <div className={styles.trustBadges}>
                        <span className={styles.trustBadge}>
                            <ShieldCheck size={18} /> Secure checkout
                        </span>
                        <span className={styles.trustBadge}>
                            <Zap size={18} /> Instant access
                        </span>
                        <span className={styles.trustBadge}>
                            <Gift size={18} /> Pay-what-you-can option
                        </span>
                    </div>
                </div>
            </section>

            {/* ═══ FAQ ═══ */}
            <section className={styles.faqSection}>
                <div className={styles.faqInner}>
                    <h2
                        className={`${styles.headingDisplay} ${styles.sectionH2}`}
                        data-aos="fade-up"
                    >
                        Questions Parents Ask
                    </h2>

                    <div className={styles.faqList}>
                        <div className={styles.faqItem} data-aos="fade-up">
                            <h3 className={styles.faqQ}>
                                <HelpCircle size={18} aria-hidden />
                                Is this a physical book or a digital download?
                            </h3>
                            <p className={styles.faqA}>
                                While You Were Busy is delivered as an instant digital download
                                (PDF). After checkout it&apos;s yours to keep and read on your
                                phone, tablet, or computer — no waiting for shipping.
                            </p>
                        </div>

                        <div className={styles.faqItem} data-aos="fade-up">
                            <h3 className={styles.faqQ}>
                                <HelpCircle size={18} aria-hidden />
                                What if money is tight right now?
                            </h3>
                            <p className={styles.faqA}>
                                There&apos;s a pay-what-you-can option — you can{" "}
                                <a href={PRODUCT_URL} onClick={handleDonateClick}>
                                    give a gift of any amount
                                </a>{" "}
                                and still receive your copy. This book was written to reach
                                parents, not to price them out.
                            </p>
                        </div>

                        <div className={styles.faqItem} data-aos="fade-up">
                            <h3 className={styles.faqQ}>
                                <HelpCircle size={18} aria-hidden />
                                Who is this book for?
                            </h3>
                            <p className={styles.faqA}>
                                Any parent who feels the pull of a distracted, noisy culture on
                                their home — whether your children are toddlers or teenagers.
                                It&apos;s written for tired parents, not perfect ones.
                            </p>
                        </div>

                        <div className={styles.faqItem} data-aos="fade-up">
                            <h3 className={styles.faqQ}>
                                <HelpCircle size={18} aria-hidden />
                                Do I have to do it all at once?
                            </h3>
                            <p className={styles.faqA}>
                                No. The book ends with a 21-Day Family Reset — a simple, day-by-day
                                practice — so you can rebuild the home one small, courageous step
                                at a time.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ FOOTER ═══ */}
            <footer className={styles.footer}>
                © 2026 Jesus Boot Camp · All Rights Reserved · <Link href="/privacy">Privacy
                Policy</Link> · <Link href="/terms">Terms</Link>
            </footer>

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
                    <span className={styles.stickyBarUnit}>PDF</span>
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

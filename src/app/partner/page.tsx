"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import AOS from "aos";
import "aos/dist/aos.css";
import {
    Wheat,
    Users,
    Send,
    Sprout,
    Globe,
    Flame,
    Heart,
    Repeat,
    HandHeart,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { JOIN_URL } from "@/config/links";
import { trackFbCustomEvent } from "@/lib/fbq";
import styles from "./page.module.css";

// Every gift routes through the ministry's PayPal donate page. Donors choose
// one-time vs. monthly and their amount on PayPal, and must select
// "Jesus Boot Camp" from the dropdown so the gift is designated here. Per the
// ministry's own guidance, this link is the route for tax-deductible giving.
const GIVE_URL = "https://www.paypal.com/donate/?hosted_button_id=DLUEWNB2NEAJQ";

const TIERS = [
    { amount: "$25", label: "Plant seed into the harvest" },
    { amount: "$50", label: "Help send and support laborers" },
    { amount: "$100", label: "Put real wind in our sails" },
];

export default function PartnerPage() {
    const [showStickyBar, setShowStickyBar] = useState(false);

    useEffect(() => {
        AOS.init({ duration: 600, once: true, easing: "ease-out" });
    }, []);

    useEffect(() => {
        const onScroll = () => setShowStickyBar(window.scrollY > 720);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // The gift completes off-site on PayPal, so this records giving intent only.
    const trackGive = (track: string) =>
        trackFbCustomEvent("DonateIntent", { content_name: "Jesus Boot Camp", track });

    return (
        <>
            <Navbar />
            <main className={styles.pageWrapper}>
                {/* ═══ HERO ═══ */}
                <section className={styles.hero}>
                    <div className={styles.heroInner}>
                        <div className={styles.heroEyebrow} data-aos="fade-up">
                            <Wheat size={15} /> Fuel the Harvest
                        </div>
                        <h1 className={`${styles.headingDisplay} ${styles.heroH1}`} data-aos="fade-up">
                            Not Everyone Can Go. <em>Everyone Can Fund the Frontlines.</em>
                        </h1>
                        <p className={styles.heroLead} data-aos="fade-up">
                            Jesus commanded us to pray for laborers to be sent into the harvest.
                            We refuse to coerce anyone, and we don&apos;t preach legalistic
                            tithing. <strong>The Gospel is absolutely free</strong> — but getting
                            it to the nations is not.
                        </p>

                        <div className={styles.ctaRow} data-aos="fade-up">
                            <a
                                href={GIVE_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => trackGive("monthly")}
                                className={styles.btnPrimary}
                            >
                                <Repeat size={18} /> Partner With Us Monthly
                                <span className={styles.btnArrow} aria-hidden="true">→</span>
                            </a>
                            <a
                                href={GIVE_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => trackGive("one-time")}
                                className={styles.btnSecondary}
                            >
                                <Heart size={18} /> Make a One-Time Gift
                            </a>
                        </div>

                        <p className={styles.microNote}>
                            On PayPal you can choose one-time or monthly and enter any amount.
                            Please select <em>&ldquo;Jesus Boot Camp&rdquo;</em> from the dropdown
                            so your gift is designated here.
                        </p>

                        <p className={styles.heroVerse}>
                            &ldquo;Freely you have received, freely give.&rdquo; — Matthew 10:8
                        </p>
                    </div>
                </section>

                {/* ═══ A DIFFERENT KIND OF ASK ═══ */}
                <section className={styles.approach}>
                    <div className={`${styles.container} ${styles.narrow}`}>
                        <h2
                            className={`${styles.headingDisplay} ${styles.sectionH2} ${styles.center}`}
                            data-aos="fade-up"
                        >
                            A Different Kind of Ask
                        </h2>
                        <p className={styles.prose} data-aos="fade-up">
                            We are taking a completely different approach than traditional churches
                            and religious organizations — no obligation, no guilt-driven ask, no
                            required tithe. Partnership here is a freewill response, never a levy.
                            The Gospel itself will always be free; what your gift funds is the cost
                            of carrying it to people who have never heard.
                        </p>

                        <div className={styles.pullQuote} data-aos="fade-up">
                            <p className={styles.pullQuoteText}>
                                The water is free — <em>but it still costs money to pipe it to
                                you.</em>
                            </p>
                        </div>
                    </div>
                </section>

                {/* ═══ WHY YOUR PARTNERSHIP MATTERS ═══ */}
                <section className={styles.why}>
                    <div className={styles.container}>
                        <h2
                            className={`${styles.headingDisplay} ${styles.sectionH2} ${styles.center}`}
                            data-aos="fade-up"
                        >
                            Why Your Partnership Matters
                        </h2>
                        <p className={styles.sectionSub} data-aos="fade-up">
                            Just like any app requires ongoing subscriptions to fund the people
                            who keep it running, this ministry requires consistent funding. The
                            difference? Our &ldquo;software&rdquo; is the deployment of the Gospel.
                        </p>

                        <div className={styles.whyGrid}>
                            <div className={styles.whyCard} data-aos="fade-up">
                                <div className={styles.whyIcon}><Users size={24} /></div>
                                <h3 className={styles.whyCardTitle}>A Dedicated Team</h3>
                                <p className={styles.whyCardText}>
                                    To reach nations around the world, we support a dedicated staff
                                    and a vital team of translators.
                                </p>
                            </div>
                            <div className={styles.whyCard} data-aos="fade-up" data-aos-delay="80">
                                <div className={styles.whyIcon}><Send size={24} /></div>
                                <h3 className={styles.whyCardTitle}>Deploying the Gospel</h3>
                                <p className={styles.whyCardText}>
                                    We invest in the tools, infrastructure, and people to rescue
                                    souls, disciple believers, and train them to multiply.
                                </p>
                            </div>
                            <div className={styles.whyCard} data-aos="fade-up" data-aos-delay="160">
                                <div className={styles.whyIcon}><Sprout size={24} /></div>
                                <h3 className={styles.whyCardTitle}>Soul-Winning, Not Buildings</h3>
                                <p className={styles.whyCardText}>
                                    We are not building brick-and-mortar buildings. We are investing
                                    in soul winning.
                                </p>
                            </div>
                            <div className={styles.whyCard} data-aos="fade-up" data-aos-delay="240">
                                <div className={styles.whyIcon}><Globe size={24} /></div>
                                <h3 className={styles.whyCardTitle}>A Global Mission</h3>
                                <p className={styles.whyCardText}>
                                    We are funding a global mission that changes hearts, transforms
                                    lives, and enforces Christ&apos;s victory on earth.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══ CHOOSE YOUR TRACK ═══ */}
                <section className={styles.tracks}>
                    <div className={styles.container}>
                        <div className={styles.tracksHead} data-aos="fade-up">
                            <h2 className={`${styles.headingDisplay} ${styles.tracksH2}`}>
                                Choose Your Track
                            </h2>
                            <p className={styles.tracksSub}>
                                We offer this training with a radical standard of integrity — based
                                on where your heart is.
                            </p>
                        </div>

                        <div className={styles.trackGrid}>
                            <div className={styles.trackCard} data-aos="fade-up">
                                <span className={styles.trackBadgeGhost}>Free Access</span>
                                <h3 className={`${styles.headingDisplay} ${styles.trackTitle}`}>
                                    The Committed Harvester
                                </h3>
                                <p className={styles.trackText}>
                                    If you genuinely cannot afford to support this work but your
                                    absolute goal is to share the Gospel and disciple others,{" "}
                                    <strong>this entire course is yours free of charge.</strong> We
                                    will never withhold this training from a committed worker over a
                                    lack of funds.
                                </p>
                                <a
                                    href={JOIN_URL}
                                    className={`${styles.trackCta} ${styles.trackCtaOutline}`}
                                >
                                    Start the Training Free
                                    <span className={styles.btnArrow} aria-hidden="true">→</span>
                                </a>
                            </div>

                            <div
                                className={`${styles.trackCard} ${styles.trackCardFeatured}`}
                                data-aos="fade-up"
                                data-aos-delay="100"
                            >
                                <span className={styles.trackBadge}>Monthly Support</span>
                                <h3 className={`${styles.headingDisplay} ${styles.trackTitle}`}>
                                    The Kingdom Partner
                                </h3>
                                <p className={styles.trackText}>
                                    If you do have the means, we invite you to invest heavily in the
                                    harvest. Your partnership puts <strong>&ldquo;wind in our
                                    sails.&rdquo;</strong> The more wind we have, the faster we can
                                    move to train others to shout it from the rooftops.
                                </p>
                                <a
                                    href={GIVE_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => trackGive("monthly")}
                                    className={`${styles.trackCta} ${styles.trackCtaGold}`}
                                >
                                    Become a Kingdom Partner
                                    <span className={styles.btnArrow} aria-hidden="true">→</span>
                                </a>
                            </div>
                        </div>

                        <div className={styles.consumerNote} data-aos="fade-up">
                            <Flame size={22} className={styles.consumerNoteIcon} />
                            <p className={styles.consumerNoteText}>
                                <strong>A note to the consumer:</strong> If you are only taking this
                                course for casual information — with no intention of sharing the
                                Gospel, discipling others, or financially backing the mission — you
                                are missing the entire point. This is not a place to sit on the
                                fence. This is a strategic boot camp designed for one purpose: to
                                multiply messengers.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ═══ TIERS ═══ */}
                <section className={styles.tiers}>
                    <div className={styles.container}>
                        <h2
                            className={`${styles.headingDisplay} ${styles.sectionH2} ${styles.center}`}
                            data-aos="fade-up"
                        >
                            Invest Your Heart in the Harvest
                        </h2>
                        <p className={styles.sectionSub} data-aos="fade-up">
                            Whether you can partner with us for $25, $50, or $100 a month, sow into
                            a mission that bears eternal fruit.
                        </p>

                        <div className={styles.tierRow}>
                            {TIERS.map((tier, i) => (
                                <a
                                    key={tier.amount}
                                    href={GIVE_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => trackGive(`monthly-${tier.amount}`)}
                                    className={styles.tierCard}
                                    data-aos="fade-up"
                                    data-aos-delay={i * 80}
                                >
                                    <span className={`${styles.headingDisplay} ${styles.tierAmount}`}>
                                        {tier.amount}
                                    </span>
                                    <span className={styles.tierPer}>per month</span>
                                    <span className={styles.tierLabel}>{tier.label}</span>
                                </a>
                            ))}
                        </div>

                        <p className={styles.tierCustom}>
                            Prefer a different amount or a one-time gift?{" "}
                            <a
                                href={GIVE_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => trackGive("custom")}
                            >
                                Give what&apos;s on your heart →
                            </a>
                        </p>
                    </div>
                </section>

                {/* ═══ FOUNDER — JOIN THE FRONTLINES ═══ */}
                <section className={styles.founder}>
                    <div className={styles.founderCard} data-aos="fade-up">
                        <Image
                            src="/images/paul-joseph.jpg"
                            alt="Paul Joseph — Founder of Jesus Boot Camp"
                            width={200}
                            height={200}
                            className={styles.founderPhoto}
                        />
                        <div>
                            <div className={styles.founderEyebrow}>Join the Frontlines</div>
                            <h2 className={`${styles.headingDisplay} ${styles.founderH3}`}>
                                I started this by faith.
                            </h2>
                            <p className={styles.founderText}>
                                To fund the initial launch and pay our small team, I took on a
                                secular job and poured every cent I earned into this mission. I will
                                keep working and keep pouring my life into this{" "}
                                <strong>even if I have to do it alone</strong> — but we can go so
                                much further together.
                            </p>
                            <p className={styles.founderText}>
                                This is not a compulsory tithe; it is a freewill offering from a
                                heart that believes in the Great Commission.
                            </p>
                            <p className={styles.founderSign}>— Paul Joseph, Founder</p>
                        </div>
                    </div>
                </section>

                {/* ═══ SCRIPTURE BAND ═══ */}
                <section className={styles.scriptureBand}>
                    <p
                        className={`${styles.headingDisplay} ${styles.scriptureVerse}`}
                        data-aos="fade-up"
                    >
                        &ldquo;For where your treasure is, <em>there will your heart be
                        also.</em>&rdquo;
                    </p>
                    <div className={styles.scriptureRef} data-aos="fade-up">
                        Matthew 6:21
                    </div>
                </section>

                {/* ═══ PRAYER ═══ */}
                <section className={styles.prayer}>
                    <div className={styles.prayerCard} data-aos="fade-up">
                        <h2 className={styles.prayerLabel}>
                            <HandHeart size={15} /> Let&apos;s Commit This to the Lord
                        </h2>
                        <div className={styles.prayerBody}>
                            <p className={styles.prayerOpen}>Father,</p>
                            <p>
                                We are full of gratitude for the privilege of being called into
                                Your harvest fields. You have told us that the harvest is plentiful
                                but the workers are few, and today we ask for a divine stirring in
                                the hearts of Your people — to be filled with a burning passion to
                                engage from the very depth of their souls.
                            </p>
                            <p>
                                We pray for a spirit of overflowing generosity in reverence to all
                                You have enriched us with, as a gesture of worship. Multiply every
                                seed sown, and let those who give do so with contagious joy, knowing
                                they are investing in eternal fruit.
                            </p>
                            <p>
                                Knit our hearts together in unity. Let every partner know that their
                                voice, their prayers, and their resources are vital to the
                                breakthrough we are seeking in bringing many into Your kingdom.
                                Together, may we step into the fields, gather the harvest, and bring
                                glory to Your holy name.
                            </p>
                            <p className={styles.prayerAmen}>In Jesus&apos; name, we pray. Amen.</p>
                        </div>
                    </div>
                </section>

                {/* ═══ FINAL CTA ═══ */}
                <section className={styles.finalCta}>
                    <h2 className={`${styles.headingDisplay} ${styles.finalKicker}`} data-aos="fade-up">
                        Enough silence. Enough inactivity. <em>It is time to engage heavily in the
                        harvest.</em>
                    </h2>
                    <p className={styles.finalSub} data-aos="fade-up">
                        Partner with us today, and put wind in the sails of the Great Commission.
                    </p>

                    <div className={styles.ctaRow} data-aos="fade-up">
                        <a
                            href={GIVE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => trackGive("monthly")}
                            className={styles.btnPrimary}
                        >
                            <Repeat size={18} /> Partner With Us Monthly
                            <span className={styles.btnArrow} aria-hidden="true">→</span>
                        </a>
                        <a
                            href={GIVE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => trackGive("one-time")}
                            className={`${styles.btnSecondary} ${styles.btnSecondaryOnDark}`}
                        >
                            <Heart size={18} /> Make a One-Time Gift
                        </a>
                    </div>

                    <p className={styles.taxNote}>
                        Every button here opens our secure PayPal giving page. If it&apos;s
                        important to you that your gift be <strong>tax-deductible</strong>,{" "}
                        <a
                            href={GIVE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => trackGive("tax-deductible")}
                        >
                            give through this link
                        </a>{" "}
                        and please be sure to select <strong>&ldquo;Jesus Boot Camp&rdquo;</strong>{" "}
                        from the dropdown menu.
                    </p>
                </section>
                {/* ═══ STICKY MOBILE GIVE BAR (inside pageWrapper so it inherits the color tokens) ═══ */}
                <div
                    className={`${styles.stickyBar} ${showStickyBar ? styles.stickyBarVisible : ""}`}
                    aria-hidden={!showStickyBar}
                >
                    <a
                        href={GIVE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackGive("monthly")}
                        className={`${styles.stickyBtn} ${styles.stickyBtnPrimary}`}
                        tabIndex={showStickyBar ? 0 : -1}
                    >
                        <Repeat size={16} /> Partner Monthly
                    </a>
                    <a
                        href={GIVE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackGive("one-time")}
                        className={`${styles.stickyBtn} ${styles.stickyBtnOutline}`}
                        tabIndex={showStickyBar ? 0 : -1}
                    >
                        <Heart size={16} /> Give Once
                    </a>
                </div>
            </main>
            <Footer />
        </>
    );
}

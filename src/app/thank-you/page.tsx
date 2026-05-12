"use client";

import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import AOS from "aos";
import "aos/dist/aos.css";
import { Link2, MessageCircle, Share2, Smartphone } from "lucide-react";
import styles from "./page.module.css";

// Separate component that uses useSearchParams for Next.js Suspense boundary
function ThankYouContent() {
    const searchParams = useSearchParams();
    const orderType = searchParams.get("order");

    // Conditionally render Version B if order=both, otherwise Version A
    const isVersionB = orderType === "both";

    const [copied, setCopied] = useState(false);

    useEffect(() => {
        AOS.init({ duration: 700, once: true, easing: "ease-out" });
    }, []);

    const handleCopyLink = () => {
        navigator.clipboard.writeText("https://jesusbootcamp.org/handbook");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={styles.pageWrapper}>
            {/* ═══ SECTION 1: SUCCESS CONFIRMATION (Hero) ═══ */}
            <section className={styles.heroSection}>
                <div className={styles.heroContainer} data-aos="fade-up">
                    <div className={styles.illustrationWrapper}>
                        {isVersionB ? (
                            <Image
                                src="/images/thank-you/two_books_illustration.png"
                                alt="Two Books Confirmation"
                                width={120}
                                height={120}
                                className={styles.illustration}
                                priority
                            />
                        ) : (
                            <Image
                                src="/images/thank-you/envelope_illustration.png"
                                alt="Email Delivery Confirmation"
                                width={120}
                                height={120}
                                className={styles.illustration}
                                priority
                            />
                        )}
                    </div>

                    <h1 className={`${styles.headingDisplay} ${styles.heroH1}`}>
                        {isVersionB
                            ? "You're All Set. Both Books Are On Their Way."
                            : "You're In. Your Handbook Is On Its Way."}
                    </h1>

                    <p className={styles.heroSub}>
                        {isVersionB
                            ? "The Handbook for a Disciple of Jesus and Power for the Hour are both being delivered to your inbox right now. You've just taken a serious step in your discipleship journey."
                            : "Check your inbox — the Handbook for a Disciple of Jesus is being delivered to your email right now. While you wait, here's exactly what to do next."}
                    </p>

                    <div className={styles.deliveryBox}>
                        <div className={styles.deliveryIcon}>📧</div>
                        <p className={styles.deliveryText}>
                            {isVersionB
                                ? "Both books are being sent to your email. Power for the Hour will come as a separate PDF from Gumroad — check for two emails. Both should arrive within 5 minutes. If you don't see them — check your Spam folder."
                                : "Your Handbook PDF is being sent to the email address you entered. It should arrive within 5 minutes. If you don't see it — check your Spam or Promotions folder and mark it as Not Spam."}
                        </p>
                    </div>
                </div>
            </section>

            {/* ═══ SECTION 2: HOW TO SAVE IT TO YOUR PHONE ═══ */}
            <section className={styles.savePhoneSection}>
                <div className={styles.savePhoneContainer}>
                    <h2 className={`${styles.headingDisplay} ${styles.sectionH2}`} data-aos="fade-up">
                        Save It To Your Phone's Home Screen
                    </h2>
                    <p className={styles.sectionSub} data-aos="fade-up">
                        Access your Handbook anywhere — one tap away. No app needed. Here's how:
                    </p>

                    <div className={styles.instructionsGrid}>
                        {/* iPhone */}
                        <div className={styles.instructionColumn} data-aos="fade-up" data-aos-delay="100">
                            <div className={styles.platformIcon}>
                                <Smartphone size={32} />
                            </div>
                            <div className={styles.platformLabel}>IPHONE / IPAD</div>
                            <ul className={styles.stepsList}>
                                <li>Open the PDF from your email</li>
                                <li>Tap the Share button (the square with the arrow)</li>
                                <li>Scroll down and tap &quot;Add to Home Screen&quot;</li>
                                <li>Tap &quot;Add&quot; — done. It's on your home screen.</li>
                            </ul>
                        </div>

                        {/* Android */}
                        <div className={styles.instructionColumn} data-aos="fade-up" data-aos-delay="200">
                            <div className={styles.platformIcon}>
                                <Smartphone size={32} />
                            </div>
                            <div className={styles.platformLabel}>ANDROID</div>
                            <ul className={styles.stepsList}>
                                <li>Open the PDF from your email</li>
                                <li>Tap the three-dot Menu (⋮) in the top right</li>
                                <li>Tap &quot;Add to Home Screen&quot;</li>
                                <li>Confirm — it will appear on your home screen.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ SECTION 3: INTRODUCE THE BOOT CAMP ═══ */}
            <section className={styles.bootcampSection}>
                <div className={styles.bootcampContainer}>
                    <span className={styles.whatsNextLabel} data-aos="fade-up">WHAT'S NEXT</span>
                    <h2 className={`${styles.headingDisplay} ${styles.bootcampH2}`} data-aos="fade-up">
                        The Handbook Is Just the Beginning.
                    </h2>

                    <p className={styles.bootcampBody} data-aos="fade-up">
                        {isVersionB ? (
                            <>
                                You didn't just download a free resource. You invested in your discipleship. That tells us something about you — you're serious about this.{"\n\n"}
                                The Jesus Boot Camp was built for people exactly like you. 90 days. Real training. Real transformation. And it's completely free.
                            </>
                        ) : (
                            <>
                                The Jesus Boot Camp is a free 90-day discipleship training program that takes everything in the Handbook and teaches you how to live it. Every day. In the real world.{"\n\n"}
                                This isn't church. This isn't a seminar. This is training — for disciples who are serious about their mission.
                            </>
                        )}
                    </p>

                    <div className={styles.statsRow} data-aos="fade-up" data-aos-delay="100">
                        <div className={styles.statItem}>
                            <span className={`${styles.headingDisplay} ${styles.statNumber}`}>90</span>
                            <span className={styles.statLabel}>Days of Training</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={`${styles.headingDisplay} ${styles.statNumber}`}>26,000+</span>
                            <span className={styles.statLabel}>Words of Content</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={`${styles.headingDisplay} ${styles.statNumber}`}>Free</span>
                            <span className={styles.statLabel}>Always</span>
                        </div>
                    </div>

                    <div data-aos="fade-up" data-aos-delay="200">
                        <a href="/" className={styles.ctaButton}>
                            Join the Jesus Boot Camp — It's Free
                        </a>
                        <p className={styles.ctaNote}>
                            No credit card. No commitment.{"\n"}Supported by voluntary donation.
                        </p>
                    </div>
                </div>
            </section>

            {/* ═══ SECTION 4: SOFT UPSELL OR COMMUNITY INVITE ═══ */}
            <section className={styles.upsellSection}>
                <div className={styles.upsellContainer} data-aos="fade-up">
                    {isVersionB ? (
                        <>
                            <h2 className={`${styles.headingDisplay} ${styles.upsellH2}`}>
                                You're Already Ahead.
                            </h2>
                            <p className={styles.upsellBody}>
                                Most believers never take a single step toward real training. You just took two. Join the Boot Camp community and start connecting with disciples who are on the same journey.
                            </p>
                            <a href="/" className={styles.ctaButton}>
                                Join the Jesus Boot Camp Community — Free
                            </a>
                        </>
                    ) : (
                        <>
                            <h2 className={`${styles.headingDisplay} ${styles.upsellH2}`}>
                                Still Interested in Power for the Hour?
                            </h2>
                            <p className={styles.upsellBody}>
                                The special $5 offer has expired — but the book is still available at its standard price of $15. If you'd like to add it to your discipleship toolkit, you can get it here.
                            </p>
                            {/* TODO: Replace with Gumroad $15 full-price URL */}
                            <a href="#gumroad-full-price" className={styles.secondaryButton}>
                                Get Power for the Hour — $15
                            </a>
                        </>
                    )}
                </div>
            </section>

            {/* ═══ SECTION 5: SOCIAL SHARING ═══ */}
            <section className={styles.socialSection}>
                <div className={styles.socialContainer} data-aos="fade-up">
                    <h2 className={`${styles.headingDisplay} ${styles.socialH2}`}>
                        Know Someone Who Needs This?
                    </h2>
                    <p className={styles.socialBody}>
                        The Handbook is free. Share it with a friend, your small group, or your church community.
                    </p>

                    <div className={styles.shareButtonsRow} data-aos="fade-up" data-aos-delay="100">
                        {/* Facebook Share */}
                        <a
                            href="https://www.facebook.com/sharer/sharer.php?u=https://jesusbootcamp.org/handbook"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${styles.shareButton} ${styles.fbButton}`}
                        >
                            <Share2 size={18} /> Share on Facebook
                        </a>

                        {/* WhatsApp Share */}
                        <a
                            href="https://api.whatsapp.com/send?text=Get%20the%20free%20Handbook%20for%20a%20Disciple%20of%20Jesus:%20https://jesusbootcamp.org/handbook"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${styles.shareButton} ${styles.waButton}`}
                        >
                            <MessageCircle size={18} /> Share on WhatsApp
                        </a>

                        {/* Copy Link */}
                        <button
                            onClick={handleCopyLink}
                            className={`${styles.shareButton} ${styles.copyButton}`}
                        >
                            <Link2 size={18} /> {copied ? "✓ Copied!" : "Copy Link"}
                        </button>
                    </div>
                </div>
            </section>

            {/* ═══ MINIMAL FOOTER ═══ */}
            <footer className={styles.footer}>
                <p>
                    © 2026 Jesus Boot Camp · All Rights Reserved ·{" "}
                    <a href="/" className={styles.footerLink}>
                        Back to Homepage
                    </a>
                </p>
            </footer>
        </div>
    );
}

export default function ThankYouPage() {
    return (
        <Suspense fallback={<div style={{ minHeight: '100vh', backgroundColor: '#F5F0E8' }}></div>}>
            <ThankYouContent />
        </Suspense>
    );
}

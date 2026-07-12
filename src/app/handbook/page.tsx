"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Compass, Shield, Globe, Smartphone, Key, Mail, Inbox, Download, Check } from "lucide-react";
import AOS from "aos";
import "aos/dist/aos.css";
import styles from "./page.module.css";

export default function HandbookLandingPage() {
  const router = useRouter();
  const [email1, setEmail1] = useState("");
  const [email2, setEmail2] = useState("");
  const [error1, setError1] = useState("");
  const [error2, setError2] = useState("");
  const [isSubmitting1, setIsSubmitting1] = useState(false);
  const [isSubmitting2, setIsSubmitting2] = useState(false);
  const [success1, setSuccess1] = useState(false);
  const [success2, setSuccess2] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const heroInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    AOS.init({
      once: true,
      duration: 700,
    });
  }, []);

  useEffect(() => {
    const onScroll = () => setShowStickyBar(window.scrollY > 640);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToHeroForm = () => {
    heroInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => heroInputRef.current?.focus({ preventScroll: true }), 450);
  };

  const validateEmail = (email: string) => {
    const re = /^\S+@\S+\.\S+$/;
    return re.test(email);
  };

  const handleFormSubmit = async (
    e: React.FormEvent,
    email: string,
    setSubmitting: (val: boolean) => void,
    setError: (val: string) => void,
    setSuccess: (val: boolean) => void
  ) => {
    e.preventDefault();
    setError("");

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Subscription failed");
      }

      setSubmitting(false);
      setSuccess(true);

      setTimeout(() => {
        router.push("/power-for-the-hour");
      }, 1500);
    } catch (err: any) {
      setSubmitting(false);
      setError(err.message || "Failed to subscribe. Please try again.");
    }
  };

  return (
    <div className={styles.pageWrapper}>
      {/* SECTION 1 - ANNOUNCEMENT BAR */}
      <div className={styles.announcementBar}>
        📖 FREE DOWNLOAD — LIMITED TIME · The Handbook for a Disciple of Jesus · Instant Access
      </div>

      {/* SECTION 2 - HERO SECTION */}
      <section className={styles.heroSection}>
        <div className={styles.container}>
          <div className={styles.heroGrid}>
            <div data-aos="fade-up">
              <div className={styles.labelWrapper}>
                <span className={styles.labelText}>FREE DOWNLOAD</span>
              </div>
              <h1 className={`${styles.headingDisplay} ${styles.heroH1}`}>
                The Book That Trains You To Actually Live Your Faith.
              </h1>
              <p className={styles.heroSub}>
                {/* Copy reference: handbookforadiscipleofjesus.com/frontpage */}
                {/* Paul confirmed this copy is already reviewed and approved. */}
                Most believers know the scriptures. Few know how to use them — and even fewer know how to share them.
                The Handbook for a Disciple of Jesus helps you grow in faith through the Word, and gives you the confidence
                to share your faith with the Word. Thousands of scripture references, organized by life topic —
                for every situation you face.
              </p>

              <div className={styles.trustChips}>
                <span className={styles.trustChip}>
                  <span className={styles.trustCheck}><Check size={12} strokeWidth={3} /></span>
                  Used in prisons
                </span>
                <span className={styles.trustChip}>
                  <span className={styles.trustCheck}><Check size={12} strokeWidth={3} /></span>
                  Youth groups
                </span>
                <span className={styles.trustChip}>
                  <span className={styles.trustCheck}><Check size={12} strokeWidth={3} /></span>
                  Churches worldwide
                </span>
                <span className={styles.trustChip}>
                  <span className={styles.trustCheck}><Check size={12} strokeWidth={3} /></span>
                  100% Free
                </span>
              </div>

              <form
                className={`${styles.emailForm} ${styles.formCard}`}
                onSubmit={(e) => handleFormSubmit(e, email1, setIsSubmitting1, setError1, setSuccess1)}
                noValidate
              >
                <div className={styles.formCardTitle}>
                  Get instant access — tell us where to send it
                </div>
                <div>
                  <input
                    ref={heroInputRef}
                    type="email"
                    name="email"
                    placeholder="Enter your email address"
                    className={styles.inputField}
                    value={email1}
                    onChange={(e) => setEmail1(e.target.value)}
                    disabled={isSubmitting1 || success1}
                    autoComplete="email"
                    inputMode="email"
                    enterKeyHint="go"
                    aria-label="Email address"
                    aria-invalid={!!error1}
                  />
                  {error1 && <div className={styles.errorText} role="alert">{error1}</div>}
                </div>

                <button
                  type="submit"
                  className={`${styles.submitBtn} ${success1 ? styles.btnSuccess : ""}`}
                  disabled={isSubmitting1 || success1}
                >
                  {isSubmitting1 ? (
                    <><span className={styles.spinner}></span>Sending...</>
                  ) : success1 ? (
                    "✓ On its way!"
                  ) : (
                    "Send Me The Free Handbook →"
                  )}
                </button>
                <div className={styles.formDisclaimer}>
                  🔒 Your email stays private — 100% secure. Instant PDF · No credit card · Unsubscribe anytime.
                </div>
              </form>
            </div>

            <div className={styles.mockupImageWrapper} data-aos="fade-up" data-aos-delay="100">
              <div className={styles.mockupGlow} aria-hidden="true" />
              <Image
                src="/images/handbook/handbook-book.webp"
                alt="Handbook for a Disciple of Jesus by Paul Joseph — paperback mockup"
                width={900}
                height={1027}
                className={styles.mockupImage}
                preload
              />
              <div className={styles.freeBadge} aria-hidden="true">
                <span className={styles.freeBadgeSmall}>100%</span>
                <span className={styles.freeBadgeBig}>FREE</span>
                <span className={styles.freeBadgeSmall}>TODAY</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 - SOCIAL PROOF BAR */}
      <section className={styles.socialProofSection}>
        <div className={`${styles.container} ${styles.socialProofFlex}`} data-aos="fade-up">
          <div className={styles.proofItem}>
            <div className={`${styles.headingDisplay} ${styles.proofNumber}`}>1,000+</div>
            <div className={styles.proofLabel}>Most Powerful Scriptures</div>
          </div>
          <div className={styles.proofDivider}></div>
          <div className={styles.proofItem}>
            <div className={`${styles.headingDisplay} ${styles.proofNumber}`}>90</div>
            <div className={styles.proofLabel}>Days of Transformation</div>
          </div>
          <div className={styles.proofDivider}></div>
          <div className={styles.proofItem}>
            <div className={`${styles.headingDisplay} ${styles.proofNumber}`}>15</div>
            <div className={styles.proofLabel}>Languages</div>
            <div style={{ fontSize: '11px', color: 'var(--gold)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>And Growing</div>
          </div>
          <div className={styles.proofDivider}></div>
          <div className={styles.proofItem}>
            <div className={`${styles.headingDisplay} ${styles.proofNumber}`}>100% Free</div>
            <div className={styles.proofLabel}>No Hidden Fees. Ever.</div>
          </div>
        </div>
      </section>

      {/* SECTION 4 - WHAT'S INSIDE */}
      <section className={styles.featuresSection}>
        <div className={styles.container}>
          <h2 className={`${styles.headingDisplay} ${styles.sectionH2}`} data-aos="fade-up">
            Everything You Need. Organized For Real Life.
          </h2>
          <p className={styles.sectionSub} data-aos="fade-up" data-aos-delay="50">
            This isn&apos;t a devotional. This is a reference tool —
            built for disciples who want to know what God says
            about every situation they face.
          </p>

          <div className={styles.featuresGrid}>
            <div className={styles.featureCard} data-aos="fade-up">
              <div className={styles.featureIconWrap}>
                <BookOpen size={32} color="var(--gold)" />
              </div>
              <h3 className={styles.featureCardTitle}>Scripture By Topic</h3>
              <p className={styles.featureCardText}>
                {/* Language adapted from handbookforadiscipleofjesus.com/frontpage */}
                {/* Approved copy — Paul Joseph confirmed. */}
                The most highlighted promises from the Bible, compiled in a categorized index
                for personal growth, counseling, and witnessing.
              </p>
            </div>

            <div className={styles.featureCard} data-aos="fade-up" data-aos-delay="50">
              <div className={styles.featureIconWrap}>
                <Compass size={32} color="var(--gold)" />
              </div>
              <h3 className={styles.featureCardTitle}>Built For Disciples</h3>
              <p className={styles.featureCardText}>
                Built for ordinary believers who want to live like Christ,
                share the message of the Gospel,
                and make a real difference in the world around them.
              </p>
            </div>

            <div className={styles.featureCard} data-aos="fade-up" data-aos-delay="100">
              <div className={styles.featureIconWrap}>
                <Shield size={32} color="var(--gold)" />
              </div>
              <h3 className={styles.featureCardTitle}>For Every Battle</h3>
              <p className={styles.featureCardText}>
                When your faith is challenged, your identity is attacked, or someone
                needs an answer — this handbook gives you the Word.
              </p>
            </div>

            <div className={styles.featureCard} data-aos="fade-up">
              <div className={styles.featureIconWrap}>
                <Globe size={32} color="var(--gold)" />
              </div>
              <h3 className={styles.featureCardTitle}>Used Worldwide</h3>
              <p className={styles.featureCardText}>
                From prisons in the South to churches across the globe — the Handbook
                has been used by ministries worldwide to train disciples and equip believers for real mission.
              </p>
            </div>

            <div className={styles.featureCard} data-aos="fade-up" data-aos-delay="50">
              <div className={styles.featureIconWrap}>
                <Smartphone size={32} color="var(--gold)" />
              </div>
              <h3 className={styles.featureCardTitle}>Saves To Your Phone</h3>
              <p className={styles.featureCardText}>
                Download it as a PDF and add it to your phone&apos;s home screen.
                Your entire reference library, one tap away.
              </p>
            </div>

            <div className={styles.featureCard} data-aos="fade-up" data-aos-delay="100">
              <div className={styles.featureIconWrap}>
                <Key size={32} color="var(--gold)" />
              </div>
              <h3 className={styles.featureCardTitle}>Completely Free</h3>
              <p className={styles.featureCardText}>
                No subscription. No catch. No credit card.
                Paul built this as a ministry tool — not a product.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 - AUTHOR SECTION */}
      <section className={styles.authorSection}>
        <div className={`${styles.container} ${styles.authorContainer}`}>
          <div className={styles.authorImageCol} data-aos="fade-right">
            <div className={styles.authorImageWrapper}>
              <Image
                src="/images/WhatsApp Image 2026-05-05 at 03.09.32.jpeg"
                alt="Paul Joseph"
                width={360}
                height={360}
                style={{ objectFit: 'cover' }}
              />
            </div>
          </div>
          <div className={styles.authorTextCol} data-aos="fade-left">
            <div className={styles.labelWrapper}>
              <span className={styles.labelText}>MEET THE AUTHOR</span>
            </div>
            <h2 className={styles.headingDisplay} style={{ fontSize: '38px', marginBottom: '8px', lineHeight: 1.1 }}>
              Paul Joseph
            </h2>
            <div className={styles.authorTitle}>Author, Missionary & Founder of Jesus Boot Camp</div>

            <p className={styles.authorBio}>
              Paul Joseph spent over a decade as a missionary in Africa,
              working alongside churches, youth groups, and communities across
              the continent. Out of that experience — and a deep conviction
              that most believers are never truly trained to live their faith —
              he wrote the Handbook for a Disciple of Jesus.
            </p>
            <p className={styles.authorBio}>
              His mission is simple: to transform passive believers into
              devoted, mission-driven disciples of Christ. The Handbook
              is the first step.
            </p>

            <div className={styles.authorQuote}>
              <div className={`${styles.headingDisplay} ${styles.authorQuoteText}`}>
                "The Great Commission was never meant to be a suggestion."
              </div>
              <div className={styles.authorQuoteAttr}>— Paul Joseph, Author</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 - TESTIMONIALS */}
      {/* TODO: Replace with real testimonials when available. Do not publish placeholder names — Paul's instructions. */}

      {/* SECTION 7 - VIDEO SECTION */}
      <section className={styles.videoSection}>
        <div className={styles.container}>
          <h2 className={`${styles.headingDisplay} ${styles.sectionH2}`} data-aos="fade-up">
            Hear What This Handbook Can Do For You
          </h2>
          <p className={styles.sectionSub} data-aos="fade-up" data-aos-delay="50" style={{ marginBottom: '40px' }}>
            Paul shares why he wrote it — and how it can equip you
            for every situation you face.
          </p>

          <div
            className={styles.videoWrapper}
            data-aos="fade-up"
            onClick={() => {
              if (!isVideoPlaying) setIsVideoPlaying(true);
            }}
          >
            {isVideoPlaying ? (
              <video
                src="/images/video_2026-05-20_20-16-28.mp4"
                controls
                autoPlay
                className="w-full h-full object-cover relative z-10"
              />
            ) : (
              <>
                <div className={styles.videoOverlay} />
                <div className={styles.videoPlayBtn}>
                  <svg className={styles.videoPlayIcon} viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <div style={{ position: 'absolute', bottom: '24px', left: '24px', zIndex: 10, color: 'white', fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 'bold' }}>
                  Play Handbook Overview
                </div>
              </>
            )}
          </div>
          <div className={styles.videoCaption}>
            Watch time: approximately three minutes
          </div>
        </div>
      </section>

      {/* SECTION 8 - HOW IT WORKS */}
      <section className={styles.stepsSection}>
        <div className={styles.container}>
          <h2 className={`${styles.headingDisplay} ${styles.sectionH2}`} data-aos="fade-up">
            Three Steps To Get Your Free Copy
          </h2>

          <div className={styles.stepsRow}>
            <div className={styles.stepsConnector}></div>

            <div className={styles.stepCol} data-aos="fade-up">
              <div className={styles.stepImg} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--white)' }}>
                <Mail size={48} color="var(--gold)" />
              </div>
              <div className={`${styles.headingDisplay} ${styles.stepNumber}`}>01</div>
              <h3 className={styles.stepTitle}>Enter Your Email</h3>
              <p className={styles.stepText}>
                Drop your email address in the form above.
                That&apos;s all we need.
              </p>
            </div>

            <div className={styles.stepCol} data-aos="fade-up" data-aos-delay="100">
              <div className={styles.stepImg} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--white)' }}>
                <Inbox size={48} color="var(--gold)" />
              </div>
              <div className={`${styles.headingDisplay} ${styles.stepNumber}`}>02</div>
              <h3 className={styles.stepTitle}>Check Your Inbox</h3>
              <p className={styles.stepText}>
                We&apos;ll send the Handbook directly to your email
                as a PDF — instant delivery.
              </p>
            </div>

            <div className={styles.stepCol} data-aos="fade-up" data-aos-delay="200">
              <div className={styles.stepImg} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--white)' }}>
                <Download size={48} color="var(--gold)" />
              </div>
              <div className={`${styles.headingDisplay} ${styles.stepNumber}`}>03</div>
              <h3 className={styles.stepTitle}>Save It & Use It</h3>
              <p className={styles.stepText}>
                Open the PDF, save it to your phone&apos;s home screen,
                and access it anywhere — anytime.
              </p>
            </div>
          </div>

          <p className={styles.stepTip} data-aos="fade-in" data-aos-delay="300">
            💡 iPhone tip: Open PDF → tap Share → 'Add to Home Screen'.
            Android: Open PDF → tap Menu → 'Add to Home Screen'.
          </p>
        </div>
      </section>

      {/* SECTION 9 - FINAL CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaBg} style={{ backgroundImage: "radial-gradient(circle at center, #2A2A2A 0%, #1A1A1A 100%)", opacity: 0.8 }}></div>
        <div className={styles.container}>
          <div className={styles.ctaContent} data-aos="fade-up">
            <div className={styles.labelWrapper} style={{ justifyContent: 'center', margin: '0 auto 24px auto', display: 'flex', width: 'fit-content' }}>
              <span className={styles.labelText} style={{ letterSpacing: '0.2em' }}>GET YOUR FREE COPY</span>
            </div>

            <h2 className={`${styles.headingDisplay} ${styles.ctaH2}`}>
              Start Your Journey As A Disciple. Today.
            </h2>

            <p className={styles.ctaSub}>
              The Handbook is free. The only thing required is the
              willingness to be trained.
            </p>

            <div className={styles.ctaFormWrapper}>
              <form
                className={`${styles.emailForm} ${styles.ctaForm}`}
                onSubmit={(e) => handleFormSubmit(e, email2, setIsSubmitting2, setError2, setSuccess2)}
                noValidate
              >
                <div>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email address"
                    className={styles.inputField}
                    value={email2}
                    onChange={(e) => setEmail2(e.target.value)}
                    disabled={isSubmitting2 || success2}
                    autoComplete="email"
                    inputMode="email"
                    enterKeyHint="go"
                    aria-label="Email address"
                    aria-invalid={!!error2}
                  />
                  {error2 && <div className={styles.errorText} role="alert">{error2}</div>}
                </div>

                <button
                  type="submit"
                  className={`${styles.submitBtn} ${styles.pulseBtn} ${success2 ? styles.btnSuccess : ""}`}
                  disabled={isSubmitting2 || success2}
                >
                  {isSubmitting2 ? (
                    <><span className={styles.spinner}></span>Sending...</>
                  ) : success2 ? (
                    "✓ On its way!"
                  ) : (
                    "Yes — Send Me The Free Handbook →"
                  )}
                </button>
                <div className={styles.formDisclaimer} style={{ color: '#666666' }}>
                  🔒 Your email stays private — 100% secure. No credit card. Unsubscribe anytime.
                </div>
              </form>
            </div>

            <Link href="/" className={styles.skipLink}>
              Already have it? No thanks, take me to the main site →
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        © 2026 Jesus Boot Camp · All Rights Reserved · <Link href="/privacy">Privacy Policy</Link> · <Link href="/terms">Terms</Link>
      </footer>

      {/* STICKY MOBILE CTA BAR */}
      <div
        className={`${styles.stickyBar} ${showStickyBar && !success1 && !success2 ? styles.stickyBarVisible : ""}`}
        aria-hidden={!showStickyBar}
      >
        <div className={styles.stickyBarLabel}>
          <span className={styles.stickyBarFree}>FREE</span>
          <span className={styles.stickyBarText}>The Handbook</span>
        </div>
        <button
          type="button"
          onClick={scrollToHeroForm}
          className={styles.stickyBarButton}
          tabIndex={showStickyBar ? 0 : -1}
        >
          Get My Free Handbook →
        </button>
      </div>
    </div>
  );
}

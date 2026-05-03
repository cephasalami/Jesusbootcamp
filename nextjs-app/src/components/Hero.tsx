"use client";

import { motion } from "framer-motion";
import { Star, Lock, Unlock, BookOpen } from "lucide-react";
import { SectionTag, ButtonGold, ButtonOutline } from "./ui/Buttons";

export default function Hero() {
  return (
    <section id="hero" className="min-h-screen pt-[140px] pb-0 flex flex-col relative overflow-hidden bg-cream">
      <div className="max-w-[1200px] mx-auto w-full text-center px-8">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <SectionTag>
            <span className="w-2 h-2 rounded-full bg-gold animate-pulse-dot inline-block" />
            Three-Month Discipleship Course — Completely Free
          </SectionTag>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-[clamp(3rem,7vw,5.5rem)] font-extrabold leading-[1.05] text-navy mb-6 tracking-[-0.02em]"
        >
          From Believer
          <br />
          to <em className="italic text-gold">Disciple.</em>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-lg text-grey leading-[1.7] max-w-[600px] mx-auto mb-10"
        >
          The Jesus Boot Camp empowers <strong className="text-navy font-semibold">YOU</strong> to
          disciple your family, friends, and coworkers — and pass it on. One life at a time. Starting
          yours.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex items-center justify-center gap-4 flex-wrap mb-12"
        >
          <ButtonGold>Join the Boot Camp — It&apos;s Free ›</ButtonGold>
          <ButtonOutline>▶ Watch the Intro</ButtonOutline>
        </motion.div>

        {/* Floating Cards */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.3fr_1fr] gap-5 max-w-[1100px] mx-auto pb-8">
          {/* Testimonial Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="hidden md:block bg-white rounded-3xl border border-card-border shadow-[0_16px_60px_rgba(10,31,68,0.08)] p-6 hover:-translate-y-1 transition-transform"
          >
            <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-gold mb-3">
              Testimonial
            </div>
            <div className="flex gap-0.5 mb-2 text-gold text-sm">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-gold" />
              ))}
            </div>
            <p className="text-[13px] text-grey leading-relaxed">
              &quot;I&apos;ve been a Christian for 20 years, but I never felt like a disciple. This Boot
              Camp changed everything.&quot;
            </p>
            <div className="flex items-center gap-2.5 mt-4">
              <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center text-[11px] font-bold text-cream">
                SM
              </div>
              <div>
                <div className="text-xs font-bold">Sarah M.</div>
                <div className="text-[10px] text-grey">Texas</div>
              </div>
            </div>
          </motion.div>

          {/* Dashboard Card (Center, Dark) */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8 }}
            className="bg-navy rounded-3xl border border-transparent shadow-[0_16px_60px_rgba(10,31,68,0.08)] p-8 text-cream hover:-translate-y-1 transition-transform"
          >
            <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-gold mb-3">
              Your Dashboard
            </div>
            <div className="font-display text-[1.1rem] font-bold leading-snug text-cream mb-2">
              What It Truly Means to Be Born Again
            </div>
            <p className="text-[13px] text-cream/60 leading-relaxed flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> 30 min · Session 1 of 90
            </p>
            <div className="mt-4">
              <div className="flex justify-between text-[11px]">
                <span className="text-cream/50">Your progress</span>
                <span className="text-gold font-bold">Day 1 of 90</span>
              </div>
              <div className="h-1.5 bg-white/15 rounded-full overflow-hidden mt-1.5">
                <div className="h-full bg-gold rounded-full w-[1%]" />
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-xs text-cream/50">
                <span className="text-gold">S1</span>
                <Unlock className="w-3 h-3" /> Born Again — The Foundation
              </div>
              <div className="flex items-center gap-2 text-xs text-cream/30">
                <span className="text-gold">S2</span>
                <Lock className="w-3 h-3" /> Who You Are in Christ
              </div>
              <div className="flex items-center gap-2 text-xs text-cream/30">
                <span className="text-gold">S3</span>
                <Lock className="w-3 h-3" /> The Power of God&apos;s Word
              </div>
            </div>
          </motion.div>

          {/* Vision Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.9 }}
            className="hidden md:block bg-white rounded-3xl border border-card-border shadow-[0_16px_60px_rgba(10,31,68,0.08)] p-6 hover:-translate-y-1 transition-transform"
          >
            <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-gold mb-3">
              The Vision
            </div>
            <div className="font-display text-[2.5rem] font-extrabold text-gold my-2">5→2M+</div>
            <p className="text-[13px] text-grey leading-relaxed">
              You disciple 5. They disciple 5. One life becomes millions. That&apos;s the Give Me Five
              vision.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Ticker */}
      <div className="bg-navy py-4 overflow-hidden whitespace-nowrap">
        <div className="inline-flex animate-ticker">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="inline-flex">
              {["90 Sessions", "Completely Free", "30 Minutes a Day", "Change Your World", "Disciple 5. Reach Millions.", "Start Today"].map(
                (item) => (
                  <span
                    key={item + i}
                    className="inline-flex items-center gap-6 px-10 text-xs font-bold tracking-[0.15em] uppercase text-gold"
                  >
                    {item}
                    <span className="text-gold/35 text-base">·</span>
                  </span>
                )
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

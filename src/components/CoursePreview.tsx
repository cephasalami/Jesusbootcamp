"use client";

import { Lock, Unlock } from "lucide-react";
import FadeIn from "./ui/FadeIn";
import { SectionTag, ButtonGold } from "./ui/Buttons";

const lessons = [
  { num: "SESSION 01", title: "What It Truly Means to Be Born Again", desc: "Establish the unshakeable foundation of your identity in Christ — not religion, but relationship.", available: true },
  { num: "SESSION 02", title: "Who You Are in Christ", desc: "Discover your true identity — not shaped by the world, but declared by the Word.", available: false },
  { num: "SESSION 14", title: "The Power of God's Word", desc: "Learn how to wield Scripture like a soldier wields a sword — with precision and confidence.", available: false },
  { num: "SESSION 27", title: "Live Boldly", desc: "Faith without action is dead. This session moves you from belief into visible, daily obedience.", available: false },
  { num: "SESSION 38", title: "Sharing Your Faith Is Mandatory", desc: "Jesus didn't suggest evangelism. He commanded it. Learn how to share naturally and boldly.", available: false },
  { num: "SESSION 55", title: "The Authority of the Believer", desc: "Every believer has been given power. This session shows you how to walk in it daily.", available: false },
  { num: "SESSION 90", title: "Your Commission — Go and Disciple", desc: "You've trained for 90 days. Now it's time to deploy. Your mission begins here.", available: false },
];

export default function CoursePreview() {
  return (
    <section id="preview" className="py-28 pl-8 bg-white border-t border-card-border overflow-hidden">
      <FadeIn className="max-w-[1100px] mx-auto mb-12 pr-8">
        <SectionTag>Course Preview</SectionTag>
        <h2 className="font-display text-[clamp(2rem,3.5vw,2.8rem)] font-bold text-navy mt-5 mb-2">
          A Glimpse Inside the 90 Sessions
        </h2>
        <p className="text-base text-grey">
          Scroll to explore. All sessions unlock when you join — free, instantly.
        </p>
      </FadeIn>

      <div className="flex gap-4 overflow-x-auto pb-6 pr-8 scrollbar-thin">
        {lessons.map((lesson, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-[280px] bg-navy rounded-[var(--radius-xl)] p-8 relative overflow-hidden transition-transform hover:-translate-y-1"
          >
            <span className="text-[11px] font-bold tracking-widest text-gold mb-4 block">
              {lesson.num}
            </span>
            <div className="font-display text-[1.05rem] font-bold text-cream leading-snug mb-3">
              {lesson.title}
            </div>
            <div className="text-xs text-cream/45 leading-relaxed mb-4">{lesson.desc}</div>
            <div className="flex items-center gap-1.5 bg-white/6 rounded-lg px-3 py-2 text-[11px] text-cream/50 font-medium">
              {lesson.available ? (
                <>
                  <Unlock className="w-3 h-3" />
                  <span>Available Immediately</span>
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3" />
                  <span>Unlock on Join</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <FadeIn className="max-w-[1100px] mx-auto mt-10 pr-8 flex items-center justify-between flex-wrap gap-4">
        <p className="text-sm text-grey italic">
          <strong className="text-navy not-italic">+84 more sessions</strong> waiting for you inside
          the Boot Camp.
        </p>
        <ButtonGold>Unlock All 90 Sessions — Free ›</ButtonGold>
      </FadeIn>
    </section>
  );
}

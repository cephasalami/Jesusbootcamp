"use client";

import { Lock, Unlock } from "lucide-react";
import { SectionTag, ButtonGold } from "./ui/Buttons";
import { JOIN_URL } from "@/config/links";

const lessons = [
  { num: "SESSION 01", title: "What It Truly Means to Be Born Again", desc: "Establish the unshakeable foundation of your identity in Christ — not religion, but relationship.", available: true },
  { num: "SESSION 02", title: "Who You Are in Christ", desc: "Discover your true identity — not shaped by the world, but declared by the Word.", available: false },
  { num: "SESSION 14", title: "The Power of God's Word", desc: "Learn how to wield Scripture like a soldier wields a sword — with precision and confidence.", available: false },
  { num: "SESSION 27", title: "Live Boldly", desc: "Faith without action is dead. This session moves you from belief into visible, daily obedience.", available: false },
  { num: "SESSION 38", title: "Learn To Boldly Share Your Faith", desc: "Jesus didn't suggest evangelism. He commanded it. Learn how to share naturally and regularly.", available: false },
  { num: "SESSION 55", title: "The Authority of the Believer", desc: "Every believer has been given power. This session shows you how to walk in it daily.", available: false },
  { num: "SESSION 90", title: "Your Commission — Go and Disciple", desc: "You've trained for 90 days. Now it's time to deploy. Your mission begins here.", available: false },
];

export default function CoursePreview() {
  return (
    <section id="preview" className="py-28 pl-8 bg-white border-t border-card-border overflow-hidden">
      <div className="max-w-[1100px] mx-auto mb-12 pr-8" data-aos="fade-up">
        <SectionTag className="border-navy/10 text-navy/60">Course Preview</SectionTag>
        <h2 className="font-display text-[2.8rem] font-bold text-navy mt-6 mb-4 tracking-tight">
          A Glimpse Inside.
        </h2>
        <p className="text-[1.1rem] text-grey max-w-[600px]">
          Scroll to the right to explore. All sessions unlock as you progress through the course.
        </p>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-6 pr-8 scrollbar-thin" data-aos="fade-up" data-aos-delay="100">
        {lessons.map((lesson, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-[320px] bg-[#1A1A1A] p-10 relative overflow-hidden transition-all duration-500 hover:-translate-y-2 group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-[11px] font-bold tracking-[0.2em] text-gold mb-6 block uppercase">
              {lesson.num}
            </span>
            <div className="font-display text-[1.4rem] font-bold text-white leading-tight mb-4 tracking-tight">
              {lesson.title}
            </div>
            <div className="text-[14px] text-white/50 leading-relaxed mb-8">{lesson.desc}</div>
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-3 text-[12px] text-white/60 font-bold uppercase tracking-widest">
              {lesson.available ? (
                <>
                  <Unlock className="w-4 h-4 text-gold" />
                  <span>Available Now</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Unlock on Join</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="max-w-[1100px] mx-auto mt-12 pr-8 flex items-center justify-between flex-wrap gap-8" data-aos="fade-up">
        <p className="text-[14px] text-grey italic font-medium">
          <strong className="text-navy not-italic">+84 more sessions</strong> waiting for you inside.
        </p>
        <ButtonGold href={JOIN_URL}>Get Started →</ButtonGold>
      </div>
    </section>
  );
}


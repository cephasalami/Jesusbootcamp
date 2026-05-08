"use client";

import FadeIn from "./ui/FadeIn";
import { SectionTag } from "./ui/Buttons";

export default function LeadMagnet() {
  return (
    <section id="lead-magnet" className="bg-navy py-24 px-8">
      <div className="max-w-[800px] mx-auto text-center">
        <FadeIn>
          <SectionTag className="border-gold/30 mb-5">Free Download</SectionTag>
          <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-bold text-cream leading-snug mb-6">
            Get Your Free Copy of the Handbook for a Disciple of Jesus
          </h2>
          <p className="text-lg text-cream/75 leading-[1.8] mb-10 max-w-[600px] mx-auto">
            Thousands of Scripture references, organized by life topic. Used in prisons, youth groups, and churches worldwide. Download it free — instantly.
          </p>

          <form className="max-w-[460px] mx-auto flex flex-col sm:flex-row gap-3 mb-4" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Your email address"
              required
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-cream placeholder:text-cream/40 focus:outline-none focus:border-gold/50 transition-colors"
            />
            <button
              type="submit"
              className="bg-gold text-navy text-[15px] font-bold px-8 py-4 rounded-xl border-none transition-all duration-250 shadow-[0_2px_12px_rgba(201,168,76,0.3)] hover:bg-gold-light hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(201,168,76,0.35)] whitespace-nowrap"
            >
              Send Me The Free Handbook
            </button>
          </form>
          <p className="text-xs text-cream/40">No spam. Unsubscribe anytime.</p>
        </FadeIn>
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import FadeIn from "./ui/FadeIn";
import { SectionTag } from "./ui/Buttons";

export default function FinalCTA() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes("@")) {
      alert("Welcome to the Jesus Boot Camp! Check your inbox for Session 1.");
      setEmail("");
    } else {
      alert("Please enter a valid email address.");
    }
  };

  return (
    <section
      id="cta-final"
      className="bg-navy py-32 px-8 border-t border-gold/15 text-center relative overflow-hidden"
    >
      {/* Decorative gradients */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(201,168,76,0.1),transparent_70%),radial-gradient(ellipse_40%_40%_at_80%_100%,rgba(201,168,76,0.06),transparent_70%)]" />

      <FadeIn className="max-w-[700px] mx-auto relative z-10">
        <SectionTag className="border-gold/40">Join Free — Start Today</SectionTag>
        <h2 className="font-display text-[clamp(2.2rem,5vw,3.8rem)] font-extrabold text-cream leading-[1.1] mt-6 mb-4">
          The world needs
          <br />
          disciples.
          <br />
          Not spectators.
        </h2>
        <p className="text-[1.05rem] text-gold font-medium mb-10 leading-relaxed">
          90 days. 30 minutes a day. Completely free. Are you in?
        </p>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row max-w-[540px] mx-auto mb-4 rounded-[14px] overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.3)]"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address…"
            className="flex-1 px-6 py-4 bg-white/8 border-[1.5px] border-white/15 sm:border-r-0 text-cream font-body text-[0.95rem] outline-none transition-colors focus:border-gold/60 placeholder:text-cream/35 rounded-t-[14px] sm:rounded-t-none sm:rounded-l-[14px]"
          />
          <button
            type="submit"
            className="bg-gold border-none text-navy font-body text-sm font-bold px-7 py-4 cursor-pointer transition-colors hover:bg-gold-light whitespace-nowrap rounded-b-[14px] sm:rounded-b-none sm:rounded-r-[14px]"
          >
            Yes — Send Me Day 1 →
          </button>
        </form>
        <p className="text-xs text-cream/35">
          No spam. Unsubscribe anytime. Instant access to Session 1.
        </p>
      </FadeIn>
    </section>
  );
}

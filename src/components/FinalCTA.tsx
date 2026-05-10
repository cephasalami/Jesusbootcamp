"use client";

import { useState } from "react";
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
      className="bg-cream py-32 px-8 border-t border-card-border text-center overflow-hidden"
    >
      <div className="max-w-[700px] mx-auto relative z-10" data-aos="fade-up">
        <SectionTag className="mb-6 border-navy/10 text-navy/60">Join Free — Start Today</SectionTag>
        <h2 className="font-display text-[3.2rem] font-bold text-navy leading-[1.1] mt-6 mb-8 tracking-tight">
          The world needs disciples.
          <br />
          <em className="italic text-gold font-normal">Not spectators.</em>
        </h2>
        <p className="text-[1.15rem] text-grey max-w-[500px] mx-auto mb-12 leading-[1.8]">
          90 days. 30 minutes a day. Completely free.
          Are you ready to truly follow?
        </p>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row max-w-[540px] mx-auto mb-8 rounded-sm overflow-hidden shadow-sm"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address…"
            className="flex-1 px-6 py-[18px] bg-white border border-card-border sm:border-r-0 text-navy font-body text-[1rem] outline-none transition-colors focus:border-gold placeholder:text-grey/40"
          />
          <button
            type="submit"
            className="bg-navy border-none text-white font-body text-[15px] font-bold px-8 py-[18px] transition-all hover:bg-gold hover:text-navy whitespace-nowrap"
          >
            Yes — Send Me Day 1 ›
          </button>
        </form>
        <p className="text-xs text-grey/50 italic">
          No marketing spam. Unsubscribe anytime. Instant access.
        </p>
      </div>
    </section>
  );
}

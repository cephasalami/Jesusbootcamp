"use client";

import { useState } from "react";
import { SectionTag } from "./ui/Buttons";

export default function FinalCTA() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email || !email.includes("@")) {
      setStatus("error");
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");

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

      setStatus("success");
      setEmail("");
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "Something went wrong.");
    }
  };

  return (
    <section
      id="cta-final"
      className="bg-cream py-20 sm:py-32 px-5 sm:px-8 border-t border-card-border text-center overflow-hidden"
    >
      <div className="max-w-[700px] mx-auto relative z-10" data-aos="fade-up">
        <SectionTag className="mb-6 border-navy/10 text-navy/60">Join the Boot Camp</SectionTag>
        <h2 className="font-display text-[clamp(2rem,6vw,3.2rem)] font-bold text-navy leading-[1.1] mt-6 mb-8 tracking-tight">
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
          className="flex flex-col max-w-[540px] mx-auto mb-8"
        >
          <div className="flex flex-col sm:flex-row rounded-sm overflow-hidden shadow-sm">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "loading" || status === "success"}
              placeholder="Enter your email address…"
              className="flex-1 px-6 py-[18px] bg-white border border-card-border sm:border-r-0 text-navy font-body text-[1rem] outline-none transition-colors focus:border-gold placeholder:text-grey/40 disabled:opacity-75"
            />
            <button
              type="submit"
              disabled={status === "loading" || status === "success"}
              className="bg-navy border-none text-white font-body text-[15px] font-bold px-8 py-[18px] transition-all hover:bg-gold hover:text-navy whitespace-nowrap disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {status === "loading" ? "Sending..." : status === "success" ? "✓ Sent!" : "Yes — Send Me Day 1 ›"}
            </button>
          </div>
          {status === "error" && <p className="text-[#D94F4F] text-sm mt-3 text-left pl-2">{errorMessage}</p>}
          {status === "success" && <p className="text-[#4CAF50] font-bold text-sm mt-3 text-center">Welcome! Check your inbox for Session 1.</p>}
        </form>
        <p className="text-xs text-grey/50 italic">
          No marketing spam. Unsubscribe anytime. Instant access.
        </p>
      </div>
    </section>
  );
}

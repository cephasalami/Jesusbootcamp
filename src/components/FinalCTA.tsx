"use client";

import { useState } from "react";
import { SectionTag } from "./ui/Buttons";
import { Send, Sparkles, Check, AlertCircle } from "lucide-react";

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
      className="bg-gradient-to-b from-[#EDEAE2] to-[#F5F0E8] py-24 sm:py-36 px-5 sm:px-8 border-t border-card-border text-center overflow-hidden relative"
    >
      {/* Decorative background visual elements */}
      <div className="absolute top-[30%] left-[5%] w-[20vw] h-[20vw] bg-gold/5 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[20%] right-[5%] w-[25vw] h-[25vw] bg-gold/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-[850px] mx-auto relative z-10" data-aos="fade-up">
        {/* Crest Tag */}
        <div className="mb-8">
          <SectionTag className="border-gold/20 text-gold bg-gold/5">Join the Boot Camp</SectionTag>
        </div>

        {/* Editorial Heading */}
        <h2 className="font-display text-[clamp(2.2rem,6vw,3.6rem)] font-bold text-navy leading-[1.15] mb-8 tracking-tight max-w-[750px] mx-auto">
          The world needs{" "}
          <span className="italic text-gold font-normal relative inline-block">
            committed disciples.
            <span className="absolute bottom-1 left-0 w-full h-[2px] bg-gold/20" />
          </span>
        </h2>

        {/* Tagline (Removing completely free) */}
        <p className="text-[1.1rem] sm:text-[1.25rem] text-grey/90 max-w-[580px] mx-auto mb-12 leading-[1.8] font-medium">
          90 days. 30 minutes a day.
          <br />
          <br />
          Are you ready to truly follow Jesus?
        </p>

        {/* Dynamic Card Form */}
        <div className="max-w-[620px] mx-auto bg-white border border-card-border p-6 sm:p-10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.03)] backdrop-blur-sm relative group hover:shadow-[0_30px_60px_rgba(201,168,76,0.06)] transition-all duration-500">
          
          {/* Subtle glowing borders */}
          <div className="absolute inset-0 border border-gold/0 rounded-2xl group-hover:border-gold/15 transition-colors duration-500 pointer-events-none" />

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === "loading" || status === "success"}
                placeholder="Enter your email address…"
                className="w-full px-6 py-4.5 bg-cream/30 border border-card-border text-navy font-body text-[15px] sm:text-[16px] outline-none transition-all focus:border-gold focus:bg-white placeholder:text-grey/40 disabled:opacity-75"
              />
            </div>
            
            <button
              type="submit"
              disabled={status === "loading" || status === "success"}
              className="bg-navy border border-navy/20 text-white font-body text-[15px] font-bold px-8 py-4.5 transition-all duration-300 hover:bg-gold hover:text-navy hover:shadow-lg disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2 group/btn active:scale-[0.98]"
            >
              {status === "loading" ? (
                "Sending..."
              ) : status === "success" ? (
                <>
                  <Check className="w-4 h-4" /> Sent!
                </>
              ) : (
                <>
                  <span>Enter Now</span>
                  <Send className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Dynamic Feedbacks */}
          {status === "error" && (
            <div className="flex items-center gap-2 text-[#D94F4F] text-[14px] mt-4 font-semibold justify-center">
              <AlertCircle className="w-4 h-4" />
              <span>{errorMessage}</span>
            </div>
          )}
          {status === "success" && (
            <div className="flex items-center gap-2 text-green-600 text-[15px] mt-4 font-bold justify-center animate-pulse">
              <Sparkles className="w-4 h-4 fill-green-600 text-green-600" />
              <span>Welcome! Check your inbox for Session 1.</span>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}

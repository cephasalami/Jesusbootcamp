"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SectionTag } from "./ui/Buttons";
import { trackFbEvent } from "@/lib/fbq";

export default function LeadMagnet() {
  const router = useRouter();
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
      // Count the form fill (mirrors to Meta + first-party /api/track).
      trackFbEvent("Lead", { content_name: "Handbook — Lead Magnet", form: "lead-magnet" });
      // Route the new subscriber into the funnel: the thank-you page confirms
      // delivery and presents the $5 Power for the Hour tripwire.
      setTimeout(() => router.push("/thank-you?order=handbook"), 1200);
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "Something went wrong.");
    }
  };

  return (
    <section id="lead-magnet" className="bg-cream py-16 sm:py-24 px-5 sm:px-8 border-t border-card-border">
      <div className="max-w-[800px] mx-auto text-center" data-aos="fade-up">
        <SectionTag className="mb-6 border-navy/10 text-navy/60">Free Resource</SectionTag>
        <h2 className="font-display text-[clamp(2rem,5vw,2.8rem)] font-bold text-navy leading-tight mb-6 tracking-tight">
          Get Your Free Copy.
        </h2>
        <p className="text-[1.1rem] text-grey leading-[1.8] mb-12 max-w-[600px] mx-auto">
          The Handbook for a Disciple of Jesus contains thousands of Scripture references
          organized by life topic. Download it instantly for free.
        </p>

        <form className="max-w-[480px] mx-auto flex flex-col mb-4" onSubmit={handleSubmit}>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "loading" || status === "success"}
              placeholder="Your email address"
              required
              className="flex-1 bg-white border border-card-border rounded-sm px-5 py-4 text-navy placeholder:text-grey/50 focus:outline-none focus:border-gold transition-colors disabled:opacity-75"
            />
            <button
              type="submit"
              disabled={status === "loading" || status === "success"}
              className="bg-navy text-white text-[15px] font-bold px-8 py-4 rounded-sm border-none transition-all duration-250 hover:bg-gold hover:text-navy whitespace-nowrap disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {status === "loading" ? "Sending..." : status === "success" ? "✓ Sent!" : "Send Me The Handbook ›"}
            </button>
          </div>
          {status === "error" && <p className="text-[#D94F4F] text-sm mt-3 text-left">{errorMessage}</p>}
          {status === "success" && <p className="text-[#4CAF50] font-bold text-sm mt-3 text-center">Check your inbox for the download link!</p>}
        </form>
        <p className="text-xs text-grey/60 italic">No marketing spam. Only your resource.</p>
      </div>
    </section>
  );
}

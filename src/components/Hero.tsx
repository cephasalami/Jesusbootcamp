import Image from "next/image";
import { ArrowRight, Sparkles, Award } from "lucide-react";
import { JOIN_URL } from "@/config/links";
import TrialNote from "./ui/TrialNote";

export default function Hero() {
  return (
    <section
      id="hero"
      className="pt-[140px] pb-20 sm:pt-[170px] sm:pb-28 px-5 sm:px-8 bg-gradient-to-b from-[#F5F0E8] via-[#F7F3EB] to-[#EDEAE2] overflow-hidden relative"
    >
      {/* Background glow accents */}
      <div className="absolute top-[10%] left-[-10%] w-[35vw] h-[35vw] bg-gold/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[40vw] h-[40vw] bg-gold/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-20 items-center relative z-10">
        {/* ── LEFT: copy + CTAs ── */}
        <div data-aos="fade-up" data-aos-duration="1000" className="flex flex-col">
          <span className="text-[12px] font-bold text-gold tracking-[0.25em] uppercase mb-6 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> The Jesus Boot Camp
          </span>

          <h1 className="font-display text-[clamp(2.4rem,5.2vw,3.8rem)] font-bold leading-[1.08] text-navy tracking-tight mb-6">
            Become an active disciple of Jesus in only{" "}
            <span className="italic font-normal text-gold">three months</span>
          </h1>

          <p className="text-[1.05rem] sm:text-[1.18rem] text-grey/90 leading-[1.75] max-w-[520px] mb-10">
            Structured training in the Word that moves you from believer to disciple —
            so you can follow Jesus and, in turn, disciple others. Fulfilling the{" "}
            <strong className="text-navy font-bold">Great Commission</strong>.
          </p>

          {/* CTA row: text link + solid button */}
          <div className="flex items-center gap-7 flex-wrap">
            <a
              href="/handbook"
              className="inline-flex items-center gap-2 text-[15px] font-bold text-navy group"
            >
              Get the free Handbook
              <ArrowRight className="w-4 h-4 text-gold transition-transform duration-300 group-hover:translate-x-1" />
            </a>
            <a
              href={JOIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 bg-navy text-white text-[15px] sm:text-[16px] font-bold px-8 py-4 rounded-md border border-navy/20 shadow-[0_10px_30px_rgba(26,26,26,0.12)] transition-all duration-300 hover:bg-gold hover:text-navy hover:-translate-y-0.5 hover:shadow-[0_15px_35px_rgba(201,168,76,0.25)] group"
            >
              Start Your Free Trial
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
          </div>
          <TrialNote className="mt-4" />
        </div>

        {/* ── RIGHT: hero book image ── */}
        <div
          data-aos="fade-left"
          data-aos-duration="1200"
          className="relative w-full max-w-[460px] mx-auto"
        >
          {/* warm glow halo */}
          <div className="absolute inset-[-32px] bg-gold/10 blur-[90px] rounded-full pointer-events-none" />

          {/* decorative gold corner frame */}
          <div className="absolute bottom-[-20px] left-[-20px] w-2/3 h-2/3 border-l-2 border-b-2 border-gold/30 rounded-bl-[40px] pointer-events-none" />

          {/* the book */}
          <div className="relative rounded-2xl overflow-hidden shadow-[0_40px_90px_rgba(26,26,26,0.28)] border border-card-border/40 group">
            <Image
              src="/images/paul-joseph.jpg"
              alt="Paul Joseph — founder of the Jesus Boot Camp"
              width={820}
              height={1090}
              priority
              sizes="(max-width: 1024px) 90vw, 460px"
              className="w-full h-auto transition-transform duration-[1200ms] group-hover:scale-[1.03]"
            />
          </div>

          {/* 90-day seal */}
          <div className="absolute top-[-20px] right-[-20px] w-20 h-20 bg-gold text-navy rounded-full flex flex-col items-center justify-center shadow-2xl border-4 border-cream rotate-6 hover:rotate-0 transition-transform duration-500">
            <Award className="w-6 h-6" />
            <span className="text-[9px] font-extrabold tracking-wider uppercase mt-0.5">90 Days</span>
          </div>
        </div>
      </div>
    </section>
  );
}

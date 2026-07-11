import { ArrowRight, ArrowDown, Sparkles } from "lucide-react";
import { JOIN_URL } from "@/config/links";

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-[100svh] flex flex-col overflow-hidden bg-gradient-to-b from-[#F5F0E8] via-[#F7F3EB] to-[#EDEAE2] px-5 sm:px-8"
    >
      {/* Background glow accents */}
      <div className="absolute top-[8%] left-[-12%] w-[40vw] h-[40vw] bg-gold/5 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[5%] right-[-10%] w-[45vw] h-[45vw] bg-gold/5 blur-[160px] rounded-full pointer-events-none" />

      <div className="max-w-[1200px] mx-auto w-full flex-1 flex flex-col justify-center pt-[130px] pb-16 relative z-10">
        <div data-aos="fade-up" data-aos-duration="1000">
          <span className="text-[12px] font-bold text-gold tracking-[0.25em] uppercase mb-8 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> The Jesus Boot Camp
          </span>

          <h1 className="font-display text-[clamp(2.6rem,7.5vw,6.2rem)] font-bold leading-[1.04] text-navy tracking-tight mb-10 max-w-[1050px]">
            Become an active disciple of Jesus in only{" "}
            <span className="italic font-normal text-gold">three months</span>
          </h1>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-10">
            <p className="text-[1.05rem] sm:text-[1.2rem] text-grey/90 leading-[1.75] max-w-[480px]">
              Structured training in the Word that moves you from believer to disciple —
              so you can follow Jesus and, in turn, disciple others. Fulfilling the{" "}
              <strong className="text-navy font-bold">Great Commission</strong>.
            </p>

            <div className="flex items-center gap-7 flex-wrap shrink-0">
              <a
                href="/handbook"
                className="inline-flex items-center gap-2 text-[15px] font-bold text-navy group"
              >
                Get the Handbook
                <ArrowRight className="w-4 h-4 text-gold transition-transform duration-300 group-hover:translate-x-1" />
              </a>
              <a
                href={JOIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 bg-navy text-white text-[15px] sm:text-[16px] font-bold px-8 py-4 rounded-md border border-navy/20 shadow-[0_10px_30px_rgba(26,26,26,0.12)] transition-all duration-300 hover:bg-gold hover:text-navy hover:-translate-y-0.5 hover:shadow-[0_15px_35px_rgba(201,168,76,0.25)] group"
              >
                Get Started
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <a
        href="#problem"
        className="relative z-10 mx-auto mb-10 flex flex-col items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-grey/60 hover:text-navy transition-colors"
      >
        Scroll to explore
        <ArrowDown className="w-4 h-4 text-gold animate-bounce" />
      </a>
    </section>
  );
}

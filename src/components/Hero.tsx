import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Users, CalendarCheck } from "lucide-react";

const TRUST_MARKERS = [
  { icon: BookOpen, label: "Rooted in the Word" },
  { icon: CalendarCheck, label: "A focused 90-day journey" },
  { icon: Users, label: "Equipped to disciple others" },
];

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-svh flex flex-col overflow-hidden"
    >
      {/* ── Full-bleed background ── */}
      <Image
        src="/images/hero-meadow.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* ── Hero copy, anchored over the light upper sky for natural contrast ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-start text-center px-5 sm:px-8 pt-[100px] pb-8">
        {/* eyebrow badge */}
        <span
          data-aos="fade-down"
          data-aos-duration="800"
          className="inline-flex items-center gap-2.5 rounded-full bg-white/70 backdrop-blur-md border border-white/60 px-4 py-2 text-[11px] sm:text-[12px] font-bold uppercase tracking-[0.22em] text-navy shadow-[0_4px_20px_rgba(26,26,26,0.08)] mb-7"
        >
          <span className="w-2 h-2 rounded-full bg-gold animate-pulse-dot" />
          The Jesus Boot Camp
        </span>

        {/* headline */}
        <h1
          data-aos="fade-up"
          data-aos-duration="1000"
          className="font-display font-bold text-navy tracking-tight leading-[1.05] text-[clamp(2.3rem,5.4vw,4rem)] max-w-[18ch] mx-auto"
        >
          Become an active disciple of Jesus in only{" "}
          <span className="italic font-normal text-gold">three months</span>
        </h1>

        {/* supporting copy */}
        <p
          data-aos="fade-up"
          data-aos-delay="120"
          data-aos-duration="1000"
          style={{ color: "#1A1A1A" }}
          className="mt-4 text-[1.02rem] sm:text-[1.15rem] font-semibold leading-[1.6] max-w-[640px] mx-auto"
        >
          Structured training in the Word, so you can disciple others.
        </p>

        {/* CTAs */}
        <div
          data-aos="fade-up"
          data-aos-delay="200"
          data-aos-duration="1000"
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/join"
            className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-navy text-white text-[14px] sm:text-[16px] font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full shadow-[0_15px_40px_rgba(26,26,26,0.35)] transition-all duration-300 hover:bg-gold hover:text-navy hover:-translate-y-0.5"
          >
            Enlist in the Jesus Boot Camp
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <a
            href="/handbook"
            className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/60 backdrop-blur-md border border-white/60 text-navy text-[14px] sm:text-[15px] font-bold px-6 sm:px-7 py-3.5 sm:py-4 rounded-full transition-all duration-300 hover:bg-white/90 hover:-translate-y-0.5"
          >
            Get the free Handbook
            <ArrowRight className="w-4 h-4 text-gold transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        </div>
      </div>

      {/* ── Bottom trust strip (echoes the reference logo row) ── */}
      <div className="relative z-10 w-full px-4 sm:px-5 pb-5 sm:pb-8">
        <div
          data-aos="fade-up"
          data-aos-delay="300"
          className="mx-auto w-full max-w-[900px] rounded-xl sm:rounded-2xl bg-cream/70 backdrop-blur-md border border-white/50 shadow-[0_10px_40px_rgba(26,26,26,0.12)] px-4 py-3 sm:px-6 sm:py-4 flex flex-wrap items-center justify-center gap-x-5 sm:gap-x-9 gap-y-2 sm:gap-y-2.5"
        >
          {TRUST_MARKERS.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 sm:gap-2 text-[12px] sm:text-[14px] font-semibold text-navy/80 whitespace-nowrap"
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gold shrink-0" />
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

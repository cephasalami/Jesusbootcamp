import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section id="hero" className="relative min-h-svh flex flex-col overflow-hidden">
      <Image
        src="/images/hero-meadow.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[60%_center] sm:object-center"
      />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-start text-center px-5 sm:px-8 pt-[100px] pb-8">
        <h1
          data-aos="fade-up"
          data-aos-duration="1000"
          className="font-display font-bold text-navy tracking-tight leading-[1.05] text-[clamp(2.3rem,5.4vw,4rem)] max-w-[18ch] mx-auto"
        >
          Become an active disciple of Jesus in only{" "}
          <span className="italic font-normal text-[#8A6510] drop-shadow-[0_1px_1px_rgba(255,255,255,0.55)]">
            three months
          </span>
        </h1>

        <p
          data-aos="fade-up"
          data-aos-delay="120"
          data-aos-duration="1000"
          style={{ color: "#1A1A1A" }}
          className="mt-4 text-[1.02rem] sm:text-[1.15rem] font-semibold leading-[1.6] max-w-[640px] mx-auto"
        >
          Structured training in the Word, so you can disciple others.
        </p>

        <div
          data-aos="fade-up"
          data-aos-delay="200"
          data-aos-duration="1000"
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/join"
            className="group w-full sm:w-auto inline-flex items-center justify-center gap-1.5 sm:gap-3 whitespace-nowrap text-[13px] sm:text-[16px] bg-navy text-white font-bold px-4 sm:px-8 py-3.5 sm:py-4 rounded-full shadow-[0_15px_40px_rgba(26,26,26,0.35)] transition-all duration-300 hover:bg-gold hover:text-navy hover:-translate-y-0.5"
          >
            Enlist in the Jesus Boot Camp
            <ArrowRight className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <a
            href="/handbook"
            className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-cream/95 backdrop-blur-md border border-navy/25 text-navy text-[14px] sm:text-[15px] font-bold px-6 sm:px-7 py-3.5 sm:py-4 rounded-full shadow-[0_8px_24px_rgba(26,26,26,0.12)] transition-all duration-300 hover:bg-white hover:-translate-y-0.5"
          >
            Get the free Handbook
            <ArrowRight className="w-4 h-4 text-gold transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </section>
  );
}

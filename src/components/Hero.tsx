import { SectionTag, ButtonGold } from "./ui/Buttons";
import Image from "next/image";

export default function Hero() {
  return (
    <section
      id="hero"
      className="pt-[120px] pb-16 sm:pt-[160px] sm:pb-24 px-5 sm:px-8 bg-cream overflow-hidden"
    >
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-10 lg:gap-16 items-center">
        {/* Content */}
        <div data-aos="fade-up" data-aos-duration="1000">
          <SectionTag className="mb-6 sm:mb-8 border-navy/10 text-navy/60">
            Three-Month Discipleship Course — Completely Free
          </SectionTag>

          <h1 className="font-display text-[clamp(2.2rem,6vw,4.8rem)] font-bold leading-[1.1] text-navy mb-6 sm:mb-8 tracking-tight">
            From Believer
            <br />
            to <em className="italic text-gold">Disciple.</em>
          </h1>

          <p className="text-[1rem] sm:text-[1.15rem] text-grey leading-[1.8] max-w-[580px] mb-10 sm:mb-12">
            The Jesus Boot Camp empowers <strong className="text-navy font-semibold">YOU</strong> to
            disciple your family, friends, and coworkers — and pass it on. One life at a time. Starting
            yours.
          </p>

          <div className="flex items-center gap-4 flex-wrap">
            {/* TODO: Replace with live Stripe recurring donation link once Stripe is configured. Supports "any amount" with monthly recurring option. */}
            <ButtonGold href="#stripe-donation">Join the Boot Camp — Give What You Can ›</ButtonGold>
          </div>
        </div>

        {/* Visual — hidden on mobile to prevent clutter, shown lg+ */}
        <div className="hidden lg:block relative" data-aos="fade-left" data-aos-duration="1200">
          <div className="aspect-[4/5] w-full max-w-[450px] mx-auto bg-warm rounded-lg overflow-hidden relative shadow-[24px_24px_80px_rgba(0,0,0,0.06)]">
            <Image
              src="/images/paul-joseph.jpg"
              alt="Paul Joseph"
              fill
              className="object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-700"
              priority
            />
          </div>
          {/* Subtle decoration */}
          <div className="absolute -bottom-6 -left-6 w-32 h-32 border-l-2 border-b-2 border-gold/40 rounded-bl-3xl" />
        </div>
      </div>
    </section>
  );
}

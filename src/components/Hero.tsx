import { SectionTag, ButtonGold } from "./ui/Buttons";

export default function Hero() {
  return (
    <section
      id="hero"
      className="pt-[160px] pb-24 px-8 bg-cream overflow-hidden"
    >
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-16 items-center">
        {/* Content */}
        <div data-aos="fade-up" data-aos-duration="1000">
          <SectionTag className="mb-8 border-navy/10 text-navy/60">
            Three-Month Discipleship Course — Completely Free
          </SectionTag>

          <h1 className="font-display text-[clamp(2.8rem,6vw,4.8rem)] font-bold leading-[1.1] text-navy mb-8 tracking-tight">
            From Believer
            <br />
            to <em className="italic text-gold">Disciple.</em>
          </h1>

          <p className="text-[1.15rem] text-grey leading-[1.8] max-w-[580px] mb-12">
            The Jesus Boot Camp empowers <strong className="text-navy font-semibold">YOU</strong> to
            disciple your family, friends, and coworkers — and pass it on. One life at a time. Starting
            yours.
          </p>

          <div className="flex items-center gap-4 flex-wrap">
            <ButtonGold>Join the Boot Camp — It&apos;s Free ›</ButtonGold>
          </div>
        </div>

        {/* Visual */}
        <div className="relative" data-aos="fade-left" data-aos-duration="1200">
          <div className="aspect-[4/5] w-full max-w-[450px] mx-auto bg-warm rounded-lg overflow-hidden relative shadow-[24px_24px_80px_rgba(0,0,0,0.06)]">
            <img
              src="/images/WhatsApp Image 2026-05-05 at 03.09.32.jpeg"
              alt="Paul Joseph"
              className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-700"
            />
          </div>
          {/* Subtle decoration */}
          <div className="absolute -bottom-6 -left-6 w-32 h-32 border-l-2 border-b-2 border-gold/40 rounded-bl-3xl" />
        </div>
      </div>
    </section>
  );
}

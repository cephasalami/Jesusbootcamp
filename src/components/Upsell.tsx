import FadeIn from "./ui/FadeIn";
import { SectionTag, ButtonGold } from "./ui/Buttons";

export default function Upsell() {
  return (
    <section id="upsell" className="bg-navy-light py-20 px-8 border-t border-white/5">
      <div className="max-w-[800px] mx-auto text-center">
        <FadeIn>
          <SectionTag className="border-gold/30 mb-5">Take The Next Step</SectionTag>
          <h2 className="font-display text-[clamp(1.8rem,3vw,2.5rem)] font-bold text-cream leading-snug mb-4">
            Power for the Hour
          </h2>
          <p className="text-base text-cream/75 leading-[1.8] mb-8 max-w-[500px] mx-auto">
            A compact, powerful devotional resource for daily spiritual discipline. Get instant access for just $5.
          </p>
          <ButtonGold href="#">Get Power for the Hour — $5</ButtonGold>
          <p className="text-xs text-cream/40 mt-4">One-time purchase. Instant digital download.</p>
        </FadeIn>
      </div>
    </section>
  );
}

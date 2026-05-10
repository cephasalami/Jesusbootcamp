import { SectionTag, ButtonGold } from "./ui/Buttons";

export default function Upsell() {
  return (
    <section id="upsell" className="py-24 px-8 bg-cream-dark border-t border-card-border overflow-hidden">
      <div className="max-w-[900px] mx-auto text-center">
        <SectionTag className="mb-6 border-navy/10 text-navy/60">Digital Resource</SectionTag>
        <h2 className="font-display text-[2.8rem] font-bold text-navy leading-tight mb-6 tracking-tight">
          Power for the Hour.
        </h2>
        <p className="text-[1.1rem] text-grey leading-[1.8] mb-12 max-w-[580px] mx-auto">
          A compact, powerful devotional field manual for those who want to deepen
          their daily walk with God. Get instant access today.
        </p>
        <ButtonGold href="#">Get the Devotional — Just $5 ›</ButtonGold>
        <p className="text-xs text-grey/60 mt-6 italic">Secure checkout. Instant download.</p>
      </div>
    </section>
  );
}

import { Search, VolumeX, BedDouble } from "lucide-react";
import FadeIn from "./ui/FadeIn";
import { SectionTag } from "./ui/Buttons";

const cards = [
  {
    icon: Search,
    title: "Unprepared",
    text: '"I don\'t know which Scriptures to use in real life — I feel unprepared when it matters most."',
  },
  {
    icon: VolumeX,
    title: "Speechless",
    text: '"I freeze when someone challenges my faith — I can\'t explain what I believe or defend it."',
  },
  {
    icon: BedDouble,
    title: "Stagnant",
    text: '"My faith feels like a Sunday ritual, not a daily lifestyle — I want more but don\'t know how to get there."',
  },
];

export default function Problem() {
  return (
    <section id="problem" className="py-28 px-8 bg-white border-t border-card-border">
      <div className="max-w-[1100px] mx-auto">
        <FadeIn className="text-center mb-16">
          <SectionTag>The Problem</SectionTag>
          <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-bold text-navy leading-tight mt-5 mb-3">
            &quot;Most believers attend church.
            <br />
            Few actually follow Christ.&quot;
          </h2>
          <p className="text-[1.05rem] text-grey max-w-[650px] mx-auto leading-[1.7]">
            You know the Bible stories. You&apos;ve sat in the pews. But when someone asks you a hard
            question about your faith — or when life falls apart — you freeze. You were never trained.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cards.map((card, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div className="bg-cream rounded-3xl border border-card-border p-8 transition-all duration-300 relative overflow-hidden hover:shadow-[0_12px_36px_rgba(10,31,68,0.08)] hover:-translate-y-1 group">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gold rounded-t-3xl" />
                <card.icon className="w-8 h-8 text-gold mb-4" />
                <h4 className="font-display text-[1.1rem] font-bold text-navy mb-2">{card.title}</h4>
                <p className="text-sm text-grey leading-relaxed italic">{card.text}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

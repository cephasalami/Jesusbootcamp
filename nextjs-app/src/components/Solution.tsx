import { Swords, BookOpen, Flame, Globe } from "lucide-react";
import FadeIn from "./ui/FadeIn";
import { SectionTag, ButtonGold } from "./ui/Buttons";

const pillars = [
  { icon: Swords, title: "Train Like a Soldier", text: "Daily discipline is the hallmark of every true disciple. Build habits that outlast your emotions." },
  { icon: BookOpen, title: "Know Your Word", text: "Master Scripture for real-life situations. Know what to say, when to say it, and why it's true." },
  { icon: Flame, title: "Live It Boldly", text: "Faith without action is dead. Each session comes with real-world application — not just theory." },
  { icon: Globe, title: "Disciple Others", text: "By Day 90, you'll be ready to lead others through the same journey. One life becomes many." },
];

export default function Solution() {
  return (
    <section id="solution" className="bg-navy py-28 px-8">
      <FadeIn className="max-w-[1100px] mx-auto text-center">
        <SectionTag className="border-gold/30">The Solution</SectionTag>
        <h2 className="font-display text-[clamp(2rem,4.5vw,3.2rem)] font-bold text-cream leading-tight mt-5 mb-4">
          The Jesus Boot Camp was built
          <br />
          for exactly this.
        </h2>
        <p className="text-base text-cream/55 mb-16">
          90 sessions. 30 minutes a day. Everything you need to go from dormant to deployed.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[2px] bg-white/8 rounded-[var(--radius-xl)] overflow-hidden mb-14">
          {pillars.map((p, i) => (
            <div
              key={i}
              className="bg-navy px-7 py-10 text-center transition-colors relative hover:bg-navy-light group"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] bg-gold rounded-b-sm" />
              <p.icon className="w-9 h-9 text-gold mx-auto mb-4" />
              <h3 className="font-body text-[11px] font-bold tracking-[0.12em] uppercase text-gold mb-3">
                {p.title}
              </h3>
              <p className="text-[13px] text-cream/50 leading-relaxed">{p.text}</p>
            </div>
          ))}
        </div>

        <ButtonGold className="mx-auto">Start My 90-Day Journey ›</ButtonGold>
      </FadeIn>
    </section>
  );
}

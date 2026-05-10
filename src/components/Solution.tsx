import { Swords, BookOpen, Flame, Globe } from "lucide-react";
import { SectionTag, ButtonGold } from "./ui/Buttons";

const pillars = [
  { icon: Swords, title: "Train Like a Soldier", text: "Daily discipline is the hallmark of every true disciple. Build habits that outlast your emotions." },
  { icon: BookOpen, title: "Know Your Word", text: "Master Scripture for real-life situations. Know what to say, when to say it, and why it's true." },
  { icon: Flame, title: "Live It Boldly", text: "Faith without action is dead. Each session comes with real-world application — not just theory." },
  { icon: Globe, title: "Disciple Others", text: "By Day 90, you'll be ready to lead others through the same journey. One life becomes many." },
];

export default function Solution() {
  return (
    <section id="solution" className="bg-[#EDEAE2] py-24 px-8 overflow-hidden">
      <div className="max-w-[1100px] mx-auto text-center" data-aos="fade-up">
        <SectionTag className="border-navy/10 text-navy/60">The Mission</SectionTag>
        <h2 className="font-display text-[2.8rem] font-bold text-navy leading-tight mt-6 mb-6 tracking-tight">
          A Blueprint for the
          <br />
          Modern Ambassador.
        </h2>
        <p className="text-[1.15rem] text-grey max-w-[600px] mx-auto mb-16 leading-[1.8]">
          90 sessions. 30 minutes a day. Everything you need to transition
          from dormant believer to deployed disciple.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {pillars.map((p, i) => (
            <div
              key={i}
              data-aos="fade-up"
              data-aos-delay={i * 100}
              className="bg-white p-10 rounded-lg shadow-sm border border-card-border hover:shadow-md transition-all duration-500 group"
            >
              <div className="w-12 h-12 rounded-full bg-cream flex items-center justify-center mb-6 text-gold group-hover:scale-110 transition-transform">
                <p.icon className="w-6 h-6" />
              </div>
              <h3 className="font-sans text-[11px] font-bold tracking-[0.2em] uppercase text-navy mb-4">
                {p.title}
              </h3>
              <p className="text-[14px] text-grey leading-[1.7] font-medium">{p.text}</p>
            </div>
          ))}
        </div>

        <ButtonGold className="mx-auto h-[56px] px-10 rounded-sm">Start My 90-Day Journey ›</ButtonGold>
      </div>
    </section>
  );
}

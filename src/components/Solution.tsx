import { Swords, BookOpen, Flame, Globe } from "lucide-react";
import { SectionTag, ButtonGold } from "./ui/Buttons";

const pillars = [
  {
    icon: Swords,
    num: "01",
    title: "Train Like a Soldier",
    text: "Daily discipline is the hallmark of every true disciple. Build habits that outlast your emotions.",
  },
  {
    icon: BookOpen,
    num: "02",
    title: "Know Your Word",
    text: "Master Scripture for real-life situations. Know what to say, when to say it, and why it's true.",
  },
  {
    icon: Flame,
    num: "03",
    title: "Live It Boldly",
    text: "Faith without action is dead. Each session comes with real-world application — not just theory.",
  },
  {
    icon: Globe,
    num: "04",
    title: "Disciple Others",
    text: "By Day 90, you'll be ready to lead others through the same journey. One life becomes many.",
  },
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {pillars.map((p, i) => (
            <div
              key={i}
              data-aos="fade-up"
              data-aos-delay={i * 100}
              className="bg-white p-8 rounded-none shadow-sm border border-card-border hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group text-left relative overflow-hidden"
            >
              {/* Step number — large watermark */}
              <div className="absolute -top-2 -right-1 font-display text-[5rem] font-bold text-navy/[0.04] leading-none select-none pointer-events-none">
                {p.num}
              </div>

              {/* Gold top bar on hover */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gold opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Step badge */}
              <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-gold/70 mb-5">
                Step {p.num}
              </div>

              {/* Icon */}
              <div className="w-11 h-11 rounded-full bg-cream flex items-center justify-center mb-5 text-gold group-hover:scale-110 group-hover:bg-gold/10 transition-all duration-300">
                <p.icon className="w-5 h-5" />
              </div>

              {/* Title */}
              <h3 className="font-display text-[1.1rem] font-bold text-navy mb-3 tracking-tight leading-snug">
                {p.title}
              </h3>

              {/* Divider */}
              <div className="w-8 h-[2px] bg-gold/40 mb-4 group-hover:w-14 transition-all duration-500" />

              <p className="text-[14px] text-grey leading-[1.75] font-medium">{p.text}</p>
            </div>
          ))}
        </div>

        <ButtonGold className="mx-auto h-[56px] px-10 rounded-sm">Start My 90-Day Journey ›</ButtonGold>
      </div>
    </section>
  );
}

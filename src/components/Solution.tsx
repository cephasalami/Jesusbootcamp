import { Swords, BookOpen, Flame, Globe } from "lucide-react";
import { SectionTag, ButtonGold } from "./ui/Buttons";
import { JOIN_URL } from "@/config/links";

const pillars = [
  {
    icon: BookOpen,
    num: "01",
    title: "Know the Word",
    text: 'Master Scripture for real-life situations so that you can "give an answer to every man that asketh of thee."',
  },
  {
    icon: Swords,
    num: "02",
    title: "Learn Who You Are in Christ",
    text: "Understand your new identity, your inheritance, and the authority given to you by Christ",
  },
  {
    icon: Flame,
    num: "03",
    title: "Live It Boldly",
    text: 'Faith without action is dead. “Be doers of the Word, and not hearers only.” (James 1:22)',
  },
  {
    icon: Globe,
    num: "04",
    title: "Disciple Others",
    text: 'By Day 90, you\'ll be equipped to lead others through the same journey — one life becomes many. “Teach these truths to trustworthy people who will be able to pass them on.” (2 Timothy 2:2)',
  },
];

export default function Solution() {
  return (
    <section id="pillars" className="bg-cream py-24 px-5 sm:px-8 border-t border-card-border overflow-hidden">
      <div className="max-w-[1100px] mx-auto text-center" data-aos="fade-up">
        <SectionTag className="border-navy/10 text-navy/60">What You&apos;ll Master</SectionTag>
        <h2 className="font-display text-[clamp(2rem,5vw,2.8rem)] font-bold text-navy leading-tight mt-6 mb-16 tracking-tight">
          A Blueprint for the Ambassador of Christ
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {pillars.map((p, i) => (
            <div
              key={i}
              data-aos="fade-up"
              data-aos-delay={i * 100}
              className="bg-white p-8 rounded-none shadow-sm border border-card-border hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group text-left relative overflow-hidden flex flex-col justify-between"
            >
              <div>
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
              </div>

              <p className="text-[14px] text-grey leading-[1.75] font-medium">{p.text}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center">
          <ButtonGold href={JOIN_URL} className="h-[56px] px-10 rounded-sm">Enter Now →</ButtonGold>
        </div>
      </div>
    </section>
  );
}

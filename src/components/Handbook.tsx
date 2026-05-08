import { BookOpen, Church, Link2, Globe } from "lucide-react";
import FadeIn from "./ui/FadeIn";
import { SectionTag, ButtonGold } from "./ui/Buttons";

const pills = [
  { icon: BookOpen, label: "Scripture by topic" },
  { icon: Church, label: "Used in 50+ churches" },
  { icon: Link2, label: "Prison ministry tested" },
  { icon: Globe, label: "Global reach" },
];

export default function Handbook() {
  return (
    <section id="handbook" className="py-28 px-8 bg-white border-t border-card-border">
      <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
        {/* Book Mockup */}
        <FadeIn className="flex justify-center">
          <div className="w-[280px] h-[380px] bg-gradient-to-br from-cream to-cream-dark rounded-r-2xl rounded-l border border-card-border shadow-[-6px_6px_0_0_var(--color-card-border),16px_24px_60px_rgba(10,31,68,0.15)] px-8 py-10 flex flex-col items-center justify-between relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-cream-dark to-cream" />
            <div className="text-center">
              <div className="text-[9px] font-bold tracking-[0.2em] text-gold uppercase mb-4">
                Paul Joseph Ministries
              </div>
              <div className="w-[50px] h-[50px] mx-auto mb-5 relative flex items-center justify-center">
                <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-navy -translate-x-1/2" />
                <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-navy -translate-y-1/2" />
              </div>
              <div className="font-display text-base font-extrabold text-navy text-center leading-snug mb-1">
                Handbook for a Disciple of Jesus
              </div>
              <div className="text-[9px] text-grey uppercase tracking-widest mt-1">
                Scripture. Topic by Topic.
              </div>
            </div>
            <div className="w-full h-[1px] bg-navy/12 my-4" />
            <div className="text-[11px] font-semibold text-gold tracking-[0.06em]">
              Paul Joseph
            </div>
          </div>
        </FadeIn>

        {/* Text */}
        <FadeIn delay={0.15}>
          <SectionTag>Free Resource</SectionTag>
          <h2 className="font-display text-[clamp(1.8rem,3vw,2.4rem)] font-bold text-navy leading-snug mt-5 mb-4">
            Your Pocket Companion for Daily Discipleship
          </h2>
          <p className="text-base text-grey leading-[1.8] mb-8">
            Thousands of Scripture references, categorized by topic — for every situation life throws
            at you. Used in prisons, youth groups, and churches worldwide. Now free for you.
          </p>
          <div className="flex gap-2.5 flex-wrap mb-8">
            {pills.map((pill, i) => (
              <span
                key={i}
                className="bg-cream border border-card-border rounded-full px-4 py-2 text-xs font-medium text-navy flex items-center gap-1.5"
              >
                <pill.icon className="w-3.5 h-3.5 text-gold" />
                {pill.label}
              </span>
            ))}
          </div>
          <ButtonGold href="#lead-magnet">Download Free Handbook ›</ButtonGold>
        </FadeIn>
      </div>
    </section>
  );
}

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
          <div className="relative w-full max-w-[320px] aspect-[3/4] flex justify-center">
            <img
              src="/images/ChatGPT Image May 8, 2026, 03_22_25 PM.png"
              alt="Handbook for a Disciple of Jesus"
              className="w-full h-full object-contain rounded-lg shadow-[16px_24px_60px_rgba(10,31,68,0.15)]"
            />
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

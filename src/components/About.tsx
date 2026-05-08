import { BookOpen, Globe, Cross } from "lucide-react";
import FadeIn from "./ui/FadeIn";
import { SectionTag } from "./ui/Buttons";

const badges = [
  { icon: BookOpen, label: "Published Author" },
  { icon: Globe, label: "Global Ministry Reach" },
  { icon: Cross, label: "Rooted in Scripture" },
];

export default function About() {
  return (
    <section id="about" className="bg-navy py-28 px-8">
      <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-[320px_1fr] gap-20 items-center">
        {/* Portrait */}
        <FadeIn className="text-center">
          <div className="w-[200px] h-[240px] mx-auto bg-gradient-to-br from-[#1a3a7c] to-navy rounded-[50%_50%_50%_50%/40%_40%_60%_60%] border-[3px] border-gold flex items-center justify-center mb-6 shadow-[0_0_0_6px_rgba(201,168,76,0.15)] overflow-hidden">
            {/* Replace with actual Paul Joseph headshot */}
            <img
              src="/images/WhatsApp Image 2026-05-05 at 03.09.32.jpeg"
              alt="Paul Joseph"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="font-display text-[1.1rem] font-bold text-cream mb-1">Paul Joseph</div>
          <div className="text-xs text-gold font-medium">Author &amp; Founder</div>
        </FadeIn>

        {/* Content */}
        <FadeIn delay={0.15}>
          <SectionTag className="border-gold/30 mb-5">About the Founder</SectionTag>
          <p className="text-[1.05rem] text-cream/75 leading-[1.85] mb-8">
            Paul Joseph is the author of{" "}
            <em className="text-gold italic">
              The Discipline of a Disciple — The Cost, Calling, and Power of Authentic Discipleship.
            </em>{" "}
            The Jesus Boot Camp was born from his life&apos;s mission: to see every believer not just
            saved, but sent.
          </p>
          <p className="text-[1.05rem] text-cream/75 leading-[1.85] mb-8">
            After decades of ministry, Paul saw the same pattern everywhere: sincere believers who
            never became disciplined disciples. The Boot Camp is his answer — structured, free, and
            built for the real world.
          </p>
          <div className="flex gap-3 flex-wrap">
            {badges.map((badge, i) => (
              <span
                key={i}
                className="flex items-center gap-2 bg-white/7 border border-white/12 rounded-full px-5 py-2.5 text-[13px] font-semibold text-cream"
              >
                <badge.icon className="w-4 h-4 text-gold" />
                {badge.label}
              </span>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

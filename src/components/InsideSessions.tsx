import Image from "next/image";
import { ArrowRight, BookOpen, Clock, Target, ClipboardCheck, BookMarked, Coffee, Users, Layers } from "lucide-react";
import { SectionTag } from "./ui/Buttons";

const features = [
  { icon: Layers, label: "90 sessions" },
  { icon: Clock, label: "30 minutes a day" },
  { icon: BookOpen, label: "Scripture-anchored" },
  { icon: Target, label: "Daily application" },
  { icon: ClipboardCheck, label: "Simple tests" },
  { icon: BookMarked, label: "Digital Handbook" },
  { icon: Coffee, label: "Study anywhere" },
  { icon: Users, label: "Community" },
];

export default function InsideSessions() {
  return (
    <section id="inside" className="py-24 sm:py-28 px-5 sm:px-8 bg-white border-t border-card-border overflow-hidden">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-14 lg:gap-20 items-center">
        {/* Left: copy + icon grid */}
        <div data-aos="fade-up">
          <SectionTag className="border-navy/10 text-navy/60">Inside Every Session</SectionTag>
          <h2 className="font-display text-[clamp(2rem,5vw,2.8rem)] font-bold text-navy mt-6 mb-4 tracking-tight">
            Built for real life.
          </h2>
          <p className="text-[1.05rem] text-grey leading-[1.8] max-w-[520px] mb-12">
            Every session is Scripture-anchored, mission-focused, and built for
            immediate daily application — no rigid school schedule, no seminary degree required.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-10 mb-12">
            {features.map((f, i) => (
              <div key={i} className="flex flex-col items-start gap-3 group">
                <div className="w-11 h-11 rounded-full bg-cream flex items-center justify-center text-gold group-hover:bg-gold/10 group-hover:scale-110 transition-all duration-300">
                  <f.icon className="w-5 h-5" />
                </div>
                <div className="text-[13px] font-bold text-navy leading-snug">{f.label}</div>
              </div>
            ))}
          </div>

          <a
            href="#preview"
            className="inline-flex items-center gap-2 text-[15px] font-bold text-navy border-b-2 border-gold/40 pb-1 transition-all duration-300 hover:gap-3 hover:border-gold group"
          >
            Explore the sessions
            <ArrowRight className="w-4 h-4 text-gold transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        </div>

        {/* Right: Handbook visual */}
        <div data-aos="fade-up" data-aos-delay="100">
          <div className="bg-cream shadow-inner border border-card-border p-8 sm:p-10 flex items-center justify-center">
            <div className="w-full aspect-[3/4] relative">
              <Image
                src="/images/ChatGPT Image May 13, 2026, 12_47_13 AM.png"
                alt="Handbook for a Disciple of Jesus Book Cover"
                fill
                className="object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.18)]"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </div>
          </div>
          <p className="text-[14px] text-grey leading-[1.7] mt-6 text-center">
            The <strong className="text-navy">Digital Handbook</strong> — over 1,000 of the most
            powerful Scriptures, categorized by life topic. Included with every session.
          </p>
          <div className="text-center mt-3">
            <a href="/handbook" className="text-[14px] font-bold text-gold hover:text-navy transition-colors">
              Download the Handbook ›
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

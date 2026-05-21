import { BookOpen, Church, Link2, Globe } from "lucide-react";
import { SectionTag, ButtonGold } from "./ui/Buttons";

export default function Handbook() {
  return (
    <section id="handbook" className="py-24 px-8 bg-cream-dark">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center" data-aos="fade-up">
        {/* Book Visual */}
        <div className="relative group">
          <div className="relative z-10 transition-transform duration-700 group-hover:-translate-y-4">
            <img
              src="/images/ChatGPT Image May 10, 2026, 02_49_46 PM.png"
              alt="Handbook for a Disciple of Jesus"
              className="w-full max-w-[450px] mx-auto drop-shadow-[0_32px_64px_rgba(0,0,0,0.12)] rounded-lg"
            />
          </div>
          {/* Subtle decoration */}
          <div className="absolute -inset-10 bg-gold/5 rounded-full blur-3xl -z-0" />
        </div>

        {/* Content */}
        <div>
          <SectionTag className="mb-6 border-navy/10 text-navy/60">Essential Resource</SectionTag>
          <h2 className="font-display text-[2.8rem] font-bold text-navy leading-tight mb-6 tracking-tight">
            The Handbook for a
            <br />
            <em className="italic text-gold font-normal">Disciple of Jesus</em>
          </h2>
          <p className="text-[1.1rem] text-grey leading-[1.8] mb-10 max-w-[500px]">
            This isn&apos;t just a book. It&apos;s a tactical field manual. It contains
            thousands of categorized Scriptures for easy references to guide you through every
            situation a disciple faces.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-gold mt-2.5" />
              <div className="text-[14px] font-medium text-navy">Over 2,000 Scripture References</div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-gold mt-2.5" />
              <div className="text-[14px] font-medium text-navy">Practical Life Topics</div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-gold mt-2.5" />
              <div className="text-[14px] font-medium text-navy">Pocket-Sized Guidance</div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-gold mt-2.5" />
              <div className="text-[14px] font-medium text-navy">Free with Every Session</div>
            </div>
          </div>

          <ButtonGold href="#lead-magnet">
            Download the Free Handbook ›
          </ButtonGold>
        </div>
      </div>
    </section>
  );
}

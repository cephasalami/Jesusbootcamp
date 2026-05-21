import { Search, VolumeX, BedDouble } from "lucide-react";
import { SectionTag } from "./ui/Buttons";

const cards = [
  {
    icon: Search,
    title: "Unprepared",
    text: "I don't know which Scriptures to use in real life — I feel unprepared when it matters most.",
  },
  {
    icon: VolumeX,
    title: "Speechless",
    text: "I freeze when someone challenges my faith — I can't explain what I believe or defend it.",
  },
  {
    icon: BedDouble,
    title: "Stagnant",
    text: "My faith feels like a Sunday ritual, not a daily lifestyle — I want more but don't know how to get there.",
  },
];

export default function Problem() {
  return (
    <section id="problem" className="bg-cream border-t border-card-border overflow-hidden">
      {/* Top: Editorial prose block */}
      <div className="py-20 sm:py-28 px-5 sm:px-8">
        <div className="max-w-[1100px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 lg:gap-16 items-start" data-aos="fade-up">
            {/* Left: sticky tag */}
            <div className="pt-2 shrink-0">
              <SectionTag className="border-navy/10 text-navy/60">The Crisis</SectionTag>
            </div>

            {/* Right: three paragraphs */}
            <div className="space-y-6">
              <p className="text-[1.2rem] sm:text-[1.3rem] text-navy/80 leading-[1.85] font-medium">
                There is an undeniable, roaring heart cry echoing across this entire generation — a holy hunger for more that bridges the gap between those inside and outside the Body of Christ.
              </p>
              <p className="text-[1.05rem] text-grey leading-[1.85]">
                While many believers are fiercely desiring to obey Jesus explicitly, and step into their Great Commission authority, seekers and non-believers are feeling a genuine hunger to discover who Christ truly is, why He changed history, and how His truth applies to their lives today.
              </p>
              <p className="text-[1.05rem] text-grey leading-[1.85]">
                This is why the Jesus Boot Camp exists — to meet this global hunger and to equip a powerhouse remnant to carry the fire of the early Church into the 21st century and watch the Book of Acts come alive all over again.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: dark dramatic pain-point band */}
      <div className="bg-[#111111] py-20 px-5 sm:px-8">
        <div className="max-w-[1100px] mx-auto">
          {/* Pull-quote */}
          <p
            className="font-display text-[clamp(1.6rem,4vw,2.4rem)] font-bold text-white/90 leading-[1.3] max-w-[820px] mb-16 tracking-tight"
            data-aos="fade-up"
          >
            "Most believers know <em className="italic font-normal text-gold">about</em> Jesus.
            <br className="hidden sm:block" /> Very few know how to{" "}
            <em className="italic font-normal text-gold">follow</em> Him."
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cards.map((card, i) => (
              <div
                key={i}
                data-aos="fade-up"
                data-aos-delay={i * 100}
                className="border border-white/10 p-8 relative overflow-hidden transition-all duration-500 hover:border-gold/40 hover:bg-white/5 group"
              >
                {/* Gold top accent on hover */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gold scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />

                {/* Icon */}
                <div className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-gold/70 group-hover:text-gold group-hover:border-gold/30 transition-all duration-300">
                  <card.icon className="w-5 h-5" />
                </div>

                <h4 className="font-display text-[1.2rem] font-bold !text-white mb-3 tracking-tight">
                  {card.title}
                </h4>

                <div className="w-6 h-[1.5px] bg-gold/30 mb-4 group-hover:w-12 transition-all duration-500" />

                <p className="text-[14px] !text-white/60 leading-[1.8] italic group-hover:!text-white/90 transition-colors duration-300">
                  &ldquo;{card.text}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

import { Search, VolumeX, BedDouble } from "lucide-react";
import { SectionTag } from "./ui/Buttons";

const cards = [
  {
    icon: Search,
    title: "Unprepared",
    text: '"I don\'t know which Scriptures to use in real life — I feel unprepared when it matters most."',
  },
  {
    icon: VolumeX,
    title: "Speechless",
    text: '"I freeze when someone challenges my faith — I can\'t explain what I believe or defend it."',
  },
  {
    icon: BedDouble,
    title: "Stagnant",
    text: '"My faith feels like a Sunday ritual, not a daily lifestyle — I want more but don\'t know how to get there."',
  },
];

export default function Problem() {
  return (
    <section id="problem" className="py-16 sm:py-24 px-5 sm:px-8 bg-cream border-t border-card-border overflow-hidden">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-16" data-aos="fade-up">
          <SectionTag className="border-navy/10 text-navy/60">The Crisis</SectionTag>
          <h2 className="font-display text-[clamp(1.8rem,5vw,2.8rem)] font-bold text-navy leading-tight mt-6 mb-6 tracking-tight">
            &quot;Most believers attend church.
            <br />
            Few actually follow Christ.&quot;
          </h2>
          <p className="text-[1.15rem] text-grey max-w-[680px] mx-auto leading-[1.8]">
            You know the stories. You&apos;ve sat in the pews. But when life demands a defense
            of your hope, or when the mission calls for action — you freeze.
            You were never trained for the front lines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((card, i) => (
            <div
              key={i}
              data-aos="fade-up"
              data-aos-delay={i * 100}
              className="bg-white rounded-lg border border-card-border p-10 transition-all duration-500 hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gold opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 rounded-full bg-warm flex items-center justify-center mb-6 text-navy">
                <card.icon className="w-6 h-6" />
              </div>
              <h4 className="font-display text-[1.4rem] font-bold text-navy mb-4 tracking-tight">{card.title}</h4>
              <p className="text-[1rem] text-grey leading-[1.7] italic font-medium opacity-80 group-hover:opacity-100 transition-opacity">&ldquo;{card.text.replace(/"/g, '')}&rdquo;</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

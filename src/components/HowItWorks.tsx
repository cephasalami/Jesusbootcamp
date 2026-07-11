import { ArrowUpRight, Check } from "lucide-react";
import { SectionTag } from "./ui/Buttons";

const floatLessons: { title: string }[] = [
  { title: "Month 1 — Sessions 1–30" },
  { title: "Month 2 — Sessions 31–60" },
  { title: "Month 3 — Sessions 61–90" },
];

export default function HowItWorks() {
  return (
    <section id="how" className="py-24 px-8 bg-cream overflow-hidden">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-20" data-aos="fade-up">
          <SectionTag className="border-navy/10 text-navy/60">Process</SectionTag>
          <h2 className="font-display text-[clamp(2rem,5vw,2.8rem)] font-bold text-navy mt-6 mb-4 tracking-tight">
            How It Works
          </h2>
          <p className="text-[1.1rem] text-grey max-w-[600px] mx-auto leading-[1.7]">
            Three simple steps — from your first session to a finished disciple
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Join Boot Camp */}
          <div
            data-aos="fade-up"
            className="bg-white border border-card-border p-6 sm:p-12 flex flex-col relative transition-all duration-500 hover:shadow-xl hover:-translate-y-1 group"
          >
            <div>
              <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-gold/70 mb-3">Step 01</div>
              <div className="flex justify-between items-start">
                <h3 className="font-display text-[clamp(1.5rem,4vw,2.2rem)] font-bold leading-tight text-navy tracking-tight">
                  Start.
                </h3>
                <div className="w-12 h-12 rounded-full border border-card-border flex items-center justify-center shrink-0 transition-all group-hover:bg-gold group-hover:border-gold text-navy">
                  <ArrowUpRight className="w-6 h-6" />
                </div>
              </div>
              <p className="text-[14px] text-grey leading-[1.7] mt-3">
                Begin instantly and take your first 3 sessions.
              </p>
            </div>
          </div>

          {/* Card 2: Learn Daily */}
          <div
            data-aos="fade-up"
            data-aos-delay="100"
            className="bg-white border border-card-border p-6 sm:p-12 flex flex-col relative transition-all duration-500 hover:shadow-xl hover:-translate-y-1 group"
          >
            <div>
              <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-gold/70 mb-3">Step 02</div>
              <div className="flex justify-between items-start">
                <h3 className="font-display text-[clamp(1.5rem,4vw,2.2rem)] font-bold leading-tight text-navy tracking-tight">
                  Take the Test.
                </h3>
                <div className="w-12 h-12 rounded-full border border-card-border flex items-center justify-center shrink-0 transition-all group-hover:bg-gold group-hover:border-gold text-navy">
                  <ArrowUpRight className="w-6 h-6" />
                </div>
              </div>
              <p className="text-[14px] text-grey leading-[1.7] mt-3">
                After Session 3, a short, simple test confirms you&apos;re ready to go deeper.
              </p>
            </div>
          </div>

          {/* Card 3: Apply It */}
          <div
            data-aos="fade-up"
            data-aos-delay="200"
            className="bg-white border border-card-border p-6 sm:p-12 flex flex-col relative transition-all duration-500 hover:shadow-xl hover:-translate-y-1 group"
          >
            <div className="mb-8">
              <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-gold/70 mb-3">Step 03</div>
              <div className="flex justify-between items-start">
                <h3 className="font-display text-[clamp(1.5rem,4vw,2.2rem)] font-bold leading-tight text-navy tracking-tight">
                  Go All In.
                </h3>
                <div className="w-12 h-12 rounded-full border border-card-border flex items-center justify-center shrink-0 transition-all group-hover:bg-gold group-hover:border-gold text-navy">
                  <ArrowUpRight className="w-6 h-6" />
                </div>
              </div>
              <p className="text-[14px] text-grey leading-[1.7] mt-3">
                Complete all 90 sessions across three months.
              </p>
            </div>

            <div className="flex-1 flex flex-col gap-4 justify-center">
              {floatLessons.map((l, i) => (
                <div
                  key={i}
                  className="bg-cream border border-card-border px-6 py-4 flex items-center gap-4 transition-all hover:bg-white hover:shadow-sm"
                >
                  <div className="w-6 h-6 bg-gold rounded-full flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-navy" />
                  </div>
                  <div className="text-[15px] font-bold text-navy leading-tight">{l.title}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

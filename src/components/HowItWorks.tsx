import { ArrowUpRight, Mail, Check, PlayCircle, Clock, Users } from "lucide-react";
import { SectionTag } from "./ui/Buttons";

const floatLessons = [
  { title: "Learn to Apply Scripture in conversations", meta: "Practice · 15 min" },
  { title: "Learn to Share your own testimony this week", meta: "Action Step · 20 min" },
  { title: "Learn to Pray with someone today", meta: "Daily Challenge · 10 min" },
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
            Four clear steps to a lifestyle of discipleship
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Join Boot Camp */}
          <div
            data-aos="fade-up"
            className="bg-white border border-card-border p-6 sm:p-12 min-h-[300px] sm:min-h-[460px] flex flex-col relative transition-all duration-500 hover:shadow-xl hover:-translate-y-1 group"
          >
            <div className="flex justify-between items-start mb-8">
              <h3 className="font-display text-[clamp(1.5rem,4vw,2.2rem)] font-bold leading-tight text-navy tracking-tight">
                Join.
                <br />
                Start Instantly.
              </h3>
              <div className="w-12 h-12 rounded-full border border-card-border flex items-center justify-center shrink-0 transition-all group-hover:bg-gold group-hover:border-gold text-navy">
                <ArrowUpRight className="w-6 h-6" />
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="w-full max-w-[280px] bg-cream p-8 shadow-sm border border-card-border relative rotate-[-2deg] group-hover:rotate-0 transition-transform duration-500">
                <div className="absolute -top-4 -right-4 w-10 h-10 bg-gold rounded-full flex items-center justify-center shadow-lg">
                  <Check className="w-5 h-5 text-navy" />
                </div>
                <div className="w-12 h-12 bg-navy/5 rounded-full mb-6 flex items-center justify-center text-navy/40">
                  <Mail className="w-6 h-6" />
                </div>
                <div className="space-y-3">
                  <div className="h-2 w-full bg-navy/10 rounded-full" />
                  <div className="h-2 w-2/3 bg-navy/5 rounded-full" />
                </div>
                <div className="mt-8 bg-navy text-white text-[12px] font-bold py-3 text-center tracking-widest uppercase">
                  CONFIRM ACCESS
                </div>
              </div>
            </div>
            <p className="text-[14px] text-grey mt-10 font-medium">
              No credit card. No cost. Ever.
            </p>
          </div>

          {/* Card 2: Learn Daily */}
          <div
            data-aos="fade-up"
            data-aos-delay="100"
            className="bg-white border border-card-border p-6 sm:p-12 min-h-[300px] sm:min-h-[460px] flex flex-col relative transition-all duration-500 hover:shadow-xl hover:-translate-y-1 group"
          >
            <div className="flex justify-between items-start mb-8">
              <h3 className="font-display text-[clamp(1.2rem,3vw,1.8rem)] font-bold leading-tight text-navy tracking-tight">
                Supported by voluntary donation. Access is open to all — give what you can.
              </h3>
              <div className="w-12 h-12 rounded-full border border-card-border flex items-center justify-center shrink-0 transition-all group-hover:bg-gold group-hover:border-gold text-navy">
                <ArrowUpRight className="w-6 h-6" />
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center relative w-full py-8">
              {/* Subtle background glow */}
              <div className="absolute w-[200px] h-[200px] bg-gold/5 blur-[50px] rounded-full" />

              <div className="w-full max-w-[300px] bg-[#1A1A1A] rounded-[16px] shadow-[0_20px_50px_rgba(26,26,26,0.15)] relative overflow-hidden rotate-[3deg] group-hover:rotate-0 transition-transform duration-500 border border-[#333] group-hover:shadow-[0_20px_60px_rgba(201,168,76,0.1)]">

                {/* Header Mockup */}
                <div className="px-5 py-4 border-b border-[#333] flex items-center gap-3 bg-[#1A1A1A]">
                  <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-gold" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="h-2 w-20 bg-white/20 rounded-full" />
                    <div className="h-1.5 w-12 bg-white/10 rounded-full" />
                  </div>
                </div>

                {/* Video Mockup */}
                <div className="p-5 bg-gradient-to-b from-[#1A1A1A] to-[#0A0A0A]">
                  <div className="w-full aspect-video bg-black rounded-lg relative overflow-hidden group/video border border-[#333] shadow-inner">
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                      <div className="w-12 h-12 rounded-full bg-gold/90 backdrop-blur-sm flex items-center justify-center text-navy shadow-lg transition-transform duration-300 group-hover:scale-110 cursor-pointer">
                        <PlayCircle className="w-6 h-6 fill-navy text-gold/90" />
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-bold tracking-[0.15em] text-white uppercase drop-shadow-md">Session 01</span>
                        <span className="text-[9px] font-medium text-white/70">12:04 / 30:00</span>
                      </div>
                      <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full w-[40%] bg-gold rounded-full relative">
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <p className="text-[13px] sm:text-[14px] text-grey mt-10 font-medium leading-relaxed">
              Receive an email daily with a class, an audio podcast, a video version, and a PowerPoint presentation should you want to also teach what you learn.
            </p>
          </div>

          {/* Card 3: Apply It */}
          <div
            data-aos="fade-up"
            data-aos-delay="200"
            className="bg-white border border-card-border p-6 sm:p-12 min-h-[300px] sm:min-h-[460px] flex flex-col relative transition-all duration-500 hover:shadow-xl hover:-translate-y-1 group"
          >
            <div className="flex justify-between items-start mb-8">
              <h3 className="font-display text-[clamp(1.5rem,4vw,2.2rem)] font-bold leading-tight text-navy tracking-tight">
                Real Action
                <br />
                Steady Growth.
              </h3>
              <div className="w-12 h-12 rounded-full border border-card-border flex items-center justify-center shrink-0 transition-all group-hover:bg-gold group-hover:border-gold text-navy">
                <ArrowUpRight className="w-6 h-6" />
              </div>
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
                  <div>
                    <div className="text-[15px] font-bold text-navy leading-tight mb-1">{l.title}</div>
                    <div className="text-[11px] text-grey font-medium uppercase tracking-[0.05em]">{l.meta}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

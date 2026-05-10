import { ArrowUpRight, Mail, Check, PlayCircle, Clock, Users } from "lucide-react";
import { SectionTag } from "./ui/Buttons";

const floatLessons = [
  { title: "Apply Scripture in conversations", meta: "Practice · 15 min" },
  { title: "Share your testimony this week", meta: "Action Step · 20 min" },
  { title: "Pray with someone today", meta: "Daily Challenge · 10 min" },
];

export default function HowItWorks() {
  return (
    <section id="how" className="py-24 px-8 bg-cream overflow-hidden">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-20" data-aos="fade-up">
          <SectionTag className="border-navy/10 text-navy/60">Process</SectionTag>
          <h2 className="font-display text-[2.8rem] font-bold text-navy mt-6 mb-4 tracking-tight">
            How It Works
          </h2>
          <p className="text-[1.1rem] text-grey max-w-[500px] mx-auto leading-[1.7]">Four clear steps to transformation. No barriers, just discipline.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: Join Free */}
          <div
            data-aos="fade-up"
            className="bg-white border border-card-border p-12 min-h-[460px] flex flex-col relative transition-all duration-500 hover:shadow-xl hover:-translate-y-1 group"
          >
            <div className="flex justify-between items-start mb-8">
              <h3 className="font-display text-[2.2rem] font-bold leading-tight text-navy tracking-tight">
                Join Free.
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
            className="bg-white border border-card-border p-12 min-h-[460px] flex flex-col relative transition-all duration-500 hover:shadow-xl hover:-translate-y-1 group"
          >
            <div className="flex justify-between items-start mb-8">
              <h3 className="font-display text-[2.2rem] font-bold leading-tight text-navy tracking-tight">
                Daily Sessions.
                <br />
                Thirty Minutes.
              </h3>
              <div className="w-12 h-12 rounded-full border border-card-border flex items-center justify-center shrink-0 transition-all group-hover:bg-gold group-hover:border-gold text-navy">
                <ArrowUpRight className="w-6 h-6" />
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="w-full max-w-[320px] aspect-video bg-navy shadow-2xl relative overflow-hidden rotate-[2deg] group-hover:rotate-0 transition-transform duration-500">
                <div className="absolute inset-0 bg-gradient-to-t from-navy/80 to-transparent z-10" />
                <PlayCircle className="w-14 h-14 text-gold relative z-20 transition-transform group-hover:scale-110 drop-shadow-2xl" />
                <div className="absolute bottom-6 left-6 right-6 z-20">
                  <div className="text-[10px] font-bold tracking-widest text-gold mb-2 uppercase">Session 01</div>
                  <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-gold" />
                  </div>
                </div>
              </div>
            </div>
            <p className="text-[14px] text-grey mt-10 font-medium">
              Delivered daily to your primary inbox.
            </p>
          </div>

          {/* Card 3: Apply It */}
          <div
            data-aos="fade-up"
            data-aos-delay="200"
            className="bg-white border border-card-border p-12 min-h-[460px] flex flex-col relative transition-all duration-500 hover:shadow-xl hover:-translate-y-1 group"
          >
            <div className="flex justify-between items-start mb-8">
              <h3 className="font-display text-[2.2rem] font-bold leading-tight text-navy tracking-tight">
                Real Action.
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

          {/* Card 4: Disciple Others */}
          <div
            data-aos="fade-up"
            data-aos-delay="300"
            className="bg-navy p-12 min-h-[460px] flex flex-col relative transition-all duration-500 hover:shadow-xl hover:-translate-y-1 group"
          >
            <div className="flex justify-between items-start mb-8">
              <h3 className="font-display text-[2.2rem] font-bold leading-tight text-white tracking-tight">
                Ambassador
                <br />
                Activation.
              </h3>
              <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center shrink-0 transition-all group-hover:bg-gold group-hover:border-gold group-hover:text-navy text-white">
                <ArrowUpRight className="w-6 h-6" />
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center relative">
              <div className="w-24 h-24 bg-gold/10 rounded-full animate-ping absolute" />
              <div className="w-24 h-24 bg-gold rounded-full flex items-center justify-center relative z-10 shadow-lg">
                <Users className="w-10 h-10 text-navy" />
              </div>
              {/* Orbital dots */}
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-3 h-3 bg-gold border-2 border-navy rounded-full"
                  style={{
                    transform: `rotate(${i * 72}deg) translate(80px) rotate(-${i * 72}deg)`
                  }}
                />
              ))}
            </div>
            <p className="text-[14px] text-white/50 mt-10 font-medium">
              By Day 90, you are ready to lead others.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

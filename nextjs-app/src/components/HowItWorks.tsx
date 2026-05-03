import { ArrowUpRight, Mail, Check, PlayCircle, Clock, Users, MessageCircle } from "lucide-react";
import FadeIn from "./ui/FadeIn";
import { SectionTag } from "./ui/Buttons";

const floatLessons = [
  { title: "Apply Scripture in conversations", meta: "Practice · 15 min" },
  { title: "Share your testimony this week", meta: "Action Step · 20 min" },
  { title: "Pray with someone today", meta: "Daily Challenge · 10 min" },
];

export default function HowItWorks() {
  return (
    <section id="how" className="py-28 px-8 bg-cream">
      <div className="max-w-[1200px] mx-auto">
        <FadeIn className="text-center mb-16">
          <SectionTag>Process</SectionTag>
          <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-bold text-navy mt-5 mb-2">
            How It Works
          </h2>
          <p className="text-base text-grey">Four simple steps. No barriers. No excuses.</p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Join Free (dark) */}
          <FadeIn className="h-full">
            <div className="bg-navy rounded-[var(--radius-xl)] p-8 h-full min-h-[420px] flex flex-col overflow-hidden relative transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(10,31,68,0.12)] group">
              <div className="flex justify-between items-start mb-6">
                <h3 className="font-display text-[clamp(1.5rem,2.5vw,2rem)] font-bold leading-tight text-cream">
                  Join free &amp;
                  <br />
                  start instantly
                </h3>
                <div className="w-10 h-10 rounded-full border-[1.5px] border-white/20 flex items-center justify-center shrink-0 transition-all group-hover:bg-gold group-hover:border-gold group-hover:text-navy text-cream">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center mt-auto w-full">
                <div className="w-full max-w-[280px] bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl relative mt-8">
                  <div className="absolute -top-4 -right-4 w-10 h-10 bg-gold rounded-full flex items-center justify-center shadow-lg">
                    <Check className="w-5 h-5 text-navy" />
                  </div>
                  <div className="w-3/4 h-2 bg-white/20 rounded-full mb-3" />
                  <div className="w-1/2 h-2 bg-white/10 rounded-full mb-6" />
                  <div className="bg-navy rounded-xl p-1 flex items-center border border-white/10">
                    <div className="flex-1 px-3 py-2 text-xs text-cream/40 flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5" />
                      your@email.com
                    </div>
                    <div className="bg-gold text-navy text-[10px] font-bold px-3 py-2 rounded-lg">
                      Join
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[13px] text-cream/50 mt-4 font-medium">
                No credit card. No cost. Ever.
              </p>
            </div>
          </FadeIn>

          {/* Card 2: Learn Daily (warm) */}
          <FadeIn delay={0.1} className="h-full">
            <div className="bg-warm rounded-[var(--radius-xl)] p-8 h-full min-h-[420px] flex flex-col overflow-hidden relative transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(10,31,68,0.12)] group">
              <div className="flex justify-between items-start mb-6">
                <h3 className="font-display text-[clamp(1.5rem,2.5vw,2rem)] font-bold leading-tight text-navy">
                  Learn daily with
                  <br />
                  30-min sessions
                </h3>
                <div className="w-10 h-10 rounded-full border-[1.5px] border-navy/20 flex items-center justify-center shrink-0 transition-all group-hover:bg-gold group-hover:border-gold text-navy">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center mt-auto w-full">
                <div className="w-full max-w-[300px] aspect-[16/10] bg-navy rounded-2xl shadow-xl relative overflow-hidden group mt-8 flex flex-col items-center justify-center border border-navy/20">
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/90 to-transparent opacity-80 z-10" />
                  <PlayCircle className="w-12 h-12 text-gold relative z-20 transition-transform group-hover:scale-110 drop-shadow-xl rounded-full bg-navy/50" />
                  <div className="absolute bottom-4 left-5 right-5 z-20">
                    <div className="text-[10px] font-bold tracking-widest text-gold mb-1.5 uppercase">Session 01</div>
                    <div className="flex gap-3 items-center">
                      <div className="h-1.5 flex-1 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full w-1/3 bg-gold rounded-full" />
                      </div>
                      <span className="text-[10px] text-cream/80 font-medium">10:00 / 30:00</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[13px] text-navy/60 mt-4 font-medium">
                Delivered to your inbox every morning.
              </p>
            </div>
          </FadeIn>

          {/* Card 3: Apply It (gradient bg) */}
          <FadeIn delay={0.2} className="h-full">
            <div className="bg-gradient-to-br from-navy to-[#1a3a7c] rounded-[var(--radius-xl)] p-8 h-full min-h-[420px] flex flex-col overflow-hidden relative transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(10,31,68,0.12)] group border border-transparent">
              <div className="flex justify-between items-start mb-6 relative z-10">
                <h3 className="font-display text-[clamp(1.5rem,2.5vw,2rem)] font-bold leading-tight text-cream">
                  Make steady
                  <br />
                  progress with real-
                  <br />
                  world application
                </h3>
                <div className="w-10 h-10 rounded-full border-[1.5px] border-white/20 flex items-center justify-center shrink-0 transition-all group-hover:bg-gold group-hover:border-gold group-hover:text-navy text-cream">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
              </div>
              <div className="relative z-10 mt-auto flex flex-col gap-3 pt-6 w-full max-w-[320px] mx-auto">
                <div className="absolute top-8 bottom-4 left-[19px] w-[2px] bg-gold/20" />
                {floatLessons.map((l, i) => (
                  <div
                    key={i}
                    className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-3 border border-white/10 flex items-start gap-3 relative z-10 transition-transform hover:-translate-y-0.5"
                  >
                    <div className="w-[18px] h-[18px] rounded-full bg-gold shrink-0 flex items-center justify-center mt-0.5 shadow-[0_0_0_3px_rgba(201,168,76,0.2)]">
                      <Check className="w-2.5 h-2.5 text-navy" />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-cream mb-0.5">{l.title}</div>
                      <div className="text-[11px] text-cream/60 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" /> {l.meta}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Card 4: Disciple Others (white) */}
          <FadeIn delay={0.3} className="h-full">
            <div className="bg-white border border-card-border rounded-[var(--radius-xl)] p-8 h-full min-h-[420px] flex flex-col overflow-hidden relative transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(10,31,68,0.12)] group">
              <div className="flex justify-between items-start mb-6">
                <h3 className="font-display text-[clamp(1.5rem,2.5vw,2rem)] font-bold leading-tight text-navy">
                  Community and
                  <br />
                  support throughout
                  <br />
                  your journey
                </h3>
                <div className="w-10 h-10 rounded-full border-[1.5px] border-navy/20 flex items-center justify-center shrink-0 transition-all group-hover:bg-gold group-hover:border-gold text-navy">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center mt-auto w-full relative min-h-[260px]">
                {/* Background Concentric Rings */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] border border-dashed border-navy/10 rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140px] h-[140px] border border-dashed border-navy/15 rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80px] h-[80px] bg-gold/10 rounded-full blur-xl pointer-events-none" />

                {/* SVG Connecting Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                  <line x1="50%" y1="50%" x2="28%" y2="28%" stroke="#0a1f44" strokeOpacity="0.1" strokeWidth="1.5" strokeDasharray="4 4" />
                  <line x1="50%" y1="50%" x2="72%" y2="72%" stroke="#0a1f44" strokeOpacity="0.1" strokeWidth="1.5" strokeDasharray="4 4" />
                  <line x1="50%" y1="50%" x2="75%" y2="35%" stroke="#0a1f44" strokeOpacity="0.1" strokeWidth="1.5" strokeDasharray="4 4" />
                </svg>
                
                {/* Center Node */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[64px] h-[64px] rounded-full bg-navy flex items-center justify-center shadow-xl z-20 border-[3px] border-white">
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gold rounded-full border-2 border-white" />
                  <Users className="w-7 h-7 text-gold" />
                </div>

                {/* Orbiting Elements */}
                {/* Node 1: JD */}
                <div className="absolute top-[18%] right-[25%] w-11 h-11 rounded-full bg-warm flex items-center justify-center shadow-md border-[2.5px] border-white animate-bounce z-10" style={{ animationDelay: '0s', animationDuration: '3s' }}>
                  <span className="text-[11px] font-bold text-navy">JD</span>
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                </div>
                
                {/* Node 2: SM */}
                <div className="absolute bottom-[20%] right-[18%] w-[46px] h-[46px] rounded-full bg-gold flex items-center justify-center shadow-md border-[2.5px] border-white animate-bounce z-10" style={{ animationDelay: '0.5s', animationDuration: '2.5s' }}>
                  <span className="text-[12px] font-bold text-navy">SM</span>
                </div>
                
                {/* Node 3: TR */}
                <div className="absolute bottom-[25%] left-[25%] w-9 h-9 rounded-full bg-[#1a3a7c] flex items-center justify-center shadow-md border-2 border-white animate-bounce z-10" style={{ animationDelay: '1s', animationDuration: '3.5s' }}>
                  <span className="text-[10px] font-bold text-cream">TR</span>
                </div>

                {/* Background Small Dots for depth */}
                <div className="absolute top-[40%] left-[10%] w-2 h-2 rounded-full bg-navy/20" />
                <div className="absolute bottom-[30%] right-[10%] w-3 h-3 rounded-full bg-gold/40" />
                <div className="absolute top-[15%] right-[40%] w-2 h-2 rounded-full bg-navy/15" />

                {/* Floating "New Disciple" Badge */}
                <div className="absolute top-[15%] left-[5%] bg-white border border-card-border shadow-lg rounded-[12px] px-2.5 py-1.5 flex items-center gap-2 animate-bounce z-30" style={{ animationDelay: '0.8s', animationDuration: '4s' }}>
                  <div className="w-5 h-5 rounded-full bg-warm flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-navy" />
                  </div>
                  <div>
                    <div className="text-[8px] font-bold text-navy uppercase tracking-wider leading-tight">New Disciple</div>
                    <div className="text-[9px] text-grey leading-tight">Sarah joined</div>
                  </div>
                </div>

                {/* Disciples Count Badge */}
                <div className="absolute bottom-[10%] left-[8%] bg-white border border-card-border shadow-xl rounded-xl px-3 py-2 flex items-center gap-2 animate-bounce z-20" style={{ animationDelay: '1.5s', animationDuration: '3.2s' }}>
                  <div className="bg-navy/5 p-1.5 rounded-lg">
                    <MessageCircle className="w-3.5 h-3.5 text-gold" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-navy leading-none mb-0.5">5 Disciples</div>
                    <div className="text-[8.5px] text-grey leading-none">Active this week</div>
                  </div>
                </div>
              </div>
              <p className="text-[13px] text-grey mt-4 font-medium">
                By Day 90, disciple 5 others. Reach millions.
              </p>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

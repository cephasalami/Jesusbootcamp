import { Lock, Unlock, Coffee, Monitor, Home, Smartphone, Mail } from "lucide-react";
import FadeIn from "./ui/FadeIn";
import { SectionTag, ButtonGold } from "./ui/Buttons";

const sessions = [
  { num: "S01", title: "What It Truly Means to Be Born Again", locked: false },
  { num: "S02", title: "Who You Are in Christ", locked: true },
  { num: "S14", title: "The Power of God's Word", locked: true },
  { num: "S27", title: "Sharing Your Faith Is Mandatory", locked: true },
  { num: "S45", title: "The Authority of the Believer", locked: true },
  { num: "S90", title: "Your Commission — Go and Disciple", locked: true },
];

const studyLocations = [
  { icon: Coffee, label: "Coffee Shop" },
  { icon: Monitor, label: "Zoom Group" },
  { icon: Home, label: "Living Room" },
  { icon: Smartphone, label: "Commute" },
];

const visionSteps = [
  { num: "1", label: "That's you. Starting today." },
  { num: "5", label: "You disciple five people" },
  { num: "25", label: "Each disciples five more" },
  { num: "125", label: "The movement grows" },
  { num: "625", label: "One city transformed" },
];

export default function BentoFeatures() {
  return (
    <section id="bento" className="py-28 px-8 bg-cream">
      <div className="max-w-[1200px] mx-auto">
        <FadeIn className="text-center mb-16">
          <SectionTag>Features</SectionTag>
          <h2 className="font-display text-[clamp(2rem,4.5vw,3.2rem)] font-bold text-navy leading-tight mt-5 mb-2">
            Everything You Need.
            <br />
            Nothing You Don&apos;t.
          </h2>
          <p className="text-[1.05rem] text-grey">Built for real life, not a classroom — all free, forever.</p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: 90 Sessions (spans 2) */}
          <FadeIn className="md:col-span-2">
            <div className="bg-white rounded-[var(--radius-xl)] border border-card-border p-9 transition-all hover:shadow-[0_16px_48px_rgba(10,31,68,0.09)] hover:-translate-y-1">
              <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-gold mb-2">Full Curriculum</div>
              <h3 className="font-display text-[1.35rem] font-bold text-navy mb-2">90 Dynamic Sessions</h3>
              <p className="text-[13.5px] text-grey leading-relaxed">Every session is video-taught, Scripture-anchored, and built for real-life application.</p>
              <div className="mt-4">
                {sessions.map((s, i) => (
                  <div key={i} className="flex items-center gap-2.5 py-2.5 border-b border-card-border last:border-b-0 text-[13px] text-grey">
                    <span className="text-[11px] font-bold text-gold min-w-[28px]">{s.num}</span>
                    <span className="flex-1">{s.title}</span>
                    {s.locked ? <Lock className="w-3.5 h-3.5 opacity-50" /> : <Unlock className="w-3.5 h-3.5 text-gold" />}
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Card 2: Free Handbook */}
          <FadeIn delay={0.1}>
            <div className="bg-cream-dark rounded-[var(--radius-xl)] border border-card-border p-9 transition-all hover:shadow-[0_16px_48px_rgba(10,31,68,0.09)] hover:-translate-y-1">
              <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-navy/50 mb-2">Free Resource</div>
              <div className="w-full h-[150px] bg-gradient-to-br from-navy to-[#1a3a7c] rounded-2xl mb-4 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-6 h-6 mx-auto mb-2 relative">
                    <div className="absolute left-1/2 top-0 bottom-0 w-[1.5px] bg-gold/60 -translate-x-1/2" />
                    <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-gold/60 -translate-y-1/2" />
                  </div>
                  <div className="font-display text-[10px] font-bold text-gold/80 uppercase tracking-widest leading-snug">
                    Handbook<br />for a Disciple<br />of Jesus
                  </div>
                </div>
              </div>
              <h3 className="font-display text-[1.35rem] font-bold text-navy mb-2">Free Handbook</h3>
              <p className="text-[13.5px] text-grey leading-relaxed">Thousands of Scripture references, categorized by life topic. Your daily pocket guide.</p>
              <div className="mt-4">
                <ButtonGold href="#handbook" className="!text-[13px] !px-5 !py-2.5">Download Free ›</ButtonGold>
              </div>
            </div>
          </FadeIn>

          {/* Card 3: Study Anywhere */}
          <FadeIn delay={0.15}>
            <div className="bg-white rounded-[var(--radius-xl)] border border-card-border p-9 transition-all hover:shadow-[0_16px_48px_rgba(10,31,68,0.09)] hover:-translate-y-1">
              <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-gold mb-2">Flexible Format</div>
              <h3 className="font-display text-[1.35rem] font-bold text-navy mb-2">Study Anywhere</h3>
              <p className="text-[13.5px] text-grey leading-relaxed">No rigid schedule. Learn where life happens.</p>
              <div className="flex flex-col gap-2 mt-4">
                {studyLocations.map((loc, i) => (
                  <div key={i} className="flex items-center gap-2.5 bg-cream rounded-[10px] px-4 py-2.5 text-[13px] text-navy font-medium">
                    <loc.icon className="w-[18px] h-[18px] text-gold" />
                    {loc.label}
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Card 4: Vision (dark, tall) */}
          <FadeIn delay={0.2} className="md:row-span-2">
            <div className="bg-navy rounded-[var(--radius-xl)] border border-transparent p-9 transition-all hover:shadow-[0_16px_48px_rgba(10,31,68,0.09)] hover:-translate-y-1 h-full">
              <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-cream/50 mb-2">The Vision</div>
              <h3 className="font-display text-[1.35rem] font-bold text-cream mb-2">The Give Me Five Vision</h3>
              <p className="text-[13.5px] text-cream/55 leading-relaxed mb-5">You disciple 5. They disciple 5. Watch what happens.</p>
              <div className="flex flex-col">
                {visionSteps.map((step, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-gold/15 border-[1.5px] border-gold flex items-center justify-center text-xs font-bold text-gold shrink-0 z-[1]">
                        {step.num}
                      </div>
                      <div className="text-[13px] text-cream font-medium">{step.label}</div>
                    </div>
                    {i < visionSteps.length - 1 && (
                      <div className="w-[1px] h-[18px] bg-gold/30 ml-[18px]" />
                    )}
                  </div>
                ))}
                <div className="bg-gold rounded-full px-4 py-1.5 text-xs font-bold text-navy mt-3 inline-block w-fit">
                  → 2,000,000+ reached
                </div>
              </div>
              <p className="text-[11px] mt-5 text-cream/50">All because you discipled five.</p>
            </div>
          </FadeIn>

          {/* Card 5: Daily Email */}
          <FadeIn delay={0.25}>
            <div className="bg-white rounded-[var(--radius-xl)] border border-card-border p-9 transition-all hover:shadow-[0_16px_48px_rgba(10,31,68,0.09)] hover:-translate-y-1">
              <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-gold mb-2">Delivery</div>
              <div className="w-14 h-14 bg-gold/12 rounded-[14px] flex items-center justify-center mb-4">
                <Mail className="w-7 h-7 text-gold" />
              </div>
              <h3 className="font-display text-[1.35rem] font-bold text-navy mb-2">Daily Email Delivery</h3>
              <p className="text-[13.5px] text-grey leading-relaxed">One session a day, delivered to your inbox. No app to download. No platform to log in to.</p>
              <div className="flex items-baseline gap-1.5 mt-3">
                <span className="font-display text-3xl font-extrabold text-navy">1</span>
                <span className="text-[13px] text-grey">session per day · 30 min each</span>
              </div>
            </div>
          </FadeIn>

          {/* Card 6: Free Forever (gold) */}
          <FadeIn delay={0.3}>
            <div className="bg-gradient-to-br from-gold to-gold-light rounded-[var(--radius-xl)] border border-transparent p-9 transition-all hover:shadow-[0_16px_48px_rgba(10,31,68,0.09)] hover:-translate-y-1">
              <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-navy/50 mb-2">Pricing</div>
              <h3 className="font-display text-[1.35rem] font-bold text-navy mb-2">Free Forever</h3>
              <div className="font-display text-7xl font-extrabold text-navy leading-none my-3">$0</div>
              <div className="text-[13px] text-navy/65">The only cost is your commitment.</div>
              <p className="mt-3 text-xs text-navy/70">No hidden fees. No premium tier. No upsell. This is a ministry, not a product.</p>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

import { Lock, Unlock, Mail, Coffee, Monitor, Home, Smartphone } from "lucide-react";
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
    <section id="bento" className="py-24 px-8 bg-cream overflow-hidden">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-16" data-aos="fade-up">
          <SectionTag className="border-navy/10 text-navy/60">Features</SectionTag>
          <h2 className="font-display text-[clamp(2rem,5vw,2.8rem)] font-bold text-navy leading-tight mt-6 mb-4 tracking-tight">
            Everything You Need.
            <br />
            Nothing You Don&apos;t.
          </h2>
          <p className="text-[1.1rem] text-grey max-w-[500px] mx-auto leading-[1.7]">Built for the battlefield of real life, not a comfortable classroom.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: 90 Sessions */}
          <div
            data-aos="fade-up"
            className="md:col-span-2 bg-white border border-card-border p-6 sm:p-12 transition-all duration-500 hover:shadow-xl hover:-translate-y-1 relative group"
          >
            <div className="absolute top-0 right-0 p-8">
              <div className="w-14 h-14 bg-warm rounded-full flex items-center justify-center text-navy font-bold text-sm">90</div>
            </div>
            <div className="text-[11px] font-bold tracking-[0.2em] uppercase text-gold mb-4">Curriculum</div>
            <h3 className="font-display text-[clamp(1.6rem,4vw,2.2rem)] font-bold text-navy mb-4 tracking-tight">Dynamic Sessions</h3>
            <p className="text-[1rem] text-grey leading-[1.8] max-w-[450px] mb-10">Every session is Scripture-anchored, mission-focused, and built for immediate daily application.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
              {sessions.map((s, i) => (
                <div key={i} className="flex items-center gap-4 py-3 border-b border-card-border last:border-b-0 group/item">
                  <span className="text-[12px] font-bold text-gold group-hover/item:scale-110 transition-transform">{s.num}</span>
                  <span className="text-[14px] text-navy font-medium flex-1">{s.title}</span>
                  {s.locked ? <Lock className="w-3.5 h-3.5 text-grey/30" /> : <Unlock className="w-3.5 h-3.5 text-gold" />}
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Free Handbook */}
          <div
            data-aos="fade-up"
            data-aos-delay="100"
            className="bg-white border border-card-border p-6 sm:p-12 transition-all duration-500 hover:shadow-xl hover:-translate-y-1 group"
          >
            <div className="text-[11px] font-bold tracking-[0.2em] uppercase text-navy/40 mb-6">Resource</div>
            <div className="w-full aspect-[3/4] bg-cream shadow-inner border border-card-border relative overflow-hidden mb-8 flex items-center justify-center p-8 group-hover:rotate-[-2deg] transition-transform duration-500">
              <div className="w-full h-full border border-navy/5 flex flex-col items-center justify-center text-center">
                <div className="font-display text-[14px] font-bold text-navy/80 uppercase tracking-widest leading-relaxed">
                  Handbook<br />For A<br />Disciple
                </div>
                <div className="w-6 h-[1px] bg-gold my-4" />
                <div className="text-[14px] font-serif italic text-navy/40">Premium PDF</div>
              </div>
            </div>
            <h3 className="font-display text-[1.4rem] font-bold text-navy mb-4 tracking-tight">Digital Handbook</h3>
            <p className="text-[14px] text-grey leading-[1.7] mb-8">Thousands of Scripture references categorized by life topic. Your active pocket guide.</p>
            <ButtonGold href="/handbook" className="w-full !text-[13px] rounded-none !py-4">Download Free ›</ButtonGold>
          </div>

          {/* Card 3: Study Anywhere */}
          <div
            data-aos="fade-up"
            className="bg-white border border-card-border p-6 sm:p-12 transition-all duration-500 hover:shadow-xl hover:-translate-y-1 group"
          >
            <div className="text-[11px] font-bold tracking-[0.2em] uppercase text-gold mb-6">Format</div>
            <h3 className="font-display text-[1.4rem] font-bold text-navy mb-4 tracking-tight">Study Anywhere</h3>
            <p className="text-[14px] text-grey leading-[1.7] mb-10">No rigid school schedule. Learn where your life actually happens.</p>
            <div className="space-y-3">
              {studyLocations.map((loc, i) => (
                <div key={i} className="flex items-center gap-4 bg-cream p-4 hover:bg-white hover:border-gold border border-transparent transition-all">
                  <loc.icon className="w-5 h-5 text-gold" />
                  <span className="text-[14px] font-bold text-navy uppercase tracking-wider">{loc.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 4: Give Me Five Vision */}
          <div
            data-aos="fade-up"
            data-aos-delay="100"
            className="md:col-span-2 bg-[#F9F4E8] p-6 sm:p-12 transition-all duration-500 hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/40 blur-3xl rounded-full" />
            <div className="text-[11px] font-bold tracking-[0.2em] uppercase text-gold mb-6 relative z-10">The Vision</div>
            <h3 className="font-display text-[clamp(1.6rem,4vw,2.2rem)] font-bold text-navy mb-6 tracking-tight relative z-10">The Give Me Five Vision</h3>
            <div className="flex flex-col md:flex-row gap-12 items-start relative z-10">
              <div className="flex-1 max-w-[420px]">
                <p className="text-[1.1rem] text-navy font-bold leading-[1.8] mb-4">
                  Authentication is multiplication. You disciple 5, who disciple 5, who disciple 5.
                </p>
                <p className="text-[1rem] text-grey leading-[1.8] mb-6">
                  We aren't building a passive audience. We are equipping an active movement. The model is simple and exponential—rooted in deep, face-to-face relationships rather than mass media. It's the exact blueprint Jesus used to change the world, starting with just a few dedicated men.
                </p>
                <p className="text-[1rem] text-navy font-semibold italic leading-[1.8]">
                  Are you ready to take your five?
                </p>
              </div>
              <div className="flex-1 space-y-5 w-full bg-white/50 p-8 border border-white/60 shadow-sm rounded-sm">
                {visionSteps.map((step, i) => (
                  <div key={i} className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-full bg-white border border-gold/30 flex shrink-0 items-center justify-center text-[13px] font-bold text-navy shadow-[0_4px_10px_rgba(0,0,0,0.03)]">
                      {step.num}
                    </div>
                    <div className="text-[14px] text-navy font-bold leading-tight">{step.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-12 inline-flex relative z-10 bg-navy text-white px-8 py-4 font-bold text-[14px] uppercase tracking-widest shadow-lg hover:bg-gold hover:text-navy transition-colors duration-300">
              → 2,000,000+ Reached
            </div>
          </div>

          {/* Card 5: Daily Email */}
          <div
            data-aos="fade-up"
            className="bg-white border border-card-border p-6 sm:p-12 transition-all duration-500 hover:shadow-xl hover:-translate-y-1 group"
          >
            <div className="text-[11px] font-bold tracking-[0.2em] uppercase text-gold mb-8">Delivery</div>
            <div className="w-16 h-16 bg-cream flex items-center justify-center mb-6 text-gold group-hover:scale-110 transition-transform">
              <Mail className="w-8 h-8" />
            </div>
            <h3 className="font-display text-[1.4rem] font-bold text-navy mb-4 tracking-tight">Daily Email</h3>
            <p className="text-[14px] text-grey leading-[1.7]">One session a day. Zero apps to download. Pure focus delivered to your inbox.</p>
          </div>

          {/* Card 6: Free Access */}
          <div
            data-aos="fade-up"
            data-aos-delay="100"
            className="md:col-span-2 bg-warm p-6 sm:p-12 transition-all duration-500 hover:shadow-xl hover:-translate-y-1 group flex flex-col md:flex-row items-center justify-between gap-12"
          >
            <div className="max-w-[400px]">
              <div className="text-[11px] font-bold tracking-[0.2em] uppercase text-navy/40 mb-6">Investment</div>
              <h3 className="font-display text-[clamp(1.6rem,4vw,2.2rem)] font-bold text-navy mb-4 tracking-tight">Free. Forever.</h3>
              <p className="text-[1rem] text-grey leading-[1.8]">No subscriptions. No tiers. No upsells. This is a ministry, not a software company.</p>
            </div>
            <div className="text-center">
              <div className="font-display text-[10rem] font-bold text-navy leading-none select-none opacity-10">$0</div>
              <div className="text-[15px] font-bold text-navy tracking-widest uppercase mt-[-2rem] relative z-10">Total Cost</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

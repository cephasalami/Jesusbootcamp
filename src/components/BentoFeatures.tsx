import { Lock, Unlock, Mail, Coffee, Monitor, Home, Smartphone } from "lucide-react";
import { SectionTag, ButtonGold } from "./ui/Buttons";
import Image from "next/image";

const sessions = [
  { num: "01", title: "What It Truly Means to Be Born Again", locked: false },
  { num: "02", title: "Who You Are in Christ", locked: true },
  { num: "14", title: "The Power of God's Word", locked: true },
  { num: "27", title: "How to share your faith", locked: true },
  { num: "45", title: "The Authority of the Believer", locked: true },
  { num: "90", title: "Your Commission — Go and Disciple", locked: true },
];

const studyLocations = [
  { icon: Coffee, label: "Coffee Shop" },
  { icon: Monitor, label: "Zoom Group" },
  { icon: Home, label: "Living Room" },
  { icon: Smartphone, label: "Commute" },
];

export default function BentoFeatures() {
  return (
    <section id="bento" className="py-16 px-8 bg-cream overflow-hidden">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Curriculum */}
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
            <div className="w-full aspect-[3/4] bg-cream shadow-inner border border-card-border relative overflow-hidden mb-8 flex items-center justify-center p-6 group-hover:rotate-[-2deg] transition-transform duration-500">
              <div className="w-full h-full relative">
                <Image
                  src="/images/ChatGPT Image May 13, 2026, 12_47_13 AM.png"
                  alt="Handbook for a Disciple of Jesus Book Cover"
                  fill
                  className="object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.18)]"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
            </div>
            <h3 className="font-display text-[1.4rem] font-bold text-navy mb-4 tracking-tight">Digital Handbook</h3>
            <p className="text-[14px] text-grey leading-[1.7] mb-8">Over 1,000 of the most powerful Scriptures, categorized by life topic. Your active pocket guide.</p>
            <ButtonGold href="/handbook" className="w-full !text-[13px] rounded-none !py-4">Download Free</ButtonGold>
          </div>

          {/* Card 3: Study Anywhere */}
          <div
            data-aos="fade-up"
            className="bg-white border border-card-border p-6 sm:p-12 transition-all duration-500 hover:shadow-xl hover:-translate-y-1 group"
          >
            <div className="text-[11px] font-bold tracking-[0.2em] uppercase text-gold mb-6">Class Format</div>
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
            <div className="text-[11px] font-bold tracking-[0.2em] uppercase text-gold mb-6 relative z-10">A Possible Outcome</div>
            <h3 className="font-display text-[clamp(1.6rem,4vw,2.2rem)] font-bold text-navy mb-6 tracking-tight relative z-10">The “Give Me Five” Vision</h3>
            <div className="relative z-10">
              <p className="text-[1.05rem] text-navy leading-[1.8] mb-6">
                What if each one of us, after 90 days, was to “disciple” only five people, using the same course? And what if those five turned around and discipled five more, who in turn did the exact same thing? Once you take that equation down to the 10th level, you will be responsible for over two million disciples coming into heaven and bringing so many more souls with them.
              </p>
              <p className="text-[1.05rem] text-navy leading-[1.8]">
                The model is simple and exponential. It&apos;s the exact blueprint Jesus used to change the world, starting with just a few dedicated men.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

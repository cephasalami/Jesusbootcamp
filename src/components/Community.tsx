import { BookOpen, MessageCircle, Users, ArrowRight } from "lucide-react";
import { SectionTag, ButtonGold } from "./ui/Buttons";
import { JOIN_URL } from "@/config/links";

// Forward-looking vision of the transformation the Boot Camp is built to produce —
// not customer reviews.
const outcomes = [
  {
    icon: BookOpen,
    label: "Rooted in Scripture",
    text: "Know the Word well enough to give an answer in the real moments of life — no more freezing when your faith is challenged.",
  },
  {
    icon: MessageCircle,
    label: "Bold in Witness",
    text: "Move from silence to confidence — sharing the Gospel and your own story as naturally as an everyday conversation.",
  },
  {
    icon: Users,
    label: "Multiplying Disciples",
    text: "Disciple others who go on to disciple others — watching the Great Commission come alive through your own life.",
  },
];

export default function Community() {
  return (
    <section id="testimonials" className="py-24 sm:py-28 px-5 sm:px-8 bg-cream border-t border-card-border overflow-hidden">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-14 lg:gap-20 items-start">
        {/* Left: heading + CTA */}
        <div className="lg:sticky lg:top-32" data-aos="fade-up">
          <SectionTag className="border-navy/10 text-navy/60">The Community</SectionTag>
          <h2 className="font-display text-[clamp(2rem,5vw,2.8rem)] font-bold text-navy mt-6 mb-6 tracking-tight leading-tight">
            A shared way of
            <br />
            discipleship.
          </h2>
          <p className="text-[1.05rem] text-grey leading-[1.8] max-w-[440px] mb-10">
            Discipleship is meant to bear fruit — and it was never meant to be walked
            alone. Train alongside disciples on the same journey, and become the kind
            of believer the Boot Camp is built to produce.
          </p>
          <ButtonGold href={JOIN_URL}>
            Join the Community
            <ArrowRight className="w-4 h-4" />
          </ButtonGold>
        </div>

        {/* Right: outcome cards */}
        <div className="flex flex-col gap-6">
          {outcomes.map((o, i) => (
            <div
              key={i}
              data-aos="fade-up"
              data-aos-delay={i * 100}
              className="rounded-lg border p-8 sm:p-10 transition-all duration-500 hover:shadow-xl hover:-translate-y-1 bg-white border-card-border group flex items-start gap-6"
            >
              <div className="w-12 h-12 rounded-full bg-cream flex items-center justify-center text-gold group-hover:bg-gold/10 group-hover:scale-110 transition-all duration-300 shrink-0">
                <o.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-[1.25rem] font-bold text-navy mb-2 tracking-tight">
                  {o.label}
                </h3>
                <div className="w-8 h-[2px] bg-gold/40 mb-4 group-hover:w-14 transition-all duration-500" />
                <p className="text-[15px] text-grey leading-[1.8]">{o.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

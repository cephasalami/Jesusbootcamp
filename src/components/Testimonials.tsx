import { BookOpen, MessageCircle, Users } from "lucide-react";
import { SectionTag } from "./ui/Buttons";

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

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-16 sm:py-24 px-5 sm:px-8 bg-cream border-t border-card-border">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-16" data-aos="fade-up">
          <SectionTag className="border-navy/10 text-navy/60">The Transformation</SectionTag>
          <h2 className="font-display text-[clamp(1.8rem,5vw,2.8rem)] font-bold text-navy mt-6 tracking-tight leading-tight">
            The Disciple You Were
            <br />
            Made to Become.
          </h2>
          <p className="text-[1.05rem] text-grey max-w-[560px] mx-auto mt-6 leading-[1.8]">
            Discipleship is meant to bear fruit. Here is the kind of transformation
            the Boot Camp is built to produce in you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {outcomes.map((o, i) => (
            <div
              key={i}
              data-aos="fade-up"
              data-aos-delay={i * 100}
              className="rounded-lg border p-10 transition-all duration-500 hover:shadow-xl hover:-translate-y-1 flex flex-col h-full bg-white border-card-border group"
            >
              <div className="w-12 h-12 rounded-full bg-cream flex items-center justify-center mb-6 text-gold group-hover:bg-gold/10 group-hover:scale-110 transition-all duration-300">
                <o.icon className="w-5 h-5" />
              </div>
              <h3 className="font-display text-[1.25rem] font-bold text-navy mb-3 tracking-tight">
                {o.label}
              </h3>
              <div className="w-8 h-[2px] bg-gold/40 mb-5 group-hover:w-14 transition-all duration-500" />
              <p className="text-[15px] text-grey leading-[1.8] flex-1">
                {o.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

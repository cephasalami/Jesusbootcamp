import { Star } from "lucide-react";
import { SectionTag } from "./ui/Buttons";

const testimonials = [
  {
    quote: "I've been a Christian for 20 years, but I never felt like a disciple. This Boot Camp changed everything. I now know Scripture, I can defend my faith, and I'm discipling three people in my church.",
    name: "Sarah M.",
    role: "Stay-at-home mom · Texas",
    initials: "SM",
    featured: true,
    avatarBg: "bg-navy",
  },
  {
    quote: "I went from freezing when my coworkers challenged my faith to confidently sharing the Gospel every week. Paul's teaching is clear, practical, and rooted in Scripture.",
    name: "James K.",
    role: "Engineer · Ohio",
    initials: "JK",
    featured: false,
    avatarBg: "bg-[#1a3a7c]",
  },
  {
    quote: 'The Give Me Five vision broke something open in me. I\'ve now led 7 people through the Boot Camp. Two of them are discipling others. I\'m watching Matthew 28 happen in real time.',
    name: "Emily R.",
    role: "Youth leader · Georgia",
    initials: "ER",
    featured: false,
    avatarBg: "bg-gold",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-16 sm:py-24 px-5 sm:px-8 bg-cream border-t border-card-border">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-16" data-aos="fade-up">
          <SectionTag className="border-navy/10 text-navy/60">Testimonials</SectionTag>
          <h2 className="font-display text-[clamp(1.8rem,5vw,2.8rem)] font-bold text-navy mt-6 tracking-tight leading-tight">
            Lives Transformed by
            <br />
            Authentic Discipleship.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div
              key={i}
              data-aos="fade-up"
              data-aos-delay={i * 100}
              className={`rounded-lg border p-10 transition-all duration-500 hover:shadow-xl hover:-translate-y-1 flex flex-col h-full bg-white border-card-border`}
            >
              <div className="text-gold flex gap-1 mb-6">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-gold" />
                ))}
              </div>
              <p className="font-display text-[1.1rem] text-navy italic leading-[1.8] mb-8 flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-4 border-t border-card-border pt-6">
                <div className="w-12 h-12 rounded-full bg-warm flex items-center justify-center text-sm font-bold text-navy border-2 border-white shadow-sm font-sans">
                  {t.initials}
                </div>
                <div>
                  <div className="text-[15px] font-bold text-navy font-sans uppercase tracking-wider">
                    {t.name}
                  </div>
                  <div className="text-xs text-grey font-medium tracking-tight">
                    {t.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

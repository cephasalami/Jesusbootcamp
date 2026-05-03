import { Star } from "lucide-react";
import FadeIn from "./ui/FadeIn";
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
    <section id="testimonials" className="py-28 px-8 bg-cream border-t border-card-border">
      <div className="max-w-[1100px] mx-auto">
        <FadeIn className="text-center mb-16">
          <SectionTag>Testimonials</SectionTag>
          <h2 className="font-display text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold text-navy mt-5">
            What Happens When You
            <br />
            Actually Do the Word
          </h2>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <FadeIn
              key={i}
              delay={i * 0.1}
              className={t.featured ? "md:col-span-2" : ""}
            >
              <div
                className={`rounded-[var(--radius-xl)] border p-8 transition-all hover:shadow-[0_12px_40px_rgba(10,31,68,0.08)] hover:-translate-y-1 h-full ${
                  t.featured
                    ? "bg-navy border-transparent text-cream"
                    : "bg-white border-card-border"
                }`}
              >
                <div className="text-gold text-sm mb-4 tracking-[3px]">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 fill-gold inline-block mr-0.5" />
                  ))}
                </div>
                <p
                  className={`font-display text-[0.95rem] italic leading-[1.7] mb-6 ${
                    t.featured ? "text-cream text-[1.1rem]" : "text-navy"
                  }`}
                >
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-[42px] h-[42px] rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      t.featured
                        ? "bg-white/12 text-cream"
                        : t.avatarBg === "bg-gold"
                        ? "bg-gold text-navy"
                        : `${t.avatarBg} text-cream`
                    }`}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div className={`text-sm font-bold ${t.featured ? "text-cream" : "text-navy"}`}>
                      {t.name}
                    </div>
                    <div className={`text-xs ${t.featured ? "text-cream/50" : "text-grey"}`}>
                      {t.role}
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

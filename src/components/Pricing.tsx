import { Check } from "lucide-react";
import { SectionTag } from "./ui/Buttons";
import { JOIN_URL } from "@/config/links";

const features = [
  "First 3 sessions completely free",
  "Full access to all 90 sessions",
  "PDF, podcast, video + PowerPoint per session",
  "Access to the community",
  "The Handbook for a Disciple of Jesus (free)",
  "Cancel anytime — no long contracts",
];

export default function Pricing() {
  return (
    <section
      id="pricing"
      className="bg-[#EDEAE2] py-20 px-5 sm:px-8 border-t border-card-border overflow-hidden"
    >
      <div className="max-w-[1100px] mx-auto text-center" data-aos="fade-up">
        {/* Label */}
        <span className="inline-block font-body text-[12px] font-bold uppercase tracking-[0.15em] text-gold mb-5">
          Simple Pricing
        </span>

        {/* Headline */}
        <h2 className="font-display text-[clamp(2rem,5vw,2.8rem)] font-bold text-navy tracking-tight mb-4">
          Invest in Your Discipleship
        </h2>

        {/* Subheadline */}
        <p className="font-body text-[17px] text-grey max-w-[560px] mx-auto mb-12 leading-[1.7]">
          Less than a daily coffee. Worth more than any course you have ever taken.
        </p>

        {/* Pricing card */}
        <div className="max-w-[480px] mx-auto bg-white rounded-2xl p-8 sm:p-12 text-center shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
          {/* Top label */}
          <span className="inline-block font-body text-[11px] font-bold uppercase tracking-[0.1em] text-gold bg-cream px-4 py-1.5 rounded-full mb-7">
            Try Free First
          </span>

          {/* Price */}
          <div className="flex items-end justify-center gap-1 mb-2">
            <span className="font-display font-black text-[72px] leading-none text-navy">$25</span>
            <span className="font-body text-[18px] text-grey mb-3">/month</span>
          </div>
          <p className="font-body text-[13px] text-[#9A9A9A] mb-6">
            Billed monthly · Cancel anytime
          </p>

          {/* Divider */}
          <div className="h-px bg-[#EEEEEE] my-6" />

          {/* Feature list */}
          <ul className="text-left pl-6 space-y-3.5 mb-9">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-gold shrink-0 mt-0.5" strokeWidth={3} />
                <span className="font-body text-[16px] text-navy leading-snug">{f}</span>
              </li>
            ))}
          </ul>

          {/* CTA button */}
          <a
            href={JOIN_URL}
            className="w-full inline-flex items-center justify-center gap-2 bg-navy text-white text-[16px] font-bold px-8 py-4 rounded-sm border border-navy/20 transition-all duration-300 hover:bg-gold hover:text-navy hover:-translate-y-0.5"
          >
            Start Your Free Trial →
          </a>

          <p className="font-body text-[12px] italic text-[#9A9A9A] mt-4">
            No credit card required to start your free trial
          </p>
        </div>

        {/* Total investment note */}
        <p className="font-body text-[14px] text-grey max-w-[460px] mx-auto mt-8 leading-[1.7]">
          3 monthly payments of $25 to complete the full 90-day program.
          Total investment: $75.
        </p>
      </div>
    </section>
  );
}

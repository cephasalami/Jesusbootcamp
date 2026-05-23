import { SectionTag } from "./ui/Buttons";
import Image from "next/image";
export default function About() {
  return (
    <section id="about" className="py-24 px-8 bg-cream border-t border-card-border">
      <div className="max-w-[1000px] mx-auto text-center" data-aos="fade-up">
        <div className="mb-10">
          <SectionTag className="border-navy/10 text-navy/60">The Author</SectionTag>
        </div>

        <div className="relative w-40 h-40 mx-auto mb-8">
          <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-xl">
            <Image
              src="/images/paul-joseph.jpg"
              alt="Paul Joseph"
              fill
              className="object-cover grayscale-[0.1]"
              loading="lazy"
            />
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gold rounded-full flex items-center justify-center text-navy shadow-lg">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2z" /></svg>
          </div>
        </div>

        <h2 className="font-display text-[2.5rem] font-bold text-navy mb-2 tracking-tight">Paul Joseph</h2>
        <p className="text-[14px] uppercase tracking-[0.2em] text-gold font-bold mb-8">Founder & Author</p>

        <div className="max-w-[700px] mx-auto space-y-6 text-[1.1rem] text-grey leading-[1.8]">
          <p>
            Jesus Boot Camp was born from a simple observation: many people are
            born again, but few are being made into disciples.
          </p>
          <p>
            Paul Joseph is dedicated to helping believers become active disciples of Jesus.
            This course is the result of years of applying God&apos;s Word in daily life.
          </p>
        </div>
      </div>
    </section>
  );
}

import { SectionTag } from "./ui/Buttons";

const stats: { value: string; label: string; scripture?: boolean }[] = [
  { value: "90 Days", label: "Discipleship Course" },
  { value: "26,000+", label: "Scripture Words" },
  { value: "Global Mission", label: "“making disciples of all nations” (Matthew 28:19)", scripture: true },
];

export default function Mission() {
  return (
    <section id="solution" className="bg-[#EDEAE2] py-24 sm:py-32 px-5 sm:px-8 overflow-hidden">
      <div className="max-w-[900px] mx-auto text-center" data-aos="fade-up">
        <SectionTag className="border-navy/10 text-navy/60">The Mission</SectionTag>

        <h2 className="font-display text-[clamp(2.2rem,6vw,4rem)] font-bold text-navy leading-[1.1] mt-8 mb-8 tracking-tight">
          One course.
          <br />
          <span className="italic font-normal text-gold">An entire transformation.</span>
        </h2>

        <p className="text-[1.15rem] text-grey max-w-[600px] mx-auto mb-4 leading-[1.8]">
          90 sessions. 30 minutes a day. Everything you need to become a committed disciple.
        </p>
        <p className="text-[1.1rem] text-gold italic font-semibold max-w-[600px] mx-auto">
          “Follow me, and I will make you fishers of men” (Matthew 4:19)
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 md:gap-8 mt-16 pt-14 border-t border-navy/10" data-aos="fade-up">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="font-display text-[2rem] font-bold text-navy mb-2 tracking-tight">
                {stat.value}
              </div>
              <div
                className={
                  stat.scripture
                    ? "text-[12px] italic text-gold font-semibold"
                    : "text-[12px] uppercase tracking-[0.1em] text-grey font-semibold"
                }
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

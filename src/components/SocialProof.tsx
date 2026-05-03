import FadeIn from "./ui/FadeIn";

const stats = [
  { num: "90+", label: "Dynamic video sessions", sub: "Scripture-rooted, mission-driven" },
  { num: "5→2M+", label: "Disciples reached per vision", sub: 'The "Give Me Five" multiplication' },
  { num: "$0", label: "No cost. Just commitment.", sub: "Free forever — always" },
];

export default function SocialProof() {
  return (
    <section className="bg-white border-t border-b border-card-border py-12 px-8">
      <div className="max-w-[900px] mx-auto grid grid-cols-1 md:grid-cols-3">
        {stats.map((s, i) => (
          <FadeIn key={i} delay={i * 0.1}>
            <div
              className={`text-center px-8 py-6 md:py-0 ${
                i < stats.length - 1 ? "md:border-r md:border-card-border border-b md:border-b-0 border-card-border" : ""
              }`}
            >
              <div className="font-display text-5xl font-extrabold text-navy leading-none">
                {s.num}
              </div>
              <div className="text-[13px] text-grey mt-1.5">{s.label}</div>
              <div className="text-[11px] text-gold font-semibold mt-1 tracking-[0.05em]">
                {s.sub}
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

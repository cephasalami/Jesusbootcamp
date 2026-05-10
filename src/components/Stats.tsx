import FadeIn from "./ui/FadeIn";

const stats = [
    { value: "90 Days", label: "Discipleship Course" },
    { value: "26,000+", label: "Scripture Words" },
    { value: "Global Mission", label: "Prison & Church Tested" },
    { value: "Free Forever", label: "No Hidden Costs" },
];

export default function Stats() {
    return (
        <section className="py-20 px-8 bg-cream border-y border-card-border">
            <div className="max-w-[1100px] mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-8" data-aos="fade-up">
                    {stats.map((stat, i) => (
                        <div key={i} className="text-center">
                            <div className="font-display text-[2rem] font-bold text-navy mb-2 tracking-tight">
                                {stat.value}
                            </div>
                            <div className="text-[12px] uppercase tracking-[0.1em] text-grey font-semibold">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

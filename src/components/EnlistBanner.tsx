import Link from "next/link";
import { ArrowRight, Fingerprint, ShieldPlus, Send } from "lucide-react";

// Mid-page primary CTA for the whole course → /join. Deliberately a LIGHT framed
// card so it reads as distinct from the dark bands lower on the page, while using
// the site's primary pill button. The three chips echo the /join pillars, tying
// the click to what's on the other side.
const PILLARS = [
    { icon: Fingerprint, name: "Identity" },
    { icon: ShieldPlus, name: "Authority" },
    { icon: Send, name: "Commission" },
];

export default function EnlistBanner() {
    return (
        <section className="bg-cream py-24 px-6 sm:px-8" data-aos="fade-up">
            <div className="max-w-[720px] mx-auto">
                <div className="relative overflow-hidden rounded-2xl border border-card-border bg-white px-7 sm:px-12 py-12 sm:py-14 text-center shadow-[0_24px_70px_rgba(10,31,68,0.10)]">
                    {/* gold accent rule across the top */}
                    <div
                        aria-hidden
                        className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-gold to-transparent"
                    />
                    {/* soft gold glow */}
                    <div
                        aria-hidden
                        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[420px] h-[220px] bg-gold/10 blur-[90px] rounded-full"
                    />

                    <div className="relative">
                        <span className="inline-flex items-center gap-2 text-[11px] font-bold text-gold tracking-[0.22em] uppercase mb-5">
                            Answer the Call
                        </span>
                        <h2 className="font-display text-[1.9rem] sm:text-[2.4rem] font-bold text-navy leading-[1.1] mb-4">
                            Every believer is called.
                            <br className="hidden sm:block" /> Few ever enlist.
                        </h2>
                        <p className="text-grey text-[1.05rem] leading-[1.7] max-w-[540px] mx-auto mb-8">
                            The Jesus Boot Camp is a 90-day intensive that turns what you know into
                            how you live — and equips you to disciple others. Start free; your first
                            class arrives by email.
                        </p>

                        {/* pillar chips — a visual echo of what's on the other side */}
                        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-9">
                            {PILLARS.map(({ icon: Icon, name }) => (
                                <span
                                    key={name}
                                    className="inline-flex items-center gap-2 rounded-full border border-card-border bg-cream/60 px-4 py-2 text-[13px] font-semibold text-navy/80"
                                >
                                    <Icon className="w-3.5 h-3.5 text-gold" />
                                    {name}
                                </span>
                            ))}
                        </div>

                        <Link
                            href="/join"
                            className="group inline-flex items-center justify-center gap-3 bg-navy text-white text-[15px] sm:text-[16px] font-bold px-8 py-4 rounded-full shadow-[0_15px_40px_rgba(10,31,68,0.28)] transition-all duration-300 hover:bg-gold hover:text-navy hover:-translate-y-0.5"
                        >
                            Enlist in the Jesus Boot Camp
                            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </Link>
                        <p className="text-grey/70 text-[12.5px] mt-4">
                            Free · Instant first class · No credit card
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}

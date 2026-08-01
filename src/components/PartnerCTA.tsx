import Link from "next/link";
import { ArrowRight, Check, HandHeart } from "lucide-react";

// Reusable partner call-to-action. `short` = one line + button (in-page bands,
// warm-audience spots). `long` = a full pitch section (homepage). Both point at
// the embedded subscription flow at /partner/join.
//
// Copy is grounded in Paul's "Global Expansion" letter — core classes always
// free, the extra material is the partner benefit at $25+/mo, "wind in our
// sails", one new language a month. Per Paul's instruction, the paywall framing
// stays flagged as pending his explicit go-live sign-off. See src/config/partner.ts.

const PARTNER_JOIN_PATH = "/partner/join";

const UNLOCKS = ["Teaching video", "20-min podcast", "Video Overview", "PowerPoint", "Quiz", "Main Points/Scriptures"];

export default function PartnerCTA({
    variant = "short",
    className = "",
}: {
    variant?: "short" | "long";
    className?: string;
}) {
    if (variant === "long") {
        return (
            <section className={`bg-navy text-white py-20 px-6 sm:px-8 ${className}`}>
                <div className="max-w-[820px] mx-auto text-center">
                    <span className="inline-flex items-center gap-2 text-[11px] font-bold text-gold tracking-[0.2em] uppercase mb-5">
                        <HandHeart className="w-4 h-4" /> Become a Kingdom Partner
                    </span>
                    <h2 className="font-display text-[2rem] sm:text-[2.5rem] font-bold leading-tight mb-5">
                        The core classes are always free. Partnering unlocks the rest.
                    </h2>
                    <p className="text-white/70 text-[1.05rem] leading-[1.7] max-w-[640px] mx-auto mb-8">
                        Partner from $25/month and the full extra material comes alongside every
                        class. Your gift puts &ldquo;wind in our sails&rdquo; to finance the global
                        expansion of this training — with a goal of one new language a month.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mb-10">
                        {UNLOCKS.map((u) => (
                            <span key={u} className="inline-flex items-center gap-2 text-[14px] text-white/80">
                                <Check className="w-4 h-4 text-gold" /> {u}
                            </span>
                        ))}
                    </div>

                    <Link
                        href={PARTNER_JOIN_PATH}
                        className="inline-flex items-center gap-2 bg-gold text-navy text-[15px] font-bold px-8 py-4 rounded-sm transition-all duration-300 hover:brightness-105 hover:-translate-y-0.5 shadow-[0_10px_30px_rgba(201,168,76,0.25)]"
                    >
                        Partner From $25/month
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                    <p className="text-white/40 text-[12.5px] mt-4">
                        Can&apos;t partner right now? Every class stays free as a PDF. Cancel anytime.
                    </p>
                </div>
            </section>
        );
    }

    // short
    return (
        <div
            className={`flex flex-col sm:flex-row items-center justify-between gap-4 bg-cream border border-card-border rounded-xl px-6 py-5 ${className}`}
        >
            <p className="text-[15px] text-navy font-medium text-center sm:text-left">
                <span className="font-bold">Want the full extra material?</span> Partner monthly —
                the core classes stay free.
            </p>
            <Link
                href={PARTNER_JOIN_PATH}
                className="inline-flex items-center gap-2 shrink-0 bg-navy text-white text-[13px] font-bold px-5 py-3 rounded-sm transition-all duration-300 hover:bg-gold hover:text-navy whitespace-nowrap"
            >
                Become a Partner
                <ArrowRight className="w-3.5 h-3.5" />
            </Link>
        </div>
    );
}

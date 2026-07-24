import Link from "next/link";
import { ArrowRight, Flame } from "lucide-react";

// FIX 7 — homepage section pointing to /join (the word-of-mouth entry point).
export default function JoinBanner() {
    return (
        <section className="bg-cream-dark border-t border-card-border py-20 px-6 sm:px-8">
            <div className="max-w-[820px] mx-auto text-center">
                <span className="inline-flex items-center gap-2 text-[11px] font-bold text-gold tracking-[0.2em] uppercase mb-5">
                    <Flame className="w-4 h-4" /> Start the 90-Day Training
                </span>
                <h2 className="font-display text-[2rem] sm:text-[2.5rem] font-bold text-navy leading-tight mb-5">
                    Ready to go beyond passive attendance?
                </h2>
                <p className="text-grey text-[1.05rem] leading-[1.7] max-w-[600px] mx-auto mb-8">
                    The Jesus Boot Camp is the missing bridge between knowing the Word and living it.
                    Join free, get your first class by email — then pass it on to someone who needs it.
                </p>
                <Link
                    href="/join"
                    className="inline-flex items-center gap-2 bg-navy text-white text-[15px] font-bold px-8 py-4 rounded-sm transition-all duration-300 hover:bg-gold hover:text-navy"
                >
                    Join the Jesus Boot Camp
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </section>
    );
}

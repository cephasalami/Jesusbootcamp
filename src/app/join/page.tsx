import type { Metadata } from "next";
import { Fingerprint, ShieldPlus, Send } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JoinForm from "./JoinForm";
import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "Join the Jesus Boot Camp — 90-Day Discipleship Training",
    description:
        "The missing bridge between Christian knowledge and active commission. A 90-day intensive that activates your faith through Identity, Authority, and Commission. Join free.",
    alternates: { canonical: "/join" },
};

const PILLARS = [
    {
        icon: Fingerprint,
        name: "Identity",
        line: "Knowing who you are in Christ.",
    },
    {
        icon: ShieldPlus,
        name: "Authority",
        line: "Understanding the spiritual power you carry.",
    },
    {
        icon: Send,
        name: "Commission",
        line: "Stepping out as an activated ambassador of the Kingdom.",
    },
];

export default function JoinPage() {
    return (
        <>
            <Navbar />
            <main className={styles.pageWrapper}>
                <section className={styles.hero}>
                    <div className={styles.container}>
                        <span className={styles.eyebrow}>Welcome to the Jesus Boot Camp</span>
                        <h1 className={`${styles.headingDisplay} ${styles.h1}`}>
                            Why the Jesus Boot Camp?
                        </h1>

                        <div className={styles.prose}>
                            <p>
                                Christ called us to transform the world, not settle for a lukewarm,
                                Sunday-only faith. Today, too many believers sit in neutral — knowing
                                the Word intellectually but lacking the practical revelation to live
                                it out.
                            </p>
                            <p>
                                The Jesus Boot Camp is the missing bridge between Christian{" "}
                                <em>knowledge</em> and <em>active commission</em>. Over 90 days,
                                this intensive discipleship journey systematically{" "}
                                <em>activates</em> your faith through three core pillars:
                            </p>
                        </div>

                        {/* Three pillars — the strongest structural element, as distinct blocks. */}
                        <div className={styles.pillars}>
                            {PILLARS.map(({ icon: Icon, name, line }, i) => (
                                <div key={name} className={styles.pillar}>
                                    <span className={styles.pillarNum}>0{i + 1}</span>
                                    <span className={styles.pillarIcon}>
                                        <Icon size={26} />
                                    </span>
                                    <h2 className={`${styles.headingDisplay} ${styles.pillarName}`}>
                                        {name}
                                    </h2>
                                    <p className={styles.pillarLine}>{line}</p>
                                </div>
                            ))}
                        </div>

                        <p className={styles.closingProse}>
                            Go beyond passive attendance. Enter the framework designed to ignite the
                            Body of Christ from the inside out.
                        </p>

                        <JoinForm />
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}

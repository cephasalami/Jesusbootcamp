import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, LifeBuoy } from "lucide-react";
import { CONTACT_EMAIL } from "@/lib/contact";
import ContactForm from "./ContactForm";
import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "Contact — Jesus Boot Camp",
    description: "Contact the Jesus Boot Camp team for help with a class or your materials.",
    alternates: { canonical: "/contact" },
};

export default async function ContactPage({
    searchParams,
}: {
    searchParams: Promise<{ class?: string | string[] }>;
}) {
    const params = await searchParams;
    const rawClass = typeof params.class === "string" ? params.class.trim() : "";
    const classSlug = /^[a-z0-9-]{1,30}$/i.test(rawClass) ? rawClass : "";

    return (
        <main className={styles.page}>
            <div className={styles.shell}>
                <Link
                    className={styles.back}
                    href="/"
                >
                    <ArrowLeft size={16} aria-hidden="true" />
                    Back to Jesus Boot Camp
                </Link>

                <section className={styles.card}>
                    <span className={styles.icon}>
                        <LifeBuoy size={27} aria-hidden="true" />
                    </span>
                    <p className={styles.eyebrow}>We&apos;re here to help</p>
                    <h1>Contact the Jesus Boot Camp team</h1>
                    <p className={styles.intro}>
                        If a class or material is not working—or partner content is still locked—tell
                        us what happened and we&apos;ll look into it.
                    </p>

                    <ContactForm classSlug={classSlug} contactEmail={CONTACT_EMAIL} />

                    <p className={styles.directEmail}>
                        You can also email us directly at{" "}
                        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
                    </p>
                </section>
            </div>
        </main>
    );
}

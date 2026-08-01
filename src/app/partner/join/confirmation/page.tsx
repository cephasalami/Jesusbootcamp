import type { Metadata } from "next";
import Link from "next/link";
import { getPartnerTier, type PartnerTierId } from "@/config/partner";
import { formatUsd } from "@/config/products";
import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "Welcome, Partner | Jesus Boot Camp",
    robots: { index: false, follow: false },
};

export default async function PartnerConfirmationPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams;
    const rawName = typeof params.name === "string" ? params.name : "";
    const firstName = rawName.replace(/[^\p{L}\p{M}'\- ]/gu, "").slice(0, 40).trim();
    const tierId = (typeof params.tier === "string" ? params.tier : "") as PartnerTierId;
    const tier = getPartnerTier(tierId);
    // Amount to display: a preset's amount, or the actual custom amount (dollars)
    // passed through the return URL. Validated to a sane positive number.
    const rawAmount = typeof params.amount === "string" ? Number(params.amount) : NaN;
    const amountLabel = tier
        ? `${formatUsd(tier.amountCents)}/month`
        : Number.isFinite(rawAmount) && rawAmount > 0
        ? `${formatUsd(Math.round(rawAmount * 100))}/month`
        : null;

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.card}>
                <div className={styles.badge}>✓</div>
                <h1 className={styles.title}>
                    Thank you{firstName ? `, ${firstName}` : ""}.
                </h1>
                <p className={styles.lead}>
                    You&apos;re now a Kingdom Partner
                    {amountLabel ? (
                        <>
                            {" "}at <strong>{amountLabel}</strong>
                        </>
                    ) : null}
                    . Your partnership puts real wind in the sails of the mission — thank you for
                    standing with us.
                </p>

                <div className={styles.next}>
                    <h2 className={styles.nextTitle}>What happens next</h2>
                    <ul className={styles.nextList}>
                        <li>
                            A receipt is on its way to your email, and your card renews
                            automatically each month.
                        </li>
                        <li>
                            Your partner access is being switched on. From your next class onward,
                            the full extra material — video, podcast, brief, slides, quiz and
                            Main Points/Scriptures — arrives alongside each class.
                        </li>
                        <li>
                            You can cancel anytime — just reply to any email and we&apos;ll stop the
                            monthly gift, no questions asked.
                        </li>
                    </ul>
                </div>

                <Link href="/" className={styles.homeLink}>
                    Return to Jesus Boot Camp →
                </Link>
            </div>
        </div>
    );
}

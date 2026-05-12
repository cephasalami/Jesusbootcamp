import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Special Offer: Power for the Hour — $5 Today Only | Jesus Boot Camp",
    description: "One-time offer: Get Power for the Hour by Paul Joseph for just $5. The essential scriptures every disciple must memorize. Instant digital delivery.",
    robots: {
        index: false,
        follow: false,
    },
};

export default function PowerForTheHourLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}

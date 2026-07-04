import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Special Offer: Power for the Hour — $5 Today Only | Jesus Boot Camp",
    description: "One-time offer: Get Power for the Hour by Paul Joseph for just $5. The essential scriptures every disciple must memorize. Instant digital delivery.",
    robots: {
        index: false,
        follow: false,
    },
    openGraph: {
        title: "Power for the Hour — $5 Today Only",
        description: "The essential scriptures every disciple must memorize. One-time $5 offer, instant digital delivery.",
        url: "https://jesusbootcamp.org/power-for-the-hour",
        type: "website",
        images: [
            {
                url: "/images/power-for-the-hour/power-for-the-hour-3d.png",
                alt: "Power for the Hour by Paul Joseph",
            },
        ],
    },
};

export default function PowerForTheHourLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}

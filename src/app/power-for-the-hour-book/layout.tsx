import type { Metadata } from "next";

// Full-price ad landing page. noindex/nofollow like the sibling upsell page —
// it's a paid-traffic destination, not meant to rank organically.
// OG/Twitter images intentionally inherit the site-wide app/opengraph-image.tsx
// (1200x630, no price) instead of the old power-for-the-hour-og.png, which
// carries "$5 today only" and would mismatch this full-price page.
export const metadata: Metadata = {
    title:
        "Power for the Hour — Scriptures Every Disciple Must Memorize | Jesus Boot Camp",
    description:
        "The essential scriptures every disciple must memorize — for identity, evangelism, and standing firm. Power for the Hour by Paul Joseph. Instant PDF download, $5.",
    robots: {
        index: false,
        follow: false,
    },
    openGraph: {
        title: "Power for the Hour — Scriptures Every Disciple Must Memorize",
        description:
            "The essential verses every disciple should carry by heart, organized to memorize, use, and teach. Instant digital PDF — $5.",
        url: "https://jesusbootcamp.org/power-for-the-hour-book",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Power for the Hour — Scriptures Every Disciple Must Memorize",
        description:
            "The essential verses every disciple should carry by heart. Instant digital PDF — $5.",
    },
};

export default function PowerForTheHourBookLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Free Download: Handbook for a Disciple of Jesus | Jesus Boot Camp",
    description: "Download your free copy of the Handbook for a Disciple of Jesus by Paul Joseph. Thousands of scripture references organized by life topic. Used in prisons, churches, and youth groups worldwide.",
    openGraph: {
        title: "Free Handbook for a Disciple of Jesus",
        description: "Get the free handbook that trains believers to actually live their faith. 90-day discipleship starts here.",
        images: ["/images/handbook-og-image.jpg"],
        url: "https://jesusbootcamp.org/handbook",
        type: "website",
    },
    robots: {
        index: false,
        follow: false,
    },
};

export default function HandbookLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}

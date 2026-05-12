import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Thank You — Jesus Boot Camp",
    description: "Your Handbook for a Disciple of Jesus is on its way. Check your inbox and discover what comes next in your discipleship journey.",
    robots: {
        index: false,
        follow: false,
    },
};

export default function ThankYouLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}

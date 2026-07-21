import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Thank You | Jesus Boot Camp",
    description: "Your order is confirmed.",
    robots: { index: false, follow: false },
};

export default function ConfirmationLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

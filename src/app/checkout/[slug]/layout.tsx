import type { Metadata } from "next";
import { getBook, getCheckout } from "@/config/products";

// Checkout is a transactional page reached from an ad/landing CTA — never index.
export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const checkout = getCheckout(slug);
    const title = checkout ? getBook(checkout.productSlug)?.title : undefined;
    return {
        title: title
            ? `Secure Checkout — ${title} | Jesus Boot Camp`
            : "Secure Checkout | Jesus Boot Camp",
        description: title
            ? `Complete your purchase of ${title} by Paul Joseph.`
            : "Complete your secure purchase.",
        robots: { index: false, follow: false },
    };
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

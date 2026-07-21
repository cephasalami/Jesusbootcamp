import { notFound } from "next/navigation";
import { getCheckoutView } from "@/config/products";
import CheckoutClient from "./CheckoutClient";

// Server wrapper: resolves + validates the product slug server-side, then hands
// a display-only DTO (no prices are trusted from the client — the API routes
// re-derive every amount) to the client checkout form. Unknown slug → 404.
export default async function CheckoutPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const view = getCheckoutView(slug);
    if (!view) notFound();
    return <CheckoutClient view={view} />;
}

import type { Metadata } from "next";

const TITLE =
    "While You Were Busy: How the System Replaced You, and How to Take Your Lead Back";
const DESCRIPTION =
    "The system is raising your kids while you're busy. While You Were Busy by Paul Joseph is a bold wake-up call to stop the drift, take your lead back, and rebuild your home. Instant PDF — $5.";
const COVER = "/images/while-you-were-busy/while-you-were-busy-cover.png";
const URL = "https://jesusbootcamp.org/while-you-were-busy";

export const metadata: Metadata = {
    title: "While You Were Busy — Take Your Lead Back | by Paul Joseph",
    description: DESCRIPTION,
    openGraph: {
        title: TITLE,
        description: DESCRIPTION,
        images: [
            {
                url: COVER,
                width: 1500,
                height: 1174,
                alt: "While You Were Busy by Paul Joseph — book cover",
            },
        ],
        url: URL,
        type: "website",
    },
    alternates: {
        canonical: URL,
    },
};

// Product/Book structured data. Every value below is factual: the price and
// availability come straight from the Faith Without Borders store listing.
const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: "While You Were Busy: How the System Replaced You, and How to Take Your Lead Back",
    author: { "@type": "Person", name: "Paul Joseph" },
    bookFormat: "https://schema.org/EBook",
    inLanguage: "en",
    url: URL,
    image: `https://jesusbootcamp.org${COVER}`,
    description:
        "A bold call for parents to stop drifting and take their God-given place back in the home — the hidden labor of shaping a child's heart, character, and future.",
    offers: {
        "@type": "Offer",
        price: "5.00",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        url: "https://faithwithoutborders.us/product/while-you-were-busy/",
        seller: { "@type": "Organization", name: "Faith Without Borders" },
    },
};

export default function WhileYouWereBusyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {children}
        </>
    );
}

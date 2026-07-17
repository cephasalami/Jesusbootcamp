import type { Metadata } from "next";

const TITLE = "Partner With Us — Fuel the Harvest | Jesus Boot Camp";
const DESCRIPTION =
    "Not everyone can go full-time into the field, but everyone can fund the frontlines. Partner monthly or give a one-time gift to help deploy the Gospel, support translators, and multiply disciples worldwide.";
const URL = "https://jesusbootcamp.org/partner";

export const metadata: Metadata = {
    title: TITLE,
    description: DESCRIPTION,
    openGraph: {
        title: "Partner With Us — Fuel the Harvest",
        description:
            "The Gospel is free — getting it to the nations is not. Partner with Jesus Boot Camp to fund the frontlines of the Great Commission.",
        url: URL,
        type: "website",
    },
    alternates: {
        canonical: URL,
    },
};

// DonateAction structured data — the giving target is the ministry's real
// PayPal donate page.
const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: TITLE,
    description: DESCRIPTION,
    url: URL,
    about: {
        "@type": "Organization",
        name: "Jesus Boot Camp",
        url: "https://jesusbootcamp.org",
        potentialAction: {
            "@type": "DonateAction",
            target: "https://www.paypal.com/donate/?hosted_button_id=DLUEWNB2NEAJQ",
        },
    },
};

export default function PartnerLayout({
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

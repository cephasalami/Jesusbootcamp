import type { Metadata } from "next";
import { partnerTierViews } from "@/config/partner";
import PartnerJoinClient from "./PartnerJoinClient";

// Transactional page reached from a partner CTA — never index.
export const metadata: Metadata = {
    title: "Become a Kingdom Partner | Jesus Boot Camp",
    description:
        "Partner monthly to fuel the mission and unlock the full extra material alongside every class.",
    robots: { index: false, follow: false },
};

export default function PartnerJoinPage() {
    // Only display-safe tier data crosses to the client; the real Stripe price
    // ids stay server-side and amounts are re-resolved authoritatively on submit.
    return <PartnerJoinClient tiers={partnerTierViews()} />;
}

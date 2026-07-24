import { FileText } from "lucide-react";

// FIX 6 — a calm, helpful clarification (not a warning) that the product is a
// digital PDF. Placed near buy buttons on the book landing pages and mirrored on
// the checkout page.
export default function DigitalFormatNote({ className = "" }: { className?: string }) {
    return (
        <div
            className={`flex items-start gap-2.5 rounded-lg bg-gold/[0.07] border border-gold/25 px-3.5 py-2.5 text-[13px] text-grey leading-snug ${className}`}
        >
            <FileText className="w-4 h-4 mt-0.5 shrink-0 text-gold" />
            <span>
                <span className="text-navy font-semibold">
                    Format: PDF · Delivery: Instant download.
                </span>{" "}
                No printed copy will be shipped, but you can always print the PDF ebook.
            </span>
        </div>
    );
}

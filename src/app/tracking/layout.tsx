import type { Metadata } from "next";

// Keep the internal dashboard out of search engines. This layout only sets
// metadata and renders children — it does NOT gate, so the /tracking/login
// route stays reachable. The password check lives in the dashboard page itself.
export const metadata: Metadata = {
  title: "Tracking & Analytics — Jesus Boot Camp",
  robots: { index: false, follow: false, nocache: true },
};

export default function TrackingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

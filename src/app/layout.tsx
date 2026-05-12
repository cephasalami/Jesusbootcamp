import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import AOSConfig from "@/components/AOSConfig";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Jesus Boot Camp — 90-Day Discipleship Training by Paul Joseph",
  description: "Transform from a dormant believer into a disciplined disciple of Christ. Join the Jesus Boot Camp — free 90-day training. Get your free Handbook today.",
  openGraph: {
    title: "Jesus Boot Camp — 90-Day Discipleship Training",
    description: "From believer to disciple in 90 days. Free training. Free handbook. Global mission.",
    url: "https://jesusbootcamp.org",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AOSConfig />
        {children}
      </body>
    </html>
  );
}

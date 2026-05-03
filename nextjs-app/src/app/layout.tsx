import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "The Jesus Boot Camp — From Believer to Disciple",
  description:
    "A free 90-day discipleship course that transforms believers into disciples. 30 minutes a day. Completely free. Start today.",
  openGraph: {
    title: "The Jesus Boot Camp — From Believer to Disciple",
    description: "A free 90-day discipleship course. 30 minutes a day. Completely free.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}

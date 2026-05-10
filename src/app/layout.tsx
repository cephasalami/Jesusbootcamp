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

export const metadata: Metadata = {
  title: "Jesus Boot Camp — Free 90-Day Discipleship Course by Paul Joseph",
  description:
    "Transform from a dormant believer into a disciplined disciple of Christ. Join the free 90-day Jesus Boot Camp and get your free Handbook today.",
  openGraph: {
    title: "Jesus Boot Camp — Free 90-Day Discipleship Course by Paul Joseph",
    description: "Transform from a dormant believer into a disciplined disciple of Christ. Join the free 90-day Jesus Boot Camp and get your free Handbook today.",
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

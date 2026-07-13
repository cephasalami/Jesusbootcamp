import type { Metadata } from "next";
import localFont from "next/font/local";
import { Poppins } from "next/font/google";
import "./globals.css";
import AOSConfig from "@/components/AOSConfig";

// Vogun — custom display face for all headings / sub-headings.
// Single-weight TTF aliased to 400 + 700 so `font-bold` headings render the
// real glyphs instead of a synthesized faux-bold.
const vogun = localFont({
  src: [
    { path: "./fonts/Vogun-Medium.ttf", weight: "400", style: "normal" },
    { path: "./fonts/Vogun-Medium.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
});

// Poppins — body copy.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-body",
  display: "swap",
});

import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://jesusbootcamp.org"),
  title: "Jesus Boot Camp — 90-Day Discipleship Training by Paul Joseph",
  description: "Transform from passive believer to devoted disciple of Christ. Join the Jesus Boot Camp and get your Handbook today.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Jesus Boot Camp — 90-Day Discipleship Training",
    description: "From believer to disciple in 90 days. Global mission.",
    url: "https://jesusbootcamp.org",
    type: "website",
    // og:image / twitter:image are provided by app/opengraph-image.tsx (1200×630).
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${vogun.variable} ${poppins.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AOSConfig />
        {children}
      </body>
    </html>
  );
}

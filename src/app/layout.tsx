import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const bebas = Bebas_Neue({ variable: "--font-bebas", weight: "400", subsets: ["latin"] });

// Absolute base for share-preview URLs. Set NEXT_PUBLIC_SITE_URL to your domain;
// on Vercel the production URL is picked up automatically.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

const description = "Walk through the cinema in 3D, sit in any seat and see the screen from it — then book your ticket in seconds.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "CineSeat — See your seat before you book", template: "%s · CineSeat" },
  description,
  applicationName: "CineSeat",
  keywords: ["cinema", "movie tickets", "seat booking", "3D cinema", "Lahore", "Pakistan"],
  openGraph: {
    type: "website",
    siteName: "CineSeat",
    title: "CineSeat — See your seat before you book",
    description,
    url: "/",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "CineSeat — see your seat before you book" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CineSeat — See your seat before you book",
    description,
    images: ["/og.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#07060b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${bebas.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}

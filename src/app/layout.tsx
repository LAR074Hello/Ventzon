import SiteHeader from "@/components/SiteHeader";
import type { Metadata } from "next";
import { Inter_Tight, Geist_Mono } from "next/font/google";
import "./globals.css";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ventzon — Loyalty Rewards App for Local Businesses",
  description:
    "Ventzon is a digital loyalty program for restaurants, cafes, salons, and local shops. Replace paper punch cards with a QR code loyalty app. $25/month, no hardware needed.",
  metadataBase: new URL("https://www.ventzon.com"),
  manifest: "/site.webmanifest",
  keywords: [
    "loyalty app for small business",
    "digital loyalty card",
    "customer loyalty program",
    "loyalty rewards app",
    "digital punch card",
    "loyalty program for restaurants",
    "loyalty app for coffee shops",
    "stamp card app",
    "local business loyalty program",
    "repeat customer app",
  ],
  appleWebApp: {
    title: "Ventzon",
    statusBarStyle: "black-translucent",
  },
  other: {
    "apple-itunes-app": "app-id=6763768638",
  },
  openGraph: {
    title: "Ventzon — Loyalty Rewards App for Local Businesses",
    description:
      "Replace paper punch cards with a digital loyalty program. QR code check-ins, real-time analytics, push notifications. Set up in 5 minutes.",
    url: "https://www.ventzon.com",
    siteName: "Ventzon",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ventzon — Loyalty Rewards App for Local Businesses",
    description:
      "Replace paper punch cards with a digital loyalty program. QR code check-ins, real-time analytics, push notifications.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${interTight.variable} ${geistMono.variable} antialiased`}
      >
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}

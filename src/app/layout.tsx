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
  title: "Ventzon — Customer Rewards Platform",
  description:
    "Ventzon helps local businesses increase repeat customers with a simple loyalty app. Earn rewards, track visits, redeem in-store.",
  metadataBase: new URL("https://www.ventzon.com"),
  manifest: "/site.webmanifest",
  appleWebApp: {
    title: "Ventzon",
    statusBarStyle: "black-translucent",
  },
  other: {
    "apple-itunes-app": "app-id=6763768638",
  },
  openGraph: {
    title: "Ventzon — Customer Rewards Platform",
    description:
      "Turn one-time buyers into loyal regulars. App-based loyalty rewards for local businesses.",
    url: "https://www.ventzon.com",
    siteName: "Ventzon",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Ventzon — Customer Rewards Platform",
    description:
      "Turn one-time buyers into loyal regulars. App-based loyalty rewards for local businesses.",
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

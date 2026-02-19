import SiteHeader from "@/components/SiteHeader";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ventzon — Customer Rewards Platform",
  description:
    "Ventzon helps local businesses increase repeat customers with simple SMS-based rewards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-white dark:bg-neutral-950">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100`}
      >
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}

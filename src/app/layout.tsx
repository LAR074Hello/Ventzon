import SiteHeader from "@/components/SiteHeader";
import type { Metadata } from "next";
import { Bricolage_Grotesque, Public_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";

// Design tokens: Bricolage Grotesque is the display face (titles only),
// Public Sans carries body/UI. See globals.css for the token system.
const displayFont = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const bodyFont = Public_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
    /* suppressHydrationWarning: the theme script adds .vz-light to <html>
       before hydration by design. */
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${displayFont.variable} ${bodyFont.variable} ${geistMono.variable} antialiased`}
      >
        {/* Theme before paint: ventzon_theme = light | dark | system.
            Default (system) follows prefers-color-scheme; the class
            drives the token values in globals.css. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("ventzon_theme");var l=t==="light"||(t!=="dark"&&matchMedia("(prefers-color-scheme: light)").matches);if(l)document.documentElement.classList.add("vz-light")}catch(e){}`,
          }}
        />
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}

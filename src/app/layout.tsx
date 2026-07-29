import SiteHeader from "@/components/SiteHeader";
import type { Metadata, Viewport } from "next";
import { Archivo, Public_Sans, DM_Mono } from "next/font/google";
import "./globals.css";

// Three type roles. next/font self-hosts these at build time — the
// files are served from our own origin with font-display: swap and
// preloaded, so there is no runtime CDN dependency.
// See globals.css for the token system that consumes them.

// Display — headlines, place names, section titles. Variable, with the
// width axis exposed so display type can condense without a second file.
const displayFont = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

// Body / UI — the workhorse. Variable weight, no axes needed.
const bodyFont = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  display: "swap",
});

// Data / utility — timestamps, visit counts, distances, check-in
// receipts. The product's "receipt" voice. DM Mono ships static only.
const monoFont = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

/**
 * viewport-fit=cover is LOAD-BEARING, not cosmetic.
 *
 * Without it iOS resolves every env(safe-area-inset-*) to 0, and this app
 * relies on those insets in 27 places — including the bottom nav's
 * padding-bottom and the customer header's padding-top. Combined with
 * apple-mobile-web-app-status-bar-style: black-translucent (which deliberately
 * extends content UNDER the status bar), the result was content beneath the
 * notch with no compensation and a bottom nav under the home indicator — with
 * the Post button in it.
 *
 * VERIFY ON A REAL DEVICE: the interaction between viewport-fit=cover and
 * black-translucent cannot be checked in a desktop browser.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Matches the manifest. Was black, which flashed against the light app.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F7F4" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0A" },
  ],
};

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
    // SMART APP BANNER — DISABLED 2026-07-29, deliberately kept here.
    //
    // `apple-itunes-app` renders Safari's Smart App Banner across the top of
    // the page. The beta runs in mobile Safari, and the banner pointed at the
    // App Store build — the one WITHOUT the Info.plist permission strings — so
    // it actively recruited testers away from the working web version into the
    // broken native one. It also stacked with the in-app AppStoreBanner.
    //
    // RE-ENABLE by uncommenting, once the native build carries the permission
    // strings and the safety slice has landed. Nothing else needs changing.
    // "apple-itunes-app": "app-id=6763768638",
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
    /* suppressHydrationWarning: the script below sets data-theme on
       <html> before hydration by design, so the server and client
       markup differ on that attribute. Required, not optional — without
       it App Router logs a hydration error on every page. */
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body
        className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} antialiased`}
      >
        {/* Theme before paint. First child of <body> so it runs before
            anything renders — no flash of the wrong theme.
            ventzon_theme stores the PREFERENCE (light | dark | system);
            data-theme holds the RESOLVED value. Light is the default
            for new accounts, so an absent key means light, not system.
            Re-reads storage on each apply so the media listener stays
            correct after the user changes the preference at runtime. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=matchMedia("(prefers-color-scheme: dark)");function a(){var p=localStorage.getItem("ventzon_theme")||"light";var r=p==="system"?(m.matches?"dark":"light"):(p==="dark"?"dark":"light");document.documentElement.setAttribute("data-theme",r)}a();m.addEventListener("change",a)}catch(e){}})()`,
          }}
        />
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}

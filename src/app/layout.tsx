import SiteHeader from "@/components/SiteHeader";
import type { Metadata, Viewport } from "next";
import { DM_Mono, Newsreader, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

// Three type roles. next/font self-hosts these at build time — the
// files are served from our own origin with font-display: swap and
// preloaded, so there is no runtime CDN dependency.
// See globals.css for the token system that consumes them.

// Display — Newsreader, a variable serif with optical sizing: literary,
// editorial, and quiet at every size. This is the primary brand face.
const displayFont = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
});

// Body / UI — Hanken Grotesk, a refined neo-grotesque.
const bodyFont = Hanken_Grotesk({
  variable: "--font-hanken",
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
  // Matches the manifest. Both resolve dark — the site is dark by default.
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#141010" },
    { media: "(prefers-color-scheme: light)", color: "#1A1514" },
  ],
};

export const metadata: Metadata = {
  title: "Ventzon — Find Real Places. See Who's Actually There.",
  description:
    "Ventzon is a local social app. Discover real places near you, see what they're actually like from people who went, check in, and share verified visits. Free for customers.",
  metadataBase: new URL("https://www.ventzon.com"),
  manifest: "/site.webmanifest",
  keywords: [
    "local discovery app",
    "places near me",
    "verified visit",
    "local spots",
    "restaurant recommendations",
    "coffee shop discovery",
    "what to do nearby",
    "local social app",
    "neighborhood spots",
    "real reviews from real visits",
  ],
  appleWebApp: {
    title: "Ventzon",
    statusBarStyle: "black-translucent",
  },
  other: {
    // iOS Smart App Banner — Apple's native "Open in the App Store" strip on
    // iPhone/iPad Safari. Inert on desktop and Android, safe site-wide.
    // Enabled once the shipped native build carries the permission strings and
    // the safety slice landed (previously disabled 2026-07-29 for the beta).
    "apple-itunes-app": "app-id=6763768638",
  },
  openGraph: {
    title: "Ventzon — Find Real Places. See Who's Actually There.",
    description:
      "Discover real places near you, see what they're actually like from people who went, check in, and share verified visits. Free for customers.",
    url: "https://www.ventzon.com",
    siteName: "Ventzon",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ventzon — Find Real Places. See Who's Actually There.",
    description:
      "Discover real places near you, see what they're actually like from people who went, and share verified visits. Free for customers.",
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
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body
        className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} antialiased`}
      >
        {/* Theme before paint. First child of <body> so it runs before
            anything renders — no flash of the wrong theme.
            ventzon_theme stores the PREFERENCE (light | dark | system);
            data-theme holds the RESOLVED value. Dark is the default,
            so an absent key means dark, not system.
            Re-reads storage on each apply so the media listener stays
            correct after the user changes the preference at runtime. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=matchMedia("(prefers-color-scheme: dark)");function a(){var p=localStorage.getItem("ventzon_theme")||"dark";var r=p==="system"?(m.matches?"dark":"light"):(p==="dark"?"dark":"light");document.documentElement.setAttribute("data-theme",r)}a();m.addEventListener("change",a)}catch(e){}})()`,
          }}
        />
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}

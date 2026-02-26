import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Ventzon",
  description:
    "Affordable plans starting at $29/month. Unlimited customers, SMS rewards, QR code check-in, and a full merchant dashboard.",
  openGraph: {
    title: "Pricing — Ventzon",
    description:
      "Affordable loyalty rewards for local businesses. Plans start at $29/month.",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

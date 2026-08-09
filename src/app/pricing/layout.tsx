import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Ventzon",
  description:
    "$25/month for a complete digital loyalty program. Includes QR code check-ins, customer analytics, push notifications, and email campaigns. Flat — no per-redemption fees.",
  openGraph: {
    title: "Pricing — Ventzon",
    description:
      "$25/month or $250/year. No hardware, no setup fees. Cancel anytime.",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

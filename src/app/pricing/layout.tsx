import type { Metadata } from "next";
import { MONTHLY_PRICE, ANNUAL_PRICE } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Pricing — Ventzon",
  description:
    `$${MONTHLY_PRICE}/month for a complete digital loyalty program. Includes QR code check-ins, customer analytics, push notifications, and email campaigns. Flat — no per-redemption fees.`,
  openGraph: {
    title: "Pricing — Ventzon",
    description:
      `$${MONTHLY_PRICE}/month or $${ANNUAL_PRICE}/year. No hardware, no setup fees. Cancel anytime.`,
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

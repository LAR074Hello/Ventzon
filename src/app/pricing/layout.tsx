import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Ventzon",
  description:
    "Start free — pay $1.25 per reward redeemed. Upgrade to Pro at $19.99/month for analytics, custom SMS, and promotional texting.",
  openGraph: {
    title: "Pricing — Ventzon",
    description:
      "Start free with Ventzon loyalty rewards. Pro plan at $19.99/month for the full suite.",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

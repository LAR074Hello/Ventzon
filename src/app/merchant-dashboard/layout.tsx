import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customer Analytics for Local Shops — Ventzon",
  description:
    "Know your customers. See who your regulars are, who's slipping away, your busiest hours, your audience, and how many people each promotion brings back. $35/month, flat.",
  openGraph: {
    title: "Know your customers — Ventzon for shops",
    description:
      "Customer analytics for local shops: regulars, customers slipping away, busy hours, audience, and promotion results.",
  },
};

export default function MerchantDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

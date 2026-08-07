import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Merchant Dashboard — Ventzon",
  description:
    "Every check-in, every reward, every return — on one quiet screen. See how the Ventzon merchant dashboard helps local shops know their regulars and grow.",
};

export default function MerchantDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

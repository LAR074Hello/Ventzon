import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Merchant Dashboard — Ventzon",
  description: "Manage your Ventzon loyalty rewards program.",
  robots: { index: false, follow: false },
};

export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

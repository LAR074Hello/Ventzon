import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works — Ventzon Loyalty Rewards",
  description:
    "See how Ventzon works: merchants post a QR code, customers scan to earn stamps, and get rewarded after a set number of visits. No hardware, no app download required for check-in.",
  openGraph: {
    title: "How It Works — Ventzon Loyalty Rewards",
    description:
      "QR code loyalty program for local businesses. Customers scan, earn stamps, and come back for rewards.",
  },
};

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

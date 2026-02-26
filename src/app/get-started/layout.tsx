import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get Started — Ventzon",
  description: "Create your shop and start building customer loyalty with Ventzon SMS rewards.",
  openGraph: {
    title: "Get Started — Ventzon",
    description: "Set up your loyalty program in under 2 minutes.",
  },
};

export default function GetStartedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

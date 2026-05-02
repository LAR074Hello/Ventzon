import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works — Ventzon",
  description:
    "Learn how Ventzon helps local businesses build customer loyalty with simple app-based rewards. Set up in minutes.",
  openGraph: {
    title: "How It Works — Ventzon",
    description:
      "Simple app-based loyalty rewards for local businesses. Set up in minutes.",
  },
};

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

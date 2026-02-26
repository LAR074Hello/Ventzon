import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join Rewards — Ventzon",
  description: "Join your favorite local shop's rewards program. Earn points with every visit.",
  openGraph: {
    title: "Join Rewards — Ventzon",
    description: "Scan, check in, and earn rewards at your favorite local businesses.",
  },
};

export default function JoinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

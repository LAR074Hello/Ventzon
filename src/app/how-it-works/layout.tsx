import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works — Ventzon",
  description:
    "See how Ventzon works: discover real places near you, check in when you go, and share verified visits. Free for customers.",
  openGraph: {
    title: "How It Works — Ventzon",
    description: "Find real places. Go there. Prove it. Local discovery with verified visits.",
  },
};

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

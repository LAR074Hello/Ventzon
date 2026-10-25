import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get Started — Ventzon",
  description: "Create your shop and start seeing customer analytics: regulars, busy hours, and what brings people back.",
  openGraph: {
    title: "Get Started — Ventzon",
    description: "Set up your shop in under 2 minutes and start knowing your customers.",
  },
};

export default function GetStartedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

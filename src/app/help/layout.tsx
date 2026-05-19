import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help & FAQ — Ventzon",
  description:
    "Answers to common questions about Ventzon for merchants and customers. Learn how to set up your loyalty program, manage customers, and redeem rewards.",
  openGraph: {
    title: "Help & FAQ — Ventzon",
    description:
      "Everything you need to know about setting up and running your Ventzon loyalty program.",
  },
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return children;
}

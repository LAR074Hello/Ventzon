import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account — Ventzon",
  description: "Create a Ventzon account for your business: customer analytics, rewards and promotions in one place.",
  openGraph: {
    title: "Create Account — Ventzon",
    description: "Know your customers and bring them back. Create your Ventzon account.",
  },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

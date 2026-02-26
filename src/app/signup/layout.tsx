import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account — Ventzon",
  description: "Create a free Ventzon account to set up SMS-based loyalty rewards for your business.",
  openGraph: {
    title: "Create Account — Ventzon",
    description: "Start building customer loyalty with SMS rewards. Sign up free.",
  },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

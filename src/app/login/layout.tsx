import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — Ventzon",
  description: "Sign in to your Ventzon merchant account to manage your loyalty rewards program.",
  robots: { index: false, follow: false },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

import type { Metadata } from "next";

// The gallery itself is a client component (it hands callbacks to the
// components it renders), so its metadata lives here.
export const metadata: Metadata = {
  title: "Component gallery — Ventzon",
  robots: { index: false, follow: false },
};

export default function DevComponentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

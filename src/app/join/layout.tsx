import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Check In — Ventzon",
  description: "Check in at a local place on Ventzon and start earning toward a reward where the shop runs one.",
  openGraph: {
    title: "Check In — Ventzon",
    description: "Check in at a local place on Ventzon — proof you were really there.",
  },
};

export default function JoinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

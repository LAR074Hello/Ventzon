import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Setup Guide — Ventzon for Merchants",
  description:
    "Set up your Ventzon loyalty program in about five minutes: create your account, name your shop, choose a plan, set your reward, and print your QR code. No hardware, no tech skills.",
  openGraph: {
    title: "Setup Guide — Ventzon for Merchants",
    description:
      "From sign-up to a printed QR code at your register in five minutes. A step-by-step guide for shop owners.",
  },
};

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return children;
}

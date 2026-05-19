import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Demo — Ventzon Loyalty App",
  description:
    "Try Ventzon before signing up. See the merchant dashboard and the customer check-in experience live — no account needed.",
  openGraph: {
    title: "Live Demo — Ventzon Loyalty App",
    description:
      "Try the merchant dashboard and customer check-in flow live. No account required.",
  },
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}

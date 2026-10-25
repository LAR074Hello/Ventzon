import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import DeviceFrame from "@/components/DeviceFrame";
import Divider from "@/components/Divider";
import FadeImage from "@/components/FadeImage";
import Parallax from "@/components/Parallax";
import PricingSection from "@/components/PricingSection";
import SiteFooter from "@/components/SiteFooter";
import HeroScroll from "@/components/HeroScroll";
import AnalyticsPreview from "@/components/AnalyticsPreview";

export const metadata: Metadata = {
  title: "Ventzon — Customer analytics for local shops, powered by rewards",
  description:
    "Customers earn rewards and discover great places nearby. Shops learn who their customers are, when they come in, and what brings them back.",
  openGraph: {
    title: "Ventzon — Know your customers. Reward them for coming back.",
    description:
      "Customer analytics for local shops, built into a rewards app people actually want to use.",
  },
};

/* ═══════════════════════════════════════════════════════════════════
   Device frames on this page show real app screenshots from
   /site-images (captured from the seeded dev build), not mockups.
   ═══════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════
   How the three parts fit together — one loop, said plainly.
   ═══════════════════════════════════════════════════════════════════ */
const LOOP = [
  {
    n: "01",
    title: "Customers earn rewards",
    body: "They scan a shop's QR code to check in and earn toward a reward. No paper cards, nothing to lose.",
  },
  {
    n: "02",
    title: "Every visit becomes insight",
    body: "The shop sees its regulars, its busy hours, who's slipping away, and what actually brings people back.",
  },
  {
    n: "03",
    title: "Locals discover the shop",
    body: "In the Ventzon app, people find places nearby through friends' posts, each one backed by a verified visit.",
  },
];

const SHOP_QUESTIONS = [
  "Who are my regulars, and what do they spend?",
  "Who hasn't been back in two weeks?",
  "When am I busy, and when am I not?",
  "Did my last promotion bring anyone back?",
];

export default function HomePage() {
  return (
    <main className="marketing bg-night-950 text-fog-100">
      {/* ══ HERO — pinned video, then the one-sentence explanation ══ */}
      <HeroScroll />

      {/* ══ HOW IT FITS TOGETHER ══ */}
      <section id="how-it-works" className="scroll-mt-24 px-6 py-28 sm:py-36">
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-fog-500">How it works</p>
          <h2 className="mt-6 font-display text-[clamp(1.75rem,3.5vw,3rem)] font-normal leading-[1.12] tracking-[0.01em]">
            One loop. Everyone gets something.
          </h2>
        </ScrollReveal>
        <div className="mx-auto mt-16 grid max-w-6xl gap-6 md:grid-cols-3">
          {LOOP.map((step, i) => (
            <ScrollReveal key={step.n} delay={(i + 1) as 1 | 2 | 3}>
              <div className="h-full rounded-[2rem] bg-night-800 p-8 shadow-warm">
                <p className="text-[13px] font-medium tracking-[0.25em] text-maroon-300">{step.n}</p>
                <h3 className="mt-4 font-display text-[22px] font-medium text-fog-100">{step.title}</h3>
                <p className="mt-3 text-[15px] leading-[1.7] text-fog-300">{step.body}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ══ FOR SHOPS — the analytics, shown not told ══ */}
      <section className="px-6 py-28 sm:py-36">
        <Divider className="mx-auto mb-16 max-w-xs" />
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-fog-500">For shop owners</p>
          <h2 className="mt-6 font-display text-[clamp(1.75rem,3.5vw,3rem)] font-normal leading-[1.12] tracking-[0.01em]">
            Know your customers. Bring them back.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-[17px] leading-[1.7] text-fog-300">
            The customer analytics big chains have, for the shop on the corner.
          </p>
        </ScrollReveal>
        <ScrollReveal delay={2} className="mx-auto mt-14 max-w-6xl">
          <AnalyticsPreview />
        </ScrollReveal>
        <div className="mx-auto mt-12 grid max-w-3xl gap-3 sm:grid-cols-2">
          {SHOP_QUESTIONS.map((q) => (
            <p key={q} className="rounded-2xl bg-night-800 px-5 py-4 text-[15px] text-fog-200">
              {q}
            </p>
          ))}
        </div>
        <ScrollReveal className="mt-12 text-center">
          <Link
            href="/business"
            className="group btn-pill inline-flex items-center gap-2.5 rounded-full bg-maroon px-9 py-4 text-[15px] font-medium tracking-[0.15em] text-white shadow-warm hover:bg-maroon-hover"
          >
            See everything shops get
            <ArrowRight className="h-4 w-4 transition-transform duration-500 ease-luxe group-hover:translate-x-1" />
          </Link>
        </ScrollReveal>
      </section>

      {/* ══ FOR CUSTOMERS — compact ══ */}
      <section className="px-6 py-28 sm:py-36">
        <Divider className="mx-auto mb-16 max-w-xs" />
        <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2 lg:gap-24">
          <ScrollReveal>
            <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-fog-500">For customers</p>
            <h2 className="mt-6 font-display text-[clamp(1.75rem,3.5vw,3rem)] font-normal leading-[1.12] tracking-[0.01em]">
              Rewards at the places you already love.
            </h2>
            <ol className="mt-8 space-y-5">
              {[
                ["Discover", "See where friends and locals actually go, on a map and in your feed."],
                ["Check in", "Scan at the counter. Your posts carry a verified visit badge."],
                ["Earn", "Collect toward rewards automatically. Free, no paper cards."],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-4">
                  <span className="mt-0.5 font-display text-lg text-maroon-300">{i + 1}</span>
                  <div>
                    <p className="text-[17px] font-medium text-fog-100">{t}</p>
                    <p className="mt-1 text-[15px] leading-[1.7] text-fog-300">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link
              href="/customer/explore"
              className="group btn-pill mt-10 inline-flex items-center gap-2.5 rounded-full bg-white px-8 py-3.5 text-[14px] font-medium tracking-[0.15em] text-black shadow-warm hover:bg-cream"
            >
              Open the app
              <ArrowRight className="h-4 w-4 transition-transform duration-500 ease-luxe group-hover:translate-x-1" />
            </Link>
          </ScrollReveal>
          <ScrollReveal delay={2}>
            <div className="relative mx-auto max-w-md">
              <Parallax className="aspect-[4/5] w-full rounded-[2.6rem]">
                <FadeImage
                  src="/site-images/photo-checkin.jpg"
                  alt="Scanning a QR code at a shop counter"
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </Parallax>
              <div className="absolute -bottom-14 right-2">
                <DeviceFrame className="-rotate-3">
                  <FadeImage
                    src="/site-images/app-feed.png"
                    alt="The Ventzon home feed"
                    className="h-full w-full object-cover object-top"
                  />
                </DeviceFrame>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ══ TRUST — what happens with the data, plainly ══ */}
      <section className="px-6 pb-28 pt-16 sm:pb-36">
        <ScrollReveal className="mx-auto max-w-3xl rounded-[2rem] bg-maroon-900 p-8 text-center sm:p-10">
          <p className="text-[15px] leading-[1.8] text-maroon-300">
            <span className="font-semibold">Fair to everyone.</span> Customers choose to join.
            Shops see their own customers, and anything from the app only as totals.
            Ventzon never sells customer data.
          </p>
        </ScrollReveal>
      </section>

      {/* ══ PRICING — the shop owner's decision ══ */}
      <PricingSection />

      {/* ══ FINAL CTA — editorial photo band ══ */}
      <section className="px-6 pb-8">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[3rem]">
          <FadeImage
            src="/site-images/photo-counter-wide.jpg"
            alt="Two shop owners looking at their dashboard at the counter"
            loading="lazy"
            className="h-[480px] w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-night-950/90 via-night-950/55 to-night-950/20" />
          <div className="absolute inset-x-0 bottom-0 p-8 text-center sm:p-14">
            <ScrollReveal>
              <h2 className="font-display text-[clamp(1.75rem,3.5vw,2.75rem)] font-normal leading-[1.12] tracking-[0.01em] text-white">
                For the places you love, and the people who run them.
              </h2>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/customer/explore"
                  className="group btn-pill inline-flex items-center gap-2.5 rounded-full bg-white px-9 py-4 text-[15px] font-medium tracking-[0.15em] text-black shadow-warm hover:bg-cream"
                >
                  Open the app
                  <ArrowRight className="h-4 w-4 transition-transform duration-500 ease-luxe group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/business"
                  className="text-[15px] font-medium text-white/90 underline decoration-white/40 underline-offset-8 transition-colors duration-300 hover:text-white"
                >
                  I run a shop
                </Link>
              </div>
              <p className="mt-8 text-sm text-white/70">Free for customers &middot; no download</p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}


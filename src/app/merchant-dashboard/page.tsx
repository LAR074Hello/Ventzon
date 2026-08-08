// src/app/merchant-dashboard/page.tsx
"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import Parallax from "@/components/Parallax";
import Divider from "@/components/Divider";
import LaptopFrame from "@/components/LaptopFrame";
import MerchantQR from "@/components/MerchantQR";
import MerchantAnalytics from "@/components/MerchantAnalytics";
import SiteFooter from "@/components/SiteFooter";
import {
  analyticsMock,
  previewOverview,
  previewCustomers,
  previewCampaign,
} from "@/lib/merchant-preview-data";

/* ═══════════════════════════════════════════════════════════════════
   Dashboard preview primitives — the real product's visual language
   (hairline borders, uppercase tracking eyebrows, extralight numerals)
   toned to the marketing palette. The screens read as the product.
   ═══════════════════════════════════════════════════════════════════ */

function DashEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-light uppercase tracking-[0.3em] text-fog-500">
      {children}
    </p>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-light uppercase tracking-[0.2em] text-fog-600">
      {children}
    </p>
  );
}

function DashCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-night-900/70 p-6 sm:p-8">
      <DashEyebrow>{label}</DashEyebrow>
      <p className="mt-4 text-4xl font-extralight tracking-tight text-fog-100 sm:text-5xl">
        {value}
      </p>
      <p className="mt-3 text-[12px] font-light text-fog-600">{sub}</p>
    </div>
  );
}

function statusChip(status: string) {
  const base =
    "rounded-full border px-2.5 py-0.5 text-[10px] font-light tracking-[0.12em]";
  const tones: Record<string, string> = {
    "REWARD READY": "border-amber-700/40 text-amber-400/90",
    ACTIVE: "border-white/10 text-fog-300",
    "OPTED OUT": "border-white/5 text-fog-600",
  };
  return `${base} ${tones[status] ?? tones.ACTIVE}`;
}

/* The small recurring label under each mockup: the numbers on this page
   are sample data, not a real customer's results. */
function ExampleNote() {
  return (
    <p className="mt-5 text-center text-[10px] font-light tracking-[0.3em] text-fog-600">
      EXAMPLE SCREEN · SAMPLE DATA
    </p>
  );
}


/* ── Hero mockup — the dashboard top ── */
function HeroDashboard() {
  return (
    <div className="flex h-full flex-col bg-night-950">
      {/* Dashboard top bar */}
      <div className="flex items-center justify-between gap-4 border-b border-white/5 px-6 py-3.5 sm:px-8 sm:py-4">
        <div className="min-w-0">
          <p className="truncate font-mono text-[11px] tracking-[0.2em] text-fog-100">
            {previewOverview.shopName.toUpperCase()}
          </p>
          <p className="mt-0.5 text-[10px] font-light text-fog-600">
            {previewOverview.meta}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-white/10 px-3 py-1 text-[10px] tracking-[0.15em] text-fog-300">
          EXAMPLE
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 p-6 sm:grid-cols-3 sm:gap-5 sm:p-8">
        <DashCard
          label="Total customers"
          value={previewOverview.totalCustomers}
          sub="All-time loyalty members"
        />
        <DashCard
          label="Check-ins today"
          value={previewOverview.checkinsToday}
          sub="Since midnight"
        />
        <DashCard
          label="Reward goal"
          value={previewOverview.rewardGoal}
          sub="Visits to earn a reward"
        />
      </div>

      {/* Insight */}
      <div className="mt-auto p-6 pt-0 sm:p-8 sm:pt-0">
        <div className="rounded-2xl border border-white/5 bg-night-900/70 p-5 sm:p-6">
          <DashEyebrow>This week&rsquo;s insight</DashEyebrow>
          <p className="mt-2 text-[13px] font-light leading-relaxed text-fog-300 sm:text-[14px]">
            {previewOverview.insight}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Analytics mockup — the real analytics component, scrollable ── */
function AnalyticsScreen() {
  return (
    <div className="relative h-full">
      <div className="h-full overflow-y-auto px-5 py-6 sm:px-8 sm:py-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <MerchantAnalytics shopSlug="northside-coffee" mockData={analyticsMock} />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-night-950 via-night-950/50 to-transparent" />
    </div>
  );
}

/* ── Customers mockup — the list that builds itself ── */
function CustomersPanel() {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/5 bg-night-900/70 shadow-warm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-7 py-5 sm:px-9">
        <div>
          <DashEyebrow>Customers</DashEyebrow>
          <p className="mt-1 text-[12px] font-light text-fog-600">
            1,284 loyalty members
          </p>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-light tracking-[0.15em] text-fog-300">
          CSV EXPORT
        </span>
      </div>
      <ul>
        {previewCustomers.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between gap-4 border-b border-white/5 px-7 py-4 last:border-0 sm:px-9"
          >
            <div className="flex min-w-0 items-center gap-4">
              <span className="truncate font-mono text-[13px] font-light text-fog-300">
                {c.contact}
              </span>
              <span className="hidden text-[11px] font-light text-fog-600 sm:inline">
                {c.visits} {c.visits === 1 ? "visit" : "visits"}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <span className="text-[11px] font-light text-fog-600">
                {c.lastVisit}
              </span>
              <span className={statusChip(c.status)}>{c.status}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Reward settings mockup ── */
function RewardPanel() {
  return (
    <div className="rounded-[2rem] border border-white/5 bg-night-900/70 p-8 shadow-warm sm:p-10">
      <DashEyebrow>Offer customers see</DashEyebrow>
      <div className="mt-7 space-y-6">
        <div>
          <FieldLabel>Shop name</FieldLabel>
          <p className="mt-1.5 text-[15px] font-normal text-fog-100">
            Northside Coffee
          </p>
        </div>
        <div>
          <FieldLabel>Reward title</FieldLabel>
          <p className="mt-1.5 text-[15px] font-normal text-fog-100">
            Free coffee after 8 visits
          </p>
        </div>
        <div>
          <FieldLabel>Reward type</FieldLabel>
          <div className="mt-2 flex gap-2">
            <span className="rounded-full bg-fog-100 px-4 py-1.5 text-[11px] font-light tracking-[0.1em] text-black">
              STAMPS
            </span>
            <span className="rounded-full border border-white/10 px-4 py-1.5 text-[11px] font-light tracking-[0.1em] text-fog-500">
              POINTS
            </span>
          </div>
        </div>
        <div>
          <FieldLabel>Reward details</FieldLabel>
          <p className="mt-1.5 text-[14px] font-light leading-relaxed text-fog-300">
            Show this message at the counter to redeem within 7 days.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── QR mockup — a real, scannable code ── */
function QRPanel() {
  return (
    <div className="flex flex-col items-center justify-center rounded-[2rem] border border-white/5 bg-night-900/70 p-8 text-center shadow-warm sm:p-10">
      <div className="rounded-2xl bg-white p-4 shadow-warm">
        <MerchantQR value="https://www.ventzon.com/customer/explore" size={168} />
      </div>
      <p className="mt-8 text-[11px] font-light uppercase tracking-[0.3em] text-fog-500">
        Join link
      </p>
      <p className="mt-2 font-mono text-[12px] font-light text-fog-300">
        ventzon.com/join/northside-coffee
      </p>
      <p className="mt-4 max-w-[240px] text-[12px] font-light leading-relaxed text-fog-600">
        Print it near the register. Customers scan to join in seconds.
      </p>
    </div>
  );
}

/* ── Growth + campaign mockups ── */
function GrowthBand() {
  const stats = [
    { value: "+12%", sub: "check-ins vs previous period" },
    { value: "+8%", sub: "new customers in the period" },
    { value: "96", sub: "loyal regulars earning rewards" },
    { value: "34%", sub: "rewards redeemed on time" },
  ];
  return (
    <div className="rounded-[2rem] border border-white/5 bg-night-900/70 p-10 shadow-warm sm:p-14">
      <DashEyebrow>Last 30 days</DashEyebrow>
      <div className="mt-10 grid gap-x-12 gap-y-10 sm:grid-cols-2">
        {stats.map((s) => (
          <div key={s.value}>
            <p className="text-4xl font-extralight tracking-tight text-fog-100 sm:text-5xl">
              {s.value}
            </p>
            <p className="mt-2 text-[12px] font-light text-fog-600">{s.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CampaignCard() {
  return (
    <div className="rounded-[2rem] border border-white/5 bg-night-900/70 p-10 shadow-warm sm:p-14">
      <div className="flex items-center justify-between gap-4">
        <DashEyebrow>Email campaign</DashEyebrow>
        <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] tracking-[0.15em] text-fog-300">
          YOUR LIST
        </span>
      </div>
      <div className="mt-8 space-y-6">
        <div>
          <FieldLabel>Subject</FieldLabel>
          <p className="mt-2 font-display text-2xl font-light tracking-[0.01em] text-fog-100">
            {previewCampaign.subject}
          </p>
        </div>
        <div>
          <FieldLabel>Message</FieldLabel>
          <p className="mt-2 text-[14px] font-light leading-relaxed text-fog-300">
            {previewCampaign.message}
          </p>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-white/5 pt-6">
          <span className="text-[11px] font-light tracking-[0.15em] text-fog-600">
            Emails only · No SMS
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-maroon px-4 py-2 text-[11px] font-light tracking-[0.15em] text-white">
            Send to your list
          </span>
        </div>
      </div>
    </div>
  );
}


export default function MerchantDashboardPage() {
  return (
    <main className="marketing min-h-screen bg-night-950 text-fog-100">
      {/* ══ HERO — the dashboard, front and centre ══ */}
      <section className="relative overflow-hidden px-6 pb-10 pt-28 sm:pt-36">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_0%,rgba(90,30,36,0.16),transparent)]" />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="animate-fade-in anim-delay-200 text-[11px] font-light tracking-[0.5em] text-fog-300 opacity-0">
            EXAMPLE SCREENS
          </p>
          <h1 className="animate-fade-in anim-delay-400 mt-8 font-display text-4xl font-light tracking-[0.01em] text-fog-100 opacity-0 sm:text-5xl lg:text-6xl">
            Your shop, in numbers.
          </h1>
          <p className="animate-fade-in-up anim-delay-600 mx-auto mt-8 max-w-xl text-base font-light leading-[1.8] text-fog-300 opacity-0 sm:text-lg">
            Every check-in, every reward, every return — on one quiet
            screen.
          </p>
          <div className="animate-fade-in-up anim-delay-800 mt-12 flex flex-col items-center justify-center gap-4 opacity-0 sm:flex-row">
            <Link
              href="/get-started"
              className="group btn-pill inline-flex items-center gap-3 rounded-full bg-maroon px-9 py-4 text-[13px] font-light tracking-[0.15em] text-white hover:bg-maroon-hover"
            >
              Start free
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-500 ease-luxe group-hover:translate-x-1" />
            </Link>
            <Link
              href="/pricing"
              className="text-[12px] font-light tracking-[0.15em] text-fog-300 transition-colors duration-500 ease-luxe hover:text-fog-100"
            >
              See pricing
            </Link>
          </div>
        </div>

        {/* The dashboard, large */}
        <div className="relative z-10 mx-auto mt-16 max-w-6xl sm:mt-20">
          <Parallax>
            <LaptopFrame>
              <HeroDashboard />
            </LaptopFrame>
          </Parallax>
          <p className="mx-auto mt-6 max-w-xl text-center text-[12px] font-light leading-relaxed text-fog-600">
            Example screen — sample data shown. Once your shop is live,
            this dashboard shows your own numbers.
          </p>
        </div>
      </section>

      {/* ══ ACT I — know your regulars ══ */}
      <section className="relative px-6 py-28 sm:py-40">
        <Divider className="mx-auto mb-16 max-w-xs" />
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-light tracking-[0.5em] text-fog-500">
            KNOW YOUR REGULARS
          </p>
          <h2 className="mt-6 font-display text-3xl font-light tracking-[0.01em] text-fog-100 sm:text-4xl">
            Know which customers keep coming back.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-[15px] font-light leading-[1.8] text-fog-300">
            Who returns, when they return, and what finally brings them
            back — visible at a glance.
          </p>
        </ScrollReveal>

        <div className="relative mt-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(90,30,36,0.14),transparent)]" />
          <ScrollReveal delay={2} className="relative z-10 mx-auto max-w-6xl">
            <Parallax>
              <LaptopFrame screenClassName="sm:h-[62vh] sm:max-h-[660px] sm:min-h-[460px]">
                <AnalyticsScreen />
              </LaptopFrame>
            </Parallax>
            <ExampleNote />
          </ScrollReveal>

          {/* Close-up stats */}
          <div className="relative z-10 mx-auto mt-14 grid max-w-4xl gap-4 sm:grid-cols-3">
            {[
              { value: "38%", sub: "of customers return" },
              { value: "2.6", sub: "average visits per customer" },
              { value: "34%", sub: "rewards redeemed" },
            ].map((s) => (
              <ScrollReveal key={s.value} delay={1}>
                <div className="rounded-2xl border border-white/5 bg-night-900/70 p-7 text-center">
                  <p className="font-display text-3xl font-light tracking-[0.01em] text-fog-100">
                    {s.value}
                  </p>
                  <p className="mt-2 text-[12px] font-light text-fog-600">
                    {s.sub}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>


      {/* ══ ACT II — reward loyalty automatically ══ */}
      <section className="relative px-6 py-28 sm:py-40">
        <Divider className="mx-auto mb-16 max-w-xs" />
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-light tracking-[0.5em] text-fog-500">
            REWARD LOYALTY
          </p>
          <h2 className="mt-6 font-display text-3xl font-light tracking-[0.01em] text-fog-100 sm:text-4xl">
            Reward loyalty automatically.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-[15px] font-light leading-[1.8] text-fog-300">
            Set a goal and a reward in minutes. Customers see the
            progress — you see the returns.
          </p>
        </ScrollReveal>

        <div className="mx-auto mt-20 grid max-w-5xl items-stretch gap-6 lg:grid-cols-2">
          <ScrollReveal>
            <RewardPanel />
          </ScrollReveal>
          <ScrollReveal delay={2}>
            <QRPanel />
          </ScrollReveal>
        </div>
        <ExampleNote />
      </section>

      {/* ══ ACT III — turn visitors into regulars ══ */}
      <section className="relative px-6 py-28 sm:py-40">
        <Divider className="mx-auto mb-16 max-w-xs" />
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-light tracking-[0.5em] text-fog-500">
            GROW YOUR LIST
          </p>
          <h2 className="mt-6 font-display text-3xl font-light tracking-[0.01em] text-fog-100 sm:text-4xl">
            Turn first-time visitors into regulars.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-[15px] font-light leading-[1.8] text-fog-300">
            Every check-in becomes a name you own — a list that builds
            itself while you run your shop.
          </p>
        </ScrollReveal>

        <div className="relative mt-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(90,30,36,0.12),transparent)]" />
          <ScrollReveal delay={2} className="relative z-10 mx-auto max-w-4xl">
            <CustomersPanel />
            <ExampleNote />
          </ScrollReveal>
        </div>
      </section>

      {/* ══ ACT IV — measure growth ══ */}
      <section className="relative px-6 py-28 sm:py-40">
        <Divider className="mx-auto mb-16 max-w-xs" />
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-light tracking-[0.5em] text-fog-500">
            MEASURE GROWTH
          </p>
          <h2 className="mt-6 font-display text-3xl font-light tracking-[0.01em] text-fog-100 sm:text-4xl">
            Measure growth with confidence.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-[15px] font-light leading-[1.8] text-fog-300">
            The trend is yours to read — and yours to act on.
          </p>
        </ScrollReveal>

        <div className="mx-auto mt-20 grid max-w-5xl items-stretch gap-6 lg:grid-cols-[1.2fr_1fr]">
          <ScrollReveal>
            <GrowthBand />
          </ScrollReveal>
          <ScrollReveal delay={2}>
            <CampaignCard />
          </ScrollReveal>
        </div>
        <ExampleNote />
      </section>

      {/* ══ CTA ══ */}
      <section className="px-6 py-32 text-center sm:py-44">
        <ScrollReveal className="mx-auto max-w-2xl">
          <h2 className="font-display text-3xl font-light tracking-[0.01em] text-fog-100 sm:text-4xl lg:text-5xl">
            Your regulars are out there.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-[15px] font-light leading-[1.8] text-fog-300">
            Set up your shop in minutes. No hardware, no contracts, no
            per-redemption fees.
          </p>
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/get-started"
              className="group btn-pill inline-flex items-center gap-3 rounded-full bg-maroon px-10 py-4 text-[13px] font-light tracking-[0.15em] text-white hover:bg-maroon-hover"
            >
              Create your shop
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-500 ease-luxe group-hover:translate-x-1" />
            </Link>
            <Link
              href="/pricing"
              className="text-[12px] font-light tracking-[0.15em] text-fog-300 transition-colors duration-500 ease-luxe hover:text-fog-100"
            >
              See pricing
            </Link>
          </div>
        </ScrollReveal>
      </section>

      <SiteFooter />
    </main>
  );
}


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
   Product mockups — rebuilt to mirror the redesigned merchant
   dashboard. Frames are wrapped in `merchant-dark`, so they render the
   product's dark theme on this always-dark marketing canvas. Every
   number is sample data and labeled as such.
   ═══════════════════════════════════════════════════════════════════ */

const previewSum = (pts: { count: number }[]) =>
  pts.reduce((a, b) => a + b.count, 0);

function ExampleNote() {
  return (
    <p className="mt-5 text-center text-[10px] font-medium uppercase tracking-[0.25em] text-taupe-faint">
      EXAMPLE SCREEN · SAMPLE DATA
    </p>
  );
}

function SampleStat({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="bg-surface-raised px-5 py-4 sm:px-6 sm:py-5">
      <p className="text-2xs font-medium uppercase tracking-caps text-muted">
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-semibold leading-none tracking-tight tabular-nums text-primary sm:text-3xl">
        {value}
      </p>
      <p className="mt-2 text-xs text-muted">{caption}</p>
    </div>
  );
}

function SampleHeader({
  title,
  meta,
  chip,
}: {
  title: string;
  meta: string;
  chip: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-subtle px-5 py-3.5 sm:px-6">
      <div className="min-w-0">
        <p className="truncate font-display text-base font-medium text-primary">
          {title}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted">{meta}</p>
      </div>
      <span className="shrink-0 rounded-md border border-subtle px-2 py-0.5 text-2xs font-medium uppercase tracking-caps text-muted">
        {chip}
      </span>
    </div>
  );
}

function statusChip(status: string) {
  const base =
    "inline-flex shrink-0 rounded-full border px-2 py-0.5 text-2xs font-medium uppercase tracking-caps";
  const tones: Record<string, string> = {
    "REWARD READY": "border-warn/40 bg-warn/10 text-warn",
    ACTIVE: "border-subtle text-secondary",
    "OPTED OUT": "border-subtle text-muted",
  };
  return `${base} ${tones[status] ?? tones.ACTIVE}`;
}

/* ── Hero mockup — the redesigned dashboard top ── */
function HeroDashboard() {
  return (
    <div className="merchant-dark flex h-full flex-col bg-surface text-primary">
      <SampleHeader
        title={previewOverview.shopName}
        meta={previewOverview.meta}
        chip="EXAMPLE"
      />
      <div className="flex-1 overflow-hidden rounded-b-xl">
        <div className="grid grid-cols-2 gap-px bg-subtle sm:grid-cols-4">
          <SampleStat
            label="Total members"
            value={previewOverview.totalCustomers}
            caption="All-time loyalty members"
          />
          <SampleStat
            label="New members today"
            value={previewOverview.newMembersToday}
            caption="Joined since midnight"
          />
          <SampleStat
            label="Check-ins today"
            value={previewOverview.checkinsToday}
            caption="Visits recorded since midnight"
          />
          <SampleStat
            label="Reward goal"
            value={previewOverview.rewardGoal}
            caption="Visits to earn a reward"
          />
        </div>

        <div className="border-t border-subtle bg-surface-raised px-5 py-4 sm:px-6">
          <p className="text-2xs font-medium uppercase tracking-caps text-muted">
            This week&rsquo;s insight
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-secondary">
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
    <div className="merchant-dark relative h-full overflow-y-auto bg-surface px-4 py-5 text-primary sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <MerchantAnalytics shopSlug="northside-coffee" mockData={analyticsMock} />
    </div>
  );
}

/* ── Customers mockup — the list that builds itself ── */
function CustomersPanel() {
  return (
    <div className="merchant-dark overflow-hidden rounded-xl border border-subtle bg-surface-raised text-primary">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-subtle px-5 py-4 sm:px-6">
        <div>
          <p className="text-2xs font-medium uppercase tracking-caps text-muted">
            Customers
          </p>
          <p className="mt-0.5 text-sm text-secondary">
            {previewOverview.totalCustomers} loyalty members
          </p>
        </div>
        <span className="rounded-md border border-subtle px-2 py-1 text-2xs font-medium uppercase tracking-caps text-muted">
          CSV export
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-subtle">
            <tr>
              <th className="px-5 py-2 text-2xs font-medium uppercase tracking-caps text-muted">
                Customer
              </th>
              <th className="px-5 py-2 text-right text-2xs font-medium uppercase tracking-caps text-muted">
                Visits
              </th>
              <th className="px-5 py-2 text-right text-2xs font-medium uppercase tracking-caps text-muted">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle">
            {previewCustomers.map((c) => (
              <tr key={c.id}>
                <td className="px-5 py-3 font-mono text-sm text-secondary">
                  {c.contact}
                </td>
                <td className="px-5 py-3 text-right text-sm font-medium tabular-nums text-primary">
                  {c.visits}
                </td>
                <td className="px-5 py-3 text-right">
                  <span className={statusChip(c.status)}>{c.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Reward settings mockup ── */
function RewardPanel() {
  return (
    <div className="merchant-dark rounded-xl border border-subtle bg-surface-raised p-6 text-primary sm:p-7">
      <p className="text-2xs font-medium uppercase tracking-caps text-muted">
        Offer customers see
      </p>
      <div className="mt-5 space-y-5">
        <div>
          <p className="text-xs font-medium text-secondary">Shop name</p>
          <p className="mt-1 text-base text-primary">Northside Coffee</p>
        </div>
        <div>
          <p className="text-xs font-medium text-secondary">Reward title</p>
          <p className="mt-1 text-base text-primary">Free coffee after 8 visits</p>
        </div>
        <div>
          <p className="text-xs font-medium text-secondary">Reward type</p>
          <div className="mt-2 flex gap-2">
            <span className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-inverse">
              STAMPS
            </span>
            <span className="rounded-md border border-subtle px-2.5 py-1 text-xs font-medium text-muted">
              POINTS
            </span>
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-secondary">Reward details</p>
          <p className="mt-1 text-sm leading-relaxed text-secondary">
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
    <div className="merchant-dark flex flex-col items-center justify-center rounded-xl border border-subtle bg-surface-raised p-7 text-center text-primary">
      <div className="rounded-lg bg-white p-3">
        <MerchantQR value="https://www.ventzon.com/customer/explore" size={160} />
      </div>
      <p className="mt-6 text-2xs font-medium uppercase tracking-caps text-muted">
        Join link
      </p>
      <p className="mt-1.5 font-mono text-sm text-secondary">
        ventzon.com/join/northside-coffee
      </p>
      <p className="mt-3 max-w-[240px] text-xs leading-relaxed text-muted">
        Print it near the register. Customers scan to join in seconds.
      </p>
    </div>
  );
}

/* ── Growth mockup — numbers derived from the sample source ── */
function GrowthBand() {
  const totalCheckins = previewSum(analyticsMock.checkins);
  const stats = [
    {
      label: "Check-ins",
      value: totalCheckins.toLocaleString("en-US"),
      caption: "Last 30 days",
    },
    {
      label: "Rewards redeemed",
      value: analyticsMock.rewards_redeemed_period.toLocaleString("en-US"),
      caption: `${analyticsMock.rewards_earned_period.toLocaleString("en-US")} earned in period`,
    },
    {
      label: "Retention",
      value: `${analyticsMock.retention_rate}%`,
      caption: "Customers who returned",
    },
    {
      label: "Loyal regulars",
      value: analyticsMock.loyal_count.toLocaleString("en-US"),
      caption: "Have earned a reward",
    },
  ];
  return (
    <div className="merchant-dark rounded-xl border border-subtle bg-surface-raised p-6 text-primary sm:p-8">
      <p className="text-2xs font-medium uppercase tracking-caps text-muted">
        Last 30 days
      </p>
      <div className="mt-6 grid gap-x-10 gap-y-7 sm:grid-cols-2">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-3xl font-semibold leading-none tracking-tight tabular-nums text-primary sm:text-4xl">
              {s.value}
            </p>
            <p className="mt-1.5 text-xs text-muted">{s.caption}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CampaignCard() {
  return (
    <div className="merchant-dark rounded-xl border border-subtle bg-surface-raised p-6 text-primary sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-2xs font-medium uppercase tracking-caps text-muted">
          Email campaign
        </p>
        <span className="rounded-md border border-subtle px-2 py-0.5 text-2xs font-medium uppercase tracking-caps text-muted">
          Your list
        </span>
      </div>
      <div className="mt-6 space-y-5">
        <div>
          <p className="text-xs font-medium text-secondary">Subject</p>
          <p className="mt-1 font-display text-xl font-medium tracking-tight text-primary">
            {previewCampaign.subject}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-secondary">Message</p>
          <p className="mt-1 text-sm leading-relaxed text-secondary">
            {previewCampaign.message}
          </p>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-subtle pt-5">
          <span className="text-xs text-muted">Emails only · No SMS</span>
          <span className="inline-flex items-center rounded-md bg-merchant px-3.5 py-1.5 text-xs font-medium text-white">
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
                    <ScrollReveal delay={2} className="relative z-10 mx-auto max-w-6xl">
            <Parallax>
              <LaptopFrame screenClassName="sm:h-[62vh] sm:max-h-[660px] sm:min-h-[460px]">
                <AnalyticsScreen />
              </LaptopFrame>
            </Parallax>
            <ExampleNote />
          </ScrollReveal>

          {/* Close-up stats */}
          <div className="relative z-10 mx-auto mt-12 grid max-w-4xl gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-3">
            {[
              { value: `${analyticsMock.retention_rate}%`, sub: "of customers return" },
              { value: String(analyticsMock.avg_visits_per_customer), sub: "average visits per customer" },
              { value: analyticsMock.rewards_redeemed_period.toLocaleString("en-US"), sub: "rewards redeemed in 30 days" },
            ].map((s) => (
              <div key={s.value} className="bg-night-950 px-6 py-5 text-center">
                <p className="text-3xl font-semibold leading-none tracking-tight tabular-nums text-fog-100">
                  {s.value}
                </p>
                <p className="mt-2 text-xs text-fog-500">{s.sub}</p>
              </div>
            ))}
          </div>
          <p className="relative z-10 mt-3 text-center text-[10px] font-medium uppercase tracking-[0.25em] text-taupe-faint">
            Sample figures
          </p>
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


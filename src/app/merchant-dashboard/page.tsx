// src/app/merchant-dashboard/page.tsx
"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import Divider from "@/components/Divider";
import MerchantQR from "@/components/MerchantQR";
import MerchantAnalytics from "@/components/MerchantAnalytics";
import SiteFooter from "@/components/SiteFooter";
import AnalyticsPreview from "@/components/AnalyticsPreview";
import {
  analyticsMock,
  audienceMock,
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

/* ── Analytics mockup — the real analytics component, unboxed ──
   No device bezel, no fixed height, no inner scroll: the dashboard
   renders at natural height, open on the marketing canvas. */
function AnalyticsScreen() {
  return (
    <div className="merchant-dark w-full text-primary">
      <MerchantAnalytics shopSlug="northside-coffee" mockData={analyticsMock} mockAudience={audienceMock} />
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


/* ── The questions an owner actually asks, each answered on the dashboard ── */
const OWNER_QUESTIONS = [
  {
    q: "Who are my regulars?",
    a: "See how many customers have earned a reward, how often they come back, and what they spend compared with everyone else.",
  },
  {
    q: "Who's slipping away?",
    a: "Ventzon flags customers who haven't been back in two weeks, so you can send a come-back offer before they're gone.",
  },
  {
    q: "When am I busy, and when am I not?",
    a: "Visits by day and hour show your rush and your slow spots, so you know exactly when a promotion would help.",
  },
  {
    q: "Did my promotion bring people back?",
    a: "After every email, see how many customers who got it came back within a week. No more guessing.",
  },
  {
    q: "Who are my customers?",
    a: "Age range, interests and what people come in for, from customers who choose to share it. Shown as totals, never as individuals.",
  },
  {
    q: "How did the visit go?",
    a: "Customers can leave an optional thumbs up or down after checking in. You see the percentage and anonymous notes.",
  },
  {
    q: "How did my month go?",
    a: "A one-page monthly report in plain English, ready to print or save as a PDF.",
  },
  {
    q: "Who's finding me on Ventzon?",
    a: "How many locals viewed your page in the Ventzon app and came in within a week, plus followers, posts and saves.",
  },
];

function PromoResultCard() {
  const p = analyticsMock.last_promo;
  return (
    <div className="merchant-dark rounded-xl border border-subtle bg-surface-raised p-6 text-primary sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-2xs font-medium uppercase tracking-caps text-muted">
          Promotion results
        </p>
        <span className="rounded-md border border-subtle px-2 py-0.5 text-2xs font-medium uppercase tracking-caps text-muted">
          7 days after sending
        </span>
      </div>
      <p className="mt-6 font-display text-xl font-medium tracking-tight text-primary">
        &ldquo;{p.name}&rdquo;
      </p>
      <p className="mt-1 text-xs text-muted">Sent to customers slipping away</p>
      <div className="mt-6 grid grid-cols-2 gap-6 border-t border-subtle pt-5">
        <div>
          <p className="text-3xl font-semibold leading-none tracking-tight tabular-nums">{p.reached}</p>
          <p className="mt-1.5 text-xs text-muted">Customers it went to</p>
        </div>
        <div>
          <p className="text-3xl font-semibold leading-none tracking-tight tabular-nums">{p.came_back}</p>
          <p className="mt-1.5 text-xs text-muted">Came back within a week</p>
        </div>
      </div>
    </div>
  );
}

function MonthlyReportCard() {
  const visits = previewSum(analyticsMock.checkins);
  const lines = [
    `${visits.toLocaleString("en-US")} visits from ${analyticsMock.new_vs_returning.total.toLocaleString("en-US")} customers, up ${analyticsMock.period_vs_previous.checkins_pct_change}% from last month.`,
    `${analyticsMock.new_vs_returning.new} new customers and ${analyticsMock.new_vs_returning.returning} returning.`,
    "Saturday was your busiest day, mostly in the morning rush. Monday was the slowest.",
    `Your promotion brought back ${analyticsMock.last_promo.came_back} of ${analyticsMock.last_promo.reached} customers within 7 days.`,
  ];
  return (
    <div className="rounded-xl bg-white p-6 text-neutral-900 shadow-warm sm:p-8">
      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-500">Monthly report</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{previewOverview.shopName}</p>
      <p className="text-sm text-neutral-500">July 2026</p>
      <div className="mt-5 space-y-1.5 border-t border-neutral-200 pt-5">
        {lines.map((l) => (
          <p key={l} className="text-[15px] leading-relaxed text-neutral-800">{l}</p>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { label: "Regulars", value: String(analyticsMock.loyal_count) },
          { label: "Avg spend", value: `$${analyticsMock.spend.avg_ticket.toFixed(2)}` },
          { label: "Followers", value: String(analyticsMock.on_ventzon.followers) },
        ].map((m) => (
          <div key={m.label} className="rounded-lg border border-neutral-200 p-3">
            <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-neutral-500">{m.label}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{m.value}</p>
          </div>
        ))}
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
            Know your customers.
          </h1>
          <p className="animate-fade-in-up anim-delay-600 mx-auto mt-8 max-w-xl text-base font-light leading-[1.8] text-fog-300 opacity-0 sm:text-lg">
            Ventzon turns every visit into customer analytics: who your
            regulars are, who&rsquo;s slipping away, when you&rsquo;re busy,
            and what actually brings people back.
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
        <div className="relative z-10 mx-auto mt-14 max-w-6xl sm:mt-16">
          <AnalyticsPreview />
          <p className="mx-auto mt-6 max-w-xl text-center text-[12px] font-light leading-relaxed text-fog-600">
            Example screen — sample data shown. Once your shop is live,
            this dashboard shows your own numbers.
          </p>
        </div>
      </section>

      {/* ══ THE QUESTIONS — what the analytics answer ══ */}
      <section className="relative px-6 py-24 sm:py-32">
        <Divider className="mx-auto mb-16 max-w-xs" />
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-light tracking-[0.5em] text-fog-500">
            CUSTOMER ANALYTICS
          </p>
          <h2 className="mt-6 font-display text-3xl font-light tracking-[0.01em] text-fog-100 sm:text-4xl">
            The questions every owner asks, answered.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-[15px] font-light leading-[1.8] text-fog-300">
            Every check-in adds to a clear picture of your customer base.
            Each answer comes with a button to act on it.
          </p>
        </ScrollReveal>
        <div className="mx-auto mt-16 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {OWNER_QUESTIONS.map((item, i) => (
            <ScrollReveal key={item.q} delay={((i % 3) + 1) as 1 | 2 | 3}>
              <div className="h-full rounded-2xl bg-night-800 p-6 shadow-warm">
                <h3 className="font-display text-lg font-medium text-fog-100">{item.q}</h3>
                <p className="mt-2.5 text-[14px] font-light leading-[1.7] text-fog-300">{item.a}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ══ ACT I — the dashboard ══ */}
      <section className="relative px-6 py-28 sm:py-40">
        <Divider className="mx-auto mb-16 max-w-xs" />
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-light tracking-[0.5em] text-fog-500">
            YOUR DASHBOARD
          </p>
          <h2 className="mt-6 font-display text-3xl font-light tracking-[0.01em] text-fog-100 sm:text-4xl">
            All of it, on one screen.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-[15px] font-light leading-[1.8] text-fog-300">
            Regulars, retention, busy times, rewards, promotion results and
            your reach in the Ventzon app, updated with every visit.
          </p>
        </ScrollReveal>

        <div className="relative mt-4 sm:mt-6">
          <AnalyticsScreen />
          <ExampleNote />
        </div>

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
      </section>


      {/* ══ ACT IV — act on it, and prove it worked ══ */}
      <section className="relative px-6 py-28 sm:py-40">
        <Divider className="mx-auto mb-16 max-w-xs" />
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-light tracking-[0.5em] text-fog-500">
            ACT ON IT
          </p>
          <h2 className="mt-6 font-display text-3xl font-light tracking-[0.01em] text-fog-100 sm:text-4xl">
            Send the right offer, then see if it worked.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-[15px] font-light leading-[1.8] text-fog-300">
            Email customers who are slipping away, or fill your slowest day.
            A week later, Ventzon shows how many came back.
          </p>
        </ScrollReveal>

        <div className="mx-auto mt-20 grid max-w-5xl items-stretch gap-6 lg:grid-cols-2">
          <ScrollReveal>
            <CampaignCard />
          </ScrollReveal>
          <ScrollReveal delay={2}>
            <PromoResultCard />
          </ScrollReveal>
        </div>
        <ExampleNote />
      </section>

      {/* ══ ACT V — the monthly report ══ */}
      <section className="relative px-6 py-28 sm:py-40">
        <Divider className="mx-auto mb-16 max-w-xs" />
        <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
          <ScrollReveal>
            <p className="text-[11px] font-light tracking-[0.5em] text-fog-500">
              MONTHLY REPORT
            </p>
            <h2 className="mt-6 font-display text-3xl font-light tracking-[0.01em] text-fog-100 sm:text-4xl">
              Your month, in plain English.
            </h2>
            <p className="mt-6 text-[15px] font-light leading-[1.8] text-fog-300">
              A one-page summary of how your month went: visits, new and
              returning customers, your busiest day and what your promotions
              did. Print it or save it as a PDF to share with a partner or
              your team.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={2}>
            <MonthlyReportCard />
          </ScrollReveal>
        </div>
        <ExampleNote />
      </section>

      {/* ══ PRIVACY — honest, specific commitments ══ */}
      <section className="relative px-6 py-24 sm:py-32">
        <ScrollReveal className="mx-auto max-w-3xl rounded-[2rem] bg-night-800 p-8 shadow-warm sm:p-10">
          <p className="text-[11px] font-light tracking-[0.5em] text-fog-500">
            YOUR CUSTOMERS&rsquo; TRUST
          </p>
          <h2 className="mt-5 font-display text-2xl font-light tracking-[0.01em] text-fog-100 sm:text-3xl">
            Insights without being creepy.
          </h2>
          <ul className="mt-6 space-y-3 text-[15px] font-light leading-[1.7] text-fog-300">
            <li>Customers choose to join by scanning your QR code.</li>
            <li>You see your own customers only. Other shops never see your data.</li>
            <li>What you learn from the Ventzon app is shown as totals, never as who someone is.</li>
            <li>Ventzon never sells customer data.</li>
          </ul>
        </ScrollReveal>
      </section>

      {/* ══ ACT II — reward loyalty automatically ══ */}
      <section className="relative px-6 py-28 sm:py-40">
        <Divider className="mx-auto mb-16 max-w-xs" />
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-light tracking-[0.5em] text-fog-500">
            SET UP IN MINUTES
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

      {/* ══ CTA ══ */}
      <section className="px-6 py-32 text-center sm:py-44">
        <ScrollReveal className="mx-auto max-w-2xl">
          <h2 className="font-display text-3xl font-light tracking-[0.01em] text-fog-100 sm:text-4xl lg:text-5xl">
            Start knowing your customers.
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


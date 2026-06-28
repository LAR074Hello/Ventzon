"use client";

import { useState, useEffect } from "react";
import { Check, Users, TrendingUp, QrCode, ArrowRight } from "lucide-react";
import Link from "next/link";
import MerchantAnalytics from "@/components/MerchantAnalytics";

/* ── Realistic 30-day mock analytics ── */
const MOCK_ANALYTICS = {
  shop: "demo",
  period: "30d",
  goal: 8,
  startDate: "2026-04-28",
  endDate: "2026-05-27",
  checkins: (() => {
    const days = [];
    const pattern = [4, 6, 8, 10, 18, 22, 12]; // Mon–Sun: big Fri/Sat
    const base = new Date("2026-04-28");
    for (let i = 0; i < 30; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const noise = Math.floor(Math.random() * 3) - 1;
      days.push({ date: d.toISOString().slice(0, 10), count: Math.max(0, pattern[d.getDay()] + noise) });
    }
    return days;
  })(),
  rewards: (() => {
    const days = [];
    const base = new Date("2026-04-28");
    for (let i = 0; i < 30; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      days.push({ date: d.toISOString().slice(0, 10), count: isWeekend ? Math.floor(Math.random() * 3) + 1 : Math.random() > 0.6 ? 1 : 0 });
    }
    return days;
  })(),
  retention_rate: 68,
  top_customers: [
    { id: "1", phone: "***-***-4821", email: null, visits: 14 },
    { id: "2", phone: "***-***-7703", email: null, visits: 11 },
    { id: "3", phone: null, email: "j***@gmail.com", visits: 9 },
    { id: "4", phone: "***-***-2290", email: null, visits: 8 },
    { id: "5", phone: "***-***-5518", email: null, visits: 7 },
  ],
  day_of_week: [
    { day: "Mon", count: 18 }, { day: "Tue", count: 24 }, { day: "Wed", count: 28 },
    { day: "Thu", count: 33 }, { day: "Fri", count: 52 }, { day: "Sat", count: 61 }, { day: "Sun", count: 38 },
  ],
  hour_of_day: [],
  time_blocks: [
    { label: "Morning", sublabel: "6 AM – 11 AM", count: 94 },
    { label: "Afternoon", sublabel: "12 PM – 5 PM", count: 138 },
    { label: "Evening", sublabel: "6 PM – 10 PM", count: 21 },
    { label: "Night", sublabel: "11 PM – 5 AM", count: 1 },
  ],
  new_vs_returning: { new: 14, returning: 42, total: 56 },
  avg_visits_per_customer: 4.8,
  lapsed_count: 7,
  total_unique_customers: 56,
  at_risk_count: 9,
  churned_count: 4,
  avg_lifetime_days: 38,
  loyal_count: 31,
  redemption_rate: 12.5,
  period_vs_previous: { checkins_pct_change: 18, customers_pct_change: 7 },
  lifecycle: { new: 14, returning: 11, loyal: 31 },
};

/* ── Mock data ── */
const DEMO_SHOP = {
  name: "Sunrise Coffee",
  deal_title: "Free medium coffee after 8 visits",
  deal_details: "Any handcrafted drink, hot or iced",
  goal: 8,
};

const MOCK_CUSTOMERS = [
  { contact: "***-***-4821", visits: 7, last: "Today" },
  { contact: "***-***-3302", visits: 5, last: "Yesterday" },
  { contact: "j***@gmail.com", visits: 8, last: "Today", redeemed: true },
  { contact: "***-***-9174", visits: 3, last: "2 days ago" },
  { contact: "***-***-6650", visits: 6, last: "Today" },
];

/* ── Helpers ── */
function formatPhoneDisplay(value: string) {
  const cleaned = value.replace(/\D/g, "");
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
}

function ProgressDots({ visits, goal }: { visits: number; goal: number }) {
  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      {Array.from({ length: goal }).map((_, i) => (
        <div
          key={i}
          className={`flex h-6 w-6 items-center justify-center rounded-full transition-all duration-500 ${
            i < visits ? "bg-[#ededed]" : "border border-[#333] bg-transparent"
          }`}
        >
          {i < visits && <Check className="h-3 w-3 text-black" />}
        </div>
      ))}
    </div>
  );
}

/* ── Merchant Dashboard Demo ── */
function MerchantDemo() {
  const [checkins, setCheckins] = useState(23);
  const [total, setTotal] = useState(1247);
  const [showCheckinFlash, setShowCheckinFlash] = useState(false);

  function simulateCheckin() {
    setShowCheckinFlash(true);
    setCheckins(c => c + 1);
    setTotal(t => t + 1);
    setTimeout(() => setShowCheckinFlash(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className={`rounded-2xl border p-6 transition-all duration-500 ${showCheckinFlash ? "border-emerald-700 bg-emerald-950/20" : "border-[#1a1a1a]"}`}>
          <p className="text-[10px] font-light tracking-[0.3em] text-[#555]">TOTAL CUSTOMERS</p>
          <div className="mt-3 text-4xl font-extralight tracking-tight text-white">{total.toLocaleString()}</div>
          <p className="mt-2 text-[11px] font-light text-[#444]">All-time loyalty members</p>
        </div>
        <div className={`rounded-2xl border p-6 transition-all duration-500 ${showCheckinFlash ? "border-emerald-700 bg-emerald-950/20" : "border-[#1a1a1a]"}`}>
          <p className="text-[10px] font-light tracking-[0.3em] text-[#555]">CHECK-INS TODAY</p>
          <div className="mt-3 text-4xl font-extralight tracking-tight text-white">{checkins}</div>
          <p className="mt-2 text-[11px] font-light text-[#444]">Since midnight</p>
        </div>
        <div className="rounded-2xl border border-[#1a1a1a] p-6">
          <p className="text-[10px] font-light tracking-[0.3em] text-[#555]">REWARD GOAL</p>
          <div className="mt-3 text-4xl font-extralight tracking-tight text-white">8</div>
          <p className="mt-2 text-[11px] font-light text-[#444]">Visits to earn reward</p>
        </div>
      </div>

      {/* Simulate check-in button */}
      <button
        onClick={simulateCheckin}
        className="w-full rounded-full border border-[#ededed] py-3.5 text-[12px] font-light tracking-[0.15em] text-[#ededed] transition-all duration-500 hover:bg-[#ededed] hover:text-black"
      >
        {showCheckinFlash ? "✓ Customer checked in!" : "Simulate a customer check-in →"}
      </button>

      {/* Customer list */}
      <div className="rounded-2xl border border-[#1a1a1a] overflow-hidden">
        <div className="border-b border-[#1a1a1a] px-5 py-4">
          <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">RECENT CUSTOMERS</p>
        </div>
        <div className="divide-y divide-[#111]">
          {MOCK_CUSTOMERS.map((c, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3.5">
              <div>
                <p className="text-[13px] font-light text-[#bbb]">{c.contact}</p>
                <p className="text-[11px] font-light text-[#444]">Last visit: {c.last}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {Array.from({ length: DEMO_SHOP.goal }).map((_, j) => (
                    <div key={j} className={`h-2 w-2 rounded-full ${j < c.visits ? "bg-[#ededed]" : "bg-[#1a1a1a]"}`} />
                  ))}
                </div>
                {c.redeemed && (
                  <span className="rounded-full bg-emerald-950/50 px-2 py-0.5 text-[10px] font-light tracking-[0.1em] text-emerald-400">REDEEMED</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* QR preview */}
      <div className="rounded-2xl border border-[#1a1a1a] p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#2a2a2a] bg-[#0a0a0a]">
            <QrCode className="h-6 w-6 text-[#555]" />
          </div>
          <div>
            <p className="text-[13px] font-light text-[#bbb]">Your QR code is ready to print</p>
            <p className="mt-1 text-[12px] font-light text-[#555]">Post it at your register — customers scan it to join and check in.</p>
          </div>
        </div>
      </div>

      {/* Analytics */}
      <MerchantAnalytics shopSlug="demo" mockData={MOCK_ANALYTICS} />
    </div>
  );
}

/* ── Customer Check-in Demo ── */
function CustomerDemo() {
  const [contactMethod, setContactMethod] = useState<"phone" | "email">("phone");
  const [phoneRaw, setPhoneRaw] = useState("");
  const [emailRaw, setEmailRaw] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<"progress" | "reward" | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    // Alternate between progress and reward for demo effect
    setResult(Math.random() > 0.4 ? "progress" : "reward");
    setSubmitting(false);
  }

  function reset() {
    setResult(null);
    setPhoneRaw("");
    setEmailRaw("");
  }

  return (
    <div className="flex flex-col items-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#1a1a1a] bg-[#0a0a0a]">
        <span className="text-xl font-extralight text-[#555]">S</span>
      </div>
      <h2 className="mt-4 text-[13px] font-light tracking-[0.3em] text-[#ededed]">
        {DEMO_SHOP.name.toUpperCase()}
      </h2>

      {!result ? (
        <>
          <div className="mt-5 rounded-lg border border-[#1a1a1a] px-5 py-3 text-center">
            <p className="text-[13px] font-light text-[#888]">{DEMO_SHOP.deal_title}</p>
            <p className="mt-1 text-[12px] font-light text-[#555]">{DEMO_SHOP.deal_details}</p>
          </div>

          <form onSubmit={onSubmit} className="mt-8 w-full max-w-sm">
            <div className="mb-5 flex rounded-full border border-[#1a1a1a] p-1">
              {(["phone", "email"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setContactMethod(m)}
                  className={`flex-1 rounded-full py-2.5 text-[11px] font-light tracking-[0.15em] transition-all duration-300 ${contactMethod === m ? "bg-[#ededed] text-black" : "text-[#555]"}`}
                >
                  {m.toUpperCase()}
                </button>
              ))}
            </div>

            {contactMethod === "phone" ? (
              <input
                type="tel"
                value={phoneRaw}
                onChange={(e) => setPhoneRaw(formatPhoneDisplay(e.target.value))}
                placeholder="(555) 123-4567"
                maxLength={14}
                className="w-full rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-4 text-center text-[18px] font-light text-[#ededed] outline-none placeholder:text-[#333] focus:border-[#444]"
                disabled={submitting}
              />
            ) : (
              <input
                type="email"
                value={emailRaw}
                onChange={(e) => setEmailRaw(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-4 text-center text-[18px] font-light text-[#ededed] outline-none placeholder:text-[#333] focus:border-[#444]"
                disabled={submitting}
              />
            )}

            <button
              type="submit"
              disabled={submitting || (contactMethod === "phone" ? !phoneRaw.trim() : !emailRaw.trim())}
              className="mt-5 w-full rounded-full border border-[#ededed] py-4 text-[12px] font-light tracking-[0.2em] text-[#ededed] transition-all duration-500 hover:bg-[#ededed] hover:text-black disabled:opacity-30"
            >
              {submitting ? "CHECKING IN…" : "CHECK IN"}
            </button>
          </form>
        </>
      ) : (
        <div className="mt-8 w-full max-w-sm rounded-xl border border-[#1a1a1a] p-8 text-center">
          {result === "reward" ? (
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
              <Check className="h-7 w-7 text-emerald-400" />
            </div>
          ) : (
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#1a1a1a] bg-[#0a0a0a]">
              <span className="font-mono text-[18px] font-light text-[#ededed]">5</span>
            </div>
          )}
          <p className="mt-5 text-[16px] font-extralight text-[#ededed]">
            {result === "reward" ? "🎉 You earned a free coffee!" : "Checked in! 3 more visits to go."}
          </p>
          <div className="mt-5">
            <ProgressDots visits={result === "reward" ? 8 : 5} goal={8} />
          </div>
          {result === "reward" && (
            <div className="mt-5 rounded-lg border border-emerald-900/30 bg-emerald-950/20 px-4 py-3">
              <p className="text-[12px] font-light tracking-[0.15em] text-emerald-300/80">SHOW THIS TO THE CASHIER TO REDEEM</p>
            </div>
          )}
          <button onClick={reset} className="mt-6 w-full rounded-full border border-[#ededed] py-3.5 text-[12px] font-light tracking-[0.15em] text-[#ededed] transition-all duration-500 hover:bg-[#ededed] hover:text-black">
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Main Demo Page ── */
export default function DemoPage() {
  const [view, setView] = useState<"merchant" | "customer">("merchant");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'customer') setView('customer');
  }, []);

  return (
    <main className="min-h-screen bg-black text-[#ededed]">

      {/* Banner */}
      <div className="border-b border-[#1a1a1a] bg-[#050505] px-4 py-3 text-center">
        <p className="text-[11px] font-light tracking-[0.15em] text-[#888]">
          LIVE DEMO — NO ACCOUNT REQUIRED
        </p>
        <p className="mt-0.5 text-[11px] font-light text-[#555]">
          See exactly what you and your customers experience.
        </p>
      </div>

      <div className="mx-auto max-w-2xl px-6 pb-20 pt-12">

        {/* View toggle */}
        <div className="flex rounded-full border border-[#1a1a1a] p-1">
          <button
            onClick={() => setView("merchant")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-[11px] font-light tracking-[0.15em] transition-all duration-300 ${view === "merchant" ? "bg-[#ededed] text-black" : "text-[#555] hover:text-[#ededed]"}`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            MERCHANT VIEW
          </button>
          <button
            onClick={() => setView("customer")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-[11px] font-light tracking-[0.15em] transition-all duration-300 ${view === "customer" ? "bg-[#ededed] text-black" : "text-[#555] hover:text-[#ededed]"}`}
          >
            <Users className="h-3.5 w-3.5" />
            CUSTOMER VIEW
          </button>
        </div>

        {/* Label */}
        <p className="mt-5 text-center text-[12px] font-light text-[#555]">
          {view === "merchant"
            ? "This is your dashboard — see check-ins, customers, and stats in real time."
            : "This is what your customers see when they scan your QR code."}
        </p>

        {/* Content */}
        <div className="mt-8">
          {view === "merchant" ? <MerchantDemo /> : <CustomerDemo />}
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-2xl border border-[#1e1e1e] bg-[#050505] p-8 text-center">
          <p className="text-[11px] font-light tracking-[0.4em] text-[#555]">READY TO START?</p>
          <h2 className="mt-4 text-2xl font-extralight text-white">Get your shop on Ventzon.</h2>
          <p className="mt-3 text-[13px] font-light text-[#555]">5 minutes to set up. $25/month. Cancel anytime.</p>
          <Link
            href="/get-started"
            className="mt-6 inline-flex items-center gap-3 rounded-full border border-[#ededed] px-8 py-3.5 text-[12px] font-light tracking-[0.15em] text-[#ededed] transition-all duration-500 hover:bg-[#ededed] hover:text-black"
          >
            Get started free
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </main>
  );
}

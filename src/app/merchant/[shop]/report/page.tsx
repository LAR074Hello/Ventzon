"use client";

import { safeJson } from "@/lib/safe-json";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

/* Monthly report: a one-page summary an owner can print or save as PDF.
   Built from /api/merchant/analytics?month=YYYY-MM. Counts only, no
   customer identities. */

type Report = {
  startDate: string;
  endDate: string;
  checkins: { date: string; count: number }[];
  new_vs_returning: { new: number; returning: number; total: number };
  total_unique_customers: number;
  loyal_count: number;
  at_risk_count: number;
  lapsed_count: number;
  avg_visits_per_customer: number | null;
  rewards_earned_period: number;
  rewards_redeemed_period: number;
  redemption_rate: number | null;
  day_of_week: { day: string; count: number }[];
  time_blocks: { label: string; sublabel: string; count: number }[];
  period_vs_previous: { checkins_pct_change: number | null; customers_pct_change: number | null };
  spend?: { avg_ticket: number | null; visits_with_amount: number; loyal_avg_ticket: number | null; other_avg_ticket: number | null };
  last_promo?: { name: string | null; sent_at: string; reached: number; came_back: number; window_days: number } | null;
  on_ventzon?: { followers: number; new_followers: number; followers_not_visited: number; posts: number; likes: number; saves: number } | null;
};

const DAY_FULL: Record<string, string> = {
  Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday",
};

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
const n = (v: number | null | undefined) => (v == null ? "—" : v.toLocaleString("en-US"));
const money = (v: number | null | undefined) =>
  v == null ? "—" : v.toLocaleString("en-US", { style: "currency", currency: "USD" });

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-subtle p-4 print:border-neutral-300">
      <p className="text-2xs font-medium uppercase tracking-caps text-muted print:text-neutral-500">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight text-primary tabular-nums print:text-black">{value}</p>
      {sub && <p className="mt-1 text-[11px] text-muted print:text-neutral-500">{sub}</p>}
    </div>
  );
}

export default function MonthlyReportPage() {
  const params = useParams();
  const shopSlug = String(params?.shop ?? "").toLowerCase();

  const months = useMemo(() => {
    const out: string[] = [];
    const d = new Date();
    for (let i = 0; i < 12; i++) {
      out.push(monthKey(new Date(d.getFullYear(), d.getMonth() - i, 1)));
    }
    return out;
  }, []);
  const [month, setMonth] = useState(months[0]);
  const [data, setData] = useState<Report | null>(null);
  const [shopName, setShopName] = useState<string>("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shopSlug) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `/api/merchant/analytics?shop=${encodeURIComponent(shopSlug)}&month=${month}`,
          { cache: "no-store" }
        );
        const json = await safeJson(res);
        if (!res.ok) throw new Error(json?.error ?? "Couldn't load the report");
        if (!cancelled) setData(json as Report);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Couldn't load the report");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [shopSlug, month]);

  useEffect(() => {
    if (!shopSlug) return;
    fetch(`/api/join/settings?shop_slug=${encodeURIComponent(shopSlug)}`, { cache: "no-store" })
      .then((r) => safeJson(r))
      .then((j) => setShopName(j?.settings?.shop_name ?? shopSlug))
      .catch(() => setShopName(shopSlug));
  }, [shopSlug]);

  const visits = data ? data.checkins.reduce((s, d) => s + d.count, 0) : 0;
  const busiest = data && visits > 0
    ? data.day_of_week.reduce((a, b) => (b.count > a.count ? b : a), data.day_of_week[0])
    : null;
  const slowest = data && visits > 0
    ? data.day_of_week.reduce((a, b) => (b.count < a.count ? b : a), data.day_of_week[0])
    : null;
  const peakBlock = data && visits > 0
    ? data.time_blocks.reduce((a, b) => (b.count > a.count ? b : a), data.time_blocks[0])
    : null;
  const change = data?.period_vs_previous.checkins_pct_change ?? null;

  // The headline: a few plain sentences an owner can read in ten seconds.
  const headline: string[] = [];
  if (data) {
    if (visits === 0) {
      headline.push("No check-ins this month yet.");
    } else {
      headline.push(
        `${n(visits)} visits from ${n(data.new_vs_returning.total)} customers` +
          (change != null ? `, ${change >= 0 ? "up" : "down"} ${Math.abs(change)}% from last month.` : ".")
      );
      headline.push(`${n(data.new_vs_returning.new)} new customers and ${n(data.new_vs_returning.returning)} returning.`);
      if (busiest && slowest) {
        headline.push(
          `${DAY_FULL[busiest.day] ?? busiest.day} was your busiest day${peakBlock ? `, mostly in the ${peakBlock.label.toLowerCase()}` : ""}. ${DAY_FULL[slowest.day] ?? slowest.day} was the slowest.`
        );
      }
    }
    if (data.last_promo && data.last_promo.sent_at.slice(0, 7) === month) {
      headline.push(
        `Your promotion${data.last_promo.name ? ` "${data.last_promo.name}"` : ""} brought back ${n(data.last_promo.came_back)} of ${n(data.last_promo.reached)} customers within ${data.last_promo.window_days} days.`
      );
    }
  }

  return (
    <main className="merchant-dark min-h-screen bg-surface px-4 py-8 text-primary sm:px-8 print:bg-white print:p-0 print:text-black">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link href={`/merchant/${encodeURIComponent(shopSlug)}`} className="text-xs text-muted hover:text-primary">
            Back to dashboard
          </Link>
          <div className="flex items-center gap-3">
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              aria-label="Report month"
              className="rounded-full border border-subtle bg-surface-raised px-3 py-1.5 text-xs text-primary outline-none focus:border-strong"
            >
              {months.map((m) => (
                <option key={m} value={m}>{monthLabel(m)}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-full border border-strong px-4 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-inverse"
            >
              Print or save as PDF
            </button>
          </div>
        </div>

        <header className="mt-8 border-b border-subtle pb-6 print:mt-0 print:border-neutral-300">
          <p className="text-2xs font-medium uppercase tracking-caps text-muted print:text-neutral-500">Monthly report</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{shopName || " "}</h1>
          <p className="mt-1 text-sm text-muted print:text-neutral-600">{monthLabel(month)}</p>
        </header>

        {error && <p className="mt-6 text-sm text-danger">{error}</p>}
        {loading && !data && <p className="mt-6 text-sm text-muted">Loading…</p>}

        {data && (
          <>
            <section className="mt-6 space-y-1.5">
              {headline.map((line) => (
                <p key={line} className="text-base leading-relaxed text-secondary print:text-neutral-800">{line}</p>
              ))}
            </section>

            <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat label="Visits" value={n(visits)} sub={change != null ? `${change >= 0 ? "+" : ""}${change}% vs last month` : undefined} />
              <Stat label="Customers" value={n(data.new_vs_returning.total)} sub={`${n(data.new_vs_returning.new)} new`} />
              <Stat label="Avg visits each" value={data.avg_visits_per_customer != null ? String(data.avg_visits_per_customer) : "—"} />
              <Stat label="Regulars" value={n(data.loyal_count)} sub="Earned a reward, all time" />
              <Stat label="Slipping away" value={n(data.at_risk_count + data.lapsed_count)} sub="No visit in 2 to 8 weeks" />
              <Stat
                label="Rewards used"
                value={`${n(data.rewards_redeemed_period)} of ${n(data.rewards_earned_period)}`}
                sub={data.redemption_rate != null ? `${data.redemption_rate}% redemption` : undefined}
              />
              {data.spend?.avg_ticket != null && (
                <Stat label="Average spend" value={money(data.spend.avg_ticket)} sub={`From ${n(data.spend.visits_with_amount)} visits with an amount`} />
              )}
              {data.on_ventzon && (
                <>
                  <Stat label="Ventzon followers" value={n(data.on_ventzon.followers)} sub={`+${n(data.on_ventzon.new_followers)} this month`} />
                  <Stat label="Posts about you" value={n(data.on_ventzon.posts)} sub={`${n(data.on_ventzon.likes + data.on_ventzon.saves)} likes and saves`} />
                </>
              )}
            </section>

            <footer className="mt-10 border-t border-subtle pt-4 text-[11px] text-muted print:border-neutral-300 print:text-neutral-500">
              {data.startDate} to {data.endDate} · Generated by Ventzon · ventzon.com
            </footer>
          </>
        )}
      </div>
    </main>
  );
}

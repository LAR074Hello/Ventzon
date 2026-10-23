"use client";

import { safeJson } from "@/lib/safe-json";
import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type DataPoint = { date: string; count: number };
type DayPoint = { day: string; count: number };
type TimeBlock = { label: string; sublabel: string; count: number };
type TopCustomer = {
  id: string;
  phone: string | null;
  email: string | null;
  visits: number;
};

type AnalyticsResponse = {
  shop: string;
  period: string;
  goal: number;
  startDate: string;
  endDate: string;
  checkins: DataPoint[];
  rewards_earned: DataPoint[];
  rewards_redeemed: DataPoint[];
  rewards_earned_period: number;
  rewards_redeemed_period: number;
  rewards_pending_period: number;
  retention_rate: number | null;
  top_customers: TopCustomer[];
  day_of_week: DayPoint[];
  hour_of_day: { hour: number; label: string; count: number }[];
  time_blocks: TimeBlock[];
  new_vs_returning: { new: number; returning: number; total: number };
  avg_visits_per_customer: number | null;
  lapsed_count: number;
  total_unique_customers: number;
  at_risk_count: number;
  churned_count: number;
  avg_lifetime_days: number | null;
  loyal_count: number;
  redemption_rate: number | null;
  period_vs_previous: {
    checkins_pct_change: number | null;
    customers_pct_change: number | null;
  };
  lifecycle: { new: number; returning: number; loyal: number };
  reward_mode?: "stamps" | "points";
  spend?: {
    avg_ticket: number | null;
    total: number;
    visits_with_amount: number;
    loyal_avg_ticket: number | null;
    other_avg_ticket: number | null;
  };
  last_promo?: {
    name: string | null;
    audience: string;
    sent_at: string;
    reached: number;
    came_back: number;
    window_days: number;
    window_complete: boolean;
  } | null;
  on_ventzon?: {
    followers: number;
    new_followers: number;
    followers_not_visited: number;
    posts: number;
    posters: number;
    likes: number;
    saves: number;
    comments: number;
  } | null;
};

export type CampaignAudience = "all" | "slipping" | "lapsed";
export type CampaignGoal = "slow_day" | "win_back" | "appreciation";

// Below this many customers the question cards would be guessing, so the
// dashboard shows progress toward the first insights instead.
const INSIGHTS_MIN_CUSTOMERS = 10;

const DAY_FULL: Record<string, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

function formatMoney(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

const PERIODS = [
  { value: "1d", label: "1D" },
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "60d", label: "60D" },
  { value: "365d", label: "1Y" },
  { value: "all", label: "All" },
];

const PERIOD_CAPTION: Record<string, string> = {
  "1d": "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "60d": "Last 60 days",
  "365d": "Last 12 months",
  all: "All time",
};

type ChartTokens = {
  grid: string;
  axis: string;
  accent: string;
  emphasis: string;
  muted: string;
};

// Pre-hydration fallback only — real values come from the CSS chart tokens.
const FALLBACK_CHART: ChartTokens = {
  grid: "#e3e0da",
  axis: "#8a8078",
  accent: "#7a1f2b",
  emphasis: "#16181c",
  muted: "#c9c3ba",
};

function readChartTokens(): ChartTokens {
  const root =
    document.querySelector<HTMLElement>(".merchant-dark") ??
    document.documentElement;
  const cs = getComputedStyle(root);
  const pick = (name: string, fallback: string) =>
    cs.getPropertyValue(name).trim() || fallback;
  return {
    grid: pick("--chart-grid", FALLBACK_CHART.grid),
    axis: pick("--chart-axis", FALLBACK_CHART.axis),
    accent: pick("--chart-accent", FALLBACK_CHART.accent),
    emphasis: pick("--chart-emphasis", FALLBACK_CHART.emphasis),
    muted: pick("--chart-muted", FALLBACK_CHART.muted),
  };
}

function useChartTokens(): ChartTokens {
  const [tokens, setTokens] = useState<ChartTokens>(FALLBACK_CHART);
  useEffect(() => {
    // Deferred one frame: the first client paint keeps the SSR-safe fallback
    // so hydration matches, then swaps in the resolved CSS tokens.
    const raf = requestAnimationFrame(() => setTokens(readChartTokens()));
    const observer = new MutationObserver(() => setTokens(readChartTokens()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);
  return tokens;
}
/* ------------------------------------------------------------------ */
/*  Formatting                                                         */
/* ------------------------------------------------------------------ */

function formatDateLabel(dateStr: string) {
  try {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function pickTickInterval(count: number): number {
  if (count <= 7) return 1;
  if (count <= 30) return 5;
  if (count <= 60) return 10;
  if (count <= 120) return 15;
  return 30;
}

function formatCount(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-US");
}

/* ------------------------------------------------------------------ */
/*  Small UI primitives                                                */
/* ------------------------------------------------------------------ */

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-2xs font-medium uppercase tracking-caps text-muted">
      {children}
    </p>
  );
}

function PanelTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="mt-0.5 text-sm font-semibold tracking-tight text-primary">
      {children}
    </h3>
  );
}

function Delta({ pct }: { pct: number | null }) {
  if (pct === null || !Number.isFinite(pct)) return null;
  const up = pct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-px text-[11px] font-medium tabular-nums ${
        up ? "bg-positive/10 text-positive" : "bg-danger/10 text-danger"
      }`}
    >
      {up ? "↑" : "↓"}
      {Math.abs(pct)}%
    </span>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  valueLabel,
  formatLabel,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  valueLabel: string;
  formatLabel?: (l: string) => string;
}) {
  if (!active || !payload?.length) return null;
  const displayLabel = formatLabel ? formatLabel(String(label)) : String(label);
  return (
    <div className="rounded-lg border border-subtle bg-surface-raised px-3 py-2 text-xs">
      <p className="font-medium text-primary">{displayLabel}</p>
      <p className="mt-0.5 tabular-nums text-muted">
        {formatCount(payload[0].value)} {valueLabel}
      </p>
    </div>
  );
}

function PeriodPills({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-lg border border-subtle bg-surface-raised p-0.5">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            value === p.value
              ? "bg-primary text-inverse"
              : "text-muted hover:text-primary"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

function CardAction({
  onClick,
  children,
}: {
  onClick?: () => void;
  children: ReactNode;
}) {
  if (!onClick) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-4 inline-flex min-h-[36px] items-center self-start rounded-full border border-strong px-3.5 py-1.5 text-2xs font-medium tracking-caps text-secondary transition-colors duration-300 hover:bg-primary hover:text-inverse"
    >
      {children}
    </button>
  );
}

function QuestionCard({
  question,
  value,
  line,
  action,
}: {
  question: string;
  value: string;
  line: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-subtle bg-surface-raised p-4 sm:p-5">
      <SectionLabel>{question}</SectionLabel>
      <p className="mt-2 text-3xl font-semibold leading-none tracking-tight text-primary tabular-nums">
        {value}
      </p>
      <p className="mt-2 flex-1 text-xs leading-relaxed text-muted">{line}</p>
      {action}
    </div>
  );
}

function Panel({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border border-subtle bg-surface-raised p-4 sm:p-5 ${className}`}
    >
      {children}
    </div>
  );
}
/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function MerchantAnalytics({
  shopSlug,
  mockData,
  onStartCampaign,
  onEditReward,
  onShowCustomers,
}: {
  shopSlug: string;
  mockData?: AnalyticsResponse;
  /** Opens the campaign composer for an audience, with an AI draft goal. */
  onStartCampaign?: (audience: CampaignAudience, goal: CampaignGoal) => void;
  onEditReward?: () => void;
  onShowCustomers?: () => void;
}) {
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState<AnalyticsResponse | null>(mockData ?? null);
  const [loading, setLoading] = useState(!mockData);
  const [error, setError] = useState("");
  const chart = useChartTokens();

  const fetchAnalytics = useCallback(async () => {
    if (!shopSlug) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/merchant/analytics?shop=${encodeURIComponent(shopSlug)}&period=${encodeURIComponent(period)}`,
        { cache: "no-store" }
      );
      const json = await safeJson(res);
      if (!res.ok) throw new Error(json?.error ?? "Failed to load analytics");
      setData(json as AnalyticsResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [shopSlug, period]);

  useEffect(() => {
    if (mockData || !shopSlug) return;
    const id = window.setTimeout(() => {
      void fetchAnalytics();
    }, 0);
    return () => window.clearTimeout(id);
  }, [fetchAnalytics, mockData, shopSlug]);

  const checkins = data?.checkins ?? [];
  const tickInterval = pickTickInterval(checkins.length);
  const totalCheckins = checkins.reduce((s, d) => s + d.count, 0);
  const redeemedSeries = data?.rewards_redeemed ?? [];
  const retentionRate = data?.retention_rate ?? null;
  const topCustomers = data?.top_customers ?? [];
  const dayOfWeek = data?.day_of_week ?? [];
  const timeBlocks = data?.time_blocks ?? [];
  const newVsReturning = data?.new_vs_returning ?? { new: 0, returning: 0, total: 0 };
  const avgVisits = data?.avg_visits_per_customer ?? null;
  const avgLifetimeDays = data?.avg_lifetime_days ?? null;
  const totalUnique = data?.total_unique_customers ?? 0;
  const atRisk = data?.at_risk_count ?? 0;
  const lapsed = data?.lapsed_count ?? 0;
  const churned = data?.churned_count ?? 0;
  const lifecycle = data?.lifecycle ?? { new: 0, returning: 0, loyal: 0 };
  const rewardsEarnedPeriod = data?.rewards_earned_period ?? 0;
  const rewardsRedeemedPeriod = data?.rewards_redeemed_period ?? 0;
  const rewardsPending = data?.rewards_pending_period ?? 0;
  const redemptionRate = data?.redemption_rate ?? null;
  const periodVsPrev = data?.period_vs_previous ?? {
    checkins_pct_change: null,
    customers_pct_change: null,
  };

  const peakDay = dayOfWeek.length
    ? dayOfWeek.reduce((a, b) => (b.count > a.count ? b : a), dayOfWeek[0])
    : null;
  const peakBlock = timeBlocks.length
    ? timeBlocks.reduce((a, b) => (b.count > a.count ? b : a), timeBlocks[0])
    : null;
  const anyCheckins = totalCheckins > 0;
  const anyRedeemed = redeemedSeries.some((d) => d.count > 0);
  const busyTotal = dayOfWeek.reduce((s, d) => s + d.count, 0);
  const periodCaption = PERIOD_CAPTION[period] ?? "In period";

  // ── Question cards ──
  const loyalCount = data?.loyal_count ?? 0;
  const spend = data?.spend;
  const lastPromo = data?.last_promo ?? null;
  const slipping = atRisk + lapsed;
  const slowDay =
    busyTotal > 0 && dayOfWeek.length
      ? dayOfWeek.reduce((a, b) => (b.count < a.count ? b : a), dayOfWeek[0])
      : null;
  const showCards = !loading && totalUnique >= INSIGHTS_MIN_CUSTOMERS;
  const showProgress = !loading && !error && totalUnique < INSIGHTS_MIN_CUSTOMERS;
  const progressPct = Math.min(100, Math.round((totalUnique / INSIGHTS_MIN_CUSTOMERS) * 100));

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <SectionLabel>Analytics</SectionLabel>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-primary sm:text-xl">
            Performance
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {!mockData && (
            <Link
              href={`/merchant/${encodeURIComponent(shopSlug)}/report`}
              className="text-xs font-medium text-muted transition-colors hover:text-primary"
            >
              Monthly report
            </Link>
          )}
          <PeriodPills value={period} onChange={setPeriod} />
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-danger/30 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* ── At a glance: five owner questions, each with one action ── */}
      {showProgress && (
        <div className="mt-5 rounded-xl border border-subtle bg-surface-raised p-5 sm:p-6">
          <SectionLabel>At a glance</SectionLabel>
          <p className="mt-1.5 text-sm font-semibold tracking-tight text-primary">
            Your first insights appear after {INSIGHTS_MIN_CUSTOMERS} customers check in
          </p>
          <div
            className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={INSIGHTS_MIN_CUSTOMERS}
            aria-valuenow={totalUnique}
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted tabular-nums">
            {totalUnique} of {INSIGHTS_MIN_CUSTOMERS} customers so far. Keep the QR code
            by the register and ask every customer to scan it.
          </p>
        </div>
      )}

      {showCards && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <QuestionCard
            question="Your regulars"
            value={formatCount(loyalCount)}
            line={
              loyalCount > 0 ? (
                <>
                  {loyalCount === 1 ? "1 customer has" : `${formatCount(loyalCount)} customers have`}{" "}
                  earned a reward.
                  {spend?.loyal_avg_ticket != null && spend?.other_avg_ticket != null && (
                    <>
                      {" "}They spend {formatMoney(spend.loyal_avg_ticket)} a visit vs.{" "}
                      {formatMoney(spend.other_avg_ticket)} for everyone else.
                    </>
                  )}
                </>
              ) : (
                "No one has earned a reward yet. Your first regulars are on their way."
              )
            }
            action={<CardAction onClick={onShowCustomers}>See customers</CardAction>}
          />
          <QuestionCard
            question="Slipping away"
            value={formatCount(slipping)}
            line={
              slipping > 0
                ? `${slipping === 1 ? "1 customer hasn't" : `${formatCount(slipping)} customers haven't`} been back in 2 to 8 weeks.`
                : "Everyone has visited in the last two weeks."
            }
            action={
              slipping > 0 ? (
                <CardAction
                  onClick={onStartCampaign ? () => onStartCampaign("slipping", "win_back") : undefined}
                >
                  Send a come-back email
                </CardAction>
              ) : undefined
            }
          />
          <QuestionCard
            question="Your busy times"
            value={peakDay && busyTotal > 0 ? DAY_FULL[peakDay.day] ?? peakDay.day : "—"}
            line={
              busyTotal > 0 ? (
                <>
                  Your busiest day{peakBlock && peakBlock.count > 0 ? `, mostly in the ${peakBlock.label.toLowerCase()}` : ""}.
                  {slowDay && ` ${DAY_FULL[slowDay.day] ?? slowDay.day} is your slowest.`}
                </>
              ) : (
                `No check-ins in this period.`
              )
            }
            action={
              slowDay ? (
                <CardAction
                  onClick={onStartCampaign ? () => onStartCampaign("all", "slow_day") : undefined}
                >
                  Promote your slow day
                </CardAction>
              ) : undefined
            }
          />
          <QuestionCard
            question="Is your reward working?"
            value={redemptionRate !== null ? `${redemptionRate}%` : "—"}
            line={
              rewardsEarnedPeriod > 0
                ? `${formatCount(rewardsEarnedPeriod - rewardsPending)} of ${formatCount(rewardsEarnedPeriod)} rewards earned (${periodCaption.toLowerCase()}) were used.`
                : `No rewards earned (${periodCaption.toLowerCase()}). A closer reward gets people coming back sooner.`
            }
            action={<CardAction onClick={onEditReward}>Change reward</CardAction>}
          />
          <QuestionCard
            question="Did your promo work?"
            value={lastPromo ? formatCount(lastPromo.came_back) : "—"}
            line={
              lastPromo ? (
                <>
                  {formatCount(lastPromo.came_back)} of {formatCount(lastPromo.reached)} customers it
                  went to came back within {lastPromo.window_days} days
                  {lastPromo.name ? <> of &ldquo;{lastPromo.name}&rdquo;</> : null}.
                  {!lastPromo.window_complete && " Still counting."}
                </>
              ) : (
                "You haven't sent a promotion yet. Results show up here a week after you send one."
              )
            }
            action={
              <CardAction
                onClick={onStartCampaign ? () => onStartCampaign("all", "appreciation") : undefined}
              >
                {lastPromo ? "Send another" : "Send a promotion"}
              </CardAction>
            }
          />
        </div>
      )}

      {/* ── Your shop on Ventzon: app activity only Ventzon can see ── */}
      {!loading && data?.on_ventzon && (
        <div className="mt-4 overflow-hidden rounded-xl border border-subtle bg-surface-raised">
          <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pt-4 sm:px-6">
            <SectionLabel>Your shop on Ventzon</SectionLabel>
            <p className="text-[11px] text-muted">People finding you in the Ventzon app</p>
          </div>
          <div className="mt-3 grid grid-cols-2 divide-subtle border-t border-subtle sm:grid-cols-4 sm:divide-x">
            {[
              {
                label: "Followers",
                value: formatCount(data.on_ventzon.followers),
                sub:
                  data.on_ventzon.new_followers > 0
                    ? `+${formatCount(data.on_ventzon.new_followers)} ${periodCaption.toLowerCase()}`
                    : "Follow you in the app",
              },
              {
                label: "Haven't visited yet",
                value: formatCount(data.on_ventzon.followers_not_visited),
                sub: "Followers with no check-in",
              },
              {
                label: "Posts about you",
                value: formatCount(data.on_ventzon.posts),
                sub:
                  data.on_ventzon.posters > 0
                    ? `By ${formatCount(data.on_ventzon.posters)} ${data.on_ventzon.posters === 1 ? "person" : "people"}`
                    : periodCaption,
              },
              {
                label: "Likes and saves",
                value: formatCount(data.on_ventzon.likes + data.on_ventzon.saves),
                sub: `${formatCount(data.on_ventzon.comments)} comments`,
              },
            ].map((m) => (
              <div key={m.label} className="border-subtle px-4 py-3 sm:px-5 [&:nth-child(-n+2)]:border-b sm:[&:nth-child(-n+2)]:border-b-0">
                <p className="text-2xs font-medium uppercase tracking-caps text-muted">{m.label}</p>
                <p className="mt-1 text-lg font-semibold leading-none tracking-tight text-primary tabular-nums">
                  {m.value}
                </p>
                <p className="mt-1 text-[11px] text-muted">{m.sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Summary band ── */}
      <div className="mt-5 overflow-hidden rounded-xl border border-subtle bg-surface-raised">
        <div className="grid divide-y divide-subtle sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="px-5 py-4 sm:px-6 sm:py-5">
            <SectionLabel>Check-ins</SectionLabel>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-3xl font-semibold leading-none tracking-tight text-primary tabular-nums">
                {loading ? "…" : formatCount(totalCheckins)}
              </span>
              {!loading && <Delta pct={periodVsPrev.checkins_pct_change} />}
            </div>
            <p className="mt-2 text-xs text-muted">
              {periodCaption}
              {period === "all" ? "" : " · vs previous period"}
            </p>
          </div>

          <div className="px-5 py-4 sm:px-6 sm:py-5">
            <SectionLabel>Rewards redeemed</SectionLabel>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-3xl font-semibold leading-none tracking-tight text-primary tabular-nums">
                {loading ? "…" : formatCount(rewardsRedeemedPeriod)}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted">
              {loading
                ? "Loading…"
                : rewardsEarnedPeriod > 0
                  ? rewardsPending > 0
                    ? `Real redemptions · ${formatCount(rewardsPending)} pending`
                    : "Real redemptions · all earned rewards redeemed"
                  : "No rewards earned this period"}
            </p>
          </div>

          <div className="px-5 py-4 sm:px-6 sm:py-5">
            <SectionLabel>Retention</SectionLabel>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-3xl font-semibold leading-none tracking-tight text-primary tabular-nums">
                {loading ? "…" : retentionRate !== null ? `${retentionRate}%` : "—"}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted">
              Customers who returned at least once
            </p>
          </div>
        </div>

        {/* Secondary supporting row — same surface, quieter type */}
        <div className="grid grid-cols-2 divide-x divide-subtle border-t border-subtle sm:grid-cols-4">
          <div className="px-4 py-3 sm:px-5">
            <p className="text-2xs font-medium uppercase tracking-caps text-muted">
              New members
            </p>
            <p className="mt-1 text-lg font-semibold leading-none tracking-tight text-primary tabular-nums">
              {loading ? "…" : formatCount(newVsReturning.new)}
            </p>
            <p className="mt-1 text-[11px] text-muted">First visit in period</p>
          </div>
          <div className="px-4 py-3 sm:px-5">
            <p className="text-2xs font-medium uppercase tracking-caps text-muted">
              Returning
            </p>
            <p className="mt-1 text-lg font-semibold leading-none tracking-tight text-primary tabular-nums">
              {loading ? "…" : formatCount(newVsReturning.returning)}
            </p>
            <p className="mt-1 text-[11px] text-muted">Visited before period</p>
          </div>
          <div className="px-4 py-3 sm:px-5">
            <p className="text-2xs font-medium uppercase tracking-caps text-muted">
              Avg visits / customer
            </p>
            <p className="mt-1 text-lg font-semibold leading-none tracking-tight text-primary tabular-nums">
              {loading ? "…" : avgVisits !== null ? String(avgVisits) : "—"}
            </p>
            <p className="mt-1 text-[11px] text-muted">In period</p>
          </div>
          <div className="px-4 py-3 sm:px-5">
            <p className="text-2xs font-medium uppercase tracking-caps text-muted">
              Avg customer lifetime
            </p>
            <p className="mt-1 text-lg font-semibold leading-none tracking-tight text-primary tabular-nums">
              {loading ? "…" : avgLifetimeDays !== null ? `${avgLifetimeDays}d` : "—"}
            </p>
            <p className="mt-1 text-[11px] text-muted">First to last visit</p>
          </div>
        </div>
      </div>

      {/* ── Time series ── */}
      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Panel className="lg:col-span-3">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <SectionLabel>Check-ins over time</SectionLabel>
              <PanelTitle>{periodCaption}</PanelTitle>
            </div>
            <span className="text-xs tabular-nums text-muted">
              {formatCount(totalCheckins)} total
            </span>
          </div>
          <div className="mt-4 h-56">
            {loading ? (
              <p className="text-sm text-muted">Loading…</p>
            ) : !anyCheckins ? (
              <p className="text-sm text-muted">No check-ins in this period.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={checkins}
                  margin={{ top: 4, right: 8, left: -12, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={chart.grid}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDateLabel}
                    interval={tickInterval}
                    tick={{ fill: chart.axis, fontSize: 11 }}
                    axisLine={{ stroke: chart.grid }}
                    tickLine={false}
                    minTickGap={24}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: chart.axis, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip
                    content={
                      <ChartTooltip
                        valueLabel="check-ins"
                        formatLabel={formatDateLabel}
                      />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke={chart.accent}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{
                      r: 4,
                      fill: chart.accent,
                      stroke: chart.emphasis,
                      strokeWidth: 2,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>

        <Panel className="lg:col-span-2">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <SectionLabel>Rewards redeemed</SectionLabel>
              <PanelTitle>{periodCaption}</PanelTitle>
            </div>
            {!loading && redemptionRate !== null && (
              <span className="text-xs tabular-nums text-muted">
                {redemptionRate}% of earned
              </span>
            )}
          </div>
          <div className="mt-4 h-56">
            {loading ? (
              <p className="text-sm text-muted">Loading…</p>
            ) : !anyRedeemed ? (
              <p className="text-sm text-muted">
                No redemptions recorded this period.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={redeemedSeries}
                  margin={{ top: 4, right: 8, left: -12, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={chart.grid}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDateLabel}
                    interval={tickInterval}
                    tick={{ fill: chart.axis, fontSize: 11 }}
                    axisLine={{ stroke: chart.grid }}
                    tickLine={false}
                    minTickGap={24}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: chart.axis, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip
                    content={
                      <ChartTooltip
                        valueLabel="redeemed"
                        formatLabel={formatDateLabel}
                      />
                    }
                  />
                  <Bar
                    dataKey="count"
                    fill={chart.accent}
                    radius={[2, 2, 0, 0]}
                    maxBarSize={16}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>
      </div>

      {/* ── Customer base ── */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel>
          <SectionLabel>Customer lifecycle</SectionLabel>
          <PanelTitle>All-time, by total visits</PanelTitle>
          {loading ? (
            <p className="mt-4 text-sm text-muted">Loading…</p>
          ) : totalUnique === 0 ? (
            <p className="mt-4 text-sm text-muted">No data yet.</p>
          ) : (
            <div className="mt-4 space-y-3.5">
              {[
                {
                  label: "New",
                  caption: "1 visit",
                  count: lifecycle.new,
                  fill: "var(--chart-muted)",
                },
                {
                  label: "Returning",
                  caption: "2+ visits",
                  count: lifecycle.returning,
                  fill: "var(--chart-accent)",
                },
                {
                  label: "Loyal",
                  caption: "Earned a reward",
                  count: lifecycle.loyal,
                  fill: "var(--chart-emphasis)",
                },
              ].map((stage) => (
                <div key={stage.label}>
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm text-primary">
                      {stage.label}
                      <span className="ml-2 text-xs text-muted">
                        {stage.caption}
                      </span>
                    </p>
                    <p className="text-sm font-medium tabular-nums text-primary">
                      {formatCount(stage.count)}
                    </p>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round((stage.count / totalUnique) * 100)}%`,
                        background: stage.fill,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel>
          <SectionLabel>Customer health</SectionLabel>
          <PanelTitle>Recency of last visit</PanelTitle>
          {loading ? (
            <p className="mt-4 text-sm text-muted">Loading…</p>
          ) : (
            <div className="mt-4 space-y-3.5">
              {[
                {
                  label: "Active",
                  caption: "Visited in last 14 days",
                  count: Math.max(0, totalUnique - atRisk - lapsed - churned),
                  tone: "text-primary",
                },
                {
                  label: "At risk",
                  caption: "Last visit 14–29 days ago",
                  count: atRisk,
                  tone: "text-warn",
                },
                {
                  label: "Lapsed",
                  caption: "Last visit 30–59 days ago",
                  count: lapsed,
                  tone: "text-warn",
                },
                {
                  label: "Churned",
                  caption: "Last visit 60+ days ago",
                  count: churned,
                  tone: "text-danger",
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-baseline justify-between gap-3"
                >
                  <p className="text-sm text-primary">
                    {row.label}
                    <span className="ml-2 text-xs text-muted">
                      {row.caption}
                    </span>
                  </p>
                  <p
                    className={`text-sm font-medium tabular-nums ${row.tone}`}
                  >
                    {formatCount(row.count)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* ── When customers visit ── */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel>
          <SectionLabel>Busiest days</SectionLabel>
          <PanelTitle>{periodCaption}</PanelTitle>
          <div className="mt-4 h-44">
            {loading ? (
              <p className="text-sm text-muted">Loading…</p>
            ) : busyTotal === 0 ? (
              <p className="text-sm text-muted">No check-ins yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dayOfWeek}
                  margin={{ top: 4, right: 8, left: -12, bottom: 0 }}
                  barCategoryGap="25%"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={chart.grid}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: chart.axis, fontSize: 11 }}
                    axisLine={{ stroke: chart.grid }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: chart.axis, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip content={<ChartTooltip valueLabel="check-ins" />} />
                  <Bar dataKey="count" radius={[2, 2, 0, 0]} maxBarSize={28}>
                    {dayOfWeek.map((entry) => (
                      <Cell
                        key={entry.day}
                        fill={
                          peakDay && entry.count > 0 && entry.day === peakDay.day
                            ? chart.accent
                            : chart.muted
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>

        <Panel>
          <div className="flex items-start justify-between gap-3">
            <div>
              <SectionLabel>Time of day</SectionLabel>
              <PanelTitle>{periodCaption}</PanelTitle>
            </div>
            {!loading && peakBlock && peakBlock.count > 0 && (
              <span className="rounded-full border border-subtle px-2.5 py-0.5 text-[11px] font-medium text-secondary">
                Peak: {peakBlock.label}
              </span>
            )}
          </div>
          <div className="mt-4 space-y-3">
            {loading ? (
              <p className="text-sm text-muted">Loading…</p>
            ) : timeBlocks.every((b) => b.count === 0) ? (
              <p className="text-sm text-muted">No check-ins yet.</p>
            ) : (
              (() => {
                const maxCount = Math.max(
                  ...timeBlocks.map((b) => b.count),
                  1
                );
                return timeBlocks.map((block) => (
                  <div key={block.label}>
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm text-primary">
                        {block.label}
                        <span className="ml-2 text-xs text-muted">
                          {block.sublabel}
                        </span>
                      </p>
                      <p className="text-sm font-medium tabular-nums text-primary">
                        {formatCount(block.count)}
                      </p>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.round(
                            (block.count / maxCount) * 100
                          )}%`,
                          background: "var(--chart-accent)",
                        }}
                      />
                    </div>
                  </div>
                ));
              })()
            )}
          </div>
        </Panel>
      </div>

      {/* ── Top customers ── */}
      {!loading && topCustomers.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-xl border border-subtle bg-surface-raised">
          <div className="border-b border-subtle px-4 py-3 sm:px-5">
            <SectionLabel>Top customers</SectionLabel>
            <PanelTitle>By total visits</PanelTitle>
          </div>
          <table className="w-full text-left">
            <thead className="border-b border-subtle">
              <tr>
                <th className="w-10 px-4 py-2 text-2xs font-medium uppercase tracking-caps text-muted sm:px-5">
                  #
                </th>
                <th className="px-4 py-2 text-2xs font-medium uppercase tracking-caps text-muted sm:px-5">
                  Customer
                </th>
                <th className="px-4 py-2 text-right text-2xs font-medium uppercase tracking-caps text-muted sm:px-5">
                  Visits
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {topCustomers.map((c, i) => (
                <tr key={c.id}>
                  <td className="px-4 py-2.5 text-xs text-muted sm:px-5">
                    {i + 1}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-sm text-secondary sm:px-5">
                    {c.phone || c.email || "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm font-medium tabular-nums text-primary sm:px-5">
                    {formatCount(c.visits)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}











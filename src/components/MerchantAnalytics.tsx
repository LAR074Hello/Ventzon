"use client";

import { useCallback, useEffect, useState } from "react";
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
type HourPoint = { hour: number; label: string; count: number };
type TimeBlock = { label: string; sublabel: string; count: number };

type TopCustomer = { id: string; phone: string | null; email: string | null; visits: number };

type AnalyticsResponse = {
  shop: string;
  period: string;
  goal: number;
  startDate: string;
  endDate: string;
  checkins: DataPoint[];
  rewards: DataPoint[];
  retention_rate: number | null;
  top_customers: TopCustomer[];
  // Foot traffic
  day_of_week: DayPoint[];
  hour_of_day: HourPoint[];
  time_blocks: TimeBlock[];
  new_vs_returning: { new: number; returning: number; total: number };
  avg_visits_per_customer: number | null;
  lapsed_count: number;
  total_unique_customers: number;
};

type Period = {
  value: string;
  label: string;
};

const PERIODS: Period[] = [
  { value: "1d", label: "1 day" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "60d", label: "60 days" },
  { value: "365d", label: "1 year" },
  { value: "all", label: "All time" },
];

/* ------------------------------------------------------------------ */
/*  Tooltip                                                            */
/* ------------------------------------------------------------------ */

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
    <div className="rounded-lg border border-[#333] bg-[#111] px-3 py-2 shadow-lg">
      <p className="text-[11px] font-light text-[#888]">{displayLabel}</p>
      <p className="mt-0.5 text-[13px] font-light text-white">
        {payload[0].value} {valueLabel}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDateLabel(dateStr: string) {
  try {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatTick(dateStr: string) {
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-light tracking-[0.2em] text-[#555]">
      {children}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function MerchantAnalytics({ shopSlug }: { shopSlug: string }) {
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = useCallback(async () => {
    if (!shopSlug) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/merchant/analytics?shop=${encodeURIComponent(shopSlug)}&period=${encodeURIComponent(period)}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Failed to load analytics");
      setData(json as AnalyticsResponse);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [shopSlug, period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const checkins = data?.checkins ?? [];
  const rewards = data?.rewards ?? [];
  const tickInterval = pickTickInterval(checkins.length);

  const totalCheckins = checkins.reduce((s, d) => s + d.count, 0);
  const totalRewards = rewards.reduce((s, d) => s + d.count, 0);
  const retentionRate = data?.retention_rate ?? null;
  const topCustomers = data?.top_customers ?? [];

  const dayOfWeek = data?.day_of_week ?? [];
  const timeBlocks = data?.time_blocks ?? [];
  const newVsReturning = data?.new_vs_returning ?? { new: 0, returning: 0, total: 0 };
  const avgVisits = data?.avg_visits_per_customer ?? null;
  const lapsedCount = data?.lapsed_count ?? 0;
  const totalUniqueCustomers = data?.total_unique_customers ?? 0;

  // Peak day
  const peakDay = dayOfWeek.length
    ? dayOfWeek.reduce((a, b) => (b.count > a.count ? b : a), dayOfWeek[0])
    : null;

  // Peak time block
  const peakBlock = timeBlocks.length
    ? timeBlocks.reduce((a, b) => (b.count > a.count ? b : a), timeBlocks[0])
    : null;

  return (
    <section className="mt-14">
      <div className="luxury-divider mx-auto mb-14 max-w-xs" />

      {/* Header + period selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">
            ANALYTICS
          </p>
          <h2 className="mt-3 text-xl font-extralight tracking-[-0.01em] text-white sm:text-2xl">
            Performance
          </h2>
        </div>

        {/* Period selector */}
        <div className="flex flex-wrap gap-1.5">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`rounded-full border px-3.5 py-1.5 text-[11px] font-light tracking-[0.05em] transition-all duration-300 ${
                period === p.value
                  ? "border-[#ededed] bg-[#ededed] text-black"
                  : "border-[#1a1a1a] text-[#555] hover:border-[#333] hover:text-[#888]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-6 rounded-2xl border border-red-900/30 p-4 text-[13px] font-light text-red-400">
          {error}
        </div>
      )}

      {/* ── Row 1: Summary stats ── */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#1a1a1a] px-6 py-5 transition-all duration-500 hover:border-[#333]">
          <SectionLabel>CHECK-INS</SectionLabel>
          <p className="mt-2 text-3xl font-extralight tracking-tight text-white">
            {loading ? "..." : totalCheckins.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-[#1a1a1a] px-6 py-5 transition-all duration-500 hover:border-[#333]">
          <SectionLabel>REWARDS REDEEMED</SectionLabel>
          <p className="mt-2 text-3xl font-extralight tracking-tight text-white">
            {loading ? "..." : totalRewards.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-[#1a1a1a] px-6 py-5 transition-all duration-500 hover:border-[#333]">
          <SectionLabel>RETENTION RATE</SectionLabel>
          <p className="mt-2 text-3xl font-extralight tracking-tight text-white">
            {loading ? "..." : retentionRate !== null ? `${retentionRate}%` : "—"}
          </p>
          <p className="mt-1 text-[11px] font-light text-[#444]">Customers who returned</p>
        </div>
      </div>

      {/* ── Row 2: Customer stats ── */}
      <div className="mt-4 grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-[#1a1a1a] px-6 py-5 transition-all duration-500 hover:border-[#333]">
          <SectionLabel>NEW CUSTOMERS</SectionLabel>
          <p className="mt-2 text-2xl font-extralight tracking-tight text-white">
            {loading ? "..." : newVsReturning.new.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] font-light text-[#444]">First visit in period</p>
        </div>
        <div className="rounded-2xl border border-[#1a1a1a] px-6 py-5 transition-all duration-500 hover:border-[#333]">
          <SectionLabel>RETURNING</SectionLabel>
          <p className="mt-2 text-2xl font-extralight tracking-tight text-white">
            {loading ? "..." : newVsReturning.returning.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] font-light text-[#444]">Repeat visitors</p>
        </div>
        <div className="rounded-2xl border border-[#1a1a1a] px-6 py-5 transition-all duration-500 hover:border-[#333]">
          <SectionLabel>AVG VISITS / CUSTOMER</SectionLabel>
          <p className="mt-2 text-2xl font-extralight tracking-tight text-white">
            {loading ? "..." : avgVisits !== null ? avgVisits : "—"}
          </p>
          <p className="mt-1 text-[11px] font-light text-[#444]">In period</p>
        </div>
        <div className="rounded-2xl border border-[#1a1a1a] px-6 py-5 transition-all duration-500 hover:border-[#333]">
          <SectionLabel>LAPSED</SectionLabel>
          <p className="mt-2 text-2xl font-extralight tracking-tight text-white">
            {loading ? "..." : lapsedCount.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] font-light text-[#444]">No visit in 30+ days</p>
        </div>
      </div>

      {/* ── Row 3: Foot traffic charts ── */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">

        {/* Day of week */}
        <div className="rounded-2xl border border-[#1a1a1a] p-6 transition-all duration-500 hover:border-[#333]">
          <div className="flex items-start justify-between">
            <SectionLabel>BUSIEST DAYS</SectionLabel>
            {!loading && peakDay && peakDay.count > 0 && (
              <span className="rounded-full border border-[#2a2a2a] bg-[#111] px-2.5 py-1 text-[10px] font-light text-[#888]">
                Peak: {peakDay.day}
              </span>
            )}
          </div>
          <div className="mt-4 h-[200px]">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-[13px] font-light text-[#333]">Loading...</p>
              </div>
            ) : dayOfWeek.every((d) => d.count === 0) ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-[13px] font-light text-[#444]">No data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayOfWeek} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "#555", fontSize: 10, fontWeight: 300 }}
                    axisLine={{ stroke: "#1a1a1a" }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#555", fontSize: 10, fontWeight: 300 }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />
                  <Tooltip content={<ChartTooltip valueLabel="check-ins" />} />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={32}>
                    {dayOfWeek.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={peakDay && entry.day === peakDay.day && entry.count > 0 ? "#ededed" : "#2a2a2a"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Time of day blocks */}
        <div className="rounded-2xl border border-[#1a1a1a] p-6 transition-all duration-500 hover:border-[#333]">
          <div className="flex items-start justify-between">
            <SectionLabel>TIME OF DAY</SectionLabel>
            {!loading && peakBlock && peakBlock.count > 0 && (
              <span className="rounded-full border border-[#2a2a2a] bg-[#111] px-2.5 py-1 text-[10px] font-light text-[#888]">
                Peak: {peakBlock.label}
              </span>
            )}
          </div>
          <div className="mt-5 space-y-3">
            {loading ? (
              <p className="text-[13px] font-light text-[#333]">Loading...</p>
            ) : timeBlocks.every((b) => b.count === 0) ? (
              <p className="text-[13px] font-light text-[#444]">No data yet</p>
            ) : (() => {
              const maxCount = Math.max(...timeBlocks.map((b) => b.count), 1);
              return timeBlocks.map((block) => (
                <div key={block.label}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[13px] font-light text-[#ededed]">{block.label}</span>
                      <span className="ml-2 text-[11px] font-light text-[#444]">{block.sublabel}</span>
                    </div>
                    <span className="text-[12px] font-light text-[#888]">{block.count}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#1a1a1a]">
                    <div
                      className="h-full rounded-full bg-[#ededed] transition-all duration-700"
                      style={{ width: `${Math.round((block.count / maxCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>

      {/* ── Row 4: Time series charts ── */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Check-ins line chart */}
        <div className="rounded-2xl border border-[#1a1a1a] p-6 transition-all duration-500 hover:border-[#333]">
          <SectionLabel>CUSTOMER CHECK-INS</SectionLabel>
          <div className="mt-4 h-[240px]">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-[13px] font-light text-[#333]">Loading...</p>
              </div>
            ) : checkins.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-[13px] font-light text-[#444]">No data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={checkins}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatTick}
                    interval={tickInterval}
                    tick={{ fill: "#555", fontSize: 10, fontWeight: 300 }}
                    axisLine={{ stroke: "#1a1a1a" }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#555", fontSize: 10, fontWeight: 300 }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                  />
                  <Tooltip
                    content={<ChartTooltip valueLabel="check-ins" formatLabel={formatDateLabel} />}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#ededed"
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 4, fill: "#ededed", stroke: "#000", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Rewards bar chart */}
        <div className="rounded-2xl border border-[#1a1a1a] p-6 transition-all duration-500 hover:border-[#333]">
          <SectionLabel>REWARDS REDEEMED</SectionLabel>
          <div className="mt-4 h-[240px]">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-[13px] font-light text-[#333]">Loading...</p>
              </div>
            ) : rewards.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-[13px] font-light text-[#444]">No data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rewards}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatTick}
                    interval={tickInterval}
                    tick={{ fill: "#555", fontSize: 10, fontWeight: 300 }}
                    axisLine={{ stroke: "#1a1a1a" }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#555", fontSize: 10, fontWeight: 300 }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                  />
                  <Tooltip
                    content={<ChartTooltip valueLabel="rewards" formatLabel={formatDateLabel} />}
                  />
                  <Bar
                    dataKey="count"
                    fill="#ededed"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── Top customers ── */}
      {!loading && topCustomers.length > 0 && (
        <div className="mt-6 rounded-2xl border border-[#1a1a1a] p-6 transition-all duration-500 hover:border-[#333]">
          <SectionLabel>TOP CUSTOMERS</SectionLabel>
          <div className="mt-4 space-y-2">
            {topCustomers.map((c, i) => (
              <div key={c.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-5 text-[11px] font-light text-[#444]">{i + 1}</span>
                  <span className="font-mono text-[13px] font-light text-[#888]">
                    {c.phone || c.email || "—"}
                  </span>
                </div>
                <span className="text-[13px] font-light text-[#ededed]">
                  {c.visits} visits
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

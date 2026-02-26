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
} from "recharts";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type DataPoint = { date: string; count: number };

type AnalyticsResponse = {
  shop: string;
  period: string;
  goal: number;
  startDate: string;
  endDate: string;
  checkins: DataPoint[];
  rewards: DataPoint[];
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
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  valueLabel: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#333] bg-[#111] px-3 py-2 shadow-lg">
      <p className="text-[11px] font-light text-[#888]">{formatDateLabel(String(label))}</p>
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

      {/* Summary stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#1a1a1a] px-6 py-5 transition-all duration-500 hover:border-[#333]">
          <p className="text-[11px] font-light tracking-[0.2em] text-[#555]">
            CHECK-INS
          </p>
          <p className="mt-2 text-3xl font-extralight tracking-tight text-white">
            {loading ? "..." : totalCheckins.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-[#1a1a1a] px-6 py-5 transition-all duration-500 hover:border-[#333]">
          <p className="text-[11px] font-light tracking-[0.2em] text-[#555]">
            REWARDS REDEEMED
          </p>
          <p className="mt-2 text-3xl font-extralight tracking-tight text-white">
            {loading ? "..." : totalRewards.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Check-ins line chart */}
        <div className="rounded-2xl border border-[#1a1a1a] p-6 transition-all duration-500 hover:border-[#333]">
          <p className="text-[11px] font-light tracking-[0.2em] text-[#555]">
            CUSTOMER CHECK-INS
          </p>
          <div className="mt-4 h-[240px]">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-[13px] font-light text-[#333]">
                  Loading...
                </p>
              </div>
            ) : checkins.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-[13px] font-light text-[#444]">
                  No data yet
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={checkins}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1a1a1a"
                    vertical={false}
                  />
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
                    content={
                      <ChartTooltip valueLabel="check-ins" />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#ededed"
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{
                      r: 4,
                      fill: "#ededed",
                      stroke: "#000",
                      strokeWidth: 2,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Rewards bar chart */}
        <div className="rounded-2xl border border-[#1a1a1a] p-6 transition-all duration-500 hover:border-[#333]">
          <p className="text-[11px] font-light tracking-[0.2em] text-[#555]">
            REWARDS REDEEMED
          </p>
          <div className="mt-4 h-[240px]">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-[13px] font-light text-[#333]">
                  Loading...
                </p>
              </div>
            ) : rewards.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-[13px] font-light text-[#444]">
                  No data yet
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rewards}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1a1a1a"
                    vertical={false}
                  />
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
                    content={
                      <ChartTooltip valueLabel="rewards" />
                    }
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
    </section>
  );
}

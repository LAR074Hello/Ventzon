"use client";

import { useEffect, useMemo, useState } from "react";

type StatsResponse = {
  shop_slug: string;
  totals: { total: number; today: number };
  latest: Array<{ phone: string; created_at: string }>;
  error?: string;
};

function maskPhone(phone: string) {
  const digits = String(phone ?? "").replace(/[^\d]/g, "");
  if (digits.length <= 4) return digits;
  const last4 = digits.slice(-4);
  return `***-***-${last4}`;
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    // show local time but label as "Local" to avoid confusion
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function StatCard({
  label,
  value,
  sublabel,
  loading,
}: {
  label: string;
  value: string;
  sublabel?: string;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6">
      <div className="text-sm text-neutral-400">{label}</div>
      <div className="mt-2 text-4xl font-semibold text-neutral-100">
        {loading ? (
          <div className="h-10 w-24 animate-pulse rounded-lg bg-neutral-800" />
        ) : (
          value
        )}
      </div>
      {sublabel ? (
        <div className="mt-2 text-xs text-neutral-500">{sublabel}</div>
      ) : null}
    </div>
  );
}

export default function MerchantShopPage({
  params,
}: {
  params: { shop: string };
}) {
  const shopSlug = useMemo(
    () => String(params?.shop ?? "").trim().toLowerCase(),
    [params]
  );

  const statsUrl = useMemo(() => {
    if (!shopSlug) return "";
    // this matches your stats route that expects ?shop_slug=
    return `/merchant/stats?shop_slug=${encodeURIComponent(shopSlug)}`;
  }, [shopSlug]);

  const joinUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    if (!shopSlug) return "";
    return `${window.location.origin}/join/${shopSlug}`;
  }, [shopSlug]);

  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>("");

  async function loadStats() {
    if (!statsUrl) return;
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch(statsUrl, { cache: "no-store" });
      const json = (await res.json()) as StatsResponse;

      if (!res.ok) {
        setData(null);
        setLoadError(json?.error || "Failed to load stats");
        return;
      }

      setData(json);
    } catch (e: any) {
      setData(null);
      setLoadError(e?.message || "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!statsUrl) return;
      setLoading(true);
      setLoadError("");

      try {
        const res = await fetch(statsUrl, { cache: "no-store" });
        const json = (await res.json()) as StatsResponse;

        if (cancelled) return;

        if (!res.ok) {
          setData(null);
          setLoadError(json?.error || "Failed to load stats");
          return;
        }

        setData(json);
      } catch (e: any) {
        if (cancelled) return;
        setData(null);
        setLoadError(e?.message || "Failed to load stats");
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [statsUrl]);

  async function copyJoinLink() {
    if (!joinUrl) return;
    try {
      await navigator.clipboard.writeText(joinUrl);
      alert("Copied join link!");
    } catch {
      // fallback
      prompt("Copy this link:", joinUrl);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <header className="mb-8">
          <div className="text-xs uppercase tracking-widest text-neutral-500">
            Ventzon Rewards
          </div>
          <h1 className="mt-2 text-3xl font-semibold">Merchant Dashboard</h1>
          <p className="mt-2 text-sm text-neutral-400">
            View signups and share your shop’s join link.
          </p>
        </header>

        {!shopSlug ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6">
            <div className="text-sm text-neutral-300">Missing shop slug</div>
            <div className="mt-2 text-xs text-neutral-500">
              Open this page like:
            </div>
            <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-950 p-3 font-mono text-xs text-neutral-200">
              /merchant/govans-groceries
            </div>
          </div>
        ) : (
          <>
            <section className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm text-neutral-400">Shop</div>
                  <div className="mt-1 font-mono text-sm text-neutral-200">
                    {shopSlug}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={copyJoinLink}
                    className="inline-flex items-center justify-center rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm font-medium text-neutral-100 hover:bg-neutral-900"
                  >
                    Copy Join Link
                  </button>
                  <button
                    onClick={loadStats}
                    className="inline-flex items-center justify-center rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm font-medium text-neutral-100 hover:bg-neutral-900"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              <div className="mt-4 text-xs text-neutral-500">
                Customer link:
                <span className="ml-2 select-all rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-1 font-mono text-neutral-200">
                  {joinUrl || "(loading...)"}
                </span>
              </div>
            </section>

            <section className="mt-6 grid gap-4 sm:grid-cols-2">
              <StatCard
                label="Total signups"
                value={String(data?.totals?.total ?? 0)}
                sublabel="All-time"
                loading={loading}
              />
              <StatCard
                label="Signups today"
                value={String(data?.totals?.today ?? 0)}
                sublabel="Resets daily (UTC)"
                loading={loading}
              />
            </section>

            <section className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Latest signups</h2>
                <a
                  href={statsUrl}
                  className="text-xs text-neutral-400 underline hover:text-neutral-200"
                  target="_blank"
                  rel="noreferrer"
                >
                  View raw JSON
                </a>
              </div>

              {loadError ? (
                <div className="mt-4 rounded-xl border border-red-900/40 bg-red-950/30 p-4 text-sm text-red-200">
                  {loadError}
                </div>
              ) : null}

              <div className="mt-4 overflow-hidden rounded-xl border border-neutral-800">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-950">
                    <tr className="text-neutral-400">
                      <th className="px-4 py-3 font-medium">Phone</th>
                      <th className="px-4 py-3 font-medium">Time</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-neutral-800">
                    {loading ? (
                      <tr>
                        <td className="px-4 py-4 text-neutral-400" colSpan={2}>
                          Loading…
                        </td>
                      </tr>
                    ) : (data?.latest ?? []).length === 0 ? (
                      <tr>
                        <td className="px-4 py-4 text-neutral-400" colSpan={2}>
                          No signups yet — share your join link to get your
                          first customer.
                        </td>
                      </tr>
                    ) : (
                      (data?.latest ?? []).map((row, idx) => (
                        <tr key={`${row.phone}-${row.created_at}-${idx}`}>
                          <td className="px-4 py-3 font-mono text-neutral-200">
                            {maskPhone(row.phone)}
                          </td>
                          <td className="px-4 py-3 text-neutral-300">
                            {formatTime(row.created_at)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 text-xs text-neutral-500">
                Tip: Keep the phone masked for privacy. If a shop ever needs full
                numbers, we’ll add a “verified merchant login” later.
              </div>
            </section>

            <section className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6">
              <div className="text-sm text-neutral-300">Quick start</div>
              <div className="mt-2 text-sm text-neutral-400">
                Put this on the counter or show it at checkout:
              </div>
              <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-950 p-3 font-mono text-xs text-neutral-200">
                {joinUrl || "/join/your-shop"}
              </div>
              <div className="mt-3 text-xs text-neutral-500">
                Rules: max 1 signup/day per phone. (We’ll customize rules per
                shop later.)
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
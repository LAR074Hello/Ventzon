"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type StatsResponse = {
  shop_slug: string;
  totals: { total: number; today: number };
  latest: { phone: string; created_at: string }[];
  error?: string;
};

function maskPhone(phone: string) {
  const digits = String(phone || "").replace(/[^\d]/g, "");
  if (digits.length < 4) return phone;
  const last4 = digits.slice(-4);
  return `***-***-${last4}`;
}

export default function MerchantPage() {
  const searchParams = useSearchParams();

  const shopSlug = useMemo(() => {
    // support both ?shop_slug= and ?shop=
    const raw = searchParams.get("shop_slug") || searchParams.get("shop") || "";
    return raw.trim().toLowerCase();
  }, [searchParams]);

  const joinUrl = useMemo(() => {
    if (!shopSlug) return "";
    return `${window.location.origin}/join/${shopSlug}`;
  }, [shopSlug]);

  const statsUrl = useMemo(() => {
    if (!shopSlug) return "";
    return `/merchant/stats?shop_slug=${encodeURIComponent(shopSlug)}`;
  }, [shopSlug]);

  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string>("");

  useEffect(() => {
    if (!shopSlug) {
      setData(null);
      setLoadError("");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setLoadError("");

        const res = await fetch(statsUrl, { cache: "no-store" });
        const json = (await res.json()) as StatsResponse;

        if (cancelled) return;

        if (!res.ok || json.error) {
          setData(null);
          setLoadError(json.error || `Request failed (${res.status})`);
          return;
        }

        setData(json);
      } catch (e: any) {
        if (cancelled) return;
        setData(null);
        setLoadError(e?.message || "Failed to load stats");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [shopSlug, statsUrl]);

  async function copyJoinLink() {
    if (!joinUrl) return;
    await navigator.clipboard.writeText(joinUrl);
    alert("Copied join link!");
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 text-neutral-100">
      <div className="mb-8">
        <div className="text-xs text-neutral-400">Merchant Dashboard</div>
        <h1 className="mt-1 text-3xl font-semibold">Rewards</h1>
        <p className="mt-2 text-sm text-neutral-400">
          View signups + share your shop join link.
        </p>
      </div>

      {!shopSlug && (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6">
          <div className="text-sm text-neutral-200">Missing shop slug</div>
          <div className="mt-2 text-sm text-neutral-400">
            Open this page like:
            <div className="mt-2 rounded-lg border border-neutral-800 bg-neutral-950 p-3 font-mono text-xs">
              /merchant?shop_slug=govans-groceries
            </div>
          </div>
        </div>
      )}

      {shopSlug && (
        <>
          <section className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs text-neutral-400">Shop</div>
                <div className="mt-1 font-mono text-sm text-neutral-200">
                  {shopSlug}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  className="inline-flex items-center justify-center rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm hover:bg-neutral-900"
                  onClick={copyJoinLink}
                >
                  Copy join link
                </button>

                <a
                  className="inline-flex items-center justify-center rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm text-neutral-300 underline-offset-4 hover:bg-neutral-900 hover:underline"
                  href={statsUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  View raw stats
                </a>
              </div>
            </div>

            <div className="mt-3 text-xs text-neutral-500">
              Join link:{" "}
              <span className="font-mono text-neutral-300">{joinUrl}</span>
            </div>
          </section>

          <section className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6">
              <div className="text-sm text-neutral-400">Total signups</div>
              <div className="mt-2 text-4xl font-semibold">
                {loading ? "…" : data?.totals?.total ?? 0}
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6">
              <div className="text-sm text-neutral-400">Signups today (UTC)</div>
              <div className="mt-2 text-4xl font-semibold">
                {loading ? "…" : data?.totals?.today ?? 0}
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Latest signups</h2>
              <button
                className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm hover:bg-neutral-900"
                onClick={() => {
                  // quick refresh
                  window.location.reload();
                }}
              >
                Refresh
              </button>
            </div>

            {loadError && (
              <div className="mt-3 rounded-xl border border-red-900/40 bg-red-950/30 p-3 text-sm text-red-200">
                {loadError}
              </div>
            )}

            <div className="mt-4 overflow-hidden rounded-xl border border-neutral-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-950">
                  <tr className="text-neutral-300">
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">Time (UTC)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {(data?.latest ?? []).length === 0 ? (
                    <tr>
                      <td className="px-4 py-4 text-neutral-400" colSpan={2}>
                        {loading ? "Loading…" : "No signups yet"}
                      </td>
                    </tr>
                  ) : (
                    (data?.latest ?? []).map((row, idx) => (
                      <tr key={`${row.phone}-${row.created_at}-${idx}`}>
                        <td className="px-4 py-3 font-mono text-neutral-200">
                          {maskPhone(row.phone)}
                        </td>
                        <td className="px-4 py-3 font-mono text-neutral-400">
                          {row.created_at}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-xs text-neutral-500">
              Tip: If you want “today” to mean local time (not UTC), we can switch that
              logic next.
            </p>
          </section>
        </>
      )}
    </main>
  );
}
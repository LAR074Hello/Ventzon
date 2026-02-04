"use client";

import { useEffect, useMemo, useState } from "react";

type StatsResponse = {
  shop_slug: string;
  totals: { total: number; today: number };
  latest: Array<{ phone: string; created_at: string }>;
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
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

export default function MerchantShopPage({
  params,
}: {
  params: { shop: string };
}) {
  const shopSlug = useMemo(() => String(params?.shop ?? "").trim().toLowerCase(), [params]);

  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");

  const joinUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/join/${shopSlug}`;
  }, [shopSlug]);

  const qrUrl = useMemo(() => {
    if (!joinUrl) return "";
    // MVP-friendly: uses a public QR generator
    return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(joinUrl)}`;
  }, [joinUrl]);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`/merchant/stats?shop_slug=${encodeURIComponent(shopSlug)}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) {
        setErr(json?.error ?? "Failed to load stats");
        setData(null);
      } else {
        setData(json);
      }
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load stats");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!shopSlug) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopSlug]);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied!");
    } catch {
      alert("Couldn’t copy — try selecting and copying manually.");
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <header className="flex flex-col gap-2">
          <div className="text-sm text-neutral-400">Ventzon Rewards</div>
          <h1 className="text-2xl font-semibold">Merchant Dashboard</h1>
          <div className="text-neutral-300">
            Shop: <span className="font-mono text-neutral-100">{shopSlug || "—"}</span>
          </div>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6">
            <div className="text-sm text-neutral-400">Total signups</div>
            <div className="mt-2 text-4xl font-semibold">
              {loading ? "…" : err ? "—" : data?.totals?.total ?? 0}
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6">
            <div className="text-sm text-neutral-400">Signups today</div>
            <div className="mt-2 text-4xl font-semibold">
              {loading ? "…" : err ? "—" : data?.totals?.today ?? 0}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm text-neutral-400">Join link for customers</div>
              <div className="mt-1 font-mono text-sm text-neutral-100 break-all">
                {joinUrl || "(loading…)"}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                className="rounded-xl border border-neutral-800 px-4 py-2 text-sm hover:bg-neutral-900"
                onClick={() => joinUrl && copy(joinUrl)}
                disabled={!joinUrl}
              >
                Copy link
              </button>
              <button
                className="rounded-xl border border-neutral-800 px-4 py-2 text-sm hover:bg-neutral-900"
                onClick={() => load()}
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2 sm:items-start">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-4">
              <div className="text-sm text-neutral-400">QR code (scan to join)</div>
              <div className="mt-3 flex items-center justify-center">
                {qrUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrUrl}
                    alt="QR code"
                    className="rounded-xl bg-white p-2"
                    width={240}
                    height={240}
                  />
                ) : (
                  <div className="text-neutral-500">Loading…</div>
                )}
              </div>
              <div className="mt-3 text-xs text-neutral-500">
                Tip: print this and tape it at checkout.
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Latest signups</div>
                <a
                  className="text-sm text-neutral-400 underline hover:text-neutral-200"
                  href={`/merchant/stats?shop_slug=${encodeURIComponent(shopSlug)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View raw JSON
                </a>
              </div>

              {err ? (
                <div className="mt-3 rounded-xl border border-red-900/40 bg-red-950/30 p-3 text-sm text-red-200">
                  {err}
                </div>
              ) : null}

              <div className="mt-4 overflow-hidden rounded-xl border border-neutral-800">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-900/60 text-neutral-200">
                    <tr>
                      <th className="px-4 py-3 font-medium">Phone</th>
                      <th className="px-4 py-3 font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {loading ? (
                      <tr>
                        <td className="px-4 py-3 text-neutral-400" colSpan={2}>
                          Loading…
                        </td>
                      </tr>
                    ) : (data?.latest ?? []).length === 0 ? (
                      <tr>
                        <td className="px-4 py-3 text-neutral-400" colSpan={2}>
                          No signups yet.
                        </td>
                      </tr>
                    ) : (
                      (data?.latest ?? []).map((row, idx) => (
                        <tr key={`${row.phone}-${row.created_at}-${idx}`}>
                          <td className="px-4 py-3 font-mono text-neutral-100">
                            {maskPhone(row.phone)}
                          </td>
                          <td className="px-4 py-3 font-mono text-neutral-400">
                            {formatTime(row.created_at)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 text-xs text-neutral-500">
                Rule reminder: show the QR only after purchase. Limit: max 1 reward/day.
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6">
          <div className="text-sm font-semibold">Quick start</div>
          <div className="mt-2 text-sm text-neutral-300">
            Send customers here:{" "}
            <span className="font-mono text-neutral-100">{`/join/${shopSlug}`}</span>
          </div>
        </section>
      </div>
    </main>
  );
}
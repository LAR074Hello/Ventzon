"use client";

import { useEffect, useMemo, useState } from "react";
// @ts-ignore - some installs of qrcode.react ship without TS types; runtime is fine
import { QRCodeCanvas } from "qrcode.react";

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
  const shopSlug = useMemo(
    () => String(params?.shop ?? "").trim().toLowerCase(),
    [params]
  );

  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [copied, setCopied] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const joinUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/join/${shopSlug}`;
  }, [shopSlug]);

  const statsUrl = useMemo(() => {
    if (!shopSlug) return "";
    return `/merchant/stats?shop_slug=${encodeURIComponent(shopSlug)}`;
  }, [shopSlug]);

  async function loadStats() {
    try {
      setLoading(true);
      setLoadError("");

      if (!statsUrl) {
        setLoadError("Missing shop slug");
        return;
      }

      const res = await fetch(statsUrl, { cache: "no-store" });
      const json = (await res.json()) as any;

      if (!res.ok) throw new Error(json?.error ?? "Failed to load stats");

      setData(json as StatsResponse);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e: any) {
      setLoadError(e?.message ?? "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (cancelled) return;
      await loadStats();
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statsUrl]);

  async function copyJoinLink() {
    if (!joinUrl) return;
    await navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  function printQr() {
    window.print();
  }

  const isMissingShop = !shopSlug;

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* subtle premium glow */}
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute left-1/2 top-[-200px] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-neutral-800 blur-3xl" />
        <div className="absolute right-[-220px] top-[140px] h-[520px] w-[520px] rounded-full bg-neutral-900 blur-3xl" />
        <div className="absolute left-[-220px] bottom-[80px] h-[520px] w-[520px] rounded-full bg-neutral-900 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="text-xs tracking-[0.35em] text-neutral-400">
            VENTZON REWARDS
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Merchant Dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-neutral-300">
            View signups and share your shop’s join link. Daily totals follow New
            York time.
          </p>
        </div>

        {isMissingShop ? (
          <section className="rounded-2xl border border-neutral-800 bg-neutral-950/30 p-6 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-neutral-700">
            <div className="text-sm text-neutral-300">Missing shop slug</div>
            <div className="mt-2 text-sm text-neutral-400">
              Open this page like:
            </div>
            <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-950 p-4 font-mono text-sm text-neutral-200">
              /merchant/govans-groceries
            </div>
          </section>
        ) : (
          <>
            {/* Top row */}
            <section className="grid gap-6 lg:grid-cols-3">
              {/* Total */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/30 p-6 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-neutral-700">
                <div className="text-sm text-neutral-400">Total signups</div>
                <div className="mt-2 text-5xl font-semibold tracking-tight">
                  {loading ? "…" : data?.totals?.total ?? 0}
                </div>
              </div>

              {/* Today */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/30 p-6 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-neutral-700">
                <div className="text-sm text-neutral-400">Signups today</div>
                <div className="mt-2 text-5xl font-semibold tracking-tight">
                  {loading ? "…" : data?.totals?.today ?? 0}
                </div>
              </div>

              {/* QR / print area */}
              <div className="print-area rounded-2xl border border-neutral-800 bg-neutral-950/30 p-6 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-neutral-700">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-neutral-400">Join link (QR)</div>
                  {copied ? (
                    <div className="text-xs text-neutral-200">Copied ✓</div>
                  ) : (
                    <div className="text-xs text-neutral-500">
                      Print & place near checkout
                    </div>
                  )}
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-[160px_1fr] sm:items-start">
                  <div className="flex justify-center sm:justify-start">
                    <div className="rounded-2xl bg-white p-3 shadow-sm">
                      <QRCodeCanvas value={joinUrl || " "} size={140} />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
                      <div className="text-[11px] uppercase tracking-widest text-neutral-500">
                        Join URL
                      </div>
                      <div className="mt-2 max-h-24 overflow-auto whitespace-normal break-all font-mono text-xs text-neutral-200">
                        {joinUrl}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={copyJoinLink}
                        className="rounded-xl border border-neutral-800 px-3 py-2 text-sm hover:bg-neutral-900"
                      >
                        Copy link
                      </button>

                      <button
                        onClick={printQr}
                        className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-black hover:bg-neutral-200"
                      >
                        Print
                      </button>

                      <button
                        onClick={loadStats}
                        className="rounded-xl border border-neutral-800 px-3 py-2 text-sm hover:bg-neutral-900"
                      >
                        Refresh
                      </button>

                      <div className="ml-auto flex items-center text-xs text-neutral-500">
                        {lastUpdated ? (
                          <span>Last updated: {lastUpdated}</span>
                        ) : (
                          <span>&nbsp;</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Error */}
            {loadError ? (
              <div className="mt-6 rounded-2xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-200">
                {loadError}
              </div>
            ) : null}

            {/* Latest signups */}
            <section className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-950/30 p-6 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-neutral-700">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold">Latest signups</h2>
                <a
                  href={statsUrl}
                  className="text-sm text-neutral-400 underline hover:text-neutral-200"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open raw stats JSON
                </a>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-neutral-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-950">
                    <tr className="text-neutral-300">
                      <th className="px-4 py-3 font-medium">Phone</th>
                      <th className="px-4 py-3 font-medium">Time</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-neutral-800">
                    {(data?.latest ?? []).length === 0 ? (
                      <tr className="hover:bg-neutral-950/60">
                        <td className="px-4 py-4 text-neutral-400" colSpan={2}>
                          {loading ? "Loading…" : "No signups yet."}
                        </td>
                      </tr>
                    ) : (
                      (data?.latest ?? []).map((row, idx) => (
                        <tr
                          key={`${row.phone}-${row.created_at}-${idx}`}
                          className="hover:bg-neutral-950/60"
                        >
                          <td className="px-4 py-3 font-mono text-neutral-200">
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
            </section>

            {/* Quick start */}
            <section className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-950/30 p-6 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-neutral-700">
              <div className="text-sm text-neutral-400">Quick start</div>
              <div className="mt-2 text-sm text-neutral-200">
                Your customer join page:
              </div>
              <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-950 p-4">
                <div className="text-[11px] uppercase tracking-widest text-neutral-500">Customer join link</div>
                <div className="mt-2 font-mono text-sm text-neutral-200 break-all">{joinUrl}</div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={joinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-neutral-800 px-3 py-2 text-sm hover:bg-neutral-900"
                  >
                    Open join page
                  </a>
                  <button
                    onClick={copyJoinLink}
                    className="rounded-xl border border-neutral-800 px-3 py-2 text-sm hover:bg-neutral-900"
                  >
                    Copy link
                  </button>
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      {/* Print styling: only show the QR panel when printing */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          main {
            background: white !important;
          }
          main * {
            visibility: hidden;
          }
          main .print-area,
          main .print-area * {
            visibility: visible;
          }
          main .print-area {
            position: absolute;
            left: 24px;
            top: 24px;
            width: calc(100% - 48px);
            border: 1px solid #e5e5e5 !important;
            background: white !important;
            color: black !important;
          }
          main .print-area .bg-white {
            box-shadow: none !important;
          }
        }
      `}</style>
    </main>
  );
}
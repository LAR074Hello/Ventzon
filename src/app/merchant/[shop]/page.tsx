"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
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

export default function MerchantShopPage() {
  const params = useParams() as { shop?: string };

  const shopSlug = useMemo(() => {
    return String(params?.shop ?? "").trim().toLowerCase();
  }, [params?.shop]);

  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const joinUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    if (!shopSlug) return "";
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
        setData(null);
        return;
      }

      const res = await fetch(statsUrl, { cache: "no-store" });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error ?? "Failed to load stats");
      }

      setData(json as StatsResponse);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e: any) {
      setLoadError(e?.message ?? "Failed to load stats");
      setData(null);
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

    // Auto-refresh every 5 seconds (so new signups appear without you doing anything)
    const id = setInterval(() => {
      if (cancelled) return;
      loadStats();
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statsUrl]);

  async function copyJoinLink() {
    if (!joinUrl) return;
    await navigator.clipboard.writeText(joinUrl);
    alert("Copied join link!");
  }

  function printQr() {
    window.print();
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8">
          <div className="text-xs tracking-widest text-neutral-400">
            VENTZON REWARDS
          </div>
          <h1 className="mt-2 text-3xl font-semibold">Merchant Dashboard</h1>
          <p className="mt-2 text-neutral-300">
            View signups and share your shop’s join link.
          </p>
        </div>

        {!shopSlug ? (
          <section className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6">
            <div className="text-sm text-neutral-300">Missing shop slug</div>
            <div className="mt-2 text-sm text-neutral-400">Open this page like:</div>
            <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-950 p-4 font-mono text-sm text-neutral-200">
              /merchant/govans-groceries
            </div>
          </section>
        ) : (
          <>
            {/* TOP ROW */}
            <section className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6">
                <div className="text-sm text-neutral-400">Total signups</div>
                <div className="mt-2 text-4xl font-semibold">
                  {loading ? "…" : data?.totals?.total ?? 0}
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6">
                <div className="text-sm text-neutral-400">Signups today</div>
                <div className="mt-2 text-4xl font-semibold">
                  {loading ? "…" : data?.totals?.today ?? 0}
                </div>
              </div>

              {/* QR + link */}
              <div className="print-area rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6">
                <div className="text-sm text-neutral-400">Join link (QR)</div>

                <div className="mt-4 flex items-center gap-4">
                  <div className="rounded-xl bg-white p-3">
                    <QRCodeCanvas value={joinUrl || " "} size={140} />
                  </div>

                  <div className="min-w-0">
                    <div className="text-sm font-medium text-neutral-200">
                      Print & place near checkout
                    </div>
                    <div className="mt-1 break-all rounded-lg border border-neutral-800 bg-neutral-950 p-2 font-mono text-xs text-neutral-300">
                      {joinUrl}
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
                    </div>

                    <div className="mt-2 text-xs text-neutral-500">
                      {lastUpdated ? `Last updated: ${lastUpdated}` : ""}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {loadError ? (
              <div className="mt-6 rounded-2xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-200">
                {loadError}
              </div>
            ) : null}

            {/* LATEST SIGNUPS */}
            <section className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6">
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
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-950">
                    <tr className="text-neutral-300">
                      <th className="px-4 py-3 font-medium">Phone</th>
                      <th className="px-4 py-3 font-medium">Time</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-neutral-800">
                    {(data?.latest ?? []).length === 0 ? (
                      <tr>
                        <td className="px-4 py-4 text-neutral-400" colSpan={2}>
                          {loading ? "Loading…" : "No signups yet."}
                        </td>
                      </tr>
                    ) : (
                      (data?.latest ?? []).map((row, idx) => (
                        <tr key={`${row.phone}-${row.created_at}-${idx}`}>
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

            {/* QUICK START */}
            <section className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6">
              <div className="text-sm text-neutral-400">Quick start</div>
              <div className="mt-2 text-sm text-neutral-200">
                Your customer join page:
              </div>
              <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-950 p-4 font-mono text-sm text-neutral-200">
                /join/{shopSlug}
              </div>
            </section>
          </>
        )}
      </div>

      {/* Print styling: only show the QR section when printing */}
      <style jsx global>{`
        @media print {
          body {
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
            top: 24px;
            left: 24px;
            right: 24px;
          }
        }
      `}</style>
    </main>
  );
}
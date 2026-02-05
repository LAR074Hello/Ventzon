"use client";

import { useMemo, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";

type Stats = {
  shop_slug: string;
  totals?: { total?: number; today?: number };
  latest?: { phone: string; created_at: string }[];
};

export default function MerchantShopPage() {
  const params = useParams<{ shop?: string }>();

  const shopSlug = useMemo(
    () => String(params?.shop ?? "").trim().toLowerCase(),
    [params]
  );

  const joinUrl = useMemo(() => {
    if (!shopSlug) return "";
    return `${typeof window !== "undefined" ? window.location.origin : ""}/join/${encodeURIComponent(shopSlug)}`;
  }, [shopSlug]);

  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!shopSlug) return;
    setLoading(true);
    setErr("");
    fetch(`/merchant/stats?shop_slug=${encodeURIComponent(shopSlug)}`)
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j?.error ?? "Failed to load stats");
        setStats(j);
      })
      .catch((e) => setErr(e?.message ?? "Failed to load stats"))
      .finally(() => setLoading(false));
  }, [shopSlug]);

  if (!shopSlug) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <div className="text-xs tracking-[0.35em] text-neutral-400">VENTZON REWARDS</div>
          <h1 className="mt-3 text-3xl font-semibold">Missing shop slug</h1>
          <p className="mt-3 text-neutral-300">
            Open this page like: <span className="font-mono">/merchant/govans-groceries</span>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="text-xs tracking-[0.35em] text-neutral-400">VENTZON REWARDS</div>
        <h1 className="mt-3 text-4xl font-semibold">Merchant Dashboard</h1>
        <p className="mt-2 text-neutral-300">
          View signups and share your shop’s join link. Daily totals follow New York time.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6">
            <div className="text-sm text-neutral-300">Join link</div>
            <div className="mt-2 break-all rounded-xl border border-neutral-800 bg-black px-4 py-3 font-mono text-sm">
              {joinUrl || `/join/${shopSlug}`}
            </div>

            <div className="mt-6 flex items-center justify-center rounded-2xl border border-neutral-800 bg-black p-4">
              <QRCodeCanvas value={joinUrl || `/join/${shopSlug}`} size={180} includeMargin />
            </div>

            <div className="mt-3 text-xs text-neutral-500">
              Print this QR code and place it at checkout.
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6">
            <div className="text-sm text-neutral-300">Totals</div>

            {loading ? (
              <div className="mt-4 text-neutral-400">Loading…</div>
            ) : err ? (
              <div className="mt-4 text-red-300">{err}</div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-neutral-800 bg-black p-4">
                  <div className="text-xs text-neutral-500">Today</div>
                  <div className="mt-1 text-3xl font-semibold">{stats?.totals?.today ?? 0}</div>
                </div>
                <div className="rounded-xl border border-neutral-800 bg-black p-4">
                  <div className="text-xs text-neutral-500">All time</div>
                  <div className="mt-1 text-3xl font-semibold">{stats?.totals?.total ?? 0}</div>
                </div>
              </div>
            )}

            <div className="mt-6 text-sm text-neutral-300">Latest signups</div>
            <div className="mt-3 space-y-2">
              {(stats?.latest ?? []).slice(0, 8).map((s, idx) => (
                <div key={idx} className="rounded-xl border border-neutral-800 bg-black px-4 py-3">
                  <div className="font-mono text-sm">{s.phone}</div>
                  <div className="text-xs text-neutral-500">{s.created_at}</div>
                </div>
              ))}
              {!loading && !err && (stats?.latest?.length ?? 0) === 0 ? (
                <div className="text-neutral-500 text-sm">No signups yet.</div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
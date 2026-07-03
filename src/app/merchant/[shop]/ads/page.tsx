"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Campaign = {
  id: string;
  headline: string;
  body: string;
  bid_cents: number;
  radius_miles: number;
  status: "active" | "paused";
  created_at: string;
  sends_30d: number;
  spend_cents_30d: number;
};

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function AdsPage() {
  const params = useParams();
  const shopSlug = String(params?.shop ?? "");

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [hasLocation, setHasLocation] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [bidDollars, setBidDollars] = useState("0.25");
  const [radiusMiles, setRadiusMiles] = useState("5");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  const load = useCallback(async () => {
    if (!shopSlug) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/merchant/ad-campaigns?shop_slug=${encodeURIComponent(shopSlug)}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Failed to load campaigns");
      setCampaigns(json.campaigns ?? []);
      setHasLocation(json.has_location ?? true);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, [shopSlug]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    setCreateLoading(true);
    try {
      const res = await fetch("/api/merchant/ad-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop_slug: shopSlug,
          headline: headline.trim(),
          body: body.trim(),
          bid_dollars: Number(bidDollars),
          radius_miles: Number(radiusMiles),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Failed to create campaign");
      setShowCreate(false);
      setHeadline("");
      setBody("");
      setBidDollars("0.25");
      setRadiusMiles("5");
      await load();
    } catch (e: any) {
      setCreateError(e?.message ?? "Failed to create campaign");
    } finally {
      setCreateLoading(false);
    }
  }

  async function toggleStatus(campaign: Campaign) {
    const nextStatus = campaign.status === "active" ? "paused" : "active";
    setCampaigns((prev) => prev.map((c) => (c.id === campaign.id ? { ...c, status: nextStatus } : c)));
    try {
      await fetch(`/api/merchant/ad-campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch {
      await load(); // revert on failure
    }
  }

  async function deleteCampaign(id: string) {
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
    try {
      await fetch(`/api/merchant/ad-campaigns/${id}`, { method: "DELETE" });
    } catch {
      await load();
    }
  }

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-[#ededed] sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href={`/merchant/${shopSlug}`}
          className="inline-flex items-center gap-2 text-[12px] font-light tracking-[0.1em] text-[#555] transition-colors hover:text-[#ededed]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to dashboard
        </Link>

        <div className="mt-8">
          <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">ADVERTISING</p>
          <h1 className="mt-3 text-2xl font-extralight tracking-[-0.01em] text-white">Reach new customers</h1>
          <p className="mt-3 max-w-xl text-[13px] font-light leading-relaxed text-[#666]">
            Bid to send a push notification to customers who frequent shops near you but aren&rsquo;t your
            customers yet. Each customer sees at most 6 ad notifications a day across all merchants &mdash;
            the highest bidders win those slots. You&rsquo;re billed only when a notification is actually sent.
          </p>
        </div>

        {!hasLocation && (
          <div className="mt-6 rounded-2xl border border-yellow-900/30 bg-yellow-950/10 p-4 text-[13px] font-light text-yellow-400">
            Set your store address in Settings before creating an ad &mdash; targeting is based on your location.
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-900/30 p-4 text-[13px] font-light text-red-400">
            {error}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <p className="text-[11px] font-light tracking-[0.2em] text-[#555]">CAMPAIGNS</p>
          <button
            onClick={() => setShowCreate((v) => !v)}
            disabled={!hasLocation}
            className="rounded-full border border-[#ededed] px-5 py-2 text-[11px] font-light tracking-[0.1em] text-[#ededed] transition-all hover:bg-[#ededed] hover:text-black disabled:opacity-40"
          >
            {showCreate ? "Cancel" : "New campaign"}
          </button>
        </div>

        {showCreate && (
          <form onSubmit={handleCreate} className="mt-4 space-y-4 rounded-2xl border border-[#1a1a1a] p-6">
            <div>
              <label className="text-[11px] font-light tracking-[0.15em] text-[#555]">HEADLINE</label>
              <input
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                maxLength={80}
                placeholder="Free coffee for new customers"
                className="mt-2 w-full rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 text-[14px] font-light text-[#ededed] outline-none placeholder:text-[#333] focus:border-[#333]"
              />
            </div>
            <div>
              <label className="text-[11px] font-light tracking-[0.15em] text-[#555]">MESSAGE</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={200}
                rows={3}
                placeholder="Show this notification for 20% off your first visit."
                className="mt-2 w-full resize-none rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 text-[14px] font-light text-[#ededed] outline-none placeholder:text-[#333] focus:border-[#333]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-light tracking-[0.15em] text-[#555]">BID PER SEND</label>
                <div className="mt-2 flex items-center gap-2 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 focus-within:border-[#333]">
                  <span className="text-[14px] font-light text-[#555]">$</span>
                  <input
                    type="number"
                    min={0.05}
                    max={50}
                    step={0.05}
                    value={bidDollars}
                    onChange={(e) => setBidDollars(e.target.value)}
                    className="w-full bg-transparent py-3 text-[14px] font-light text-[#ededed] outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-light tracking-[0.15em] text-[#555]">RADIUS (MILES)</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  step={1}
                  value={radiusMiles}
                  onChange={(e) => setRadiusMiles(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 text-[14px] font-light text-[#ededed] outline-none focus:border-[#333]"
                />
              </div>
            </div>
            <p className="text-[11px] font-light text-[#444]">
              Higher bids win more of the 6 daily slots when multiple merchants target the same customer.
            </p>
            {createError && <p className="text-[12px] font-light text-red-400">{createError}</p>}
            <button
              type="submit"
              disabled={createLoading || !headline.trim() || !body.trim()}
              className="w-full rounded-xl border border-[#ededed] py-3 text-[12px] font-light tracking-[0.1em] text-[#ededed] transition-all hover:bg-[#ededed] hover:text-black disabled:opacity-40"
            >
              {createLoading ? "Creating…" : "Launch campaign"}
            </button>
          </form>
        )}

        <div className="mt-6 space-y-3">
          {loading ? (
            <p className="text-[13px] font-light text-[#444]">Loading…</p>
          ) : campaigns.length === 0 ? (
            <p className="text-[13px] font-light text-[#444]">No campaigns yet.</p>
          ) : (
            campaigns.map((c) => (
              <div key={c.id} className="rounded-2xl border border-[#1a1a1a] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[14px] font-light text-[#ededed]">{c.headline}</p>
                    <p className="mt-1 text-[12px] font-light text-[#666]">{c.body}</p>
                    <p className="mt-2 text-[11px] font-light text-[#444]">
                      {money(c.bid_cents)}/send &middot; {c.radius_miles}mi radius &middot; {c.sends_30d} sends
                      (30d) &middot; {money(c.spend_cents_30d)} spent
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-light tracking-[0.1em] ${
                        c.status === "active"
                          ? "border-emerald-900/40 text-emerald-400"
                          : "border-[#2a2a2a] text-[#666]"
                      }`}
                    >
                      {c.status === "active" ? "ACTIVE" : "PAUSED"}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleStatus(c)}
                        className="text-[11px] font-light text-[#555] hover:text-[#ededed]"
                      >
                        {c.status === "active" ? "Pause" : "Resume"}
                      </button>
                      <button
                        onClick={() => deleteCampaign(c.id)}
                        className="text-[11px] font-light text-[#555] hover:text-red-400"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}

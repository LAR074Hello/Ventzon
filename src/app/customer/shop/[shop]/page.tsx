"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Check, ArrowLeft, Share2, Trophy, X, Clock } from "lucide-react";

type ShopSettings = {
  shop_slug: string;
  shop_name: string | null;
  deal_title: string | null;
  deal_details: string | null;
  reward_goal: number;
  logo_url: string | null;
};

type CustomerStatus = {
  visits: number;
  last_checkin_date: string | null;
};

type HistoryEntry = {
  checkin_date: string;
  created_at: string;
};

async function haptic(style: "light" | "medium" | "success" = "medium") {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return;
    const { Haptics, ImpactStyle, NotificationType } = await import("@capacitor/haptics");
    if (style === "success") {
      await Haptics.notification({ type: NotificationType.Success });
    } else {
      await Haptics.impact({ style: style === "light" ? ImpactStyle.Light : ImpactStyle.Medium });
    }
  } catch {}
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ── Animated check-in overlay ── */
function CheckinOverlay({ visits, goal, onDismiss }: { visits: number; goal: number; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 60);
    const t2 = setTimeout(onDismiss, 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDismiss]);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black">
      <div
        className="flex flex-col items-center transition-all duration-500"
        style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)" }}
      >
        <div className="flex h-24 w-24 items-center justify-center rounded-full border border-[#1e4a1e] bg-[#0a2e0a]">
          <Check className="h-10 w-10 text-emerald-400" strokeWidth={1.5} />
        </div>
        <h2 className="mt-6 text-[22px] font-extralight tracking-[-0.01em] text-[#ededed]">Checked in!</h2>
        <p className="mt-2 text-[14px] font-light text-[#555]">
          {visits} of {goal} visit{goal !== 1 ? "s" : ""} collected
        </p>
        <div className="mt-6 flex gap-2">
          {Array.from({ length: Math.min(goal, 10) }).map((_, i) => (
            <div key={i} className="h-2 w-2 rounded-full transition-colors" style={{ backgroundColor: i < visits ? "#4ade80" : "#1a1a1a" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Reward ready full-screen ── */
function RewardScreen({ shop, onClose, onRedeemed }: { shop: ShopSettings; onClose: () => void; onRedeemed: () => void }) {
  const joinUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/join/${shop.shop_slug}`;

  async function share() {
    await haptic("light");
    try {
      await navigator.share({ title: shop.shop_name ?? "Reward", text: `I just earned a reward at ${shop.shop_name}! Check them out on Ventzon.`, url: joinUrl });
    } catch {}
  }

  async function markRedeemed() {
    await haptic("success");
    onRedeemed();
  }

  return (
    <div className="fixed inset-0 z-[150] flex flex-col bg-black" style={{ paddingTop: "env(safe-area-inset-top,0px)", paddingBottom: "env(safe-area-inset-bottom,0px)" }}>
      <div className="flex justify-end px-5 pt-4">
        <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1a1a1a] bg-[#0a0a0a]">
          <X className="h-4 w-4 text-[#888]" />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="flex h-28 w-28 items-center justify-center rounded-3xl border border-yellow-900/40 bg-yellow-950/20">
          <Trophy className="h-12 w-12 text-yellow-400" strokeWidth={1} />
        </div>
        <h2 className="mt-8 text-[28px] font-extralight tracking-[-0.02em] text-[#ededed]">Reward earned</h2>
        <p className="mt-3 text-[15px] font-light text-[#555]">{shop.deal_title}</p>
        {shop.deal_details && <p className="mt-1 text-[13px] font-light text-[#333]">{shop.deal_details}</p>}
        <div className="mt-10 w-full rounded-2xl border border-yellow-900/30 bg-yellow-950/10 px-6 py-5">
          <p className="text-[11px] font-light tracking-[0.2em] text-yellow-600">SHOW THIS TO THE CASHIER</p>
          <p className="mt-2 text-[13px] font-light text-[#888]">{shop.shop_name}</p>
        </div>
      </div>

      <div className="px-5 pb-8 space-y-3">
        <button
          onClick={markRedeemed}
          className="w-full rounded-2xl bg-[#ededed] py-4 text-[13px] font-light tracking-[0.2em] text-black transition-all active:bg-[#d0d0d0]"
        >
          MARK AS REDEEMED
        </button>
        <button
          onClick={share}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] py-4 text-[13px] font-light tracking-[0.15em] text-[#888]"
        >
          <Share2 className="h-4 w-4" />
          SHARE WITH FRIENDS
        </button>
      </div>
    </div>
  );
}

export default function CustomerShopPage() {
  const params = useParams<{ shop: string }>();
  const router = useRouter();
  const shopSlug = String(params?.shop ?? "").toLowerCase();
  const supabase = createSupabaseBrowserClient();

  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [status, setStatus] = useState<CustomerStatus | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [showCheckinOverlay, setShowCheckinOverlay] = useState(false);
  const [showRewardScreen, setShowRewardScreen] = useState(false);
  const [newStampIndex, setNewStampIndex] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const today = new Date().toISOString().slice(0, 10);
  const visits = status?.visits ?? 0;
  const goal = settings?.reward_goal ?? 5;
  const checkedInToday = status?.last_checkin_date === today;
  const isReady = visits >= goal;

  async function loadHistory() {
    const res = await fetch(`/api/customer/history?shop_slug=${shopSlug}`);
    if (res.ok) {
      const data = await res.json();
      setHistory(data.history ?? []);
    }
  }

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      const res = await fetch(`/api/join/settings?shop_slug=${shopSlug}`);
      const json = await res.json();
      if (res.ok) setSettings(json.settings);

      if (session?.user?.email) {
        const memberRes = await fetch("/api/customer/memberships");
        const memberData = await memberRes.json();
        const match = (memberData.memberships ?? []).find((m: any) => m.shop_slug === shopSlug);
        if (match) setStatus({ visits: match.visits, last_checkin_date: match.last_checkin_date });
        await loadHistory();
      }

      setLoading(false);
    }
    load();
  }, [shopSlug]);

  async function handleCheckin() {
    if (!user?.email) {
      router.push(`/customer/auth?redirect=/customer/shop/${shopSlug}`);
      return;
    }
    setErr(null);
    setCheckinLoading(true);
    await haptic("medium");
    try {
      const res = await fetch("/api/join/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop_slug: shopSlug, email: user.email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Check-in failed");
      const newVisits = json.visits as number;
      setNewStampIndex(Math.min(newVisits, goal) - 1);
      setStatus({ visits: newVisits, last_checkin_date: today });
      await loadHistory();
      await haptic("success");
      setShowCheckinOverlay(true);
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong");
    } finally {
      setCheckinLoading(false);
    }
  }

  async function handleRedeemed() {
    setShowRewardScreen(false);
    // Reload fresh data from DB (visits already reset to 0 server-side)
    const memberRes = await fetch("/api/customer/memberships");
    const memberData = await memberRes.json();
    const match = (memberData.memberships ?? []).find((m: any) => m.shop_slug === shopSlug);
    if (match) setStatus({ visits: match.visits, last_checkin_date: match.last_checkin_date });
    if (user?.email) await loadHistory();
    setNewStampIndex(null);
  }

  async function handleShare() {
    await haptic("light");
    const joinUrl = `${window.location.origin}/join/${shopSlug}`;
    try {
      await navigator.share({ title: settings?.shop_name ?? "Check this out", text: `Earn rewards at ${settings?.shop_name ?? "this store"} on Ventzon!`, url: joinUrl });
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#333] border-t-[#ededed]" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black px-8 text-center">
        <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">NOT FOUND</p>
        <h1 className="mt-4 text-2xl font-extralight text-[#ededed]">Shop not found</h1>
        <p className="mt-3 text-[14px] font-light text-[#555]">
          This shop doesn&rsquo;t exist or may have been removed.
        </p>
        <button
          onClick={() => router.push("/customer/explore")}
          className="mt-8 rounded-full border border-[#333] px-6 py-3 text-[12px] font-light tracking-[0.15em] text-[#ededed] transition-all duration-300 hover:border-[#666]"
        >
          Explore shops
        </button>
      </div>
    );
  }

  const shopName = settings?.shop_name ?? shopSlug;

  return (
    <div className="flex min-h-screen flex-col bg-black">
      {showCheckinOverlay && (
        <CheckinOverlay visits={visits} goal={goal} onDismiss={() => setShowCheckinOverlay(false)} />
      )}
      {showRewardScreen && settings && (
        <RewardScreen shop={settings} onClose={() => setShowRewardScreen(false)} onRedeemed={handleRedeemed} />
      )}

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="fixed left-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[#1a1a1a] bg-black/80 backdrop-blur-sm"
        style={{ top: "calc(env(safe-area-inset-top, 20px) + 8px)" }}
      >
        <ArrowLeft className="h-4 w-4 text-[#ededed]" />
      </button>

      {/* Share */}
      <button
        onClick={handleShare}
        className="fixed right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[#1a1a1a] bg-black/80 backdrop-blur-sm"
        style={{ top: "calc(env(safe-area-inset-top, 20px) + 8px)" }}
      >
        <Share2 className="h-4 w-4 text-[#888]" />
      </button>

      {/* Hero */}
      <div className="flex flex-col items-center px-6 pb-8" style={{ paddingTop: "calc(env(safe-area-inset-top, 20px) + 64px)" }}>
        {settings?.logo_url ? (
          <img src={settings.logo_url} alt={shopName} className="h-24 w-24 rounded-2xl border border-[#1a1a1a] object-cover" />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a]">
            <span className="text-3xl font-extralight text-[#555]">{shopName.charAt(0).toUpperCase()}</span>
          </div>
        )}
        <h1 className="mt-5 text-[20px] font-extralight tracking-[-0.01em] text-[#ededed]">{shopName}</h1>
        {settings?.deal_title && (
          <div className="mt-3 rounded-xl border border-[#1a1a1a] px-5 py-3 text-center">
            <p className="text-[13px] font-light text-[#888]">{settings.deal_title}</p>
            {settings.deal_details && <p className="mt-1 text-[12px] font-light text-[#555]">{settings.deal_details}</p>}
          </div>
        )}
      </div>

      {/* Loyalty card */}
      <div className="mx-5 rounded-2xl border border-[#1a1a1a] bg-[#080808] p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-light tracking-[0.2em] text-[#555]">YOUR PROGRESS</p>
          <p className="text-[11px] font-light text-[#444]">{visits}/{goal}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: goal }).map((_, i) => {
            const filled = i < visits;
            const isNew = i === newStampIndex;
            return (
              <div
                key={i}
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${
                  filled
                    ? isReady ? "bg-yellow-400/90" : "bg-[#ededed]"
                    : "border border-[#222] bg-transparent"
                } ${isNew ? "animate-stamp-pop" : ""}`}
              >
                {filled && <Check className="h-4 w-4 text-black" />}
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-[12px] font-light text-[#444]">
          {isReady
            ? "Tap below to view your reward"
            : checkedInToday
            ? "You've already checked in today — see you tomorrow!"
            : "Scan the QR code in-store to check in"}
        </p>
      </div>

      {err && (
        <div className="mx-5 mt-4 rounded-2xl border border-red-900/30 bg-red-950/20 px-4 py-3 text-center">
          <p className="text-[13px] font-light text-red-300/80">{err}</p>
        </div>
      )}

      {/* Visit history */}
      {history.length > 0 && (
        <div className="mx-5 mt-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-3.5 w-3.5 text-[#444]" />
            <p className="text-[11px] font-light tracking-[0.15em] text-[#444]">VISIT HISTORY</p>
          </div>
          <div className="rounded-2xl border border-[#1a1a1a] overflow-hidden">
            {history.slice(0, 8).map((entry, i) => (
              <div
                key={entry.checkin_date}
                className={`flex items-center justify-between px-4 py-3 ${i > 0 ? "border-t border-[#111]" : ""}`}
              >
                <p className="text-[13px] font-light text-[#888]">{formatDate(entry.checkin_date)}</p>
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1a1a1a]">
                  <Check className="h-3 w-3 text-[#555]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1" />

      {/* Actions */}
      <div className="px-5 pt-4 space-y-3" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}>
        {isReady && (
          <button
            onClick={async () => { await haptic("medium"); setShowRewardScreen(true); }}
            className="w-full rounded-2xl border border-yellow-900/40 bg-yellow-950/20 py-4 text-[13px] font-light tracking-[0.2em] text-yellow-300 transition-all active:bg-yellow-950/30"
          >
            VIEW MY REWARD
          </button>
        )}
        {!user && (
          <button
            onClick={() => router.push(`/customer/auth?redirect=/customer/shop/${shopSlug}`)}
            className="w-full rounded-2xl bg-[#ededed] py-4 text-[13px] font-light tracking-[0.2em] text-black transition-all active:bg-[#d0d0d0]"
          >
            SIGN IN TO TRACK PROGRESS
          </button>
        )}
        {user && !checkedInToday && !isReady && (
          <button
            onClick={handleCheckin}
            disabled={checkinLoading}
            className="w-full rounded-2xl bg-[#ededed] py-4 text-[13px] font-light tracking-[0.2em] text-black transition-all active:bg-[#d0d0d0] disabled:opacity-40"
          >
            {checkinLoading ? "CHECKING IN…" : "CHECK IN HERE"}
          </button>
        )}
        {user && checkedInToday && !isReady && (
          <div className="w-full rounded-2xl border border-[#1a1a1a] py-4 text-center">
            <p className="text-[12px] font-light tracking-[0.15em] text-[#444]">CHECKED IN TODAY</p>
          </div>
        )}
      </div>
    </div>
  );
}

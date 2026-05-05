"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Check, Compass, Trophy, WifiOff, ChevronRight } from "lucide-react";

type Membership = {
  shop_slug: string;
  shop_name: string;
  deal_title: string | null;
  reward_goal: number;
  visits: number;
  last_checkin_date: string | null;
  logo_url: string | null;
};

async function requestReview() {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return;
    const appStoreId = "6763768638";
    window.open(`itms-apps://itunes.apple.com/app/id${appStoreId}?action=write-review`, "_system");
  } catch {}
}

const REVIEW_KEY = "ventzon_review_requested";

// Per-shop accent colors — deterministic from shop name
const ACCENT_COLORS = [
  "#7c3aed", "#0891b2", "#059669", "#d97706",
  "#dc2626", "#db2777", "#2563eb", "#ca8a04",
];
function hashName(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h);
}
function getAccent(name: string) {
  return ACCENT_COLORS[hashName(name) % ACCENT_COLORS.length];
}

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#1f1f1f]">
      <div className="bg-[#0d0d0d] px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="skeleton h-11 w-11 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3.5 w-28 rounded" />
            <div className="skeleton h-3 w-36 rounded" />
          </div>
        </div>
      </div>
      <div className="bg-[#080808] px-5 pb-5 pt-4">
        <div className="flex gap-2 mb-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-10 w-10 rounded-full" />
          ))}
        </div>
        <div className="skeleton h-3 w-40 rounded" />
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [user, setUser] = useState<any>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const pulling = useRef(false);
  const [pullProgress, setPullProgress] = useState(0);

  const loadMemberships = useCallback(async () => {
    try {
      const res = await fetch("/api/customer/memberships");
      if (res.status === 401) {
        router.replace("/customer/auth?redirect=/customer/home");
        return [];
      }
      const data = await res.json();
      const list: Membership[] = data.memberships ?? [];
      setMemberships(list);
      setOffline(false);
      const hasReward = list.some((m) => m.visits >= m.reward_goal);
      if (hasReward && !localStorage.getItem(REVIEW_KEY)) {
        localStorage.setItem(REVIEW_KEY, "1");
        setTimeout(requestReview, 1500);
      }
      return list;
    } catch {
      setOffline(true);
      return [];
    }
  }, [router]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/customer/auth?redirect=/customer/home");
        return;
      }
      setUser(data.session.user);
      loadMemberships().finally(() => setLoading(false));
    });
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await loadMemberships();
    setRefreshing(false);
  }

  function onTouchStart(e: React.TouchEvent) {
    if (scrollRef.current && scrollRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  }
  function onTouchMove(e: React.TouchEvent) {
    if (!pulling.current) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0 && delta < 100) setPullProgress(delta / 100);
  }
  async function onTouchEnd() {
    if (pulling.current && pullProgress > 0.6 && !refreshing) {
      setPullProgress(0);
      pulling.current = false;
      await handleRefresh();
    } else {
      setPullProgress(0);
      pulling.current = false;
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const firstName = user?.user_metadata?.full_name?.split(" ")[0];
  const readyMemberships = memberships.filter(m => m.visits >= m.reward_goal);

  return (
    <div
      ref={scrollRef}
      className="flex min-h-full flex-col bg-black"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull indicator */}
      {pullProgress > 0 && (
        <div className="flex justify-center py-2" style={{ opacity: pullProgress }}>
          <div className="h-4 w-4 rounded-full border border-[#333] border-t-[#ededed]"
            style={{ transform: `rotate(${pullProgress * 360}deg)` }} />
        </div>
      )}

      {/* Header */}
      <div className="px-5 pb-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 20px) + 16px)" }}>
        <p className="text-[13px] font-normal text-[#666]">
          {firstName ? `Welcome back, ${firstName}` : "Your loyalty cards"}
        </p>
        <h1 className="mt-0.5 text-[26px] font-semibold tracking-[-0.02em] text-[#f5f5f5]">My Cards</h1>
      </div>

      {/* Refresh indicator */}
      {refreshing && (
        <div className="flex justify-center pb-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#333] border-t-[#ededed]" />
        </div>
      )}

      {/* Offline banner */}
      {offline && (
        <div className="mx-5 mb-4 flex items-center gap-3 rounded-2xl border border-[#1f1f1f] bg-[#0a0a0a] px-4 py-3">
          <WifiOff className="h-4 w-4 shrink-0 text-[#555]" />
          <p className="text-[13px] font-normal text-[#666]">No connection — showing cached cards</p>
        </div>
      )}

      {/* Ready rewards — prominent banner */}
      {!loading && readyMemberships.length > 0 && (
        <div className="mx-5 mb-5 space-y-2">
          {readyMemberships.map((m) => (
            <button
              key={m.shop_slug}
              onClick={() => router.push(`/customer/shop/${m.shop_slug}`)}
              className="w-full flex items-center gap-4 rounded-2xl border border-yellow-800/40 bg-yellow-950/20 px-4 py-4 text-left active:bg-yellow-950/30 transition-colors"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-400">
                <Trophy className="h-5 w-5 text-black" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-yellow-300">Reward ready!</p>
                <p className="text-[12px] font-normal text-yellow-600/80 truncate">{m.shop_name} · {m.deal_title}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-yellow-700" />
            </button>
          ))}
        </div>
      )}

      {/* Cards */}
      <div className="flex-1 px-5 pb-4">
        {loading ? (
          <div className="space-y-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : memberships.length === 0 ? (
          <EmptyState
            onScan={() => router.push("/customer/scan")}
            onExplore={() => router.push("/customer/explore")}
          />
        ) : (
          <div className="space-y-4">
            {memberships.map((m) => (
              <LoyaltyCard
                key={m.shop_slug}
                membership={m}
                checkedInToday={m.last_checkin_date === today}
                onClick={() => router.push(`/customer/shop/${m.shop_slug}`)}
              />
            ))}
            <button
              onClick={handleRefresh}
              className="w-full py-3 text-[11px] font-medium tracking-[0.15em] text-[#333] transition-colors active:text-[#555]"
            >
              REFRESH
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function LoyaltyCard({ membership, checkedInToday, onClick }: {
  membership: Membership; checkedInToday: boolean; onClick: () => void;
}) {
  const { shop_name, deal_title, reward_goal, visits, logo_url } = membership;
  const isReady = visits >= reward_goal;
  const progress = Math.min(visits, reward_goal);
  const accent = getAccent(shop_name);
  const remaining = reward_goal - progress;

  return (
    <button
      onClick={onClick}
      className="w-full overflow-hidden rounded-2xl text-left transition-transform duration-150 active:scale-[0.99]"
      style={{
        border: isReady
          ? "1px solid rgba(161,108,24,0.35)"
          : `1px solid ${accent}22`,
      }}
    >
      {/* Card header — unique per shop */}
      <div
        className="flex items-center justify-between px-5 pt-5 pb-4"
        style={{
          background: isReady
            ? "linear-gradient(135deg, rgba(161,108,24,0.12), rgba(161,108,24,0.04))"
            : `linear-gradient(135deg, ${accent}18, ${accent}06, transparent)`,
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {logo_url ? (
            <img src={logo_url} alt={shop_name} className="h-11 w-11 shrink-0 rounded-xl object-cover" />
          ) : (
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{ background: `${accent}20`, border: `1px solid ${accent}35` }}
            >
              <span className="text-[18px] font-semibold" style={{ color: accent }}>
                {shop_name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-[#f5f5f5] truncate">{shop_name}</p>
            {deal_title && (
              <p className="mt-0.5 text-[12px] font-normal text-[#888] truncate">{deal_title}</p>
            )}
          </div>
        </div>

        {/* Status badge */}
        {isReady ? (
          <span className="ml-3 shrink-0 rounded-full bg-yellow-400 px-3 py-1 text-[10px] font-bold tracking-wide text-black">
            REDEEM
          </span>
        ) : checkedInToday ? (
          <span
            className="ml-3 shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold"
            style={{ background: `${accent}18`, color: accent }}
          >
            ✓ TODAY
          </span>
        ) : null}
      </div>

      {/* Stamps section */}
      <div className="bg-[#080808] px-5 pb-5 pt-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          {Array.from({ length: reward_goal }).map((_, i) => (
            <div
              key={i}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${
                i < progress
                  ? isReady
                    ? "bg-yellow-400"
                    : "bg-[#ededed]"
                  : "border-2 border-[#252525] bg-transparent"
              }`}
            >
              {i < progress && <Check className="h-4 w-4 text-black" strokeWidth={2.5} />}
            </div>
          ))}
          {/* Progress counter */}
          <span className="ml-auto text-[13px] font-semibold text-[#444]">
            {progress}<span className="text-[#2a2a2a]">/{reward_goal}</span>
          </span>
        </div>

        <p className="mt-3 text-[12px] font-normal text-[#555]">
          {isReady
            ? "Show this screen at the register to redeem"
            : `${remaining} more visit${remaining === 1 ? "" : "s"} to earn your reward`}
        </p>
      </div>
    </button>
  );
}

function EmptyState({ onScan, onExplore }: { onScan: () => void; onExplore: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-[#1f1f1f] bg-[#0d0d0d]">
        <Compass className="h-9 w-9 text-[#333]" />
      </div>
      <p className="mt-6 text-[20px] font-semibold text-[#f5f5f5]">No loyalty cards yet</p>
      <p className="mt-2 text-[13px] font-normal leading-relaxed text-[#666]">
        Scan a QR code at any participating store<br />to start collecting stamps
      </p>
      <button
        onClick={onScan}
        className="mt-8 w-full rounded-2xl bg-[#ededed] py-4 text-[13px] font-semibold tracking-[0.08em] text-black transition-all duration-200 active:bg-[#d4d4d4]"
      >
        SCAN A QR CODE
      </button>
      <button
        onClick={onExplore}
        className="mt-3 w-full rounded-2xl border border-[#1f1f1f] py-4 text-[13px] font-medium tracking-[0.08em] text-[#666] transition-all duration-200 active:bg-[#0a0a0a]"
      >
        BROWSE STORES
      </button>
    </div>
  );
}

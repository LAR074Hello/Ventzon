"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Check, Compass, Trophy, WifiOff } from "lucide-react";

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
    // Opens the App Store rating prompt via deep link
    // Replace APP_STORE_ID with your actual App Store ID when published
    const appStoreId = "6763768638";
    window.open(`itms-apps://itunes.apple.com/app/id${appStoreId}?action=write-review`, "_system");
  } catch {}
}

const REVIEW_KEY = "ventzon_review_requested";

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-[#1f1f1f] bg-[#0d0d0d] p-5">
      <div className="flex items-center gap-3">
        <div className="skeleton h-12 w-12 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3.5 w-32 rounded" />
          <div className="skeleton h-3 w-24 rounded" />
        </div>
      </div>
      <div className="mt-4 flex gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-10 w-10 rounded-full" />
        ))}
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

  // Pull-to-refresh
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

      // Trigger app review if user has earned a reward and hasn't been asked
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

  // Touch pull-to-refresh
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
  const readyCount = memberships.filter(m => m.visits >= m.reward_goal).length;

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
          <div className="h-4 w-4 rounded-full border border-[#333] border-t-[#ededed]" style={{ transform: `rotate(${pullProgress * 360}deg)` }} />
        </div>
      )}

      {/* Header */}
      <div className="px-5 pb-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 20px) + 16px)" }}>
        <h1 className="text-[22px] font-semibold tracking-[-0.01em] text-[#f5f5f5]">My Cards</h1>
        <p className="mt-1 text-[13px] font-normal text-[#666]">
          {firstName ? `Welcome back, ${firstName}` : "Your loyalty cards"}
        </p>
      </div>

      {/* Refresh indicator */}
      {refreshing && (
        <div className="flex justify-center pb-3">
          <div className="h-4 w-4 animate-spin rounded-full border border-[#333] border-t-[#ededed]" />
        </div>
      )}

      {/* Offline banner */}
      {offline && (
        <div className="mx-5 mb-4 flex items-center gap-3 rounded-2xl border border-[#1f1f1f] bg-[#0a0a0a] px-4 py-3">
          <WifiOff className="h-4 w-4 shrink-0 text-[#666]" />
          <p className="text-[13px] font-normal text-[#666]">No connection — showing cached cards</p>
        </div>
      )}

      {/* Ready rewards banner */}
      {!loading && readyCount > 0 && (
        <div
          className="mx-5 mb-4 flex items-center gap-3 rounded-2xl border border-yellow-900/30 bg-yellow-950/10 px-4 py-3 cursor-pointer active:bg-yellow-950/20"
          onClick={() => {
            const ready = memberships.find(m => m.visits >= m.reward_goal);
            if (ready) router.push(`/customer/shop/${ready.shop_slug}`);
          }}
        >
          <Trophy className="h-4 w-4 shrink-0 text-yellow-500" strokeWidth={1.5} />
          <p className="flex-1 text-[13px] font-normal text-[#f5f5f5]">
            {readyCount === 1 ? "You have a reward ready to redeem" : `${readyCount} rewards ready to redeem`}
          </p>
          <span className="text-[11px] text-yellow-600">TAP →</span>
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
              className="w-full py-3 text-[11px] font-light tracking-[0.15em] text-[#444] transition-colors active:text-[#666]"
            >
              REFRESH
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function LoyaltyCard({ membership, checkedInToday, onClick }: { membership: Membership; checkedInToday: boolean; onClick: () => void }) {
  const { shop_name, deal_title, reward_goal, visits, logo_url } = membership;
  const isReady = visits >= reward_goal;
  const progress = Math.min(visits, reward_goal);

  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl border border-[#1f1f1f] bg-[#0d0d0d] p-5 text-left transition-colors duration-200 active:bg-[#111]"
      style={isReady ? { borderColor: "rgba(161,108,24,0.3)" } : {}}
    >
      <div className="flex items-center gap-3">
        {logo_url ? (
          <img src={logo_url} alt={shop_name} className="h-12 w-12 shrink-0 rounded-xl object-cover" />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#1f1f1f] bg-[#111]">
            <span className="text-lg font-light text-[#666]">{shop_name.charAt(0).toUpperCase()}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-medium text-[#f5f5f5] truncate">{shop_name}</p>
          {deal_title && <p className="mt-0.5 text-[12px] font-normal text-[#666] truncate">{deal_title}</p>}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {checkedInToday && (
            <span className="rounded-full border border-emerald-900/40 bg-emerald-950/20 px-2.5 py-1 text-[10px] font-light tracking-[0.1em] text-emerald-400/70">VISITED</span>
          )}
          {isReady && (
            <span className="rounded-full border border-yellow-900/40 bg-yellow-950/20 px-2.5 py-1 text-[10px] font-light tracking-[0.1em] text-yellow-400/70">REDEEM</span>
          )}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          {Array.from({ length: reward_goal }).map((_, i) => (
            <div
              key={i}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${
                i < progress ? isReady ? "bg-yellow-400/90" : "bg-[#ededed]" : "border-2 border-[#252525] bg-transparent"
              }`}
            >
              {i < progress && <Check className="h-4 w-4 text-black" />}
            </div>
          ))}
        </div>
        <p className="mt-2.5 text-[11px] font-normal text-[#666]">
          {isReady ? "Show this screen at the register to redeem" : `${reward_goal - progress} more visit${reward_goal - progress === 1 ? "" : "s"} to earn your reward`}
        </p>
      </div>
    </button>
  );
}

function EmptyState({ onScan, onExplore }: { onScan: () => void; onExplore: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-[#1f1f1f] bg-[#0a0a0a]">
        <Compass className="h-9 w-9 text-[#444]" />
      </div>
      <p className="mt-6 text-[18px] font-semibold text-[#f5f5f5]">No loyalty cards yet</p>
      <p className="mt-2 text-[13px] font-normal leading-relaxed text-[#666]">
        Scan a QR code in-store to start earning rewards automatically
      </p>
      <button
        onClick={onScan}
        className="mt-8 w-full rounded-2xl bg-[#ededed] py-4 text-[13px] font-medium tracking-[0.15em] text-black transition-all duration-200 active:bg-[#d4d4d4]"
      >
        SCAN A QR CODE
      </button>
      <button
        onClick={onExplore}
        className="mt-3 w-full rounded-2xl border border-[#1f1f1f] py-4 text-[13px] font-normal tracking-[0.15em] text-[#666] transition-all duration-200 active:bg-[#0a0a0a]"
      >
        BROWSE STORES
      </button>
    </div>
  );
}

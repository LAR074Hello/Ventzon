"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Check, Compass } from "lucide-react";

type Membership = {
  shop_slug: string;
  shop_name: string;
  deal_title: string | null;
  reward_goal: number;
  visits: number;
  last_checkin_date: string | null;
  logo_url: string | null;
};

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-[#1a1a1a] bg-[#080808] p-5">
      <div className="flex items-center gap-3">
        <div className="skeleton h-12 w-12 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3.5 w-32 rounded" />
          <div className="skeleton h-3 w-24 rounded" />
        </div>
      </div>
      <div className="mt-4 flex gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-7 w-7 rounded-full" />
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

  const loadMemberships = useCallback(async () => {
    const res = await fetch("/api/customer/memberships");
    if (res.status === 401) {
      router.replace("/customer/auth?redirect=/customer/home");
      return;
    }
    const data = await res.json();
    setMemberships(data.memberships ?? []);
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

  const today = new Date().toISOString().slice(0, 10);
  const firstName = user?.user_metadata?.full_name?.split(" ")[0];

  return (
    <div className="flex min-h-full flex-col bg-black">
      {/* Header */}
      <div className="px-5 pb-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 20px) + 16px)" }}>
        <h1 className="text-[22px] font-extralight tracking-[-0.01em] text-[#ededed]">My Cards</h1>
        <p className="mt-1 text-[13px] font-light text-[#555]">
          {firstName ? `Welcome back, ${firstName}` : "Your loyalty cards"}
        </p>
      </div>

      {/* Pull to refresh indicator */}
      {refreshing && (
        <div className="flex justify-center pb-3">
          <div className="h-4 w-4 animate-spin rounded-full border border-[#333] border-t-[#ededed]" />
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
              className="w-full py-3 text-[11px] font-light tracking-[0.15em] text-[#333] transition-colors active:text-[#555]"
            >
              REFRESH
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function LoyaltyCard({
  membership,
  checkedInToday,
  onClick,
}: {
  membership: Membership;
  checkedInToday: boolean;
  onClick: () => void;
}) {
  const { shop_name, deal_title, reward_goal, visits, logo_url } = membership;
  const isReady = visits >= reward_goal;
  const progress = Math.min(visits, reward_goal);

  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl border border-[#1a1a1a] bg-[#080808] p-5 text-left transition-colors duration-200 active:bg-[#111]"
    >
      <div className="flex items-center gap-3">
        {logo_url ? (
          <img src={logo_url} alt={shop_name} className="h-12 w-12 shrink-0 rounded-xl object-cover" />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#1a1a1a] bg-[#111]">
            <span className="text-lg font-extralight text-[#555]">
              {shop_name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-light text-[#ededed] truncate">{shop_name}</p>
          {deal_title && (
            <p className="mt-0.5 text-[12px] font-light text-[#555] truncate">{deal_title}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {checkedInToday && (
            <span className="rounded-full border border-emerald-900/40 bg-emerald-950/20 px-2.5 py-1 text-[10px] font-light tracking-[0.1em] text-emerald-400/70">
              VISITED
            </span>
          )}
          {isReady && (
            <span className="rounded-full border border-yellow-900/40 bg-yellow-950/20 px-2.5 py-1 text-[10px] font-light tracking-[0.1em] text-yellow-400/70">
              REDEEM
            </span>
          )}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          {Array.from({ length: reward_goal }).map((_, i) => (
            <div
              key={i}
              className={`flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300 ${
                i < progress
                  ? isReady ? "bg-yellow-400/90" : "bg-[#ededed]"
                  : "border border-[#222] bg-transparent"
              }`}
            >
              {i < progress && (
                <Check className="h-3.5 w-3.5 text-black" />
              )}
            </div>
          ))}
        </div>
        <p className="mt-2.5 text-[11px] font-light text-[#444]">
          {isReady
            ? "Show this screen at the register to redeem"
            : `${reward_goal - progress} more visit${reward_goal - progress === 1 ? "" : "s"} to earn your reward`}
        </p>
      </div>
    </button>
  );
}

function EmptyState({ onScan, onExplore }: { onScan: () => void; onExplore: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-[#1a1a1a] bg-[#0a0a0a]">
        <Compass className="h-9 w-9 text-[#333]" />
      </div>
      <p className="mt-6 text-[18px] font-extralight text-[#ededed]">No loyalty cards yet</p>
      <p className="mt-2 text-[13px] font-light leading-relaxed text-[#555]">
        Scan a QR code in-store to start{"\n"}earning rewards automatically
      </p>
      <button
        onClick={onScan}
        className="mt-8 w-full rounded-2xl bg-[#ededed] py-4 text-[13px] font-light tracking-[0.15em] text-black transition-all duration-200 active:bg-[#ccc]"
      >
        SCAN A QR CODE
      </button>
      <button
        onClick={onExplore}
        className="mt-3 w-full rounded-2xl border border-[#1a1a1a] py-4 text-[13px] font-light tracking-[0.15em] text-[#555] transition-all duration-200 active:bg-[#0a0a0a]"
      >
        BROWSE STORES
      </button>
    </div>
  );
}

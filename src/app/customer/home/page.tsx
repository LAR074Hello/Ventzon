"use client";

import { useEffect, useState } from "react";
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

export default function HomePage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [user, setUser] = useState<any>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/customer/auth?redirect=/customer/home");
        return;
      }
      setUser(data.session.user);
      loadMemberships();
    });
  }, []);

  async function loadMemberships() {
    const res = await fetch("/api/customer/memberships");
    if (res.status === 401) {
      router.replace("/customer/auth?redirect=/customer/home");
      return;
    }
    const data = await res.json();
    setMemberships(data.memberships ?? []);
    setLoading(false);
  }

  const today = new Date().toISOString().slice(0, 10);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#333] border-t-[#ededed]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col bg-black">
      {/* Header */}
      <div className="px-5 pb-4" style={{ paddingTop: 'calc(env(safe-area-inset-top, 20px) + 16px)' }}>
        <h1 className="text-[22px] font-extralight tracking-[-0.01em] text-[#ededed]">
          My Cards
        </h1>
        <p className="mt-1 text-[13px] font-light text-[#555]">
          {user?.user_metadata?.full_name
            ? `Welcome back, ${user.user_metadata.full_name.split(" ")[0]}`
            : "Your loyalty cards"}
        </p>
      </div>

      {/* Cards */}
      <div className="flex-1 px-5 pb-4">
        {memberships.length === 0 ? (
          <EmptyState onExplore={() => router.push("/customer/explore")} />
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
      {/* Top row */}
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
        {checkedInToday && (
          <span className="shrink-0 rounded-full border border-emerald-900/40 bg-emerald-950/20 px-2.5 py-1 text-[10px] font-light tracking-[0.1em] text-emerald-400/70">
            VISITED
          </span>
        )}
        {isReady && (
          <span className="shrink-0 rounded-full border border-yellow-900/40 bg-yellow-950/20 px-2.5 py-1 text-[10px] font-light tracking-[0.1em] text-yellow-400/70">
            REDEEM
          </span>
        )}
      </div>

      {/* Progress dots */}
      <div className="mt-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          {Array.from({ length: reward_goal }).map((_, i) => (
            <div
              key={i}
              className={`flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300 ${
                i < progress
                  ? isReady
                    ? "bg-yellow-400/90"
                    : "bg-[#ededed]"
                  : "border border-[#222] bg-transparent"
              }`}
            >
              {i < progress && (
                <Check className={`h-3.5 w-3.5 ${isReady ? "text-black" : "text-black"}`} />
              )}
            </div>
          ))}
        </div>
        <p className="mt-2.5 text-[11px] font-light text-[#444]">
          {isReady
            ? "Show at the register to redeem your reward"
            : `${reward_goal - progress} more visit${reward_goal - progress === 1 ? "" : "s"} to earn your reward`}
        </p>
      </div>
    </button>
  );
}

function EmptyState({ onExplore }: { onExplore: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#1a1a1a] bg-[#0a0a0a]">
        <Compass className="h-7 w-7 text-[#444]" />
      </div>
      <p className="mt-5 text-[16px] font-extralight text-[#ededed]">No loyalty cards yet</p>
      <p className="mt-2 text-[13px] font-light text-[#555]">
        Scan a QR code in-store or explore shops to get started
      </p>
      <button
        onClick={onExplore}
        className="mt-8 rounded-full border border-[#333] px-6 py-3 text-[12px] font-light tracking-[0.15em] text-[#ededed] transition-all duration-300 hover:border-[#666]"
      >
        EXPLORE STORES
      </button>
    </div>
  );
}

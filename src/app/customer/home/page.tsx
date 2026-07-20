"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Check, Compass, Trophy, WifiOff, ChevronRight, Stamp, Award, Medal } from "lucide-react";

type Passport = {
  period_label: string;
  goal: number;
  visited_new: number;
  total_new: number;
  unlocked: boolean;
  spots: { shop_slug: string; shop_name: string }[];
};

type Leader = {
  profile_id: string;
  display_name: string;
  avatar_url: string | null;
  places: number;
  checkins: number;
};

type BadgeInfo = { id: string; label: string; description: string; earned: boolean };

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

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-line">
      <div className="bg-surface px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="skeleton h-11 w-11 shrink-0 rounded-ctl" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3.5 w-28 rounded" />
            <div className="skeleton h-3 w-36 rounded" />
          </div>
        </div>
      </div>
      <div className="bg-bg px-5 pb-5 pt-4">
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
  const [passport, setPassport] = useState<Passport | null>(null);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [leaderPeriod, setLeaderPeriod] = useState("");
  const [badges, setBadges] = useState<BadgeInfo[]>([]);

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

      // Passport, badges, and leaderboard load quietly alongside the cards.
      fetch("/api/customer/passport")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d?.passport && setPassport(d.passport))
        .catch(() => {});
      fetch("/api/customer/creator-profile")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d?.badges && setBadges(d.badges))
        .catch(() => {});
      fetch("/api/customer/leaderboard")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.leaders) setLeaders(d.leaders);
          if (d?.period_label) setLeaderPeriod(d.period_label);
        })
        .catch(() => {});
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
          <div className="h-4 w-4 rounded-full border border-line border-t-ink"
            style={{ transform: `rotate(${pullProgress * 360}deg)` }} />
        </div>
      )}

      {/* Header */}
      <div className="px-5 pb-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 20px) + 16px)" }}>
        <p className="text-[13px] font-normal text-muted">
          {firstName ? `Welcome back, ${firstName}` : "Your loyalty cards"}
        </p>
        <h1 className="mt-0.5 font-display text-[28px] font-semibold tracking-[-0.02em] text-ink">Rewards</h1>
      </div>

      {/* Refresh indicator */}
      {refreshing && (
        <div className="flex justify-center pb-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-ink" />
        </div>
      )}

      {/* Offline banner */}
      {offline && (
        <div className="mx-5 mb-4 flex items-center gap-3 rounded-card border border-line bg-surface px-4 py-3">
          <WifiOff className="h-4 w-4 shrink-0 text-muted" />
          <p className="text-[13px] font-normal text-muted">No connection — showing cached cards</p>
        </div>
      )}

      {/* Ready rewards — prominent banner */}
      {!loading && readyMemberships.length > 0 && (
        <div className="mx-5 mb-5 space-y-2">
          {readyMemberships.map((m) => (
            <button
              key={m.shop_slug}
              onClick={() => router.push(`/customer/shop/${m.shop_slug}`)}
              className="w-full flex items-center gap-4 rounded-card border border-gold/40 bg-gold/10 px-4 py-4 text-left active:bg-gold/15 transition-colors"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold">
                <Trophy className="h-5 w-5 text-gold-ink" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-ink">Reward ready</p>
                <p className="text-[12px] font-normal text-muted truncate">{m.shop_name} · {m.deal_title}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
            </button>
          ))}
        </div>
      )}

      {/* Local Passport — visit new spots this month, unlock the stamp */}
      {!loading && passport && (
        <div className="mx-5 mb-5 rounded-card border border-line bg-surface px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Stamp className="h-3.5 w-3.5 text-muted" />
              <p className="text-[10px] font-semibold tracking-[0.12em] text-muted">
                LOCAL PASSPORT · {passport.period_label.toUpperCase()}
              </p>
            </div>
            {passport.unlocked && (
              <span className="rounded-full bg-gold/15 border border-gold/40 px-2.5 py-0.5 text-[10px] font-semibold text-gold">
                EXPLORER UNLOCKED
              </span>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2">
            {Array.from({ length: passport.goal }).map((_, i) => (
              <div
                key={i}
                className={`flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300 ${
                  i < passport.visited_new
                    ? "bg-gold"
                    : "border-2 border-dashed border-line"
                }`}
              >
                {i < passport.visited_new && <Check className="h-4 w-4 text-gold-ink" strokeWidth={2.5} />}
              </div>
            ))}
            <p className="ml-auto text-[13px] font-semibold text-muted">
              {passport.visited_new}<span className="text-line">/{passport.goal}</span>
            </p>
          </div>
          <p className="mt-3 text-[12px] font-normal text-muted">
            {passport.unlocked
              ? `You explored ${passport.total_new} new spot${passport.total_new === 1 ? "" : "s"} in ${passport.period_label} — Explorer stamp earned`
              : `Visit ${passport.goal - passport.visited_new} more new spot${passport.goal - passport.visited_new === 1 ? "" : "s"} in ${passport.period_label} to earn the Explorer stamp`}
          </p>
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
              className="w-full py-3 text-[11px] font-medium tracking-[0.15em] text-muted transition-colors active:text-muted"
            >
              REFRESH
            </button>
          </div>
        )}
      </div>

      {/* Badges — earned milestones */}
      {!loading && badges.some((b) => b.earned) && (
        <div className="px-5 pb-2">
          <div className="mb-3 flex items-center gap-2">
            <Award className="h-3.5 w-3.5 text-muted" />
            <p className="text-[11px] font-light tracking-[0.15em] text-muted">YOUR BADGES</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {badges.filter((b) => b.earned).map((b) => (
              <div key={b.id} className="rounded-full border border-line bg-surface px-3.5 py-1.5">
                <p className="text-[11px] font-medium text-ink">{b.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top explorers — opt-in, creators only */}
      {!loading && leaders.length > 0 && (
        <div className="px-5 pb-8 pt-4">
          <div className="mb-3 flex items-center gap-2">
            <Medal className="h-3.5 w-3.5 text-muted" />
            <p className="text-[11px] font-light tracking-[0.15em] text-muted">
              TOP EXPLORERS{leaderPeriod ? ` · ${leaderPeriod.toUpperCase()}` : ""}
            </p>
          </div>
          <div className="overflow-hidden rounded-card border border-line">
            {leaders.map((l, i) => (
              <button
                key={l.profile_id}
                onClick={() => router.push(`/customer/creator/${l.profile_id}`)}
                className={`flex w-full items-center gap-3.5 px-4 py-3 text-left active:bg-surface ${i > 0 ? "border-t border-line/60" : ""}`}
              >
                <span className="w-5 text-center text-[13px] font-semibold text-muted">{i + 1}</span>
                {l.avatar_url ? (
                  <img src={l.avatar_url} alt={l.display_name} className="h-9 w-9 shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface">
                    <span className="text-[13px] font-medium text-muted">{l.display_name.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-ink truncate">{l.display_name}</p>
                  <p className="text-[11px] font-normal text-muted">
                    {l.places} place{l.places === 1 ? "" : "s"} · {l.checkins} check-in{l.checkins === 1 ? "" : "s"}
                  </p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LoyaltyCard({ membership, checkedInToday, onClick }: {
  membership: Membership; checkedInToday: boolean; onClick: () => void;
}) {
  const { shop_name, deal_title, reward_goal, visits, logo_url } = membership;
  const isReady = visits >= reward_goal;
  const progress = Math.min(visits, reward_goal);
  const remaining = reward_goal - progress;

  return (
    <button
      onClick={onClick}
      className="w-full overflow-hidden rounded-card text-left transition-transform duration-150 active:scale-[0.99]"
      style={{
        border: isReady
          ? "1px solid rgba(255,181,46,0.4)"
          : "1px solid var(--line)",
      }}
    >
      {/* Card header — unique per shop */}
      <div
        className="flex items-center justify-between px-5 pt-5 pb-4"
        style={{
          background: isReady
            ? "linear-gradient(135deg, rgba(255,181,46,0.12), rgba(255,181,46,0.04))"
            : "var(--surface)",
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {logo_url ? (
            <img src={logo_url} alt={shop_name} className="h-11 w-11 shrink-0 rounded-ctl object-cover" />
          ) : (
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-ctl"
              style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
            >
              <span className="text-[18px] font-semibold" style={{ color: "var(--muted)" }}>
                {shop_name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-ink truncate">{shop_name}</p>
            {deal_title && (
              <p className="mt-0.5 text-[12px] font-normal text-muted truncate">{deal_title}</p>
            )}
          </div>
        </div>

        {/* Status badge */}
        {isReady ? (
          <span className="ml-3 shrink-0 rounded-full bg-gold px-3 py-1 text-[10px] font-bold tracking-wide text-gold-ink">
            REDEEM
          </span>
        ) : checkedInToday ? (
          <span
            className="ml-3 shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold"
            style={{ background: "var(--surface)", color: "var(--ink)" }}
          >
            ✓ TODAY
          </span>
        ) : null}
      </div>

      {/* Stamps section */}
      <div className="bg-bg px-5 pb-5 pt-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          {Array.from({ length: reward_goal }).map((_, i) => (
            <div
              key={i}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${
                i < progress
                  ? "bg-gold"
                  : "border-2 border-line bg-transparent"
              }`}
            >
              {i < progress && <Check className="h-4 w-4 text-gold-ink" strokeWidth={2.5} />}
            </div>
          ))}
          {/* Progress counter */}
          <span className="ml-auto text-[13px] font-semibold text-muted">
            {progress}<span className="text-line">/{reward_goal}</span>
          </span>
        </div>

        <p className="mt-3 text-[12px] font-normal text-muted">
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
      <div className="flex h-20 w-20 items-center justify-center rounded-sheet border border-line bg-surface">
        <Compass className="h-9 w-9 text-muted" />
      </div>
      <p className="mt-6 text-[20px] font-semibold text-ink">No loyalty cards yet</p>
      <p className="mt-2 text-[13px] font-normal leading-relaxed text-muted">
        Scan a QR code at any participating store<br />to start collecting stamps
      </p>
      <button
        onClick={onScan}
        className="mt-8 w-full rounded-card bg-ink py-4 text-[13px] font-semibold tracking-[0.08em] text-bg transition-all duration-200 active:opacity-80"
      >
        SCAN A QR CODE
      </button>
      <button
        onClick={onExplore}
        className="mt-3 w-full rounded-card border border-line py-4 text-[13px] font-medium tracking-[0.08em] text-muted transition-all duration-200 active:bg-surface"
      >
        BROWSE STORES
      </button>
    </div>
  );
}

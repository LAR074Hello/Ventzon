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
    <div className="overflow-hidden rounded-card border border-subtle">
      <div className="bg-surface-raised px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="skeleton h-11 w-11 shrink-0 rounded-ctl" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3.5 w-28 rounded" />
            <div className="skeleton h-3 w-36 rounded" />
          </div>
        </div>
      </div>
      <div className="bg-surface px-5 pb-5 pt-4">
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
      className="flex min-h-full flex-col bg-surface"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull indicator */}
      {pullProgress > 0 && (
        <div className="flex justify-center py-2" style={{ opacity: pullProgress }}>
          <div className="h-4 w-4 rounded-full border border-subtle border-t-ink"
            style={{ transform: `rotate(${pullProgress * 360}deg)` }} />
        </div>
      )}

      {/* Header */}
      <div className="px-5 pb-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 20px) + 16px)" }}>
        <p className="text-sm text-secondary font-normal">
          {firstName ? `Welcome back, ${firstName}` : "Your loyalty cards"}
        </p>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-primary mt-0.5">Rewards</h1>
      </div>

      {/* Refresh indicator */}
      {refreshing && (
        <div className="flex justify-center pb-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-subtle border-t-ink" />
        </div>
      )}

      {/* Offline banner */}
      {offline && (
        <div className="mx-5 mb-4 flex items-center gap-3 rounded-card border border-subtle bg-surface-raised px-4 py-3">
          <WifiOff className="h-4 w-4 shrink-0 text-muted" />
          <p className="text-sm text-secondary font-normal">No connection — showing cached cards</p>
        </div>
      )}

      {/* Ready rewards — prominent banner */}
      {!loading && readyMemberships.length > 0 && (
        <div className="mx-5 mb-5 space-y-2">
          {readyMemberships.map((m) => (
            <button
              key={m.shop_slug}
              onClick={() => router.push(`/customer/shop/${m.shop_slug}`)}
              className="elevation-1 flex w-full items-center gap-4 rounded-card px-4 py-4 text-left transition-colors active:bg-surface-sunken"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary">
                <Trophy className="h-5 w-5 text-inverse" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base text-primary font-semibold">Reward ready</p>
                <p className="text-xs text-muted font-normal truncate">{m.shop_name} · {m.deal_title}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
            </button>
          ))}
        </div>
      )}

      {/* Local Passport — visit new spots this month, unlock the stamp */}
      {!loading && passport && (
        <div className="mx-5 mb-5 rounded-card border border-subtle bg-surface-raised px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Stamp className="h-3.5 w-3.5 text-muted" />
              <p className="text-2xs font-semibold uppercase tracking-caps text-muted">
                LOCAL PASSPORT · {passport.period_label.toUpperCase()}
              </p>
            </div>
            {passport.unlocked && (
              <span className="rounded-full bg-surface-sunken px-2.5 py-0.5 text-xs font-semibold text-primary">
                Explorer unlocked
              </span>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2">
            {Array.from({ length: passport.goal }).map((_, i) => (
              <div
                key={i}
                className={`flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300 ${
                  i < passport.visited_new
                    ? "bg-primary"
                    : "border-2 border-dashed border-subtle"
                }`}
              >
                {i < passport.visited_new && <Check className="h-4 w-4 text-inverse" strokeWidth={2.5} />}
              </div>
            ))}
            <p className="text-sm text-secondary ml-auto font-semibold">
              {passport.visited_new}<span className="text-subtle">/{passport.goal}</span>
            </p>
          </div>
          <p className="text-xs text-muted mt-3 font-normal">
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
              className="text-xs font-semibold uppercase tracking-caps text-muted w-full py-3 transition-colors active:"
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
            <p className="text-xs font-semibold uppercase tracking-caps text-muted">YOUR BADGES</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {badges.filter((b) => b.earned).map((b) => (
              <div key={b.id} className="rounded-full border border-subtle bg-surface-raised px-3.5 py-1.5">
                <p className="text-xs text-primary font-medium">{b.label}</p>
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
            <p className="text-xs font-semibold uppercase tracking-caps text-muted">
              TOP EXPLORERS{leaderPeriod ? ` · ${leaderPeriod.toUpperCase()}` : ""}
            </p>
          </div>
          <div className="overflow-hidden rounded-card border border-subtle">
            {leaders.map((l, i) => (
              <button
                key={l.profile_id}
                onClick={() => router.push(`/customer/creator/${l.profile_id}`)}
                className={`flex w-full items-center gap-3.5 px-4 py-3 text-left active:bg-surface-raised ${i > 0 ? "border-t border-subtle/60" : ""}`}
              >
                <span className="text-sm text-secondary w-5 text-center font-semibold">{i + 1}</span>
                {l.avatar_url ? (
                  <img src={l.avatar_url} alt={l.display_name} className="h-9 w-9 shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-raised">
                    <span className="text-sm text-secondary font-medium">{l.display_name.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-base text-primary font-medium truncate">{l.display_name}</p>
                  <p className="text-xs text-muted font-normal">
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
          : "1px solid var(--border-subtle)",
      }}
    >
      {/* Card header — unique per shop */}
      <div
        className="flex items-center justify-between px-5 pt-5 pb-4"
        style={{
          background: isReady
            ? "linear-gradient(135deg, rgba(255,181,46,0.12), rgba(255,181,46,0.04))"
            : "var(--surface-raised)",
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {logo_url ? (
            <img src={logo_url} alt={shop_name} className="h-11 w-11 shrink-0 rounded-ctl object-cover" />
          ) : (
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-ctl"
              style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}
            >
              <span className="font-display text-lg font-semibold tracking-tight" style={{ color: "var(--text-muted)" }}>
                {shop_name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold tracking-tight text-primary truncate">{shop_name}</p>
            {deal_title && (
              <p className="text-xs text-muted mt-0.5 font-normal truncate">{deal_title}</p>
            )}
          </div>
        </div>

        {/* Status badge */}
        {isReady ? (
          <span className="ml-3 shrink-0 rounded-full bg-primary px-3 py-1 text-2xs font-semibold uppercase tracking-caps text-inverse">
            REDEEM
          </span>
        ) : checkedInToday ? (
          <span
            className="text-xs ml-3 shrink-0 rounded-full px-2.5 py-1 font-semibold"
            style={{ background: "var(--surface-raised)", color: "var(--text-primary)" }}
          >
            <Check className="mr-1 inline h-3 w-3" />
            TODAY
          </span>
        ) : null}
      </div>

      {/* Stamps section */}
      <div className="bg-surface px-5 pb-5 pt-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          {Array.from({ length: reward_goal }).map((_, i) => (
            <div
              key={i}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${
                i < progress
                  ? "bg-primary"
                  : "border-2 border-subtle bg-transparent"
              }`}
            >
              {i < progress && <Check className="h-4 w-4 text-inverse" strokeWidth={2.5} />}
            </div>
          ))}
          {/* Progress counter */}
          <span className="text-sm text-secondary ml-auto font-semibold">
            {progress}<span className="text-subtle">/{reward_goal}</span>
          </span>
        </div>

        <p className="text-xs text-muted mt-3 font-normal">
          {isReady
            ? "Show this screen at the register to redeem"
            : `${remaining} more visit${remaining === 1 ? "" : "s"} to earn your reward`}
        </p>
      </div>
    </button>
  );
}

function EmptyState({ onExplore }: { onExplore: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-sheet border border-subtle bg-surface-raised">
        <Compass className="h-9 w-9 text-muted" />
      </div>
      <p className="font-display text-xl font-semibold tracking-tight text-primary mt-6">No loyalty cards yet</p>
      <p className="text-sm text-secondary mt-2 font-normal leading-relaxed">
        Rewards appear here when a shop you visit runs one.<br />Browse places near you and be the first to check in.
      </p>
      <button
        onClick={onExplore}
        className="text-sm font-medium text-inverse mt-8 w-full rounded-card bg-primary py-4 transition-all duration-200 active:opacity-80"
      >
        BROWSE PLACES
      </button>
    </div>
  );
}

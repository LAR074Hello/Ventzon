"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Check, ArrowLeft, Share2, Trophy, X, Clock, Bell, BellRing, Grid3x3 } from "lucide-react";
import PostGrid, { type GridPost } from "../../components/PostGrid";
import PostComposer from "../../components/PostComposer";

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
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-surface">
      <div
        className="flex flex-col items-center transition-all duration-500"
        style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)" }}
      >
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-surface-sunken">
          <Check className="h-10 w-10 text-primary" strokeWidth={1.5} />
        </div>
        <h2 className="font-display text-xl font-semibold tracking-tight text-primary mt-6">Checked in</h2>
        <p className="text-base text-secondary mt-2 font-normal">
          {visits} of {goal} visit{goal !== 1 ? "s" : ""} collected
        </p>
        <div className="mt-6 flex gap-2">
          {Array.from({ length: Math.min(goal, 10) }).map((_, i) => (
            <div key={i} className="h-2 w-2 rounded-full transition-colors" style={{ backgroundColor: i < visits ? "var(--text-primary)" : "var(--border-subtle)" }} />
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
    <div className="fixed inset-0 z-[150] flex flex-col bg-surface" style={{ paddingTop: "env(safe-area-inset-top,0px)", paddingBottom: "env(safe-area-inset-bottom,0px)" }}>
      <div className="flex justify-end px-5 pt-4">
        <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full border border-subtle bg-surface-raised">
          <X className="h-4 w-4 text-muted" />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="flex h-28 w-28 items-center justify-center rounded-sheet bg-surface-sunken">
          <Trophy className="h-12 w-12 text-primary" strokeWidth={1} />
        </div>
        <h2 className="font-display text-2xl font-semibold tracking-tight text-primary mt-8">Reward earned</h2>
        <p className="font-display text-lg font-semibold tracking-tight text-muted mt-3">{shop.deal_title}</p>
        {shop.deal_details && <p className="text-sm text-secondary mt-1 font-normal opacity-80">{shop.deal_details}</p>}
        <div className="elevation-1 mt-10 w-full rounded-card px-6 py-5">
          <p className="text-2xs font-semibold uppercase tracking-caps text-muted">Show this to the cashier</p>
          <p className="text-base text-primary mt-2 font-normal">{shop.shop_name}</p>
        </div>
      </div>

      <div className="px-5 pb-8 space-y-3">
        <button
          onClick={markRedeemed}
          className="text-sm font-medium text-inverse w-full rounded-ctl bg-primary py-4 transition-all active:opacity-80"
        >
          MARK AS REDEEMED
        </button>
        <button
          onClick={share}
          className="text-xs font-semibold uppercase tracking-caps text-muted flex w-full items-center justify-center gap-2 rounded-ctl border border-subtle bg-surface-raised py-4"
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
  const [showShareVisit, setShowShareVisit] = useState(false);
  const [showRewardScreen, setShowRewardScreen] = useState(false);
  const [newStampIndex, setNewStampIndex] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [shopPosts, setShopPosts] = useState<GridPost[]>([]);
  const [followerCount, setFollowerCount] = useState<number | null>(null);

  // Capture a referral code from shared links (?ref=<profile id>).
  useEffect(() => {
    try {
      const ref = new URLSearchParams(window.location.search).get("ref");
      if (ref) localStorage.setItem("ventzon_ref", ref);
    } catch {}
  }, []);

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

      // Posts featuring this business — same grid as creator profiles.
      fetch(`/api/customer/feed?shop_slug=${shopSlug}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d?.posts && setShopPosts(d.posts))
        .catch(() => {});

      fetch(`/api/customer/follow-list?shop_slug=${shopSlug}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => typeof d?.total === "number" && setFollowerCount(d.total))
        .catch(() => {});

      if (session?.user?.email) {
        const memberRes = await fetch("/api/customer/memberships");
        const memberData = await memberRes.json();
        const match = (memberData.memberships ?? []).find((m: any) => m.shop_slug === shopSlug);
        if (match) setStatus({ visits: match.visits, last_checkin_date: match.last_checkin_date });
        await loadHistory();

        try {
          const followRes = await fetch("/api/customer/follows");
          if (followRes.ok) {
            const followData = await followRes.json();
            setFollowing(
              (followData.follows ?? []).some((f: any) => f.shop_slug === shopSlug)
            );
          }
        } catch {}

        try {
          const profRes = await fetch("/api/customer/creator-profile");
          if (profRes.ok) {
            const profData = await profRes.json();
            if (profData.profile?.id) setMyProfileId(profData.profile.id);
          }
        } catch {}
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
      let referredBy: string | null = null;
      try { referredBy = localStorage.getItem("ventzon_ref"); } catch {}
      const res = await fetch("/api/join/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop_slug: shopSlug,
          email: user.email,
          ...(referredBy ? { referred_by: referredBy } : {}),
        }),
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

  async function toggleFollow() {
    if (!user?.email) {
      router.push(`/customer/auth?redirect=/customer/shop/${shopSlug}`);
      return;
    }
    if (followBusy) return;
    const next = !following;
    setFollowBusy(true);
    setFollowing(next); // optimistic
    await haptic("light");
    try {
      const res = await fetch("/api/customer/follows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop_slug: shopSlug, follow: next }),
      });
      if (!res.ok) setFollowing(!next);
    } catch {
      setFollowing(!next);
    } finally {
      setFollowBusy(false);
    }
  }

  async function handleShare() {
    await haptic("light");
    const ref = myProfileId ? `?ref=${myProfileId}` : "";
    const joinUrl = `${window.location.origin}/customer/shop/${shopSlug}${ref}`;
    try {
      await navigator.share({ title: settings?.shop_name ?? "Check this out", text: `Earn rewards at ${settings?.shop_name ?? "this store"} on Ventzon!`, url: joinUrl });
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-subtle border-t-ink" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-8 text-center">
        <p className="text-2xs font-semibold uppercase tracking-caps text-muted">NOT FOUND</p>
        <h1 className="mt-4 font-display text-2xl font-semibold text-primary">Shop not found</h1>
        <p className="text-base text-secondary mt-3 font-normal">
          This shop doesn&rsquo;t exist or may have been removed.
        </p>
        <button
          onClick={() => router.push("/customer/explore")}
          className="text-xs font-semibold uppercase tracking-caps text-primary mt-8 rounded-full border border-subtle px-6 py-3 transition-all duration-300 hover:border-muted"
        >
          Explore shops
        </button>
      </div>
    );
  }

  const shopName = settings?.shop_name ?? shopSlug;

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {showCheckinOverlay && (
        <CheckinOverlay
          visits={visits}
          goal={goal}
          onDismiss={() => {
            setShowCheckinOverlay(false);
            // The check-in is the one un-fakeable moment in the app —
            // offer to turn it into a post while the user is still here.
            setShowShareVisit(true);
          }}
        />
      )}
      {showRewardScreen && settings && (
        <RewardScreen shop={settings} onClose={() => setShowRewardScreen(false)} onRedeemed={handleRedeemed} />
      )}

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="fixed left-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-subtle bg-surface/80 backdrop-blur-sm"
        style={{ top: "calc(env(safe-area-inset-top, 20px) + 8px)" }}
      >
        <ArrowLeft className="h-4 w-4 text-primary" />
      </button>

      {/* Share */}
      <button
        onClick={handleShare}
        className="fixed right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-subtle bg-surface/80 backdrop-blur-sm"
        style={{ top: "calc(env(safe-area-inset-top, 20px) + 8px)" }}
      >
        <Share2 className="h-4 w-4 text-muted" />
      </button>

      {/* Hero */}
      <div className="flex flex-col items-center px-6 pb-8" style={{ paddingTop: "calc(env(safe-area-inset-top, 20px) + 64px)" }}>
        {settings?.logo_url ? (
          <img src={settings.logo_url} alt={shopName} className="h-24 w-24 rounded-card border border-subtle object-cover" />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-card border border-subtle bg-surface-raised">
            <span className="text-3xl font-light text-muted">{shopName.charAt(0).toUpperCase()}</span>
          </div>
        )}
        <h1 className="font-display text-xl font-semibold tracking-tight text-primary mt-5">{shopName}</h1>
        {settings?.deal_title && (
          <div className="mt-3 rounded-ctl border border-subtle bg-surface-raised px-5 py-3 text-center">
            <p className="text-base text-primary font-medium">{settings.deal_title}</p>
            {settings.deal_details && <p className="text-xs text-muted mt-1 font-normal">{settings.deal_details}</p>}
          </div>
        )}
        <button
          onClick={toggleFollow}
          disabled={followBusy}
          className={`mt-4 flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
            following
              ? "border border-subtle bg-surface-raised text-primary"
              : "bg-primary text-inverse active:opacity-80"
          }`}
        >
          {following ? <BellRing className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
          {following ? "Following" : "Follow"}
        </button>
        <p className="text-xs text-muted mt-2 font-normal">
          {following ? "You'll hear about new drops from this store" : "Get notified when they post something new"}
        </p>
        {followerCount !== null && followerCount > 0 && (
          <button
            onClick={() =>
              router.push(
                `/customer/follows?shop_slug=${shopSlug}&title=${encodeURIComponent(`${shopName} followers`)}`
              )
            }
            className="text-xs text-muted mt-1.5 font-medium underline-offset-2 active:"
          >
            {followerCount} follower{followerCount === 1 ? "" : "s"}
          </button>
        )}
      </div>

      {/* Share your visit — offered right after a check-in */}
      {showShareVisit && user && (
        <div className="elevation-1 mx-5 mb-4 rounded-card p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-lg font-semibold tracking-tight text-primary">
                Share this visit?
              </p>
              <p className="text-xs text-muted mt-1 font-normal leading-relaxed">
                Posts from a real check-in show a verified-visit mark.
              </p>
            </div>
            <button
              onClick={() => setShowShareVisit(false)}
              className="shrink-0 p-1 text-muted active:text-primary"
              aria-label="Not now"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <PostComposer
            defaultShopSlug={shopSlug}
            lockShop
            placeholder={`What was ${shopName} like today?`}
            onPosted={async () => {
              setShowShareVisit(false);
              const res = await fetch(`/api/customer/feed?shop_slug=${shopSlug}`);
              if (res.ok) {
                const d = await res.json();
                setShopPosts(d.posts ?? []);
              }
            }}
          />
        </div>
      )}

      {/* Loyalty card */}
      <div className="mx-5 rounded-card border border-subtle bg-surface-raised p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-2xs font-semibold uppercase tracking-caps text-muted">YOUR PROGRESS</p>
          <p className="text-sm text-primary font-semibold">{visits}<span className="text-muted">/{goal}</span></p>
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: goal }).map((_, i) => {
            const filled = i < visits;
            const isNew = i === newStampIndex;
            return (
              <div
                key={i}
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${
                  filled
                    ? "bg-primary"
                    : "border-2 border-subtle bg-transparent"
                } ${isNew ? "animate-stamp-pop" : ""}`}
              >
                {filled && <Check className="h-4 w-4 text-inverse" />}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted mt-4 font-normal">
          {isReady
            ? "Tap below to view your reward"
            : checkedInToday
            ? "You've already checked in today — see you tomorrow!"
            : "Scan the QR code in-store to check in"}
        </p>
      </div>

      {err && (
        <div className="mx-5 mt-4 rounded-ctl border border-danger/30 bg-danger/10 px-4 py-3 text-center">
          <p className="text-sm text-danger font-normal">{err}</p>
        </div>
      )}

      {/* Posts featuring this business */}
      {shopPosts.length > 0 && (
        <div className="mx-5 mt-5">
          <div className="flex items-center gap-2 mb-3">
            <Grid3x3 className="h-3.5 w-3.5 text-muted" />
            <p className="text-2xs font-semibold uppercase tracking-caps text-muted">POSTS</p>
          </div>
          <PostGrid posts={shopPosts} />
        </div>
      )}

      {/* Visit history */}
      {history.length > 0 && (
        <div className="mx-5 mt-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-3.5 w-3.5 text-muted" />
            <p className="text-2xs font-semibold uppercase tracking-caps text-muted">VISIT HISTORY</p>
          </div>
          <div className="rounded-card border border-subtle overflow-hidden">
            {history.slice(0, 8).map((entry, i) => (
              <div
                key={entry.checkin_date}
                className={`flex items-center justify-between px-4 py-3 ${i > 0 ? "border-t border-subtle/60" : ""}`}
              >
                <p className="text-sm text-secondary font-normal">{formatDate(entry.checkin_date)}</p>
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-sunken">
                  <Check className="h-3 w-3 text-primary" />
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
            className="w-full rounded-ctl bg-accent py-4 text-base font-medium text-on-accent transition-all active:bg-accent-hover"
          >
            View my reward
          </button>
        )}
        {!user && (
          <button
            onClick={() => router.push(`/customer/auth?redirect=/customer/shop/${shopSlug}`)}
            className="text-sm font-medium text-inverse w-full rounded-ctl bg-primary py-4 transition-all active:opacity-80"
          >
            SIGN IN TO TRACK PROGRESS
          </button>
        )}
        {user && !checkedInToday && !isReady && (
          <button
            onClick={handleCheckin}
            disabled={checkinLoading}
            className="text-sm font-medium text-inverse w-full rounded-ctl bg-primary py-4 transition-all active:opacity-80 disabled:opacity-40"
          >
            {checkinLoading ? "CHECKING IN…" : "CHECK IN HERE"}
          </button>
        )}
        {user && checkedInToday && !isReady && (
          <div className="w-full rounded-ctl border border-subtle py-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-caps text-muted">CHECKED IN TODAY</p>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Check, ArrowLeft, Share2, Trophy, X, Clock, Bell, BellRing, Grid3x3 } from "lucide-react";
import PostGrid, { type GridPost } from "../../components/PostGrid";

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
        <div className="flex h-24 w-24 items-center justify-center rounded-full border border-gold/30 bg-gold/10">
          <Check className="h-10 w-10 text-gold" strokeWidth={1.5} />
        </div>
        <h2 className="mt-6 font-display text-[24px] font-semibold tracking-[-0.01em] text-ink">Checked in</h2>
        <p className="mt-2 text-[14px] font-normal text-muted">
          {visits} of {goal} visit{goal !== 1 ? "s" : ""} collected
        </p>
        <div className="mt-6 flex gap-2">
          {Array.from({ length: Math.min(goal, 10) }).map((_, i) => (
            <div key={i} className="h-2 w-2 rounded-full transition-colors" style={{ backgroundColor: i < visits ? "var(--gold)" : "var(--line)" }} />
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
        <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface">
          <X className="h-4 w-4 text-muted" />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="flex h-28 w-28 items-center justify-center rounded-sheet border border-gold/40 bg-gold/10">
          <Trophy className="h-12 w-12 text-gold" strokeWidth={1} />
        </div>
        <h2 className="mt-8 font-display text-[28px] font-semibold tracking-[-0.02em] text-ink">Reward earned</h2>
        <p className="mt-3 text-[15px] font-normal text-muted">{shop.deal_title}</p>
        {shop.deal_details && <p className="mt-1 text-[13px] font-normal text-muted opacity-80">{shop.deal_details}</p>}
        <div className="mt-10 w-full rounded-card border border-gold/30 bg-gold/10 px-6 py-5">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-gold">SHOW THIS TO THE CASHIER</p>
          <p className="mt-2 text-[13px] font-normal text-ink">{shop.shop_name}</p>
        </div>
      </div>

      <div className="px-5 pb-8 space-y-3">
        <button
          onClick={markRedeemed}
          className="w-full rounded-ctl bg-ink py-4 text-[12px] font-semibold tracking-[0.14em] text-bg transition-all active:opacity-80"
        >
          MARK AS REDEEMED
        </button>
        <button
          onClick={share}
          className="flex w-full items-center justify-center gap-2 rounded-ctl border border-line bg-surface py-4 text-[12px] font-medium tracking-[0.12em] text-muted"
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
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-ink" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black px-8 text-center">
        <p className="text-[10px] font-semibold tracking-[0.14em] text-muted">NOT FOUND</p>
        <h1 className="mt-4 font-display text-2xl font-semibold text-ink">Shop not found</h1>
        <p className="mt-3 text-[14px] font-normal text-muted">
          This shop doesn&rsquo;t exist or may have been removed.
        </p>
        <button
          onClick={() => router.push("/customer/explore")}
          className="mt-8 rounded-full border border-line px-6 py-3 text-[12px] font-medium tracking-[0.14em] text-ink transition-all duration-300 hover:border-muted"
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
        className="fixed left-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-line bg-bg/80 backdrop-blur-sm"
        style={{ top: "calc(env(safe-area-inset-top, 20px) + 8px)" }}
      >
        <ArrowLeft className="h-4 w-4 text-ink" />
      </button>

      {/* Share */}
      <button
        onClick={handleShare}
        className="fixed right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-line bg-bg/80 backdrop-blur-sm"
        style={{ top: "calc(env(safe-area-inset-top, 20px) + 8px)" }}
      >
        <Share2 className="h-4 w-4 text-muted" />
      </button>

      {/* Hero */}
      <div className="flex flex-col items-center px-6 pb-8" style={{ paddingTop: "calc(env(safe-area-inset-top, 20px) + 64px)" }}>
        {settings?.logo_url ? (
          <img src={settings.logo_url} alt={shopName} className="h-24 w-24 rounded-card border border-line object-cover" />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-card border border-line bg-surface">
            <span className="text-3xl font-light text-muted">{shopName.charAt(0).toUpperCase()}</span>
          </div>
        )}
        <h1 className="mt-5 font-display text-[24px] font-semibold tracking-[-0.01em] text-ink">{shopName}</h1>
        {settings?.deal_title && (
          <div className="mt-3 rounded-ctl border border-line bg-surface px-5 py-3 text-center">
            <p className="text-[13px] font-medium text-ink">{settings.deal_title}</p>
            {settings.deal_details && <p className="mt-1 text-[12px] font-normal text-muted">{settings.deal_details}</p>}
          </div>
        )}
        <button
          onClick={toggleFollow}
          disabled={followBusy}
          className={`mt-4 flex items-center gap-2 rounded-full px-5 py-2.5 text-[12px] font-medium tracking-[0.08em] transition-all duration-200 ${
            following
              ? "border border-line bg-surface text-ink"
              : "bg-ink text-bg active:opacity-80"
          }`}
        >
          {following ? <BellRing className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
          {following ? "FOLLOWING" : "FOLLOW"}
        </button>
        <p className="mt-2 text-[11px] font-normal text-muted">
          {following ? "You'll hear about new drops from this store" : "Get notified when they post something new"}
        </p>
        {followerCount !== null && followerCount > 0 && (
          <button
            onClick={() =>
              router.push(
                `/customer/follows?shop_slug=${shopSlug}&title=${encodeURIComponent(`${shopName} followers`)}`
              )
            }
            className="mt-1.5 text-[11px] font-medium text-muted underline-offset-2 active:text-ink"
          >
            {followerCount} follower{followerCount === 1 ? "" : "s"}
          </button>
        )}
      </div>

      {/* Loyalty card */}
      <div className="mx-5 rounded-card border border-line bg-surface p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-semibold tracking-[0.12em] text-muted">YOUR PROGRESS</p>
          <p className="text-[12px] font-semibold text-ink">{visits}<span className="text-muted">/{goal}</span></p>
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
                    ? "bg-gold"
                    : "border-2 border-line bg-transparent"
                } ${isNew ? "animate-stamp-pop" : ""}`}
              >
                {filled && <Check className="h-4 w-4 text-gold-ink" />}
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-[12px] font-normal text-muted">
          {isReady
            ? "Tap below to view your reward"
            : checkedInToday
            ? "You've already checked in today — see you tomorrow!"
            : "Scan the QR code in-store to check in"}
        </p>
      </div>

      {err && (
        <div className="mx-5 mt-4 rounded-2xl border border-red-900/30 bg-red-950/20 px-4 py-3 text-center">
          <p className="text-[13px] font-normal text-red-300/80">{err}</p>
        </div>
      )}

      {/* Posts featuring this business */}
      {shopPosts.length > 0 && (
        <div className="mx-5 mt-5">
          <div className="flex items-center gap-2 mb-3">
            <Grid3x3 className="h-3.5 w-3.5 text-muted" />
            <p className="text-[10px] font-semibold tracking-[0.12em] text-muted">POSTS</p>
          </div>
          <PostGrid posts={shopPosts} />
        </div>
      )}

      {/* Visit history */}
      {history.length > 0 && (
        <div className="mx-5 mt-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-3.5 w-3.5 text-muted" />
            <p className="text-[10px] font-semibold tracking-[0.12em] text-muted">VISIT HISTORY</p>
          </div>
          <div className="rounded-card border border-line overflow-hidden">
            {history.slice(0, 8).map((entry, i) => (
              <div
                key={entry.checkin_date}
                className={`flex items-center justify-between px-4 py-3 ${i > 0 ? "border-t border-line/60" : ""}`}
              >
                <p className="text-[13px] font-normal text-muted">{formatDate(entry.checkin_date)}</p>
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gold/15">
                  <Check className="h-3 w-3 text-gold" />
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
            className="w-full rounded-ctl border border-gold/40 bg-gold/10 py-4 text-[12px] font-semibold tracking-[0.14em] text-gold transition-all active:bg-gold/20"
          >
            VIEW MY REWARD
          </button>
        )}
        {!user && (
          <button
            onClick={() => router.push(`/customer/auth?redirect=/customer/shop/${shopSlug}`)}
            className="w-full rounded-ctl bg-ink py-4 text-[12px] font-semibold tracking-[0.14em] text-bg transition-all active:opacity-80"
          >
            SIGN IN TO TRACK PROGRESS
          </button>
        )}
        {user && !checkedInToday && !isReady && (
          <button
            onClick={handleCheckin}
            disabled={checkinLoading}
            className="w-full rounded-ctl bg-ink py-4 text-[12px] font-semibold tracking-[0.14em] text-bg transition-all active:opacity-80 disabled:opacity-40"
          >
            {checkinLoading ? "CHECKING IN…" : "CHECK IN HERE"}
          </button>
        )}
        {user && checkedInToday && !isReady && (
          <div className="w-full rounded-ctl border border-line py-4 text-center">
            <p className="text-[11px] font-semibold tracking-[0.12em] text-muted">CHECKED IN TODAY</p>
          </div>
        )}
      </div>
    </div>
  );
}

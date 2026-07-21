"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Compass, Sparkles } from "lucide-react";
import FollowButton from "./FollowButton";

type FeedPost = {
  id: string;
  body: string;
  media_url: string | null;
  media_type: "image" | "video" | null;
  created_at: string;
  author: { profile_id: string; display_name: string; avatar_url: string | null; followed: boolean };
  shop: { slug: string; name: string; logo_url: string | null; deal_title: string | null; reward_goal: number };
  counts: { likes: number; comments: number };
  viewer: { liked: boolean; progress: { visits: number; goal: number } | null };
};

type Suggestion = {
  kind: "creator" | "shop";
  profile_id?: string;
  shop_slug?: string;
  display_name: string;
  avatar_url: string | null;
  sub: string;
  distance_mi?: number | null;
};

/** Inline shop-follow button for suggestion cards (customer_follows). */
function ShopFollowButton({ shopSlug }: { shopSlug: string }) {
  const router = useRouter();
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (busy) return;
    const next = !following;
    setBusy(true);
    setFollowing(next);
    try {
      const res = await fetch("/api/customer/follows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop_slug: shopSlug, follow: next }),
      });
      if (res.status === 401) {
        router.push("/customer/auth?redirect=/customer/explore");
        return;
      }
      if (!res.ok) setFollowing(!next);
    } catch {
      setFollowing(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`rounded-full px-3.5 py-1.5 text-[10px] font-medium tracking-[0.08em] transition-all ${
        following
          ? "border border-line bg-surface text-ink"
          : "bg-ink text-bg active:opacity-80"
      }`}
    >
      {following ? "FOLLOWING" : "FOLLOW"}
    </button>
  );
}

/** "Suggested for you" — shown when the feed is empty or sparse. */
function SuggestionRow({ userLoc }: { userLoc: { lat: number; lng: number } | null }) {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    const params = userLoc ? `?lat=${userLoc.lat}&lng=${userLoc.lng}` : "";
    fetch(`/api/customer/suggestions${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.suggestions && setSuggestions(d.suggestions))
      .catch(() => {});
  }, [userLoc]);

  if (suggestions.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center gap-2 px-5">
        <Sparkles className="h-3.5 w-3.5 text-muted" />
        <p className="text-[10px] font-semibold tracking-[0.12em] text-muted">SUGGESTED FOR YOU</p>
      </div>
      <div className="flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-none">
        {suggestions.map((s) => (
          <div
            key={`${s.kind}-${s.profile_id ?? s.shop_slug}`}
            className="flex w-40 shrink-0 flex-col items-center rounded-card border border-line bg-surface px-3 py-4"
          >
            <button
              onClick={() =>
                s.kind === "creator"
                  ? router.push(`/customer/creator/${s.profile_id}`)
                  : router.push(`/customer/shop/${s.shop_slug}`)
              }
              className="flex flex-col items-center"
            >
              {s.avatar_url ? (
                <img
                  src={s.avatar_url}
                  alt=""
                  className={`h-14 w-14 object-cover ${s.kind === "creator" ? "rounded-full" : "rounded-ctl"}`}
                />
              ) : (
                <div
                  className={`flex h-14 w-14 items-center justify-center bg-bg border border-line ${
                    s.kind === "creator" ? "rounded-full" : "rounded-ctl"
                  }`}
                >
                  <span className="text-[18px] font-medium text-muted">
                    {s.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <p className="mt-2.5 w-full truncate text-center text-[13px] font-semibold text-ink">
                {s.display_name}
              </p>
              <p className="mt-0.5 w-full truncate text-center text-[11px] font-normal text-muted">
                {s.kind === "shop" && s.distance_mi != null
                  ? `${s.distance_mi < 10 ? s.distance_mi.toFixed(1) : Math.round(s.distance_mi)} mi · ${s.sub}`
                  : s.sub}
              </p>
            </button>
            <div className="mt-3">
              {s.kind === "creator" && s.profile_id ? (
                <FollowButton profileId={s.profile_id} following={false} compact />
              ) : s.shop_slug ? (
                <ShopFollowButton shopSlug={s.shop_slug} />
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * The Explore tab's social feed. Every post is tied to a real business
 * (enforced server-side in /api/customer/feed) so browsing always has a
 * one-tap path to a real visit via the Visit & Earn chip.
 */
export default function SocialFeed({ userLoc }: { userLoc: { lat: number; lng: number } | null }) {
  const router = useRouter();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const offsetRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchPage = useCallback(
    async (offset: number, replace: boolean) => {
      const qs = new URLSearchParams();
      if (userLoc) {
        qs.set("lat", String(userLoc.lat));
        qs.set("lng", String(userLoc.lng));
      }
      qs.set("offset", String(offset));
      const res = await fetch(`/api/customer/feed?${qs.toString()}`);
      if (!res.ok) return;
      const d = await res.json();
      setPosts((prev) => (replace ? d.posts ?? [] : [...prev, ...(d.posts ?? [])]));
      setHasMore(Boolean(d.has_more));
      offsetRef.current = d.next_offset ?? offset;
    },
    [userLoc]
  );

  useEffect(() => {
    setLoading(true);
    offsetRef.current = 0;
    fetchPage(0, true).finally(() => setLoading(false));
  }, [fetchPage]);

  // Infinite scroll: load the next page as the sentinel nears the viewport.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loading) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loadingMore) {
          setLoadingMore(true);
          fetchPage(offsetRef.current, false).finally(() => setLoadingMore(false));
        }
      },
      { rootMargin: "600px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loading, loadingMore, fetchPage]);

  async function toggleLike(post: FeedPost) {
    const next = !post.viewer.liked;
    setPosts((ps) =>
      ps.map((p) =>
        p.id === post.id
          ? {
              ...p,
              viewer: { ...p.viewer, liked: next },
              counts: { ...p.counts, likes: p.counts.likes + (next ? 1 : -1) },
            }
          : p
      )
    );
    const res = await fetch(`/api/customer/posts/${post.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: next ? "like" : "unlike" }),
    });
    if (res.status === 401) router.push("/customer/auth?redirect=/customer/explore");
  }

  if (loading) {
    return (
      <div className="space-y-5 px-5">
        {[0, 1].map((i) => (
          <div key={i} className="overflow-hidden rounded-card border border-line">
            <div className="flex items-center gap-3 p-4">
              <div className="skeleton h-9 w-9 rounded-full" />
              <div className="space-y-2">
                <div className="skeleton h-3 w-28 rounded" />
                <div className="skeleton h-2.5 w-16 rounded" />
              </div>
            </div>
            <div className="skeleton aspect-square w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div>
        <SuggestionRow userLoc={userLoc} />
        <div className="flex flex-col items-center px-8 py-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-sheet border border-line bg-surface">
            <Compass className="h-7 w-7 text-muted" />
          </div>
          <p className="mt-5 font-display text-[18px] font-semibold text-ink">Nothing here yet</p>
          <p className="mt-2 text-[13px] font-normal leading-relaxed text-muted">
            Posts from creators at local businesses will show up here.<br />
            Follow creators you like to shape your feed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 px-5 pb-4">
      {/* A sparse feed gets suggestions to follow — the new-user fix. */}
      {posts.length < 3 && (
        <div className="-mx-5">
          <SuggestionRow userLoc={userLoc} />
        </div>
      )}
      {posts.map((p) => {
        const remaining = p.viewer.progress
          ? Math.max(p.viewer.progress.goal - p.viewer.progress.visits, 0)
          : null;
        const goal = p.viewer.progress?.goal ?? p.shop.reward_goal;
        const visits = p.viewer.progress?.visits ?? 0;
        return (
          <div key={p.id}>
            {/* Byline */}
            <button
              onClick={() => router.push(`/customer/creator/${p.author.profile_id}`)}
              className="mb-2.5 flex w-full items-center gap-2.5 text-left"
            >
              {p.author.avatar_url ? (
                <img src={p.author.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface border border-line">
                  <span className="text-[12px] font-medium text-muted">
                    {p.author.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-ink truncate leading-tight">
                  {p.author.display_name}
                </p>
                <p className="text-[12px] font-normal text-muted truncate">
                  at <span className="text-ink">{p.shop.name}</span> · {timeAgo(p.created_at)}
                </p>
              </div>
            </button>

            {/* One envelope: media + Visit & Earn footer share the card */}
            <div className="overflow-hidden rounded-card bg-surface border border-line">
              {p.media_url && (
                <button onClick={() => router.push(`/customer/post/${p.id}`)} className="block w-full">
                  {p.media_type === "video" ? (
                    <video src={p.media_url} muted playsInline preload="metadata" className="aspect-[4/5] w-full object-cover" />
                  ) : (
                    <img src={p.media_url} alt="" loading="lazy" className="aspect-[4/5] w-full object-cover" />
                  )}
                </button>
              )}
              <button
                onClick={() => router.push(`/customer/shop/${p.shop.slug}`)}
                className="flex w-full items-center gap-3 px-3.5 py-3 text-left active:bg-black/20"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-bold text-ink truncate">{p.shop.name}</p>
                  <div className="mt-1 flex items-center gap-1">
                    {Array.from({ length: Math.min(goal, 8) }).map((_, i) => (
                      <span
                        key={i}
                        className={`h-[9px] w-[9px] rounded-full ${i < visits ? "bg-accent" : "bg-line"}`}
                      />
                    ))}
                    <span className="ml-1.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-muted truncate">
                      {remaining === 0
                        ? "Reward ready"
                        : remaining !== null
                        ? `${remaining} to go`
                        : p.shop.deal_title ?? `${p.shop.reward_goal} visits to reward`}
                    </span>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-accent px-3.5 py-2 text-[10px] font-bold tracking-[0.1em] text-accent-ink">
                  VISIT
                </span>
              </button>
            </div>

            {/* Caption + quiet action line */}
            {p.body && (
              <button
                onClick={() => router.push(`/customer/post/${p.id}`)}
                className="mt-2.5 block w-full text-left text-[15px] font-normal leading-relaxed text-ink line-clamp-2"
              >
                {p.body}
              </button>
            )}
            <div className="mt-1.5 flex items-center gap-1.5 text-[12px] font-medium text-muted">
              <button onClick={() => toggleLike(p)} className="flex items-center gap-1.5 py-1">
                <Heart
                  className={`h-4 w-4 ${p.viewer.liked ? "text-ink" : "text-muted"}`}
                  fill={p.viewer.liked ? "currentColor" : "none"}
                />
                <span>{p.counts.likes} {p.counts.likes === 1 ? "like" : "likes"}</span>
              </button>
              <span>·</span>
              <button onClick={() => router.push(`/customer/post/${p.id}`)} className="py-1">
                {p.counts.comments} {p.counts.comments === 1 ? "comment" : "comments"}
              </button>
            </div>
          </div>
        );
      })}

      {/* Infinite-scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />
      {loadingMore && (
        <div className="flex justify-center py-4">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-ink" />
        </div>
      )}
      {!hasMore && posts.length > 6 && (
        <p className="py-6 text-center text-[12px] font-normal text-muted">
          You&rsquo;re all caught up
        </p>
      )}
    </div>
  );
}

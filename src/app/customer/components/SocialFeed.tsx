"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Compass, Sparkles, BadgeCheck , MapPin } from "lucide-react";
import FollowButton from "./FollowButton";
import EmptyState from "./EmptyState";

type FeedPost = {
  id: string;
  body: string;
  media_url: string | null;
  media_type: "image" | "video" | null;
  created_at: string;
  author: { profile_id: string; display_name: string; avatar_url: string | null; followed: boolean };
  shop: {
    slug: string;
    name: string;
    neighborhood?: string | null;
    logo_url: string | null;
    deal_title: string | null;
    reward_goal: number;
  };
  counts: { likes: number; comments: number };
  verified_visit?: boolean;
  poster_url?: string | null;
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
      className={`rounded-full px-3.5 py-2 text-xs font-medium transition-all ${
        following
          ? "bg-surface-raised text-primary"
          : "bg-primary text-inverse active:opacity-80"
      }`}
    >
      {following ? "Following" : "Follow"}
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
        <p className="text-xs font-semibold uppercase tracking-caps text-muted">Suggested for you</p>
      </div>
      <div className="flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-none">
        {suggestions.map((s) => (
          <div
            key={`${s.kind}-${s.profile_id ?? s.shop_slug}`}
            className="elevation-1 flex w-40 shrink-0 flex-col items-center rounded-card px-3 py-4"
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
                  className={`flex h-14 w-14 items-center justify-center bg-surface-sunken ${
                    s.kind === "creator" ? "rounded-full" : "rounded-ctl"
                  }`}
                >
                  <span className="text-lg font-medium text-muted">
                    {s.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <p className="mt-2.5 w-full truncate text-center text-sm font-semibold text-primary">
                {s.display_name}
              </p>
              <p className="mt-0.5 w-full truncate text-center text-xs text-muted">
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
      <div className="mx-auto max-w-[510px] space-y-5 px-5">
        {[0, 1].map((i) => (
          <div key={i} className="elevation-1 overflow-hidden rounded-card">
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
        <EmptyState
          icon={Compass}
          eyebrow="Your feed"
          title="Be the first one here"
          body="Nobody you follow has posted yet. Find a place you like and show people what it's actually like inside."
          primary={{ label: "Explore the map", onClick: () => router.push("/customer/map") }}
          secondary={{ label: "Find people to follow", onClick: () => router.push("/customer/explore") }}
        />
      </div>
    );
  }

  return (
    // max-w caps the column on desktop (~470px of media inside the px-5 gutter,
    // matching Instagram web). It does not bind at 375px, so mobile stays full-bleed.
    <div className="mx-auto max-w-[510px] space-y-7 px-5 pb-4">
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
            {/* Card header — PLACE FIRST.
                The place and the proof lead; the person is the second line.
                This ordering is the product: a photo feed with location tags
                is a different app, and the differentiator is lost by inches if
                the place keeps sliding into the caption. */}
            <div className="mb-2.5">
              <button
                onClick={() =>
                  p.shop.slug ? router.push(`/place/${p.shop.slug}`) : undefined
                }
                className="flex w-full items-start gap-2 text-left"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-lg font-semibold leading-tight text-primary">
                    {p.shop.name}
                  </span>
                  {p.shop.neighborhood && (
                    <span className="mt-0.5 block truncate text-xs text-muted">
                      {p.shop.neighborhood}
                    </span>
                  )}
                </span>
                {p.verified_visit && (
                  <span
                    /* Ink, NOT accent. Green is brand and never reports state
                       (design-notes, 2026-07-25) — a green "verified" pill is
                       exactly the collision that rule exists to prevent, and it
                       would sit inches from the green Visit button. A stamp is
                       a record, and records are printed in ink. */
                    className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-sunken px-2 py-0.5 text-primary"
                    title="This person checked in here"
                  >
                    <BadgeCheck className="h-3.5 w-3.5" />
                    <span className="text-2xs font-semibold uppercase tracking-caps">Verified</span>
                  </span>
                )}
              </button>

              <button
                onClick={() => router.push(`/customer/creator/${p.author.profile_id}`)}
                className="mt-2 flex w-full items-center gap-2 text-left"
              >
                {p.author.avatar_url ? (
                  <img src={p.author.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-sunken">
                    <span className="text-2xs font-medium text-muted">
                      {p.author.display_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <p className="min-w-0 flex-1 truncate text-xs text-secondary">
                  {p.author.display_name} · {timeAgo(p.created_at)}
                </p>
              </button>
            </div>

            {/* One envelope: media + Visit & Earn footer share the card */}
            <div className="elevation-1 overflow-hidden rounded-card">
              {p.media_url && (
                <button onClick={() => router.push(`/customer/post/${p.id}`)} className="block w-full">
                  {p.media_type === "video" ? (
                    // max-h stops a 4:5 frame from eating a short laptop viewport;
                    // object-cover crops rather than letterboxing.
                    <video
                      src={p.media_url}
                      // A poster is what a video tile shows before it decodes —
                      // and on Chrome, which will not play iOS quicktime at
                      // all, it is the ONLY thing it will ever show.
                      poster={p.poster_url ?? undefined}
                      muted
                      playsInline
                      preload="metadata"
                      className="aspect-[4/5] max-h-[70vh] w-full object-cover"
                    />
                  ) : (
                    <img src={p.media_url} alt="" loading="lazy" className="aspect-[4/5] max-h-[70vh] w-full object-cover" />
                  )}
                </button>
              )}
              <button
                onClick={() => router.push(`/customer/shop/${p.shop.slug}`)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-surface-sunken"
              >
                <div className="min-w-0 flex-1">
                  {/* The place name lives in the card HEADER now. Repeating it
                      here said the same thing twice in one card and pushed the
                      reward progress — the only thing this footer actually
                      adds — down into second place. */}
                  <p className="truncate text-2xs font-semibold uppercase tracking-caps text-muted">
                    Loyalty
                  </p>
                  <div className="mt-1 flex items-center gap-1">
                    {Array.from({ length: Math.min(goal, 8) }).map((_, i) => (
                      <span
                        key={i}
                        /* Ink, not accent: green is brand only and never
                           reports state. A filled ink dot reads as a tally on
                           a card; a filled green dot reads as "done". The
                           Visit pill beside this keeps the green, because it
                           is the thing you press. */
                        className={`h-[9px] w-[9px] rounded-full ${i < visits ? "bg-primary" : "bg-subtle"}`}
                      />
                    ))}
                    <span className="ml-1.5 truncate text-2xs font-semibold uppercase tracking-caps text-muted">
                      {remaining === 0
                        ? "Reward ready"
                        : remaining !== null
                        ? `${remaining} to go`
                        : p.shop.deal_title ?? `${p.shop.reward_goal} visits to reward`}
                    </span>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-accent px-4 py-2.5 text-xs font-semibold text-on-accent">
                  Visit
                </span>
              </button>
            </div>

            {/* Caption + quiet action line */}
            {p.body && (
              <button
                onClick={() => router.push(`/customer/post/${p.id}`)}
                className="mt-3 line-clamp-2 block w-full text-left text-base leading-relaxed text-primary"
              >
                {p.body}
              </button>
            )}
            <div className="mt-2 flex items-center gap-1.5 text-sm font-medium text-muted">
              <button onClick={() => toggleLike(p)} className="flex items-center gap-1.5 py-1">
                <Heart
                  className={`h-4 w-4 ${p.viewer.liked ? "text-primary" : "text-muted"}`}
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
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-subtle border-t-primary" />
        </div>
      )}
      {!hasMore && posts.length > 6 && (
        <p className="py-6 text-center text-sm text-muted">
          You&rsquo;re all caught up
        </p>
      )}
    </div>
  );
}

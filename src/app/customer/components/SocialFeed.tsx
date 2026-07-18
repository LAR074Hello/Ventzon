"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle, ChevronRight, Compass, Sparkles } from "lucide-react";
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
          ? "border border-[#333] bg-[#111] text-[#ededed]"
          : "bg-[#ededed] text-black active:bg-[#d4d4d4]"
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
        <Sparkles className="h-3.5 w-3.5 text-[#555]" />
        <p className="text-[11px] font-light tracking-[0.15em] text-[#666]">SUGGESTED FOR YOU</p>
      </div>
      <div className="flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-none">
        {suggestions.map((s) => (
          <div
            key={`${s.kind}-${s.profile_id ?? s.shop_slug}`}
            className="flex w-40 shrink-0 flex-col items-center rounded-2xl border border-[#1f1f1f] bg-[#0a0a0a] px-3 py-4"
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
                  className={`h-14 w-14 object-cover ${s.kind === "creator" ? "rounded-full" : "rounded-2xl"}`}
                />
              ) : (
                <div
                  className={`flex h-14 w-14 items-center justify-center bg-[#1a1a1a] ${
                    s.kind === "creator" ? "rounded-full" : "rounded-2xl"
                  }`}
                >
                  <span className="text-[18px] font-medium text-[#888]">
                    {s.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <p className="mt-2.5 w-full truncate text-center text-[13px] font-medium text-[#ededed]">
                {s.display_name}
              </p>
              <p className="mt-0.5 w-full truncate text-center text-[11px] font-normal text-[#666]">
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

  useEffect(() => {
    const params = userLoc ? `?lat=${userLoc.lat}&lng=${userLoc.lng}` : "";
    fetch(`/api/customer/feed${params}`)
      .then((r) => (r.ok ? r.json() : { posts: [] }))
      .then((d) => setPosts(d.posts ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userLoc]);

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
          <div key={i} className="overflow-hidden rounded-2xl border border-[#1f1f1f]">
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
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-[#1f1f1f] bg-[#0d0d0d]">
            <Compass className="h-7 w-7 text-[#333]" />
          </div>
          <p className="mt-5 text-[16px] font-semibold text-[#f5f5f5]">Nothing here yet</p>
          <p className="mt-2 text-[13px] font-normal leading-relaxed text-[#666]">
            Posts from creators at local businesses will show up here.<br />
            Follow creators you like to shape your feed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 px-5 pb-4">
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
        return (
          <div key={p.id} className="overflow-hidden rounded-2xl border border-[#1f1f1f] bg-[#0a0a0a]">
            {/* Author */}
            <button
              onClick={() => router.push(`/customer/creator/${p.author.profile_id}`)}
              className="flex w-full items-center gap-3 px-4 pt-4 pb-3 text-left"
            >
              {p.author.avatar_url ? (
                <img src={p.author.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1a1a1a]">
                  <span className="text-[13px] font-medium text-[#888]">
                    {p.author.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-[#ededed] truncate">
                  {p.author.display_name}
                  {p.author.followed && (
                    <span className="ml-2 text-[10px] font-normal text-[#555]">FOLLOWING</span>
                  )}
                </p>
                <p className="text-[11px] font-normal text-[#555]">
                  at {p.shop.name} · {timeAgo(p.created_at)}
                </p>
              </div>
            </button>

            {/* Media */}
            {p.media_url && (
              <button onClick={() => router.push(`/customer/post/${p.id}`)} className="block w-full">
                {p.media_type === "video" ? (
                  <video src={p.media_url} muted playsInline preload="metadata" className="max-h-[70vh] w-full object-cover" />
                ) : (
                  <img src={p.media_url} alt="" loading="lazy" className="max-h-[70vh] w-full object-cover" />
                )}
              </button>
            )}

            {/* Actions + caption */}
            <div className="px-4 pt-3">
              <div className="flex items-center gap-4">
                <button onClick={() => toggleLike(p)} className="flex items-center gap-1.5">
                  <Heart
                    className={`h-5 w-5 ${p.viewer.liked ? "text-red-500" : "text-[#888]"}`}
                    fill={p.viewer.liked ? "currentColor" : "none"}
                  />
                  <span className="text-[12px] font-medium text-[#888]">{p.counts.likes}</span>
                </button>
                <button
                  onClick={() => router.push(`/customer/post/${p.id}`)}
                  className="flex items-center gap-1.5"
                >
                  <MessageCircle className="h-5 w-5 text-[#888]" />
                  <span className="text-[12px] font-medium text-[#888]">{p.counts.comments}</span>
                </button>
              </div>
              {p.body && (
                <button
                  onClick={() => router.push(`/customer/post/${p.id}`)}
                  className="mt-2 block w-full text-left text-[13px] font-normal leading-relaxed text-[#bbb] line-clamp-2"
                >
                  {p.body}
                </button>
              )}
            </div>

            {/* Visit & Earn — the one-tap path from browsing to a real visit */}
            <button
              onClick={() => router.push(`/customer/shop/${p.shop.slug}`)}
              className="mx-4 mb-4 mt-3 flex w-[calc(100%-2rem)] items-center gap-3 rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] px-3 py-2.5 text-left active:bg-[#111]"
            >
              {p.shop.logo_url ? (
                <img src={p.shop.logo_url} alt="" className="h-8 w-8 shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1a1a1a]">
                  <span className="text-[12px] font-medium text-[#888]">{p.shop.name.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium text-[#d0d0d0] truncate">{p.shop.name}</p>
                <p className="text-[11px] font-normal text-[#666] truncate">
                  {remaining !== null && remaining > 0
                    ? `${remaining} more visit${remaining === 1 ? "" : "s"} to your reward`
                    : remaining === 0
                    ? "Reward ready to redeem"
                    : p.shop.deal_title ?? `${p.shop.reward_goal} visits to reward`}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-[#ededed] px-3 py-1 text-[9px] font-bold tracking-[0.08em] text-black">
                VISIT &amp; EARN
              </span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#333]" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

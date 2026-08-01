"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Heart, Bookmark, MessageCircle, Share2, Send, ChevronRight, Trash2, EyeOff, BadgeCheck, MapPin,
} from "lucide-react";
import SafetyMenu from "../../components/SafetyMenu";

type PostData = {
  verified_visit?: boolean;
  post: { id: string; body: string; media_url: string | null; media_type: string | null; created_at: string; hidden?: boolean };
  author: { profile_id: string; display_name: string; avatar_url: string | null } | null;
  shop: { slug: string; name: string; logo_url: string | null; deal_title: string | null; reward_goal: number } | null;
  // An imported place, when there is no merchant account. Carries no reward
  // fields on purpose — see the render below.
  place: { slug: string; name: string; neighborhood: string | null; city: string | null; category: string | null } | null;
  counts: { likes: number; saves: number; comments: number };
  viewer: { liked: boolean; saved: boolean; is_own: boolean; progress: { visits: number; goal: number } | null };
  comments: {
    id: string; body: string; created_at: string; is_own: boolean;
    author: { profile_id: string | null; linkable?: boolean; display_name: string; avatar_url: string | null };
  }[];
};

function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function PostPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const postId = String(params?.id ?? "");

  const [data, setData] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/customer/posts/${postId}`);
    if (!res.ok) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setData(await res.json());
    setLoading(false);
  }, [postId]);

  useEffect(() => { load(); }, [load]);

  async function act(action: string, body?: string) {
    const res = await fetch(`/api/customer/posts/${postId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...(body ? { body } : {}) }),
    });
    if (res.status === 401) {
      router.push(`/customer/auth?redirect=/customer/post/${postId}`);
      return false;
    }
    return res.ok;
  }

  async function toggleLike() {
    if (!data) return;
    const next = !data.viewer.liked;
    setData({
      ...data,
      viewer: { ...data.viewer, liked: next },
      counts: { ...data.counts, likes: data.counts.likes + (next ? 1 : -1) },
    });
    const ok = await act(next ? "like" : "unlike");
    if (!ok) load();
  }

  async function toggleSave() {
    if (!data) return;
    const next = !data.viewer.saved;
    setData({
      ...data,
      viewer: { ...data.viewer, saved: next },
      counts: { ...data.counts, saves: data.counts.saves + (next ? 1 : -1) },
    });
    const ok = await act(next ? "save" : "unsave");
    if (!ok) load();
  }

  async function submitComment() {
    const text = comment.trim();
    if (!text || sending) return;
    setSending(true);
    const ok = await act("comment", text);
    if (ok) {
      setComment("");
      await load();
    }
    setSending(false);
  }

  async function share() {
    try {
      await navigator.share({
        title: data?.author?.display_name ?? "Ventzon",
        text: data?.post.body?.slice(0, 100) ?? "Check out this post on Ventzon",
        url: `${window.location.origin}/customer/post/${postId}`,
      });
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-subtle border-t-ink" />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-caps text-muted">NOT FOUND</p>
        <h1 className="mt-4 font-display text-2xl font-semibold text-primary">Post not found</h1>
        <button
          onClick={() => router.back()}
          className="text-xs font-semibold uppercase tracking-caps text-primary mt-8 rounded-full border border-subtle px-6 py-3"
        >
          Go back
        </button>
      </div>
    );
  }

  const { post, author, shop, place, counts, viewer, comments, verified_visit } = data;
  const remaining = viewer.progress ? Math.max(viewer.progress.goal - viewer.progress.visits, 0) : null;

  return (
    <div className="flex min-h-screen flex-col bg-surface pb-8">
      {/* Top bar */}
      <div
        className="flex items-center gap-3 px-4 pb-3"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 20px) + 8px)" }}
      >
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-subtle bg-surface/80"
        >
          <ArrowLeft className="h-4 w-4 text-primary" />
        </button>
        {author && (
          <button
            onClick={() => router.push(`/customer/creator/${author.profile_id}`)}
            className="flex items-center gap-2.5"
          >
            {author.avatar_url ? (
              <img src={author.avatar_url} alt={author.display_name} className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-raised">
                <span className="text-xs text-muted font-medium">{author.display_name.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <div className="text-left">
              <p className="text-base text-primary font-medium">{author.display_name}</p>
              <p className="text-xs text-muted flex items-center gap-1.5 font-normal">
                {timeAgo(post.created_at)}
                {verified_visit && (
                  <span className="inline-flex items-center gap-1 text-primary">
                    <BadgeCheck className="h-3 w-3" />
                    <span className="text-2xs font-semibold uppercase tracking-caps">Verified visit</span>
                  </span>
                )}
              </p>
            </div>
          </button>
        )}
      </div>

      {/* Media */}
      {post.media_url && (
        <div className="w-full bg-surface-raised">
          {post.media_type === "video" ? (
            <video src={post.media_url} controls playsInline className="max-h-[60vh] w-full object-contain" />
          ) : (
            <img src={post.media_url} alt="" className="max-h-[60vh] w-full object-contain" />
          )}
        </div>
      )}

      {/* Action row */}
      <div className="flex items-center gap-5 px-5 pt-4">
        <button onClick={toggleLike} className="flex items-center gap-1.5">
          <Heart
            className={`h-5 w-5 transition-colors ${viewer.liked ? "text-primary" : "text-muted"}`}
            fill={viewer.liked ? "currentColor" : "none"}
          />
          <span className="text-xs text-muted font-medium">{counts.likes}</span>
        </button>
        <div className="flex items-center gap-1.5">
          <MessageCircle className="h-5 w-5 text-muted" />
          <span className="text-xs text-muted font-medium">{counts.comments}</span>
        </div>
        <button onClick={toggleSave} className="flex items-center gap-1.5">
          <Bookmark
            className={`h-5 w-5 transition-colors ${viewer.saved ? "text-primary" : "text-muted"}`}
            fill={viewer.saved ? "currentColor" : "none"}
          />
        </button>
        <button onClick={share} className="ml-auto">
          <Share2 className="h-5 w-5 text-muted" />
        </button>
        {!viewer.is_own && author && (
          <SafetyMenu
            targetType="post"
            targetId={postId}
            blockProfileId={author.profile_id}
            targetName={author.display_name}
            compact
            onDone={() => router.back()}
          />
        )}
        {viewer.is_own && (
          <button
            onClick={async () => {
              if (!window.confirm("Delete this post?")) return;
              await fetch(`/api/customer/posts?id=${postId}`, { method: "DELETE" });
              router.back();
            }}
          >
            <Trash2 className="h-5 w-5 text-muted" />
          </button>
        )}
      </div>

      {/* Hidden-pending-review notice (author only) */}
      {post.hidden && viewer.is_own && (
        <div className="mx-5 mt-4 flex items-center gap-3 rounded-ctl border border-subtle bg-surface-raised px-4 py-3">
          <EyeOff className="h-4 w-4 shrink-0 text-muted" />
          <p className="text-xs text-muted font-normal">
            This post was reported and is hidden while we review it.
          </p>
        </div>
      )}

      {/* Caption */}
      {post.body && (
        <p className="text-base text-primary px-5 pt-3 font-normal leading-relaxed">{post.body}</p>
      )}

      {/* Linked business + Visit & Earn */}
      {shop && (
        <button
          onClick={() => router.push(`/customer/shop/${shop.slug}`)}
          /* The action sits on its own row. Sharing a line with the place
             name meant four things competing for ~300px, and the name lost
             every time — "Perch Coffee" rendered as "Perch Cof…". */
          className="elevation-1 mx-5 mt-4 flex flex-col gap-3 rounded-card px-4 py-3.5 text-left transition-colors active:bg-surface-sunken"
        >
          <div className="flex items-center gap-3.5">
            {shop.logo_url ? (
              <img src={shop.logo_url} alt={shop.name} className="h-10 w-10 shrink-0 rounded-ctl object-cover" />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ctl bg-surface-sunken">
                <span className="text-base font-medium text-secondary">{shop.name.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-medium text-primary">{shop.name}</p>
              <p className="mt-0.5 text-xs text-muted">
                {remaining !== null && remaining > 0
                  ? `${remaining} more visit${remaining === 1 ? "" : "s"} to ${shop.deal_title ?? "your reward"}`
                  : remaining === 0
                  ? "Reward ready to redeem"
                  : shop.deal_title ?? `${shop.reward_goal} visits to reward`}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
          </div>
          <span className="block w-full rounded-ctl bg-accent py-2.5 text-center text-sm font-medium text-on-accent">
            Visit &amp; earn
          </span>
        </button>
      )}

      {/* An imported place: real location, no merchant account. Deliberately
          NOT the block above — there is no reward programme here, and
          rendering progress toward a reward nobody offers would invent one.
          Name and neighbourhood carry the row; the tap goes to the place page
          rather than /customer/shop, which is shop-settings-driven and would
          be an empty shell for a place no merchant has claimed. */}
      {!shop && place && (
        <button
          onClick={() => router.push(`/place/${place.slug}`)}
          className="elevation-1 mx-5 mt-4 flex w-[calc(100%-2.5rem)] items-center gap-3.5 rounded-card px-4 py-3.5 text-left transition-colors active:bg-surface-sunken"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ctl bg-surface-sunken">
            <MapPin className="h-4 w-4 text-secondary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-medium text-primary">{place.name}</p>
            <p className="mt-0.5 truncate text-xs text-muted">
              {[place.neighborhood, place.category].filter(Boolean).join(" · ") || place.city}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
        </button>
      )}

      {/* Comments */}
      <div className="mt-6 px-5">
        <p className="text-xs font-semibold uppercase tracking-caps text-muted mb-3">
          COMMENTS{counts.comments > 0 ? ` (${counts.comments})` : ""}
        </p>
        {comments.length === 0 ? (
          <p className="text-sm text-secondary pb-2 font-normal">Be the first to comment</p>
        ) : (
          <div className="space-y-3.5 pb-2">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <button
                  onClick={() => c.author.linkable && c.author.profile_id && router.push(`/customer/creator/${c.author.profile_id}`)}
                  className="shrink-0"
                >
                  {c.author.avatar_url ? (
                    <img src={c.author.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-raised">
                      <span className="text-xs text-muted font-medium">
                        {c.author.display_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-medium text-muted">{c.author.display_name}</span>
                    <span className="text-xs text-muted ml-2">{timeAgo(c.created_at)}</span>
                  </p>
                  <p className="text-sm text-secondary mt-0.5 font-normal leading-relaxed">{c.body}</p>
                </div>
                {(c.is_own || viewer.is_own) && (
                  <button
                    onClick={async () => {
                      if (!window.confirm("Delete this comment?")) return;
                      await fetch(`/api/customer/posts/${postId}?comment_id=${c.id}`, { method: "DELETE" });
                      await load();
                    }}
                    className="shrink-0 p-1 text-muted active:text-danger"
                    aria-label="Delete comment"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                {!c.is_own && (
                  <SafetyMenu
                    targetType="comment"
                    targetId={c.id}
                    blockProfileId={c.author.profile_id}
                    targetName={c.author.display_name}
                    compact
                    onDone={() => load()}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Comment input */}
        <div className="mt-3 flex items-center gap-2 rounded-card border border-subtle bg-surface-raised px-4 py-2.5">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitComment()}
            placeholder="Add a comment…"
            maxLength={500}
            className="text-base text-primary flex-1 bg-transparent font-normal outline-none placeholder:"
          />
          <button
            onClick={submitComment}
            disabled={!comment.trim() || sending}
            className="text-muted disabled:opacity-30"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

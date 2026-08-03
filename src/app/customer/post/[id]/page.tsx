"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Heart, Bookmark, MessageCircle, Share2, ChevronRight, Trash2, EyeOff, BadgeCheck, MapPin, Pencil,
} from "lucide-react";
import SafetyMenu from "../../components/SafetyMenu";
import EditPostSheet from "../../components/EditPostSheet";
import Avatar from "../../components/Avatar";
import CommentsSheet from "../../components/CommentsSheet";

type PostData = {
  verified_visit?: boolean;
  post: { id: string; body: string; media_url: string | null; media_type: string | null; poster_url?: string | null; created_at: string; hidden?: boolean };
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
  const [editing, setEditing] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);

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
            <Avatar
              name={author.display_name}
              seed={author.profile_id}
              url={author.avatar_url}
              size={32}
            />
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
            <video
              src={post.media_url}
              poster={post.poster_url ?? undefined}
              controls
              playsInline
              className="max-h-[60vh] w-full object-contain"
            />
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
          <button onClick={() => setEditing(true)} aria-label="Edit post">
            <Pencil className="h-5 w-5 text-muted" />
          </button>
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

      {editing && (
        <EditPostSheet
          postId={postId}
          initialBody={post.body ?? ""}
          initialPlaceName={shop?.name ?? place?.name ?? null}
          hadVerifiedVisit={!!verified_visit}
          onClose={() => setEditing(false)}
          onSaved={load}
        />
      )}

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

      {/* Comments — a docked sheet, not an inline list.
          On a phone the inline version put the input at the bottom of a long
          page, so replying meant scrolling past every comment to reach it. */}
      <button
        onClick={() => setCommentsOpen(true)}
        className="mt-6 flex w-full items-center justify-between px-5 py-3 text-left"
      >
        <span className="text-sm text-secondary">
          {counts.comments > 0
            ? `View ${counts.comments} comment${counts.comments === 1 ? "" : "s"}`
            : "Be the first to say something"}
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
      </button>

      {commentsOpen && (
        <CommentsSheet
          postId={postId}
          initialComments={comments}
          onClose={() => {
            setCommentsOpen(false);
            load();
          }}
          onCountChange={(n) =>
            setData((d) => (d ? { ...d, counts: { ...d.counts, comments: n } } : d))
          }
        />
      )}

    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Heart, Bookmark, MessageCircle, Share2, Send, ChevronRight, Trash2, EyeOff,
} from "lucide-react";
import SafetyMenu from "../../components/SafetyMenu";

type PostData = {
  post: { id: string; body: string; media_url: string | null; media_type: string | null; created_at: string; hidden?: boolean };
  author: { profile_id: string; display_name: string; avatar_url: string | null } | null;
  shop: { slug: string; name: string; logo_url: string | null; deal_title: string | null; reward_goal: number } | null;
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
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-ink" />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-8 text-center">
        <p className="text-[11px] font-light tracking-[0.3em] text-muted">NOT FOUND</p>
        <h1 className="mt-4 font-display text-2xl font-semibold text-ink">Post not found</h1>
        <button
          onClick={() => router.back()}
          className="mt-8 rounded-full border border-line px-6 py-3 text-[12px] tracking-[0.15em] text-ink"
        >
          Go back
        </button>
      </div>
    );
  }

  const { post, author, shop, counts, viewer, comments } = data;
  const remaining = viewer.progress ? Math.max(viewer.progress.goal - viewer.progress.visits, 0) : null;

  return (
    <div className="flex min-h-screen flex-col bg-bg pb-8">
      {/* Top bar */}
      <div
        className="flex items-center gap-3 px-4 pb-3"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 20px) + 8px)" }}
      >
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-bg/80"
        >
          <ArrowLeft className="h-4 w-4 text-ink" />
        </button>
        {author && (
          <button
            onClick={() => router.push(`/customer/creator/${author.profile_id}`)}
            className="flex items-center gap-2.5"
          >
            {author.avatar_url ? (
              <img src={author.avatar_url} alt={author.display_name} className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface">
                <span className="text-[12px] font-medium text-muted">{author.display_name.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <div className="text-left">
              <p className="text-[13px] font-medium text-ink">{author.display_name}</p>
              <p className="text-[10px] font-normal text-muted">{timeAgo(post.created_at)}</p>
            </div>
          </button>
        )}
      </div>

      {/* Media */}
      {post.media_url && (
        <div className="w-full bg-surface">
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
            className={`h-5 w-5 transition-colors ${viewer.liked ? "text-ink" : "text-muted"}`}
            fill={viewer.liked ? "currentColor" : "none"}
          />
          <span className="text-[12px] font-medium text-muted">{counts.likes}</span>
        </button>
        <div className="flex items-center gap-1.5">
          <MessageCircle className="h-5 w-5 text-muted" />
          <span className="text-[12px] font-medium text-muted">{counts.comments}</span>
        </div>
        <button onClick={toggleSave} className="flex items-center gap-1.5">
          <Bookmark
            className={`h-5 w-5 transition-colors ${viewer.saved ? "text-ink" : "text-muted"}`}
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
        <div className="mx-5 mt-4 flex items-center gap-3 rounded-ctl border border-line bg-surface px-4 py-3">
          <EyeOff className="h-4 w-4 shrink-0 text-muted" />
          <p className="text-[12px] font-normal text-muted">
            This post was reported and is hidden while we review it.
          </p>
        </div>
      )}

      {/* Caption */}
      {post.body && (
        <p className="px-5 pt-3 text-[14px] font-normal leading-relaxed text-ink">{post.body}</p>
      )}

      {/* Linked business + Visit & Earn */}
      {shop && (
        <button
          onClick={() => router.push(`/customer/shop/${shop.slug}`)}
          className="mx-5 mt-4 flex items-center gap-3.5 rounded-card border border-line bg-surface px-4 py-3.5 text-left active:bg-surface"
        >
          {shop.logo_url ? (
            <img src={shop.logo_url} alt={shop.name} className="h-10 w-10 shrink-0 rounded-ctl object-cover" />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ctl bg-surface">
              <span className="text-[14px] font-medium text-muted">{shop.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-medium text-ink truncate">{shop.name}</p>
            <p className="mt-0.5 text-[12px] font-normal text-muted truncate">
              {remaining !== null && remaining > 0
                ? `${remaining} more visit${remaining === 1 ? "" : "s"} to ${shop.deal_title ?? "your reward"}`
                : remaining === 0
                ? "Your reward is ready to redeem"
                : shop.deal_title ?? `${shop.reward_goal} visits to reward`}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-accent px-3.5 py-1.5 text-[10px] font-bold tracking-[0.1em] text-accent-ink">
            VISIT &amp; EARN
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
        </button>
      )}

      {/* Comments */}
      <div className="mt-6 px-5">
        <p className="mb-3 text-[11px] font-light tracking-[0.15em] text-muted">
          COMMENTS{counts.comments > 0 ? ` (${counts.comments})` : ""}
        </p>
        {comments.length === 0 ? (
          <p className="pb-2 text-[13px] font-normal text-muted">Be the first to comment</p>
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
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface">
                      <span className="text-[10px] font-medium text-muted">
                        {c.author.display_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px]">
                    <span className="font-medium text-muted">{c.author.display_name}</span>
                    <span className="ml-2 text-[10px] text-muted">{timeAgo(c.created_at)}</span>
                  </p>
                  <p className="mt-0.5 text-[13px] font-normal leading-relaxed text-muted">{c.body}</p>
                </div>
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
        <div className="mt-3 flex items-center gap-2 rounded-card border border-line bg-surface px-4 py-2.5">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitComment()}
            placeholder="Add a comment…"
            maxLength={500}
            className="flex-1 bg-transparent text-[13px] font-normal text-ink outline-none placeholder:text-muted"
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

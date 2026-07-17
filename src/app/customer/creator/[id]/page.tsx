"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Share2, Award, MapPin, Send, Trash2, UserPlus, UserCheck } from "lucide-react";

type CreatorProfile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
};

type Stats = {
  followers: number;
  following: number;
  posts: number;
  businesses_visited: number;
  total_points: number;
  referrals: number;
};

type Badge = { id: string; label: string; description: string; earned: boolean };
type Post = { id: string; body: string; shop_slug: string | null; created_at: string };

function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-[#1f1f1f] bg-[#0a0a0a] px-2 py-3">
      <p className="text-[17px] font-semibold text-[#f5f5f5]">{value}</p>
      <p className="mt-0.5 text-[10px] font-light tracking-[0.08em] text-[#666]">{label.toUpperCase()}</p>
    </div>
  );
}

export default function CreatorProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const profileId = String(params?.id ?? "");

  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isOwn, setIsOwn] = useState(false);
  const [follows, setFollows] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [composer, setComposer] = useState("");
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/customer/creators/${profileId}`);
    if (!res.ok) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setProfile(data.profile);
    setStats(data.stats);
    setBadges(data.badges ?? []);
    setPosts(data.posts ?? []);
    setIsOwn(Boolean(data.viewer?.is_own));
    setFollows(Boolean(data.viewer?.follows));
    setLoading(false);
  }, [profileId]);

  useEffect(() => { load(); }, [load]);

  async function toggleFollow() {
    if (followBusy) return;
    const next = !follows;
    setFollowBusy(true);
    setFollows(next);
    setStats((s) => (s ? { ...s, followers: s.followers + (next ? 1 : -1) } : s));
    try {
      const res = await fetch("/api/customer/user-follows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_id: profileId, follow: next }),
      });
      if (res.status === 401) {
        router.push(`/customer/auth?redirect=/customer/creator/${profileId}`);
        return;
      }
      if (!res.ok) {
        setFollows(!next);
        setStats((s) => (s ? { ...s, followers: s.followers + (next ? -1 : 1) } : s));
      }
    } catch {
      setFollows(!next);
    } finally {
      setFollowBusy(false);
    }
  }

  async function submitPost() {
    const body = composer.trim();
    if (!body || posting) return;
    setPosting(true);
    try {
      const res = await fetch("/api/customer/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (res.ok) {
        setComposer("");
        await load();
      }
    } finally {
      setPosting(false);
    }
  }

  async function deletePost(id: string) {
    setPosts((p) => p.filter((x) => x.id !== id));
    await fetch(`/api/customer/posts?id=${id}`, { method: "DELETE" });
  }

  async function share() {
    try {
      await navigator.share({
        title: profile?.display_name ?? "Ventzon creator",
        text: `Check out ${profile?.display_name ?? "this creator"} on Ventzon`,
        url: `${window.location.origin}/customer/creator/${profileId}`,
      });
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#333] border-t-[#ededed]" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black px-8 text-center">
        <p className="text-[11px] font-light tracking-[0.3em] text-[#666]">NOT FOUND</p>
        <h1 className="mt-4 text-2xl font-semibold text-[#f5f5f5]">Creator not found</h1>
        <button
          onClick={() => router.back()}
          className="mt-8 rounded-full border border-[#333] px-6 py-3 text-[12px] font-normal tracking-[0.15em] text-[#f5f5f5]"
        >
          Go back
        </button>
      </div>
    );
  }

  const name = profile.display_name ?? "Creator";
  const earnedBadges = badges.filter((b) => b.earned);

  return (
    <div className="flex min-h-screen flex-col bg-black pb-10">
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 20px) + 8px)" }}
      >
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1f1f1f] bg-black/80"
        >
          <ArrowLeft className="h-4 w-4 text-[#f5f5f5]" />
        </button>
        <button
          onClick={share}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1f1f1f] bg-black/80"
        >
          <Share2 className="h-4 w-4 text-[#999]" />
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col items-center px-6 pt-4 pb-6">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt={name} className="h-24 w-24 rounded-full border-2 border-[#2a2a2a] object-cover" />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-[#2a2a2a] bg-[#1a1a1a]">
            <span className="text-2xl font-medium text-[#888]">{name.charAt(0).toUpperCase()}</span>
          </div>
        )}
        <h1 className="mt-4 text-[20px] font-semibold text-[#f5f5f5]">{name}</h1>
        <p className="mt-1 text-[11px] font-light tracking-[0.2em] text-[#666]">CREATOR</p>
        {profile.bio && (
          <p className="mt-3 max-w-xs text-center text-[13px] font-normal leading-relaxed text-[#999]">{profile.bio}</p>
        )}

        {!isOwn && (
          <button
            onClick={toggleFollow}
            disabled={followBusy}
            className={`mt-5 flex items-center gap-2 rounded-full px-6 py-2.5 text-[12px] font-medium tracking-[0.08em] transition-all duration-200 ${
              follows
                ? "border border-[#333] bg-[#111] text-[#ededed]"
                : "bg-[#ededed] text-black active:bg-[#d4d4d4]"
            }`}
          >
            {follows ? <UserCheck className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
            {follows ? "FOLLOWING" : "FOLLOW"}
          </button>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-2 px-5">
          <Stat value={stats.followers} label="Followers" />
          <Stat value={stats.following} label="Following" />
          <Stat value={stats.posts} label="Posts" />
          <Stat value={stats.businesses_visited} label="Places" />
          <Stat value={stats.total_points} label="Check-ins" />
          <Stat value={stats.referrals} label="Referrals" />
        </div>
      )}

      {/* Badges */}
      {earnedBadges.length > 0 && (
        <div className="mt-6 px-5">
          <div className="mb-3 flex items-center gap-2">
            <Award className="h-3.5 w-3.5 text-[#555]" />
            <p className="text-[11px] font-light tracking-[0.15em] text-[#666]">BADGES</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {earnedBadges.map((b) => (
              <div key={b.id} className="rounded-full border border-[#2a2a2a] bg-[#0d0d0d] px-3.5 py-1.5">
                <p className="text-[11px] font-medium text-[#d0d0d0]">{b.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Composer — own profile only */}
      {isOwn && (
        <div className="mx-5 mt-6 rounded-2xl border border-[#1f1f1f] bg-[#0a0a0a] p-3">
          <textarea
            value={composer}
            onChange={(e) => setComposer(e.target.value)}
            placeholder="Share a find, a favorite spot, a tip…"
            rows={2}
            maxLength={1000}
            className="w-full resize-none bg-transparent text-[14px] font-normal text-[#f5f5f5] outline-none placeholder:text-[#444]"
          />
          <div className="flex justify-end">
            <button
              onClick={submitPost}
              disabled={!composer.trim() || posting}
              className="flex items-center gap-1.5 rounded-full bg-[#ededed] px-4 py-2 text-[11px] font-medium tracking-[0.1em] text-black disabled:opacity-40"
            >
              <Send className="h-3 w-3" />
              {posting ? "POSTING…" : "POST"}
            </button>
          </div>
        </div>
      )}

      {/* Posts */}
      <div className="mt-6 px-5">
        <p className="mb-3 text-[11px] font-light tracking-[0.15em] text-[#666]">POSTS</p>
        {posts.length === 0 ? (
          <div className="rounded-2xl border border-[#1f1f1f] px-5 py-8 text-center">
            <p className="text-[13px] font-normal text-[#555]">No posts yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((p) => (
              <div key={p.id} className="rounded-2xl border border-[#1f1f1f] bg-[#0a0a0a] px-4 py-3.5">
                <p className="text-[14px] font-normal leading-relaxed text-[#d0d0d0]">{p.body}</p>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {p.shop_slug && (
                      <button
                        onClick={() => router.push(`/customer/shop/${p.shop_slug}`)}
                        className="flex items-center gap-1 text-[11px] text-[#666]"
                      >
                        <MapPin className="h-3 w-3" />
                        {p.shop_slug}
                      </button>
                    )}
                    <p className="text-[11px] text-[#444]">{timeAgo(p.created_at)}</p>
                  </div>
                  {isOwn && (
                    <button onClick={() => deletePost(p.id)} className="text-[#444] active:text-[#666]">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

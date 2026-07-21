"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Share2 } from "lucide-react";
import PostGrid, { type GridPost } from "../../components/PostGrid";
import FollowButton from "../../components/FollowButton";
import SafetyMenu from "../../components/SafetyMenu";
import PostComposer from "../../components/PostComposer";
import { ProfileStats, BadgePills } from "../../components/ProfileStats";

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
type Post = GridPost & { shop_slug: string | null };

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
  const [followsYou, setFollowsYou] = useState(false);
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
    setFollowsYou(Boolean(data.viewer?.follows_you));
    setLoading(false);
  }, [profileId]);

  useEffect(() => { load(); }, [load]);

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
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-ink" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-8 text-center">
        <p className="text-[11px] font-light tracking-[0.3em] text-muted">NOT FOUND</p>
        <h1 className="mt-4 font-display text-2xl font-semibold text-ink">Creator not found</h1>
        <button
          onClick={() => router.back()}
          className="mt-8 rounded-full border border-line px-6 py-3 text-[12px] font-normal tracking-[0.15em] text-ink"
        >
          Go back
        </button>
      </div>
    );
  }

  const name = profile.display_name ?? "Creator";

  return (
    <div className="flex min-h-screen flex-col bg-bg pb-10">
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 20px) + 8px)" }}
      >
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-bg/80"
        >
          <ArrowLeft className="h-4 w-4 text-ink" />
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={share}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-bg/80"
          >
            <Share2 className="h-4 w-4 text-muted" />
          </button>
          {!isOwn && (
            <SafetyMenu
              targetType="profile"
              targetId={profileId}
              blockProfileId={profileId}
              targetName={name}
              onDone={(a) => a === "blocked" && router.back()}
            />
          )}
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col items-center px-6 pt-4 pb-6">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt={name} className="h-24 w-24 rounded-full border-2 border-line object-cover" />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-line bg-surface">
            <span className="text-2xl font-medium text-muted">{name.charAt(0).toUpperCase()}</span>
          </div>
        )}
        <h1 className="mt-4 font-display text-[22px] font-semibold text-ink">{name}</h1>
        <p className="mt-1 text-[10px] font-semibold tracking-[0.14em] text-muted">CREATOR</p>
        {profile.bio && (
          <p className="mt-3 max-w-xs text-center text-[13px] font-normal leading-relaxed text-muted">{profile.bio}</p>
        )}

        {followsYou && !isOwn && (
          <span className="mt-3 rounded-full border border-line bg-surface px-3 py-1 text-[10px] font-medium tracking-[0.08em] text-muted">
            FOLLOWS YOU
          </span>
        )}

        {!isOwn && (
          <div className="mt-4">
            <FollowButton
              profileId={profileId}
              following={follows}
              onChange={(next) => {
                setFollows(next);
                setStats((s) => (s ? { ...s, followers: s.followers + (next ? 1 : -1) } : s));
              }}
            />
          </div>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="px-5">
          <ProfileStats
            stats={stats}
            onFollowersTap={() =>
              router.push(`/customer/follows?profile_id=${profileId}&type=followers&title=${encodeURIComponent(name)}`)
            }
            onFollowingTap={() =>
              router.push(`/customer/follows?profile_id=${profileId}&type=following&title=${encodeURIComponent(name)}`)
            }
          />
        </div>
      )}

      {/* Badges */}
      <div className="mt-6 px-5">
        <BadgePills badges={badges} />
      </div>

      {/* Composer — own profile only */}
      {isOwn && (
        <div className="mx-5 mt-6">
          <PostComposer onPosted={load} />
        </div>
      )}

      {/* Posts — shared grid component (also used on business profiles) */}
      <div className="mt-6 px-5">
        <p className="mb-3 text-[11px] font-light tracking-[0.15em] text-muted">POSTS</p>
        <PostGrid posts={posts} />
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, Share2, Pencil, Plus, Sparkles, X } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import PostGrid, { type GridPost } from "../components/PostGrid";
import PostComposer from "../components/PostComposer";
import { ProfileStats, BadgePills, type ProfileStatValues, type BadgeValue } from "../components/ProfileStats";

type OwnProfile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_creator: boolean;
};

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<OwnProfile | null>(null);
  const [stats, setStats] = useState<ProfileStatValues | null>(null);
  const [badges, setBadges] = useState<BadgeValue[]>([]);
  const [posts, setPosts] = useState<GridPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [becomingCreator, setBecomingCreator] = useState(false);

  const loadPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/customer/posts");
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts ?? []);
        setStats((s) => (s ? { ...s, posts: (data.posts ?? []).length } : s));
      }
    } catch {}
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.replace("/customer/auth?redirect=/customer/profile");
        return;
      }
      setUser(data.session.user);
      try {
        const res = await fetch("/api/customer/creator-profile");
        if (res.ok) {
          const d = await res.json();
          setProfile(d.profile);
          setStats(d.stats);
          setBadges(d.badges ?? []);
        }
      } catch {}
      await loadPosts();
      setLoading(false);
    });
  }, []);

  async function becomeCreator() {
    if (becomingCreator) return;
    setBecomingCreator(true);
    try {
      const res = await fetch("/api/customer/creator-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_creator: true }),
      });
      if (res.ok) {
        const d = await res.json();
        setProfile((p) => (p ? { ...p, is_creator: true, ...d.profile } : d.profile));
        setShowComposer(true);
      }
    } finally {
      setBecomingCreator(false);
    }
  }

  async function shareProfile() {
    if (!profile) return;
    // Creators share their public page; everyone's link carries their
    // referral code, same as shop-page shares.
    const url = profile.is_creator
      ? `${window.location.origin}/customer/creator/${profile.id}?ref=${profile.id}`
      : `${window.location.origin}/customer/explore?ref=${profile.id}`;
    try {
      await navigator.share({
        title: name,
        text: `Follow me on Ventzon — earn rewards at real local spots`,
        url,
      });
    } catch {}
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#333] border-t-[#ededed]" />
      </div>
    );
  }

  const isPrivateRelay = user.email?.endsWith("@privaterelay.appleid.com") ?? false;
  const name =
    profile?.display_name ??
    user.user_metadata?.full_name ??
    (isPrivateRelay ? "Customer" : (user.email?.split("@")[0] ?? "Customer"));
  const avatarUrl = profile?.avatar_url ?? user.user_metadata?.avatar_url ?? null;

  return (
    <div className="flex min-h-full flex-col bg-black pb-10">
      {/* Top bar — gear opens the full settings screen */}
      <div
        className="flex items-center justify-between px-5 pb-1"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 20px) + 12px)" }}
      >
        <h1 className="text-[20px] font-semibold text-[#f5f5f5]">{name}</h1>
        <button
          onClick={() => router.push("/customer/profile/settings")}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1f1f1f] bg-[#0a0a0a]"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4 text-[#999]" />
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col items-center px-6 pt-4 pb-5">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="h-24 w-24 rounded-full border-2 border-[#2a2a2a] object-cover" />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-[#2a2a2a] bg-[#1a1a1a]">
            <span className="text-2xl font-medium text-[#888]">{name.charAt(0).toUpperCase()}</span>
          </div>
        )}
        <h2 className="mt-4 text-[20px] font-semibold text-[#f5f5f5]">{name}</h2>
        {profile?.is_creator && (
          <p className="mt-1 text-[11px] font-light tracking-[0.2em] text-[#666]">CREATOR</p>
        )}
        {profile?.bio && (
          <p className="mt-3 max-w-xs text-center text-[13px] font-normal leading-relaxed text-[#999]">{profile.bio}</p>
        )}
      </div>

      {/* Stats — same component as the public creator page */}
      {stats && profile && (
        <div className="px-5">
          <ProfileStats
            stats={stats}
            onFollowersTap={() =>
              router.push(`/customer/follows?profile_id=${profile.id}&type=followers&title=${encodeURIComponent(name)}`)
            }
            onFollowingTap={() =>
              router.push(`/customer/follows?profile_id=${profile.id}&type=following&title=${encodeURIComponent(name)}`)
            }
          />
        </div>
      )}

      {/* Badges */}
      <div className="mt-5 px-5">
        <BadgePills badges={badges} />
      </div>

      {/* Edit / Share */}
      <div className="mt-5 flex gap-2 px-5">
        <button
          onClick={() => router.push("/customer/profile/settings")}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[#252525] bg-[#0d0d0d] py-3 text-[12px] font-medium tracking-[0.08em] text-[#d0d0d0] active:bg-[#111]"
        >
          <Pencil className="h-3.5 w-3.5" />
          EDIT PROFILE
        </button>
        <button
          onClick={shareProfile}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[#252525] bg-[#0d0d0d] py-3 text-[12px] font-medium tracking-[0.08em] text-[#d0d0d0] active:bg-[#111]"
        >
          <Share2 className="h-3.5 w-3.5" />
          SHARE PROFILE
        </button>
      </div>

      {/* Posts */}
      <div className="mt-7 px-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] font-light tracking-[0.15em] text-[#666]">POSTS</p>
          {profile?.is_creator && (
            <button
              onClick={() => setShowComposer((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ededed]"
              aria-label="New post"
            >
              {showComposer ? (
                <X className="h-4 w-4 text-black" />
              ) : (
                <Plus className="h-4 w-4 text-black" strokeWidth={2.5} />
              )}
            </button>
          )}
        </div>

        {showComposer && profile?.is_creator && (
          <div className="mb-4">
            <PostComposer
              onPosted={async () => {
                setShowComposer(false);
                await loadPosts();
              }}
            />
          </div>
        )}

        {posts.length > 0 ? (
          <PostGrid posts={posts} />
        ) : profile?.is_creator ? (
          <div className="rounded-2xl border border-[#1f1f1f] px-5 py-10 text-center">
            <p className="text-[14px] font-medium text-[#888]">No posts yet</p>
            <p className="mt-1.5 text-[12px] font-normal text-[#555]">
              Tap + to share your first find
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-2xl border border-[#1f1f1f] px-6 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#1f1f1f] bg-[#0d0d0d]">
              <Sparkles className="h-6 w-6 text-[#444]" />
            </div>
            <p className="mt-4 text-[15px] font-semibold text-[#f5f5f5]">Share your local finds</p>
            <p className="mt-1.5 text-[12px] font-normal leading-relaxed text-[#666]">
              Become a creator to post photos and tips from<br />the places you love — open to everyone
            </p>
            <button
              onClick={becomeCreator}
              disabled={becomingCreator}
              className="mt-6 rounded-full bg-[#ededed] px-7 py-3 text-[12px] font-medium tracking-[0.1em] text-black disabled:opacity-40"
            >
              {becomingCreator ? "SETTING UP…" : "BECOME A CREATOR"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

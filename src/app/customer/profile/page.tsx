"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, Share2, Pencil, Plus, Sparkles, X, Bookmark, ChevronRight } from "lucide-react";
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
  const [tab, setTab] = useState<"posts" | "saved">("posts");
  const [savedPosts, setSavedPosts] = useState<GridPost[]>([]);
  const [savedShops, setSavedShops] = useState<
    { shop_slug: string; shop_name: string; deal_title: string | null; logo_url: string | null;
      visits: number; goal: number; remaining: number; visited: boolean }[]
  >([]);
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
      try {
        const sres = await fetch("/api/customer/saves");
        if (sres.ok) {
          const sd = await sres.json();
          setSavedPosts(sd.posts ?? []);
          setSavedShops(sd.shops ?? []);
        }
      } catch {}
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
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-ink" />
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
    <div className="flex min-h-full flex-col bg-bg pb-10">
      {/* Top bar — gear opens the full settings screen */}
      <div
        className="flex items-center justify-between px-5 pb-1"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 20px) + 12px)" }}
      >
        <h1 className="font-display text-[20px] font-semibold text-ink">{name}</h1>
        <button
          onClick={() => router.push("/customer/profile/settings")}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4 text-muted" />
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col items-center px-6 pt-4 pb-5">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="h-24 w-24 rounded-full border-2 border-line object-cover" />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-line bg-surface">
            <span className="text-2xl font-medium text-muted">{name.charAt(0).toUpperCase()}</span>
          </div>
        )}
        <h2 className="mt-4 font-display text-[22px] font-semibold text-ink">{name}</h2>
        {profile?.is_creator && (
          <p className="mt-1 text-[10px] font-semibold tracking-[0.14em] text-muted">CREATOR</p>
        )}
        {profile?.bio && (
          <p className="mt-3 max-w-xs text-center text-[13px] font-normal leading-relaxed text-muted">{profile.bio}</p>
        )}
      </div>

      {/* Stats — same component as the public creator page */}
      {stats && profile && (
        <div className="px-5">
          <ProfileStats
            stats={stats}
            showReferrals
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
          className="flex flex-1 items-center justify-center gap-2 rounded-card border border-line bg-surface py-3 text-[12px] font-medium tracking-[0.08em] text-ink active:bg-surface"
        >
          <Pencil className="h-3.5 w-3.5" />
          EDIT PROFILE
        </button>
        <button
          onClick={shareProfile}
          className="flex flex-1 items-center justify-center gap-2 rounded-card border border-line bg-surface py-3 text-[12px] font-medium tracking-[0.08em] text-ink active:bg-surface"
        >
          <Share2 className="h-3.5 w-3.5" />
          SHARE PROFILE
        </button>
      </div>

      {/* Posts / Saved */}
      <div className="mt-7 px-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex gap-5">
            {([
              { id: "posts", label: "POSTS" },
              { id: "saved", label: "SAVED" },
            ] as const).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative pb-1 text-[11px] font-semibold tracking-[0.12em] transition-colors ${
                  tab === t.id ? "text-ink" : "text-muted"
                }`}
              >
                {t.label}
                {tab === t.id && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-ink" />}
              </button>
            ))}
          </div>
          {tab === "posts" && profile?.is_creator && (
            <button
              onClick={() => setShowComposer((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-ink"
              aria-label="New post"
            >
              {showComposer ? (
                <X className="h-4 w-4 text-bg" />
              ) : (
                <Plus className="h-4 w-4 text-bg" strokeWidth={2.5} />
              )}
            </button>
          )}
        </div>

        {tab === "posts" && showComposer && profile?.is_creator && (
          <div className="mb-4">
            <PostComposer
              onPosted={async () => {
                setShowComposer(false);
                await loadPosts();
              }}
            />
          </div>
        )}

        {tab === "saved" ? (
          savedPosts.length === 0 ? (
            <div className="flex flex-col items-center rounded-card border border-line px-6 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-ctl border border-line bg-surface">
                <Bookmark className="h-6 w-6 text-muted" />
              </div>
              <p className="mt-4 font-display text-[17px] font-semibold text-ink">Nothing saved yet</p>
              <p className="mt-1.5 text-[12px] font-normal leading-relaxed text-muted">
                Tap the bookmark on a post to keep it here —<br />it becomes your want-to-go list
              </p>
            </div>
          ) : (
            <>
              {savedShops.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 text-[10px] font-semibold tracking-[0.12em] text-muted">
                    PLACES YOU SAVED
                  </p>
                  <div className="overflow-hidden rounded-card border border-line">
                    {savedShops.map((sh, i) => (
                      <button
                        key={sh.shop_slug}
                        onClick={() => router.push(`/customer/shop/${sh.shop_slug}`)}
                        className={`flex w-full items-center gap-3 bg-surface px-4 py-3 text-left active:bg-black/10 ${
                          i > 0 ? "border-t border-line/60" : ""
                        }`}
                      >
                        {sh.logo_url ? (
                          <img src={sh.logo_url} alt="" className="h-10 w-10 shrink-0 rounded-ctl object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ctl border border-line">
                            <span className="text-[14px] font-medium text-muted">
                              {sh.shop_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-medium text-ink truncate">{sh.shop_name}</p>
                          <p className="mt-0.5 text-[11px] font-normal text-muted truncate">
                            {!sh.visited
                              ? "Haven't been yet"
                              : sh.remaining === 0
                              ? "Reward ready to redeem"
                              : `${sh.remaining} more visit${sh.remaining === 1 ? "" : "s"} to your reward`}
                          </p>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <PostGrid posts={savedPosts} />
            </>
          )
        ) : posts.length > 0 ? (
          <PostGrid posts={posts} />
        ) : profile?.is_creator ? (
          <div className="rounded-card border border-line px-5 py-10 text-center">
            <p className="text-[14px] font-medium text-muted">No posts yet</p>
            <p className="mt-1.5 text-[12px] font-normal text-muted">
              Tap + to share your first find
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-card border border-line px-6 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-card border border-line bg-surface">
              <Sparkles className="h-6 w-6 text-muted" />
            </div>
            <p className="mt-4 font-display text-[17px] font-semibold text-ink">Share your local finds</p>
            <p className="mt-1.5 text-[12px] font-normal leading-relaxed text-muted">
              Become a creator to post photos and tips from<br />the places you love — open to everyone
            </p>
            <button
              onClick={becomeCreator}
              disabled={becomingCreator}
              className="mt-6 rounded-full bg-ink px-7 py-3 text-[12px] font-semibold tracking-[0.1em] text-bg disabled:opacity-40"
            >
              {becomingCreator ? "SETTING UP…" : "BECOME A CREATOR"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

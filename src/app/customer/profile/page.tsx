"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, Share2, Pencil, Plus, Sparkles, X, Bookmark, ChevronRight, Camera } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import PostGrid, { type GridPost } from "../components/PostGrid";
import PostComposer from "../components/PostComposer";
import EmptyState from "../components/EmptyState";
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

  // The centre nav button routes here with ?compose=1. Opening the composer
  // straight away is the whole point — the button is the post affordance.
  //
  // Read from window rather than useSearchParams(): this is a client page that
  // Next statically prerenders, and useSearchParams() there requires a Suspense
  // boundary or the build fails outright on /customer/profile. Caught by a
  // preview deploy, which is the only reason it did not reach production.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("compose") === "1") {
      setShowComposer(true);
    }
  }, []);

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
        // Preserve the query string. The centre nav sends signed-out users
        // here as /customer/profile?compose=1, and hardcoding the bare path
        // dropped ?compose=1 across the auth boundary — so someone who tapped
        // Post, signed up, and came back landed on their profile with no
        // composer and no idea what they were meant to do.
        const back = `/customer/profile${window.location.search}`;
        router.replace(`/customer/auth?redirect=${encodeURIComponent(back)}`);
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
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-subtle border-t-ink" />
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
    <div className="flex min-h-full flex-col bg-surface pb-10">
      {/* Top bar — gear opens the full settings screen */}
      <div
        className="flex items-center justify-between px-5 pb-1"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 20px) + 12px)" }}
      >
        <h1 className="font-display text-xl font-semibold tracking-tight text-primary">{name}</h1>
        <button
          onClick={() => router.push("/customer/profile/settings")}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-subtle bg-surface-raised"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4 text-muted" />
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col items-center px-6 pt-4 pb-5">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="h-24 w-24 rounded-full border-2 border-subtle object-cover" />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-subtle bg-surface-raised">
            <span className="text-2xl font-medium text-muted">{name.charAt(0).toUpperCase()}</span>
          </div>
        )}
        <h2 className="font-display text-xl font-semibold tracking-tight text-primary mt-4">{name}</h2>
        {profile?.is_creator && (
          <p className="text-2xs font-semibold uppercase tracking-caps text-muted mt-1">CREATOR</p>
        )}
        {profile?.bio && (
          <p className="text-sm text-secondary mt-3 max-w-xs text-center font-normal leading-relaxed">{profile.bio}</p>
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
          className="text-xs font-semibold uppercase tracking-caps text-primary flex flex-1 items-center justify-center gap-2 rounded-card border border-subtle bg-surface-raised py-3 active:bg-surface-raised"
        >
          <Pencil className="h-3.5 w-3.5" />
          EDIT PROFILE
        </button>
        <button
          onClick={shareProfile}
          className="text-xs font-semibold uppercase tracking-caps text-primary flex flex-1 items-center justify-center gap-2 rounded-card border border-subtle bg-surface-raised py-3 active:bg-surface-raised"
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
                className={`relative pb-1 text-sm font-semibold transition-colors ${
                  tab === t.id ? "text-primary" : "text-muted"
                }`}
              >
                {t.label}
                {tab === t.id && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />}
              </button>
            ))}
          </div>
          {tab === "posts" && profile?.is_creator && (
            <button
              onClick={() => setShowComposer((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary"
              aria-label="New post"
            >
              {showComposer ? (
                <X className="h-4 w-4 text-inverse" />
              ) : (
                <Plus className="h-4 w-4 text-inverse" strokeWidth={2.5} />
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
            <div className="flex flex-col items-center rounded-card border border-subtle px-6 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-ctl border border-subtle bg-surface-raised">
                <Bookmark className="h-6 w-6 text-muted" />
              </div>
              <p className="font-display text-lg font-semibold tracking-tight text-primary mt-4">Nothing saved yet</p>
              <p className="text-xs text-muted mt-1.5 font-normal leading-relaxed">
                Tap the bookmark on a post to keep it here —<br />it becomes your want-to-go list
              </p>
            </div>
          ) : (
            <>
              {savedShops.length > 0 && (
                <div className="mb-4">
                  <p className="text-2xs font-semibold uppercase tracking-caps text-muted mb-2">
                    PLACES YOU SAVED
                  </p>
                  <div className="overflow-hidden rounded-card border border-subtle">
                    {savedShops.map((sh, i) => (
                      <button
                        key={sh.shop_slug}
                        onClick={() => router.push(`/customer/shop/${sh.shop_slug}`)}
                        className={`flex w-full items-center gap-3 bg-surface-raised px-4 py-3 text-left active:bg-black/10 ${
                          i > 0 ? "border-t border-subtle/60" : ""
                        }`}
                      >
                        {sh.logo_url ? (
                          <img src={sh.logo_url} alt="" className="h-10 w-10 shrink-0 rounded-ctl object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ctl border border-subtle">
                            <span className="text-base text-secondary font-medium">
                              {sh.shop_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-base text-primary font-medium truncate">{sh.shop_name}</p>
                          <p className="text-xs text-muted mt-0.5 font-normal truncate">
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
        ) : (
          <EmptyState
            compact
            icon={Camera}
            title="Your first post goes here"
            body="Share somewhere you actually go. The people who follow you will see it first."
            primary={{ label: "Find a place", onClick: () => router.push("/customer/map") }}
          />
        )}
      </div>
    </div>
  );
}

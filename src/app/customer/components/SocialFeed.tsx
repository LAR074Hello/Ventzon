"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Heart, Compass, Sparkles, BadgeCheck, MapPin, Ticket, ChevronRight, Play, Volume2, VolumeX } from "lucide-react";
import FollowButton from "./FollowButton";
import EmptyState from "./EmptyState";
import Avatar from "./Avatar";

type FeedPost = {
  id: string;
  body: string;
  media_url: string | null;
  media_type: "image" | "video" | null;
  created_at: string;
  author: { profile_id: string; display_name: string; avatar_url: string | null; followed: boolean };
  // null for a plain post (no place attached) — the card renders
  // person-first instead of showing a map pin with nothing after it.
  shop: {
    slug: string;
    name: string;
    neighborhood?: string | null;
    logo_url: string | null;
    deal_title: string | null;
    reward_goal: number;
  } | null;
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

/**
 * Inline feed video. Playback is owned by the feed's ONE observer ("one at a
 * time" is a feed-wide rule, not a per-card one) — this card only registers
 * its element on mount and lets the observer play/pause it. Local concerns
 * live here: the unmute control, and the manual-play overlay that appears
 * when autoplay is gated (data saver / reduced motion).
 */
function FeedVideo({
  src,
  poster,
  gated,
  onMount,
  onUnmount,
}: {
  src: string;
  poster?: string;
  /** Autoplay is off for this viewer (reduced motion or data saver). */
  gated: boolean;
  onMount: (el: HTMLVideoElement, entry: { allowAutoplay: boolean }) => void;
  onUnmount: (el: HTMLVideoElement) => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  // Mutable per-card state the parent observer reads (is this one allowed to
  // autoplay?). A ref, not React state: the observer reads it from its own
  // closure and must always see the latest value.
  const entryRef = useRef({ allowAutoplay: false });
  const [unmuted, setUnmuted] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    onMount(el, entryRef.current);
    return () => onUnmount(el);
  }, [onMount, onUnmount]);

  function toggleMute(e: React.MouseEvent) {
    e.stopPropagation();
    const el = ref.current;
    if (!el) return;
    const next = !el.muted;
    el.muted = next;
    setUnmuted(!next);
  }

  function start(e: React.MouseEvent) {
    e.stopPropagation();
    const el = ref.current;
    if (!el) return;
    // The viewer asked for this one explicitly, so it keeps playing like an
    // autoplay card from here on — the data-saver gate is overridden by their
    // tap. (Reduced motion is NOT overridden: that is a preference, not a
    // meter.) Muted start is what iOS permits without a gesture chain.
    entryRef.current.allowAutoplay = true;
    setStarted(true);
    el.muted = true;
    setUnmuted(false);
    el.play().catch(() => {});
  }

  return (
    <div className="relative">
      <video
        ref={ref}
        src={src}
        poster={poster}
        // muted + playsInline are what make iOS autoplay inline — never remove.
        muted
        loop
        playsInline
        preload="metadata"
        className="aspect-[4/5] max-h-[70vh] w-full object-cover"
      />
      {/* Unmute — a visible control, NOT tap-to-unmute: the whole media surface
          still means "open the post", so stealing the tap would hide comments
          and the detail view. */}
      {(!gated || started) && (
        <button
          onClick={toggleMute}
          aria-label={unmuted ? "Mute video" : "Unmute video"}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white active:bg-black/70"
        >
          {unmuted ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </button>
      )}
      {/* Manual play — only when autoplay is gated and this one hasn't started. */}
      {gated && !started && (
        <button
          onClick={start}
          aria-label="Play video"
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50">
            <Play className="ml-0.5 h-5 w-5 text-white" fill="white" />
          </span>
        </button>
      )}
    </div>
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
              {s.kind === "creator" ? (
                <Avatar
                  name={s.display_name}
                  seed={s.profile_id ?? s.display_name}
                  url={s.avatar_url}
                  size={56}
                />
              ) : s.avatar_url ? (
                // A PLACE, not a person: square tile, and no initials-on-tint.
                // Places are identified by their own logo or by the map, never
                // by a colour we assigned them — see the rejected per-shop hues.
                <img src={s.avatar_url} alt="" className="h-14 w-14 rounded-ctl object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-ctl bg-surface-sunken">
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
 * Autoplay policy for feed video — whether this viewer should have videos
 * start at all, and whether reduced motion is a hard rule.
 *
 * Two gates (see the observer comment in SocialFeed):
 *  - prefers-reduced-motion — the codebase's motion-safe discipline.
 *  - data saver — navigator.connection is Chromium-only. Safari and WKWebView
 *    (iOS, the primary platform) never expose it, so the data half of this
 *    gate is a NO-OP there and autoplay simply happens. It helps Android and
 *    the mobile web, nothing more; a real fix is a user-facing autoplay
 *    setting (design-notes 2026-08-19).
 *
 * useSyncExternalStore because the policy must be correct on the very first
 * client render (a gated viewer must never see a video start, even for a
 * frame) AND must not trip a hydration mismatch — the server snapshot is the
 * un-gated default, and the store re-checks on the client.
 */
type VideoPolicy = { gated: boolean; reducedMotion: boolean };

/**
 * The Chromium-only Network Information API, structural — the project's lib
 * types do not ship `NetworkInformation`. Safari and WKWebView never expose
 * `navigator.connection` at all, which is the whole "no-op on iOS" caveat.
 */
type NetworkInfo = {
  saveData?: boolean;
  effectiveType?: string;
  addEventListener?: (type: "change", cb: () => void) => void;
  removeEventListener?: (type: "change", cb: () => void) => void;
};

let cachedVideoPolicy: VideoPolicy | null = null;

function readVideoPolicy(): VideoPolicy {
  if (typeof window === "undefined") return { gated: false, reducedMotion: false };
  const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  const reducedMotion = mq?.matches ?? false;
  const conn = (navigator as Navigator & { connection?: NetworkInfo }).connection;
  const dataGated =
    conn?.saveData === true ||
    (conn?.effectiveType != null && ["slow-2g", "2g", "3g"].includes(conn.effectiveType));
  return { gated: reducedMotion || dataGated, reducedMotion };
}

function subscribeVideoPolicy(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  mq?.addEventListener("change", cb);
  const conn = (navigator as Navigator & { connection?: NetworkInfo }).connection;
  conn?.addEventListener?.("change", cb);
  return () => {
    mq?.removeEventListener("change", cb);
    conn?.removeEventListener?.("change", cb);
  };
}

function useVideoPolicy(): VideoPolicy {
  return useSyncExternalStore(
    subscribeVideoPolicy,
    () => (cachedVideoPolicy ??= readVideoPolicy()),
    () => ({ gated: false, reducedMotion: false })
  );
}

/**
 * The social feed. A post either names a place (business kind — badge,
 * Visit & Earn, NEARBY) or stands alone (community kind — no place). Plain
 * posts lead with the person; place posts always have a one-tap path to a
 * real visit via the Visit & Earn chip.
 * The NEARBY scope (marked by the onBrowseEverywhere CTA) is shown when the
 * device location is granted; without the CTA it is the global EVERYWHERE
 * feed. Actions (like, comment, follow) are the same in either scope.
 */
export default function SocialFeed({
  userLoc,
  onBrowseEverywhere,
}: {
  userLoc: { lat: number; lng: number } | null;
  /** Present = the NEARBY scope (device location granted); absent = EVERYWHERE. */
  /** CTA for the empty state: jump to the EVERYWHERE tab. */
  onBrowseEverywhere?: () => void;
}) {
  const router = useRouter();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const offsetRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  // Video registry + autoplay policy for inline playback (see the observer
  // below). The registry is a ref so like-toggles and page loads never replay
  // a video; the policy is an external store so gated viewers get the play
  // overlay from the first client render.
  const videoEntries = useRef(new Map<HTMLVideoElement, { allowAutoplay: boolean }>());
  const videoPolicy = useVideoPolicy();

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

  // Autoplay policy — decided once per session via useVideoPolicy (below).
  //
  // Two gates:
  //  - prefers-reduced-motion — the codebase's motion-safe discipline: no
  //    motion the user didn't ask for.
  //  - data saver — navigator.connection is Chromium-only. Safari and
  //    WKWebView (i.e. iOS, the primary platform) never expose it, so this
  //    branch is a NO-OP there and autoplay just happens. It helps Android
  //    and mobile web, nothing more; a real fix is a user-facing autoplay
  //    setting (design-notes 2026-08-19).

  // Inline feed video playback. ONE observer owns every video element so
  // "one at a time" is global to the feed, not per card. A video takes over
  // when it is majority-visible (threshold 0.5) and the previous player
  // pauses at the same crossing — scrolling past pauses, scrolling back
  // resumes, and a below-fold video never starts at all.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const entering = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (entering.length > 0) {
          const winner = entering[0].target as HTMLVideoElement;
          const entry = videoEntries.current.get(winner);
          // Reduced motion is never overridden; the data gate is, once the
          // viewer has explicitly started that video.
          const mayPlay =
            !videoPolicy.reducedMotion && (!videoPolicy.gated || entry?.allowAutoplay);
          if (mayPlay) winner.play().catch(() => {});
          for (const [el] of videoEntries.current) {
            if (el !== winner) el.pause();
          }
          return;
        }
        for (const e of entries) {
          if (!e.isIntersecting) (e.target as HTMLVideoElement).pause();
        }
      },
      { threshold: 0.5 }
    );
    for (const [el] of videoEntries.current) io.observe(el);
    return () => io.disconnect();
    // posts: re-observe when a new page lands — the observer only knows the
    // videos that were registered when it was created.
  }, [videoPolicy, posts]);

  const registerVideo = useCallback(
    (el: HTMLVideoElement, entry: { allowAutoplay: boolean }) => {
      videoEntries.current.set(el, entry);
    },
    []
  );
  const unregisterVideo = useCallback((el: HTMLVideoElement) => {
    videoEntries.current.delete(el);
  }, []);

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
    // NEARBY empty is honest, not broken: location granted and nothing
    // nearby yet is a real state, so say so and point at EVERYWHERE.
    if (onBrowseEverywhere) {
      return (
        <div>
          <EmptyState
            icon={Compass}
            eyebrow="Near you"
            title="No nearby posts yet"
            body="Nothing nearby yet — be the first to post, or see what people are sharing everywhere."
            primary={{ label: "See what\u2019s everywhere", onClick: onBrowseEverywhere ?? (() => {}) }}
            secondary={{ label: "Explore the map", onClick: () => router.push("/customer/map") }}
          />
        </div>
      );
    }
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
      {posts.length < 3 && onBrowseEverywhere === undefined && (
        <div className="-mx-5">

          <SuggestionRow userLoc={userLoc} />
        </div>
      )}
      {posts.map((p) => {
        const remaining = p.viewer.progress
          ? Math.max(p.viewer.progress.goal - p.viewer.progress.visits, 0)
          : null;
        const shop = p.shop;
        const goal = shop ? (p.viewer.progress?.goal ?? shop.reward_goal) : 0;
        const visits = p.viewer.progress?.visits ?? 0;
        // True of THIS viewer at THIS place, or not shown at all. Without a
        // merchant there is no reward, and inventing progress toward one is
        // the old product leaking into the new one. A plain post has no shop
        // to measure progress against, so it never shows a loyalty line.
        const showLoyalty =
          Boolean(shop?.slug) &&
          (visits > 0 || Boolean(shop?.deal_title));
        return (
          <div key={p.id}>
            {/* Card header — PLACE FIRST when there is a place.
                The place and the proof lead; the person is the second line.
                This ordering is the product: a photo feed with location tags
                is a different app, and the differentiator is lost by inches if
                the place keeps sliding into the caption.
                A plain post (no place) has nothing to lead with, so the author
                row below IS the header — Instagram-style, person first. */}
            <div className="mb-2.5">
              {shop?.slug && (
                <button
                  onClick={() => router.push(`/place/${shop.slug}`)}
                  className="flex w-full items-start gap-2 text-left"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-lg font-semibold leading-tight text-primary">
                      {shop.name}
                    </span>
                    {shop.neighborhood && (
                      <span className="mt-0.5 block truncate text-xs text-muted">
                        {shop.neighborhood}
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
              )}

              <button
                onClick={() => router.push(`/customer/creator/${p.author.profile_id}`)}
                className="mt-2 flex w-full items-center gap-2 text-left"
              >
                <Avatar
                  name={p.author.display_name}
                  seed={p.author.profile_id}
                  url={p.author.avatar_url}
                  size={24}
                />
                <p className="min-w-0 flex-1 truncate text-xs text-secondary">
                  {p.author.display_name} · {timeAgo(p.created_at)}
                </p>
              </button>
            </div>

            {/* One envelope: media + Visit & Earn footer share the card */}
            <div className="elevation-1 overflow-hidden rounded-card">
              {p.media_url && (
                // A div, not a button: a video with its own controls (mute,
                // play) cannot live inside a <button> — invalid HTML and an
                // ambiguous tap target. Keyboard access is preserved below.
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Open post"
                  onClick={() => router.push(`/customer/post/${p.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/customer/post/${p.id}`);
                    }
                  }}
                  className="block w-full"
                >
                  {p.media_type === "video" ? (
                    // max-h stops a 4:5 frame from eating a short laptop viewport;
                    // object-cover crops rather than letterboxing.
                    <FeedVideo
                      src={p.media_url}
                      poster={p.poster_url ?? undefined}
                      gated={videoPolicy.gated}
                      onMount={registerVideo}
                      onUnmount={unregisterVideo}
                    />
                  ) : (
                    <img src={p.media_url} alt="" loading="lazy" className="aspect-[4/5] max-h-[70vh] w-full object-cover" />
                  )}
                </div>
              )}
              {/* LOYALTY IS A PROPERTY OF THE PLACE, NOT THE POST.
                  It used to render on every card, which meant that with no
                  merchants signed up the first surface a new user sees was
                  showing reward progress at places where no reward exists —
                  the loudest remaining artifact of the old product.
                  It now appears only when it is TRUE of this viewer at this
                  place: they have progress, or the place has a live deal. And
                  it is one line, not a card section, so it stops competing
                  with the post it is attached to. */}
              {showLoyalty && (
                <button
                  onClick={() => router.push(`/customer/shop/${shop!.slug}`)}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left active:bg-surface-sunken"
                >
                  {visits > 0 ? (
                    <span className="flex shrink-0 items-center gap-1">
                      {Array.from({ length: Math.min(goal, 8) }).map((_, i) => (
                        <span
                          key={i}
                          /* Ink, not accent: green is brand and never reports
                             state. A filled ink dot reads as a tally. */
                          className={`h-[7px] w-[7px] rounded-full ${i < visits ? "bg-primary" : "bg-subtle"}`}
                        />
                      ))}
                    </span>
                  ) : (
                    <Ticket className="h-3.5 w-3.5 shrink-0 text-muted" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-xs text-secondary">
                    {remaining === 0
                      ? "Reward ready to redeem"
                      : remaining !== null
                      ? `${remaining} more visit${remaining === 1 ? "" : "s"} to ${shop!.deal_title ?? "your reward"}`
                      : shop!.deal_title}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted" />
                </button>
              )}
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

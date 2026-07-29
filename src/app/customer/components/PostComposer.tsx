"use client";

import { useEffect, useRef, useState } from "react";
import { Send, ImagePlus, X } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { stripImageMetadata } from "@/lib/strip-exif";

/**
 * Shared post composer — used on the public creator page (own profile)
 * and the Profile tab. Uploads media to the `posts` bucket and tags a
 * business so the post can appear in the Explore feed.
 */
export default function PostComposer({
  onPosted,
  defaultShopSlug,
  lockShop = false,
  placeholder = "Share a find, a favorite spot, a tip…",
}: {
  onPosted: () => void | Promise<void>;
  /** Pre-tag a business (used by the post-check-in prompt). */
  defaultShopSlug?: string;
  /** Hide the business picker when the shop is implied by context. */
  lockShop?: boolean;
  placeholder?: string;
}) {
  const [composer, setComposer] = useState("");
  const [posting, setPosting] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [tagShop, setTagShop] = useState(defaultShopSlug ?? "");
  const [myShops, setMyShops] = useState<{ shop_slug: string; shop_name: string }[]>([]);
  const [nearby, setNearby] = useState<{ shop_slug: string; shop_name: string }[]>([]);
  // 'idle' until the user has read why we want location. iOS only ever shows
  // the system prompt ONCE — if they tap "Don't Allow" you cannot re-ask, so
  // the ask has to arrive with context, not out of nowhere.
  const [locState, setLocState] = useState<"idle" | "asking" | "granted" | "unavailable">("idle");
  const [placeQuery, setPlaceQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ shop_slug: string; shop_name: string; sub?: string }[]>([]);
  const mediaRef = useRef<HTMLInputElement>(null);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    fetch("/api/customer/memberships")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.memberships) {
          setMyShops(
            d.memberships.map((m: any) => ({ shop_slug: m.shop_slug, shop_name: m.shop_name }))
          );
        }
      })
      .catch(() => {});
  }, []);

  /**
   * Nearby places, and the nearest one pre-selected.
   *
   * The list used to come only from memberships — shops the user had already
   * joined — so a brand-new user opened the composer to an EMPTY dropdown and
   * could not tag anywhere at all. That made "post one photo of somewhere near
   * you" impossible on the one path we most want to work.
   *
   * Location is optional and never sent anywhere: the fix is computed on the
   * device against the public place list.
   */
  async function requestNearby() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocState("unavailable");
      return;
    }
    setLocState("asking");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch("/api/customer/shops-map");
          if (!res.ok) { setLocState("unavailable"); return; }
          const d = await res.json();
          const { latitude: la, longitude: lo } = pos.coords;
          const withDist = (d.shops ?? [])
            .filter((p: any) => p.latitude != null && p.longitude != null)
            .map((p: any) => {
              const dLat = ((p.latitude - la) * Math.PI) / 180;
              const dLng = ((p.longitude - lo) * Math.PI) / 180;
              const a =
                Math.sin(dLat / 2) ** 2 +
                Math.cos((la * Math.PI) / 180) * Math.cos((p.latitude * Math.PI) / 180) *
                  Math.sin(dLng / 2) ** 2;
              return { ...p, _d: 7917.5 * Math.asin(Math.sqrt(a)) };
            })
            .sort((x: any, y: any) => x._d - y._d)
            .slice(0, 12);

          if (withDist.length === 0) { setLocState("unavailable"); return; }
          setNearby(withDist.map((p: any) => ({ shop_slug: p.slug, shop_name: p.shop_name })));
          setTagShop((cur) => cur || withDist[0].slug);
          setLocState("granted");
        } catch { setLocState("unavailable"); }
      },
      // Denied, or timed out. NOT a dead end — fall through to search.
      () => setLocState("unavailable"),
      { timeout: 8000, maximumAge: 300000 }
    );
  }

  // Name search: the fallback when we cannot or may not use location.
  // Deliberately NOT a geographic guess — showing East Village places to
  // someone in Columbus invites a wrong tag, which is worse than no tag.
  useEffect(() => {
    const q = placeQuery.trim();
    if (q.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/customer/places-search?q=${encodeURIComponent(q)}`);
        if (!r.ok) return;
        const d = await r.json();
        setSearchResults(
          (d.places ?? []).map((p: any) => ({
            shop_slug: p.slug,
            shop_name: p.name,
            sub: [p.neighborhood, p.city].filter(Boolean).join(" · "),
          }))
        );
      } catch {}
    }, 250);
    return () => clearTimeout(t);
  }, [placeQuery]);

  function pickMedia(file: File | null) {
    setMediaFile(file);
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaPreview(file ? URL.createObjectURL(file) : null);
  }

  async function submitPost() {
    const body = composer.trim();
    if ((!body && !mediaFile) || posting) return;
    setPosting(true);
    try {
      let mediaUrl: string | null = null;
      let mediaType: "image" | "video" | null = null;

      if (mediaFile) {
        const { data: { session } } = await supabase.auth.getSession();
        const uid = session?.user?.id;
        if (!uid) throw new Error("Not signed in");
        if (mediaFile.size > 50 * 1024 * 1024) throw new Error("Media must be under 50 MB");
        mediaType = mediaFile.type.startsWith("video/") ? "video" : "image";
        // Strip EXIF/GPS from photos before they leave the device. Videos
        // can't be rewritten client-side — they upload as-is (flagged).
        const uploadFile = mediaType === "image" ? await stripImageMetadata(mediaFile) : mediaFile;
        const ext = uploadFile.name.split(".").pop() || (mediaType === "video" ? "mp4" : "jpg");
        const path = `${uid}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("posts")
          .upload(path, uploadFile, { upsert: true });
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from("posts").getPublicUrl(path);
        mediaUrl = urlData.publicUrl;
      }

      const res = await fetch("/api/customer/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body,
          ...(tagShop ? { shop_slug: tagShop } : {}),
          ...(mediaUrl ? { media_url: mediaUrl, media_type: mediaType } : {}),
        }),
      });
      if (res.ok) {
        setComposer("");
        setTagShop(defaultShopSlug ?? "");
        pickMedia(null);
        await onPosted();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err?.error ?? "Failed to post");
      }
    } catch (e: any) {
      alert(e?.message ?? "Failed to post");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="elevation-1 rounded-card p-4 sm:p-5">
      <textarea
        value={composer}
        onChange={(e) => setComposer(e.target.value)}
        placeholder={placeholder}
        rows={2}
        maxLength={1000}
        className="w-full resize-none bg-transparent text-base text-primary outline-none placeholder:text-muted"
      />

      {mediaPreview && (
        <div className="relative mt-2 overflow-hidden rounded-ctl">
          {mediaFile?.type.startsWith("video/") ? (
            <video src={mediaPreview} muted playsInline className="max-h-48 w-full object-cover" />
          ) : (
            <img src={mediaPreview} alt="" className="max-h-48 w-full object-cover" />
          )}
          <button
            onClick={() => pickMedia(null)}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70"
          >
            <X className="h-3.5 w-3.5 text-white" />
          </button>
        </div>
      )}

      <div className="mt-2 flex items-center gap-2">
        <input
          ref={mediaRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => pickMedia(e.target.files?.[0] ?? null)}
        />
        <button
          onClick={() => mediaRef.current?.click()}
          className="flex h-11 w-11 items-center justify-center rounded-full text-muted"
          style={{ boxShadow: "inset 0 0 0 1px var(--border-subtle)" }}
        >
          <ImagePlus className="h-4 w-4" />
        </button>
        {!lockShop && (
          <div className="w-full">
            {/* A place is REQUIRED. Publish stays disabled until one is chosen,
                because an untagged post cannot appear in the feed at all. */}
            {locState === "idle" && nearby.length === 0 && myShops.length === 0 && (
              <div className="rounded-card px-4 py-3.5" style={{ boxShadow: "inset 0 0 0 1px var(--border-subtle)" }}>
                <p className="text-sm font-medium text-primary">Where are you posting from?</p>
                <p className="mt-1 text-xs leading-relaxed text-secondary">
                  We use your location once, to list the places around you. It is
                  never shared or attached to your post.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={requestNearby}
                    className="rounded-full bg-primary px-4 py-2 text-2xs font-semibold uppercase tracking-caps text-inverse active:opacity-80"
                  >
                    Use my location
                  </button>
                  <button
                    onClick={() => setLocState("unavailable")}
                    className="px-3 py-2 text-2xs font-semibold uppercase tracking-caps text-secondary"
                  >
                    Search instead
                  </button>
                </div>
              </div>
            )}

            {locState === "asking" && (
              <p className="px-1 text-xs text-secondary">Finding places near you…</p>
            )}

            {(nearby.length > 0 || myShops.length > 0) && (
              <select
                value={tagShop}
                onChange={(e) => setTagShop(e.target.value)}
                className="w-full min-w-0 rounded-full bg-surface-sunken px-3.5 py-2.5 text-sm text-secondary outline-none"
                style={{ boxShadow: "inset 0 0 0 1px var(--border-subtle)" }}
              >
                <option value="">Pick a place (required)</option>
                {nearby.length > 0 && (
                  <optgroup label="Near you">
                    {nearby.map((s2) => (
                      <option key={`n-${s2.shop_slug}`} value={s2.shop_slug}>{s2.shop_name}</option>
                    ))}
                  </optgroup>
                )}
                {myShops.length > 0 && (
                  <optgroup label="Places you've joined">
                    {myShops.map((s2) => (
                      <option key={`m-${s2.shop_slug}`} value={s2.shop_slug}>{s2.shop_name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            )}

            {locState === "unavailable" && (
              <div className="mt-2">
                <input
                  value={placeQuery}
                  onChange={(e) => setPlaceQuery(e.target.value)}
                  placeholder="Search for a place by name"
                  className="w-full rounded-full bg-surface-sunken px-3.5 py-2.5 text-sm text-primary outline-none"
                  style={{ boxShadow: "inset 0 0 0 1px var(--border-subtle)" }}
                />
                {searchResults.length > 0 && (
                  <div className="mt-2 max-h-44 overflow-y-auto rounded-card" style={{ boxShadow: "inset 0 0 0 1px var(--border-subtle)" }}>
                    {searchResults.map((r) => (
                      <button
                        key={r.shop_slug}
                        onClick={() => { setTagShop(r.shop_slug); setPlaceQuery(r.shop_name); setSearchResults([]); }}
                        className="flex w-full flex-col items-start px-4 py-2.5 text-left active:bg-surface-raised"
                      >
                        <span className="text-sm text-primary">{r.shop_name}</span>
                        {r.sub && <span className="text-2xs text-muted">{r.sub}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!tagShop && (
              <p className="mt-2 px-1 text-2xs text-muted">
                Pick a place to post — it is what makes this a Ventzon post.
              </p>
            )}
          </div>
        )}

        <button
          onClick={submitPost}
          disabled={(!composer.trim() && !mediaFile) || (!lockShop && !tagShop) || posting}
          className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-inverse disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
          {posting ? "Posting…" : "Post"}
        </button>
      </div>
    </div>
  );
}

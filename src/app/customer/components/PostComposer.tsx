"use client";

import { useEffect, useRef, useState } from "react";
import { Send, ImagePlus, X } from "lucide-react";
import { stripVideoMetadata } from "@/lib/strip-video-metadata";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { stripImageMetadata } from "@/lib/strip-exif";
import { checkMediaLimits } from "@/lib/media-limits";
import { uploadWithProgress, type RunningUpload } from "@/lib/upload-with-progress";

/** Thrown to unwind a deliberate cancel through the same cleanup as a failure. */
class CanceledError extends Error {
  constructor() {
    super("canceled");
    this.name = "CanceledError";
  }
}

type Phase = "idle" | "preparing" | "uploading" | "saving";

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
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const uploadRef = useRef<RunningUpload | null>(null);
  // A ref, not state: the submit path reads this between awaits, and a state
  // value captured in that closure would still be the pre-cancel one.
  const canceledRef = useRef(false);

  /**
   * Cancel means the bytes stop AND nothing is left behind.
   *
   * Aborting the request is only half of it — the server may already have
   * written the object, so the submit path's catch runs `discardUpload` on the
   * path it recorded before the upload began. An orphan in a public bucket is
   * the exact shape of the file that kept leaking coordinates after its post
   * was gone.
   *
   * During "preparing" there is no request yet, so the flag is what stops it:
   * the strip finishes, the next checkpoint sees it, and nothing uploads.
   */
  function cancelUpload() {
    canceledRef.current = true;
    uploadRef.current?.cancel();
  }
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
    // Tracked so a failed post does not strand its upload. The storage write
    // and the row insert are two calls with no transaction between them; when
    // the second fails the file used to stay in a PUBLIC bucket forever,
    // unreachable in the app. Production had exactly that, and one of the
    // stranded files was leaking coordinates.
    let uploadedPath: string | null = null;
    try {
      let mediaUrl: string | null = null;
      let mediaType: "image" | "video" | null = null;

      if (mediaFile) {
        const { data: { session } } = await supabase.auth.getSession();
        const uid = session?.user?.id;
        const accessToken = session?.access_token;
        if (!uid || !accessToken) throw new Error("Not signed in");

        // Caps BEFORE the strip. Reading a 50 MB file into memory to strip
        // metadata from something about to be rejected is pure waiting, and
        // the message names which limit was hit — "too big" when the real
        // problem is length sends someone off to compress a video that will
        // still be too long.
        const limits = await checkMediaLimits(mediaFile);
        if (!limits.ok) throw new Error(limits.reason);

        mediaType = mediaFile.type.startsWith("video/") ? "video" : "image";

        // Strip identifying metadata before anything leaves the device.
        //
        // FAIL CLOSED. If a video cannot be parsed with confidence we reject
        // the post rather than uploading it unstripped. iOS embeds GPS to
        // metre precision and this bucket is public, so a silent pass-through
        // on an unusual file is a privacy leak nobody would ever notice.
        // "Preparing" is its own phase because the strip is not instant on a
        // real iPhone video — reading it into memory dominates. Without a
        // distinct state the progress bar sits at 0% through it and the whole
        // point of adding progress is lost: a frozen "Posting…" becomes a
        // frozen 0%, which reads exactly the same.
        //
        // The yield matters. Setting state and immediately starting the strip
        // means React never gets a frame to paint the new phase, so the user
        // watches nothing change while the main thread is busy.
        setPhase("preparing");
        await new Promise((r) => requestAnimationFrame(() => r(null)));

        let uploadFile: File;
        if (mediaType === "image") {
          uploadFile = await stripImageMetadata(mediaFile);
        } else {
          try {
            uploadFile = await stripVideoMetadata(mediaFile);
          } catch (stripErr: any) {
            throw new Error(
              "We couldn't process this video safely, so it wasn't posted. " +
                "This can happen with unusual formats — try a different clip. " +
                `(${stripErr?.message ?? "unknown"})`
            );
          }
        }
        if (canceledRef.current) throw new CanceledError();

        const ext = uploadFile.name.split(".").pop() || (mediaType === "video" ? "mp4" : "jpg");
        const path = `${uid}/${Date.now()}.${ext}`;

        // The path is recorded BEFORE the upload starts, not after it succeeds.
        // A cancelled or failed PUT can still have created the object, and an
        // orphan in a PUBLIC bucket is exactly how the GPS leak outlived the
        // post it came from.
        uploadedPath = path;
        setPhase("uploading");
        setProgress(0);

        const running = uploadWithProgress({
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
          anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          bucket: "posts",
          path,
          file: uploadFile,
          accessToken,
          onProgress: setProgress,
        });
        uploadRef.current = running;

        const outcome = await running.done;
        uploadRef.current = null;
        if (outcome.ok === false && outcome.canceled) throw new CanceledError();
        if (outcome.ok === false) throw new Error(outcome.error);

        const { data: urlData } = supabase.storage.from("posts").getPublicUrl(path);
        mediaUrl = urlData.publicUrl;
      }

      setPhase("saving");

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
        await discardUpload(uploadedPath);
        uploadedPath = null;
        alert(err?.error ?? "Failed to post");
      }
    } catch (e: any) {
      // Cancel and failure clean up identically — the object may exist either
      // way. The only difference is that a cancel is not an error to report.
      await discardUpload(uploadedPath);
      uploadedPath = null;
      if (!(e instanceof CanceledError)) alert(e?.message ?? "Failed to post");
    } finally {
      setPosting(false);
      setPhase("idle");
      setProgress(0);
      canceledRef.current = false;
      uploadRef.current = null;
    }

    async function discardUpload(path: string | null) {
      if (!path) return;
      try {
        await supabase.storage.from("posts").remove([path]);
      } catch {
        // Best effort. Nothing else to do from here, and surfacing a second
        // error on top of the one the user already saw helps nobody.
      }
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
          {phase === "idle" && (
            <button
              onClick={() => pickMedia(null)}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70"
            >
              <X className="h-3.5 w-3.5 text-white" />
            </button>
          )}
        </div>
      )}

      {/* Upload state, over the media it belongs to.
          "Preparing" is INDETERMINATE and animated with a transform, which the
          compositor keeps running even while the strip occupies the main
          thread. A percentage that cannot move, or a bar driven by JS that is
          blocked, is the frozen-Posting problem wearing a progress bar. */}
      {phase !== "idle" && (
        <div className="mt-2 rounded-ctl bg-surface-sunken px-3 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-secondary">
              {phase === "preparing"
                ? "Preparing…"
                : phase === "uploading"
                ? `Uploading ${Math.round(progress * 100)}%`
                : "Posting…"}
            </span>
            {(phase === "preparing" || phase === "uploading") && (
              <button
                onClick={cancelUpload}
                className="text-xs font-medium text-secondary underline underline-offset-2"
              >
                Cancel
              </button>
            )}
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-border-subtle">
            {phase === "uploading" ? (
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-150 ease-out"
                style={{ width: `${Math.max(2, progress * 100)}%` }}
              />
            ) : (
              <div className="h-full w-1/3 rounded-full bg-accent motion-safe:animate-[composer-indeterminate_1.1s_ease-in-out_infinite]" />
            )}
          </div>
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

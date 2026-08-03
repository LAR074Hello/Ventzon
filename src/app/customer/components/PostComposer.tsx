"use client";

import { useEffect, useRef, useState } from "react";
import { Send, ImagePlus, X } from "lucide-react";
import Avatar from "./Avatar";
import { stripVideoMetadata } from "@/lib/strip-video-metadata";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { stripImageMetadata } from "@/lib/strip-exif";
import { checkMediaLimits } from "@/lib/media-limits";
import { uploadWithProgress, type RunningUpload } from "@/lib/upload-with-progress";
import { capturePosterFrame } from "@/lib/poster-frame";

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
  // Identity, asked for at first contribution rather than at signup.
  const [needsIdentity, setNeedsIdentity] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarRef = useRef<HTMLInputElement>(null);

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

  // Do you have a name yet? Asked here, at the first post, for the same
  // reason the age gate fires at first contribution rather than at launch:
  // at signup it is friction before any value has been delivered.
  useEffect(() => {
    fetch("/api/customer/creator-profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.profile && !d.profile.display_name) setNeedsIdentity(true);
      })
      .catch(() => {});
  }, []);

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
    let posterPathUploaded: string | null = null;
    try {
      // Identity first, so the post this is attached to renders with a name
      // rather than appearing as "Creator" and correcting itself on refresh.
      if (needsIdentity) {
        const chosen = nameInput.trim();
        if (!chosen) throw new Error("Add a name so people know who posted this");

        let newAvatarUrl: string | null = null;
        if (avatarFile) {
          const { data: { session } } = await supabase.auth.getSession();
          const uid = session?.user?.id;
          if (uid) {
            // Public bucket: strip before the write, no exceptions. The rule is
            // about the DESTINATION, not the file type.
            const clean = await stripImageMetadata(avatarFile);
            const ext = clean.name.split(".").pop() || "jpg";
            const path = `${uid}/avatar.${ext}`;
            const { error: upErr } = await supabase.storage
              .from("avatars")
              .upload(path, clean, { upsert: true });
            if (!upErr) {
              newAvatarUrl = `${supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl}?t=${Date.now()}`;
              await supabase.auth.updateUser({ data: { avatar_url: newAvatarUrl } });
            }
          }
        }
        await supabase.auth.updateUser({ data: { full_name: chosen } });
        await fetch("/api/customer/creator-profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            display_name: chosen,
            ...(newAvatarUrl ? { avatar_url: newAvatarUrl } : {}),
          }),
        });
        setNeedsIdentity(false);
      }

      let mediaUrl: string | null = null;
      let posterUrl: string | null = null;
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

        // Poster frame: captured from the ALREADY-STRIPPED file, so it cannot
        // reintroduce the metadata the strip just removed. Best effort by
        // design — a null poster costs a thumbnail, never the post.
        if (mediaType === "video") {
          const poster = await capturePosterFrame(uploadFile);
          if (poster && !canceledRef.current) {
            const posterPath = `${uid}/${Date.now()}-poster.jpg`;
            const { error: posterErr } = await supabase.storage
              .from("posts")
              .upload(posterPath, poster.blob, { upsert: true, contentType: "image/jpeg" });
            if (!posterErr) {
              posterUrl = supabase.storage.from("posts").getPublicUrl(posterPath).data.publicUrl;
              posterPathUploaded = posterPath;
            }
          }
        }
      }

      setPhase("saving");

      const res = await fetch("/api/customer/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body,
          ...(tagShop ? { shop_slug: tagShop } : {}),
          ...(mediaUrl ? { media_url: mediaUrl, media_type: mediaType } : {}),
          ...(posterUrl ? { poster_url: posterUrl } : {}),
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
        await discardUpload(posterPathUploaded);
        uploadedPath = null;
        posterPathUploaded = null;
        alert(err?.error ?? "Failed to post");
      }
    } catch (e: any) {
      // Cancel and failure clean up identically — the object may exist either
      // way. The only difference is that a cancel is not an error to report.
      // The poster goes with it: a poster whose video never became a post is
      // the same orphan in the same public bucket.
      await discardUpload(uploadedPath);
      await discardUpload(posterPathUploaded);
      uploadedPath = null;
      posterPathUploaded = null;
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

      {/* WHO IS POSTING — inline, at the end, as part of finishing the post.
          Not a modal and not a gate in front of the composer: at signup this is
          friction before any value has been delivered, and as a dialog it reads
          as a form to survive rather than as part of writing.
          Eight identical placeholder circles is nearly as anonymous as eight
          accounts called "Creator", so the photo is asked for in the same
          breath — and skipping it still yields a distinct avatar, because the
          fallback is deterministic initials on a tint derived from identity. */}
      {needsIdentity && (
        <div className="mt-3 rounded-ctl bg-surface-sunken p-3.5">
          <p className="text-sm font-medium text-primary">What should people call you?</p>
          <p className="mt-0.5 text-xs text-secondary">
            This is how you&apos;ll appear on your posts.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={() => avatarRef.current?.click()}
              className="relative shrink-0"
              aria-label="Add a photo"
            >
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element -- local blob preview
                <img
                  src={avatarPreview}
                  alt=""
                  className="h-11 w-11 rounded-full object-cover"
                />
              ) : (
                <Avatar name={nameInput || null} seed={nameInput || "new"} size={44} />
              )}
              <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                <ImagePlus className="h-2.5 w-2.5 text-inverse" />
              </span>
            </button>
            <input
              ref={avatarRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setAvatarFile(f);
                if (avatarPreview) URL.revokeObjectURL(avatarPreview);
                setAvatarPreview(f ? URL.createObjectURL(f) : null);
              }}
            />
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value.slice(0, 40))}
              placeholder="Your name"
              className="min-w-0 flex-1 rounded-ctl border border-subtle bg-surface px-3 py-2.5 text-base text-primary outline-none placeholder:text-muted"
            />
          </div>
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
          disabled={
            (!composer.trim() && !mediaFile) ||
            (!lockShop && !tagShop) ||
            // A name is required to publish, but it is asked for INLINE above
            // rather than blocking the composer — you write first, then say
            // who you are, and both go together.
            (needsIdentity && !nameInput.trim()) ||
            posting
          }
          className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-inverse disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
          {posting ? "Posting…" : "Post"}
        </button>
      </div>
    </div>
  );
}

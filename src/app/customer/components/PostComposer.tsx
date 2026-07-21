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
    <div className="rounded-card border border-line bg-surface p-3">
      <textarea
        value={composer}
        onChange={(e) => setComposer(e.target.value)}
        placeholder={placeholder}
        rows={2}
        maxLength={1000}
        className="w-full resize-none bg-transparent text-[14px] font-normal text-ink outline-none placeholder:text-muted"
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
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted"
        >
          <ImagePlus className="h-4 w-4" />
        </button>
        {!lockShop && myShops.length > 0 && (
          <select
            value={tagShop}
            onChange={(e) => setTagShop(e.target.value)}
            className="flex-1 min-w-0 rounded-full border border-line bg-surface px-3 py-2 text-[11px] font-normal text-muted outline-none"
          >
            <option value="">Tag a business (shows in Explore)</option>
            {myShops.map((s) => (
              <option key={s.shop_slug} value={s.shop_slug}>{s.shop_name}</option>
            ))}
          </select>
        )}
        <button
          onClick={submitPost}
          disabled={(!composer.trim() && !mediaFile) || posting}
          className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[11px] font-semibold tracking-[0.1em] text-bg disabled:opacity-40"
        >
          <Send className="h-3 w-3" />
          {posting ? "POSTING…" : "POST"}
        </button>
      </div>
    </div>
  );
}

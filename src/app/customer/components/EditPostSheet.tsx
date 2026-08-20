"use client";

import { safeJson } from "@/lib/safe-json";
import { useEffect, useRef, useState } from "react";
import { X, Search, MapPin, Check } from "lucide-react";

/**
 * Edit a post's caption and place.
 *
 * Deliberately narrow, matching the PATCH endpoint: media is never replaced and
 * the row is updated in place, so likes, comments and created_at all survive.
 * Before this existed the only remedy for a wrong place was deleting the post
 * and throwing away its engagement.
 *
 * THE BADGE RE-EVALUATES, and the copy says so. `getVerifiedVisitSet` derives
 * the verified visit at read time from a check-in near the post's creation, so
 * moving a post to somewhere you never went simply finds no check-in and the
 * badge disappears. That is correct — it is what stops editing being a way to
 * launder a badge onto a place you have never been — but it would be a nasty
 * surprise discovered after saving, so it is stated before.
 */
export default function EditPostSheet({
  postId,
  initialBody,
  initialPlaceName,
  hadVerifiedVisit,
  onClose,
  onSaved,
}: {
  postId: string;
  initialBody: string;
  initialPlaceName: string | null;
  hadVerifiedVisit: boolean;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [body, setBody] = useState(initialBody);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ slug: string; name: string; sub: string }[]>([]);
  const [placeSlug, setPlaceSlug] = useState<string | null>(null);
  const [placeName, setPlaceName] = useState<string | null>(initialPlaceName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bodyRef.current?.focus();
  }, []);

  useEffect(() => {
    const q = query.trim();
    const t = setTimeout(async () => {
      if (q.length < 2) {
        setResults([]);
        return;
      }
      try {
        const r = await fetch(`/api/customer/places-search?q=${encodeURIComponent(q)}`);
        if (!r.ok) return;
        const d = await safeJson(r);
        setResults(
          (d.places ?? []).map((p: { slug: string; name: string; neighborhood?: string; city?: string }) => ({
            slug: p.slug,
            name: p.name,
            sub: [p.neighborhood, p.city].filter(Boolean).join(" · "),
          }))
        );
      } catch {
        /* a failed search is an empty list, not an error state */
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const placeChanged = placeSlug !== null;

  async function save() {
    if (saving) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/customer/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body,
        ...(placeSlug ? { shop_slug: placeSlug } : {}),
      }),
    });
    if (res.ok) {
      await onSaved();
      onClose();
    } else {
      const d = await safeJson(res).catch(() => ({}));
      setError(d?.error ?? "Could not save");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1200] flex flex-col justify-end">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 motion-safe:animate-[scrim-in_var(--dur)_var(--ease)]"
      />

      <div className="relative max-h-[88vh] overflow-y-auto rounded-t-sheet bg-surface pb-[env(safe-area-inset-bottom)] motion-safe:animate-[sheet-up_var(--dur)_var(--ease)]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-subtle bg-surface px-5 py-3.5">
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full">
            <X className="h-4 w-4 text-secondary" />
          </button>
          <p className="font-display text-base font-semibold text-primary">Edit post</p>
          <button
            onClick={save}
            disabled={saving}
            className="text-sm font-medium text-accent disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>

        <div className="px-5 pt-4">
          <textarea
            ref={bodyRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Say something about this place…"
            className="w-full resize-none bg-transparent text-base leading-relaxed text-primary outline-none placeholder:text-muted"
          />
        </div>

        <div className="mt-2 px-5">
          <p className="text-2xs font-semibold uppercase tracking-caps text-muted">Place</p>
          <div className="mt-2 flex items-center gap-2.5 rounded-ctl bg-surface-sunken px-3.5 py-3">
            <MapPin className="h-4 w-4 shrink-0 text-secondary" />
            <p className="min-w-0 flex-1 truncate text-base text-primary">
              {placeName ?? "No place"}
            </p>
            {placeChanged && <Check className="h-4 w-4 shrink-0 text-accent" />}
          </div>

          <div className="mt-2 flex items-center gap-2.5 rounded-ctl border border-subtle px-3.5 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Change place"
              className="w-full bg-transparent text-base text-primary outline-none placeholder:text-muted"
            />
          </div>

          {results.length > 0 && (
            <div className="mt-2 overflow-hidden rounded-ctl border border-subtle">
              {results.slice(0, 6).map((r) => (
                <button
                  key={r.slug}
                  onClick={() => {
                    setPlaceSlug(r.slug);
                    setPlaceName(r.name);
                    setQuery("");
                    setResults([]);
                  }}
                  className="flex w-full items-center gap-3 border-b border-subtle/60 px-3.5 py-3 text-left last:border-b-0 active:bg-surface-sunken"
                >
                  <div className="min-w-0">
                    <p className="truncate text-base text-primary">{r.name}</p>
                    {r.sub && <p className="truncate text-xs text-muted">{r.sub}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Said BEFORE saving, not discovered after. */}
          {placeChanged && hadVerifiedVisit && (
            <p className="mt-3 text-xs leading-relaxed text-secondary">
              This post has a verified visit. Moving it to a place you haven&apos;t
              checked in at will remove that badge — the visit is proof of where
              you were, so it doesn&apos;t travel with the post.
            </p>
          )}

          {error && <p className="mt-3 text-xs text-danger">{error}</p>}
        </div>

        <div className="h-6" />
      </div>
    </div>
  );
}

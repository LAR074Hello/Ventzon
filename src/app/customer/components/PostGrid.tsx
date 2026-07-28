"use client";

import { useRouter } from "next/navigation";
import { Play, AlignLeft, Camera } from "lucide-react";
import EmptyState from "./EmptyState";

export type GridPost = {
  id: string;
  body: string;
  media_url: string | null;
  media_type: "image" | "video" | null;
  created_at: string;
};

/**
 * Shared Instagram-style post grid — used by creator profiles and
 * business profiles alike (one component, per the no-duplicates rule).
 * Thumbnails lazy-load; video posts get a play indicator; text-only
 * posts render the caption as the tile.
 */
export default function PostGrid({ posts }: { posts: GridPost[] }) {
  const router = useRouter();

  if (posts.length === 0) {
    return (
      <EmptyState
        compact
        icon={Camera}
        title="No one's posted here yet"
        body="Be the first. A single photo is enough to start this place off."
      />
    );
  }

  return (
    <div className="grid grid-cols-3 gap-[2px] overflow-hidden rounded-card">
      {posts.map((p) => (
        <button
          key={p.id}
          onClick={() => router.push(`/customer/post/${p.id}`)}
          className="relative aspect-square overflow-hidden rounded-tile bg-surface-raised text-left transition-opacity duration-[var(--dur)] active:opacity-80"
        >
          {p.media_url ? (
            p.media_type === "video" ? (
              <>
                <video
                  src={p.media_url}
                  muted
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60">
                    <Play className="ml-0.5 h-3.5 w-3.5 text-white" fill="white" />
                  </div>
                </div>
              </>
            ) : (
              <img
                src={p.media_url}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            )
          ) : (
            /* Typographic tile. text-2xs is the scale floor and earns it
               here: a third-of-viewport square has ~104px of usable width. */
            <div
              className="flex h-full w-full flex-col justify-between p-2.5"
              style={{ boxShadow: "inset 0 0 0 1px var(--border-subtle)" }}
            >
              <AlignLeft className="h-3.5 w-3.5 text-muted opacity-60" />
              <p className="line-clamp-4 text-2xs leading-snug text-secondary">
                {p.body}
              </p>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

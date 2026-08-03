"use client";

import { useRouter } from "next/navigation";
import { Play, AlignLeft, Camera } from "lucide-react";
import EmptyState from "./EmptyState";

export type GridPost = {
  id: string;
  body: string;
  media_url: string | null;
  media_type: "image" | "video" | null;
  poster_url?: string | null;
  created_at: string;
};

/**
 * Deterministic tile shape, from the post id.
 *
 * We do not store media dimensions, so a true masonry — every tile at its own
 * natural aspect — would mean measuring images after they load and reflowing
 * the whole column under the reader's thumb. A grid that rearranges itself
 * while you are looking at it is worse than a uniform one.
 *
 * So the ratio is assigned from the id instead: stable across renders and
 * across sessions, known before a single byte of image arrives, and varied
 * enough to break the tyranny of the square. The same post is always the same
 * shape, which is what stops it reading as random.
 */
const RATIOS = ["4 / 5", "1 / 1", "3 / 4", "1 / 1", "4 / 5", "5 / 4"];

function ratioFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return RATIOS[h % RATIOS.length];
}

/**
 * Shared post grid — used by creator profiles and place profiles alike (one
 * component, per the no-duplicates rule). Thumbnails lazy-load; video posts get
 * a play indicator; text-only posts render the caption as the tile.
 *
 * Masonry via CSS columns rather than grid: the browser does the packing, there
 * is no measurement pass, and it degrades to a single readable column at narrow
 * widths without a media query.
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
    <div className="columns-2 gap-2 sm:columns-3 [column-fill:balance]">
      {posts.map((p) => (
        <button
          key={p.id}
          onClick={() => router.push(`/customer/post/${p.id}`)}
          // break-inside-avoid keeps a tile from being split across columns,
          // which is the one thing CSS columns will do to media if you let it.
          className="mb-2 block w-full break-inside-avoid overflow-hidden rounded-card bg-surface-raised text-left transition-opacity duration-[var(--dur)] active:opacity-80"
        >
          {p.media_url ? (
            p.media_type === "video" ? (
              <div className="relative" style={{ aspectRatio: ratioFor(p.id) }}>
                <video
                  src={p.media_url}
                  poster={p.poster_url ?? undefined}
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
              </div>
            ) : (
              <img
                src={p.media_url}
                alt=""
                loading="lazy"
                style={{ aspectRatio: ratioFor(p.id) }}
                className="w-full object-cover"
              />
            )
          ) : (
            /* Typographic tile. Two columns instead of three gives real width,
               so the caption can be read rather than merely indicated — it stops
               being a placeholder for a missing photo. And NO forced ratio: A text tile stretched to a photo's shape
               a text tile stretched to a photo's shape leaves a dead gap above
               the words, and letting the caption size its own tile is what makes
               the column read as masonry rather than a grid with holes. */
            <div className="flex flex-col gap-2 p-3.5">
              <AlignLeft className="h-4 w-4 text-muted opacity-60" />
              <p className="line-clamp-6 text-sm leading-snug text-secondary">
                {p.body}
              </p>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

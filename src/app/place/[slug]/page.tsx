import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

/* ═══════════════════════════════════════════════════════════════════
   /place/[slug] — public share page for a place.

   Renders fully for UNCLAIMED places. That is the whole point of making
   places first-class: a place exists whether or not a merchant has claimed
   it, so a city can be populated before anyone subscribes.

   An empty place is a recruitment surface, not a deficiency to hide — a
   sparse map is worse than a full map of quiet places. So a place with no
   posts reads as an invitation rather than as a blank.

   LOGGED OUT, SO NO VIEWER and no block filtering. Hidden posts are
   excluded here directly.
   PRE-LAUNCH: exclude banned authors once that flag exists.

   noindex until moderation is real.
   ═══════════════════════════════════════════════════════════════════ */

export const dynamic = "force-dynamic";

function admin() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

async function getPlace(slug: string) {
  const db = admin();
  const { data: place } = await db
    .from("places")
    .select("id, slug, name, address, neighborhood, city, category, verification_tier, claimed_by")
    .eq("slug", slug)
    .maybeSingle();
  if (!place) return null;

  const { data: posts } = await db
    .from("posts")
    .select("id, body, media_url, media_type, created_at, author_email")
    .eq("place_id", place.id)
    .eq("hidden", false)
    .order("created_at", { ascending: false })
    .limit(12);

  return { place, posts: posts ?? [] };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const found = await getPlace(slug);
  if (!found) return { title: "Place — Ventzon", robots: { index: false, follow: false } };

  const { place, posts } = found;
  const where = [place.neighborhood, place.city].filter(Boolean).join(", ");
  const title = `${place.name}${where ? ` — ${where}` : ""} · Ventzon`;
  const description =
    posts.length > 0
      ? `${posts.length} post${posts.length === 1 ? "" : "s"} from ${place.name}.`
      : `No one has posted from ${place.name} yet. Be the first.`;

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: "website",
      ...(posts.find((p) => p.media_url) ? { images: [{ url: posts.find((p) => p.media_url)!.media_url! }] } : {}),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function PlaceSharePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = await getPlace(slug);
  if (!found) notFound();

  const { place, posts } = found;
  const where = [place.neighborhood, place.city].filter(Boolean).join(" · ");
  // The badge renders ONLY at subscribed — claimed alone shows nothing.
  const showsBadge = place.verification_tier === "subscribed";
  const unclaimed = place.verification_tier === "unclaimed";

  return (
    <main className="min-h-dvh bg-surface">
      <header className="flex items-center justify-between px-5 py-4">
        <span className="font-display text-lg font-semibold tracking-tight text-primary">Ventzon</span>
        <Link
          href="/customer/explore"
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-on-accent"
        >
          Open app
        </Link>
      </header>

      <div className="mx-auto max-w-xl px-5 pb-16">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-primary">
          {place.name}
        </h1>
        <p className="mt-1 text-sm text-secondary">
          {[place.category, where].filter(Boolean).join(" · ") || "A place in the city"}
        </p>
        {showsBadge && (
          <span className="mt-2 inline-flex rounded-full bg-surface-sunken px-2.5 py-1 text-2xs font-semibold uppercase tracking-caps text-primary">
            Verified business
          </span>
        )}
        {place.address && <p className="mt-3 text-sm text-muted">{place.address}</p>}

        {posts.length === 0 ? (
          /* The invitation, not an apology. 800 quiet places are 800
             recruitment surfaces. */
          <div className="elevation-1 mt-8 rounded-card p-6 text-center">
            <p className="font-display text-lg font-semibold tracking-tight text-primary">
              No one&rsquo;s posted here yet
            </p>
            <p className="mt-2 text-base leading-relaxed text-secondary">
              Be the first. Check in, share what it&rsquo;s like, and this page
              becomes yours to fill.
            </p>
            <Link
              href="/customer/explore"
              className="mt-5 inline-block rounded-ctl bg-accent px-6 py-3 text-sm font-medium text-on-accent"
            >
              Be the first
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-3 gap-[2px] overflow-hidden rounded-card">
            {posts.map((p) => (
              <Link
                key={p.id}
                href={`/p/${p.id}`}
                className="media-frame relative aspect-square overflow-hidden rounded-tile bg-surface-sunken"
              >
                {p.media_url ? (
                  <img src={p.media_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <p className="line-clamp-4 p-2.5 text-2xs leading-snug text-secondary">{p.body}</p>
                )}
              </Link>
            ))}
          </div>
        )}

        {unclaimed && (
          <p className="mt-8 text-center text-sm text-muted">
            Own this place?{" "}
            <span className="font-medium text-primary">Claim it</span> {/* PRE-LAUNCH: links to the claim flow in Slice 1.5 */}
          </p>
        )}
      </div>
    </main>
  );
}

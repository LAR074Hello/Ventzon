import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

/* ═══════════════════════════════════════════════════════════════════
   /p/[id] — public share page for a single post.

   This is the growth loop that actually operates during an invited beta:
   someone posts, sends a link, the recipient lands on something real. It
   exists even though public Explore (2.5) is deferred.

   LOGGED OUT, SO THERE IS NO VIEWER — which means no block filtering is
   possible here. A share link is a moderation bypass if we are careless,
   so this route must exclude hidden content on its own. Reported posts are
   hidden pending review and therefore drop out automatically.

   PRE-LAUNCH: also exclude posts by banned authors once the ban flag lands
   with the safety slice. Right now no such flag exists.

   noindex until moderation is real — we are an invited beta and there is
   no reason to be crawlable yet.
   ═══════════════════════════════════════════════════════════════════ */

export const dynamic = "force-dynamic";

function admin() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

async function getPost(id: string) {
  // Reads run with the service role: places has RLS enabled with no anon
  // policy, so this cannot be done from a browser client.
  const db = admin();
  const { data: post } = await db
    .from("posts")
    .select("id, body, media_url, media_type, created_at, author_email, shop_slug, place_id, hidden")
    .eq("id", id)
    .eq("hidden", false)
    .maybeSingle();
  if (!post) return null;

  const [{ data: author }, { data: place }] = await Promise.all([
    db.from("customer_profiles").select("display_name, avatar_url, is_creator").eq("email", post.author_email).maybeSingle(),
    post.place_id
      ? db.from("places").select("slug, name, neighborhood, city, verification_tier").eq("id", post.place_id).maybeSingle()
      : db.from("places").select("slug, name, neighborhood, city, verification_tier").eq("slug", post.shop_slug ?? "").maybeSingle(),
  ]);

  return { post, author, place };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const found = await getPost(id);
  if (!found) return { title: "Post — Ventzon", robots: { index: false, follow: false } };

  const { post, author, place } = found;
  const who = author?.display_name ?? "Someone";
  const where = place?.name ? ` at ${place.name}` : "";
  const title = `${who}${where} — Ventzon`;
  const description = post.body?.slice(0, 160) || `A place worth being${where}.`;

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: "article",
      ...(post.media_url ? { images: [{ url: post.media_url }] } : {}),
    },
    twitter: {
      card: post.media_url ? "summary_large_image" : "summary",
      title,
      description,
    },
  };
}

export default async function PostSharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = await getPost(id);
  if (!found) notFound();

  const { post, author, place } = found;
  const who = author?.display_name ?? "Someone";

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

      <article className="mx-auto max-w-xl px-5 pb-16">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-sunken">
            <span className="text-base font-medium text-secondary">{who.charAt(0).toUpperCase()}</span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-primary">{who}</p>
            {place && (
              <p className="truncate text-xs text-muted">
                at {place.name}
                {place.neighborhood ? ` · ${place.neighborhood}` : ""}
              </p>
            )}
          </div>
        </div>

        {post.media_url && (
          <div className="media-frame mt-4 overflow-hidden rounded-card">
            {post.media_type === "video" ? (
              <video src={post.media_url} controls playsInline className="w-full" />
            ) : (
              <img src={post.media_url} alt="" className="w-full" />
            )}
          </div>
        )}

        {post.body && <p className="mt-4 text-base leading-relaxed text-primary">{post.body}</p>}

        {place && (
          <Link
            href={`/place/${place.slug}`}
            className="elevation-1 mt-6 flex flex-col gap-3 rounded-card p-4"
          >
            <div className="min-w-0">
              <p className="truncate text-base font-medium text-primary">{place.name}</p>
              <p className="mt-0.5 text-xs text-muted">
                {[place.neighborhood, place.city].filter(Boolean).join(" · ") || "See this place"}
              </p>
            </div>
            <span className="block w-full rounded-ctl bg-accent py-2.5 text-center text-sm font-medium text-on-accent">
              See this place
            </span>
          </Link>
        )}
      </article>
    </main>
  );
}

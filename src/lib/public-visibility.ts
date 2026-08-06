/**
 * What a LOGGED-OUT visitor is allowed to see.
 *
 * Share pages have no viewer, so no block filtering is possible there. That
 * makes them the one surface where moderation state has to be enforced by
 * the query itself. Both /p/[id] and /place/[slug] route through here so the
 * rules live in one place rather than being duplicated per page.
 *
 * ─────────────────────────────────────────────────────────────────────
 * BANNED AUTHORS ARE A SAFETY-SLICE DEPENDENCY, NOT A LAUNCH CONCERN.
 *
 * `ban` ships with the report queue, which is in beta scope. If the ban
 * action lands without this filter, there is a window where a moderator
 * bans someone and their content stays publicly reachable by share link —
 * the moderator believes it is gone and it is not.
 *
 * So this is not a comment to remember. `npm run verify:dev` asserts that
 * the moment a ban column exists on customer_profiles, BANNED_COLUMN below
 * is set and applied. The check FAILS until it is. See scripts/verify-dev.mjs.
 * ─────────────────────────────────────────────────────────────────────
 */
import type { SupabaseClient } from "@supabase/supabase-js";

type Admin = SupabaseClient;

/**
 * Set to the ban column name once the safety migration lands, and add it to
 * the filters below. verify:dev fails while the column exists and this is null.
 */
export const BANNED_COLUMN: string | null = "banned_at";

export const PUBLIC_POST_COLUMNS =
  "id, body, media_url, media_type, created_at, author_email, shop_slug, place_id";
const PUBLIC_POST_COLUMNS_WITH_HIDDEN =
  "id, body, media_url, media_type, created_at, author_email, shop_slug, place_id, hidden";

/** Emails that must not appear on any logged-out surface. */
export async function publiclyExcludedAuthors(admin: Admin): Promise<Set<string>> {
  const excluded = new Set<string>();
  if (!BANNED_COLUMN) return excluded;

  // Reached only once banning exists; keeps the shape ready so wiring it is
  // a one-line change rather than a new query in two page files.
  // The ban column is filtered on, not selected — a template-literal select
  // defeats supabase-js's typed parser and forces an unsafe cast.
  try {
    const { data } = await admin
      .from("customer_profiles")
      .select("email")
      .not(BANNED_COLUMN, "is", null);
    for (const row of data ?? []) excluded.add(row.email as string);
  } catch (e) {
    // Column may not exist yet if the safety migration has not landed on this
    // project — fail open (nobody banned) but say so loudly.
    console.error("[public-visibility] ban column unavailable — run the safety migration", e);
  }
  return excluded;
}

/** A single post, or null when it is not publicly visible. */
export async function getPublicPost(admin: Admin, id: string) {
  const { data: post } = await admin
    .from("posts")
    .select(PUBLIC_POST_COLUMNS_WITH_HIDDEN)
    .eq("id", id)
    .eq("hidden", false) // reported content is hidden pending review
    .maybeSingle();
  if (!post) return null;

  const excluded = await publiclyExcludedAuthors(admin);
  if (excluded.has(post.author_email)) return null;
  return post;
}

/** Publicly visible posts for a place, newest first. */
export async function getPublicPostsForPlace(admin: Admin, placeId: string, limit = 12) {
  const { data } = await admin
    .from("posts")
    .select(PUBLIC_POST_COLUMNS)
    .eq("place_id", placeId)
    .eq("hidden", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  const excluded = await publiclyExcludedAuthors(admin);
  return (data ?? []).filter((p) => !excluded.has(p.author_email));
}

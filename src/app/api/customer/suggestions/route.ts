import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { haversineMiles } from "@/lib/geo";
import { getBlockedSet } from "@/lib/social";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

// GET /api/customer/suggestions[?lat=&lng=]
//
// "Suggested for you" for a sparse Explore feed: creators the viewer
// doesn't follow (ranked by recent posting activity) and shops they
// don't follow (ranked by proximity when coordinates are shared,
// popularity otherwise). Works signed out — follows just start empty.
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const lat = parseFloat(url.searchParams.get("lat") ?? "");
    const lng = parseFloat(url.searchParams.get("lng") ?? "");
    const hasLoc = Number.isFinite(lat) && Number.isFinite(lng);

    const admin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let viewerEmail: string | null = null;
    try {
      const supabaseAuth = await createSupabaseServerClient();
      const { data: { user } } = await supabaseAuth.auth.getUser();
      viewerEmail = user?.email?.toLowerCase() ?? null;
    } catch {}

    const followedCreators = new Set<string>();
    const followedShops = new Set<string>();
    if (viewerEmail) {
      const [{ data: uf }, { data: sf }] = await Promise.all([
        admin.from("user_follows").select("followee_email").eq("follower_email", viewerEmail),
        admin.from("customer_follows").select("shop_slug").eq("email", viewerEmail),
      ]);
      for (const r of uf ?? []) followedCreators.add(r.followee_email);
      for (const r of sf ?? []) followedShops.add(r.shop_slug);
    }

    // ── Creators, ranked by recent posting activity ──────────────
    const { data: creators } = await admin
      .from("customer_profiles")
      .select("id, email, display_name, avatar_url, bio")
      .eq("is_creator", true)
      .limit(200);

    const blocked = await getBlockedSet(admin, viewerEmail);
    const candidates = (creators ?? []).filter(
      (c) => c.email !== viewerEmail && !followedCreators.has(c.email) && !blocked.has(c.email)
    );

    const since = new Date(Date.now() - 30 * DAY_MS).toISOString();
    const { data: recentPosts } = candidates.length
      ? await admin
          .from("posts")
          .select("author_email")
          .in("author_email", candidates.map((c) => c.email))
          .gte("created_at", since)
      : { data: [] };
    const activity: Record<string, number> = {};
    for (const p of recentPosts ?? []) {
      activity[p.author_email] = (activity[p.author_email] ?? 0) + 1;
    }

    const creatorSuggestions = candidates
      .map((c) => ({
        kind: "creator" as const,
        profile_id: c.id,
        display_name: c.display_name ?? "Creator",
        avatar_url: c.avatar_url,
        sub: c.bio ? String(c.bio).slice(0, 60) : "Local creator",
        _score: activity[c.email] ?? 0,
      }))
      .sort((a, b) => b._score - a._score)
      .slice(0, 5);

    // ── Shops, ranked by proximity (or recency without location) ──
    const { data: shopRows } = await admin
      .from("shops")
      .select("slug, logo_url, latitude, longitude, created_at, shop_settings(shop_name, deal_title)")
      .limit(200);

    const shopSuggestions = (shopRows ?? [])
      .map((row: any) => {
        const s = Array.isArray(row.shop_settings) ? row.shop_settings[0] : row.shop_settings;
        return { row, settings: s };
      })
      .filter(
        ({ row, settings }) =>
          settings?.shop_name && settings?.deal_title && !followedShops.has(row.slug)
      )
      .map(({ row, settings }) => {
        const dist =
          hasLoc && row.latitude != null && row.longitude != null
            ? haversineMiles(lat, lng, row.latitude, row.longitude)
            : null;
        // With location: nearest first, coordless shops after. Without:
        // newest first.
        const score =
          dist != null
            ? 1000 - dist
            : hasLoc
            ? 0
            : new Date(row.created_at).getTime() / 1e12;
        return {
          kind: "shop" as const,
          shop_slug: row.slug,
          display_name: settings.shop_name,
          avatar_url: row.logo_url,
          sub: settings.deal_title,
          distance_mi: dist,
          _score: score,
        };
      })
      .sort((a, b) => b._score - a._score)
      .slice(0, 5);

    // Interleave creators and shops so neither dominates the row.
    const merged: any[] = [];
    for (let i = 0; i < 5; i++) {
      if (creatorSuggestions[i]) merged.push(creatorSuggestions[i]);
      if (shopSuggestions[i]) merged.push(shopSuggestions[i]);
    }
    const suggestions = merged.slice(0, 8).map(({ _score, ...rest }) => rest);

    return NextResponse.json({ suggestions });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

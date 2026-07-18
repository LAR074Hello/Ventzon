import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { haversineMiles } from "@/lib/geo";

export const dynamic = "force-dynamic";

// A city-wide open community feed (post_kind = 'community', posts with no
// linked business) is deliberately NOT enabled. It stays off until there
// is sufficient local density and a moderation/reporting system, neither
// of which exists yet. Do not flip this without both.
const COMMUNITY_FEED_ENABLED = false;

// GET /api/customer/feed[?shop_slug=…][&lat=…&lng=…]
//
// The single source for post feeds — the Explore social feed, and (via
// ?shop_slug=) the post grid on a business profile. Only business-tied
// posts by public creators appear. Sorting blends recency, whether the
// viewer follows the author or the shop, and proximity when the client
// shares coordinates. Works signed-out (pure recency).
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const shopFilter = url.searchParams.get("shop_slug")?.toLowerCase().trim() || null;
    const lat = parseFloat(url.searchParams.get("lat") ?? "");
    const lng = parseFloat(url.searchParams.get("lng") ?? "");
    const hasLoc = Number.isFinite(lat) && Number.isFinite(lng);

    const admin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Viewer context is optional — the feed also works signed out.
    let viewerEmail: string | null = null;
    try {
      const supabaseAuth = await createSupabaseServerClient();
      const { data: { user } } = await supabaseAuth.auth.getUser();
      viewerEmail = user?.email?.toLowerCase() ?? null;
    } catch {}

    let query = admin
      .from("posts")
      .select("id, author_email, shop_slug, body, media_url, media_type, created_at")
      .eq("post_kind", "business")
      .not("shop_slug", "is", null)
      .order("created_at", { ascending: false })
      .limit(60);
    if (shopFilter) query = query.eq("shop_slug", shopFilter);
    if (COMMUNITY_FEED_ENABLED) {
      // Intentionally unreachable — see the constant above.
    }

    const { data: rawPosts, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const postRows = rawPosts ?? [];
    if (postRows.length === 0) return NextResponse.json({ posts: [] });

    // Authors must be public creators — a profile that turned the creator
    // toggle off disappears from public feeds.
    const authorEmails = [...new Set(postRows.map((p) => p.author_email))];
    const { data: authorProfiles } = await admin
      .from("customer_profiles")
      .select("id, email, display_name, avatar_url, is_creator")
      .in("email", authorEmails)
      .eq("is_creator", true);
    const authorByEmail: Record<string, any> = {};
    for (const a of authorProfiles ?? []) authorByEmail[a.email] = a;

    const posts = postRows.filter((p) => authorByEmail[p.author_email]);
    if (posts.length === 0) return NextResponse.json({ posts: [] });
    const postIds = posts.map((p) => p.id);
    const shopSlugs = [...new Set(posts.map((p) => p.shop_slug))] as string[];

    const [
      { data: settings },
      { data: shopRows },
      { data: likeRows },
      { data: commentRows },
    ] = await Promise.all([
      admin
        .from("shop_settings")
        .select("shop_slug, shop_name, deal_title, reward_goal")
        .in("shop_slug", shopSlugs),
      admin
        .from("shops")
        .select("slug, logo_url, latitude, longitude")
        .in("slug", shopSlugs),
      admin.from("post_likes").select("post_id, email").in("post_id", postIds),
      admin.from("post_comments").select("post_id").in("post_id", postIds),
    ]);

    const settingsMap: Record<string, any> = {};
    for (const s of settings ?? []) settingsMap[s.shop_slug] = s;
    const shopMap: Record<string, any> = {};
    for (const s of shopRows ?? []) shopMap[s.slug] = s;

    const likeCounts: Record<string, number> = {};
    const viewerLiked = new Set<string>();
    for (const l of likeRows ?? []) {
      likeCounts[l.post_id] = (likeCounts[l.post_id] ?? 0) + 1;
      if (viewerEmail && l.email === viewerEmail) viewerLiked.add(l.post_id);
    }
    const commentCounts: Record<string, number> = {};
    for (const c of commentRows ?? []) {
      commentCounts[c.post_id] = (commentCounts[c.post_id] ?? 0) + 1;
    }

    // Viewer personalization: followed creators, followed shops, progress.
    const followedAuthors = new Set<string>();
    const followedShops = new Set<string>();
    const progressMap: Record<string, { visits: number; goal: number }> = {};
    if (viewerEmail) {
      const [{ data: uf }, { data: sf }, { data: memberships }] = await Promise.all([
        admin.from("user_follows").select("followee_email").eq("follower_email", viewerEmail),
        admin.from("customer_follows").select("shop_slug").eq("email", viewerEmail),
        admin.from("customers").select("shop_slug, visits").eq("email", viewerEmail),
      ]);
      for (const f of uf ?? []) followedAuthors.add(f.followee_email);
      for (const f of sf ?? []) followedShops.add(f.shop_slug);
      for (const m of memberships ?? []) {
        progressMap[m.shop_slug] = {
          visits: m.visits ?? 0,
          goal: settingsMap[m.shop_slug]?.reward_goal ?? 5,
        };
      }
    }

    const now = Date.now();
    const enriched = posts.map((p) => {
      const author = authorByEmail[p.author_email];
      const setting = settingsMap[p.shop_slug!];
      const shop = shopMap[p.shop_slug!];
      const ageHours = (now - new Date(p.created_at).getTime()) / 3600000;

      let score = -ageHours;
      if (followedAuthors.has(p.author_email)) score += 72;
      if (followedShops.has(p.shop_slug!)) score += 24;
      if (hasLoc && shop?.latitude != null && shop?.longitude != null) {
        const dist = haversineMiles(lat, lng, shop.latitude, shop.longitude);
        score += Math.max(0, 24 - dist);
      }

      return {
        id: p.id,
        body: p.body,
        media_url: p.media_url,
        media_type: p.media_type,
        created_at: p.created_at,
        author: {
          profile_id: author.id,
          display_name: author.display_name ?? "Creator",
          avatar_url: author.avatar_url,
          followed: followedAuthors.has(p.author_email),
        },
        shop: {
          slug: p.shop_slug,
          name: setting?.shop_name ?? p.shop_slug,
          logo_url: shop?.logo_url ?? null,
          deal_title: setting?.deal_title ?? null,
          reward_goal: setting?.reward_goal ?? 5,
        },
        counts: {
          likes: likeCounts[p.id] ?? 0,
          comments: commentCounts[p.id] ?? 0,
        },
        viewer: {
          liked: viewerLiked.has(p.id),
          progress: progressMap[p.shop_slug!] ?? null,
        },
        _score: score,
      };
    });

    // Shop grids keep pure recency; the social feed uses the blend.
    if (!shopFilter) enriched.sort((a, b) => b._score - a._score);
    const result = enriched.map(({ _score, ...rest }) => rest);

    return NextResponse.json({ posts: result });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

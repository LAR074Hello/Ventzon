import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { haversineMiles } from "@/lib/geo";

export const dynamic = "force-dynamic";

/**
 * GET /api/customer/explore[?lat=&lng=][&limit=]
 *
 * PLACES ARE THE SUBJECT. This used to start from `shop_settings` filtered to
 * rows with a non-empty `deal_title` — that is, only merchants running a live
 * offer. With no merchants signed up that made Explore a near-empty list of
 * deals, on a tab whose entire job is discovering somewhere to go. It was the
 * same artifact as the loyalty footer, scaled up to a whole surface.
 *
 * Now it reads `places`, which is 3,600+ real locations on day one. A reward is
 * an ENRICHMENT on a place that happens to have one, exactly as in the feed
 * card — never the reason a place is allowed to appear.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const lat = parseFloat(url.searchParams.get("lat") ?? "");
    const lng = parseFloat(url.searchParams.get("lng") ?? "");
    const hasLoc = Number.isFinite(lat) && Number.isFinite(lng);
    const limit = Math.min(120, Math.max(10, parseInt(url.searchParams.get("limit") ?? "60", 10) || 60));

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Over-fetch when sorting by distance: the nearest 60 cannot be found by
    // taking any 60 and sorting them. Bounded so this never becomes a scan of
    // every imported place.
    const fetchCount = hasLoc ? Math.min(1000, limit * 8) : limit * 3;

    /**
     * WITHOUT LOCATION, ORDER IS THE WHOLE PROBLEM.
     *
     * 3,300 imported places have no inherent ranking, so a plain query returns
     * the alphabetical head of the import — "#1 Fine Chinese Cuisine", "$1.50
     * Pizza" — which reads as broken rather than as discovery.
     *
     * So the first screen leads with places someone has actually posted about.
     * That is on-vision rather than merely prettier: the product's claim is
     * that a place is worth visiting because a real person went, and an Explore
     * tab sorted alphabetically makes exactly the opposite argument.
     */
    const seedIds: string[] = [];
    const seedSlugs: string[] = [];
    if (!hasLoc) {
      const { data: active } = await supabase
        .from("posts")
        .select("place_id, shop_slug")
        .eq("hidden", false)
        .order("created_at", { ascending: false })
        .limit(500);
      for (const a of active ?? []) {
        if (a.place_id && !seedIds.includes(a.place_id)) seedIds.push(a.place_id);
        else if (a.shop_slug && !seedSlugs.includes(a.shop_slug)) seedSlugs.push(a.shop_slug);
      }
    }

    const PLACE_COLS =
      "id, slug, name, neighborhood, city, category, latitude, longitude, photos, verification_tier";

    const [{ data: livePlaces }, { data: restPlaces, error }] = await Promise.all([
      seedIds.length || seedSlugs.length
        ? supabase
            .from("places")
            .select(PLACE_COLS)
            .or(
              [
                seedIds.length ? `id.in.(${seedIds.slice(0, 100).join(",")})` : "",
                seedSlugs.length ? `slug.in.(${seedSlugs.slice(0, 100).join(",")})` : "",
              ]
                .filter(Boolean)
                .join(",")
            )
            .limit(120)
        : Promise.resolve({ data: [] as Record<string, unknown>[] }),
      supabase
        .from("places")
        .select(PLACE_COLS)
        .not("name", "is", null)
        .neq("name", "")
        .order("slug", { ascending: true })
        .limit(fetchCount),
    ]);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const seen = new Set<string>();
    const placeRows = [...(livePlaces ?? []), ...(restPlaces ?? [])].filter((p) => {
      const row = p as { slug: string };
      if (seen.has(row.slug)) return false;
      seen.add(row.slug);
      return true;
    }) as {
      id: string;
      slug: string;
      name: string;
      neighborhood: string | null;
      city: string | null;
      category: string | null;
      latitude: number | null;
      longitude: number | null;
      photos: unknown;
      verification_tier: string | null;
    }[];

    const slugs = (placeRows ?? []).map((p) => p.slug);

    // Rewards and logos, where a merchant account exists. Absent for the vast
    // majority, which is the normal case rather than missing data.
    const [{ data: settings }, { data: shopRows }, { data: postRows }] = await Promise.all([
      slugs.length
        ? supabase
            .from("shop_settings")
            .select("shop_slug, deal_title, deal_details, reward_goal")
            .in("shop_slug", slugs)
        : Promise.resolve({ data: [] as { shop_slug: string; deal_title: string | null; deal_details: string | null; reward_goal: number | null }[] }),
      slugs.length
        ? supabase.from("shops").select("slug, logo_url, created_at").in("slug", slugs)
        : Promise.resolve({ data: [] as { slug: string; logo_url: string | null; created_at: string | null }[] }),
      // Activity, so a place people actually post about can outrank a silent
      // one. Bounded; a rough count is enough to rank with.
      slugs.length
        ? supabase
            .from("posts")
            .select("shop_slug, place_id")
            .eq("hidden", false)
            .limit(5000)
        : Promise.resolve({ data: [] as { shop_slug: string | null; place_id: string | null }[] }),
    ]);

    const settingsMap = new Map((settings ?? []).map((s) => [s.shop_slug, s]));
    const shopMap = new Map((shopRows ?? []).map((s) => [s.slug, s]));

    const postCountByPlaceId = new Map<string, number>();
    const postCountBySlug = new Map<string, number>();
    for (const p of postRows ?? []) {
      if (p.place_id) postCountByPlaceId.set(p.place_id, (postCountByPlaceId.get(p.place_id) ?? 0) + 1);
      else if (p.shop_slug) postCountBySlug.set(p.shop_slug, (postCountBySlug.get(p.shop_slug) ?? 0) + 1);
    }

    const places = (placeRows ?? []).map((p) => {
      const setting = settingsMap.get(p.slug);
      const photos = Array.isArray(p.photos) ? (p.photos as string[]) : [];
      const postCount =
        (postCountByPlaceId.get(p.id) ?? 0) + (postCountBySlug.get(p.slug) ?? 0);
      const distance_mi =
        hasLoc && p.latitude != null && p.longitude != null
          ? haversineMiles(lat, lng, p.latitude, p.longitude)
          : null;

      return {
        shop_slug: p.slug,
        shop_name: p.name,
        neighborhood: p.neighborhood,
        city: p.city,
        category: p.category,
        verification_tier: p.verification_tier ?? "unclaimed",
        photo_url: photos[0] ?? null,
        post_count: postCount,
        // Enrichment, not a gate.
        deal_title: setting?.deal_title ?? null,
        deal_details: setting?.deal_details ?? null,
        reward_goal: setting?.reward_goal ?? null,
        logo_url: shopMap.get(p.slug)?.logo_url ?? null,
        latitude: p.latitude,
        longitude: p.longitude,
        distance_mi,
      };
    });

    // Near you first when we know where you are; otherwise lead with the places
    // that have something to look at, since a wall of never-posted-at places is
    // a worse first impression than the same list ordered by life.
    places.sort((a, b) => {
      if (hasLoc) {
        const da = a.distance_mi ?? Number.POSITIVE_INFINITY;
        const db = b.distance_mi ?? Number.POSITIVE_INFINITY;
        if (da !== db) return da - db;
      }
      if (a.post_count !== b.post_count) return b.post_count - a.post_count;
      if (!!a.photo_url !== !!b.photo_url) return a.photo_url ? -1 : 1;
      return a.shop_name.localeCompare(b.shop_name);
    });

    return NextResponse.json({
      // `shops` is kept as the key so existing callers keep working; the
      // contents are places now. Renaming it is a contract change for a
      // separate slice.
      shops: places.slice(0, limit),
      places: places.slice(0, limit),
    });
  } catch (err) {
    const e = err as { message?: string };
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}

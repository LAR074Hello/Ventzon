import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/customer/shops-map — every mappable PLACE.
 *
 * Slice 1.3 changed what this reads and it is the most consequential read
 * path in the slice. It used to select from `shops`, which meant a place
 * only appeared on the map once a merchant had an account — so an imported
 * or unclaimed place was invisible. That is the cold-start problem places
 * exist to fix: a city has to be populated before anyone subscribes.
 *
 * Now it reads `places`. Claimed places join their shop account for the
 * reward programme and logo; unclaimed ones return with a null deal and are
 * rendered as muted pins. An empty place is a recruitment surface, not
 * something to hide — a sparse map is worse than a full map of quiet places.
 *
 * No auth: this is public data. Reads use the service role because `places`
 * has RLS enabled with no anon policy.
 */
export async function GET() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: placeRows, error } = await supabase
      .from("places")
      .select("slug, name, address, latitude, longitude, neighborhood, city, category, verification_tier, source")
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .limit(500);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const slugs = (placeRows ?? []).map((p) => p.slug);
    if (slugs.length === 0) return NextResponse.json({ shops: [] });

    // The reward programme belongs to the merchant account, not the place.
    const [{ data: settings }, { data: shopRows }] = await Promise.all([
      supabase
        .from("shop_settings")
        .select("shop_slug, shop_name, deal_title, deal_details, reward_goal")
        .in("shop_slug", slugs),
      supabase.from("shops").select("slug, logo_url").in("slug", slugs),
    ]);

    const settingsBySlug = new Map((settings ?? []).map((s) => [s.shop_slug, s]));
    const logoBySlug = new Map((shopRows ?? []).map((s) => [s.slug, s.logo_url]));

    const shops = (placeRows ?? []).map((p) => {
      const s = settingsBySlug.get(p.slug);
      return {
        slug: p.slug,
        address: p.address,
        latitude: p.latitude,
        longitude: p.longitude,
        // `shop_name` is kept as the key so existing map consumers keep
        // working through the expand phase; the value is now the place name.
        shop_name: p.name,
        neighborhood: p.neighborhood,
        category: p.category,
        verification_tier: p.verification_tier,
        // Unclaimed places have no reward programme — the map renders these
        // as muted pins with an invitation rather than a deal.
        deal_title: s?.deal_title ?? null,
        deal_details: s?.deal_details ?? null,
        reward_goal: s?.reward_goal ?? 5,
        logo_url: logoBySlug.get(p.slug) ?? null,
      };
    });

    return NextResponse.json({ shops });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

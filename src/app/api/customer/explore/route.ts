import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from("shop_settings")
      .select("shop_slug, shop_name, deal_title, deal_details, reward_goal")
      .not("shop_name", "is", null)
      .not("deal_title", "is", null)
      .neq("deal_title", "")
      .neq("shop_name", "")
      .order("shop_name", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const slugs = (data ?? []).map((r) => r.shop_slug);
    const { data: shopRows } = slugs.length
      ? await supabase
          .from("shops")
          .select("slug, logo_url, created_at")
          .in("slug", slugs)
      : { data: [] };

    const shopMap: Record<string, { logo_url: string | null; created_at: string | null }> = {};
    for (const s of shopRows ?? []) {
      shopMap[s.slug] = { logo_url: s.logo_url ?? null, created_at: s.created_at ?? null };
    }

    // Get member counts per shop
    const { data: memberCounts } = slugs.length
      ? await supabase
          .from("customers")
          .select("shop_slug")
          .in("shop_slug", slugs)
      : { data: [] };

    const countMap: Record<string, number> = {};
    for (const r of memberCounts ?? []) {
      countMap[r.shop_slug] = (countMap[r.shop_slug] ?? 0) + 1;
    }

    const shops = (data ?? []).map((s) => ({
      shop_slug: s.shop_slug,
      shop_name: s.shop_name,
      deal_title: s.deal_title,
      deal_details: s.deal_details,
      reward_goal: s.reward_goal ?? 5,
      logo_url: shopMap[s.shop_slug]?.logo_url ?? null,
      created_at: shopMap[s.shop_slug]?.created_at ?? null,
      member_count: countMap[s.shop_slug] ?? 0,
    }));

    return NextResponse.json({ shops });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Join shop_settings with shops to get logo_url
    const { data, error } = await supabase
      .from("shop_settings")
      .select("shop_slug, shop_name, deal_title, deal_details, reward_goal")
      .not("shop_name", "is", null)
      .not("deal_title", "is", null)
      .neq("deal_title", "")
      .neq("shop_name", "")
      .order("shop_name", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Fetch logos separately
    const slugs = (data ?? []).map((r) => r.shop_slug);
    const { data: shopRows } = slugs.length
      ? await supabase.from("shops").select("slug, logo_url").in("slug", slugs)
      : { data: [] };

    const logoMap: Record<string, string | null> = {};
    for (const s of shopRows ?? []) logoMap[s.slug] = s.logo_url ?? null;

    const shops = (data ?? []).map((s) => ({
      shop_slug: s.shop_slug,
      shop_name: s.shop_name,
      deal_title: s.deal_title,
      deal_details: s.deal_details,
      reward_goal: s.reward_goal ?? 5,
      logo_url: logoMap[s.shop_slug] ?? null,
    }));

    return NextResponse.json({ shops });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

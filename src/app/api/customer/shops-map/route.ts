import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// GET /api/customer/shops-map
// Returns all shops that have lat/lng set — no auth required (public data)
export async function GET() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await supabase
      .from("shops")
      .select(`
        slug,
        address,
        latitude,
        longitude,
        shop_settings (
          shop_name,
          deal_title,
          deal_details,
          reward_goal,
          logo_url
        )
      `)
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .limit(200);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const shops = (data ?? []).map((row: any) => {
      const s = Array.isArray(row.shop_settings) ? row.shop_settings[0] : row.shop_settings;
      return {
        slug: row.slug,
        address: row.address,
        latitude: row.latitude,
        longitude: row.longitude,
        shop_name: s?.shop_name ?? row.slug,
        deal_title: s?.deal_title ?? null,
        deal_details: s?.deal_details ?? null,
        reward_goal: s?.reward_goal ?? 5,
        logo_url: s?.logo_url ?? null,
      };
    });

    return NextResponse.json({ shops });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

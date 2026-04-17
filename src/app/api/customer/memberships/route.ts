import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Look up all customer records by email across all shops
    const { data: customers, error } = await supabase
      .from("customers")
      .select("shop_slug, visits, last_checkin_date")
      .eq("email", user.email.toLowerCase());

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (!customers || customers.length === 0) {
      return NextResponse.json({ memberships: [] });
    }

    const slugs = customers.map((c) => c.shop_slug);

    // Fetch shop settings + logos in parallel
    const [{ data: settings }, { data: shops }] = await Promise.all([
      supabase
        .from("shop_settings")
        .select("shop_slug, shop_name, deal_title, reward_goal")
        .in("shop_slug", slugs),
      supabase
        .from("shops")
        .select("slug, logo_url")
        .in("slug", slugs),
    ]);

    const settingsMap: Record<string, any> = {};
    for (const s of settings ?? []) settingsMap[s.shop_slug] = s;

    const logoMap: Record<string, string | null> = {};
    for (const s of shops ?? []) logoMap[s.slug] = s.logo_url ?? null;

    const memberships = customers.map((c) => ({
      shop_slug: c.shop_slug,
      shop_name: settingsMap[c.shop_slug]?.shop_name ?? c.shop_slug,
      deal_title: settingsMap[c.shop_slug]?.deal_title ?? null,
      reward_goal: settingsMap[c.shop_slug]?.reward_goal ?? 5,
      visits: c.visits ?? 0,
      last_checkin_date: c.last_checkin_date,
      logo_url: logoMap[c.shop_slug] ?? null,
    }));

    return NextResponse.json({ memberships });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

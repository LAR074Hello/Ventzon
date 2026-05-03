import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    if (!q || q.length < 2) return NextResponse.json({ results: [] });

    const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // Verify rep
    const { data: profile } = await admin
      .from("rep_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (!profile) return NextResponse.json({ error: "Not a rep" }, { status: 403 });

    // Search shop_settings by name, join with shops to check rep_id
    const { data: settings } = await admin
      .from("shop_settings")
      .select("shop_slug, shop_name")
      .ilike("shop_name", `%${q}%`)
      .limit(8);

    if (!settings?.length) return NextResponse.json({ results: [] });

    const slugs = settings.map(s => s.shop_slug);
    const { data: shops } = await admin
      .from("shops")
      .select("slug, rep_id, plan_type, subscription_status")
      .in("slug", slugs);

    const shopMap = Object.fromEntries((shops ?? []).map(s => [s.slug, s]));

    const results = settings.map(s => {
      const shop = shopMap[s.shop_slug];
      return {
        slug: s.shop_slug,
        name: s.shop_name,
        plan: shop?.plan_type ?? "free",
        alreadyClaimed: !!shop?.rep_id,
        claimedByMe: shop?.rep_id === profile.id,
      };
    });

    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

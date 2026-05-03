import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { calcMerchantCommission } from "@/lib/rep-utils";

export const dynamic = "force-dynamic";

// GET: list rep's merchants with commission breakdown
export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data: profile } = await admin
      .from("rep_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) return NextResponse.json({ error: "Not a rep" }, { status: 403 });

    const { data: shops } = await admin
      .from("shops")
      .select("slug, plan_type, subscription_status, rep_claimed_at, created_at")
      .eq("rep_id", profile.id)
      .order("rep_claimed_at", { ascending: false });

    const slugs = (shops ?? []).map(s => s.slug);

    // Batch fetch shop names
    const { data: settings } = slugs.length > 0
      ? await admin.from("shop_settings").select("shop_slug, shop_name").in("shop_slug", slugs)
      : { data: [] };
    const nameMap = Object.fromEntries((settings ?? []).map(s => [s.shop_slug, s.shop_name]));

    // Batch fetch reward counts this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { data: rewards } = slugs.length > 0
      ? await admin.from("reward_events").select("shop_slug").in("shop_slug", slugs).gte("reward_date", monthStart)
      : { data: [] };

    const rewardCounts: Record<string, number> = {};
    for (const r of rewards ?? []) {
      rewardCounts[r.shop_slug] = (rewardCounts[r.shop_slug] ?? 0) + 1;
    }

    const merchants = (shops ?? []).map(shop => {
      const isPro = shop.plan_type === "pro" && shop.subscription_status === "active";
      const rewardCount = rewardCounts[shop.slug] ?? 0;

      return {
        slug: shop.slug,
        name: nameMap[shop.slug] ?? shop.slug,
        plan: shop.plan_type,
        status: shop.subscription_status,
        claimedAt: shop.rep_claimed_at ?? shop.created_at,
        rewardsThisMonth: rewardCount,
        monthlyCommission: calcMerchantCommission(isPro, rewardCount),
      };
    });

    return NextResponse.json({ merchants });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: claim a merchant by slug
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { slug } = await req.json();
    if (!slug?.trim()) return NextResponse.json({ error: "Shop slug required" }, { status: 400 });

    const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data: profile } = await admin
      .from("rep_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) return NextResponse.json({ error: "Not a rep" }, { status: 403 });

    const cleanSlug = slug.trim().toLowerCase();

    const { data: shop } = await admin
      .from("shops")
      .select("slug, rep_id")
      .eq("slug", cleanSlug)
      .single();

    if (!shop) return NextResponse.json({ error: "Shop not found. Check the slug and try again." }, { status: 404 });
    if (shop.rep_id) return NextResponse.json({ error: "This merchant is already claimed by a rep." }, { status: 409 });

    await admin
      .from("shops")
      .update({ rep_id: profile.id, rep_claimed_at: new Date().toISOString() })
      .eq("slug", cleanSlug);

    const { data: settings } = await admin
      .from("shop_settings")
      .select("shop_name")
      .eq("shop_slug", cleanSlug)
      .single();

    return NextResponse.json({ ok: true, shopName: settings?.shop_name ?? cleanSlug });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

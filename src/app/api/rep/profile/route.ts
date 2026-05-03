import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { calcMerchantCommission } from "@/lib/rep-utils";

export const dynamic = "force-dynamic";

const MONTHLY_FLAT = 25;
const COMMISSION_RATE = 0.20;

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
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!profile) return NextResponse.json({ error: "Not a rep" }, { status: 403 });

    // Get this rep's shops (include created_at as fallback for rep_claimed_at)
    const { data: shops } = await admin
      .from("shops")
      .select("slug, plan_type, subscription_status, rep_claimed_at, created_at")
      .eq("rep_id", profile.id);

    const myShops = shops ?? [];
    const activePro = myShops.filter(s => s.plan_type === "pro" && s.subscription_status === "active");
    const activeFree = myShops.filter(s => s.plan_type !== "pro" && s.subscription_status === "active");

    // Commission this month from flat subscriptions
    const flatCommission = activePro.length * MONTHLY_FLAT * COMMISSION_RATE;

    // Commission from reward redemptions this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const slugs = myShops.map(s => s.slug);

    let rewardCommission = 0;
    if (slugs.length > 0) {
      const { count } = await admin
        .from("reward_events")
        .select("id", { count: "exact", head: true })
        .in("shop_slug", slugs)
        .gte("reward_date", monthStart);
      rewardCommission = calcMerchantCommission(false, count ?? 0);
    }

    // All-time commission estimate — use rep_claimed_at, fall back to shop created_at
    let allTimeCommission = 0;
    for (const shop of activePro) {
      const claimedAt = new Date(shop.rep_claimed_at ?? shop.created_at ?? now);
      const monthsActive = Math.max(1, Math.floor((Date.now() - claimedAt.getTime()) / (1000 * 60 * 60 * 24 * 30)));
      allTimeCommission += monthsActive * MONTHLY_FLAT * COMMISSION_RATE;
    }

    return NextResponse.json({
      profile,
      stats: {
        totalMerchants: myShops.length,
        activePro: activePro.length,
        activeFree: activeFree.length,
        commissionThisMonth: Math.round((flatCommission + rewardCommission) * 100) / 100,
        allTimeCommission: Math.round(allTimeCommission * 100) / 100,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { calcMerchantCommission, isInFirstMonth, SIGNUP_BOUNTY, RECURRING_COMMISSION } from "@/lib/rep-utils";

export const dynamic = "force-dynamic";

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

    // Commission this month — signup-bounty model: $25 in month one, then $5/mo.
    const commissionThisMonth = activePro.reduce(
      (sum, s) => sum + calcMerchantCommission(true, isInFirstMonth(s.rep_claimed_at ?? s.created_at)),
      0
    );

    // All-time commission estimate — month one pays the $25 bounty, then $5/mo
    // recurring. Use rep_claimed_at, fall back to shop created_at.
    const now = new Date();
    let allTimeCommission = 0;
    for (const shop of activePro) {
      const claimedAt = new Date(shop.rep_claimed_at ?? shop.created_at ?? now);
      const monthsActive = Math.max(1, Math.floor((Date.now() - claimedAt.getTime()) / (1000 * 60 * 60 * 24 * 30)));
      allTimeCommission += monthsActive === 1 ? SIGNUP_BOUNTY : SIGNUP_BOUNTY + (monthsActive - 1) * RECURRING_COMMISSION;
    }

    return NextResponse.json({
      profile,
      stats: {
        totalMerchants: myShops.length,
        activePro: activePro.length,
        activeFree: activeFree.length,
        commissionThisMonth: Math.round(commissionThisMonth * 100) / 100,
        allTimeCommission: Math.round(allTimeCommission * 100) / 100,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

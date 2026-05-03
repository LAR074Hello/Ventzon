import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { isAdmin, calcMerchantCommission } from "@/lib/rep-utils";

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
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data: reps } = await admin
      .from("rep_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Batch: fetch all shops with rep_id set, then group by rep
    const { data: allShops } = await admin
      .from("shops")
      .select("slug, plan_type, subscription_status, rep_id")
      .not("rep_id", "is", null);

    const shopsByRep: Record<string, typeof allShops> = {};
    for (const shop of allShops ?? []) {
      if (!shopsByRep[shop.rep_id]) shopsByRep[shop.rep_id] = [];
      shopsByRep[shop.rep_id]!.push(shop);
    }

    // Batch: fetch all reward events this month for all rep-owned shops
    const allSlugs = (allShops ?? []).map(s => s.slug);
    const { data: allRewards } = allSlugs.length > 0
      ? await admin.from("reward_events").select("shop_slug").in("shop_slug", allSlugs).gte("reward_date", monthStart)
      : { data: [] };

    const rewardCounts: Record<string, number> = {};
    for (const r of allRewards ?? []) {
      rewardCounts[r.shop_slug] = (rewardCounts[r.shop_slug] ?? 0) + 1;
    }

    const repsWithStats = (reps ?? []).map(rep => {
      const myShops = shopsByRep[rep.id] ?? [];
      const activePro = myShops.filter(s => s.plan_type === "pro" && s.subscription_status === "active").length;
      const totalRewards = myShops.reduce((sum, s) => sum + (rewardCounts[s.slug] ?? 0), 0);
      const commission = calcMerchantCommission(activePro > 0, 0) * activePro +
        myShops.reduce((sum, s) => {
          const isPro = s.plan_type === "pro" && s.subscription_status === "active";
          return sum + calcMerchantCommission(isPro, rewardCounts[s.slug] ?? 0);
        }, 0) - (activePro * calcMerchantCommission(false, 0)); // avoid double-counting

      // Cleaner calculation
      const commissionThisMonth = myShops.reduce((sum, s) => {
        const isPro = s.plan_type === "pro" && s.subscription_status === "active";
        return sum + calcMerchantCommission(isPro, rewardCounts[s.slug] ?? 0);
      }, 0);

      return {
        ...rep,
        totalMerchants: myShops.length,
        activePro,
        commissionThisMonth: Math.round(commissionThisMonth * 100) / 100,
      };
    });

    const { data: pendingInvites } = await admin
      .from("rep_invites")
      .select("*")
      .is("used_at", null)
      .gt("expires_at", now.toISOString())
      .order("created_at", { ascending: false });

    return NextResponse.json({ reps: repsWithStats, pendingInvites: pendingInvites ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

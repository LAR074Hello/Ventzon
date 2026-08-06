import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { isAdmin, calcMerchantCommission, isInFirstMonth } from "@/lib/rep-utils";

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

    // Batch: fetch all shops with rep_id set, then group by rep
    const { data: allShops } = await admin
      .from("shops")
      .select("slug, plan_type, subscription_status, rep_id, rep_claimed_at, created_at")
      .not("rep_id", "is", null);

    const shopsByRep: Record<string, typeof allShops> = {};
    for (const shop of allShops ?? []) {
      if (!shopsByRep[shop.rep_id]) shopsByRep[shop.rep_id] = [];
      shopsByRep[shop.rep_id]!.push(shop);
    }

    const repsWithStats = (reps ?? []).map(rep => {
      const myShops = shopsByRep[rep.id] ?? [];
      const activePro = myShops.filter(s => s.plan_type === "pro" && s.subscription_status === "active").length;

      // Signup-bounty model: $25 in the first month, $5/mo after, $0 for free shops.
      const commissionThisMonth = myShops.reduce((sum, s) => {
        const isPro = s.plan_type === "pro" && s.subscription_status === "active";
        return sum + calcMerchantCommission(isPro, isInFirstMonth(s.rep_claimed_at ?? s.created_at));
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

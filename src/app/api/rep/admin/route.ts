import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = ["lukerichards@ventzon.com", "lukerichardsschool@gmail.com"];
const MONTHLY_FLAT = 25;
const PER_REWARD = 1.25;
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
    if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data: reps } = await admin
      .from("rep_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const repsWithStats = await Promise.all((reps ?? []).map(async (rep) => {
      const { data: shops } = await admin
        .from("shops")
        .select("slug, plan_type, subscription_status")
        .eq("rep_id", rep.id);

      const myShops = shops ?? [];
      const activePro = myShops.filter(s => s.plan_type === "pro" && s.subscription_status === "active").length;
      const slugs = myShops.map(s => s.slug);

      let rewardCount = 0;
      if (slugs.length > 0) {
        const { count } = await admin
          .from("reward_events")
          .select("id", { count: "exact", head: true })
          .in("shop_slug", slugs)
          .gte("reward_date", monthStart);
        rewardCount = count ?? 0;
      }

      const commission = (activePro * MONTHLY_FLAT * COMMISSION_RATE) + (rewardCount * PER_REWARD * COMMISSION_RATE);

      return {
        ...rep,
        totalMerchants: myShops.length,
        activePro,
        commissionThisMonth: Math.round(commission * 100) / 100,
      };
    }));

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

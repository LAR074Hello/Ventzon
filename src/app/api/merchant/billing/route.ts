import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    // Auth check
    const supabaseAuth = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const url = new URL(req.url);
    const shopSlug = (url.searchParams.get("shop_slug") ?? "").trim().toLowerCase();

    if (!shopSlug) {
      return Response.json({ error: "Missing shop_slug" }, { status: 400 });
    }

    // Admin client for cross-table reads
    const supabaseUrl = process.env.SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify ownership
    const { data: shop } = await supabaseAdmin
      .from("shops")
      .select("slug, plan_type, is_paid")
      .eq("slug", shopSlug)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!shop) {
      return Response.json({ error: "Shop not found or not yours" }, { status: 404 });
    }

    const planType = (shop as any).plan_type ?? "free";

    // Count reward events for the current month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .slice(0, 10);

    const { count, error: countErr } = await supabaseAdmin
      .from("reward_events")
      .select("*", { count: "exact", head: true })
      .eq("shop_slug", shopSlug)
      .gte("reward_date", monthStart);

    if (countErr) {
      return Response.json({ error: countErr.message }, { status: 500 });
    }

    const rewardsThisMonth = count ?? 0;

    // Estimated charge
    let estimatedCharge: string;
    if (planType === "pro") {
      const rewardCharge = rewardsThisMonth * 1.25;
      estimatedCharge = `$${(25 + rewardCharge).toFixed(2)} ($25.00 base + $${rewardCharge.toFixed(2)} in rewards)`;
    } else {
      estimatedCharge = `$${(rewardsThisMonth * 1.25).toFixed(2)}`;
    }

    return Response.json({
      plan_type: planType,
      rewards_this_month: rewardsThisMonth,
      estimated_charge: estimatedCharge,
      is_paid: (shop as any).is_paid ?? false,
    });
  } catch (e: any) {
    return Response.json(
      { error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}

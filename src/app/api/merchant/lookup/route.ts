import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// GET /api/merchant/lookup?shop_slug=X&phone=Y  OR  &email=Z
// Used by the register tool to look up a customer before stamping / redeeming.

export async function GET(req: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const url = new URL(req.url);
    const shopSlug = url.searchParams.get("shop_slug")?.trim().toLowerCase() ?? "";
    const phone = url.searchParams.get("phone")?.trim() ?? "";
    const email = url.searchParams.get("email")?.trim().toLowerCase() ?? "";

    if (!shopSlug) return NextResponse.json({ error: "Missing shop_slug" }, { status: 400 });
    if (!phone && !email) return NextResponse.json({ error: "Provide phone or email" }, { status: 400 });

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify ownership
    const { data: shop } = await supabase
      .from("shops")
      .select("slug")
      .eq("slug", shopSlug)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

    // Load reward goal + expiry setting
    const { data: settings } = await supabase
      .from("shop_settings")
      .select("reward_goal, deal_title, reward_expires_days")
      .eq("shop_slug", shopSlug)
      .maybeSingle();
    const goal = Number(settings?.reward_goal ?? 5);
    const dealTitle = settings?.deal_title ?? "your reward";
    const rewardExpiresDays = (settings as any)?.reward_expires_days
      ? Number((settings as any).reward_expires_days)
      : null;

    // Find customer
    let query = supabase
      .from("customers")
      .select("id, phone, email, visits, last_checkin_date, opted_out")
      .eq("shop_slug", shopSlug);
    if (email) {
      query = query.eq("email", email);
    } else {
      query = query.eq("phone", phone);
    }
    const { data: customer, error } = await query.maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (!customer) {
      return NextResponse.json({ found: false, goal, deal_title: dealTitle });
    }

    const visits = Number(customer.visits ?? 0);
    const remaining = Math.max(goal - visits, 0);

    // Compute expiry cutoff date (YYYY-MM-DD) — null means no expiry
    const today = new Date().toISOString().slice(0, 10);
    const cutoffDate = rewardExpiresDays
      ? new Date(Date.now() - rewardExpiresDays * 86_400_000).toISOString().slice(0, 10)
      : null;

    // Check for a pending, non-expired reward event (is_redeemed = false)
    let pendingReward = false;
    try {
      let eventsQuery = supabase
        .from("reward_events")
        .select("id")
        .eq("shop_slug", shopSlug)
        .eq("customer_id", customer.id)
        .eq("is_redeemed", false);
      if (cutoffDate) {
        eventsQuery = (eventsQuery as any).gte("reward_date", cutoffDate);
      }
      const { data: pendingEvents } = await (eventsQuery as any).limit(1);
      pendingReward = (pendingEvents?.length ?? 0) > 0;
    } catch {
      // Column doesn't exist yet — fall back to visit-count heuristic
      pendingReward = visits > 0 && visits % goal === 0;
    }

    return NextResponse.json({
      found: true,
      customer: {
        id: customer.id,
        phone: customer.phone,
        email: customer.email,
        visits,
        last_checkin_date: customer.last_checkin_date,
        opted_out: customer.opted_out,
      },
      goal,
      remaining,
      pending_reward: pendingReward,
      deal_title: dealTitle,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

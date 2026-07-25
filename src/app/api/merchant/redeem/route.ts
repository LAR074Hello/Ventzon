import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// POST /api/merchant/redeem
// Body: { shop_slug, customer_id }
// Marks the customer's oldest pending reward event as redeemed.

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const shopSlug = String(body?.shop_slug ?? "").trim().toLowerCase();
    const customerId = String(body?.customer_id ?? "").trim();

    if (!shopSlug || !customerId) {
      return NextResponse.json({ error: "Missing shop_slug or customer_id" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify ownership
    const { data: shop } = await supabase
      .from("shops")
      .select("slug")
      .eq("slug", shopSlug)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

    // Verify customer belongs to this shop
    const { data: customer } = await supabase
      .from("customers")
      .select("id, visits, phone, email")
      .eq("id", customerId)
      .eq("shop_slug", shopSlug)
      .maybeSingle();
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    const now = new Date().toISOString();
    const today = new Date().toISOString().slice(0, 10);

    // Load reward_expires_days to enforce expiry on redemption
    const { data: settingsRow } = await supabase
      .from("shop_settings")
      .select("reward_expires_days")
      .eq("shop_slug", shopSlug)
      .maybeSingle();
    const rewardExpiresDays = (settingsRow as any)?.reward_expires_days
      ? Number((settingsRow as any).reward_expires_days)
      : null;
    const cutoffDate = rewardExpiresDays
      ? new Date(Date.now() - rewardExpiresDays * 86_400_000).toISOString().slice(0, 10)
      : null;

    // Try to find and mark a pending, non-expired reward_events row
    let rewardEventFound = false;
    try {
      let eventsQuery = supabase
        .from("reward_events")
        .select("id")
        .eq("shop_slug", shopSlug)
        .eq("customer_id", customerId)
        .eq("is_redeemed", false)
        .order("reward_date", { ascending: true });
      if (cutoffDate) {
        eventsQuery = (eventsQuery as any).gte("reward_date", cutoffDate);
      }
      const { data: pendingEvent } = await (eventsQuery as any).limit(1).maybeSingle();

      if (pendingEvent) {
        await supabase
          .from("reward_events")
          .update({ is_redeemed: true, redeemed_at: now })
          .eq("id", pendingEvent.id);
        rewardEventFound = true;
      }
    } catch {
      // Column not available yet — proceed with visit reset anyway
    }

    // If no pending reward event found via DB, fall back to visits check
    if (!rewardEventFound) {
      const { data: settings } = await supabase
        .from("shop_settings")
        .select("reward_goal")
        .eq("shop_slug", shopSlug)
        .maybeSingle();
      const goal = Number(settings?.reward_goal ?? 5);
      const visits = Number(customer.visits ?? 0);
      if (visits % goal !== 0 || visits === 0) {
        return NextResponse.json({ error: "No pending reward to redeem" }, { status: 400 });
      }
      // Insert a reward event as already-redeemed
      try {
        await supabase.from("reward_events").insert({
          shop_slug: shopSlug,
          customer_id: customerId,
          reward_date: new Date().toISOString().slice(0, 10),
          is_redeemed: true,
          redeemed_at: now,
        });
      } catch {
        // Non-fatal: columns may not exist yet
      }
    }

    return NextResponse.json({
      ok: true,
      redeemed: true,
      customer_id: customerId,
      redeemed_at: now,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

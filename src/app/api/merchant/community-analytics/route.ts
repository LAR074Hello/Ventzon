import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// Returns per-group community reward analytics from loyalty_events.
// GET /api/merchant/community-analytics?shop=slug

export async function GET(req: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey)
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const url = new URL(req.url);
    const shopSlug = String(url.searchParams.get("shop") ?? "").trim().toLowerCase();
    if (!shopSlug) return NextResponse.json({ error: "Missing shop" }, { status: 400 });

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: shop } = await supabase
      .from("shops")
      .select("id")
      .eq("slug", shopSlug)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

    // Fetch last 90 days of loyalty events for this merchant
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    const { data: events, error: eventsErr } = await supabase
      .from("loyalty_events")
      .select("customer_id, matched_groups, matched_detail, base_points, awarded_points, applied_boost, created_at")
      .eq("merchant_id", shop.id)
      .gte("created_at", since)
      .order("created_at", { ascending: false });

    if (eventsErr) return NextResponse.json({ error: eventsErr.message }, { status: 500 });

    const allEvents = events ?? [];

    // Total merchant scans (for repeat rate comparison)
    const { count: totalScans } = await supabase
      .from("checkins")
      .select("id", { count: "exact", head: true })
      .eq("shop_slug", shopSlug)
      .gte("created_at", since);

    // Per-group aggregations
    const GROUPS = ["veteran", "student", "senior", "first_responder", "care"] as const;

    const stats = GROUPS.map((g) => {
      const groupEvents = allEvents.filter((e) =>
        Array.isArray(e.matched_groups) && e.matched_groups.includes(g)
      );

      const uniqueCustomers = new Set(groupEvents.map((e) => e.customer_id));

      // Repeat rate: customers with >1 scan / total unique customers in group
      const repeatCustomers = [...uniqueCustomers].filter((cid) => {
        const customerEvents = groupEvents.filter((e) => e.customer_id === cid);
        return customerEvents.length > 1;
      });

      const totalBoostCost = groupEvents.reduce(
        (sum, e) => sum + (Number(e.awarded_points) - Number(e.base_points)),
        0
      );

      const avgBoost =
        groupEvents.length > 0
          ? groupEvents.reduce((sum, e) => sum + Number(e.applied_boost), 0) / groupEvents.length
          : 1.0;

      return {
        group_key: g,
        scan_count: groupEvents.length,
        unique_customers: uniqueCustomers.size,
        repeat_rate:
          uniqueCustomers.size > 0
            ? Math.round((repeatCustomers.length / uniqueCustomers.size) * 100)
            : 0,
        avg_boost: Math.round(avgBoost * 100) / 100,
        total_boost_cost: Math.round(totalBoostCost * 10) / 10,
      };
    }).filter((s) => s.scan_count > 0); // only groups with activity

    // Community vs baseline repeat rate
    const communityCustomerIds = new Set(
      allEvents
        .filter((e) => Array.isArray(e.matched_groups) && e.matched_groups.length > 0)
        .map((e) => e.customer_id)
    );

    // Verified vs granted split (from community_eligibility)
    const { data: eligRows } = await supabase
      .from("community_eligibility")
      .select("source, group_key")
      .eq("merchant_id", shop.id)
      .eq("status", "active");

    const verified = (eligRows ?? []).filter((r) => r.source !== "merchant_grant").length;
    const granted = (eligRows ?? []).filter((r) => r.source === "merchant_grant").length;

    return NextResponse.json({
      ok: true,
      period_days: 90,
      total_community_scans: allEvents.filter(
        (e) => Array.isArray(e.matched_groups) && e.matched_groups.length > 0
      ).length,
      total_community_customers: communityCustomerIds.size,
      total_merchant_scans: totalScans ?? 0,
      verified_badges: verified,
      merchant_grants: granted,
      groups: stats,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}

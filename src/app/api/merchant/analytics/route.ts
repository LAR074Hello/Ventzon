import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const PERIOD_DAYS: Record<string, number> = {
  "1d": 1,
  "7d": 7,
  "30d": 30,
  "60d": 60,
  "365d": 365,
};

export async function GET(req: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server misconfigured: missing Supabase env vars" },
        { status: 500 }
      );
    }

    const url = new URL(req.url);
    const shop = String(url.searchParams.get("shop") ?? "")
      .trim()
      .toLowerCase();
    const period = String(url.searchParams.get("period") ?? "30d").trim();

    if (!shop) {
      return NextResponse.json({ error: "Missing shop" }, { status: 400 });
    }

    // Auth check
    const supabaseAuth = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify ownership
    const { data: shopRow } = await supabase
      .from("shops")
      .select("id, created_at")
      .eq("slug", shop)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!shopRow) {
      return NextResponse.json(
        { error: "Shop not found or you don't own it" },
        { status: 403 }
      );
    }

    // Get reward goal
    const { data: settingsRow } = await supabase
      .from("shop_settings")
      .select("reward_goal")
      .eq("shop_slug", shop)
      .maybeSingle();

    const goal = Number(settingsRow?.reward_goal ?? 5);

    // Calculate date range
    const now = new Date();
    const endDate = now.toISOString().slice(0, 10);
    let startDate: string;

    if (period === "all") {
      startDate = shopRow.created_at
        ? new Date(shopRow.created_at).toISOString().slice(0, 10)
        : "2020-01-01";
    } else {
      const days = PERIOD_DAYS[period] || 30;
      const d = new Date(now);
      d.setDate(d.getDate() - days);
      startDate = d.toISOString().slice(0, 10);
    }

    // Fetch ALL checkins for this shop to compute rewards accurately.
    // We need full history because reward cycles depend on cumulative visit
    // counts per customer (visits reset to 0 every time goal is reached).
    const { data: allCheckins, error: checkinsErr } = await supabase
      .from("checkins")
      .select("customer_id, checkin_date")
      .eq("shop_slug", shop)
      .order("checkin_date", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(100000);

    if (checkinsErr) {
      return NextResponse.json(
        { error: checkinsErr.message },
        { status: 500 }
      );
    }

    // Walk through every checkin in chronological order.
    // Track per-customer visit counts so we can identify reward events
    // (every time visits % goal === 0).
    const customerVisits: Record<string, number> = {};
    const dailyCheckins: Record<string, number> = {};
    const dailyRewards: Record<string, number> = {};

    for (const row of allCheckins || []) {
      const date = row.checkin_date as string;
      const cid = row.customer_id as string;

      customerVisits[cid] = (customerVisits[cid] || 0) + 1;

      // Only accumulate counts within the selected period
      if (date >= startDate && date <= endDate) {
        dailyCheckins[date] = (dailyCheckins[date] || 0) + 1;

        if (customerVisits[cid] % goal === 0) {
          dailyRewards[date] = (dailyRewards[date] || 0) + 1;
        }
      }
    }

    // Fill missing dates with zeros so charts show a continuous timeline
    const checkins: Array<{ date: string; count: number }> = [];
    const rewards: Array<{ date: string; count: number }> = [];

    const cursor = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T00:00:00");

    while (cursor <= end) {
      const d = cursor.toISOString().slice(0, 10);
      checkins.push({ date: d, count: dailyCheckins[d] || 0 });
      rewards.push({ date: d, count: dailyRewards[d] || 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    // Retention rate: % of customers who visited more than once
    const totalUniqueCustomers = Object.keys(customerVisits).length;
    const returningCustomers = Object.values(customerVisits).filter((v) => v > 1).length;
    const retentionRate =
      totalUniqueCustomers > 0
        ? Math.round((returningCustomers / totalUniqueCustomers) * 100)
        : null;

    // Top 5 customers by total visits
    const { data: topCustomerRows } = await supabase
      .from("customers")
      .select("id, phone, email, visits")
      .eq("shop_slug", shop)
      .order("visits", { ascending: false })
      .limit(5);

    return NextResponse.json({
      shop,
      period,
      goal,
      startDate,
      endDate,
      checkins,
      rewards,
      retention_rate: retentionRate,
      top_customers: topCustomerRows ?? [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

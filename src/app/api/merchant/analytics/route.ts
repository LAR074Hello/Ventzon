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

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

    // Get reward goal and bonus days
    const { data: settingsRow } = await supabase
      .from("shop_settings")
      .select("reward_goal, bonus_days, reward_mode")
      .eq("shop_slug", shop)
      .maybeSingle();

    const rewardMode = (settingsRow as any)?.reward_mode === "points" ? "points" : "stamps";

    const goal = Number(settingsRow?.reward_goal ?? 5);
    // bonus_days is stored as an array of date strings e.g. ["2026-05-03"]
    const bonusDaysSet = new Set<string>(
      Array.isArray(settingsRow?.bonus_days) ? settingsRow.bonus_days : []
    );

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
      .select("customer_id, checkin_date, created_at, amount")
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
    const customerFirstSeen: Record<string, string> = {}; // customer_id -> earliest date
    const customerLastSeen: Record<string, string> = {};  // customer_id -> latest date

    const dailyCheckins: Record<string, number> = {};
    const dailyRewards: Record<string, number> = {};
    const dayOfWeekCounts: number[] = [0, 0, 0, 0, 0, 0, 0]; // indexed Sun=0
    const hourOfDayCounts: number[] = new Array(24).fill(0);

    for (const row of allCheckins || []) {
      const date = row.checkin_date as string;
      const cid = row.customer_id as string;
      const createdAt = row.created_at as string | null;

      // Track first/last seen across ALL history
      if (!customerFirstSeen[cid] || date < customerFirstSeen[cid]) {
        customerFirstSeen[cid] = date;
      }
      if (!customerLastSeen[cid] || date > customerLastSeen[cid]) {
        customerLastSeen[cid] = date;
      }

      // Bonus days award 2 stamps instead of 1
      const stampsAwarded = bonusDaysSet.has(date) ? 2 : 1;
      const prevVisits = customerVisits[cid] || 0;
      customerVisits[cid] = prevVisits + stampsAwarded;

      // Only accumulate counts within the selected period
      if (date >= startDate && date <= endDate) {
        dailyCheckins[date] = (dailyCheckins[date] || 0) + stampsAwarded;

        // Check if the customer crossed the goal threshold with this checkin
        const crossedGoal =
          Math.floor(customerVisits[cid] / goal) > Math.floor(prevVisits / goal);
        if (crossedGoal) {
          dailyRewards[date] = (dailyRewards[date] || 0) + 1;
        }

        // Day-of-week breakdown (use checkin_date which is a reliable YYYY-MM-DD string)
        const dow = new Date(date + "T12:00:00").getDay();
        dayOfWeekCounts[dow] += 1; // one per checkin, not per stamp

        // Hour-of-day breakdown (use created_at timestamp)
        if (createdAt) {
          try {
            const hour = new Date(createdAt).getHours();
            if (hour >= 0 && hour <= 23) {
              hourOfDayCounts[hour] += 1;
            }
          } catch {
            // ignore parse errors
          }
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

    // Day-of-week: reorder Mon-Sun (start week on Monday for business context)
    const dayOfWeek = [1, 2, 3, 4, 5, 6, 0].map((i) => ({
      day: DAY_LABELS[i],
      count: dayOfWeekCounts[i],
    }));

    // Hour-of-day: group into 4 blocks or keep hourly
    const hourOfDay = hourOfDayCounts.map((count, hour) => ({
      hour,
      label: hour === 0 ? "12am" : hour < 12 ? `${hour}am` : hour === 12 ? "12pm" : `${hour - 12}pm`,
      count,
    }));

    // Time blocks (Morning 6-11, Afternoon 12-17, Evening 18-22, Night 23-5)
    const timeBlocks = [
      { label: "Morning", sublabel: "6am–11am", count: hourOfDayCounts.slice(6, 12).reduce((a, b) => a + b, 0) },
      { label: "Afternoon", sublabel: "12pm–5pm", count: hourOfDayCounts.slice(12, 18).reduce((a, b) => a + b, 0) },
      { label: "Evening", sublabel: "6pm–10pm", count: hourOfDayCounts.slice(18, 23).reduce((a, b) => a + b, 0) },
      { label: "Night", sublabel: "11pm–5am", count: [...hourOfDayCounts.slice(23), ...hourOfDayCounts.slice(0, 6)].reduce((a, b) => a + b, 0) },
    ];

    // Retention rate: % of customers (all-time) who visited more than once
    const totalUniqueCustomers = Object.keys(customerVisits).length;
    const returningCustomers = Object.values(customerVisits).filter((v) => v > 1).length;
    const retentionRate =
      totalUniqueCustomers > 0
        ? Math.round((returningCustomers / totalUniqueCustomers) * 100)
        : null;

    // New vs returning in period: "new" = first ever visit was within the period
    const customersActiveinPeriod = new Set<string>();
    for (const row of allCheckins || []) {
      const date = row.checkin_date as string;
      if (date >= startDate && date <= endDate) {
        customersActiveinPeriod.add(row.customer_id as string);
      }
    }

    let newCustomers = 0;
    let returningInPeriod = 0;
    for (const cid of customersActiveinPeriod) {
      const firstSeen = customerFirstSeen[cid];
      if (firstSeen && firstSeen >= startDate) {
        newCustomers++;
      } else {
        returningInPeriod++;
      }
    }

    // Avg visits per active customer in the period
    let totalVisitsInPeriod = 0;
    const visitsPerCustomerInPeriod: Record<string, number> = {};
    for (const row of allCheckins || []) {
      const date = row.checkin_date as string;
      if (date >= startDate && date <= endDate) {
        const cid = row.customer_id as string;
        visitsPerCustomerInPeriod[cid] = (visitsPerCustomerInPeriod[cid] || 0) + 1;
        totalVisitsInPeriod++;
      }
    }
    const activeInPeriodCount = Object.keys(visitsPerCustomerInPeriod).length;
    const avgVisitsPerCustomer =
      activeInPeriodCount > 0
        ? Math.round((totalVisitsInPeriod / activeInPeriodCount) * 10) / 10
        : null;

    // At-risk / lapsed / churned segmentation
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const fourteenDaysAgoStr = fourteenDaysAgo.toISOString().slice(0, 10);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10);

    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const sixtyDaysAgoStr = sixtyDaysAgo.toISOString().slice(0, 10);

    let atRiskCount = 0;  // last visit 14–29 days ago
    let lapsedCount = 0;  // last visit 30–59 days ago
    let churnedCount = 0; // last visit 60+ days ago
    for (const lastSeen of Object.values(customerLastSeen)) {
      if (lastSeen < sixtyDaysAgoStr) churnedCount++;
      else if (lastSeen < thirtyDaysAgoStr) lapsedCount++;
      else if (lastSeen < fourteenDaysAgoStr) atRiskCount++;
    }

    // Avg customer lifetime: mean days between first and last visit (customers with >1 visit)
    const lifetimes: number[] = [];
    for (const [cid, firstSeen] of Object.entries(customerFirstSeen)) {
      const lastSeen = customerLastSeen[cid];
      if (lastSeen && lastSeen !== firstSeen) {
        const days = Math.round(
          (new Date(lastSeen).getTime() - new Date(firstSeen).getTime()) / 86400000
        );
        if (days > 0) lifetimes.push(days);
      }
    }
    const avgLifetimeDays =
      lifetimes.length > 0
        ? Math.round(lifetimes.reduce((a, b) => a + b, 0) / lifetimes.length)
        : null;

    // Loyal customers: total stamps >= goal (earned at least 1 reward)
    const loyalCount = Object.values(customerVisits).filter((v) => v >= goal).length;

    // Redemption rate: rewards per check-in in period (%)
    const totalCheckinsInPeriod = checkins.reduce((s, d) => s + d.count, 0);
    const totalRewardsInPeriod = rewards.reduce((s, d) => s + d.count, 0);
    const redemptionRate =
      totalCheckinsInPeriod > 0
        ? Math.round((totalRewardsInPeriod / totalCheckinsInPeriod) * 1000) / 10
        : null;

    // Period-over-period comparison (only for named periods, not "all")
    let periodVsPrevious: {
      checkins_pct_change: number | null;
      customers_pct_change: number | null;
    } = { checkins_pct_change: null, customers_pct_change: null };

    const periodDays = PERIOD_DAYS[period];
    if (periodDays) {
      const prevEndDate = new Date(startDate + "T00:00:00");
      prevEndDate.setDate(prevEndDate.getDate() - 1);
      const prevEndStr = prevEndDate.toISOString().slice(0, 10);
      const prevStartDate = new Date(prevEndDate);
      prevStartDate.setDate(prevStartDate.getDate() - periodDays + 1);
      const prevStartStr = prevStartDate.toISOString().slice(0, 10);

      let prevCheckinsCount = 0;
      const prevCustomers = new Set<string>();
      for (const row of allCheckins || []) {
        const date = row.checkin_date as string;
        if (date >= prevStartStr && date <= prevEndStr) {
          prevCheckinsCount++;
          prevCustomers.add(row.customer_id as string);
        }
      }
      periodVsPrevious = {
        checkins_pct_change:
          prevCheckinsCount > 0
            ? Math.round(((totalCheckinsInPeriod - prevCheckinsCount) / prevCheckinsCount) * 100)
            : null,
        customers_pct_change:
          prevCustomers.size > 0
            ? Math.round(
                ((customersActiveinPeriod.size - prevCustomers.size) / prevCustomers.size) * 100
              )
            : null,
      };
    }

    // Customer lifecycle funnel (all-time visit counts)
    const lifecycle = { new: 0, returning: 0, loyal: 0 };
    for (const visits of Object.values(customerVisits)) {
      if (visits >= goal) lifecycle.loyal++;
      else if (visits > 1) lifecycle.returning++;
      else lifecycle.new++;
    }

    // Revenue analytics (points mode). Period revenue + avg ticket come from
    // checkins.amount within the window; lifetime revenue from customers.total_spend.
    let revenue: {
      period_revenue: number;
      avg_ticket: number | null;
      transactions: number;
      lifetime_revenue: number;
      revenue_per_customer: number | null;
    } | null = null;

    if (rewardMode === "points") {
      let periodRevenue = 0;
      let txns = 0;
      for (const row of allCheckins || []) {
        const date = row.checkin_date as string;
        const amt = Number((row as any).amount ?? 0);
        if (date >= startDate && date <= endDate && amt > 0) {
          periodRevenue += amt;
          txns++;
        }
      }

      const { data: spendRows } = await supabase
        .from("customers")
        .select("total_spend")
        .eq("shop_slug", shop);
      const lifetimeRevenue = (spendRows ?? []).reduce(
        (s: number, r: any) => s + Number(r.total_spend ?? 0),
        0
      );
      const payingCustomers = (spendRows ?? []).filter((r: any) => Number(r.total_spend ?? 0) > 0).length;

      revenue = {
        period_revenue: Math.round(periodRevenue * 100) / 100,
        avg_ticket: txns > 0 ? Math.round((periodRevenue / txns) * 100) / 100 : null,
        transactions: txns,
        lifetime_revenue: Math.round(lifetimeRevenue * 100) / 100,
        revenue_per_customer:
          payingCustomers > 0 ? Math.round((lifetimeRevenue / payingCustomers) * 100) / 100 : null,
      };
    }

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
      // Foot traffic analytics
      day_of_week: dayOfWeek,
      hour_of_day: hourOfDay,
      time_blocks: timeBlocks,
      new_vs_returning: {
        new: newCustomers,
        returning: returningInPeriod,
        total: newCustomers + returningInPeriod,
      },
      avg_visits_per_customer: avgVisitsPerCustomer,
      lapsed_count: lapsedCount,
      total_unique_customers: totalUniqueCustomers,
      // New metrics
      at_risk_count: atRiskCount,
      churned_count: churnedCount,
      avg_lifetime_days: avgLifetimeDays,
      loyal_count: loyalCount,
      redemption_rate: redemptionRate,
      period_vs_previous: periodVsPrevious,
      lifecycle,
      reward_mode: rewardMode,
      revenue,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

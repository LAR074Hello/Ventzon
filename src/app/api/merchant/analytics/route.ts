import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { placeIdForSlug } from "@/lib/places";
import { RATINGS_MIN_TO_SHOW } from "@/lib/visit-rating";

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
    // Optional calendar month (YYYY-MM) for the monthly report. Overrides period.
    const monthParam = String(url.searchParams.get("month") ?? "").trim();
    const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(monthParam) ? monthParam : null;

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
      .select("id, created_at, is_paid")
      .eq("slug", shop)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!shopRow) {
      return NextResponse.json(
        { error: "Shop not found or you don't own it" },
        { status: 403 }
      );
    }

    if (!shopRow?.is_paid) {
      return NextResponse.json(
        { error: "Subscription required" },
        { status: 403 }
      );
    }

    // Get reward goal and bonus days
    const { data: settingsRow } = await supabase
      .from("shop_settings")
      .select("reward_goal, bonus_days, reward_mode")
      .eq("shop_slug", shop)
      .maybeSingle();

    const rewardMode = settingsRow?.reward_mode === "points" ? "points" : "stamps";

    const goal = Number(settingsRow?.reward_goal ?? 5);
    // bonus_days is stored as an array of date strings e.g. ["2026-05-03"]
    const bonusDaysSet = new Set<string>(
      Array.isArray(settingsRow?.bonus_days) ? settingsRow.bonus_days : []
    );

    // Calculate date range
    const now = new Date();
    let endDate = now.toISOString().slice(0, 10);
    let startDate: string;
    // Length of the window in days when it's a fixed window (used for the
    // "vs previous period" comparison). null for all-time.
    let windowDays: number | null = PERIOD_DAYS[period] ?? null;

    if (month) {
      const [y, m] = month.split("-").map(Number);
      const first = new Date(Date.UTC(y, m - 1, 1));
      const last = new Date(Date.UTC(y, m, 0));
      startDate = first.toISOString().slice(0, 10);
      const lastStr = last.toISOString().slice(0, 10);
      if (lastStr < endDate) endDate = lastStr;
      windowDays = last.getUTCDate();
    } else if (period === "all") {
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

    // Fetch REAL reward events (one row per reward earned, marked redeemed
    // at the register). These replace the old goal-crossing estimate for
    // every rewards figure on the dashboard.
    const { data: rewardEvents, error: rewardEventsErr } = await supabase
      .from("reward_events")
      .select("reward_date, is_redeemed, redeemed_at")
      .eq("shop_slug", shop)
      .order("reward_date", { ascending: true })
      .limit(200000);

    if (rewardEventsErr) {
      return NextResponse.json(
        { error: rewardEventsErr.message },
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
      customerVisits[cid] = (customerVisits[cid] || 0) + stampsAwarded;

      // Only accumulate counts within the selected period
      if (date >= startDate && date <= endDate) {
        dailyCheckins[date] = (dailyCheckins[date] || 0) + stampsAwarded;

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

    // Daily reward series, from real reward_events rows.
    //  - earned:   the day a reward was earned (reward_date)
    //  - redeemed: the day it was marked redeemed at the register
    //              (redeemed_at; falls back to reward_date when a legacy
    //              row was flagged redeemed without a timestamp)
    const earnedByDate: Record<string, number> = {};
    const redeemedByDate: Record<string, number> = {};
    for (const ev of rewardEvents || []) {
      const earnedDate = ev.reward_date as string;
      if (earnedDate >= startDate && earnedDate <= endDate) {
        earnedByDate[earnedDate] = (earnedByDate[earnedDate] || 0) + 1;
      }
      if (ev.is_redeemed) {
        const redeemedDate = (ev.redeemed_at as string | null)?.slice(0, 10) || earnedDate;
        if (redeemedDate >= startDate && redeemedDate <= endDate) {
          redeemedByDate[redeemedDate] = (redeemedByDate[redeemedDate] || 0) + 1;
        }
      }
    }

    // Period totals from real rows (earned-in-period cohort)
    let rewardsEarnedInPeriod = 0;
    let redeemedOfEarnedInPeriod = 0;
    for (const ev of rewardEvents || []) {
      const earnedDate = ev.reward_date as string;
      if (earnedDate >= startDate && earnedDate <= endDate) {
        rewardsEarnedInPeriod++;
        if (ev.is_redeemed) redeemedOfEarnedInPeriod++;
      }
    }

    // Fill missing dates with zeros so charts show a continuous timeline
    const checkins: Array<{ date: string; count: number }> = [];
    const rewards_earned: Array<{ date: string; count: number }> = [];
    const rewards_redeemed: Array<{ date: string; count: number }> = [];

    const cursor = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T00:00:00");

    while (cursor <= end) {
      const d = cursor.toISOString().slice(0, 10);
      checkins.push({ date: d, count: dailyCheckins[d] || 0 });
      rewards_earned.push({ date: d, count: earnedByDate[d] || 0 });
      rewards_redeemed.push({ date: d, count: redeemedByDate[d] || 0 });
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

    // Reward figures — all from real reward_events rows, never an estimate.
    const totalCheckinsInPeriod = checkins.reduce((s, d) => s + d.count, 0);
    const rewardsRedeemedInPeriod = rewards_redeemed.reduce((s, d) => s + d.count, 0);
    const rewardsPendingInPeriod = Math.max(
      0,
      rewardsEarnedInPeriod - redeemedOfEarnedInPeriod
    );
    const redemptionRate =
      rewardsEarnedInPeriod > 0
        ? Math.round((redeemedOfEarnedInPeriod / rewardsEarnedInPeriod) * 1000) / 10
        : null;

    // Period-over-period comparison (only for named periods, not "all")
    let periodVsPrevious: {
      checkins_pct_change: number | null;
      customers_pct_change: number | null;
    } = { checkins_pct_change: null, customers_pct_change: null };

    const periodDays = windowDays;
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

    // ── Spend per visit (optional amount entered by staff) ──
    // Only check-ins with a recorded amount count, so the figures stay honest
    // while most visits have no amount. Loyal = earned at least one reward.
    let spendSum = 0;
    let spendCount = 0;
    const spendByCustomer: Record<string, { sum: number; count: number }> = {};
    for (const row of allCheckins || []) {
      const date = row.checkin_date as string;
      const amt = row.amount == null ? null : Number(row.amount);
      if (amt == null || !Number.isFinite(amt) || amt <= 0) continue;
      if (date < startDate || date > endDate) continue;
      spendSum += amt;
      spendCount++;
      const cid = row.customer_id as string;
      const e = (spendByCustomer[cid] ||= { sum: 0, count: 0 });
      e.sum += amt;
      e.count++;
    }
    let loyalSum = 0, loyalCount2 = 0, otherSum = 0, otherCount = 0;
    for (const [cid, e] of Object.entries(spendByCustomer)) {
      if ((customerVisits[cid] || 0) >= goal) { loyalSum += e.sum; loyalCount2 += e.count; }
      else { otherSum += e.sum; otherCount += e.count; }
    }
    const round2 = (n: number) => Math.round(n * 100) / 100;
    const spend = {
      avg_ticket: spendCount > 0 ? round2(spendSum / spendCount) : null,
      total: round2(spendSum),
      visits_with_amount: spendCount,
      loyal_avg_ticket: loyalCount2 > 0 ? round2(loyalSum / loyalCount2) : null,
      other_avg_ticket: otherCount > 0 ? round2(otherSum / otherCount) : null,
    };

    // ── Last promotion result ──
    // Who the promotion reached is reconstructed from check-in history at
    // send time (no recipients table): "lapsed" = last visit 30+ days before
    // sending, "slipping" = 14+ days, otherwise everyone who had joined.
    // "Came back" = checked in within 7 days after it was sent.
    const PROMO_WINDOW_DAYS = 7;
    let lastPromo: {
      name: string | null;
      audience: string;
      sent_at: string;
      reached: number;
      came_back: number;
      window_days: number;
      window_complete: boolean;
    } | null = null;
    const { data: promoRow } = await supabase
      .from("promotions")
      .select("name, audience, sent_at")
      .eq("shop_slug", shop)
      .not("sent_at", "is", null)
      .order("sent_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (promoRow?.sent_at) {
      const sentAt = new Date(promoRow.sent_at as string);
      const sentDay = sentAt.toISOString().slice(0, 10);
      const windowEnd = new Date(sentAt);
      windowEnd.setDate(windowEnd.getDate() + PROMO_WINDOW_DAYS);
      const windowEndDay = windowEnd.toISOString().slice(0, 10);
      const audience = String(promoRow.audience ?? "all");
      const minGapDays = audience === "lapsed" ? 30 : audience === "slipping" ? 14 : 0;
      const cutoff = new Date(sentAt);
      cutoff.setDate(cutoff.getDate() - minGapDays);
      const cutoffDay = cutoff.toISOString().slice(0, 10);

      const lastBefore: Record<string, string> = {};
      const cameBack = new Set<string>();
      for (const row of allCheckins || []) {
        const date = row.checkin_date as string;
        const cid = row.customer_id as string;
        if (date < sentDay) {
          if (!lastBefore[cid] || date > lastBefore[cid]) lastBefore[cid] = date;
        } else if (date <= windowEndDay) {
          cameBack.add(cid);
        }
      }
      const reachedIds = Object.entries(lastBefore)
        .filter(([, last]) => minGapDays === 0 || last < cutoffDay)
        .map(([cid]) => cid);
      lastPromo = {
        name: (promoRow.name as string | null) ?? null,
        audience,
        sent_at: promoRow.sent_at as string,
        reached: reachedIds.length,
        came_back: reachedIds.filter((cid) => cameBack.has(cid)).length,
        window_days: PROMO_WINDOW_DAYS,
        window_complete: Date.now() >= windowEnd.getTime(),
      };
    }

    // ── Your shop on Ventzon (the consumer app) ──
    // Counts only, never who: followers, followers who haven't visited yet,
    // posts tagging the shop, and likes/saves/comments on those posts.
    let onVentzon: {
      followers: number;
      new_followers: number;
      followers_not_visited: number;
      posts: number;
      posters: number;
      likes: number;
      saves: number;
      comments: number;
    } | null = null;
    try {
      const { data: followRows } = await supabase
        .from("customer_follows")
        .select("email, created_at")
        .eq("shop_slug", shop)
        .limit(50000);
      const follows = followRows ?? [];
      const { data: memberRows } = await supabase
        .from("customers")
        .select("email, last_checkin_date")
        .eq("shop_slug", shop)
        .not("email", "is", null)
        .limit(100000);
      const visitedEmails = new Set(
        (memberRows ?? [])
          .filter((r) => r.last_checkin_date)
          .map((r) => String(r.email).toLowerCase())
      );

      const placeId = await placeIdForSlug(supabase, shop);
      const tagFilter = placeId
        ? `shop_slug.eq.${shop},place_id.eq.${placeId}`
        : `shop_slug.eq.${shop}`;
      const { data: postRows } = await supabase
        .from("posts")
        .select("id, author_email, created_at")
        .or(tagFilter)
        .eq("hidden", false)
        .gte("created_at", `${startDate}T00:00:00Z`)
        .lte("created_at", `${endDate}T23:59:59Z`)
        .limit(5000);
      const posts = postRows ?? [];
      const postIds = posts.map((p) => p.id as string);

      const countFor = async (table: string, extra?: (q: any) => any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        if (postIds.length === 0) return 0;
        let q = supabase.from(table).select("id", { count: "exact", head: true }).in("post_id", postIds);
        if (extra) q = extra(q);
        const { count } = await q;
        return count ?? 0;
      };

      onVentzon = {
        followers: follows.length,
        new_followers: follows.filter((f) => {
          const d = String(f.created_at ?? "").slice(0, 10);
          return d >= startDate && d <= endDate;
        }).length,
        followers_not_visited: follows.filter(
          (f) => f.email && !visitedEmails.has(String(f.email).toLowerCase())
        ).length,
        posts: posts.length,
        posters: new Set(posts.map((p) => String(p.author_email ?? ""))).size,
        likes: await countFor("post_likes"),
        saves: await countFor("post_saves"),
        comments: await countFor("post_comments", (q) => q.eq("hidden", false)),
      };
    } catch (e) {
      console.warn("[analytics] on-ventzon metrics failed:", e instanceof Error ? e.message : e);
    }

    // ── Page views in the Ventzon app ──
    // Views (one per signed-in person per day), unique viewers, where they
    // came from, and how many viewers checked in within 7 days of viewing.
    let views: {
      views: number;
      unique_viewers: number;
      viewed_then_visited: number;
      sources: { source: string; count: number }[];
    } | null = null;
    try {
      const placeIdForViews = await placeIdForSlug(supabase, shop);
      const viewFilter = placeIdForViews
        ? `shop_slug.eq.${shop},place_id.eq.${placeIdForViews}`
        : `shop_slug.eq.${shop}`;
      const { data: viewRows, error: viewErr } = await supabase
        .from("place_views")
        .select("viewer_id, view_date, source")
        .or(viewFilter)
        .gte("view_date", startDate)
        .lte("view_date", endDate)
        .limit(50000);
      if (!viewErr) {
        const vr = viewRows ?? [];
        const firstView: Record<string, string> = {};
        const sourceCounts: Record<string, number> = {};
        for (const v of vr) {
          const id = String(v.viewer_id);
          const d = String(v.view_date);
          if (!firstView[id] || d < firstView[id]) firstView[id] = d;
          sourceCounts[String(v.source ?? "other")] = (sourceCounts[String(v.source ?? "other")] ?? 0) + 1;
        }
        // viewer profile → email → this shop's customer row → check-ins
        const viewerIds = Object.keys(firstView);
        let visited = 0;
        if (viewerIds.length) {
          const { data: profs } = await supabase
            .from("customer_profiles")
            .select("id, email")
            .in("id", viewerIds.slice(0, 1000));
          const emailToViewer: Record<string, string> = {};
          for (const p of profs ?? []) emailToViewer[String(p.email).toLowerCase()] = String(p.id);
          const emails = Object.keys(emailToViewer);
          if (emails.length) {
            const { data: custs } = await supabase
              .from("customers")
              .select("id, email")
              .eq("shop_slug", shop)
              .in("email", emails);
            const custToViewer: Record<string, string> = {};
            for (const c of custs ?? []) custToViewer[String(c.id)] = emailToViewer[String(c.email).toLowerCase()];
            const seen = new Set<string>();
            for (const row of allCheckins || []) {
              const viewer = custToViewer[row.customer_id as string];
              if (!viewer || seen.has(viewer)) continue;
              const fv = firstView[viewer];
              const limit = new Date(fv + "T00:00:00Z");
              limit.setUTCDate(limit.getUTCDate() + 7);
              const cd = row.checkin_date as string;
              if (cd >= fv && cd <= limit.toISOString().slice(0, 10)) seen.add(viewer);
            }
            visited = seen.size;
          }
        }
        views = {
          views: vr.length,
          unique_viewers: viewerIds.length,
          viewed_then_visited: visited,
          sources: Object.entries(sourceCounts)
            .map(([source, count]) => ({ source, count }))
            .sort((a, b) => b.count - a.count),
        };
      }
    } catch {}

    // ── Visit ratings (optional thumbs up/down after a check-in) ──
    // Anonymous: notes are shown without names, and nothing at all until
    // there are enough ratings that no one can be singled out.
    let ratings: {
      count: number;
      positive_pct: number | null;
      notes: { text: string; date: string }[];
      min_to_show: number;
    } | null = null;
    try {
      const { data: ratingRows, error: ratingErr } = await supabase
        .from("visit_ratings")
        .select("rating, note, created_at")
        .eq("shop_slug", shop)
        .gte("created_at", `${startDate}T00:00:00Z`)
        .lte("created_at", `${endDate}T23:59:59Z`)
        .order("created_at", { ascending: false })
        .limit(5000);
      if (!ratingErr) {
        const rs = ratingRows ?? [];
        const enough = rs.length >= RATINGS_MIN_TO_SHOW;
        ratings = {
          count: rs.length,
          positive_pct: enough
            ? Math.round((rs.filter((r) => r.rating === 1).length / rs.length) * 100)
            : null,
          notes: enough
            ? rs
                .filter((r) => r.note)
                .slice(0, 5)
                .map((r) => ({ text: String(r.note), date: String(r.created_at).slice(0, 10) }))
            : [],
          min_to_show: RATINGS_MIN_TO_SHOW,
        };
      }
    } catch {}

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
      rewards_earned,
      rewards_redeemed,
      rewards_earned_period: rewardsEarnedInPeriod,
      rewards_redeemed_period: rewardsRedeemedInPeriod,
      rewards_pending_period: rewardsPendingInPeriod,
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
      spend,
      last_promo: lastPromo,
      on_ventzon: onVentzon,
      ratings,
      views,
      month,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const CACHE_TTL_HOURS = 24;

export async function GET(req: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI not configured" }, { status: 500 });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    // Auth
    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const url = new URL(req.url);
    const shopSlug = String(url.searchParams.get("shop_slug") ?? "").trim().toLowerCase();
    const forceRefresh = url.searchParams.get("refresh") === "1";

    if (!shopSlug) return NextResponse.json({ error: "Missing shop_slug" }, { status: 400 });

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify ownership
    const { data: shop, error: shopErr } = await supabase
      .from("shops")
      .select("id, slug, user_id, ai_insight_text, ai_insight_generated_at")
      .eq("slug", shopSlug)
      .eq("user_id", user.id)
      .maybeSingle();

    if (shopErr || !shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    // Check cache (skip on forceRefresh)
    if (!forceRefresh && shop.ai_insight_text && shop.ai_insight_generated_at) {
      const generatedAt = new Date(shop.ai_insight_generated_at);
      const ageHours = (Date.now() - generatedAt.getTime()) / (1000 * 60 * 60);
      if (ageHours < CACHE_TTL_HOURS) {
        return NextResponse.json({
          ok: true,
          insight: shop.ai_insight_text,
          cached: true,
          generated_at: shop.ai_insight_generated_at,
        });
      }
    }

    /* ── Build data summary ── */
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    // Get Monday of this week and last week
    const dayOfWeek = now.getDay(); // 0=Sun
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const thisMonday = new Date(now);
    thisMonday.setDate(now.getDate() - daysToMonday);
    const thisMondayStr = thisMonday.toISOString().slice(0, 10);

    const lastMonday = new Date(thisMonday);
    lastMonday.setDate(thisMonday.getDate() - 7);
    const lastMondayStr = lastMonday.toISOString().slice(0, 10);
    const lastSundayStr = new Date(thisMonday.getTime() - 86400000).toISOString().slice(0, 10);

    // 30 days ago for lapsed + slowest day calc
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10);

    // Fetch checkins for the last 30 days (enough to cover both weeks + slowest day)
    const { data: recentCheckins, error: checkinsErr } = await supabase
      .from("checkins")
      .select("customer_id, checkin_date")
      .eq("shop_slug", shopSlug)
      .gte("checkin_date", thirtyDaysAgoStr)
      .lte("checkin_date", todayStr);

    if (checkinsErr) {
      return NextResponse.json({ error: checkinsErr.message }, { status: 500 });
    }

    const checkins = recentCheckins ?? [];

    // This week vs last week counts
    let thisWeek = 0;
    let lastWeek = 0;
    const dayOfWeekCounts: number[] = [0, 0, 0, 0, 0, 0, 0];
    const lastSeenByCustomer: Record<string, string> = {};

    for (const row of checkins) {
      const date = row.checkin_date as string;
      const cid = row.customer_id as string;

      if (date >= thisMondayStr && date <= todayStr) thisWeek++;
      if (date >= lastMondayStr && date <= lastSundayStr) lastWeek++;

      const dow = new Date(date + "T12:00:00").getDay();
      dayOfWeekCounts[dow]++;

      if (!lastSeenByCustomer[cid] || date > lastSeenByCustomer[cid]) {
        lastSeenByCustomer[cid] = date;
      }
    }

    // Lapsed: need all-time last-seen, so fetch customers table directly
    const { data: customerRows } = await supabase
      .from("customers")
      .select("id, last_checkin_date")
      .eq("shop_slug", shopSlug);

    let lapsedCount = 0;
    for (const c of customerRows ?? []) {
      const last = c.last_checkin_date as string | null;
      if (last && last < thirtyDaysAgoStr) lapsedCount++;
    }

    // Slowest day from past 30 days (day with fewest check-ins, excluding days with 0 data)
    let slowestDayIdx = -1;
    let slowestCount = Infinity;
    for (let i = 0; i < 7; i++) {
      if (dayOfWeekCounts[i] > 0 && dayOfWeekCounts[i] < slowestCount) {
        slowestCount = dayOfWeekCounts[i];
        slowestDayIdx = i;
      }
    }
    const slowestDay = slowestDayIdx >= 0 ? DAY_LABELS[slowestDayIdx] : null;

    const dataSummary = {
      thisWeek,
      lastWeek,
      weekChange: lastWeek > 0
        ? `${thisWeek >= lastWeek ? "+" : ""}${Math.round(((thisWeek - lastWeek) / lastWeek) * 100)}%`
        : null,
      slowestDay,
      lapsedCount,
      totalCustomers: (customerRows ?? []).length,
    };

    // If not enough data, return a helpful fallback without calling the API
    if (thisWeek + lastWeek < 3) {
      const fallback = "Check back after more customers visit — insights will appear once you have a week of check-in data.";
      return NextResponse.json({ ok: true, insight: fallback, cached: false, generated_at: null });
    }

    /* ── Call Anthropic ── */
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 150,
        system:
          "You are a helpful business advisor for a small independent retail store. Based on check-in data, give one specific, actionable insight in 1-2 sentences. Be direct, encouraging, and concrete. Never be generic. Do not start with 'Based on your data' or similar openers.",
        messages: [
          {
            role: "user",
            content: `Here is this week's data: ${JSON.stringify(dataSummary)}. What's the most important thing for this merchant to know or do?`,
          },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error("[ai/insights] Anthropic error:", anthropicRes.status, errText);
      return NextResponse.json({ error: "AI unavailable" }, { status: 502 });
    }

    const aiData = await anthropicRes.json();
    const insightText: string = aiData?.content?.[0]?.text?.trim() ?? "";

    if (!insightText) {
      return NextResponse.json({ error: "Empty AI response" }, { status: 500 });
    }

    /* ── Write to cache ── */
    const generatedAt = new Date().toISOString();
    await supabase
      .from("shops")
      .update({ ai_insight_text: insightText, ai_insight_generated_at: generatedAt })
      .eq("slug", shopSlug);

    return NextResponse.json({ ok: true, insight: insightText, cached: false, generated_at: generatedAt });
  } catch (e: any) {
    console.error("[ai/insights] exception:", e);
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}

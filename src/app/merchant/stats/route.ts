import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server misconfigured: missing Supabase env vars." },
        { status: 500 }
      );
    }

    const url = new URL(req.url);
    const shop_slug = String(url.searchParams.get("shop_slug") ?? "")
      .trim()
      .toLowerCase();

    if (!shop_slug) {
      return NextResponse.json({ error: "Missing shop_slug" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Start of today's date in UTC (simple + works well enough for MVP)
    const now = new Date();
    const startOfTodayUTC = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0)
    ).toISOString();

    // Total signups for this shop
    const totalRes = await supabase
      .from("signups")
      .select("id", { count: "exact", head: true })
      .eq("shop_slug", shop_slug);

    if (totalRes.error) {
      return NextResponse.json({ error: totalRes.error.message }, { status: 500 });
    }

    // Today's signups + latest numbers
    const todayRes = await supabase
      .from("signups")
      .select("phone, created_at")
      .eq("shop_slug", shop_slug)
      .gte("created_at", startOfTodayUTC)
      .order("created_at", { ascending: false })
      .limit(50);

    if (todayRes.error) {
      return NextResponse.json({ error: todayRes.error.message }, { status: 500 });
    }

    return NextResponse.json({
      shop_slug,
      totals: {
        total: totalRes.count ?? 0,
        today: todayRes.data?.length ?? 0,
      },
      latest: todayRes.data ?? [],
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unknown server error" },
      { status: 500 }
    );
  }
}
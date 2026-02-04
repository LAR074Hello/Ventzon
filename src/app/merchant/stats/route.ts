import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
    const shop_slug = String(url.searchParams.get("shop_slug") ?? "")
      .trim()
      .toLowerCase();

    if (!shop_slug) {
      return NextResponse.json(
        { error: "Missing shop_slug" },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();
    const startOfTodayUTC = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        0, 0, 0
      )
    ).toISOString();

    const totalRes = await supabase
      .from("signups")
      .select("id", { count: "exact", head: true })
      .eq("shop_slug", shop_slug);

    const todayRes = await supabase
      .from("signups")
      .select("id", { count: "exact", head: true })
      .eq("shop_slug", shop_slug)
      .gte("created_at", startOfTodayUTC);

    const latestRes = await supabase
      .from("signups")
      .select("phone, created_at")
      .eq("shop_slug", shop_slug)
      .order("created_at", { ascending: false })
      .limit(10);

    return NextResponse.json({
      shop_slug,
      totals: {
        total: totalRes.count ?? 0,
        today: todayRes.count ?? 0,
      },
      latest: latestRes.data ?? [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
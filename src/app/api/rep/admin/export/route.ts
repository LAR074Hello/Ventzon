import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = ["lukerichards@ventzon.com", "lukerichardsschool@gmail.com"];
const MONTHLY_FLAT = 25;
const PER_REWARD = 1.25;
const COMMISSION_RATE = 0.20;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data: reps } = await admin.from("rep_profiles").select("*").order("created_at");
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthName = now.toLocaleString("default", { month: "long", year: "numeric" });

    const rows: string[] = [];

    // ── Sheet 1: Reps summary ──
    rows.push("REPS SUMMARY");
    rows.push(`"Name","Email","City","Joined","Total Merchants","Active Pro","Commission (${monthName})"`);

    for (const rep of reps ?? []) {
      const { data: shops } = await admin
        .from("shops")
        .select("slug, plan_type, subscription_status")
        .eq("rep_id", rep.id);

      const myShops = shops ?? [];
      const activePro = myShops.filter(s => s.plan_type === "pro" && s.subscription_status === "active").length;
      const slugs = myShops.map(s => s.slug);

      let rewardCount = 0;
      if (slugs.length > 0) {
        const { count } = await admin
          .from("reward_events")
          .select("id", { count: "exact", head: true })
          .in("shop_slug", slugs)
          .gte("reward_date", monthStart);
        rewardCount = count ?? 0;
      }

      const commission = (activePro * MONTHLY_FLAT * COMMISSION_RATE) + (rewardCount * PER_REWARD * COMMISSION_RATE);

      rows.push([
        `"${rep.full_name}"`,
        `"${rep.email}"`,
        `"${rep.city ?? ""}"`,
        `"${new Date(rep.created_at).toLocaleDateString()}"`,
        myShops.length,
        activePro,
        `"$${commission.toFixed(2)}"`,
      ].join(","));
    }

    rows.push("");
    rows.push("");

    // ── Sheet 2: All merchants ──
    rows.push("ALL MERCHANTS");
    rows.push(`"Business Name","Slug","Plan","Status","Rep Name","Rep Email","Claimed Date","Rewards This Month","Commission This Month"`);

    const { data: allShops } = await admin
      .from("shops")
      .select("slug, plan_type, subscription_status, rep_id, rep_claimed_at")
      .order("rep_claimed_at", { ascending: false });

    const repMap = Object.fromEntries((reps ?? []).map(r => [r.id, r]));

    const slugs = (allShops ?? []).map(s => s.slug);
    const { data: allSettings } = slugs.length > 0
      ? await admin.from("shop_settings").select("shop_slug, shop_name").in("shop_slug", slugs)
      : { data: [] };
    const nameMap = Object.fromEntries((allSettings ?? []).map(s => [s.shop_slug, s.shop_name]));

    const { data: allRewards } = slugs.length > 0
      ? await admin.from("reward_events").select("shop_slug").in("shop_slug", slugs).gte("reward_date", monthStart)
      : { data: [] };
    const rewardCounts: Record<string, number> = {};
    for (const r of allRewards ?? []) rewardCounts[r.shop_slug] = (rewardCounts[r.shop_slug] ?? 0) + 1;

    for (const shop of allShops ?? []) {
      const rep = shop.rep_id ? repMap[shop.rep_id] : null;
      const isPro = shop.plan_type === "pro" && shop.subscription_status === "active";
      const rewards = rewardCounts[shop.slug] ?? 0;
      const commission = isPro
        ? (MONTHLY_FLAT * COMMISSION_RATE) + (rewards * PER_REWARD * COMMISSION_RATE)
        : rewards * PER_REWARD * COMMISSION_RATE;

      rows.push([
        `"${nameMap[shop.slug] ?? shop.slug}"`,
        `"${shop.slug}"`,
        `"${shop.plan_type}"`,
        `"${shop.subscription_status ?? "inactive"}"`,
        `"${rep?.full_name ?? "—"}"`,
        `"${rep?.email ?? "—"}"`,
        `"${shop.rep_claimed_at ? new Date(shop.rep_claimed_at).toLocaleDateString() : "—"}"`,
        rewards,
        `"$${commission.toFixed(2)}"`,
      ].join(","));
    }

    const csv = rows.join("\n");
    const filename = `ventzon-reps-${now.toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return new NextResponse(err.message, { status: 500 });
  }
}

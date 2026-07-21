import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// GET /api/customer/leaderboard — this month's "top explorers", ranked by
// distinct businesses visited (tiebreak: total check-ins). Strictly
// opt-in: only creators (public by choice) who haven't hidden themselves
// via show_on_leaderboard appear. App-wide for now — scoping to a
// neighborhood needs a locality model that doesn't exist yet.
export async function GET() {
  try {
    const admin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: optedIn } = await admin
      .from("customer_profiles")
      .select("id, email, display_name, avatar_url")
      .eq("is_creator", true)
      .eq("show_on_leaderboard", true);
    const profiles = optedIn ?? [];
    if (profiles.length === 0) return NextResponse.json({ leaders: [] });

    const { data: memberRows } = await admin
      .from("customers")
      .select("id, email")
      .in("email", profiles.map((p) => p.email));
    const customerToEmail: Record<string, string> = {};
    for (const m of memberRows ?? []) customerToEmail[m.id] = m.email;
    const customerIds = Object.keys(customerToEmail);
    if (customerIds.length === 0) return NextResponse.json({ leaders: [] });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { data: checkins } = await admin
      .from("checkins")
      .select("customer_id, shop_slug")
      .in("customer_id", customerIds)
      .gte("created_at", monthStart)
      .limit(10000);

    const byEmail: Record<string, { shops: Set<string>; total: number }> = {};
    for (const c of checkins ?? []) {
      const email = customerToEmail[c.customer_id];
      if (!email) continue;
      const entry = (byEmail[email] ??= { shops: new Set(), total: 0 });
      entry.shops.add(c.shop_slug);
      entry.total++;
    }

    const leaders = profiles
      .map((p) => ({
        profile_id: p.id,
        display_name: p.display_name ?? "Explorer",
        avatar_url: p.avatar_url,
        places: byEmail[p.email]?.shops.size ?? 0,
        checkins: byEmail[p.email]?.total ?? 0,
      }))
      .filter((l) => l.checkins > 0)
      .sort((a, b) => b.places - a.places || b.checkins - a.checkins)
      .slice(0, 10);

    // An empty or near-empty leaderboard signals a dead app. Below the
    // density threshold it simply doesn't exist yet.
    const MIN_LEADERS = 5;
    return NextResponse.json({
      leaders: leaders.length >= MIN_LEADERS ? leaders : [],
      period_label: now.toLocaleDateString("en-US", { month: "long" }),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

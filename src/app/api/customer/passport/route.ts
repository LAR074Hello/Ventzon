import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// GET /api/customer/passport — the monthly "local passport": visit N new
// spots this month to unlock the Explorer stamp. Computed live from
// customers.first_seen_at (a row is created the first time someone joins
// a shop), so there is nothing to maintain and nothing to expire. When a
// month ends incomplete it simply starts fresh — no penalty, no streak.

const PASSPORT_GOAL = 3;

export async function GET() {
  try {
    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data: newSpots, error } = await admin
      .from("customers")
      .select("shop_slug, first_seen_at")
      .eq("email", user.email.toLowerCase())
      .gte("first_seen_at", monthStart);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const slugs = (newSpots ?? []).map((s) => s.shop_slug);
    const { data: settings } = slugs.length
      ? await admin
          .from("shop_settings")
          .select("shop_slug, shop_name")
          .in("shop_slug", slugs)
      : { data: [] };
    const nameMap: Record<string, string> = {};
    for (const s of settings ?? []) nameMap[s.shop_slug] = s.shop_name ?? s.shop_slug;

    const count = (newSpots ?? []).length;
    return NextResponse.json({
      passport: {
        period_label: now.toLocaleDateString("en-US", { month: "long" }),
        goal: PASSPORT_GOAL,
        visited_new: Math.min(count, PASSPORT_GOAL),
        total_new: count,
        unlocked: count >= PASSPORT_GOAL,
        spots: (newSpots ?? []).map((s) => ({
          shop_slug: s.shop_slug,
          shop_name: nameMap[s.shop_slug] ?? s.shop_slug,
        })),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

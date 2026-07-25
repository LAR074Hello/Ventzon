import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// GET /api/merchant/customer-checkins?shop_slug=X&customer_id=Y
// Returns the full check-in history for a customer (for the detail modal).

export async function GET(req: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const url = new URL(req.url);
    const shopSlug = url.searchParams.get("shop_slug")?.trim().toLowerCase() ?? "";
    const customerId = url.searchParams.get("customer_id")?.trim() ?? "";

    if (!shopSlug || !customerId) {
      return NextResponse.json({ error: "Missing shop_slug or customer_id" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify ownership
    const { data: shop } = await supabase
      .from("shops")
      .select("slug")
      .eq("slug", shopSlug)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

    // Verify customer belongs to this shop
    const { data: customer } = await supabase
      .from("customers")
      .select("id, phone, email, visits, last_checkin_date, opted_out, created_at")
      .eq("id", customerId)
      .eq("shop_slug", shopSlug)
      .maybeSingle();
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    // Fetch check-in history
    const { data: checkins, error } = await supabase
      .from("checkins")
      .select("checkin_date, created_at")
      .eq("customer_id", customerId)
      .eq("shop_slug", shopSlug)
      .order("checkin_date", { ascending: false })
      .limit(200);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Fetch reward events
    const { data: rewards } = await supabase
      .from("reward_events")
      .select("reward_date, is_redeemed, redeemed_at")
      .eq("customer_id", customerId)
      .eq("shop_slug", shopSlug)
      .order("reward_date", { ascending: false })
      .limit(50);

    return NextResponse.json({
      customer,
      checkins: checkins ?? [],
      rewards: rewards ?? [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

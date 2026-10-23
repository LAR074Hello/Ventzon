import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { computeAudience } from "@/lib/audience-aggregate";

export const dynamic = "force-dynamic";

// GET /api/merchant/audience?shop=<slug> → totals-only audience profile.
export async function GET(req: Request) {
  try {
    const shop = String(new URL(req.url).searchParams.get("shop") ?? "").trim().toLowerCase();
    if (!shop) return NextResponse.json({ error: "Missing shop" }, { status: 400 });

    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: shopRow } = await supabase
      .from("shops")
      .select("is_paid")
      .eq("slug", shop)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!shopRow) return NextResponse.json({ error: "Shop not found or you don't own it" }, { status: 403 });
    if (!shopRow.is_paid) return NextResponse.json({ error: "Subscription required" }, { status: 403 });

    try {
      return NextResponse.json(await computeAudience(supabase, shop));
    } catch {
      // Columns not migrated yet: report as not enough answers.
      return NextResponse.json({ available: false, respondents: 0, needed: 10 });
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 });
  }
}

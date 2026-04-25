import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user?.email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const shop_slug = searchParams.get("shop_slug");
    if (!shop_slug) return NextResponse.json({ error: "Missing shop_slug" }, { status: 400 });

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("shop_slug", shop_slug)
      .eq("email", user.email.toLowerCase())
      .maybeSingle();

    if (!customer) return NextResponse.json({ history: [] });

    const { data: checkins, error } = await supabase
      .from("checkins")
      .select("checkin_date, created_at")
      .eq("customer_id", customer.id)
      .eq("shop_slug", shop_slug)
      .order("checkin_date", { ascending: false })
      .limit(30);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ history: checkins ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

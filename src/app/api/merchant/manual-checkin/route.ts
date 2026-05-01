import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json();
    const shopSlug = String(body.shop_slug ?? "").trim().toLowerCase();
    const contact = String(body.contact ?? "").trim().toLowerCase();

    if (!shopSlug || !contact) {
      return NextResponse.json({ error: "Missing shop_slug or contact" }, { status: 400 });
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // Verify ownership
    const { data: shop } = await supabase.from("shops").select("slug").eq("slug", shopSlug).eq("user_id", user.id).maybeSingle();
    if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

    // Get reward goal
    const { data: settings } = await supabase
      .from("shop_settings")
      .select("reward_goal")
      .eq("shop_slug", shopSlug)
      .maybeSingle();
    const goal = Number(settings?.reward_goal ?? 5);

    // Detect phone vs email
    const isEmail = contact.includes("@");
    const isPhone = /^\+?[\d\s\-()]{7,}$/.test(contact);
    if (!isEmail && !isPhone) {
      return NextResponse.json({ error: "Enter a valid phone number or email address" }, { status: 400 });
    }

    // Normalize phone to E.164
    let phone: string | null = null;
    let email: string | null = null;
    if (isEmail) {
      email = contact;
    } else {
      const digits = contact.replace(/\D/g, "");
      phone = digits.length === 10 ? `+1${digits}` : `+${digits}`;
    }

    const today = new Date().toISOString().slice(0, 10);

    // Find or create customer
    let query = supabase.from("customers").select("id, visits, last_checkin_date").eq("shop_slug", shopSlug);
    if (email) query = query.eq("email", email);
    else query = query.eq("phone", phone!);

    const { data: existing } = await query.maybeSingle();

    if (existing) {
      // Prevent double stamp on same day
      if (existing.last_checkin_date === today) {
        return NextResponse.json({
          error: "This customer already has a stamp for today.",
          visits: existing.visits,
          goal,
        }, { status: 409 });
      }

      const newVisits = (existing.visits ?? 0) + 1;
      const isReward = newVisits % goal === 0;
      const { error } = await supabase
        .from("customers")
        .update({ visits: newVisits, last_checkin_date: today })
        .eq("id", existing.id);
      if (error) throw error;

      return NextResponse.json({
        ok: true,
        status: isReward ? "reward" : "progress",
        visits: newVisits,
        goal,
        remaining: isReward ? goal : goal - (newVisits % goal),
        new_customer: false,
      });
    } else {
      // New customer
      const { error } = await supabase.from("customers").insert({
        shop_slug: shopSlug,
        phone: phone ?? null,
        email: email ?? null,
        visits: 1,
        last_checkin_date: today,
      });
      if (error) throw error;

      return NextResponse.json({
        ok: true,
        status: "progress",
        visits: 1,
        goal,
        remaining: goal - 1,
        new_customer: true,
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

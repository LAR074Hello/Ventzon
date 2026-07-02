import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { normalizeMode, earnedForCheckin, applyReward } from "@/lib/reward";

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

    // Get reward configuration
    const { data: settings } = await supabase
      .from("shop_settings")
      .select("reward_goal, reward_mode, points_per_visit")
      .eq("shop_slug", shopSlug)
      .maybeSingle();
    const goal = Number(settings?.reward_goal ?? 5);
    const mode = normalizeMode(settings?.reward_mode);
    const pointsPerVisit = Number(settings?.points_per_visit ?? 10);
    const unit = mode === "points" ? "points" : "stamps";

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
    const earned = earnedForCheckin({ mode, pointsPerVisit, isBonusDay: false });

    // Find or create customer
    let query = supabase
      .from("customers")
      .select("id, visits, last_checkin_date")
      .eq("shop_slug", shopSlug);
    if (email) query = query.eq("email", email);
    else query = query.eq("phone", phone!);

    const { data: existing } = await query.maybeSingle();

    if (existing) {
      // One check-in per day (both modes)
      if (existing.last_checkin_date === today) {
        return NextResponse.json({
          error: mode === "points" ? "This customer already checked in today." : "This customer already has a stamp for today.",
          visits: existing.visits,
          goal,
          mode,
          unit,
        }, { status: 409 });
      }

      const { newBalance, hitGoal } = applyReward({
        mode,
        currentBalance: Number(existing.visits ?? 0),
        goal,
        earned,
      });

      const { error } = await supabase
        .from("customers")
        .update({ visits: newBalance, last_checkin_date: today, last_seen_at: new Date().toISOString() })
        .eq("id", existing.id);
      if (error) throw error;

      await recordCheckin(supabase, shopSlug, existing.id, today);
      if (hitGoal) await recordReward(supabase, shopSlug, existing.id, today);

      return NextResponse.json({
        ok: true,
        status: hitGoal ? "reward" : "progress",
        visits: newBalance,
        goal,
        earned,
        mode,
        unit,
        remaining: hitGoal ? 0 : Math.max(goal - newBalance, 0),
        new_customer: false,
      });
    } else {
      // New customer
      const { newBalance, hitGoal } = applyReward({ mode, currentBalance: 0, goal, earned });

      const { data: inserted, error } = await supabase
        .from("customers")
        .insert({
          shop_slug: shopSlug,
          phone: phone ?? null,
          email: email ?? null,
          visits: newBalance,
          last_checkin_date: today,
          first_seen_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (error) throw error;

      if (inserted?.id) {
        await recordCheckin(supabase, shopSlug, inserted.id, today);
        if (hitGoal) await recordReward(supabase, shopSlug, inserted.id, today);
      }

      return NextResponse.json({
        ok: true,
        status: hitGoal ? "reward" : "progress",
        visits: newBalance,
        goal,
        earned,
        mode,
        unit,
        remaining: hitGoal ? 0 : Math.max(goal - newBalance, 0),
        new_customer: true,
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

// Record a checkins row (non-fatal). A unique (customer_id, checkin_date)
// index enforces one foot-traffic row per day.
async function recordCheckin(supabase: any, shopSlug: string, customerId: string, date: string) {
  try {
    await supabase.from("checkins").insert({
      shop_slug: shopSlug,
      customer_id: customerId,
      checkin_date: date,
      created_at: new Date().toISOString(),
    });
  } catch {
    /* non-fatal */
  }
}

async function recordReward(supabase: any, shopSlug: string, customerId: string, date: string) {
  try {
    await supabase.from("reward_events").insert({
      shop_slug: shopSlug,
      customer_id: customerId,
      reward_date: date,
    });
  } catch {
    /* non-fatal */
  }
}

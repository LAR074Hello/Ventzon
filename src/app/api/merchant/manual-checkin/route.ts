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
    const amountRaw = body.amount;

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
      .select("reward_goal, reward_mode, points_per_dollar")
      .eq("shop_slug", shopSlug)
      .maybeSingle();
    const goal = Number(settings?.reward_goal ?? 5);
    const mode = normalizeMode(settings?.reward_mode);
    const pointsPerDollar = Number(settings?.points_per_dollar ?? 1);

    // Points mode requires a positive dollar amount
    let amount = 0;
    if (mode === "points") {
      amount = Number(amountRaw);
      if (!Number.isFinite(amount) || amount <= 0) {
        return NextResponse.json(
          { error: "Enter the purchase amount to award points." },
          { status: 400 }
        );
      }
    }

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
    const earned = earnedForCheckin({ mode, amount, pointsPerDollar, isBonusDay: false });

    // Find or create customer
    let query = supabase
      .from("customers")
      .select("id, visits, last_checkin_date, total_spend")
      .eq("shop_slug", shopSlug);
    if (email) query = query.eq("email", email);
    else query = query.eq("phone", phone!);

    const { data: existing } = await query.maybeSingle();

    // Shared helper: label the balance for the response
    const unit = mode === "points" ? "points" : "stamps";

    if (existing) {
      // In stamps mode, enforce one stamp per day. In points mode a
      // customer can make multiple purchases in a day, so allow it.
      if (mode === "stamps" && existing.last_checkin_date === today) {
        return NextResponse.json({
          error: "This customer already has a stamp for today.",
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
        .update({
          visits: newBalance,
          last_checkin_date: today,
          total_spend: Number(existing.total_spend ?? 0) + amount,
          last_seen_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      if (error) throw error;

      await recordCheckin(supabase, shopSlug, existing.id, today, amount);
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
      const { newBalance, hitGoal } = applyReward({
        mode,
        currentBalance: 0,
        goal,
        earned,
      });

      const { data: inserted, error } = await supabase
        .from("customers")
        .insert({
          shop_slug: shopSlug,
          phone: phone ?? null,
          email: email ?? null,
          visits: newBalance,
          last_checkin_date: today,
          total_spend: amount,
          first_seen_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (error) throw error;

      if (inserted?.id) {
        await recordCheckin(supabase, shopSlug, inserted.id, today, amount);
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

// Record a checkins row (non-fatal — do not block the stamp/point on failure).
// In stamps mode a unique (shop,customer,date) index may reject a duplicate;
// that's fine and expected.
async function recordCheckin(
  supabase: any,
  shopSlug: string,
  customerId: string,
  date: string,
  amount: number
) {
  // checkin_date stays a clean YYYY-MM-DD for analytics. A unique index on
  // (customer_id, checkin_date) means only one foot-traffic row lands per day;
  // additional same-day points purchases still accrue to the customer's
  // balance and total_spend, so revenue is captured there.
  try {
    await supabase.from("checkins").insert({
      shop_slug: shopSlug,
      customer_id: customerId,
      checkin_date: date,
      created_at: new Date().toISOString(),
      amount: amount > 0 ? amount : null,
    });
  } catch {
    /* non-fatal — duplicate same-day row is expected in points mode */
  }
}

async function recordReward(
  supabase: any,
  shopSlug: string,
  customerId: string,
  date: string
) {
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

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { sendEmail, buildBirthdayEmail } from "@/lib/resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/cron/birthdays
// Runs daily. For every shop with birthday rewards enabled, finds
// customers whose birthday is `birthday_days_before` days from today,
// issues them a reward through the same path a check-in reward uses
// (a reward_events row + a Stripe "reward_redeemed" meter event), and
// emails them. Idempotent: birthday_reward_sends is unique on
// (customer_id, reward_year), so each customer gets at most one
// birthday reward per shop per year no matter how often this runs.

export async function GET(req: Request) {
  // Auth: require CRON_SECRET when set (Vercel Cron sends it as a Bearer token)
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const stripe = stripeKey ? new Stripe(stripeKey) : null;

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  try {
    // 1. Shops with birthday rewards enabled + their config.
    const { data: settings, error: settingsErr } = await supabase
      .from("shop_settings")
      .select(
        "shop_slug, shop_name, birthday_enabled, birthday_reward_title, birthday_days_before, birthday_expiry_days, birthday_message"
      )
      .eq("birthday_enabled", true);

    if (settingsErr) return NextResponse.json({ error: settingsErr.message }, { status: 500 });
    if (!settings?.length) {
      return NextResponse.json({ ok: true, shops: 0, rewards: 0, note: "No shops with birthday rewards enabled" });
    }

    // Billing info for those shops (plan_type + stripe_customer_id).
    const slugs = settings.map((s: any) => s.shop_slug);
    const { data: shopRows } = await supabase
      .from("shops")
      .select("slug, plan_type, stripe_customer_id")
      .in("slug", slugs);
    const billingBySlug: Record<string, any> = {};
    for (const s of shopRows ?? []) billingBySlug[(s as any).slug] = s;

    let totalRewards = 0;
    let totalEmails = 0;
    const perShop: Array<{ shop: string; issued: number }> = [];

    for (const cfg of settings as any[]) {
      const rewardTitle = String(cfg.birthday_reward_title ?? "").trim() || "A birthday treat";
      const daysBefore = Number(cfg.birthday_days_before ?? 0);

      // The birthday we're celebrating today = today + daysBefore.
      const target = new Date(today);
      target.setDate(target.getDate() + daysBefore);
      const targetMonth = target.getMonth() + 1;
      const targetDay = target.getDate();
      const rewardYear = target.getFullYear();

      // 2. Customers at this shop with that birthday, reachable by email, opted in.
      const { data: customers } = await supabase
        .from("customers")
        .select("id, email")
        .eq("shop_slug", cfg.shop_slug)
        .eq("birth_month", targetMonth)
        .eq("birth_day", targetDay)
        .eq("opted_out", false)
        .not("email", "is", null);

      let issued = 0;

      for (const cust of customers ?? []) {
        const customerId = (cust as any).id as string;
        const email = (cust as any).email as string;
        if (!email) continue;

        // 3. Claim the idempotency guard FIRST. If it conflicts, this
        //    customer already got their birthday reward this year — skip.
        const { data: claim, error: claimErr } = await supabase
          .from("birthday_reward_sends")
          .insert({ shop_slug: cfg.shop_slug, customer_id: customerId, reward_year: rewardYear })
          .select("id")
          .single();

        if (claimErr || !claim) continue; // unique violation = already sent

        // 4. Issue the reward exactly like a check-in reward does.
        let rewardEventId: string | null = null;
        try {
          const { data: rewardRow, error: rewardErr } = await supabase
            .from("reward_events")
            .insert({ shop_slug: cfg.shop_slug, customer_id: customerId, reward_date: todayStr })
            .select("id")
            .single();
          if (rewardErr) throw rewardErr;
          rewardEventId = (rewardRow as any)?.id ?? null;
        } catch (rewardErr: any) {
          // Reward couldn't be issued — release the guard so a later run retries.
          await supabase.from("birthday_reward_sends").delete().eq("id", (claim as any).id);
          console.error("[cron/birthdays] reward insert failed:", rewardErr?.message);
          continue;
        }

        issued++;
        totalRewards++;

        // 5. Report metered usage to Stripe (same rule as the check-in path).
        const billing = billingBySlug[cfg.shop_slug];
        if (stripe && billing && ["free", "pro"].includes(billing.plan_type) && billing.stripe_customer_id) {
          try {
            await stripe.billing.meterEvents.create({
              event_name: "reward_redeemed",
              payload: { stripe_customer_id: billing.stripe_customer_id, value: "1" },
            });
          } catch (usageErr: any) {
            console.error("[cron/birthdays] Stripe usage reporting failed:", usageErr?.message);
          }
        }

        // 6. Email the customer (non-fatal).
        let emailed = false;
        try {
          const html = buildBirthdayEmail({
            shopName: cfg.shop_name || cfg.shop_slug,
            rewardTitle,
            message: cfg.birthday_message || undefined,
            expiresDays: cfg.birthday_expiry_days ?? null,
          });
          await sendEmail(
            email,
            `Happy birthday from ${cfg.shop_name || cfg.shop_slug} 🎂`,
            `Happy birthday! ${cfg.shop_name || cfg.shop_slug} has a gift for you: ${rewardTitle}. Show this email at the register to redeem.`,
            undefined,
            html
          );
          emailed = true;
          totalEmails++;
        } catch (emailErr: any) {
          console.error("[cron/birthdays] email failed:", email, emailErr?.message);
        }

        // 7. Record the outcome on the guard row for the audit trail.
        await supabase
          .from("birthday_reward_sends")
          .update({ reward_event_id: rewardEventId, emailed })
          .eq("id", (claim as any).id);
      }

      if (issued > 0) perShop.push({ shop: cfg.shop_slug, issued });
    }

    return NextResponse.json({
      ok: true,
      shops: settings.length,
      rewards: totalRewards,
      emails: totalEmails,
      per_shop: perShop,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

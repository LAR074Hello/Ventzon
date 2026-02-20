import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendSms } from "@/lib/sms";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isE164(phone: string) {
  return /^\+\d{10,15}$/.test(phone);
}

function buildSmsBody(
  template: string | null,
  vars: { shop_name: string; visits: number; reward_goal: number; deal_title: string }
): string {
  const base =
    template ||
    "Thanks for visiting {{shop_name}}! You have {{visits}} visit(s) toward your reward: {{deal_title}} (goal: {{reward_goal}}).";

  return base
    .replace(/{{shop_name}}/g, vars.shop_name)
    .replace(/{{visits}}/g, String(vars.visits))
    .replace(/{{reward_goal}}/g, String(vars.reward_goal))
    .replace(/{{deal_title}}/g, vars.deal_title);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const shop_slug = String(body?.shop_slug ?? "").trim().toLowerCase();
    const phone = String(body?.phone ?? "").trim();
    const pin = String(body?.pin ?? "").trim();

    // --- Validation ---
    if (!shop_slug) {
      return NextResponse.json({ error: "Missing shop_slug" }, { status: 400 });
    }
    if (!isE164(phone)) {
      return NextResponse.json(
        { error: "Invalid phone (must be E.164 like +14105551234)" },
        { status: 400 }
      );
    }
    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: "PIN must be exactly 4 digits" },
        { status: 400 }
      );
    }

    // --- Resolve shop + settings in parallel ---
    const [shopRes, settingsRes] = await Promise.all([
      supabase.from("shops").select("id, is_paid").eq("slug", shop_slug).single(),
      supabase
        .from("shop_settings")
        .select("shop_name, welcome_sms_template, reward_sms_template, reward_goal, deal_title")
        .eq("shop_slug", shop_slug)
        .single(),
    ]);

    if (shopRes.error || !shopRes.data) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }
    if (!shopRes.data.is_paid) {
      return NextResponse.json(
        { error: "This shop does not have an active subscription" },
        { status: 403 }
      );
    }
    if (settingsRes.error || !settingsRes.data) {
      return NextResponse.json({ error: "Shop settings not found" }, { status: 404 });
    }

    const shop = shopRes.data;
    const settings = settingsRes.data;

    // --- Upsert customer (phone is unique per shop) ---
    const { data: customer, error: customerErr } = await supabase
      .from("customers")
      .upsert(
        { shop_id: shop.id, phone, pin },
        { onConflict: "shop_id,phone", ignoreDuplicates: false }
      )
      .select("id, visits, opted_out")
      .single();

    if (customerErr || !customer) {
      return NextResponse.json(
        { error: customerErr?.message ?? "Failed to upsert customer" },
        { status: 500 }
      );
    }

    // --- Increment visits ---
    const newVisits = (customer.visits ?? 0) + 1;
    const { error: visitErr } = await supabase
      .from("customers")
      .update({ visits: newVisits })
      .eq("id", customer.id);

    if (visitErr) {
      return NextResponse.json({ error: visitErr.message }, { status: 500 });
    }

    // --- Log checkin ---
    const { error: checkinErr } = await supabase
      .from("checkins")
      .insert({ shop_id: shop.id, customer_id: customer.id });

    if (checkinErr) {
      // Non-fatal: log and continue
      console.error("checkin insert error:", checkinErr.message);
    }

    // --- Choose SMS template ---
    const rewardGoal: number = settings.reward_goal ?? 10;
    const isReward = newVisits > 0 && newVisits % rewardGoal === 0;

    const smsBody = buildSmsBody(
      isReward ? settings.reward_sms_template : settings.welcome_sms_template,
      {
        shop_name: settings.shop_name ?? shop_slug,
        visits: newVisits,
        reward_goal: rewardGoal,
        deal_title: settings.deal_title ?? "your reward",
      }
    );

    // --- Send SMS (non-blocking on failure) ---
    const smsResult = await sendSms({
      shop_id: shop.id,
      customer_id: customer.id,
      to: phone,
      body: smsBody,
      message_type: "transactional",
    });

    return NextResponse.json({
      ok: true,
      visits: newVisits,
      reward_goal: rewardGoal,
      is_reward: isReward,
      sms: {
        sent: smsResult.ok,
        skipped_opted_out: smsResult.skipped_opted_out ?? false,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

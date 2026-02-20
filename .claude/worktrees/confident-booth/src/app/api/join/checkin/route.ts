/**
 * POST /api/join/checkin
 *
 * QR check-in endpoint. Called when a customer scans a store's QR code.
 *
 * Body: { shop_slug: string; phone: string }
 *
 * Flow:
 *  1. Validate inputs
 *  2. Resolve shop_id from slug
 *  3. Upsert customer row (creates or updates)
 *  4. Increment total_visits
 *  5. Insert checkin row
 *  6. Determine SMS template (reward vs. welcome)
 *  7. Send transactional SMS via src/lib/sms.ts
 */

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { sendSms } from "@/lib/sms";

export const runtime = "nodejs";

function isE164(phone: string) {
  return /^\+\d{10,15}$/.test(phone);
}

/** Replace {{shop_name}}, {{visits}}, {{goal}} tokens in a template string. */
function renderTemplate(
  template: string,
  vars: Record<string, string | number>
) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    key in vars ? String(vars[key]) : `{{${key}}}`
  );
}

export async function POST(req: Request) {
  // --- Parse & validate ---
  const body = await req.json().catch(() => ({}));
  const shop_slug = String(body?.shop_slug ?? "").trim().toLowerCase();
  const phone = String(body?.phone ?? "").trim();

  if (!shop_slug) {
    return NextResponse.json({ error: "Missing shop_slug" }, { status: 400 });
  }
  if (!isE164(phone)) {
    return NextResponse.json(
      { error: "Invalid phone — must be E.164 e.g. +14105551234" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // --- Resolve shop ---
  const { data: shop, error: shopErr } = await supabase
    .from("shops")
    .select("id, slug")
    .eq("slug", shop_slug)
    .single();

  if (shopErr || !shop) {
    return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  }

  const shopId: string = shop.id;

  // --- Load shop settings for SMS templates ---
  const { data: settings } = await supabase
    .from("shop_settings")
    .select(
      "shop_name, reward_goal, welcome_sms_template, reward_sms_template"
    )
    .eq("shop_slug", shop_slug)
    .single();

  const shopName: string = settings?.shop_name ?? shop_slug;
  const rewardGoal: number = settings?.reward_goal ?? 10;
  const welcomeTemplate: string =
    settings?.welcome_sms_template ||
    "Welcome to {{shop_name}}! You've checked in. Visit {{goal}} times to earn your reward.";
  const rewardTemplate: string =
    settings?.reward_sms_template ||
    "Congrats! You've reached {{visits}} visits at {{shop_name}} — you've earned your reward! Show this to redeem.";

  // --- Upsert customer ---
  // On conflict (shop_id, phone) increment visits and update last_checkin_at.
  // Postgres upsert with an expression requires a raw RPC or two-step approach;
  // we use select-then-update for clarity and portability.
  let { data: customer, error: fetchErr } = await supabase
    .from("customers")
    .select("id, total_visits, opted_out")
    .eq("shop_id", shopId)
    .eq("phone", phone)
    .maybeSingle();

  if (fetchErr) {
    console.error("[checkin] customer fetch error", fetchErr);
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  let customerId: string;
  let newVisitCount: number;
  let isNewCustomer = false;

  if (!customer) {
    // First visit — insert
    isNewCustomer = true;
    const { data: inserted, error: insertErr } = await supabase
      .from("customers")
      .insert({
        shop_id: shopId,
        phone,
        total_visits: 1,
        opted_out: false,
        last_checkin_at: new Date().toISOString(),
      })
      .select("id, total_visits")
      .single();

    if (insertErr || !inserted) {
      console.error("[checkin] customer insert error", insertErr);
      return NextResponse.json(
        { error: insertErr?.message ?? "Failed to create customer" },
        { status: 500 }
      );
    }

    customerId = inserted.id;
    newVisitCount = 1;
  } else {
    // Returning customer — increment visits
    customerId = customer.id;
    newVisitCount = (customer.total_visits ?? 0) + 1;

    const { error: updateErr } = await supabase
      .from("customers")
      .update({
        total_visits: newVisitCount,
        last_checkin_at: new Date().toISOString(),
      })
      .eq("id", customerId);

    if (updateErr) {
      console.error("[checkin] customer update error", updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }
  }

  // --- Log checkin ---
  const { data: checkin, error: checkinErr } = await supabase
    .from("checkins")
    .insert({
      shop_id: shopId,
      customer_id: customerId,
      visit_number: newVisitCount,
    })
    .select("id")
    .single();

  if (checkinErr || !checkin) {
    console.error("[checkin] checkin insert error", checkinErr);
    return NextResponse.json(
      { error: checkinErr?.message ?? "Failed to log checkin" },
      { status: 500 }
    );
  }

  const checkinId: string = checkin.id;

  // --- Determine SMS message ---
  const isRewardVisit = newVisitCount % rewardGoal === 0;
  const template = isRewardVisit ? rewardTemplate : welcomeTemplate;
  const smsBody = renderTemplate(template, {
    shop_name: shopName,
    visits: newVisitCount,
    goal: rewardGoal,
  });

  // --- Send transactional SMS (non-blocking on failure) ---
  const smsResult = await sendSms({
    supabase,
    shopId,
    toPhone: phone,
    body: smsBody,
    type: "transactional",
    checkinId,
  });

  if (!smsResult.ok && !smsResult.skipped) {
    console.error("[checkin] SMS failed", smsResult.error);
  }

  return NextResponse.json(
    {
      ok: true,
      customer_id: customerId,
      checkin_id: checkinId,
      visit_number: newVisitCount,
      is_reward_visit: isRewardVisit,
      is_new_customer: isNewCustomer,
      sms: {
        skipped: smsResult.skipped ?? null,
        twilio_sid: smsResult.twilioSid ?? null,
      },
    },
    { status: 200 }
  );
}

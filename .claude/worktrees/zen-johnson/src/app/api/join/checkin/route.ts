import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendSms } from "@/lib/sms";

export const runtime = "nodejs";

function isE164(phone: string) {
  return /^\+\d{10,15}$/.test(phone);
}

function renderTemplate(
  template: string,
  vars: Record<string, string | number>
) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    key in vars ? String(vars[key]) : `{{${key}}}`
  );
}

export async function POST(req: Request) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json().catch(() => ({}));
    const shop_slug = String(body?.shop_slug || "").trim().toLowerCase();
    const phone = String(body?.phone || "").trim();

    if (!shop_slug) {
      return NextResponse.json({ error: "Missing shop_slug" }, { status: 400 });
    }
    if (!isE164(phone)) {
      return NextResponse.json(
        { error: "Invalid phone (must be E.164 like +14105551234)" },
        { status: 400 }
      );
    }

    // --- Resolve shop by slug ---
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
      .select("shop_name, reward_goal, welcome_sms_template, reward_sms_template")
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
    let { data: customer, error: fetchErr } = await supabase
      .from("customers")
      .select("id, total_visits, opted_out")
      .eq("shop_id", shopId)
      .eq("phone", phone)
      .maybeSingle();

    if (fetchErr) {
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
      return NextResponse.json(
        { error: checkinErr?.message ?? "Failed to log checkin" },
        { status: 500 }
      );
    }

    // --- Determine SMS message ---
    const isRewardVisit = newVisitCount % rewardGoal === 0;
    const template = isRewardVisit ? rewardTemplate : welcomeTemplate;
    const smsBody = renderTemplate(template, {
      shop_name: shopName,
      visits: newVisitCount,
      goal: rewardGoal,
    });

    // --- Send transactional SMS ---
    const smsResult = await sendSms({
      supabase,
      shopId,
      toPhone: phone,
      body: smsBody,
      type: "transactional",
      checkinId: checkin.id,
    });

    if (!smsResult.ok && !smsResult.skipped) {
      console.error("[checkin] SMS failed", smsResult.error);
    }

    return NextResponse.json({
      ok: true,
      customer_id: customerId,
      checkin_id: checkin.id,
      visit_number: newVisitCount,
      is_reward_visit: isRewardVisit,
      is_new_customer: isNewCustomer,
      sms: {
        skipped: smsResult.skipped ?? null,
        twilio_sid: smsResult.twilioSid ?? null,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

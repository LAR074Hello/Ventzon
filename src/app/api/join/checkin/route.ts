import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendSms, renderTemplate } from "@/lib/sms";

function isE164(phone: string) {
  return /^\+\d{10,15}$/.test(phone);
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

    // 1. Upsert customer into signups (insert if new, otherwise fetch existing)
    const { data: existing, error: lookupErr } = await supabase
      .from("signups")
      .select("id, phone, shop_slug, visits")
      .eq("shop_slug", shop_slug)
      .eq("phone", phone)
      .maybeSingle();

    if (lookupErr) {
      return NextResponse.json({ error: lookupErr.message }, { status: 500 });
    }

    let isNewCustomer = false;
    let visits: number;
    let signupId: number;

    if (!existing) {
      // New customer — insert into signups with visits = 1
      isNewCustomer = true;
      const { data: inserted, error: insertErr } = await supabase
        .from("signups")
        .insert({ shop_slug, phone, visits: 1 })
        .select("id, visits")
        .single();

      if (insertErr) {
        // Race condition: another request inserted between our lookup and insert
        if (insertErr.code === "23505" || /duplicate key/i.test(insertErr.message)) {
          // Retry as an existing customer
          const { data: retry, error: retryErr } = await supabase
            .from("signups")
            .select("id, visits")
            .eq("shop_slug", shop_slug)
            .eq("phone", phone)
            .single();

          if (retryErr || !retry) {
            return NextResponse.json({ error: "Failed to resolve customer" }, { status: 500 });
          }

          isNewCustomer = false;
          signupId = retry.id;
          visits = retry.visits ?? 0;
        } else {
          return NextResponse.json({ error: insertErr.message }, { status: 500 });
        }
      } else {
        signupId = inserted.id;
        visits = inserted.visits;
      }
    } else {
      signupId = existing.id;
      visits = (existing.visits ?? 0) + 1;

      // Increment visits
      const { error: updateErr } = await supabase
        .from("signups")
        .update({ visits })
        .eq("id", signupId);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }
    }

    // 2. Log the checkin
    const { error: checkinErr } = await supabase
      .from("checkins")
      .insert({ shop_slug, phone });

    if (checkinErr) {
      return NextResponse.json({ error: checkinErr.message }, { status: 500 });
    }

    // 3. Load shop settings for SMS templates + reward_goal
    const { data: settings } = await supabase
      .from("shop_settings")
      .select("shop_name, deal_title, welcome_sms_template, reward_sms_template, reward_goal")
      .eq("shop_slug", shop_slug)
      .single();

    const shopName = settings?.shop_name || shop_slug;
    const dealTitle = settings?.deal_title || "";
    const rewardGoal: number = settings?.reward_goal ?? 5;
    const earnedReward = visits >= rewardGoal;

    // 4. Send SMS
    let smsSent = false;
    try {
      if (isNewCustomer && settings?.welcome_sms_template) {
        // Welcome SMS for first-time customer
        const msg = renderTemplate(settings.welcome_sms_template, {
          shop_name: shopName,
          deal_title: dealTitle,
        });
        await sendSms(phone, msg);
        smsSent = true;
      } else if (earnedReward && settings?.reward_sms_template) {
        // Reward SMS when they hit the goal
        const msg = renderTemplate(settings.reward_sms_template, {
          shop_name: shopName,
          deal_title: dealTitle,
        });
        await sendSms(phone, msg);
        smsSent = true;

        // Reset visits after earning reward
        await supabase
          .from("signups")
          .update({ visits: 0 })
          .eq("id", signupId);
        visits = 0;
      }
    } catch (smsErr: any) {
      // Log but don't fail the checkin if SMS fails
      console.error("SMS send failed:", smsErr?.message);
    }

    return NextResponse.json({
      ok: true,
      is_new: isNewCustomer,
      visits,
      reward_goal: rewardGoal,
      earned_reward: earnedReward,
      sms_sent: smsSent,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

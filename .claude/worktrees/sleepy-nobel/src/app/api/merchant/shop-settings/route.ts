import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// PATCH /api/merchant/shop-settings
// Updates a shop's configurable settings (merchant-controlled).
// NOTE: Auth is not implemented here yet; this assumes trusted usage during development.

const MIN_GOAL = 2;
const MAX_GOAL = 31;

function clampStr(v: unknown, maxLen: number) {
  const s = String(v ?? "").trim();
  if (!s) return "";
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

export async function PATCH(req: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server misconfigured: missing Supabase env vars" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));

    const shop_slug = String(body.shop_slug ?? "")
      .trim()
      .toLowerCase();

    if (!shop_slug) {
      return NextResponse.json({ error: "Missing shop_slug" }, { status: 400 });
    }

    // Optional fields
    const reward_goal_raw = body.reward_goal;
    const reward_goal =
      reward_goal_raw === undefined || reward_goal_raw === null
        ? undefined
        : Number(reward_goal_raw);

    const shop_name = clampStr(body.shop_name, 120);
    const deal_title = clampStr(body.deal_title, 120);
    const deal_details = clampStr(body.deal_details, 300);

    // Keep SMS templates reasonably short (Twilio limits depend on encoding; we enforce a friendly cap)
    const welcome_sms_template = clampStr(body.welcome_sms_template, 500);
    const reward_sms_template = clampStr(body.reward_sms_template, 500);

    // Build update payload with only fields the client sent.
    const update: Record<string, any> = {};

    if (reward_goal !== undefined) {
      if (!Number.isFinite(reward_goal) || reward_goal < MIN_GOAL || reward_goal > MAX_GOAL) {
        return NextResponse.json(
          { error: `reward_goal must be a number between ${MIN_GOAL} and ${MAX_GOAL}` },
          { status: 400 }
        );
      }
      update.reward_goal = reward_goal;
    }

    // If these strings are present in the request, update them (even if empty string)
    // So the UI can let merchants clear fields.
    if ("shop_name" in body) update.shop_name = shop_name;
    if ("deal_title" in body) update.deal_title = deal_title;
    if ("deal_details" in body) update.deal_details = deal_details;
    if ("welcome_sms_template" in body) update.welcome_sms_template = welcome_sms_template;
    if ("reward_sms_template" in body) update.reward_sms_template = reward_sms_template;

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        {
          error:
            "No valid fields provided. Send at least one of: reward_goal, shop_name, deal_title, deal_details, welcome_sms_template, reward_sms_template",
        },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await supabase
      .from("shop_settings")
      .update(update)
      .eq("shop_slug", shop_slug)
      .select(
        "shop_slug,shop_name,deal_title,deal_details,welcome_sms_template,reward_sms_template,reward_goal"
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, settings: data }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
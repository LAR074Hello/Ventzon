import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/merchant/onboard
 *
 * Creates a new shop with rows in: shops, shop_settings, shop_members.
 *
 * Body: { shop_slug: string, owner_email: string, shop_name?: string }
 */
export async function POST(req: Request) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json().catch(() => ({}));
    const shop_slug = String(body?.shop_slug || "").trim().toLowerCase();
    const owner_email = String(body?.owner_email || "").trim().toLowerCase();
    const shop_name = String(body?.shop_name || "").trim() || shop_slug;

    if (!shop_slug) {
      return NextResponse.json({ error: "Missing shop_slug" }, { status: 400 });
    }
    if (!owner_email || !owner_email.includes("@")) {
      return NextResponse.json({ error: "Missing or invalid owner_email" }, { status: 400 });
    }
    if (!/^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(shop_slug)) {
      return NextResponse.json(
        { error: "shop_slug must be 3-50 lowercase alphanumeric/hyphens, no leading/trailing hyphen" },
        { status: 400 }
      );
    }

    // 1. Create the shop row
    const { error: shopErr } = await supabase.from("shops").insert({
      slug: shop_slug,
      is_paid: false,
      subscription_status: "inactive",
    });

    if (shopErr) {
      if (shopErr.code === "23505" || /duplicate/i.test(shopErr.message)) {
        return NextResponse.json({ error: "Shop already exists" }, { status: 409 });
      }
      return NextResponse.json({ error: shopErr.message }, { status: 500 });
    }

    // 2. Create default shop_settings row
    const { error: settingsErr } = await supabase.from("shop_settings").insert({
      shop_slug,
      shop_name,
      reward_goal: 5,
      deal_title: "",
      deal_details: "",
      welcome_sms_template: "Welcome to {{shop_name}} Rewards! Reply STOP to opt out.",
      reward_sms_template: "You earned your reward at {{shop_name}}! Show this text to redeem: {{deal_title}}",
    });

    if (settingsErr) {
      console.error("shop_settings insert failed:", settingsErr.message);
      // Don't fail the whole request — shop row exists, settings can be retried
    }

    // 3. Create shop_members row (links owner to shop)
    const { error: memberErr } = await supabase.from("shop_members").insert({
      shop_slug,
      email: owner_email,
      role: "owner",
    });

    if (memberErr) {
      console.error("shop_members insert failed:", memberErr.message);
    }

    return NextResponse.json({
      ok: true,
      shop_slug,
      shop_created: !shopErr,
      settings_created: !settingsErr,
      member_created: !memberErr,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

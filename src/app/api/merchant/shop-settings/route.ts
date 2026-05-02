import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";

// GET  /api/merchant/shop-settings?shop_slug=X  — returns full settings for the owning merchant
// PATCH /api/merchant/shop-settings             — updates settings

export async function GET(req: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }
    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const url = new URL(req.url);
    const shop_slug = url.searchParams.get("shop_slug")?.trim().toLowerCase() ?? "";
    if (!shop_slug) return NextResponse.json({ error: "Missing shop_slug" }, { status: 400 });

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify ownership
    const { data: shopRow } = await supabase
      .from("shops")
      .select("id")
      .eq("slug", shop_slug)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!shopRow) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

    const { data, error } = await supabase
      .from("shop_settings")
      .select("shop_slug,shop_name,deal_title,deal_details,reward_goal,reward_expires_days,bonus_days,register_pin")
      .eq("shop_slug", shop_slug)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, settings: data ?? null });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

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

    // Auth check: verify the user owns this shop
    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    const shop_slug = String(body.shop_slug ?? "")
      .trim()
      .toLowerCase();

    if (!shop_slug) {
      return NextResponse.json({ error: "Missing shop_slug" }, { status: 400 });
    }

    // Verify ownership: user must own a shop with this slug
    const supabaseCheck = createClient(supabaseUrl, serviceRoleKey);
    const { data: shopRow } = await supabaseCheck
      .from("shops")
      .select("id")
      .eq("slug", shop_slug)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!shopRow) {
      return NextResponse.json({ error: "Shop not found or you don't own it" }, { status: 403 });
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

    // Register PIN (4 digits, nullable — empty string clears it)
    const register_pin_raw = body.register_pin;
    const register_pin =
      register_pin_raw === undefined
        ? undefined
        : register_pin_raw === "" || register_pin_raw === null
        ? null
        : String(register_pin_raw).replace(/\D/g, "").slice(0, 4);

    // Optional advanced settings
    const reward_expires_days_raw = body.reward_expires_days;
    const reward_expires_days =
      reward_expires_days_raw === undefined || reward_expires_days_raw === null
        ? undefined
        : reward_expires_days_raw === ""
        ? null
        : Number(reward_expires_days_raw);

    const bonus_days_raw = body.bonus_days;
    const bonus_days =
      bonus_days_raw === undefined ? undefined : Array.isArray(bonus_days_raw) ? bonus_days_raw : null;

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
    if (reward_expires_days !== undefined) update.reward_expires_days = reward_expires_days;
    if (bonus_days !== undefined) update.bonus_days = bonus_days;
    if (register_pin !== undefined) update.register_pin = register_pin;

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        {
          error:
            "No valid fields provided. Send at least one of: reward_goal, shop_name, deal_title, deal_details",
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
        "shop_slug,shop_name,deal_title,deal_details,reward_goal,reward_expires_days,bonus_days,register_pin"
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
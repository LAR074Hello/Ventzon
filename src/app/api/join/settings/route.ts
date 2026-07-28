import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateJoinToken } from "@/lib/join-token";

export async function GET(req: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server misconfigured: missing Supabase env vars", code: "server_error" },
        { status: 500 }
      );
    }

    const url = new URL(req.url);
    const shop_slug = String(url.searchParams.get("shop_slug") ?? "")
      .trim()
      .toLowerCase();

    if (!shop_slug) {
      return NextResponse.json({ error: "Missing shop_slug" }, { status: 400 });
    }

    // Token validation: if `t` param is provided, verify it matches expected token
    const tokenParam = url.searchParams.get("t");
    const validToken = generateJoinToken(shop_slug);
    if (tokenParam !== null && tokenParam !== validToken) {
      return NextResponse.json(
        { error: "invalid_token", message: "Please scan the QR code at the store to check in." },
        { status: 403 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1) Try to read settings (new shops may not have a row yet)
    const { data: existing, error: readErr } = await supabase
      .from("shop_settings")
      .select(
        "shop_slug, shop_name, deal_title, deal_details, reward_goal, reward_expires_days, bonus_days"
      )
      .eq("shop_slug", shop_slug)
      .maybeSingle();

    if (readErr) {
      return NextResponse.json({ error: readErr.message, code: "server_error" }, { status: 500 });
    }

    // 2) If missing, fall back to derived defaults — WITHOUT writing.
    //    This handler used to upsert a shop_settings row here. A GET must not
    //    write: Next.js prefetches on hover and crawlers hit URLs, so rows could
    //    appear with no user action. The real creation path is the merchant
    //    onboarding insert (api/merchant/onboard), which is the only place a
    //    settings row should be born.
    if (!existing) {
      const { data: shopExists } = await supabase
        .from("shops")
        .select("slug, logo_url")
        .eq("slug", shop_slug)
        .maybeSingle();

      if (!shopExists) {
        return NextResponse.json(
          { error: "Shop not found", code: "shop_not_found" },
          { status: 404 }
        );
      }

      const defaultShopName = shop_slug
        .split("-")
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      // Same shape the client expects, derived in memory rather than persisted.
      const derived = {
        shop_slug,
        shop_name: defaultShopName || shop_slug,
        deal_title: "",
        deal_details: "",
        reward_goal: 5,
        reward_expires_days: null,
        bonus_days: null,
        logo_url: shopExists.logo_url ?? null,
      };

      return NextResponse.json(
        { ok: true, join_token: validToken, settings: derived },
        { status: 200 }
      );
    }

    // Fetch logo_url from shops table
    const { data: shopRow } = await supabase
      .from("shops")
      .select("logo_url")
      .eq("slug", shop_slug)
      .maybeSingle();

    return NextResponse.json(
      { ok: true, join_token: validToken, settings: { ...existing, logo_url: shopRow?.logo_url ?? null } },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown error", code: "server_error" },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateJoinToken } from "@/lib/join-token";

export async function GET(req: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server misconfigured: missing Supabase env vars" },
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
      return NextResponse.json({ error: readErr.message }, { status: 500 });
    }

    // 2) If missing, verify the shop actually exists before creating a settings row.
    //    Without this check anyone could POST an arbitrary slug and pollute shop_settings.
    if (!existing) {
      const { data: shopExists } = await supabase
        .from("shops")
        .select("slug")
        .eq("slug", shop_slug)
        .maybeSingle();

      if (!shopExists) {
        return NextResponse.json(
          { error: "Shop not found" },
          { status: 404 }
        );
      }

      const defaultShopName = shop_slug
        .split("-")
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      const defaultRow = {
        shop_slug,
        shop_name: defaultShopName || shop_slug,
        deal_title: "",
        deal_details: "",
      };

      const { data: inserted, error: upsertErr } = await supabase
        .from("shop_settings")
        .upsert(defaultRow, { onConflict: "shop_slug" })
        .select(
          "shop_slug, shop_name, deal_title, deal_details, reward_goal, reward_expires_days, bonus_days"
        )
        .single();

      if (upsertErr) {
        return NextResponse.json({ error: upsertErr.message }, { status: 500 });
      }

      // Fetch logo_url from shops table
      const { data: shopRowNew } = await supabase
        .from("shops")
        .select("logo_url")
        .eq("slug", shop_slug)
        .maybeSingle();

      return NextResponse.json(
        { ok: true, join_token: validToken, settings: { ...inserted, logo_url: shopRowNew?.logo_url ?? null } },
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
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
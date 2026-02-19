import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1) Try to read settings (new shops may not have a row yet)
    const { data: existing, error: readErr } = await supabase
      .from("shop_settings")
      .select(
        "shop_slug, shop_name, deal_title, deal_details, welcome_sms_template"
      )
      .eq("shop_slug", shop_slug)
      .maybeSingle();

    if (readErr) {
      return NextResponse.json({ error: readErr.message }, { status: 500 });
    }

    // 2) If missing, create a default settings row (so callers never crash on .single())
    if (!existing) {
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
        welcome_sms_template: "Thanks for joining! Reply STOP to unsubscribe.",
      };

      const { data: inserted, error: upsertErr } = await supabase
        .from("shop_settings")
        .upsert(defaultRow, { onConflict: "shop_slug" })
        .select(
          "shop_slug, shop_name, deal_title, deal_details, welcome_sms_template"
        )
        .single();

      if (upsertErr) {
        return NextResponse.json({ error: upsertErr.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true, settings: inserted }, { status: 200 });
    }

    return NextResponse.json({ ok: true, settings: existing }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
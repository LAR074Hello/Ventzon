import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const GOAL_LABELS: Record<string, string> = {
  slow_day: "Slow day traffic boost",
  new_item: "New item announcement",
  holiday: "Holiday/weekend special",
  win_back: "Win back lapsed customers",
  appreciation: "General customer appreciation",
};

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI not configured on this server." }, { status: 500 });
    }

    // Auth
    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const shopSlug = String(body?.shopSlug ?? "").trim().toLowerCase();
    const goalKey = String(body?.goal ?? "").trim();
    const details = String(body?.details ?? "").trim();
    let storeType = String(body?.storeType ?? "").trim();

    if (!shopSlug) return NextResponse.json({ error: "Missing shopSlug" }, { status: 400 });
    if (!goalKey) return NextResponse.json({ error: "Missing goal" }, { status: 400 });

    // Service-role client for DB reads
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify ownership + check subscription
    const { data: shop, error: shopErr } = await supabase
      .from("shops")
      .select("id, slug, user_id, is_paid, subscription_status, plan_type")
      .eq("slug", shopSlug)
      .eq("user_id", user.id)
      .maybeSingle();

    if (shopErr || !shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    if (!shop.is_paid) {
      return NextResponse.json(
        { error: "The AI Promo Writer is a Pro feature. Activate your subscription to use it." },
        { status: 403 }
      );
    }

    // Get store type from settings if not passed
    if (!storeType) {
      const { data: settings } = await supabase
        .from("shop_settings")
        .select("shop_name")
        .eq("shop_slug", shopSlug)
        .maybeSingle();
      storeType = settings?.shop_name || shopSlug;
    }

    const goalLabel = GOAL_LABELS[goalKey] ?? goalKey;

    // Call Anthropic
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 512,
        system: `You are a marketing assistant for independent retail stores. Write 3 short, friendly SMS promotional messages for a ${storeType}. Each must be under 155 characters, sound natural and human, include a clear action (visit us, stop by today, etc.), and never sound corporate or pushy. Return ONLY a JSON array of 3 strings, no preamble.`,
        messages: [
          {
            role: "user",
            content: `Goal: ${goalLabel}. Additional details: ${details || "none"}. Store type: ${storeType}.`,
          },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error("[promo-writer] Anthropic error:", anthropicRes.status, errText);
      return NextResponse.json({ error: "AI generation failed. Try again shortly." }, { status: 502 });
    }

    const aiData = await anthropicRes.json();
    const text: string = aiData?.content?.[0]?.text ?? "";

    // Extract JSON array from response
    let options: string[] = [];
    try {
      const match = text.match(/\[[\s\S]*\]/);
      if (match) options = JSON.parse(match[0]);
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response. Try again." }, { status: 500 });
    }

    if (!Array.isArray(options) || options.length === 0) {
      return NextResponse.json({ error: "No options generated. Try again." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, options: options.slice(0, 3) });
  } catch (e: any) {
    console.error("[promo-writer] exception:", e);
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}

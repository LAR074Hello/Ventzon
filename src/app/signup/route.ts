import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function startOfTodayUtcISO() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  return start.toISOString();
}

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server misconfigured: missing Supabase env vars." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const phoneRaw = String(body?.phone ?? "").trim();
    const shop_slug = String(body?.shop_slug ?? "").trim().toLowerCase();

    if (!phoneRaw || !shop_slug) {
      return NextResponse.json(
        { error: "Missing phone or shop_slug" },
        { status: 400 }
      );
    }

    const digits = phoneRaw.replace(/[^\d]/g, "");
    if (digits.length < 10) {
      return NextResponse.json(
        { error: "Invalid phone number" },
        { status: 400 }
      );
    }

    // MVP rule: max 1 reward per customer per shop per day
    const since = startOfTodayUtcISO();
    const { data: existing, error: existingErr } = await supabase
      .from("signups")
      .select("id")
      .eq("shop_slug", shop_slug)
      .eq("phone", digits)
      .gte("created_at", since)
      .limit(1);

    if (existingErr) {
      return NextResponse.json({ error: existingErr.message }, { status: 500 });
    }

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: "Already joined today" },
        { status: 409 }
      );
    }

    const { error } = await supabase.from("signups").insert({
      phone: digits,
      shop_slug,
      source: "web",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unknown server error" },
      { status: 500 }
    );
  }
}
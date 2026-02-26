import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

function isE164(phone: string) {
  return /^\+\d{10,15}$/.test(phone);
}

export async function POST(req: Request) {
  // Rate limit: 10 signups per IP per minute
  const ip = getClientIp(req);
  const rl = rateLimit(`signup:${ip}`, 10, 60_000);
  if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Server misconfigured: missing Supabase env vars" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

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

  const { error } = await supabase.from("signups").insert({ shop_slug, phone });

  if (error) {
    // Handle duplicate signup gracefully
    if (error.code === "23505" || /duplicate key value/i.test(error.message)) {
      return NextResponse.json(
        { ok: true, already_joined: true },
        { status: 200 }
      );
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

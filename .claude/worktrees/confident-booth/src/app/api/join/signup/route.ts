import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isE164(phone: string) {
  return /^\+\d{10,15}$/.test(phone);
}

export async function POST(req: Request) {
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
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, shop_slug } = body;

    if (!phone || !shop_slug) {
      return NextResponse.json(
        { error: "Missing phone or shop_slug" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("signups").insert({
      phone,
      shop_slug,
      source: "web",
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

async function ownsShop(supabase: any, shopSlug: string, userId: string) {
  const { data } = await supabase
    .from("shops")
    .select("id, is_paid")
    .eq("slug", shopSlug)
    .eq("user_id", userId)
    .maybeSingle();
  return data as any;
}

export async function GET(req: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const url = new URL(req.url);
    const shopSlug = String(url.searchParams.get("shop_slug") ?? "").trim().toLowerCase();
    if (!shopSlug) return NextResponse.json({ error: "Missing shop_slug" }, { status: 400 });

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const shop = await ownsShop(supabase, shopSlug, user.id);
    if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

    const { data: occasions, error } = await supabase
      .from("shop_occasions")
      .select("id, title, message, month, day, days_before, enabled, created_at")
      .eq("shop_slug", shopSlug)
      .order("month", { ascending: true })
      .order("day", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, occasions: occasions ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json().catch(() => ({} as any));
    const shopSlug = String(body?.shop_slug ?? "").trim().toLowerCase();
    const title = String(body?.title ?? "").trim();
    const message = String(body?.message ?? "").trim();
    const month = Number(body?.month);
    const day = Number(body?.day);
    const daysBefore = Number(body?.days_before ?? 0);

    if (!shopSlug) return NextResponse.json({ error: "Missing shop_slug" }, { status: 400 });
    if (!title || title.length > 120) return NextResponse.json({ error: "Title is required (max 120 chars)" }, { status: 400 });
    if (message.length > 300) return NextResponse.json({ error: "Message is too long (max 300 chars)" }, { status: 400 });
    if (!Number.isInteger(month) || month < 1 || month > 12) return NextResponse.json({ error: "Pick a valid month" }, { status: 400 });
    if (!Number.isInteger(day) || day < 1 || day > DAYS_IN_MONTH[month - 1]) return NextResponse.json({ error: "Pick a valid day" }, { status: 400 });
    if (!Number.isFinite(daysBefore) || daysBefore < 0 || daysBefore > 60) return NextResponse.json({ error: "Lead time must be 0–60 days" }, { status: 400 });

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const shop = await ownsShop(supabase, shopSlug, user.id);
    if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    if (!shop.is_paid) return NextResponse.json({ error: "Occasions are a paid feature" }, { status: 403 });

    const { data: occasion, error } = await supabase
      .from("shop_occasions")
      .insert({
        shop_slug: shopSlug,
        title,
        message: message || null,
        month,
        day,
        days_before: Math.round(daysBefore),
        enabled: true,
      })
      .select("id, title, message, month, day, days_before, enabled, created_at")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, occasion });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

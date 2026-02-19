import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

async function verifyShopOwner(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  shopSlug: string
) {
  const { data: shop, error: shopErr } = await supabase
    .from("shops")
    .select("id, slug, user_id")
    .eq("slug", shopSlug)
    .maybeSingle();

  if (shopErr || !shop) return { authorized: false as const };

  const { data: member, error: memberErr } = await supabase
    .from("shop_members")
    .select("role")
    .eq("shop_id", shop.id)
    .eq("user_id", userId)
    .eq("role", "owner")
    .maybeSingle();

  if (memberErr || !member) return { authorized: false as const };

  return { authorized: true as const, shopId: shop.id as string };
}

/** POST — create a promotion draft */
export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr) return NextResponse.json({ error: userErr.message }, { status: 401 });
    const user = userRes.user;
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const shop_slug = String(body?.shop_slug ?? "").trim().toLowerCase();
    const promoBody = String(body?.body ?? "").trim();

    if (!shop_slug) return NextResponse.json({ error: "Missing shop_slug" }, { status: 400 });
    if (!promoBody) return NextResponse.json({ error: "Missing body" }, { status: 400 });

    const ownership = await verifyShopOwner(supabase, user.id, shop_slug);
    if (!ownership.authorized) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { data: promo, error } = await supabase
      .from("promotions")
      .insert({
        shop_slug,
        body: promoBody,
        status: "draft",
        created_by: user.id,
      })
      .select("id, shop_slug, body, status, created_at")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, promotion: promo }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}

/** GET — list promotions for a shop */
export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr) return NextResponse.json({ error: userErr.message }, { status: 401 });
    const user = userRes.user;
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const url = new URL(req.url);
    const shop_slug = String(url.searchParams.get("shop_slug") ?? "").trim().toLowerCase();

    if (!shop_slug) return NextResponse.json({ error: "Missing shop_slug" }, { status: 400 });

    const ownership = await verifyShopOwner(supabase, user.id, shop_slug);
    if (!ownership.authorized) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { data: promotions, error } = await supabase
      .from("promotions")
      .select("id, shop_slug, body, status, reject_reason, created_at, approved_at, rejected_at")
      .eq("shop_slug", shop_slug)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, promotions }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}

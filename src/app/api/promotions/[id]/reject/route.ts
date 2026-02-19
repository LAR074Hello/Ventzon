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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createSupabaseServerClient();

    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr) return NextResponse.json({ error: userErr.message }, { status: 401 });
    const user = userRes.user;
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const reason = String(body?.reason ?? "").trim();
    if (!reason) return NextResponse.json({ error: "Missing reason" }, { status: 400 });

    // Fetch promotion
    const { data: promo, error: promoErr } = await supabase
      .from("promotions")
      .select("id, shop_slug, body, status")
      .eq("id", id)
      .maybeSingle();

    if (promoErr) return NextResponse.json({ error: promoErr.message }, { status: 500 });
    if (!promo) return NextResponse.json({ error: "Promotion not found" }, { status: 404 });
    if (promo.status !== "draft") {
      return NextResponse.json({ error: "Promotion already processed" }, { status: 400 });
    }

    // Verify ownership
    const ownership = await verifyShopOwner(supabase, user.id, promo.shop_slug);
    if (!ownership.authorized) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Reject
    const now = new Date().toISOString();
    const { data: updated, error: updateErr } = await supabase
      .from("promotions")
      .update({
        status: "rejected",
        reject_reason: reason,
        rejected_at: now,
        updated_at: now,
      })
      .eq("id", id)
      .select("id, shop_slug, body, status, reject_reason, rejected_at")
      .single();

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, promotion: updated }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}

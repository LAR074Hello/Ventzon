import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { sendEmail } from "@/lib/resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    // Mark as approved
    const now = new Date().toISOString();
    const { error: updateErr } = await supabase
      .from("promotions")
      .update({ status: "approved", approved_at: now, updated_at: now })
      .eq("id", id);

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    // Use service role client for customer queries and message inserts
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Fetch opted-in customers with email addresses
    const { data: customers, error: custErr } = await adminClient
      .from("customers")
      .select("id, email")
      .eq("shop_slug", promo.shop_slug)
      .eq("opted_out", false)
      .not("email", "is", null);

    if (custErr) return NextResponse.json({ error: custErr.message }, { status: 500 });

    // Send email notifications to each customer
    let sent = 0;
    let failed = 0;

    for (const customer of customers ?? []) {
      if (!customer.email) continue;
      let msgStatus: "sent" | "failed" = "sent";
      let errorMessage: string | null = null;

      try {
        await sendEmail(customer.email, "Promotion from your rewards program", promo.body);
      } catch (emailErr: any) {
        msgStatus = "failed";
        errorMessage = emailErr?.message ?? "Unknown email error";
        console.error("Promotion email failed:", customer.email, errorMessage);
      }

      await adminClient.from("messages").insert({
        shop_id: ownership.shopId,
        to_phone: null,
        from_phone: null,
        body: promo.body,
        type: "marketing",
        status: msgStatus,
        twilio_sid: null,
        error_message: errorMessage,
        promotion_id: promo.id,
      });

      if (msgStatus === "sent") sent++;
      else failed++;
    }

    return NextResponse.json(
      {
        ok: true,
        promotion_id: promo.id,
        total_customers: (customers ?? []).length,
        sent,
        failed,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}

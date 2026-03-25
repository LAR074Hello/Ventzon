import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { sendSms } from "@/lib/twilio";
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

    // Fetch opted-in customers
    const { data: customers, error: custErr } = await adminClient
      .from("customers")
      .select("id, phone, email")
      .eq("shop_slug", promo.shop_slug)
      .eq("opted_out", false);

    if (custErr) return NextResponse.json({ error: custErr.message }, { status: 500 });

    // Send notifications to each customer sequentially (SMS or email)
    const fromPhone = process.env.TWILIO_PHONE_NUMBER ?? "";
    let sent = 0;
    let failed = 0;

    for (const customer of customers ?? []) {
      let msgStatus: "sent" | "failed" = "sent";
      let twilioSid: string | null = null;
      let errorMessage: string | null = null;

      const hasEmail = !!customer.email;
      const hasPhone = !!customer.phone;

      if (hasEmail) {
        // Send via email
        try {
          await sendEmail(customer.email, "Promotion from your rewards program", promo.body);
        } catch (emailErr: any) {
          msgStatus = "failed";
          errorMessage = emailErr?.message ?? "Unknown email error";
          console.error("Promotion email failed:", customer.email, errorMessage);
        }
      } else if (hasPhone && process.env.SMS_ENABLED === "true") {
        // Send via SMS
        try {
          const result = await sendSms(customer.phone, promo.body);
          twilioSid = result.sid;
        } catch (smsErr: any) {
          msgStatus = "failed";
          errorMessage = smsErr?.message ?? "Unknown SMS error";
          console.error("Promotion SMS failed:", customer.phone, errorMessage);
        }
      }

      await adminClient.from("messages").insert({
        shop_id: ownership.shopId,
        to_phone: customer.phone || null,
        from_phone: hasPhone ? fromPhone : null,
        body: promo.body,
        type: "marketing",
        status: msgStatus,
        twilio_sid: twilioSid,
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

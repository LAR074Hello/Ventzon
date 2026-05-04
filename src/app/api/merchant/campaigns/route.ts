import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { sendEmail } from "@/lib/resend";
import { generateUnsubscribeToken } from "@/app/api/unsubscribe/route";

export const dynamic = "force-dynamic";

// POST /api/merchant/campaigns
// Body: { shop_slug, subject, body }
// Sends an email campaign to all non-opted-out customers with an email address.

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const shopSlug = String(body?.shop_slug ?? "").trim().toLowerCase();
    const subject = String(body?.subject ?? "").trim();
    const message = String(body?.body ?? "").trim();

    if (!shopSlug) return NextResponse.json({ error: "Missing shop_slug" }, { status: 400 });
    if (!subject) return NextResponse.json({ error: "Missing subject" }, { status: 400 });
    if (!message) return NextResponse.json({ error: "Missing body" }, { status: 400 });

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify ownership
    const { data: shop } = await supabase
      .from("shops")
      .select("slug")
      .eq("slug", shopSlug)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

    // Fetch all non-opted-out customers with email
    const { data: customers, error } = await supabase
      .from("customers")
      .select("id, email")
      .eq("shop_slug", shopSlug)
      .eq("opted_out", false)
      .not("email", "is", null);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const targets = (customers ?? []).filter((c) => c.email);

    if (targets.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, failed: 0, message: "No eligible customers" });
    }

    let sent = 0;
    let failed = 0;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://ventzon.com";

    // Send emails sequentially to stay within rate limits
    for (const customer of targets) {
      try {
        const unsubscribeUrl = `${baseUrl}/api/unsubscribe?id=${customer.id}&token=${generateUnsubscribeToken(customer.id)}`;
        await sendEmail(customer.email!, subject, message, unsubscribeUrl);
        sent++;
      } catch (e) {
        failed++;
        console.error("[campaigns] Email failed to", customer.email, e);
      }
    }

    // Log to promotions table (best-effort, non-fatal)
    try {
      await supabase.from("promotions").insert({
        shop_slug: shopSlug,
        body: `${subject}\n\n${message}`,
        status: "sent",
        created_by: user.id,
        sent_count: sent,
        sent_at: new Date().toISOString(),
      });
    } catch {
      // Table may not have sent_count / sent_at columns — that's fine
      try {
        await supabase.from("promotions").insert({
          shop_slug: shopSlug,
          body: `${subject}\n\n${message}`,
          status: "sent",
          created_by: user.id,
        });
      } catch {
        // Non-fatal
      }
    }

    return NextResponse.json({ ok: true, sent, failed });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

// GET /api/merchant/campaigns?shop_slug=X
// Lists past campaigns for a shop.
export async function GET(req: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const url = new URL(req.url);
    const shopSlug = url.searchParams.get("shop_slug")?.trim().toLowerCase() ?? "";
    if (!shopSlug) return NextResponse.json({ error: "Missing shop_slug" }, { status: 400 });

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify ownership
    const { data: shop } = await supabase
      .from("shops")
      .select("slug")
      .eq("slug", shopSlug)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

    const { data: campaigns } = await supabase
      .from("promotions")
      .select("id, body, status, created_at")
      .eq("shop_slug", shopSlug)
      .eq("status", "sent")
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({ campaigns: campaigns ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

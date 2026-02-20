import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    // Auth check
    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const shop_slug = String(body.shop_slug ?? "").trim().toLowerCase();

    if (!shop_slug) {
      return Response.json({ error: "Missing shop_slug" }, { status: 400 });
    }

    // Look up the shop's stripe_customer_id (using service role to bypass RLS)
    const supabaseUrl = process.env.SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: shop } = await supabaseAdmin
      .from("shops")
      .select("stripe_customer_id")
      .eq("slug", shop_slug)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!shop || !(shop as any).stripe_customer_id) {
      return Response.json(
        { error: "No billing information found for this shop" },
        { status: 404 }
      );
    }

    const origin =
      req.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://www.ventzon.com";

    const session = await stripe.billingPortal.sessions.create({
      customer: (shop as any).stripe_customer_id,
      return_url: `${origin}/merchant/${encodeURIComponent(shop_slug)}`,
    });

    return Response.json({ url: session.url });
  } catch (e: any) {
    return Response.json(
      { error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}

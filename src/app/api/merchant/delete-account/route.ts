import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE() {
  try {
    // Auth check
    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all shops owned by this merchant
    const { data: shops } = await supabase
      .from("shops")
      .select("slug, stripe_customer_id, stripe_subscription_id")
      .eq("user_id", user.id);

    if (shops && shops.length > 0) {
      // Cancel all active Stripe subscriptions
      if (process.env.STRIPE_SECRET_KEY) {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        for (const shop of shops) {
          if (shop.stripe_subscription_id) {
            try {
              await stripe.subscriptions.cancel(shop.stripe_subscription_id);
            } catch {
              // Best-effort — subscription may already be cancelled
            }
          }
        }
      }

      const slugs = shops.map((s) => s.slug);

      // Delete all customer data for their shops
      await supabase.from("customers").delete().in("shop_slug", slugs);

      // Delete reward events
      await supabase.from("reward_events").delete().in("shop_slug", slugs);

      // Delete shop settings
      await supabase.from("shop_settings").delete().in("shop_slug", slugs);

      // Delete shops
      await supabase.from("shops").delete().in("slug", slugs);
    }

    // Delete the auth user
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) throw error;

    return Response.json({ success: true });
  } catch (err: any) {
    return Response.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

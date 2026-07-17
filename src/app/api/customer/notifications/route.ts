import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// GET /api/customer/notifications → the customer's notification history,
// newest first, with shop names resolved for display.
export async function GET() {
  try {
    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: log, error } = await admin
      .from("customer_notification_log")
      .select("id, type, shop_slug, sent_at")
      .eq("email", user.email.toLowerCase())
      .order("sent_at", { ascending: false })
      .limit(50);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const slugs = [...new Set((log ?? []).map((n) => n.shop_slug).filter(Boolean))] as string[];
    const { data: settings } = slugs.length
      ? await admin
          .from("shop_settings")
          .select("shop_slug, shop_name, deal_title")
          .in("shop_slug", slugs)
      : { data: [] };
    const nameMap: Record<string, { shop_name: string | null; deal_title: string | null }> = {};
    for (const s of settings ?? []) {
      nameMap[s.shop_slug] = { shop_name: s.shop_name, deal_title: s.deal_title };
    }

    const notifications = (log ?? []).map((n) => {
      const shop = n.shop_slug ? nameMap[n.shop_slug] : null;
      const shopName = shop?.shop_name ?? n.shop_slug ?? "a store";
      let title = "";
      let body = "";
      if (n.type === "drop") {
        title = `${shopName} posted a drop`;
        body = "Something new from a store you follow";
      } else if (n.type === "reward_expiry") {
        title = "Your reward is waiting";
        body = `${shop?.deal_title ?? "Your reward"} at ${shopName}`;
      } else {
        title = `New near you: ${shopName}`;
        body = shop?.deal_title ?? "A new store joined Ventzon nearby";
      }
      return {
        id: n.id,
        type: n.type,
        shop_slug: n.shop_slug,
        title,
        body,
        sent_at: n.sent_at,
      };
    });

    return NextResponse.json({ notifications });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

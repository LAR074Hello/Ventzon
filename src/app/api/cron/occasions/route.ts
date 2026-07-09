import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildOccasionEmail } from "@/lib/resend";
import { buildTokenMap, pushOrEmail } from "@/lib/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/cron/occasions
// Runs daily. For each enabled shop_occasion whose date (minus its lead
// time) is today, sends an ANNOUNCEMENT to every opted-in customer of
// that shop — push if they have the app, otherwise email. Announcements
// are NOT tracked rewards and are NOT metered, so a holiday broadcast
// costs nothing per customer. Idempotent via occasion_sends, unique on
// (occasion_id, customer_id, send_year).

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const today = new Date();

  try {
    const { data: occasions, error } = await supabase
      .from("shop_occasions")
      .select("id, shop_slug, title, message, month, day, days_before, enabled")
      .eq("enabled", true);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!occasions?.length) {
      return NextResponse.json({ ok: true, occasions: 0, sent: 0, note: "No enabled occasions" });
    }

    // Shop display names for the notification copy.
    const slugs = [...new Set(occasions.map((o: any) => o.shop_slug))];
    const { data: shopNames } = await supabase
      .from("shop_settings")
      .select("shop_slug, shop_name")
      .in("shop_slug", slugs);
    const nameBySlug: Record<string, string> = {};
    for (const s of shopNames ?? []) nameBySlug[(s as any).shop_slug] = (s as any).shop_name;

    let totalSent = 0;
    const fired: Array<{ occasion: string; shop: string; sent: number }> = [];

    for (const occ of occasions as any[]) {
      // Is today the day to fire this occasion? (occasion date − lead time)
      const fireOn = new Date(today);
      fireOn.setDate(fireOn.getDate() + Number(occ.days_before ?? 0));
      if (fireOn.getMonth() + 1 !== occ.month || fireOn.getDate() !== occ.day) continue;

      const sendYear = today.getFullYear();
      const shopName = nameBySlug[occ.shop_slug] || occ.shop_slug;

      // Audience: every opted-in customer of the shop with an email.
      const { data: customers } = await supabase
        .from("customers")
        .select("id, email")
        .eq("shop_slug", occ.shop_slug)
        .eq("opted_out", false)
        .not("email", "is", null);

      if (!customers?.length) continue;

      const tokenMap = await buildTokenMap(supabase, customers.map((c: any) => c.email));
      let sent = 0;

      for (const cust of customers as any[]) {
        const email = (cust.email as string)?.toLowerCase();
        if (!email) continue;

        // Idempotency: claim the guard first.
        const { data: claim, error: claimErr } = await supabase
          .from("occasion_sends")
          .insert({ occasion_id: occ.id, customer_id: cust.id, send_year: sendYear })
          .select("id")
          .single();
        if (claimErr || !claim) continue; // already sent this year

        const channel = await pushOrEmail({
          email,
          tokens: tokenMap[email],
          title: occ.title,
          body: occ.message || `A special offer from ${shopName}. Show this at the register.`,
          data: { type: "occasion", shop_slug: occ.shop_slug, occasion_id: occ.id },
          emailSubject: `${occ.title} — ${shopName}`,
          emailText: `${occ.title}. ${occ.message || ""} Show this at the register at ${shopName}.`,
          emailHtml: buildOccasionEmail({ shopName, title: occ.title, message: occ.message || undefined }),
        });

        await supabase.from("occasion_sends").update({ channel }).eq("id", (claim as any).id);
        if (channel !== "none") {
          sent++;
          totalSent++;
        }
      }

      if (sent > 0) fired.push({ occasion: occ.title, shop: occ.shop_slug, sent });
    }

    return NextResponse.json({ ok: true, occasions: occasions.length, sent: totalSent, fired });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

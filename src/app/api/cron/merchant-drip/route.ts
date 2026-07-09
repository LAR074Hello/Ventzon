import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/resend";

export const dynamic = "force-dynamic";

// GET /api/cron/merchant-drip
// Called daily by Vercel Cron. Sends onboarding drip emails to merchants
// at Day 1, Day 3, and Day 7 after their shop was created while paid.

const DRIP_DAYS = [1, 3, 7];

function buildDripEmail(opts: {
  day: number;
  shopName: string;
  shopSlug: string;
  baseUrl: string;
}): { subject: string; html: string } {
  const { day, shopName, shopSlug, baseUrl } = opts;
  const dashboardUrl = `${baseUrl}/merchant/${shopSlug}`;

  const content: Record<number, { subject: string; heading: string; body: string; tip: string }> = {
    1: {
      subject: `Your ${shopName} loyalty program is live`,
      heading: "Your loyalty program is live.",
      body: "Your QR code is ready. Print it and place it near your register — that's all it takes to start collecting check-ins. Customers scan, enter their phone or email, and they're in your program.",
      tip: "Print your QR card and tape it to your counter today. The closer it is to the register, the more scans you'll get.",
    },
    3: {
      subject: `How's ${shopName} doing? Check your dashboard`,
      heading: "Check in on your program.",
      body: "Three days in. Open your dashboard to see your first check-ins, which customers are already collecting stamps, and how close your top customer is to earning their first reward.",
      tip: "Tell your regulars about it directly. A personal mention at the register converts far better than a sign alone.",
    },
    7: {
      subject: `One week in — here's what to do next`,
      heading: "One week down.",
      body: "By now you should have your first customers in the system. Here are two things that make a big difference in the first month: set a bonus stamp day (double stamps on your slowest day) and share your join link on your social media.",
      tip: "Bonus stamp days are the easiest way to drive traffic on slow days. Set one in your dashboard settings.",
    },
  };

  const c = content[day];

  const html = `
<div style="background:#000;padding:0;margin:0">
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;background:#000;color:#ededed">
    <div style="padding:32px 32px 0">
      <p style="font-size:11px;letter-spacing:0.4em;color:#555;margin:0">VENTZON</p>
    </div>
    <div style="padding:36px 32px 28px">
      <h1 style="font-size:24px;font-weight:200;letter-spacing:-0.01em;color:#fff;margin:0 0 12px">${c.heading}</h1>
      <p style="font-size:15px;line-height:1.7;color:#888;margin:0">${c.body}</p>
    </div>
    <div style="margin:0 32px 28px;background:#0a0a0a;border:1px solid #2a2a2a;border-radius:12px;padding:18px 24px">
      <p style="font-size:10px;letter-spacing:0.2em;color:#555;margin:0 0 8px">TIP</p>
      <p style="font-size:13px;font-weight:300;line-height:1.7;color:#999;margin:0">${c.tip}</p>
    </div>
    <div style="margin:0 32px 36px">
      <a href="${dashboardUrl}" style="display:inline-block;border:1px solid #ededed;border-radius:999px;padding:12px 28px;font-size:12px;font-weight:300;letter-spacing:0.15em;color:#ededed;text-decoration:none">
        Open dashboard
      </a>${
        day === 1
          ? `
      <a href="${baseUrl}/setup" style="display:inline-block;margin-left:18px;font-size:12px;font-weight:300;letter-spacing:0.1em;color:#888;text-decoration:none">
        Read the setup guide &rarr;
      </a>`
          : ""
      }
    </div>
    <div style="border-top:1px solid #1a1a1a;padding:20px 32px">
      <p style="font-size:11px;color:#444;margin:0">Ventzon · <a href="https://www.ventzon.com" style="color:#444;text-decoration:none">ventzon.com</a></p>
    </div>
  </div>
</div>`;

  return { subject: c.subject, html };
}

export async function GET(req: Request) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://ventzon.com";

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const results: { day: number; sent: number; failed: number }[] = [];

  for (const day of DRIP_DAYS) {
    // Window: shops created between (day * 24h - 2h) and (day * 24h + 2h) ago
    const windowEnd = new Date(Date.now() - (day * 24 - 2) * 60 * 60 * 1000);
    const windowStart = new Date(Date.now() - (day * 24 + 2) * 60 * 60 * 1000);

    const { data: shops, error } = await supabase
      .from("shops")
      .select("slug, name, user_id")
      .eq("is_paid", true)
      .gte("created_at", windowStart.toISOString())
      .lte("created_at", windowEnd.toISOString());

    if (error) {
      console.error(`[merchant-drip] day=${day} query error:`, error.message);
      continue;
    }

    let sent = 0;
    let failed = 0;

    for (const shop of shops ?? []) {
      try {
        // Get the merchant's email from auth.users
        const { data: userData } = await supabase.auth.admin.getUserById(shop.user_id);
        const email = userData?.user?.email;
        if (!email) continue;

        const shopName = shop.name ?? shop.slug;
        const { subject, html } = buildDripEmail({ day, shopName, shopSlug: shop.slug, baseUrl });

        await sendEmail(email, subject, "", undefined, html);
        sent++;
      } catch (e) {
        failed++;
        console.error(`[merchant-drip] day=${day} failed for shop=${shop.slug}:`, e);
      }
    }

    results.push({ day, sent, failed });
    console.log(`[merchant-drip] day=${day} sent=${sent} failed=${failed}`);
  }

  return NextResponse.json({ ok: true, results });
}

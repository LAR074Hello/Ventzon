import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://ventzon.com";

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */

/** Pull a first name from an email address. "john.doe@gmail.com" → "John" */
function firstNameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const name = local.split(/[._+\-]/)[0] ?? local;
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

function escHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ─────────────────────────────────────────────
   Email templates
   White body + dark header bar, single CTA button
───────────────────────────────────────────── */

function emailShell(heading: string, body: string, ctaLabel: string, ctaUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:540px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08)">

    <!-- Dark header -->
    <div style="background:#000;padding:20px 32px">
      <p style="font-size:10px;letter-spacing:0.45em;color:#555;margin:0;font-weight:400">VENTZON</p>
    </div>

    <!-- Body -->
    <div style="padding:40px 32px 28px">
      <h1 style="font-size:22px;font-weight:300;color:#111;margin:0 0 16px;line-height:1.3">${heading}</h1>
      <div style="font-size:15px;line-height:1.75;color:#555">${body}</div>
    </div>

    <!-- CTA -->
    <div style="padding:0 32px 36px">
      <a href="${escHtml(ctaUrl)}"
         style="display:inline-block;background:#111;color:#fff;text-decoration:none;border-radius:999px;padding:13px 28px;font-size:12px;letter-spacing:0.15em;font-weight:400">
        ${escHtml(ctaLabel)}
      </a>
    </div>

    <!-- Footer -->
    <div style="padding:20px 32px;border-top:1px solid #eee">
      <p style="font-size:11px;color:#aaa;margin:0">
        Ventzon &middot;
        <a href="https://www.ventzon.com" style="color:#aaa;text-decoration:none">ventzon.com</a>
      </p>
    </div>

  </div>
</body>
</html>`;
}

function buildDay1Email(opts: { firstName: string; shopName: string; shopSlug: string }) {
  const { firstName, shopName, shopSlug } = opts;
  const dashUrl = `${BASE_URL}/merchant/${shopSlug}`;
  const printUrl = `${BASE_URL}/merchant/${shopSlug}/print-card`;

  return {
    subject: "You're live on Ventzon 🎉",
    html: emailShell(
      `You're live, ${escHtml(firstName)}.`,
      `<p style="margin:0 0 14px">
        <strong style="color:#111;font-weight:500">${escHtml(shopName)}</strong> is set up and
        your QR code is ready to go. Customers scan it, enter their phone or email,
        and they're instantly in your loyalty program — no app download required.
      </p>
      <p style="margin:0 0 14px">
        <strong style="color:#111;font-weight:500">One thing to do today:</strong>
        print your QR card and tape it to your counter near the register.
        The closer it is to where people pay, the more scans you'll get.
      </p>
      <p style="margin:0">
        <a href="${escHtml(printUrl)}" style="color:#111;font-weight:500">Print your QR card →</a>
      </p>`,
      "Open your dashboard",
      dashUrl
    ),
  };
}

function buildDay3Email(opts: { firstName: string; shopName: string; shopSlug: string }) {
  const { firstName, shopName, shopSlug } = opts;
  const dashUrl = `${BASE_URL}/merchant/${shopSlug}`;
  const promoUrl = `${BASE_URL}/merchant/${shopSlug}#promotions`;

  return {
    subject: `How's it going, ${firstName}?`,
    html: emailShell(
      "Check in on your program.",
      `<p style="margin:0 0 14px">
        Three days in. Open your dashboard to see your first check-ins, which customers
        are collecting stamps, and how close your top customer is to earning their first reward.
      </p>
      <p style="margin:0 0 14px">
        <strong style="color:#111;font-weight:500">Pro tip:</strong> the
        <strong style="color:#111;font-weight:500">AI Promo Writer</strong> in your Promotions tab
        can generate ready-to-send messages in seconds — great for a slow afternoon or a weekend
        special. It's available on your plan.
      </p>
      <p style="margin:0">
        <a href="${escHtml(promoUrl)}" style="color:#111;font-weight:500">Try the AI Promo Writer →</a>
      </p>`,
      "View your dashboard",
      dashUrl
    ),
  };
}

function buildDay7Email(opts: {
  firstName: string;
  shopName: string;
  shopSlug: string;
  checkinCount: number;
}) {
  const { firstName, shopName, shopSlug, checkinCount } = opts;
  const dashUrl = `${BASE_URL}/merchant/${shopSlug}`;
  const promoUrl = `${BASE_URL}/merchant/${shopSlug}#promotions`;

  const checkinLine =
    checkinCount > 0
      ? `<p style="margin:0 0 14px">
          You've had <strong style="color:#111;font-weight:500">${checkinCount} check-in${checkinCount === 1 ? "" : "s"}</strong>
          this week — that's ${checkinCount} customers building a habit around
          ${escHtml(shopName)}. Keep going.
        </p>`
      : `<p style="margin:0 0 14px">
          The first customers are always the hardest to get. If you haven't already,
          tell your regulars about the program directly at the register — a personal mention
          converts far better than a sign alone.
        </p>`;

  return {
    subject: `Your first week on Ventzon`,
    html: emailShell(
      `One week down, ${escHtml(firstName)}.`,
      `${checkinLine}
      <p style="margin:0 0 14px">
        <strong style="color:#111;font-weight:500">What to do this week:</strong>
        send your first promotion. Write a short message — "Slow Tuesday? Come in for a free
        cookie with any drink" — and submit it from your Promotions tab. It takes 30 seconds
        and gives customers a reason to visit today.
      </p>
      <p style="margin:0">
        <a href="${escHtml(promoUrl)}" style="color:#111;font-weight:500">Send your first promotion →</a>
      </p>`,
      "Go to your dashboard",
      dashUrl
    ),
  };
}

/* ─────────────────────────────────────────────
   Cron handler
───────────────────────────────────────────── */

export async function GET(req: Request) {
  // Auth: require CRON_SECRET if set
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }
  if (!resendKey) {
    return NextResponse.json({ error: "Missing RESEND_API_KEY" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const resend = new Resend(resendKey);

  // Fetch all pending emails whose send_at has passed
  const { data: pending, error: fetchErr } = await supabase
    .from("scheduled_emails")
    .select("id, merchant_email, shop_slug, email_type")
    .eq("sent", false)
    .lte("send_at", new Date().toISOString())
    .order("send_at", { ascending: true })
    .limit(100); // safety cap per run

  if (fetchErr) {
    console.error("[send-emails] fetch error:", fetchErr.message);
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  const rows = pending ?? [];
  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const { merchant_email, shop_slug, email_type } = row;
      const firstName = firstNameFromEmail(merchant_email);

      // Get shop display name from shop_settings
      const { data: settings } = await supabase
        .from("shop_settings")
        .select("shop_name")
        .eq("shop_slug", shop_slug)
        .maybeSingle();

      const shopName = settings?.shop_name || shop_slug;

      let subject: string;
      let html: string;

      if (email_type === "day1") {
        ({ subject, html } = buildDay1Email({ firstName, shopName, shopSlug: shop_slug }));

      } else if (email_type === "day3") {
        ({ subject, html } = buildDay3Email({ firstName, shopName, shopSlug: shop_slug }));

      } else if (email_type === "day7") {
        // Query this week's check-in count
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10);
        const { count } = await supabase
          .from("checkins")
          .select("id", { count: "exact", head: true })
          .eq("shop_slug", shop_slug)
          .gte("checkin_date", weekAgo);

        ({ subject, html } = buildDay7Email({
          firstName,
          shopName,
          shopSlug: shop_slug,
          checkinCount: count ?? 0,
        }));

      } else {
        console.warn(`[send-emails] Unknown email_type: ${email_type} — skipping`);
        continue;
      }

      await resend.emails.send({
        from: "Ventzon <onboarding@resend.dev>",
        to: merchant_email,
        subject,
        html,
      });

      // Mark as sent
      await supabase
        .from("scheduled_emails")
        .update({ sent: true, sent_at: new Date().toISOString() })
        .eq("id", row.id);

      sent++;
      console.log(`[send-emails] Sent ${email_type} to ${merchant_email} (${shop_slug})`);
    } catch (e: any) {
      failed++;
      console.error(`[send-emails] Failed for id=${row.id}:`, e?.message ?? e);
    }
  }

  return NextResponse.json({ ok: true, processed: rows.length, sent, failed });
}

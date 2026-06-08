/**
 * POST /api/verify/student
 *
 * Phase 1 of .edu verification: sends a magic link to the provided
 * .edu address. The link calls GET /api/verify/student/confirm?token=...
 * to complete verification.
 *
 * Body: { customer_id, edu_email }
 * Returns: { ok: true, message: "Check your .edu inbox" }
 *
 * Token is stored as `edu_pending:{token}` in the community_eligibility
 * source field. The row has status='revoked' until confirmed.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://ventzon.com";
const TOKEN_TTL_MINUTES = 30;

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendKey = process.env.RESEND_API_KEY;

    if (!supabaseUrl || !serviceRoleKey)
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

    const body = await req.json().catch(() => ({}));
    const customerId = String(body.customer_id ?? "").trim();
    const eduEmail = String(body.edu_email ?? "").trim().toLowerCase();

    if (!customerId || !eduEmail)
      return NextResponse.json({ error: "Missing customer_id or edu_email" }, { status: 400 });

    if (!eduEmail.endsWith(".edu"))
      return NextResponse.json({ error: "Must be a .edu email address" }, { status: 400 });

    if (!/^[^\s@]+@[^\s@]+\.edu$/.test(eduEmail))
      return NextResponse.json({ error: "Invalid .edu email format" }, { status: 400 });

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify customer exists
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("id", customerId)
      .maybeSingle();
    if (!customer)
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    // Clean up any prior pending tokens for this customer
    await supabase
      .from("community_eligibility")
      .delete()
      .eq("customer_id", customerId)
      .eq("group_key", "student")
      .eq("status", "revoked")
      .like("source", "edu_pending:%");

    // Generate secure token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000).toISOString();

    // Store pending token in community_eligibility (status=revoked until confirmed)
    const { error: pendingErr } = await supabase
      .from("community_eligibility")
      .insert({
        customer_id: customerId,
        group_key: "student",
        scope: "global",
        merchant_id: null,
        source: `edu_pending:${token}`,
        status: "revoked", // activated on confirm
        expires_at: expiresAt,
      });

    if (pendingErr)
      return NextResponse.json({ error: pendingErr.message }, { status: 500 });

    // Send verification email
    if (resendKey) {
      const resend = new Resend(resendKey);
      const confirmUrl = `${BASE_URL}/api/verify/student/confirm?token=${token}`;
      await resend.emails.send({
        from: "Ventzon <onboarding@resend.dev>",
        to: eduEmail,
        subject: "Confirm your student status — Ventzon",
        html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;padding:40px 20px">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden">
    <div style="background:#000;padding:16px 24px">
      <p style="color:#555;font-size:10px;letter-spacing:0.4em;margin:0">VENTZON</p>
    </div>
    <div style="padding:32px 24px">
      <h2 style="font-size:20px;font-weight:300;color:#111;margin:0 0 12px">Confirm your student status</h2>
      <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 24px">
        Click the button below to verify your .edu email and unlock your student discount at participating Ventzon merchants.
        This link expires in ${TOKEN_TTL_MINUTES} minutes.
      </p>
      <a href="${confirmUrl}"
         style="display:inline-block;background:#111;color:#fff;text-decoration:none;border-radius:999px;padding:12px 24px;font-size:12px;letter-spacing:0.15em">
        Confirm student status
      </a>
    </div>
    <div style="padding:16px 24px;border-top:1px solid #eee">
      <p style="font-size:11px;color:#aaa;margin:0">If you didn't request this, ignore this email.</p>
    </div>
  </div>
</body>
</html>`,
      }).catch((err) => console.error("[verify/student] email send failed:", err?.message));
    }

    return NextResponse.json({
      ok: true,
      message: `Verification link sent to ${eduEmail}. Check your inbox (expires in ${TOKEN_TTL_MINUTES} min).`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}

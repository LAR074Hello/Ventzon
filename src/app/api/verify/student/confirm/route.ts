/**
 * GET /api/verify/student/confirm?token=...
 *
 * Confirms .edu student verification. Called when the customer clicks
 * the magic link in their .edu inbox.
 *
 * On success: activates the community_eligibility row (scope='global',
 * source='edu_email'), redirects to /customer/profile?verified=student
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://ventzon.com";

export async function GET(req: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response("Server misconfigured", { status: 500 });
    }

    const url = new URL(req.url);
    const token = String(url.searchParams.get("token") ?? "").trim();
    if (!token) {
      return NextResponse.redirect(`${BASE_URL}/customer/profile?verify_error=missing_token`);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find the pending row with this token
    const { data: pending } = await supabase
      .from("community_eligibility")
      .select("id, customer_id, expires_at")
      .eq("source", `edu_pending:${token}`)
      .eq("group_key", "student")
      .eq("status", "revoked")
      .maybeSingle();

    if (!pending) {
      return NextResponse.redirect(`${BASE_URL}/customer/profile?verify_error=invalid_token`);
    }

    // Check expiry
    if (pending.expires_at && new Date(pending.expires_at) < new Date()) {
      return NextResponse.redirect(`${BASE_URL}/customer/profile?verify_error=expired_token`);
    }

    // Revoke any existing active student badge for this customer
    await supabase
      .from("community_eligibility")
      .update({ status: "revoked" })
      .eq("customer_id", pending.customer_id)
      .eq("group_key", "student")
      .eq("scope", "global")
      .eq("status", "active");

    // Upgrade the pending row to active
    await supabase
      .from("community_eligibility")
      .update({
        source: "edu_email",
        status: "active",
        expires_at: null, // no expiry — re-verify if school re-checks
      })
      .eq("id", pending.id);

    // Badge customer profile (non-fatal)
    try {
      await supabase
        .from("customers")
        .update({ community_badge: "student" })
        .eq("id", pending.customer_id);
    } catch (_) { /* non-fatal */ }

    return NextResponse.redirect(`${BASE_URL}/customer/profile?verified=student`);
  } catch (e: any) {
    console.error("[verify/student/confirm] exception:", e?.message);
    return NextResponse.redirect(`${BASE_URL}/customer/profile?verify_error=server_error`);
  }
}

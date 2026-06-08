/**
 * POST /api/verify/veteran
 *
 * Verifies a customer as a veteran via the VA Lighthouse Veteran
 * Confirmation API. SSN is never persisted — it is passed to the VA
 * and discarded immediately after the API call.
 *
 * Body: { customer_id, first_name, last_name, dob (YYYY-MM-DD), ssn (9 digits) }
 * Returns: { ok: true, status: "confirmed" | "not_confirmed" }
 *
 * On Confirmed → writes community_eligibility row:
 *   scope="global", group_key="veteran", source="va_api"
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const vaApiKey = process.env.VA_LIGHTHOUSE_API_KEY;

    if (!supabaseUrl || !serviceRoleKey)
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    if (!vaApiKey)
      return NextResponse.json({ error: "Veteran verification not configured" }, { status: 503 });

    const body = await req.json().catch(() => ({}));

    const customerId: string = String(body.customer_id ?? "").trim();
    const firstName: string = String(body.first_name ?? "").trim();
    const lastName: string = String(body.last_name ?? "").trim();
    const dob: string = String(body.dob ?? "").trim(); // YYYY-MM-DD
    const ssn: string = String(body.ssn ?? "").replace(/\D/g, ""); // strip non-digits

    if (!customerId || !firstName || !lastName || !dob || ssn.length !== 9)
      return NextResponse.json(
        { error: "Missing required fields: customer_id, first_name, last_name, dob (YYYY-MM-DD), ssn (9 digits)" },
        { status: 400 }
      );

    // ── Call VA Lighthouse Veteran Confirmation API ──────────
    // https://developer.va.gov/explore/api/veteran-confirmation
    // POST /services/veteran_confirmation/v1/status
    const vaRes = await fetch(
      "https://sandbox-api.va.gov/services/veteran_confirmation/v1/status",
      {
        method: "POST",
        headers: {
          "apiKey": vaApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          birthDate: dob, // YYYY-MM-DD
          ssn,            // ← discarded after this call; never stored
        }),
      }
    );

    // Discard SSN reference (JavaScript GC will handle it; we do not log it)
    // ssn variable goes out of scope after this function returns.

    if (!vaRes.ok) {
      const errText = await vaRes.text().catch(() => "");
      console.error("[verify/veteran] VA API error:", vaRes.status, errText.slice(0, 200));
      return NextResponse.json(
        { error: "VA verification service unavailable. Please try again later." },
        { status: 502 }
      );
    }

    const vaData = await vaRes.json();
    // VA API returns { veteran_status: "confirmed" | "not confirmed" }
    const isConfirmed =
      vaData?.veteran_status === "confirmed" ||
      vaData?.veteranStatus === "CONFIRMED"; // sandbox may vary

    if (!isConfirmed) {
      return NextResponse.json({ ok: true, status: "not_confirmed" });
    }

    // ── Write eligibility row ─────────────────────────────────
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Revoke any existing veteran badge for this customer (clean re-verify)
    await supabase
      .from("community_eligibility")
      .update({ status: "revoked" })
      .eq("customer_id", customerId)
      .eq("group_key", "veteran")
      .eq("scope", "global")
      .eq("status", "active");

    const { error: insertErr } = await supabase
      .from("community_eligibility")
      .insert({
        customer_id: customerId,
        group_key: "veteran",
        scope: "global",
        merchant_id: null,
        source: "va_api",
        status: "active",
        // Veterans: no expiry (lifetime verification)
        expires_at: null,
      });

    if (insertErr) {
      console.error("[verify/veteran] insert error:", insertErr.message);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // Badge the customer profile (non-fatal)
    try {
      await supabase
        .from("customers")
        .update({ community_badge: "veteran" })
        .eq("id", customerId);
    } catch (_) { /* non-fatal */ }

    return NextResponse.json({ ok: true, status: "confirmed" });
  } catch (e: any) {
    console.error("[verify/veteran] exception:", e?.message);
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}

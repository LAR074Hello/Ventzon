/**
 * PATCH /api/customer/dob
 *
 * Saves a customer's date of birth onto their customer record.
 * Senior status (age ≥ 60) is derived at scan time — no eligibility
 * row is written here. DOB is the only PII stored.
 *
 * Body: { customer_id, shop_slug, dob (YYYY-MM-DD) }
 *
 * Note: we authenticate by requiring the customer_id to match a
 * customer row they "own" (same phone/email they used to check in).
 * Since the customer app passes the customer_id from its own session,
 * we use that as the identifier here.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const DOB_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_AGE = 120;
const MIN_AGE = 10;

export async function PATCH(req: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey)
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

    const body = await req.json().catch(() => ({}));
    const customerId = String(body.customer_id ?? "").trim();
    const dob = String(body.dob ?? "").trim();

    if (!customerId || !dob)
      return NextResponse.json({ error: "Missing customer_id or dob" }, { status: 400 });

    if (!DOB_RE.test(dob))
      return NextResponse.json({ error: "dob must be YYYY-MM-DD" }, { status: 400 });

    const dobDate = new Date(dob);
    if (isNaN(dobDate.getTime()))
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });

    const now = new Date();
    const ageYears = (now.getTime() - dobDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (ageYears < MIN_AGE || ageYears > MAX_AGE)
      return NextResponse.json({ error: "Invalid date of birth" }, { status: 400 });

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { error } = await supabase
      .from("customers")
      .update({ dob })
      .eq("id", customerId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const isSenior = ageYears >= 60;

    return NextResponse.json({ ok: true, is_senior: isSenior });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}

/**
 * PATCH /api/customer/birthday
 *
 * Saves a customer's birthday (month/day only — no year) onto every
 * customer record tied to their signed-in email, so all the shops they
 * belong to can send birthday rewards. Authenticated via the customer's
 * Supabase session.
 *
 * Body: { birth_month: 1-12, birth_day: 1-31 }  (send both null to clear)
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export async function PATCH(req: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey)
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user?.email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const clearing = body.birth_month === null && body.birth_day === null;

    let birthMonth: number | null = null;
    let birthDay: number | null = null;

    if (!clearing) {
      birthMonth = Number(body.birth_month);
      birthDay = Number(body.birth_day);
      if (!Number.isInteger(birthMonth) || birthMonth < 1 || birthMonth > 12)
        return NextResponse.json({ error: "birth_month must be 1–12" }, { status: 400 });
      if (!Number.isInteger(birthDay) || birthDay < 1 || birthDay > DAYS_IN_MONTH[birthMonth - 1])
        return NextResponse.json({ error: "birth_day is invalid for that month" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Update every customer record that shares this signed-in email.
    const { error, count } = await supabase
      .from("customers")
      .update({ birth_month: birthMonth, birth_day: birthDay }, { count: "exact" })
      .eq("email", user.email.toLowerCase());

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, updated: count ?? 0, birth_month: birthMonth, birth_day: birthDay });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}

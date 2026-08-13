import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getOrCreateProfile } from "@/lib/social";

export const dynamic = "force-dynamic";

// The consumer app's age floor. Distinct from the merchant senior-discount
// flow (src/app/api/customer/dob, MIN_AGE = 10) — do not conflate them.
const MIN_AGE = 13;

function admin() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** Parse + verify a YYYY-MM-DD string is a real calendar date. */
function parseDob(dob: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return null;
  const [y, m, d] = dob.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  )
    return null;
  return date;
}

/** Age in whole years on `now` (birthday-aware). */
function ageOn(birth: Date, now = new Date()) {
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

// GET /api/customer/age-gate → { status: "verified" | "blocked" | "missing" }
// "blocked" wins over a stored dob: once a refusal is recorded the account
// stays blocked even if a later attempt supplies an adult date.
export async function GET() {
  try {
    const supabaseAuth = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();
    if (!user?.email)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    // Probe the two age-gate columns EXPLICITLY. Until 20260812_age_gate runs
    // they don't exist, and a select("*") would silently omit them — which
    // would leave the gate showing a form whose submit then fails. So the gate
    // must fail OPEN in the deployed-but-not-migrated window: report
    // "verified" (no gate) so nothing changes for any user until the columns
    // actually exist. A different query error is a real failure and 500s.
    const db = admin();
    const { data: probe, error: probeErr } = await db
      .from("customer_profiles")
      .select("dob, underage_refused_at")
      .eq("email", user.email.toLowerCase())
      .maybeSingle();
    if (probeErr) {
      if (/does not exist/.test(probeErr.message)) {
        return NextResponse.json({ status: "verified" });
      }
      throw new Error(probeErr.message);
    }

    let status: "verified" | "blocked" | "missing" = "missing";
    if (probe?.underage_refused_at) status = "blocked";
    else if (probe?.dob) status = "verified";

    return NextResponse.json({ status });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 });
  }
}

// POST /api/customer/age-gate { dob: "YYYY-MM-DD" }
// 13+ → store the dob and continue. Under 13 → record ONLY the refusal
// timestamp (never the child's DOB) and block. Idempotent: a blocked account
// stays blocked without re-validating.
export async function POST(req: Request) {
  try {
    const supabaseAuth = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();
    if (!user?.email)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const dobStr = String(body?.dob ?? "").trim();
    const dob = parseDob(dobStr);
    if (!dob)
      return NextResponse.json({ error: "Please enter a valid date of birth." }, { status: 400 });

    const now = new Date();
    if (dob > now)
      return NextResponse.json({ error: "That date hasn't happened yet." }, { status: 400 });
    if (dob.getFullYear() < 1900)
      return NextResponse.json({ error: "That date doesn't look right." }, { status: 400 });

    const db = admin();
    const profile = await getOrCreateProfile(db, user.email);
    if (profile?.underage_refused_at) {
      return NextResponse.json({ ok: false, status: "blocked" });
    }

    if (ageOn(dob, now) < MIN_AGE) {
      await db
        .from("customer_profiles")
        .update({ underage_refused_at: now.toISOString(), updated_at: now.toISOString() })
        .eq("email", user.email.toLowerCase());
      return NextResponse.json({ ok: false, status: "blocked" });
    }

    await db
      .from("customer_profiles")
      .update({ dob: dobStr, updated_at: now.toISOString() })
      .eq("email", user.email.toLowerCase());

    return NextResponse.json({ ok: true, status: "verified" });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 });
  }
}

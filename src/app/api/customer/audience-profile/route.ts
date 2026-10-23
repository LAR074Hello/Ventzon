import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { EMPTY_AUDIENCE, sanitizeAudience } from "@/lib/audience";

export const dynamic = "force-dynamic";

const COLUMNS =
  "dob, age_range, interests, going_out_for, food_prefs, price_pref, home_area, audience_prompt_done_at";

// Audience questions are for adults only. The app admits 13+, so anyone
// without a recorded 18+ date of birth is never asked and never counted.
function isAdult(dob: unknown): boolean {
  if (typeof dob !== "string") return false;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return false;
  const eighteen = new Date(d);
  eighteen.setFullYear(eighteen.getFullYear() + 18);
  return eighteen.getTime() <= Date.now();
}

async function sessionEmail(): Promise<string | null> {
  const supabaseAuth = await createSupabaseServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  return user?.email?.toLowerCase() ?? null;
}

function admin() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

// GET → the signed-in user's audience profile, whether the setup prompt
// should show, and the neighborhoods to pick from.
export async function GET() {
  try {
    const email = await sessionEmail();
    if (!email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const supabase = admin();

    const { data, error } = await supabase
      .from("customer_profiles")
      .select(COLUMNS)
      .eq("email", email)
      .maybeSingle();
    // Schema not migrated yet: behave as if the feature is off.
    if (error || !data || !isAdult(data.dob)) {
      return NextResponse.json({ eligible: false, profile: EMPTY_AUDIENCE, show_prompt: false, neighborhoods: [] });
    }

    const { data: hoods } = await supabase
      .from("places")
      .select("neighborhood")
      .not("neighborhood", "is", null)
      .limit(5000);
    const neighborhoods = Array.from(
      new Set((hoods ?? []).map((h) => String(h.neighborhood).trim()).filter(Boolean))
    ).sort();

    return NextResponse.json({
      eligible: true,
      profile: sanitizeAudience(data as Record<string, unknown>),
      show_prompt: !data.audience_prompt_done_at,
      neighborhoods,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 });
  }
}

// PATCH { ...profile fields, done?: true } → saves only known values.
// done marks the setup prompt as finished or skipped so it never reappears.
export async function PATCH(req: Request) {
  try {
    const email = await sessionEmail();
    if (!email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const supabase = admin();
    const { data: me } = await supabase.from("customer_profiles").select("dob").eq("email", email).maybeSingle();
    if (!me || !isAdult(me.dob)) {
      return NextResponse.json({ error: "Not available" }, { status: 403 });
    }
    const update: Record<string, unknown> = {};
    if (body.profile && typeof body.profile === "object") {
      Object.assign(update, sanitizeAudience(body.profile as Record<string, unknown>));
    }
    if (body.done === true) update.audience_prompt_done_at = new Date().toISOString();
    if (Object.keys(update).length === 0) return NextResponse.json({ ok: true });

    const { error } = await supabase.from("customer_profiles").update(update).eq("email", email);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 });
  }
}

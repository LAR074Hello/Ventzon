import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getOrCreateProfile } from "@/lib/social";
import { attributeReferral, ensureReferralCode } from "@/lib/referral";

export const dynamic = "force-dynamic";

function adminClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getSessionEmail(): Promise<string | null> {
  const supabaseAuth = await createSupabaseServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  return user?.email?.toLowerCase() ?? null;
}

// GET /api/customer/referral → { code, link, referral_count }
//
// The code is generated server-side on first touch if missing, so every
// user has one; the count is a real count of the referrals table. Nothing
// here is fabricated or client-influenced.
export async function GET(req: Request) {
  try {
    const email = await getSessionEmail();
    if (!email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const admin = adminClient();
    // Lazy profile creation, same as every social route, so the code has a
    // row to live on.
    await getOrCreateProfile(admin, email);
    const code = await ensureReferralCode(admin, email);
    const { count } = await admin
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_email", email);

    const origin = new URL(req.url).origin;
    return NextResponse.json({
      code,
      link: `${origin}/invite/${code}`,
      referral_count: count ?? 0,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/customer/referral { code } → idempotent, server-side attribution.
//
// The client supplies only a code; the referrer is resolved server-side.
// Self-referral, duplicate attribution and onboarding completion are all
// enforced here, never on the client.
export async function POST(req: Request) {
  try {
    const email = await getSessionEmail();
    if (!email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const code = String(body?.code ?? "");
    const admin = adminClient();
    await getOrCreateProfile(admin, email);

    const outcome = await attributeReferral(admin, email, code);
    switch (outcome.status) {
      case "attributed":
        return NextResponse.json({ ok: true, status: "attributed" });
      case "already_attributed":
        return NextResponse.json({ ok: true, status: "already_attributed" });
      case "pending_onboarding":
        return NextResponse.json({ ok: true, status: "pending_onboarding" });
      case "self_referral":
        return NextResponse.json({ error: "You cannot refer yourself" }, { status: 400 });
      case "invalid_code":
        return NextResponse.json({ error: "That referral code is not valid" }, { status: 400 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

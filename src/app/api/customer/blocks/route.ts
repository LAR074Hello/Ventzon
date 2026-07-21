import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";

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

// GET /api/customer/blocks → accounts the current user has blocked
export async function GET() {
  try {
    const email = await getSessionEmail();
    if (!email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const admin = adminClient();
    const { data: blocks } = await admin
      .from("user_blocks")
      .select("blocked_email, created_at")
      .eq("blocker_email", email)
      .order("created_at", { ascending: false });

    const emails = (blocks ?? []).map((b) => b.blocked_email);
    const { data: profiles } = emails.length
      ? await admin
          .from("customer_profiles")
          .select("id, email, display_name, avatar_url")
          .in("email", emails)
      : { data: [] };
    const byEmail: Record<string, any> = {};
    for (const p of profiles ?? []) byEmail[p.email] = p;

    return NextResponse.json({
      blocks: (blocks ?? []).map((b) => ({
        profile_id: byEmail[b.blocked_email]?.id ?? null,
        display_name: byEmail[b.blocked_email]?.display_name ?? "Member",
        avatar_url: byEmail[b.blocked_email]?.avatar_url ?? null,
        created_at: b.created_at,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

// POST /api/customer/blocks { profile_id, block: boolean }
// Blocking severs the follow relationship in both directions.
export async function POST(req: Request) {
  try {
    const email = await getSessionEmail();
    if (!email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const profileId = String(body?.profile_id ?? "").trim();
    const block = Boolean(body?.block);
    if (!profileId) return NextResponse.json({ error: "Missing profile_id" }, { status: 400 });

    const admin = adminClient();
    const { data: target } = await admin
      .from("customer_profiles")
      .select("email")
      .eq("id", profileId)
      .maybeSingle();
    if (!target) return NextResponse.json({ error: "Account not found" }, { status: 404 });
    if (target.email === email) {
      return NextResponse.json({ error: "You can't block yourself" }, { status: 400 });
    }

    if (block) {
      const { error } = await admin
        .from("user_blocks")
        .upsert(
          { blocker_email: email, blocked_email: target.email },
          { onConflict: "blocker_email,blocked_email" }
        );
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // Sever follows both ways
      await admin.from("user_follows").delete()
        .eq("follower_email", email).eq("followee_email", target.email);
      await admin.from("user_follows").delete()
        .eq("follower_email", target.email).eq("followee_email", email);
    } else {
      await admin.from("user_blocks").delete()
        .eq("blocker_email", email).eq("blocked_email", target.email);
    }

    return NextResponse.json({ ok: true, blocked: block });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

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

// GET /api/customer/user-follows → creators the current user follows
export async function GET() {
  try {
    const email = await getSessionEmail();
    if (!email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const admin = adminClient();
    const { data: follows, error } = await admin
      .from("user_follows")
      .select("followee_email, created_at")
      .eq("follower_email", email);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const emails = (follows ?? []).map((f) => f.followee_email);
    const { data: profiles } = emails.length
      ? await admin
          .from("customer_profiles")
          .select("id, email, display_name, avatar_url, is_creator")
          .in("email", emails)
      : { data: [] };

    const byEmail: Record<string, any> = {};
    for (const p of profiles ?? []) byEmail[p.email] = p;

    return NextResponse.json({
      following: (follows ?? []).map((f) => {
        const p = byEmail[f.followee_email];
        return {
          profile_id: p?.id ?? null,
          display_name: p?.display_name ?? "Creator",
          avatar_url: p?.avatar_url ?? null,
          created_at: f.created_at,
        };
      }),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

// POST /api/customer/user-follows { profile_id, follow: boolean }
export async function POST(req: Request) {
  try {
    const email = await getSessionEmail();
    if (!email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const profileId = String(body?.profile_id ?? "").trim();
    const follow = Boolean(body?.follow);
    if (!profileId) return NextResponse.json({ error: "Missing profile_id" }, { status: 400 });

    const admin = adminClient();
    const { data: target } = await admin
      .from("customer_profiles")
      .select("email, is_creator")
      .eq("id", profileId)
      .maybeSingle();
    if (!target || !target.is_creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }
    if (target.email === email) {
      return NextResponse.json({ error: "You can't follow yourself" }, { status: 400 });
    }

    if (follow) {
      const { error } = await admin
        .from("user_follows")
        .upsert(
          { follower_email: email, followee_email: target.email },
          { onConflict: "follower_email,followee_email" }
        );
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      const { error } = await admin
        .from("user_follows")
        .delete()
        .eq("follower_email", email)
        .eq("followee_email", target.email);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, following: follow });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

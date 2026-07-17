import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getOrCreateProfile, creatorStats, computeBadges } from "@/lib/social";

export const dynamic = "force-dynamic";

function adminClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getSessionUser() {
  const supabaseAuth = await createSupabaseServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  return user?.email ? user : null;
}

// GET /api/customer/creator-profile → own profile + stats + badges
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const admin = adminClient();
    const profile = await getOrCreateProfile(admin, user.email!, {
      display_name: user.user_metadata?.full_name ?? null,
      avatar_url: user.user_metadata?.avatar_url ?? null,
    });
    const stats = await creatorStats(admin, user.email!);
    const badges = computeBadges(stats);

    return NextResponse.json({ profile, stats, badges });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

// PUT /api/customer/creator-profile { is_creator?, bio?, show_on_leaderboard?, display_name? }
export async function PUT(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const updates: Record<string, unknown> = {};
    if (typeof body?.is_creator === "boolean") updates.is_creator = body.is_creator;
    if (typeof body?.show_on_leaderboard === "boolean") updates.show_on_leaderboard = body.show_on_leaderboard;
    if (typeof body?.bio === "string") updates.bio = body.bio.slice(0, 500);
    if (typeof body?.display_name === "string" && body.display_name.trim()) {
      updates.display_name = body.display_name.trim().slice(0, 80);
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields" }, { status: 400 });
    }

    const admin = adminClient();
    await getOrCreateProfile(admin, user.email!, {
      display_name: user.user_metadata?.full_name ?? null,
      avatar_url: user.user_metadata?.avatar_url ?? null,
    });
    const { data, error } = await admin
      .from("customer_profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("email", user.email!.toLowerCase())
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, profile: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

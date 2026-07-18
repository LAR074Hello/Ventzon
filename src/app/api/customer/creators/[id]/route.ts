import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { creatorStats, computeBadges } from "@/lib/social";

export const dynamic = "force-dynamic";

// GET /api/customer/creators/[id] → public creator profile by profile id.
// Only profiles with is_creator = true are visible — becoming a creator
// is the opt-in that makes a profile (and its activity) public.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profile } = await admin
      .from("customer_profiles")
      .select("id, email, display_name, avatar_url, bio, is_creator, created_at")
      .eq("id", id)
      .maybeSingle();

    if (!profile || !profile.is_creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    const stats = await creatorStats(admin, profile.email);
    const badges = computeBadges(stats);

    const { data: posts } = await admin
      .from("posts")
      .select("id, body, shop_slug, media_url, media_type, created_at")
      .eq("author_email", profile.email)
      .order("created_at", { ascending: false })
      .limit(30);

    // Viewer relationship (optional — viewer may be signed out): do they
    // follow this creator, and does this creator follow them back?
    let viewerFollows = false;
    let followsViewer = false;
    let isOwn = false;
    try {
      const supabaseAuth = await createSupabaseServerClient();
      const { data: { user } } = await supabaseAuth.auth.getUser();
      if (user?.email) {
        const viewerEmail = user.email.toLowerCase();
        isOwn = viewerEmail === profile.email;
        if (!isOwn) {
          const [{ data: follow }, { data: reverse }] = await Promise.all([
            admin
              .from("user_follows")
              .select("id")
              .eq("follower_email", viewerEmail)
              .eq("followee_email", profile.email)
              .maybeSingle(),
            admin
              .from("user_follows")
              .select("id")
              .eq("follower_email", profile.email)
              .eq("followee_email", viewerEmail)
              .maybeSingle(),
          ]);
          viewerFollows = !!follow;
          followsViewer = !!reverse;
        }
      }
    } catch {}

    // Never expose the raw email on a public profile.
    const { email: _email, ...publicProfile } = profile;
    return NextResponse.json({
      profile: publicProfile,
      stats,
      badges,
      posts: posts ?? [],
      viewer: { follows: viewerFollows, follows_you: followsViewer, is_own: isOwn },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

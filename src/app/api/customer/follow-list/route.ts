import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getBlockedSet } from "@/lib/social";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;
const MAX_EDGES = 500;

// GET /api/customer/follow-list
//   ?profile_id=…&type=followers|following   (creator, or your own profile)
//   ?shop_slug=…&type=followers              (a business's followers)
//   [&q=search][&offset=0]
//
// Returns avatar/name/bio rows with the viewer's follow state inline so
// lists support follow-back without leaving. Non-creator entries appear
// by name but aren't linkable or followable (their profiles are private).
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const profileId = url.searchParams.get("profile_id")?.trim() || null;
    const shopSlug = url.searchParams.get("shop_slug")?.toLowerCase().trim() || null;
    const type = url.searchParams.get("type") === "following" ? "following" : "followers";
    const q = url.searchParams.get("q")?.trim().toLowerCase() || "";
    const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "0", 10) || 0);

    if (!profileId && !shopSlug) {
      return NextResponse.json({ error: "Missing profile_id or shop_slug" }, { status: 400 });
    }

    const admin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let viewerEmail: string | null = null;
    try {
      const supabaseAuth = await createSupabaseServerClient();
      const { data: { user } } = await supabaseAuth.auth.getUser();
      viewerEmail = user?.email?.toLowerCase() ?? null;
    } catch {}

    // Resolve the subject's follow edges → a list of emails.
    let emails: string[] = [];
    if (profileId) {
      const { data: subject } = await admin
        .from("customer_profiles")
        .select("email, is_creator")
        .eq("id", profileId)
        .maybeSingle();
      if (!subject) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      const isOwn = viewerEmail === subject.email;
      if (!subject.is_creator && !isOwn) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      }
      if (type === "followers") {
        const { data } = await admin
          .from("user_follows")
          .select("follower_email")
          .eq("followee_email", subject.email)
          .order("created_at", { ascending: false })
          .limit(MAX_EDGES);
        emails = (data ?? []).map((r) => r.follower_email);
      } else {
        const { data } = await admin
          .from("user_follows")
          .select("followee_email")
          .eq("follower_email", subject.email)
          .order("created_at", { ascending: false })
          .limit(MAX_EDGES);
        emails = (data ?? []).map((r) => r.followee_email);
      }
    } else {
      // A shop's followers (customer_follows is user → shop).
      const { data: shop } = await admin
        .from("shops")
        .select("slug")
        .eq("slug", shopSlug!)
        .maybeSingle();
      if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });
      const { data } = await admin
        .from("customer_follows")
        .select("email")
        .eq("shop_slug", shopSlug!)
        .order("created_at", { ascending: false })
        .limit(MAX_EDGES);
      emails = (data ?? []).map((r) => r.email);
    }

    const blocked = await getBlockedSet(admin, viewerEmail);
    emails = emails.filter((e) => !blocked.has(e));

    if (emails.length === 0) {
      return NextResponse.json({ items: [], total: 0, has_more: false });
    }

    const { data: profiles } = await admin
      .from("customer_profiles")
      .select("id, email, display_name, avatar_url, bio, is_creator")
      .in("email", emails);
    const profileByEmail: Record<string, any> = {};
    for (const p of profiles ?? []) profileByEmail[p.email] = p;

    // Which of these does the viewer already follow?
    const viewerFollows = new Set<string>();
    if (viewerEmail) {
      const { data: vf } = await admin
        .from("user_follows")
        .select("followee_email")
        .eq("follower_email", viewerEmail)
        .in("followee_email", emails);
      for (const r of vf ?? []) viewerFollows.add(r.followee_email);
    }

    // Preserve recency order from the edge query.
    let items = emails.map((email) => {
      const p = profileByEmail[email];
      return {
        profile_id: p?.is_creator ? p.id : null,
        display_name: p?.display_name ?? "Member",
        avatar_url: p?.avatar_url ?? null,
        bio: p?.bio ? String(p.bio).slice(0, 80) : null,
        is_creator: p?.is_creator ?? false,
        followed_by_viewer: viewerFollows.has(email),
        is_self: viewerEmail === email,
      };
    });

    if (q) {
      items = items.filter((i) => i.display_name.toLowerCase().includes(q));
    }

    const total = items.length;
    const page = items.slice(offset, offset + PAGE_SIZE);

    return NextResponse.json({
      items: page,
      total,
      has_more: offset + PAGE_SIZE < total,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

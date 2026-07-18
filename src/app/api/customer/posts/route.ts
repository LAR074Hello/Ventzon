import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getOrCreateProfile } from "@/lib/social";

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

// GET /api/customer/posts → the current user's own posts (any role —
// the Profile tab grid shows them even before becoming a creator)
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const admin = adminClient();
    const { data, error } = await admin
      .from("posts")
      .select("id, body, shop_slug, media_url, media_type, created_at")
      .eq("author_email", user.email!.toLowerCase())
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ posts: data ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

// POST /api/customer/posts { body, shop_slug? } — creators only
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const payload = await req.json().catch(() => ({}));
    const text = String(payload?.body ?? "").trim().slice(0, 1000);
    const shopSlug = payload?.shop_slug ? String(payload.shop_slug).toLowerCase().trim() : null;
    const mediaUrl = payload?.media_url ? String(payload.media_url).trim() : null;
    const mediaType =
      payload?.media_type === "image" || payload?.media_type === "video"
        ? payload.media_type
        : null;
    if (!text && !mediaUrl) {
      return NextResponse.json({ error: "Post body or media required" }, { status: 400 });
    }
    if (mediaUrl && (!/^https:\/\//.test(mediaUrl) || !mediaType)) {
      return NextResponse.json({ error: "Invalid media" }, { status: 400 });
    }

    const admin = adminClient();
    const profile = await getOrCreateProfile(admin, user.email!);
    if (!profile.is_creator) {
      return NextResponse.json({ error: "Become a creator to post" }, { status: 403 });
    }

    if (shopSlug) {
      const { data: shop } = await admin
        .from("shops")
        .select("slug")
        .eq("slug", shopSlug)
        .maybeSingle();
      if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const { data, error } = await admin
      .from("posts")
      .insert({
        author_email: user.email!.toLowerCase(),
        shop_slug: shopSlug,
        body: text,
        media_url: mediaUrl,
        media_type: mediaUrl ? mediaType : null,
        // 'community' (no linked business) stays stubbed off — see the
        // COMMUNITY_FEED_ENABLED note in /api/customer/feed.
        post_kind: "business",
      })
      .select("id, body, shop_slug, media_url, media_type, created_at")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, post: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

// DELETE /api/customer/posts?id=… — delete your own post
export async function DELETE(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const admin = adminClient();
    const { error } = await admin
      .from("posts")
      .delete()
      .eq("id", id)
      .eq("author_email", user.email!.toLowerCase());
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

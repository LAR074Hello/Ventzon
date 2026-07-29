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
    // No creator gate. Posting is the first thing we want a new user to do,
    // and requiring them to adopt a "creator" identity first put an identity
    // change in front of the one action the product needs. is_creator is now
    // a description of someone who has posted, not a permission to post.
    const profile = await getOrCreateProfile(admin, user.email!);

    // A PLACE IS REQUIRED. Ventzon is place-anchored: an untagged post is an
    // Instagram post with extra steps. It also used to be worse than useless —
    // the feed requires a place link, so an untagged post returned 200,
    // appeared on the author's own profile, and never reached the feed. The
    // user saw a successful post that nobody could ever see.
    if (!shopSlug) {
      return NextResponse.json(
        { error: "Pick a place before posting.", code: "place_required" },
        { status: 400 }
      );
    }

    // Resolve the tag against PLACES, which is the identity that outlives a
    // claim. Every imported place exists only in `places`.
    //
    // shop_slug carries a FOREIGN KEY to shops.slug, so it can only be set
    // when a merchant account actually exists — writing an imported slug there
    // fails at the database, not in application code. This is precisely what
    // posts.place_id was added for in Migration C: both columns coexist, new
    // writes populate what they legitimately can, and reads prefer place_id
    // with a shop_slug fallback.
    let placeId: string | null = null;
    let shopSlugForRow: string | null = null;
    if (shopSlug) {
      const [{ data: place }, { data: shop }] = await Promise.all([
        admin.from("places").select("id, slug").eq("slug", shopSlug).maybeSingle(),
        admin.from("shops").select("slug").eq("slug", shopSlug).maybeSingle(),
      ]);
      if (!place && !shop) {
        return NextResponse.json({ error: "Place not found" }, { status: 404 });
      }
      placeId = place?.id ?? null;
      shopSlugForRow = shop ? shopSlug : null;
    }

    const { data, error } = await admin
      .from("posts")
      .insert({
        author_email: user.email!.toLowerCase(),
        shop_slug: shopSlugForRow,
        place_id: placeId,
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

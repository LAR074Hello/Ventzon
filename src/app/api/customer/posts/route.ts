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

// POST /api/customer/posts { body, shop_slug? } — creators only
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const payload = await req.json().catch(() => ({}));
    const text = String(payload?.body ?? "").trim().slice(0, 1000);
    const shopSlug = payload?.shop_slug ? String(payload.shop_slug).toLowerCase().trim() : null;
    if (!text) return NextResponse.json({ error: "Post body required" }, { status: 400 });

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
      })
      .select("id, body, shop_slug, created_at")
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

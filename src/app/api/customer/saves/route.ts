import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getBlockedSet } from "@/lib/social";

export const dynamic = "force-dynamic";

// GET /api/customer/saves — the viewer's saved posts, newest save first.
// This is the "want to go" list: saving a post is the strongest
// visit-intent signal in the app, so each row carries the linked shop
// and the viewer's live reward progress there.
export async function GET() {
  try {
    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const email = user.email.toLowerCase();

    const admin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: saves, error } = await admin
      .from("post_saves")
      .select("post_id, created_at")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!saves?.length) return NextResponse.json({ posts: [], shops: [] });

    const { data: posts } = await admin
      .from("posts")
      .select("id, author_email, shop_slug, body, media_url, media_type, created_at")
      .in("id", saves.map((s) => s.post_id))
      .eq("hidden", false);

    // A saved post from someone you've since blocked shouldn't resurface.
    const blocked = await getBlockedSet(admin, email);
    const visible = (posts ?? []).filter((p) => !blocked.has(p.author_email));

    // Preserve save recency (most recently saved first).
    const order = new Map(saves.map((s, i) => [s.post_id, i]));
    visible.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

    // Roll up the distinct places these saves point to, with live
    // progress — the actual "want to go" list.
    const slugs = [...new Set(visible.map((p) => p.shop_slug).filter(Boolean))] as string[];
    const [{ data: settings }, { data: shopRows }, { data: memberships }] = await Promise.all([
      slugs.length
        ? admin.from("shop_settings").select("shop_slug, shop_name, deal_title, reward_goal").in("shop_slug", slugs)
        : Promise.resolve({ data: [] as any[] }),
      slugs.length
        ? admin.from("shops").select("slug, logo_url").in("slug", slugs)
        : Promise.resolve({ data: [] as any[] }),
      admin.from("customers").select("shop_slug, visits").eq("email", email),
    ]);

    const settingsMap: Record<string, any> = {};
    for (const s of settings ?? []) settingsMap[s.shop_slug] = s;
    const logoMap: Record<string, string | null> = {};
    for (const s of shopRows ?? []) logoMap[s.slug] = s.logo_url ?? null;
    const visitMap: Record<string, number> = {};
    for (const m of memberships ?? []) visitMap[m.shop_slug] = m.visits ?? 0;

    const shops = slugs.map((slug) => {
      const goal = settingsMap[slug]?.reward_goal ?? 5;
      const visits = visitMap[slug] ?? 0;
      return {
        shop_slug: slug,
        shop_name: settingsMap[slug]?.shop_name ?? slug,
        deal_title: settingsMap[slug]?.deal_title ?? null,
        logo_url: logoMap[slug] ?? null,
        visits,
        goal,
        remaining: Math.max(goal - visits, 0),
        visited: visits > 0,
      };
    });

    return NextResponse.json({
      posts: visible.map((p) => ({
        id: p.id,
        body: p.body,
        media_url: p.media_url,
        media_type: p.media_type,
        created_at: p.created_at,
      })),
      shops,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

/**
 * Generate a URL-safe slug.
 * (Keep this server-side; users should never see "slug" in UI copy.)
 */
function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Ensure slug is unique in public.shops.
 * If "pom" exists, try "pom-2", "pom-3", ...
 */
async function makeUniqueSlug(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  base: string
) {
  let candidate = base;
  let n = 2;

  // quick sanity fallback
  if (!candidate) candidate = `shop-${Date.now()}`;

  while (true) {
    const { data, error } = await supabase
      .from("shops")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (error) throw error;
    if (!data) return candidate;

    candidate = `${base}-${n}`;
    n += 1;
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    // 1) Must be logged in
    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr) return NextResponse.json({ error: userErr.message }, { status: 401 });

    const user = userRes.user;
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    // 2) Read body
    const body = await req.json().catch(() => ({}));
    const shopName = typeof body.shopName === "string" ? body.shopName.trim() : "";
    if (!shopName) return NextResponse.json({ error: "Missing shopName" }, { status: 400 });

    // 3) Build unique slug
    const baseSlug = slugify(shopName);
    const shopSlug = await makeUniqueSlug(supabase, baseSlug);

    // 4) Create shop
    const { data: shopRow, error: shopErr } = await supabase
      .from("shops")
      .insert({
        slug: shopSlug,
        user_id: user.id,
        is_paid: false,
        subscription_status: "inactive",
      })
      .select("id, slug")
      .single();

    if (shopErr) return NextResponse.json({ error: shopErr.message }, { status: 400 });

    // 5) Link user to shop (multi-shop ready)
    const { error: memberErr } = await supabase.from("shop_members").insert({
      shop_id: shopRow.id,
      user_id: user.id,
      role: "owner",
    });
    if (memberErr) return NextResponse.json({ error: memberErr.message }, { status: 400 });

    // 5.5) Create default shop settings (prevents FK error on dashboard)
    // IMPORTANT: this assumes shop_settings has a "shop_slug" column FK -> shops.slug
    // If your table uses shop_id instead, tell me and I’ll adjust.
    const { error: settingsErr } = await supabase.from("shop_settings").insert({
      shop_slug: shopRow.slug,
      // put whatever defaults your UI expects:
      goal: "collect_phone", // example default
      offer_text: "",
      welcome_text: "",
      terms_text: "",
    });

    if (settingsErr) {
      return NextResponse.json({ error: settingsErr.message }, { status: 400 });
    }

    // 6) Done
    return NextResponse.json({ shopSlug: shopRow.slug }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// GET /api/customer/friend-activity — recent check-ins by creators the
// current user follows. Only creators appear: becoming a creator is the
// explicit opt-in that makes activity visible to followers.
export async function GET() {
  try {
    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const email = user.email.toLowerCase();

    const { data: follows } = await admin
      .from("user_follows")
      .select("followee_email")
      .eq("follower_email", email);
    const followeeEmails = (follows ?? []).map((f) => f.followee_email);
    if (followeeEmails.length === 0) return NextResponse.json({ activity: [] });

    const { data: profiles } = await admin
      .from("customer_profiles")
      .select("id, email, display_name, avatar_url")
      .in("email", followeeEmails)
      .eq("is_creator", true);
    const creators = profiles ?? [];
    if (creators.length === 0) return NextResponse.json({ activity: [] });

    const { data: memberRows } = await admin
      .from("customers")
      .select("id, email, shop_slug")
      .in("email", creators.map((c) => c.email));
    const customerToCreator: Record<string, { profile: any; shop_slug: string }> = {};
    for (const m of memberRows ?? []) {
      const profile = creators.find((c) => c.email === m.email);
      if (profile) customerToCreator[m.id] = { profile, shop_slug: m.shop_slug };
    }
    const customerIds = Object.keys(customerToCreator);
    if (customerIds.length === 0) return NextResponse.json({ activity: [] });

    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const { data: checkins } = await admin
      .from("checkins")
      .select("customer_id, shop_slug, created_at")
      .in("customer_id", customerIds)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(20);

    const slugs = [...new Set((checkins ?? []).map((c) => c.shop_slug))];
    const { data: settings } = slugs.length
      ? await admin
          .from("shop_settings")
          .select("shop_slug, shop_name")
          .in("shop_slug", slugs)
      : { data: [] };
    const nameMap: Record<string, string> = {};
    for (const s of settings ?? []) nameMap[s.shop_slug] = s.shop_name ?? s.shop_slug;

    const activity = (checkins ?? []).map((c) => {
      const who = customerToCreator[c.customer_id];
      return {
        profile_id: who?.profile.id ?? null,
        display_name: who?.profile.display_name ?? "Creator",
        avatar_url: who?.profile.avatar_url ?? null,
        shop_slug: c.shop_slug,
        shop_name: nameMap[c.shop_slug] ?? c.shop_slug,
        created_at: c.created_at,
      };
    });

    return NextResponse.json({ activity });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

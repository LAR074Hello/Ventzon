import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { buildTokenMap, pushOrEmail } from "@/lib/notify";
import { canNotify, claimNotification } from "@/lib/retention";
import { getOrCreateProfile, getBlockedSet } from "@/lib/social";

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
    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    const email = user?.email?.toLowerCase() ?? null;
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
    const blocked = await getBlockedSet(admin, email);
    if (blocked.has(target.email)) {
      return NextResponse.json({ error: "You can't follow this account" }, { status: 403 });
    }

    if (follow) {
      const { data: existing } = await admin
        .from("user_follows")
        .select("id")
        .eq("follower_email", email)
        .eq("followee_email", target.email)
        .maybeSingle();

      const { error } = await admin
        .from("user_follows")
        .upsert(
          { follower_email: email, followee_email: target.email },
          { onConflict: "follower_email,followee_email" }
        );
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // Brand-new follow → notify the followee (non-fatal). Respects the
      // notify_new_follower pref and frequency caps; the claim on
      // (followee, 'new_follower', follower-profile-id) means a
      // re-follow after an unfollow never re-notifies.
      if (!existing) {
        try {
          const followerProfile = await getOrCreateProfile(admin, email, {
            display_name: user?.user_metadata?.full_name ?? null,
            avatar_url: user?.user_metadata?.avatar_url ?? null,
          });
          const followerName = followerProfile.display_name ?? "Someone";
          if (await canNotify(admin, target.email, "new_follower")) {
            const claimed = await claimNotification(admin, {
              email: target.email,
              type: "new_follower",
              refId: followerProfile.id,
            });
            if (claimed) {
              const tokenMap = await buildTokenMap(admin, [target.email]);
              await pushOrEmail({
                email: target.email,
                tokens: tokenMap[target.email],
                title: `${followerName} started following you`,
                body: "See their profile on Ventzon",
                data: { type: "new_follower", profile_id: followerProfile.id },
                emailSubject: `${followerName} started following you on Ventzon`,
                emailText: `${followerName} is now following you on Ventzon.`,
              });
            }
          }
        } catch {}
      }
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

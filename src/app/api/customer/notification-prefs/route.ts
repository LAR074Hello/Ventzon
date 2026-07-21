import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const PREF_KEYS = [
  "notify_drops",
  "notify_reward_expiry",
  "notify_new_nearby",
  "notify_new_follower",
  "notify_post_engagement",
] as const;

async function getSessionEmail(): Promise<string | null> {
  const supabaseAuth = await createSupabaseServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  return user?.email?.toLowerCase() ?? null;
}

function adminClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/customer/notification-prefs → per-type toggles (default all on)
export async function GET() {
  try {
    const email = await getSessionEmail();
    if (!email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabase = adminClient();
    const { data, error } = await supabase
      .from("customer_notification_prefs")
      .select("notify_drops, notify_reward_expiry, notify_new_nearby, notify_new_follower, notify_post_engagement")
      .eq("email", email)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      prefs: {
        notify_drops: data?.notify_drops ?? true,
        notify_reward_expiry: data?.notify_reward_expiry ?? true,
        notify_new_nearby: data?.notify_new_nearby ?? true,
        notify_new_follower: data?.notify_new_follower ?? true,
        notify_post_engagement: data?.notify_post_engagement ?? true,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

// PUT /api/customer/notification-prefs { notify_drops?, notify_reward_expiry?, notify_new_nearby? }
export async function PUT(req: Request) {
  try {
    const email = await getSessionEmail();
    if (!email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const updates: Record<string, boolean> = {};
    for (const key of PREF_KEYS) {
      if (typeof body?.[key] === "boolean") updates[key] = body[key];
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid preference fields" }, { status: 400 });
    }

    const supabase = adminClient();
    const { error } = await supabase
      .from("customer_notification_prefs")
      .upsert(
        { email, ...updates, updated_at: new Date().toISOString() },
        { onConflict: "email" }
      );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

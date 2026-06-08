import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const ALL_GROUPS = ["veteran", "student", "senior", "first_responder", "care"] as const;
type GroupKey = (typeof ALL_GROUPS)[number];

const GROUP_LABELS: Record<GroupKey, string> = {
  veteran: "Veterans",
  student: "Students",
  senior: "Seniors (60+)",
  first_responder: "First Responders",
  care: "Care Community",
};

/* ─── GET ──────────────────────────────────────────────────── */
// Returns all 5 group rows for the merchant (with defaults if not yet set).

export async function GET(req: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey)
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const url = new URL(req.url);
    const shopSlug = String(url.searchParams.get("shop") ?? "").trim().toLowerCase();
    if (!shopSlug) return NextResponse.json({ error: "Missing shop" }, { status: 400 });

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify ownership
    const { data: shop } = await supabase
      .from("shops")
      .select("id")
      .eq("slug", shopSlug)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

    // Fetch existing settings rows
    const { data: rows, error } = await supabase
      .from("merchant_community_settings")
      .select("group_key, enabled, boost")
      .eq("merchant_id", shop.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Return all 5 groups, filling in defaults for any not yet in DB
    const indexed: Record<string, { enabled: boolean; boost: number }> = {};
    for (const r of rows ?? []) {
      indexed[r.group_key] = { enabled: r.enabled, boost: Number(r.boost) };
    }

    const settings = ALL_GROUPS.map((g) => ({
      group_key: g,
      label: GROUP_LABELS[g],
      enabled: indexed[g]?.enabled ?? false,
      boost: indexed[g]?.boost ?? 1.5,
    }));

    return NextResponse.json({ ok: true, merchant_id: shop.id, settings });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}

/* ─── PATCH ────────────────────────────────────────────────── */
// Body: { shop: string, updates: Array<{ group_key, enabled?, boost? }> }

export async function PATCH(req: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey)
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const shopSlug = String(body.shop ?? "").trim().toLowerCase();
    const updates: Array<{ group_key: string; enabled?: boolean; boost?: number }> =
      Array.isArray(body.updates) ? body.updates : [];

    if (!shopSlug) return NextResponse.json({ error: "Missing shop" }, { status: 400 });

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: shop } = await supabase
      .from("shops")
      .select("id")
      .eq("slug", shopSlug)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

    // Upsert each group update
    for (const u of updates) {
      if (!ALL_GROUPS.includes(u.group_key as GroupKey)) continue;

      const boost = u.boost !== undefined ? Math.min(5.0, Math.max(1.0, Number(u.boost))) : undefined;

      const row: Record<string, unknown> = {
        merchant_id: shop.id,
        group_key: u.group_key,
      };
      if (u.enabled !== undefined) row.enabled = Boolean(u.enabled);
      if (boost !== undefined) row.boost = boost;

      await supabase
        .from("merchant_community_settings")
        .upsert(row, { onConflict: "merchant_id,group_key" });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}

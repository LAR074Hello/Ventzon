import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const GRANTABLE_GROUPS = ["veteran", "student", "first_responder", "care"] as const;
type GrantableGroup = (typeof GRANTABLE_GROUPS)[number];

/* ─── POST — Create a merchant grant ───────────────────────── */
// Body: { shop, contact (phone or email), group_key, boost?, expires_months? }

export async function POST(req: Request) {
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
    const contact = String(body.contact ?? "").trim(); // phone or email
    const groupKey = String(body.group_key ?? "").trim() as GrantableGroup;
    const boostRaw = body.boost !== undefined ? Number(body.boost) : 1.5;
    const boost = Math.min(5.0, Math.max(1.0, boostRaw));
    const expiresMonths: number = Number(body.expires_months ?? 12);

    if (!shopSlug) return NextResponse.json({ error: "Missing shop" }, { status: 400 });
    if (!contact) return NextResponse.json({ error: "Missing contact (phone or email)" }, { status: 400 });
    if (!GRANTABLE_GROUPS.includes(groupKey))
      return NextResponse.json({ error: `group_key must be one of: ${GRANTABLE_GROUPS.join(", ")}` }, { status: 400 });

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify ownership
    const { data: shop } = await supabase
      .from("shops")
      .select("id, slug")
      .eq("slug", shopSlug)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

    // Find customer by phone or email at this shop
    const isEmail = contact.includes("@");
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("shop_slug", shopSlug)
      .eq(isEmail ? "email" : "phone", contact)
      .maybeSingle();

    if (!customer)
      return NextResponse.json({ error: "Customer not found. They must have checked in at least once." }, { status: 404 });

    // Upsert community_settings row for this group (ensure it exists with a boost)
    await supabase
      .from("merchant_community_settings")
      .upsert(
        { merchant_id: shop.id, group_key: groupKey, enabled: true, boost },
        { onConflict: "merchant_id,group_key", ignoreDuplicates: false }
      );

    // Revoke any existing active grant for this customer+merchant+group (clean slate)
    await supabase
      .from("community_eligibility")
      .update({ status: "revoked" })
      .eq("customer_id", customer.id)
      .eq("merchant_id", shop.id)
      .eq("group_key", groupKey)
      .eq("status", "active");

    // Compute expiry
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + expiresMonths);

    // Insert new grant
    const { data: grant, error: grantErr } = await supabase
      .from("community_eligibility")
      .insert({
        customer_id: customer.id,
        group_key: groupKey,
        scope: "merchant",
        merchant_id: shop.id,
        source: "merchant_grant",
        status: "active",
        granted_by_user_id: user.id,
        expires_at: expiresAt.toISOString(),
      })
      .select("id, group_key, expires_at")
      .single();

    if (grantErr) return NextResponse.json({ error: grantErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, grant });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}

/* ─── GET — List active grants for a shop ──────────────────── */
// Query: ?shop=slug&page=1

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
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const PAGE_SIZE = 50;

    if (!shopSlug) return NextResponse.json({ error: "Missing shop" }, { status: 400 });

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: shop } = await supabase
      .from("shops")
      .select("id")
      .eq("slug", shopSlug)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

    const { data: grants, error, count } = await supabase
      .from("community_eligibility")
      .select("id, customer_id, group_key, status, expires_at, created_at, customers(phone, email)", { count: "exact" })
      .eq("merchant_id", shop.id)
      .eq("scope", "merchant")
      .in("status", ["active", "expired"])
      .order("created_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, grants: grants ?? [], total: count ?? 0, page });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}

/* ─── DELETE — Revoke a grant ──────────────────────────────── */
// Body: { shop, grant_id }

export async function DELETE(req: Request) {
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
    const grantId = String(body.grant_id ?? "").trim();

    if (!shopSlug || !grantId)
      return NextResponse.json({ error: "Missing shop or grant_id" }, { status: 400 });

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: shop } = await supabase
      .from("shops")
      .select("id")
      .eq("slug", shopSlug)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

    // Revoke silently — no reason field, no customer notification
    const { error } = await supabase
      .from("community_eligibility")
      .update({ status: "revoked" })
      .eq("id", grantId)
      .eq("merchant_id", shop.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}

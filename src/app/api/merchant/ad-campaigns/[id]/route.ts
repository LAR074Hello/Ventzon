import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

async function verifyOwnership(
  supabase: any,
  campaignId: string,
  userId: string
) {
  const { data: campaign } = await supabase
    .from("ad_campaigns")
    .select("id, shop_slug")
    .eq("id", campaignId)
    .maybeSingle();
  if (!campaign) return null;

  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("slug", (campaign as any).shop_slug)
    .eq("user_id", userId)
    .maybeSingle();
  if (!shop) return null;

  return campaign;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const campaign = await verifyOwnership(supabase, id, user.id);
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

    const body = await req.json().catch(() => ({} as any));
    const status = body?.status === "paused" ? "paused" : body?.status === "active" ? "active" : undefined;
    if (!status) return NextResponse.json({ error: "status must be 'active' or 'paused'" }, { status: 400 });

    const { data, error } = await supabase
      .from("ad_campaigns")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, status")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, campaign: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const campaign = await verifyOwnership(supabase, id, user.id);
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

    const { error } = await supabase.from("ad_campaigns").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

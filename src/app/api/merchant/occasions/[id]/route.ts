import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

async function verifyOwnership(supabase: any, occasionId: string, userId: string) {
  const { data: occ } = await supabase
    .from("shop_occasions")
    .select("id, shop_slug")
    .eq("id", occasionId)
    .maybeSingle();
  if (!occ) return null;
  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("slug", (occ as any).shop_slug)
    .eq("user_id", userId)
    .maybeSingle();
  return shop ? occ : null;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const occ = await verifyOwnership(supabase, id, user.id);
    if (!occ) return NextResponse.json({ error: "Occasion not found" }, { status: 404 });

    const body = await req.json().catch(() => ({} as any));
    if (typeof body?.enabled !== "boolean") {
      return NextResponse.json({ error: "enabled (boolean) is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("shop_occasions")
      .update({ enabled: body.enabled })
      .eq("id", id)
      .select("id, enabled")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, occasion: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const occ = await verifyOwnership(supabase, id, user.id);
    if (!occ) return NextResponse.json({ error: "Occasion not found" }, { status: 404 });

    const { error } = await supabase.from("shop_occasions").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

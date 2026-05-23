import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

async function getRepId(userEmail: string): Promise<string | null> {
  const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data } = await admin
    .from("rep_profiles")
    .select("id")
    .eq("email", userEmail)
    .maybeSingle();
  return data?.id ?? null;
}

// GET — last 20 logs + month total
export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const repId = await getRepId(user.email!);
    if (!repId) return NextResponse.json({ error: "Rep not found" }, { status: 403 });

    const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

    const [{ data: logs }, { data: monthLogs }] = await Promise.all([
      admin
        .from("rep_commission_logs")
        .select("id, amount, description, logged_at, created_at")
        .eq("rep_id", repId)
        .order("logged_at", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(20),
      admin
        .from("rep_commission_logs")
        .select("amount")
        .eq("rep_id", repId)
        .gte("logged_at", monthStart),
    ]);

    const monthTotal = (monthLogs ?? []).reduce((s, r) => s + Number(r.amount), 0);

    return NextResponse.json({ logs: logs ?? [], monthTotal });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST — add a log entry
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const repId = await getRepId(user.email!);
    if (!repId) return NextResponse.json({ error: "Rep not found" }, { status: 403 });

    const body = await req.json();
    const amount = Number(body.amount);
    const description = String(body.description ?? "").trim();
    const logged_at = String(body.logged_at ?? new Date().toISOString().slice(0, 10));

    if (!amount || amount <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    if (!description) return NextResponse.json({ error: "Description required" }, { status: 400 });

    const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data, error } = await admin
      .from("rep_commission_logs")
      .insert({ rep_id: repId, amount, description, logged_at })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ log: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE — remove a log entry
export async function DELETE(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const repId = await getRepId(user.email!);
    if (!repId) return NextResponse.json({ error: "Rep not found" }, { status: 403 });

    const { id } = await req.json();
    const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    await admin.from("rep_commission_logs").delete().eq("id", id).eq("rep_id", repId);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

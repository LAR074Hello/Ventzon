import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const url = new URL(req.url);
    const shopSlug = url.searchParams.get("shop_slug")?.trim().toLowerCase() ?? "";
    if (!shopSlug) return NextResponse.json({ error: "Missing shop_slug" }, { status: 400 });

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // Verify ownership
    const { data: shop } = await supabase.from("shops").select("slug").eq("slug", shopSlug).eq("user_id", user.id).maybeSingle();
    if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

    const format = url.searchParams.get("format"); // "csv" for export

    const { data: customers, error } = await supabase
      .from("customers")
      .select("id, phone, email, visits, last_checkin_date, opted_out, created_at")
      .eq("shop_slug", shopSlug)
      .order("visits", { ascending: false });

    if (error) throw error;

    if (format === "csv") {
      const rows = [
        ["Contact", "Visits", "Last Check-in", "Joined", "Opted Out"],
        ...(customers ?? []).map((c) => [
          c.phone || c.email || "",
          String(c.visits ?? 0),
          c.last_checkin_date ?? "",
          c.created_at ? new Date(c.created_at).toISOString().slice(0, 10) : "",
          c.opted_out ? "Yes" : "No",
        ]),
      ];
      const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="customers-${shopSlug}.csv"`,
        },
      });
    }

    return NextResponse.json({ customers: customers ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

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

// GET /api/customer/follows → the shops this customer follows
export async function GET() {
  try {
    const email = await getSessionEmail();
    if (!email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabase = adminClient();
    const { data, error } = await supabase
      .from("customer_follows")
      .select("shop_slug, created_at")
      .eq("email", email);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      follows: (data ?? []).map((f) => ({
        shop_slug: f.shop_slug,
        created_at: f.created_at,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

// POST /api/customer/follows { shop_slug, follow: boolean }
export async function POST(req: Request) {
  try {
    const email = await getSessionEmail();
    if (!email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const shopSlug = String(body?.shop_slug ?? "").toLowerCase().trim();
    const follow = Boolean(body?.follow);
    if (!shopSlug) {
      return NextResponse.json({ error: "Missing shop_slug" }, { status: 400 });
    }

    const supabase = adminClient();

    if (follow) {
      const { data: shop } = await supabase
        .from("shops")
        .select("slug")
        .eq("slug", shopSlug)
        .maybeSingle();
      if (!shop) {
        return NextResponse.json({ error: "Shop not found" }, { status: 404 });
      }
      const { error } = await supabase
        .from("customer_follows")
        .upsert({ email, shop_slug: shopSlug }, { onConflict: "email,shop_slug" });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      const { error } = await supabase
        .from("customer_follows")
        .delete()
        .eq("email", email)
        .eq("shop_slug", shopSlug);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, following: follow });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

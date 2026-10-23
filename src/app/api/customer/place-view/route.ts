import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const SOURCES = new Set(["feed", "map", "search", "share", "other"]);

// POST /api/customer/place-view { slug, source }
// Records that a signed-in user opened a place page. One row per viewer per
// place per day (a unique index drops repeats). Fire-and-forget: always 200.
// PRE-LAUNCH: delete raw place_views rows older than 13 months (monthly
// totals only), per the approved analytics plan.
export async function POST(req: Request) {
  try {
    const rl = await rateLimit(`pview:${getClientIp(req)}`, 60, 60_000);
    if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    const email = user?.email?.toLowerCase();
    if (!email) return NextResponse.json({ ok: true });

    const body = await req.json().catch(() => ({}));
    const slug = String(body?.slug ?? "").trim().toLowerCase();
    const source = SOURCES.has(String(body?.source)) ? String(body.source) : "other";
    if (!/^[a-z0-9-]{1,100}$/.test(slug)) return NextResponse.json({ ok: true });

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const [{ data: prof }, { data: place }, { data: shop }] = await Promise.all([
      supabase.from("customer_profiles").select("id").eq("email", email).maybeSingle(),
      supabase.from("places").select("id").eq("slug", slug).maybeSingle(),
      supabase.from("shops").select("slug").eq("slug", slug).maybeSingle(),
    ]);
    if (!prof?.id || (!place?.id && !shop?.slug)) return NextResponse.json({ ok: true });

    await supabase.from("place_views").upsert(
      {
        place_id: place?.id ?? null,
        shop_slug: shop?.slug ?? null,
        viewer_id: prof.id,
        source,
      },
      { onConflict: "place_id,viewer_id,view_date", ignoreDuplicates: true }
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}

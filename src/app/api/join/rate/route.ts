import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { canRate, verifyRatingToken } from "@/lib/visit-rating";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/join/rate { shop_slug, customer_id, token, rating: 1|-1, note? }
export async function POST(req: Request) {
  try {
    const rl = await rateLimit(`rate:${getClientIp(req)}`, 10, 60_000);
    if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

    const body = await req.json().catch(() => ({}));
    const shopSlug = String(body?.shop_slug ?? "").trim().toLowerCase();
    const customerId = String(body?.customer_id ?? "").trim();
    const token = String(body?.token ?? "");
    const rating = Number(body?.rating);
    const note = String(body?.note ?? "").trim().slice(0, 280) || null;

    if (!shopSlug || !customerId || !token || (rating !== 1 && rating !== -1)) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
    }
    if (!verifyRatingToken(token, customerId, shopSlug)) {
      return NextResponse.json({ error: "This rating link has expired" }, { status: 403 });
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    if (!(await canRate(supabase, customerId, shopSlug))) {
      // Already rated this week: treat as success, nothing to do.
      return NextResponse.json({ ok: true });
    }
    const { error } = await supabase.from("visit_ratings").insert({
      shop_slug: shopSlug,
      customer_id: customerId,
      rating,
      note: rating === -1 ? note : null,
    });
    if (error) return NextResponse.json({ error: "Couldn't save your rating" }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Couldn't save your rating" }, { status: 500 });
  }
}

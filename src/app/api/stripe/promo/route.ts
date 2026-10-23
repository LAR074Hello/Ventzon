import Stripe from "stripe";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { findActivePromotionCode, describePromotion } from "@/lib/promo";

export const runtime = "nodejs";

// POST /api/stripe/promo  { code } → { valid, description? }
// Lets the pricing page confirm a code before checkout. Rate limited so it
// can't be used to guess codes.
export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`promo:${ip}`, 10, 60_000);
  if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

  try {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return Response.json({ valid: false }, { status: 500 });
    const body = await req.json().catch(() => ({}));
    const promo = await findActivePromotionCode(new Stripe(key), String(body?.code ?? ""));
    if (!promo) return Response.json({ valid: false });
    return Response.json({ valid: true, description: describePromotion(promo) });
  } catch {
    return Response.json({ valid: false }, { status: 500 });
  }
}

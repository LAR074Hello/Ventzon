import Stripe from "stripe";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY env var");
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

export async function POST(req: Request) {
  // Rate limit: 5 checkout sessions per IP per minute
  const ip = getClientIp(req);
  const rl = await rateLimit(`checkout:${ip}`, 5, 60_000);
  if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

  try {
    const body = await req.json();
    const shop_slug = String(body.shop_slug ?? body.shop ?? "").trim();
    const planRaw = String(body.plan ?? "monthly").trim().toLowerCase();

    if (!shop_slug) {
      return Response.json({ error: "Missing shop_slug" }, { status: 400 });
    }

    const origin =
      req.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://www.ventzon.com";

    // POST-BETA: the $0.85/redemption metered fee is removed. Pro is flat
    // ($25/mo or $240/yr); free shops have no Stripe subscription at all.
    // That also means the ad-campaigns metered item (attached to a shop's
    // subscription) isn't available to free shops — ads are Pro-only until a
    // free-shop path exists. TODO(beta): decide how free shops get ads.
    if (planRaw === "free") {
      // No checkout needed — free is "no subscription". Guard so a stray
      // plan=free request can't silently create a Pro session.
      return Response.json(
        { error: "Free shops don't need a subscription." },
        { status: 400 }
      );
    }

    // ── Pro plan: flat only ──
    const plan = planRaw === "yearly" ? "yearly" : "monthly";
    const flatPriceId =
      plan === "yearly"
        ? (process.env.PRICE_YEARLY || process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY)
        : (process.env.PRICE_MONTHLY || process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY);

    if (!flatPriceId) {
      return Response.json(
        { error: "Missing PRICE env var for selected plan" },
        { status: 500 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        { price: flatPriceId, quantity: 1 },   // $25/month flat — no metered usage
      ],
      success_url: `${origin}/merchant/${encodeURIComponent(shop_slug)}?checkout=success`,
      cancel_url: `${origin}/merchant/subscribe?shop=${encodeURIComponent(
        shop_slug
      )}&canceled=1`,
      metadata: { shop_slug, plan_type: "pro" },
      subscription_data: {
        metadata: { shop_slug, plan_type: "pro" },
      },
    });

    return Response.json({ url: session.url });
  } catch (e: any) {
    return Response.json(
      { error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}

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
  const rl = rateLimit(`checkout:${ip}`, 5, 60_000);
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
      "https://ventzon.vercel.app";

    // ── Free plan: metered billing subscription ($1.25/reward, billed monthly) ──
    if (planRaw === "free") {
      const meteredPriceId = process.env.STRIPE_PRICE_FREE_METERED;
      if (!meteredPriceId) {
        return Response.json(
          { error: "Missing STRIPE_PRICE_FREE_METERED env var" },
          { status: 500 }
        );
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: meteredPriceId,
            // No quantity for metered — usage is reported via API
          },
        ],
        success_url: `${origin}/merchant/${encodeURIComponent(shop_slug)}?checkout=success`,
        cancel_url: `${origin}/merchant/subscribe?shop=${encodeURIComponent(shop_slug)}&canceled=1`,
        metadata: { shop_slug, plan_type: "free" },
        subscription_data: {
          metadata: { shop_slug, plan_type: "free" },
        },
      });

      return Response.json({ url: session.url });
    }

    // ── Pro plan: fixed monthly/yearly subscription ──
    const plan = planRaw === "yearly" ? "yearly" : "monthly";
    const priceId =
      plan === "yearly"
        ? (process.env.PRICE_YEARLY || process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY)
        : (process.env.PRICE_MONTHLY || process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY);

    if (!priceId) {
      return Response.json(
        { error: "Missing PRICE env var for selected plan" },
        { status: 500 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
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

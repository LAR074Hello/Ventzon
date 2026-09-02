import Stripe from "stripe";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";

let stripeClient: Stripe | null = null;

// Lazy, memoized Stripe client. Never constructed at module scope: a missing
// STRIPE_SECRET_KEY must surface as a JSON 500 from the handler, not as a
// framework HTML error page from a module-level throw.
function getStripe(): Stripe | null {
  if (stripeClient) return stripeClient;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  stripeClient = new Stripe(key);
  return stripeClient;
}

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

    // POST-BETA: the per-redemption metered fee is removed. Pro is flat
    // ($30/mo or $300/yr); free shops have no Stripe subscription at all.
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
    const monthlyPriceId =
      process.env.PRICE_MONTHLY || process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY;
    const yearlyPriceId =
      process.env.PRICE_YEARLY || process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY;

    const flatPriceId = plan === "yearly" ? yearlyPriceId : monthlyPriceId;

    if (!flatPriceId) {
      const missingVar =
        plan === "yearly"
          ? "PRICE_YEARLY or NEXT_PUBLIC_STRIPE_PRICE_YEARLY"
          : "PRICE_MONTHLY or NEXT_PUBLIC_STRIPE_PRICE_MONTHLY";
      return Response.json(
        {
          error: `Checkout isn't configured — missing Stripe price ID for the ${plan} plan (expected ${missingVar}).`,
        },
        { status: 500 }
      );
    }

    const stripe = getStripe();
    if (!stripe) {
      return Response.json(
        {
          error: "Checkout isn't configured — the server is missing STRIPE_SECRET_KEY.",
        },
        { status: 500 }
      );
    }

    // plan_interval is persisted on the shop when the subscription is created
    // (the webhook reads it from session/subscription metadata). Derive it from
    // the price ID actually charged so billing and rep-commission display can't
    // drift. Safe default is monthly — never over-credit a rep with the $150
    // annual signup commission.
    let planInterval: "monthly" | "annual" = "monthly";
    if (flatPriceId === yearlyPriceId) {
      planInterval = "annual";
    } else if (flatPriceId === monthlyPriceId) {
      planInterval = "monthly";
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        { price: flatPriceId, quantity: 1 },   // $30/month flat — no metered usage
      ],
      success_url: `${origin}/merchant/${encodeURIComponent(shop_slug)}?checkout=success`,
      cancel_url: `${origin}/merchant/subscribe?shop=${encodeURIComponent(
        shop_slug
      )}&canceled=1`,
      metadata: { shop_slug, plan_type: "pro", plan_interval: planInterval },
      subscription_data: {
        metadata: { shop_slug, plan_type: "pro", plan_interval: planInterval },
      },
    });

    return Response.json({ url: session.url });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}

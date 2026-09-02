import Stripe from "stripe";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { slugify } from "@/lib/merchant-shop";

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
    // ── Authenticated only ──
    // Checkout creates shops after payment, so the shop must always be owned
    // by the authenticated merchant. user_id is stamped server-side (never
    // trusted from the client body).
    const supabaseAuth = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const shopName = String(body.shop_name ?? "").trim();
    const shopSlugInput = String(body.shop_slug ?? body.shop ?? "").trim();
    const planRaw = String(body.plan ?? "monthly").trim().toLowerCase();

    const origin =
      req.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://www.ventzon.com";

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

    let planInterval: "monthly" | "annual" = "monthly";
    if (flatPriceId === yearlyPriceId) {
      planInterval = "annual";
    } else if (flatPriceId === monthlyPriceId) {
      planInterval = "monthly";
    }

    const isOnboarding = shopName.length > 0;
    if (isOnboarding) {
      // ── New onboarding: NO shop row exists yet ──
      // The name (and its base slug) travel through Stripe metadata only; the
      // shop is created by the webhook once payment is confirmed. Slug
      // uniqueness is resolved at creation time there.
      if (shopName.length > 60) {
        return Response.json(
          { error: "Shop name must be 60 characters or fewer." },
          { status: 400 }
        );
      }
      const baseSlug = slugify(shopName);
      const metadata = {
        user_id: user.id, // server-stamped owner — never client-supplied
        shop_name: shopName,
        shop_slug: baseSlug,
        plan_type: "pro",
        plan_interval: planInterval,
      };

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: flatPriceId, quantity: 1 }],
        success_url: `${origin}/merchant/dashboard?checkout=success`,
        cancel_url: `${origin}/pricing?shop_name=${encodeURIComponent(
          shopName
        )}&canceled=1`,
        metadata,
        subscription_data: { metadata },
      });

      return Response.json({ url: session.url });
    }

    // ── Legacy activation: an existing (usually unpaid) shop row ──
    const shopSlug = shopSlugInput.toLowerCase();
    if (!shopSlug) {
      return Response.json({ error: "Missing shop_slug" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: flatPriceId, quantity: 1 }],
      success_url: `${origin}/merchant/${encodeURIComponent(shopSlug)}?checkout=success`,
      cancel_url: `${origin}/merchant/subscribe?shop=${encodeURIComponent(
        shopSlug
      )}&canceled=1`,
      metadata: { shop_slug: shopSlug, plan_type: "pro", plan_interval: planInterval },
      subscription_data: {
        metadata: { shop_slug: shopSlug, plan_type: "pro", plan_interval: planInterval },
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

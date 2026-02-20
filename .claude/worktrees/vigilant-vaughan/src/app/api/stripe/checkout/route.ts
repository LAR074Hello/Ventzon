import Stripe from "stripe";

export const runtime = "nodejs";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY env var");
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const shop_slug = String(body.shop_slug ?? body.shop ?? "").trim();
    const planRaw = String(body.plan ?? "monthly").trim().toLowerCase();
    const plan = planRaw === "yearly" ? "yearly" : "monthly";

    if (!shop_slug) {
      return Response.json({ error: "Missing shop_slug" }, { status: 400 });
    }

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

    const origin =
      req.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://ventzon.vercel.app";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/merchant/${encodeURIComponent(
        shop_slug
      )}?paid=1`,
      cancel_url: `${origin}/merchant/subscribe?shop=${encodeURIComponent(
        shop_slug
      )}&canceled=1`,
      metadata: { shop_slug, plan },
    });

    return Response.json({ url: session.url });
  } catch (e: any) {
    return Response.json(
      { error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
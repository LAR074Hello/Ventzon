import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const MIN_BID_CENTS = 5; // $0.05
const MAX_BID_CENTS = 5000; // $50.00
const MIN_RADIUS = 1;
const MAX_RADIUS = 50;

async function getOwnedShop(supabase: any, shopSlug: string, userId: string) {
  const { data } = await supabase
    .from("shops")
    .select("id, slug, is_paid, latitude, longitude, stripe_customer_id, stripe_subscription_id, ad_subscription_item_id")
    .eq("slug", shopSlug)
    .eq("user_id", userId)
    .maybeSingle();
  return data as any;
}

export async function GET(req: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const url = new URL(req.url);
    const shopSlug = String(url.searchParams.get("shop_slug") ?? "").trim().toLowerCase();
    if (!shopSlug) return NextResponse.json({ error: "Missing shop_slug" }, { status: 400 });

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const shop = await getOwnedShop(supabase, shopSlug, user.id);
    if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

    const { data: campaigns, error } = await supabase
      .from("ad_campaigns")
      .select("id, headline, body, bid_cents, radius_miles, status, created_at")
      .eq("shop_slug", shopSlug)
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Send counts + spend per campaign (last 30 days)
    const campaignIds = (campaigns ?? []).map((c: any) => c.id);
    const statsById: Record<string, { sends: number; spend_cents: number }> = {};
    if (campaignIds.length > 0) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data: sends } = await supabase
        .from("ad_sends")
        .select("campaign_id, bid_cents")
        .in("campaign_id", campaignIds)
        .gte("send_date", thirtyDaysAgo.toISOString().slice(0, 10));
      for (const row of sends ?? []) {
        const cid = (row as any).campaign_id as string;
        if (!statsById[cid]) statsById[cid] = { sends: 0, spend_cents: 0 };
        statsById[cid].sends += 1;
        statsById[cid].spend_cents += Number((row as any).bid_cents ?? 0);
      }
    }

    return NextResponse.json({
      ok: true,
      has_location: shop.latitude != null && shop.longitude != null,
      campaigns: (campaigns ?? []).map((c: any) => ({
        ...c,
        sends_30d: statsById[c.id]?.sends ?? 0,
        spend_cents_30d: statsById[c.id]?.spend_cents ?? 0,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json().catch(() => ({} as any));
    const shopSlug = String(body?.shop_slug ?? "").trim().toLowerCase();
    const headline = String(body?.headline ?? "").trim();
    const adBody = String(body?.body ?? "").trim();
    const bidDollars = Number(body?.bid_dollars);
    const radiusMiles = Number(body?.radius_miles ?? 5);

    if (!shopSlug) return NextResponse.json({ error: "Missing shop_slug" }, { status: 400 });
    if (!headline || headline.length > 80) {
      return NextResponse.json({ error: "Headline is required (max 80 characters)" }, { status: 400 });
    }
    if (!adBody || adBody.length > 200) {
      return NextResponse.json({ error: "Body is required (max 200 characters)" }, { status: 400 });
    }

    const bidCents = Math.round(bidDollars * 100);
    if (!Number.isFinite(bidCents) || bidCents < MIN_BID_CENTS || bidCents > MAX_BID_CENTS) {
      return NextResponse.json(
        { error: `Bid must be between $${(MIN_BID_CENTS / 100).toFixed(2)} and $${(MAX_BID_CENTS / 100).toFixed(2)}` },
        { status: 400 }
      );
    }
    if (!Number.isFinite(radiusMiles) || radiusMiles < MIN_RADIUS || radiusMiles > MAX_RADIUS) {
      return NextResponse.json(
        { error: `Radius must be between ${MIN_RADIUS} and ${MAX_RADIUS} miles` },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const shop = await getOwnedShop(supabase, shopSlug, user.id);
    if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    if (!shop.is_paid) {
      return NextResponse.json({ error: "Advertising is a paid feature" }, { status: 403 });
    }
    if (shop.latitude == null || shop.longitude == null) {
      return NextResponse.json(
        { error: "Set your store address in Settings before creating an ad — targeting is based on your location." },
        { status: 400 }
      );
    }

    // Attach the ad metered subscription item on first campaign only.
    if (!shop.ad_subscription_item_id && shop.stripe_subscription_id) {
      const adPriceId = process.env.STRIPE_PRICE_AD_METERED;
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (adPriceId && stripeKey) {
        try {
          const stripe = new Stripe(stripeKey);
          const item = await stripe.subscriptionItems.create({
            subscription: shop.stripe_subscription_id,
            price: adPriceId,
          });
          await supabase.from("shops").update({ ad_subscription_item_id: item.id }).eq("id", shop.id);
        } catch (stripeErr: any) {
          return NextResponse.json(
            { error: `Could not set up ad billing: ${stripeErr?.message ?? "Stripe error"}` },
            { status: 500 }
          );
        }
      }
    }

    const { data: campaign, error } = await supabase
      .from("ad_campaigns")
      .insert({
        shop_slug: shopSlug,
        headline,
        body: adBody,
        bid_cents: bidCents,
        radius_miles: radiusMiles,
        status: "active",
      })
      .select("id, headline, body, bid_cents, radius_miles, status, created_at")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, campaign });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

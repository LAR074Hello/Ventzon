import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { haversineMiles } from "@/lib/geo";
import { sendPushToDeviceTokens } from "@/lib/push";

export const dynamic = "force-dynamic";

// GET /api/cron/send-ads
// Called once daily by Vercel Cron. Runs the merchant ad auction:
// for every customer reachable by push, finds active campaigns from
// shops they don't already belong to but frequent shops near, ranks
// by bid, and sends the top 6 per customer. Each send is billed via
// Stripe metered usage at the campaign's bid amount.

const DAILY_CAP = 6;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const today = new Date().toISOString().slice(0, 10);

  try {
    // 1. Active campaigns, joined with their advertiser shop's paid
    //    status, location, and Stripe customer id.
    const { data: campaigns } = await supabase
      .from("ad_campaigns")
      .select("id, shop_slug, headline, body, bid_cents, radius_miles")
      .eq("status", "active");

    if (!campaigns?.length) {
      return NextResponse.json({ ok: true, sends: 0, note: "No active campaigns" });
    }

    const advertiserSlugs = [...new Set(campaigns.map((c: any) => c.shop_slug))];
    const { data: advertiserShops } = await supabase
      .from("shops")
      .select("slug, is_paid, latitude, longitude, stripe_customer_id")
      .in("slug", advertiserSlugs);

    const shopBySlug: Record<string, any> = {};
    for (const s of advertiserShops ?? []) shopBySlug[(s as any).slug] = s;

    const eligibleCampaigns = campaigns.filter((c: any) => {
      const s = shopBySlug[c.shop_slug];
      return s && s.is_paid && s.latitude != null && s.longitude != null && s.stripe_customer_id;
    });

    if (!eligibleCampaigns.length) {
      return NextResponse.json({ ok: true, sends: 0, note: "No billable campaigns with valid shop location" });
    }

    // 2. All customer rows with an email, joined against their shop's
    //    location, plus a global opted-out set and a per-shop
    //    existing-customer set (for the acquisition-only rule).
    const { data: customerRows } = await supabase
      .from("customers")
      .select("email, shop_slug, opted_out")
      .not("email", "is", null);

    const allShopSlugs = [...new Set((customerRows ?? []).map((c: any) => c.shop_slug))];
    const { data: allShops } = await supabase
      .from("shops")
      .select("slug, latitude, longitude")
      .in("slug", allShopSlugs.length ? allShopSlugs : ["__none__"]);
    const shopLocBySlug: Record<string, { lat: number; lon: number }> = {};
    for (const s of allShops ?? []) {
      if ((s as any).latitude != null && (s as any).longitude != null) {
        shopLocBySlug[(s as any).slug] = { lat: (s as any).latitude, lon: (s as any).longitude };
      }
    }

    const optedOutEmails = new Set<string>();
    const existingCustomersByShop: Record<string, Set<string>> = {};
    // email -> set of shop slugs they've visited (with a known location)
    const visitedShopsByEmail: Record<string, Set<string>> = {};

    for (const row of customerRows ?? []) {
      const email = String((row as any).email ?? "").toLowerCase().trim();
      if (!email) continue;
      const shopSlug = (row as any).shop_slug as string;

      if ((row as any).opted_out) optedOutEmails.add(email);

      if (!existingCustomersByShop[shopSlug]) existingCustomersByShop[shopSlug] = new Set();
      existingCustomersByShop[shopSlug].add(email);

      if (shopLocBySlug[shopSlug]) {
        if (!visitedShopsByEmail[email]) visitedShopsByEmail[email] = new Set();
        visitedShopsByEmail[email].add(shopSlug);
      }
    }

    // 3. Build eligibility: email -> [{campaign_id, bid_cents, headline, body, shop_slug}]
    const eligibilityByEmail: Record<string, Array<{ id: string; bid_cents: number; headline: string; body: string; shop_slug: string }>> = {};

    for (const email of Object.keys(visitedShopsByEmail)) {
      if (optedOutEmails.has(email)) continue;
      const visited = visitedShopsByEmail[email];

      for (const campaign of eligibleCampaigns) {
        const advertiser = shopBySlug[campaign.shop_slug];
        // Acquisition-only: skip if already a customer of the advertiser.
        if (existingCustomersByShop[campaign.shop_slug]?.has(email)) continue;

        let withinRadius = false;
        for (const visitedSlug of visited) {
          const loc = shopLocBySlug[visitedSlug];
          if (!loc) continue;
          const dist = haversineMiles(loc.lat, loc.lon, advertiser.latitude, advertiser.longitude);
          if (dist <= campaign.radius_miles) {
            withinRadius = true;
            break;
          }
        }
        if (!withinRadius) continue;

        if (!eligibilityByEmail[email]) eligibilityByEmail[email] = [];
        eligibilityByEmail[email].push({
          id: campaign.id,
          bid_cents: campaign.bid_cents,
          headline: campaign.headline,
          body: campaign.body,
          shop_slug: campaign.shop_slug,
        });
      }
    }

    const candidateEmails = Object.keys(eligibilityByEmail);
    if (!candidateEmails.length) {
      return NextResponse.json({ ok: true, sends: 0, note: "No eligible customers" });
    }

    // 4. Already-sent-today counts (defensive against re-runs).
    const { data: sentToday } = await supabase
      .from("ad_sends")
      .select("campaign_id, customer_email")
      .eq("send_date", today)
      .in("customer_email", candidateEmails);

    const sentTodayByEmail: Record<string, Set<string>> = {};
    for (const row of sentToday ?? []) {
      const email = (row as any).customer_email as string;
      if (!sentTodayByEmail[email]) sentTodayByEmail[email] = new Set();
      sentTodayByEmail[email].add((row as any).campaign_id);
    }

    // 5. Build email -> device tokens map (only for candidate emails).
    const emailToUid: Record<string, string> = {};
    let page = 1;
    while (true) {
      const { data: authPage } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
      if (!authPage?.users?.length) break;
      for (const u of authPage.users) {
        if (u.email) emailToUid[u.email.toLowerCase()] = u.id;
      }
      if (authPage.users.length < 1000) break;
      page++;
    }

    const candidateUids = candidateEmails.map((e) => emailToUid[e]).filter(Boolean);
    const uidToEmail: Record<string, string> = {};
    for (const e of candidateEmails) if (emailToUid[e]) uidToEmail[emailToUid[e]] = e;

    const emailToTokens: Record<string, string[]> = {};
    if (candidateUids.length) {
      const { data: tokenRows } = await supabase
        .from("device_tokens")
        .select("user_id, token")
        .in("user_id", candidateUids);
      for (const row of tokenRows ?? []) {
        const email = uidToEmail[(row as any).user_id];
        if (!email) continue;
        if (!emailToTokens[email]) emailToTokens[email] = [];
        emailToTokens[email].push((row as any).token);
      }
    }

    // 6. For each reachable customer, pick the top-bidding campaigns
    //    up to the remaining daily cap, send, record, and bill.
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const stripe = stripeKey ? new Stripe(stripeKey) : null;
    let totalSends = 0;

    for (const email of candidateEmails) {
      const tokens = emailToTokens[email];
      if (!tokens?.length) continue;

      const alreadySent = sentTodayByEmail[email]?.size ?? 0;
      const remaining = DAILY_CAP - alreadySent;
      if (remaining <= 0) continue;

      const unsent = eligibilityByEmail[email].filter(
        (c) => !sentTodayByEmail[email]?.has(c.id)
      );
      const winners = unsent.sort((a, b) => b.bid_cents - a.bid_cents).slice(0, remaining);

      for (const winner of winners) {
        try {
          await sendPushToDeviceTokens(tokens, winner.headline, winner.body, {
            type: "ad",
            shop_slug: winner.shop_slug,
            campaign_id: winner.id,
          });
        } catch {
          continue; // don't bill or record a send that failed to deliver
        }

        const { error: insertErr } = await supabase.from("ad_sends").insert({
          campaign_id: winner.id,
          customer_email: email,
          send_date: today,
          bid_cents: winner.bid_cents,
        });
        if (insertErr) continue; // duplicate (already sent) — skip billing

        totalSends++;

        if (stripe) {
          const advertiserCustomerId = shopBySlug[winner.shop_slug]?.stripe_customer_id;
          if (advertiserCustomerId) {
            try {
              await stripe.billing.meterEvents.create({
                event_name: "ad_notification_sent",
                payload: {
                  stripe_customer_id: advertiserCustomerId,
                  value: String(winner.bid_cents),
                },
              });
            } catch {
              // non-fatal — usage reporting failure shouldn't block delivery
            }
          }
        }
      }
    }

    return NextResponse.json({
      ok: true,
      candidates: candidateEmails.length,
      sends: totalSends,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

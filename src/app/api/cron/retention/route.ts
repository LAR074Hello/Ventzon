import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildTokenMap, pushOrEmail } from "@/lib/notify";
import { canNotify, claimNotification } from "@/lib/retention";
import { haversineMiles } from "@/lib/geo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/cron/retention
// Runs daily. Sends only the two time-based value notifications:
//
//  1. reward_expiry — a customer's unlocked reward is inside its final
//     3 days (shops with reward_expires_days set). Framed as "your
//     reward is waiting, valid through <date>" — usefulness, not loss.
//  2. new_nearby — a shop joined Ventzon in the last 7 days within
//     10 miles of a shop the customer already visits.
//
// Both respect per-type prefs and frequency caps (src/lib/retention.ts)
// and are idempotent via the claim on (email, type, ref_id). Push-first
// with email fallback, same as birthdays/occasions.

const EXPIRY_WINDOW_DAYS = 3;
const NEARBY_RADIUS_MILES = 10;
const NEW_SHOP_WINDOW_DAYS = 7;
const MAX_SENDS_PER_RUN = 200;

const DAY_MS = 24 * 60 * 60 * 1000;

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

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

  let expirySent = 0;
  let nearbySent = 0;
  let budget = MAX_SENDS_PER_RUN;

  try {
    // ── 1. Rewards nearing expiry ────────────────────────────────
    const { data: expiringSettings } = await supabase
      .from("shop_settings")
      .select("shop_slug, shop_name, deal_title, reward_expires_days")
      .not("reward_expires_days", "is", null)
      .gt("reward_expires_days", 0);

    const expiryShops = expiringSettings ?? [];
    if (expiryShops.length > 0) {
      const settingsMap: Record<string, (typeof expiryShops)[number]> = {};
      for (const s of expiryShops) settingsMap[s.shop_slug] = s;

      const { data: unlocked } = await supabase
        .from("customers")
        .select("id, shop_slug, email, reward_unlocked_at")
        .in("shop_slug", expiryShops.map((s) => s.shop_slug))
        .eq("reward_unlocked", true)
        .eq("opted_out", false)
        .not("email", "is", null)
        .not("reward_unlocked_at", "is", null);

      const candidates = (unlocked ?? []).filter((c) => {
        const setting = settingsMap[c.shop_slug];
        if (!setting) return false;
        const expiresAt =
          new Date(c.reward_unlocked_at).getTime() +
          Number(setting.reward_expires_days) * DAY_MS;
        const daysLeft = Math.ceil((expiresAt - Date.now()) / DAY_MS);
        return daysLeft > 0 && daysLeft <= EXPIRY_WINDOW_DAYS;
      });

      if (candidates.length > 0) {
        const tokenMap = await buildTokenMap(
          supabase,
          candidates.map((c) => c.email as string)
        );

        for (const c of candidates) {
          if (budget <= 0) break;
          const email = (c.email as string).toLowerCase();
          const setting = settingsMap[c.shop_slug];
          if (!(await canNotify(supabase, email, "reward_expiry"))) continue;
          const claimed = await claimNotification(supabase, {
            email,
            type: "reward_expiry",
            shopSlug: c.shop_slug,
            refId: `${c.id}:${c.reward_unlocked_at}`,
          });
          if (!claimed) continue;

          const shopName = setting.shop_name ?? c.shop_slug;
          const reward = setting.deal_title ?? "reward";
          const validThrough = fmtDate(
            new Date(
              new Date(c.reward_unlocked_at).getTime() +
                Number(setting.reward_expires_days) * DAY_MS
            )
          );
          const title = `Your ${reward} is waiting`;
          const body = `Your reward at ${shopName} is ready to use — valid through ${validThrough}.`;

          const channel = await pushOrEmail({
            email,
            tokens: tokenMap[email],
            title,
            body,
            data: { shop_slug: c.shop_slug, type: "reward_expiry" },
            emailSubject: title,
            emailText: body,
          });
          if (channel !== "none") {
            expirySent++;
            budget--;
          }
        }
      }
    }

    // ── 2. New places nearby ─────────────────────────────────────
    const newSince = new Date(Date.now() - NEW_SHOP_WINDOW_DAYS * DAY_MS).toISOString();
    const { data: newShops } = await supabase
      .from("shops")
      .select("slug, latitude, longitude, created_at, shop_settings(shop_name, deal_title)")
      .gte("created_at", newSince)
      .not("latitude", "is", null)
      .not("longitude", "is", null);

    if ((newShops ?? []).length > 0) {
      // Where does each customer already go? Shops with coordinates give
      // us an honest "their area" without tracking anyone's location.
      const { data: locatedShops } = await supabase
        .from("shops")
        .select("slug, latitude, longitude")
        .not("latitude", "is", null)
        .not("longitude", "is", null);

      const coordBySlug: Record<string, { lat: number; lng: number }> = {};
      for (const s of locatedShops ?? []) {
        coordBySlug[s.slug] = { lat: s.latitude, lng: s.longitude };
      }

      const { data: allCustomers } = await supabase
        .from("customers")
        .select("email, shop_slug")
        .eq("opted_out", false)
        .not("email", "is", null)
        .limit(10000);

      const shopsByEmail: Record<string, Set<string>> = {};
      for (const c of allCustomers ?? []) {
        const e = (c.email as string).toLowerCase();
        (shopsByEmail[e] ??= new Set()).add(c.shop_slug);
      }

      for (const shop of newShops ?? []) {
        if (budget <= 0) break;
        const settings = Array.isArray(shop.shop_settings)
          ? shop.shop_settings[0]
          : shop.shop_settings;
        const shopName = settings?.shop_name;
        if (!shopName || !settings?.deal_title) continue; // not set up yet

        const recipients: string[] = [];
        for (const [email, slugs] of Object.entries(shopsByEmail)) {
          if (slugs.has(shop.slug)) continue; // already a member there
          const isNearby = [...slugs].some((slug) => {
            const coord = coordBySlug[slug];
            return (
              coord &&
              haversineMiles(coord.lat, coord.lng, shop.latitude, shop.longitude) <=
                NEARBY_RADIUS_MILES
            );
          });
          if (isNearby) recipients.push(email);
        }
        if (recipients.length === 0) continue;

        const tokenMap = await buildTokenMap(supabase, recipients);
        const title = `New near you: ${shopName}`;
        const body = `${shopName} just joined Ventzon — ${settings.deal_title}.`;

        for (const email of recipients) {
          if (budget <= 0) break;
          if (!(await canNotify(supabase, email, "new_nearby"))) continue;
          const claimed = await claimNotification(supabase, {
            email,
            type: "new_nearby",
            shopSlug: shop.slug,
            refId: shop.slug,
          });
          if (!claimed) continue;

          const channel = await pushOrEmail({
            email,
            tokens: tokenMap[email],
            title,
            body,
            data: { shop_slug: shop.slug, type: "new_nearby" },
            emailSubject: title,
            emailText: body,
          });
          if (channel !== "none") {
            nearbySent++;
            budget--;
          }
        }
      }
    }

    return NextResponse.json({
      ok: true,
      reward_expiry_sent: expirySent,
      new_nearby_sent: nearbySent,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}

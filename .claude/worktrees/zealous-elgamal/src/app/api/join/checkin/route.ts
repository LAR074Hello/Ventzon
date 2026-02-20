import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { sendSms } from "@/lib/sms";

// ── Helpers ──────────────────────────────────────────────────────────────────
function isE164(phone: string) {
  return /^\+\d{10,15}$/.test(phone);
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

// ── POST /api/join/checkin ───────────────────────────────────────────────────
// Called when a customer scans a QR code at a shop.
//
// Body: { shop_slug: string, phone: string }
//
// Flow:
//   1. Validate input
//   2. Look up shop (must exist + be paid)
//   3. Fetch shop_settings (reward_goal, templates)
//   4. Upsert customer row (insert or increment total_visits)
//   5. Insert checkin record
//   6. Determine if reward earned
//   7. Send transactional SMS (check-in confirmation or reward)
//   8. Return result
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const shop_slug = String(body?.shop_slug || "").trim().toLowerCase();
    const phone = String(body?.phone || "").trim();

    // ── 1. Validate ──────────────────────────────────────────────────────
    if (!shop_slug) {
      return json({ error: "Missing shop_slug" }, 400);
    }
    if (!isE164(phone)) {
      return json(
        { error: "Invalid phone (must be E.164 like +14105551234)" },
        400
      );
    }

    // ── 2. Look up shop ──────────────────────────────────────────────────
    const { data: shop, error: shopErr } = await supabaseAdmin
      .from("shops")
      .select("id, slug, is_paid")
      .eq("slug", shop_slug)
      .single();

    if (shopErr || !shop) {
      return json({ error: "Shop not found" }, 404);
    }
    if (!shop.is_paid) {
      return json({ error: "Shop subscription inactive" }, 403);
    }

    // ── 3. Fetch shop settings ───────────────────────────────────────────
    const { data: settings } = await supabaseAdmin
      .from("shop_settings")
      .select(
        "shop_name, reward_goal, reward_sms_template, welcome_sms_template"
      )
      .eq("shop_slug", shop_slug)
      .single();

    const rewardGoal = settings?.reward_goal ?? 10; // default 10 visits
    const shopName = settings?.shop_name ?? shop_slug;

    // ── 4. Upsert customer ───────────────────────────────────────────────
    // Try to find existing customer for this shop + phone.
    const { data: existingCustomer } = await supabaseAdmin
      .from("customers")
      .select("id, total_visits, opted_out")
      .eq("shop_id", shop.id)
      .eq("phone", phone)
      .single();

    let customerId: string;
    let totalVisits: number;
    let isNewCustomer = false;

    if (existingCustomer) {
      // Increment visits
      totalVisits = (existingCustomer.total_visits ?? 0) + 1;
      customerId = existingCustomer.id;

      await supabaseAdmin
        .from("customers")
        .update({
          total_visits: totalVisits,
          last_visit_at: new Date().toISOString(),
        })
        .eq("id", customerId);
    } else {
      // New customer
      totalVisits = 1;
      isNewCustomer = true;

      const { data: newCustomer, error: custErr } = await supabaseAdmin
        .from("customers")
        .insert({
          shop_id: shop.id,
          phone,
          total_visits: 1,
          last_visit_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (custErr || !newCustomer) {
        // Handle race condition: another request may have inserted between our
        // SELECT and INSERT. Re-fetch and increment.
        const { data: raceCustomer } = await supabaseAdmin
          .from("customers")
          .select("id, total_visits")
          .eq("shop_id", shop.id)
          .eq("phone", phone)
          .single();

        if (!raceCustomer) {
          return json({ error: "Failed to create customer" }, 500);
        }

        customerId = raceCustomer.id;
        totalVisits = (raceCustomer.total_visits ?? 0) + 1;

        await supabaseAdmin
          .from("customers")
          .update({
            total_visits: totalVisits,
            last_visit_at: new Date().toISOString(),
          })
          .eq("id", customerId);
      } else {
        customerId = newCustomer.id;
      }
    }

    // ── 5. Insert checkin record ─────────────────────────────────────────
    await supabaseAdmin.from("checkins").insert({
      shop_id: shop.id,
      customer_id: customerId,
      visit_number: totalVisits,
    });

    // ── 6. Determine reward ──────────────────────────────────────────────
    const rewardEarned = totalVisits > 0 && totalVisits % rewardGoal === 0;

    // ── 7. Send transactional SMS ────────────────────────────────────────
    let smsBody: string;

    if (isNewCustomer && settings?.welcome_sms_template) {
      // First-time visitor: send welcome message
      smsBody = settings.welcome_sms_template
        .replace(/\{\{shop_name\}\}/gi, shopName)
        .replace(/\{\{visits\}\}/gi, String(totalVisits))
        .replace(/\{\{reward_goal\}\}/gi, String(rewardGoal));
    } else if (rewardEarned && settings?.reward_sms_template) {
      // Reward threshold hit
      smsBody = settings.reward_sms_template
        .replace(/\{\{shop_name\}\}/gi, shopName)
        .replace(/\{\{visits\}\}/gi, String(totalVisits))
        .replace(/\{\{reward_goal\}\}/gi, String(rewardGoal));
    } else {
      // Standard check-in confirmation
      const remaining = rewardGoal - (totalVisits % rewardGoal);
      smsBody = `Thanks for visiting ${shopName}! Visit ${totalVisits} logged. ${remaining} more until your next reward!`;
    }

    const smsResult = await sendSms({
      shopId: shop.id,
      to: phone,
      body: smsBody,
      kind: "transactional",
      customerId,
    });

    // ── 8. Return ────────────────────────────────────────────────────────
    return json({
      ok: true,
      customer_id: customerId,
      total_visits: totalVisits,
      reward_earned: rewardEarned,
      is_new_customer: isNewCustomer,
      sms_status: smsResult.status,
    });
  } catch (err: any) {
    console.error("[CHECKIN] Unhandled error", err);
    return json({ error: err?.message ?? "Unknown error" }, 500);
  }
}

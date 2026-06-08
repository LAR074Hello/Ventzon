import { createClient } from "@supabase/supabase-js";

/**
 * Insert 3 rows into scheduled_emails for a new merchant.
 * Called right after shop creation — works for both free and paid plans.
 *
 * Uses the service-role client so it works from any context (API route,
 * webhook, etc.) without needing user auth cookies.
 */
export async function scheduleOnboardingDrip(
  merchantEmail: string,
  shopSlug: string
): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.warn("[onboarding-drip] Missing Supabase env vars — skipping drip schedule");
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const now = Date.now();

  const rows = [
    {
      merchant_email: merchantEmail,
      shop_slug: shopSlug,
      email_type: "day1",
      send_at: new Date(now).toISOString(),                          // send immediately
    },
    {
      merchant_email: merchantEmail,
      shop_slug: shopSlug,
      email_type: "day3",
      send_at: new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      merchant_email: merchantEmail,
      shop_slug: shopSlug,
      email_type: "day7",
      send_at: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  // Deduplicate: don't double-schedule if the shop was somehow onboarded twice
  const { data: existing } = await supabase
    .from("scheduled_emails")
    .select("id")
    .eq("shop_slug", shopSlug)
    .limit(1);

  if (existing && existing.length > 0) {
    console.log(`[onboarding-drip] Already scheduled for ${shopSlug} — skipping`);
    return;
  }

  const { error } = await supabase.from("scheduled_emails").insert(rows);
  if (error) {
    console.warn("[onboarding-drip] Failed to schedule drip emails:", error.message);
  } else {
    console.log(`[onboarding-drip] Scheduled 3 emails for ${shopSlug} (${merchantEmail})`);
  }
}

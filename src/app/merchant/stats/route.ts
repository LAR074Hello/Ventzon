import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";

/**
 * Returns YYYY-MM-DD for "today" in America/New_York
 */
function getNYDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

/**
 * Returns timezone offset like "-05:00" or "-04:00" for America/New_York at "now".
 * (Good enough for MVP; DST edge-cases around midnight are extremely rare.)
 */
function getNYOffsetString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    timeZoneName: "shortOffset",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);

  const tz = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT-05:00";
  // Examples: "GMT-5", "GMT-05:00", "GMT+1"
  const match = tz.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);

  if (!match) return "-05:00";

  const sign = match[1] === "-" ? "-" : "+";
  const hh = match[2].padStart(2, "0");
  const mm = (match[3] ?? "00").padStart(2, "0");
  return `${sign}${hh}:${mm}`;
}

/**
 * ISO string for start of TODAY in New York, converted to UTC.
 * Example: "2026-02-04T05:00:00.000Z" (when NY is -05:00)
 */
function getStartOfTodayNYAsUTCISOString() {
  const ymd = getNYDateString(new Date());
  const offset = getNYOffsetString(new Date());
  // Parse local NY midnight into a real Date (UTC under the hood)
  const dt = new Date(`${ymd}T00:00:00${offset}`);
  return dt.toISOString();
}

export async function GET(req: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server misconfigured: missing Supabase env vars" },
        { status: 500 }
      );
    }

    const url = new URL(req.url);
    const shop_slug = String(url.searchParams.get("shop_slug") ?? "")
      .trim()
      .toLowerCase();

    if (!shop_slug) {
      return NextResponse.json({ error: "Missing shop_slug" }, { status: 400 });
    }

    // Auth check: verify the requesting user owns this shop
    const supabaseAuth = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify ownership: user must own a shop with this slug
    const { data: shopRow } = await supabase
      .from("shops")
      .select("id")
      .eq("slug", shop_slug)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!shopRow) {
      return NextResponse.json(
        { error: "Shop not found or you don't own it" },
        { status: 403 }
      );
    }

    // New York local midnight → UTC ISO string
    const startOfTodayNYUTC = getStartOfTodayNYAsUTCISOString();

    // Total customers for this shop
    const totalRes = await supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("shop_slug", shop_slug);

    if (totalRes.error) {
      return NextResponse.json({ error: totalRes.error.message }, { status: 500 });
    }

    // New members today (customers who joined since New York midnight)
    const newTodayRes = await supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("shop_slug", shop_slug)
      .gte("created_at", startOfTodayNYUTC);

    if (newTodayRes.error) {
      return NextResponse.json({ error: newTodayRes.error.message }, { status: 500 });
    }

    // Check-ins today (actual checkin events since New York midnight)
    const checkinsTodayRes = await supabase
      .from("checkins")
      .select("id", { count: "exact", head: true })
      .eq("shop_slug", shop_slug)
      .gte("created_at", startOfTodayNYUTC);

    if (checkinsTodayRes.error) {
      return NextResponse.json({ error: checkinsTodayRes.error.message }, { status: 500 });
    }

    // Latest check-ins — most recent checkin events, joined to their customer
    const latestCheckinsRes = await supabase
      .from("checkins")
      .select("created_at, customer_id, customers(phone, email)")
      .eq("shop_slug", shop_slug)
      .not("customer_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(10);

    if (latestCheckinsRes.error) {
      return NextResponse.json({ error: latestCheckinsRes.error.message }, { status: 500 });
    }

    const latestCheckins = ((latestCheckinsRes.data ?? []) as unknown as Array<{
      created_at: string;
      customers:
        | { phone: string | null; email: string | null }
        | Array<{ phone: string | null; email: string | null }>
        | null;
    }>).map((row) => {
      const customer = Array.isArray(row.customers)
        ? row.customers[0]
        : row.customers;
      return {
        contact: customer?.phone || customer?.email || null,
        checked_in_at: row.created_at,
      };
    });

    return NextResponse.json({
      shop_slug,
      // optional: helpful for debugging / confidence
      today_boundary: {
        timezone: "America/New_York",
        start_of_today_utc: startOfTodayNYUTC,
        ny_date: getNYDateString(new Date()),
      },
      totals: {
        total: totalRes.count ?? 0,
      },
      new_members_today: newTodayRes.count ?? 0,
      checkins_today: checkinsTodayRes.count ?? 0,
      latest_checkins: latestCheckins,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
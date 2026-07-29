import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/customer/places-search?q=…[&lat=&lng=]
 *
 * Name search over `places`. This exists because location is not always
 * available — denied, unavailable, or an OS prompt that was never allowed to
 * appear — and the composer must still let someone tag where they are.
 *
 * The alternative considered and rejected was falling back to a default city:
 * showing East Village places to someone in Columbus is worse than showing
 * nothing, because it invites a *wrong* tag rather than no tag. Search asks
 * the user what they know instead of guessing.
 *
 * `places` has RLS enabled with no anon policy, so this reads through the
 * service role. It returns only public place fields.
 */
export async function GET(req: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    if (q.length < 2) return NextResponse.json({ places: [] });

    // PostgREST treats these as pattern metacharacters; a user typing "%" or a
    // comma should search for that text, not rewrite the filter.
    const safe = q.replace(/[%,()]/g, " ").trim();
    if (!safe) return NextResponse.json({ places: [] });

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await supabase
      .from("places")
      .select("slug, name, neighborhood, city, category, latitude, longitude")
      .ilike("name", `%${safe}%`)
      .order("name", { ascending: true })
      .limit(20);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ places: data ?? [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

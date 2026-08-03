import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getBlockedSet } from "@/lib/social";

export const dynamic = "force-dynamic";

/**
 * GET /api/customer/search?q=…
 *
 * People and places, in one call. Deliberately minimal: two `ilike` lookups
 * and a cap. No ranking model, no fuzzy matching, no history.
 *
 * WHY IT EXISTS AT ALL. Explore's search box filtered the rows already loaded
 * on the client — about 60 of 3,300 places. Typing the name of a real bar and
 * getting "no results" is worse than having no search, because it reads as
 * "Ventzon doesn't know this place" when in fact it is sitting in the table
 * unqueried.
 *
 * PLACES FIRST in the response, because the product is place discovery. People
 * are the second question, not the first.
 */
export async function GET(req: Request) {
  try {
    const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
    if (q.length < 2) return NextResponse.json({ places: [], people: [] });

    // PostgREST treats these as pattern syntax; a raw % turns a search into a
    // full-table scan and a , breaks out of the filter expression.
    const safe = q.replace(/[%,()]/g, " ").slice(0, 60);

    const admin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let viewerEmail: string | null = null;
    try {
      const auth = await createSupabaseServerClient();
      const { data: { user } } = await auth.auth.getUser();
      viewerEmail = user?.email?.toLowerCase() ?? null;
    } catch {
      /* signed out is a valid way to search */
    }

    const [{ data: placeRows }, { data: peopleRows }, blocked] = await Promise.all([
      admin
        .from("places")
        .select("slug, name, neighborhood, city, category, photos")
        .or(`name.ilike.%${safe}%,neighborhood.ilike.%${safe}%`)
        .limit(20),
      admin
        .from("customer_profiles")
        .select("id, email, display_name, avatar_url")
        .ilike("display_name", `%${safe}%`)
        .not("display_name", "is", null)
        .limit(12),
      getBlockedSet(admin, viewerEmail),
    ]);

    const places = (placeRows ?? []).map((p) => {
      const photos = Array.isArray(p.photos) ? (p.photos as string[]) : [];
      return {
        slug: p.slug,
        name: p.name,
        sub: [p.neighborhood, p.category].filter(Boolean).join(" · ") || p.city || "",
        photo_url: photos[0] ?? null,
      };
    });

    // Blocking is mutual invisibility, and search is a place that quietly
    // undoes it if you forget.
    const people = (peopleRows ?? [])
      .filter((p) => !blocked.has(p.email))
      .map((p) => ({
        profile_id: p.id,
        display_name: p.display_name as string,
        avatar_url: p.avatar_url as string | null,
      }));

    // An exact-ish prefix match is almost always what was meant.
    const lower = q.toLowerCase();
    places.sort((a, b) => {
      const ap = a.name.toLowerCase().startsWith(lower) ? 0 : 1;
      const bp = b.name.toLowerCase().startsWith(lower) ? 0 : 1;
      return ap - bp || a.name.localeCompare(b.name);
    });

    return NextResponse.json({ places, people });
  } catch (err) {
    const e = err as { message?: string };
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}

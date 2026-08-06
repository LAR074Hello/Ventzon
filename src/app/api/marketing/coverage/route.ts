import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * GET /api/marketing/coverage
 *
 * The marketing site's coverage section, derived from the places table so it
 * updates itself as new metros are imported — no city name is ever hard-coded
 * into the site copy. Returns the cities with the most places, with
 * neighborhood + place counts for each.
 */
export async function GET() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: rows } = await supabase.from("places").select("city, neighborhood");

    const byCity = new Map<string, { neighborhoods: Set<string>; places: number }>();
    for (const r of rows ?? []) {
      const city = String(r.city ?? "").trim();
      if (!city) continue;
      const entry = byCity.get(city) ?? { neighborhoods: new Set<string>(), places: 0 };
      entry.places += 1;
      if (r.neighborhood) entry.neighborhoods.add(String(r.neighborhood));
      byCity.set(city, entry);
    }

    const cities = [...byCity.entries()]
      .map(([name, v]) => ({
        name,
        neighborhoods: v.neighborhoods.size,
        places: v.places,
      }))
      .sort((a, b) => b.places - a.places)
      .slice(0, 12);

    return NextResponse.json({ cities });
  } catch (err) {
    const e = err as { message?: string };
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}

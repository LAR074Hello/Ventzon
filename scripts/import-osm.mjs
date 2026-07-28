#!/usr/bin/env node
/**
 * OSM place import — populates `places` with real businesses.
 *
 *   node scripts/import-osm.mjs                  # dry run, writes nothing
 *   node scripts/import-osm.mjs --apply          # actually insert
 *   node scripts/import-osm.mjs --only williamsburg
 *
 * WHY THIS EXISTS
 * The seed's businesses are invented and are dev-only, permanently. Real users
 * must never see a fabricated shop. OSM carries businesses that actually
 * exist, which is the only acceptable source for a populated map.
 *
 * THE FILTER IS EDITORIAL, NOT TECHNICAL
 * We import places people photograph. A petrol station is a real business and
 * a correct OSM feature, and nobody posts a picture of it. A tighter import
 * makes a better feed than a complete one.
 *
 * NAMES ARE REQUIRED AND NEVER SYNTHESISED
 * A feature with no `name` tag is dropped. Deriving "Convenience Store" from
 * shop=convenience would reintroduce exactly the fabricated-business problem
 * we deleted from production on 2026-07-28.
 *
 * LICENSING: OSM data is ODbL. Rows land with source='osm' so imported data
 * stays separable from user-generated content, and attribution is required
 * wherever it is displayed (PRE-LAUNCH).
 */
import { createClient } from "@supabase/supabase-js";
import { loadEnv, projectRefFrom, PRODUCTION_PROJECT_REF } from "./dev-guard.mjs";

const argv = process.argv.slice(2);
const APPLY = argv.includes("--apply");
const ONLY = (() => {
  const i = argv.indexOf("--only");
  return i === -1 ? null : argv[i + 1];
})();

// ── target areas ───────────────────────────────────────────────────────────
// bbox is (south,west,north,east) — Overpass order.
const AREAS = [
  { key: "east-village-les", neighborhood: "East Village / LES", city: "New York",
    bbox: "40.715,-73.995,40.735,-73.972" },
  { key: "williamsburg",     neighborhood: "Williamsburg",       city: "New York",
    bbox: "40.700,-73.970,40.725,-73.930" },
  { key: "hoboken",          neighborhood: "Hoboken",            city: "Hoboken",
    bbox: "40.735,-74.045,40.760,-74.020" },

  // Columbus — where Luke is. Testers are in NYC, so these places are ~500
  // miles from everyone else; that is fine and intended, but it is why the
  // map header counts only what is genuinely within NEARBY_MILES rather than
  // calling the whole table "nearby".
  { key: "short-north",      neighborhood: "Short North",        city: "Columbus",
    bbox: "39.970,-83.010,39.995,-82.990" },
  { key: "german-village",   neighborhood: "German Village",     city: "Columbus",
    bbox: "39.940,-83.010,39.960,-82.985" },
  { key: "campus-high-st",   neighborhood: "High St / Campus",   city: "Columbus",
    bbox: "39.995,-83.020,40.020,-82.995" },
];

// ── the editorial filter ───────────────────────────────────────────────────
const AMENITY = "cafe|restaurant|bar|pub|biergarten|ice_cream|nightclub|theatre|arts_centre|music_venue";
const SHOP    = "bakery|deli|books|music|clothes|boutique|hairdresser|tattoo|art|second_hand|gift|jewelry|shoes|florist";
const TOURISM = "gallery|museum";
const LEISURE = "park|fitness_centre|dance";

/**
 * OSM's long tail mapped onto the app's five-term vocabulary.
 *
 * NOTE: the requested import list is broader than those five terms — galleries,
 * museums, parks and music venues have no natural home in
 * Coffee/Food/Retail/Beauty/Fitness. They are mapped to the nearest term below
 * so nothing is dropped, but see design-notes.md: this vocabulary probably
 * needs a "Culture" and an "Outdoors" term, which is a UI decision, not an
 * import one.
 */
function categoryFor(tags) {
  const a = tags.amenity, s = tags.shop, t = tags.tourism, l = tags.leisure;
  if (a === "cafe" || s === "coffee") return "Coffee";
  if (["restaurant", "bar", "pub", "biergarten", "ice_cream", "fast_food"].includes(a)) return "Food";
  if (["bakery", "deli"].includes(s)) return "Food";
  if (s === "hairdresser" || s === "tattoo" || s === "beauty") return "Beauty";
  if (l === "fitness_centre" || l === "dance" || tags.sport === "yoga") return "Fitness";
  if (l === "park") return "Outdoors";
  if (t === "gallery" || t === "museum" || a === "theatre" || a === "arts_centre") return "Culture";
  if (a === "nightclub" || a === "music_venue") return "Culture";
  if (s) return "Retail";
  return "Retail";
}

const overpassQuery = (bbox) => `[out:json][timeout:180];(
  nwr["amenity"~"^(${AMENITY})$"](${bbox});
  nwr["shop"~"^(${SHOP})$"](${bbox});
  nwr["tourism"~"^(${TOURISM})$"](${bbox});
  nwr["leisure"~"^(${LEISURE})$"](${bbox});
);out center tags;`;

const HOSTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Overpass is a free, shared, aggressively rate-limited service. Treat a 429
 * or a 504 as "wait longer", not as a failure — the alternative is hammering
 * a public instance, which is both rude and counterproductive.
 */
async function fetchArea(area) {
  const body = overpassQuery(area.bbox);
  const attempts = [];
  for (let round = 0; round < 4; round++) {
    for (const host of HOSTS) {
      try {
        // Overpass 406s a request with no identifying User-Agent, and their
        // usage policy asks for one anyway.
        const res = await fetch(host, {
          method: "POST",
          headers: {
            "User-Agent": "ventzon-place-import/1.0 (+https://www.ventzon.com; contact lukerichardsschool@gmail.com)",
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ data: body }),
        });
        if (!res.ok) {
          attempts.push(`${new URL(host).host} HTTP ${res.status}`);
          await sleep(res.status === 429 ? 30000 : 10000);
          continue;
        }
        const text = await res.text();
        let json;
        try {
          json = JSON.parse(text);
        } catch {
          attempts.push(`${new URL(host).host} non-JSON: ${text.slice(0, 80)}`);
          await sleep(15000);
          continue;
        }
        if (Array.isArray(json.elements)) return json.elements;
        attempts.push(`${new URL(host).host} no elements array`);
      } catch (e) {
        attempts.push(`${new URL(host).host} ${e.message}`);
      }
      await sleep(8000);
    }
    if (round < 3) {
      const wait = 30 * (round + 1);
      console.log(`\n    all mirrors busy, backing off ${wait}s…`);
      await sleep(wait * 1000);
    }
  }
  throw new Error(
    `Overpass failed for ${area.key} after 4 rounds:\n      ` + attempts.join("\n      ")
  );
}

// ── helpers ────────────────────────────────────────────────────────────────
const R_EARTH_M = 6371000;
function metresBetween(aLat, aLng, bLat, bLng) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R_EARTH_M * Math.asin(Math.sqrt(s));
}

const slugify = (s) =>
  s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
   .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const normName = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function coordsOf(el) {
  if (typeof el.lat === "number" && typeof el.lon === "number") return [el.lat, el.lon];
  if (el.center) return [el.center.lat, el.center.lon];
  return [null, null];
}

// ── main ───────────────────────────────────────────────────────────────────
const env = { ...loadEnv(), ...process.env };
const url = env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
const ref = projectRefFrom(url);
if (APPLY && ref === PRODUCTION_PROJECT_REF && !argv.includes("--i-really-mean-production")) {
  console.error(
    "\n  REFUSING: --apply against PRODUCTION.\n" +
    "  Run against dev first and review the map and a place page.\n" +
    "  If this is genuinely intended, add --i-really-mean-production.\n"
  );
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

console.log(`\n  target: ${ref}${ref === PRODUCTION_PROJECT_REF ? "  ** PRODUCTION **" : " (dev)"}`);
console.log(`  mode:   ${APPLY ? "APPLY (will insert)" : "DRY RUN (writes nothing)"}\n`);

const areas = ONLY ? AREAS.filter((a) => a.key === ONLY) : AREAS;
if (areas.length === 0) {
  console.error(`No area matching --only ${ONLY}. Known: ${AREAS.map((a) => a.key).join(", ")}`);
  process.exit(1);
}

const stats = { raw: 0, unnamed: 0, noCoords: 0, dupInOsm: 0, candidates: 0 };
const candidates = [];

for (const area of areas) {
  process.stdout.write(`  ${area.key}: querying Overpass… `);
  const elements = await fetchArea(area);
  stats.raw += elements.length;
  console.log(`${elements.length} raw features`);

  const kept = [];
  for (const el of elements) {
    const tags = el.tags ?? {};
    const name = (tags.name ?? "").trim();

    // Names are required and never synthesised.
    if (!name) { stats.unnamed++; continue; }

    const [lat, lng] = coordsOf(el);
    if (lat == null || lng == null) { stats.noCoords++; continue; }

    kept.push({
      osm_id: `${el.type}/${el.id}`,
      osm_type: el.type,
      name,
      lat,
      lng,
      category: categoryFor(tags),
      address: [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ") || null,
      neighborhood: area.neighborhood,
      city: area.city,
    });
  }

  // Dedupe WITHIN this area: same normalised name within 50m is the same
  // business mapped twice (typically a node and its building way).
  // Proximity-scoped on purpose — 14 Dunkin' branches are 14 places.
  //
  // SORTED FIRST, so the surviving representative is deterministic. Overpass
  // does not guarantee element order, and picking "whichever came first" meant
  // a re-run could keep the way where the previous run kept the node — a
  // different osm_id for the same business, which then imported as a duplicate.
  // Node beats way beats relation; ties break on id.
  const rank = { node: 0, way: 1, relation: 2 };
  kept.sort(
    (a, b) =>
      normName(a.name).localeCompare(normName(b.name)) ||
      (rank[a.osm_type] ?? 9) - (rank[b.osm_type] ?? 9) ||
      String(a.osm_id).localeCompare(String(b.osm_id))
  );

  const accepted = [];
  for (const c of kept) {
    const twin = accepted.find(
      (a) => normName(a.name) === normName(c.name) && metresBetween(a.lat, a.lng, c.lat, c.lng) < 50
    );
    if (!twin) { accepted.push(c); continue; }
    stats.dupInOsm++;
  }

  console.log(
    `    named+located: ${kept.length}   after in-OSM dedupe: ${accepted.length}`
  );
  candidates.push(...accepted);
}

stats.candidates = candidates.length;

// ── dedupe against existing places ─────────────────────────────────────────
/**
 * PAGINATED ON PURPOSE. PostgREST caps an unbounded select at 1000 rows, and
 * it does so silently. Reading only the first page made the osm_id dedupe miss
 * everything past row 1000, so a second run reported 1732 fresh inserts
 * against a table that already held them. An import that duplicates its own
 * output on re-run is worse than one that fails.
 */
async function loadExistingPlaces() {
  const PAGE = 1000;
  const all = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from("places")
      .select("id, slug, name, latitude, longitude, osm_id, claimed_by, source")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    all.push(...(data ?? []));
    if ((data ?? []).length < PAGE) break;
  }
  return all;
}

let existing;
try {
  existing = await loadExistingPlaces();
} catch (e) {
  console.error("Failed to read places:", e.message);
  process.exit(1);
}
console.log(`  existing places in target: ${existing.length}`);

const byOsmId = new Map((existing ?? []).filter((p) => p.osm_id).map((p) => [p.osm_id, p]));
const takenSlugs = new Set((existing ?? []).map((p) => p.slug));

const toInsert = [];
const skipped = { alreadyImported: 0, matchedClaimed: 0, matchedExisting: 0 };

for (const c of candidates) {
  if (byOsmId.has(c.osm_id)) { skipped.alreadyImported++; continue; }

  // Name + proximity against everything already in places — including rows a
  // merchant created. A claimed row is NEVER overwritten or duplicated.
  const match = (existing ?? []).find(
    (p) =>
      p.latitude != null && p.longitude != null &&
      normName(p.name) === normName(c.name) &&
      metresBetween(p.latitude, p.longitude, c.lat, c.lng) < 75
  );
  if (match) {
    if (match.claimed_by) skipped.matchedClaimed++;
    else skipped.matchedExisting++;
    continue;
  }

  // Slug must be unique and is frozen at creation.
  let slug = slugify(c.name);
  if (!slug) { stats.unnamed++; continue; }
  if (takenSlugs.has(slug)) {
    const suffix = slugify(c.neighborhood).split("-")[0];
    let candidateSlug = `${slug}-${suffix}`;
    let n = 2;
    while (takenSlugs.has(candidateSlug)) candidateSlug = `${slug}-${suffix}-${n++}`;
    slug = candidateSlug;
  }
  takenSlugs.add(slug);

  toInsert.push({
    slug,
    name: c.name,
    address: c.address,
    latitude: c.lat,
    longitude: c.lng,
    neighborhood: c.neighborhood,
    city: c.city,
    category: c.category,
    source: "osm",
    osm_id: c.osm_id,
    osm_updated_at: new Date().toISOString(),
    verification_tier: "unclaimed",
  });
}

// ── report ─────────────────────────────────────────────────────────────────
console.log(`\n  raw features            ${stats.raw}`);
console.log(`  dropped: no name        ${stats.unnamed}`);
console.log(`  dropped: no coords      ${stats.noCoords}`);
console.log(`  collapsed in-OSM dupes  ${stats.dupInOsm}`);
console.log(`  candidates              ${stats.candidates}`);
console.log(`  already imported        ${skipped.alreadyImported}`);
console.log(`  matched a CLAIMED place ${skipped.matchedClaimed}  (left untouched)`);
console.log(`  matched existing place  ${skipped.matchedExisting}`);
console.log(`  TO INSERT               ${toInsert.length}`);

const byCat = {};
for (const p of toInsert) byCat[p.category] = (byCat[p.category] ?? 0) + 1;
console.log(`\n  by category:`, byCat);
const byHood = {};
for (const p of toInsert) byHood[p.neighborhood] = (byHood[p.neighborhood] ?? 0) + 1;
console.log(`  by neighbourhood:`, byHood);

console.log(`\n  sample:`);
for (const p of toInsert.slice(0, 30)) {
  console.log(`    ${p.category.padEnd(9)} ${p.name}  —  ${p.neighborhood}`);
}

if (!APPLY) {
  console.log(`\n  DRY RUN — nothing written. Re-run with --apply.\n`);
  process.exit(0);
}

// ── insert ─────────────────────────────────────────────────────────────────
let inserted = 0;
for (let i = 0; i < toInsert.length; i += 200) {
  const chunk = toInsert.slice(i, i + 200);
  const { error } = await db.from("places").insert(chunk);
  if (error) { console.error(`\n  insert failed at ${i}: ${error.message}`); process.exit(1); }
  inserted += chunk.length;
  process.stdout.write(`\r  inserted ${inserted}/${toInsert.length}`);
}
console.log(`\n\n  done. ${inserted} places imported into ${ref}.\n`);

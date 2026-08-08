/**
 * Imported cities — where the OSM import actually has places.
 *
 * Two jobs: (1) turn a GPS coordinate into a city for the NEARBY tab, and
 * (2) feed the "your city" picker, so someone in an area we haven't imported
 * yet (Philadelphia, Baltimore) can say so honestly instead of silently being
 * shown another city's feed.
 *
 * The bounding boxes mirror scripts/import-osm.mjs — keep them in lockstep.
 */

export const IMPORTED_CITIES: string[] = ["New York", "Hoboken", "Columbus", "Westerville"];

/** (south, west, north, east) — the same order as the Overpass bboxes. */
const AREAS: { city: string; bbox: [number, number, number, number] }[] = [
  { city: "New York", bbox: [40.715, -73.995, 40.735, -73.972] }, // East Village / LES
  { city: "New York", bbox: [40.7, -73.97, 40.725, -73.93] }, // Williamsburg
  { city: "Hoboken", bbox: [40.735, -74.045, 40.76, -74.02] },
  { city: "Columbus", bbox: [39.97, -83.01, 39.995, -82.99] }, // Short North
  { city: "Columbus", bbox: [39.94, -83.01, 39.96, -82.985] }, // German Village
  { city: "Columbus", bbox: [39.995, -83.02, 40.02, -82.995] }, // High St / Campus
  { city: "Columbus", bbox: [39.975, -82.93, 40.04, -82.8] }, // North Columbus
  { city: "Westerville", bbox: [40.1, -82.96, 40.16, -82.88] },
  { city: "Columbus", bbox: [40.12, -83.02, 40.175, -82.94] }, // Polaris
];

/** Resolve a coordinate to an imported city, or null when it is not covered. */
export function cityForCoords(lat: number, lng: number): string | null {
  for (const { city, bbox } of AREAS) {
    const [s, w, n, e] = bbox;
    if (lat >= s && lat <= n && lng >= w && lng <= e) return city;
  }
  return null;
}

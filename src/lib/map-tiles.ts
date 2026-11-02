/**
 * src/lib/map-tiles.ts
 *
 * CARTO basemap tiles (Positron / Dark Matter). Since Oct 2026 CARTO serves
 * an "API KEY REQUIRED" watermark tile to any request without a key. The
 * free key (carto.com/basemaps/apikey, no account) allows commercial use up
 * to 1M tile requests a month; attribution to CARTO and OpenStreetMap must
 * stay visible. The key is public by nature (it rides in every tile URL), so
 * it is restricted by referrer in CARTO, not hidden.
 *
 * PRE-LAUNCH: watch monthly tile requests in the CARTO key dashboard; above
 * 1M/month needs a paid plan or a self-hosted tile source.
 */
// Public by design and referrer-restricted to ventzon.com / *.ventzon.com in
// the CARTO dashboard, so it lives in the code; the env var can override it.
const KEY = process.env.NEXT_PUBLIC_CARTO_KEY || "cb1_50n7_1_7c82c73387ae4a0518a81965";

export type CartoStyle = "light_all" | "dark_all";

/** Leaflet template, e.g. for L.tileLayer(). */
export function cartoTileTemplate(style: CartoStyle): string {
  const base = `https://{s}.basemaps.cartocdn.com/${style}/{z}/{x}/{y}{r}.png`;
  return KEY ? `${base}?key=${encodeURIComponent(KEY)}` : base;
}

/** One concrete tile URL (for static mosaics). */
export function cartoTileUrl(style: CartoStyle, z: number, x: number, y: number): string {
  const base = `https://a.basemaps.cartocdn.com/${style}/${z}/${x}/${y}.png`;
  return KEY ? `${base}?key=${encodeURIComponent(KEY)}` : base;
}

/**
 * PlaceMiniMap — a static map block for a place page.
 *
 * Server component, no JavaScript, no map library. A place page is a public
 * share surface that is often the first Ventzon screen someone ever sees;
 * shipping Leaflet to it to render a non-interactive thumbnail would be a poor
 * trade. This composes the same CARTO basemap tiles the live map uses into a
 * fixed mosaic and centres a pin over it.
 *
 * It exists because the no-post state left the page mostly empty below the
 * invitation. For a place nobody has posted about, *where it is* is the most
 * useful thing the page can say.
 */
const TILE = 256;

function tileX(lon: number, z: number) {
  return ((lon + 180) / 360) * 2 ** z;
}
function tileY(lat: number, z: number) {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z;
}

export default function PlaceMiniMap({
  lat,
  lng,
  height = 180,
  zoom = 16,
  theme = "light",
}: {
  lat: number;
  lng: number;
  height?: number;
  zoom?: number;
  theme?: "light" | "dark";
}) {
  const fx = tileX(lng, zoom);
  const fy = tileY(lat, zoom);
  const cx = Math.floor(fx);
  const cy = Math.floor(fy);

  // Enough tiles to cover a wide container at any phone width.
  const cols = [-2, -1, 0, 1, 2];
  const rows = [-1, 0, 1];
  const style = theme === "dark" ? "dark_all" : "light_all";

  return (
    <div
      className="relative overflow-hidden rounded-card"
      style={{ height, boxShadow: "inset 0 0 0 1px var(--border-subtle)" }}
      aria-hidden="true"
    >
      <div className="absolute left-1/2 top-1/2">
        {rows.map((dy) =>
          cols.map((dx) => {
            const tx = cx + dx;
            const ty = cy + dy;
            if (ty < 0 || ty >= 2 ** zoom) return null;
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${dx}:${dy}`}
                src={`https://a.basemaps.cartocdn.com/${style}/${zoom}/${tx}/${ty}.png`}
                alt=""
                width={TILE}
                height={TILE}
                loading="lazy"
                style={{
                  position: "absolute",
                  left: (tx - fx) * TILE,
                  top: (ty - fy) * TILE,
                  maxWidth: "none",
                }}
              />
            );
          })
        )}
      </div>

      {/* The pin sits at the exact centre, which is the place's coordinate. */}
      <div
        className="absolute left-1/2 top-1/2"
        style={{ transform: "translate(-50%, -50%)" }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "var(--text-primary)",
            boxShadow: "0 0 0 4px var(--surface-raised), 0 2px 8px rgba(0,0,0,0.3)",
          }}
        />
      </div>

      {/* ODbL attribution is required wherever imported data is displayed —
          and the place name, address and category on this page are OSM-derived
          too, not just the tiles. "contributors" plus the link to the copyright
          page is the form the OSMF guidelines ask for; "© OpenStreetMap" alone
          is not it. The backing plate keeps it legible over any tile, which the
          guidelines also ask for. */}
      <a
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noopener noreferrer"
        /* No onClick — this is a server component by design (see above), and
           an event handler here throws at render. A plain anchor is all the
           attribution link needs anyway. */
        className="absolute bottom-1 right-1 rounded-ctl bg-surface-raised/90 px-1.5 py-0.5 text-2xs text-secondary underline underline-offset-2"
      >
        © OpenStreetMap contributors © CARTO
      </a>
    </div>
  );
}

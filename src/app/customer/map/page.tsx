"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Locate, X, ChevronRight } from "lucide-react";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";

type ShopPin = {
  slug: string;
  shop_name: string;
  /** Slice 1.3: unclaimed places appear on the map too, muted. */
  verification_tier?: "unclaimed" | "claimed" | "subscribed";
  neighborhood?: string | null;
  deal_title: string | null;
  deal_details: string | null;
  reward_goal: number;
  logo_url: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
};

// Same lightweight inference the explore feed uses — no category column exists yet.
function inferCategory(name: string, deal: string | null, details: string | null): string {
  const text = `${name} ${deal ?? ""} ${details ?? ""}`.toLowerCase();
  if (/coffee|café|cafe|latte|espresso|brew|tea/.test(text)) return "Coffee";
  if (/pizza|burger|taco|sushi|food|eat|restaurant|grill|bbq|sandwich|wrap|bao/.test(text)) return "Food";
  if (/salon|spa|beauty|nail|hair|skin|barber|cut/.test(text)) return "Beauty";
  if (/gym|fitness|yoga|workout|sport|crossfit|class/.test(text)) return "Fitness";
  if (/flower|florist|bouquet|shop|store|retail|boutique|fashion|cloth|grocer/.test(text)) return "Retail";
  return "Local";
}

export default function MapPage() {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  // The cluster group owns every pin. Adding ~2,700 bare markers to the map
  // renders them as overlapping grey masses at city zoom — correct data,
  // unreadable surface.
  const clusterRef = useRef<any>(null);
  const resizeObs = useRef<ResizeObserver | null>(null);

  const [shops, setShops] = useState<ShopPin[]>([]);
  const [selected, setSelected] = useState<ShopPin | null>(null);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [progressMap, setProgressMap] = useState<Record<string, { visits: number; goal: number }>>({});

  // Load shops
  useEffect(() => {
    fetch("/api/customer/shops-map")
      .then((r) => r.json())
      .then((d) => setShops(d.shops ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));

    // Live reward progress for the detail sheet — signed-out users skip this.
    fetch("/api/customer/memberships")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.memberships) return;
        const map: Record<string, { visits: number; goal: number }> = {};
        for (const m of d.memberships) {
          map[m.shop_slug] = { visits: m.visits ?? 0, goal: m.reward_goal ?? 5 };
        }
        setProgressMap(map);
      })
      .catch(() => {});
  }, []);

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;

      if (cancelled || !mapRef.current) return;

      const map = L.map(mapRef.current, {
        center: [40.7128, -74.006], // Default: New York
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      // Basemap follows the theme at init (light_all / dark_all).
      // A live theme toggle swaps tiles on next visit to this tab.
      const lightTheme =
        document.documentElement.getAttribute("data-theme") !== "dark";
      L.tileLayer(
        `https://{s}.basemaps.cartocdn.com/${lightTheme ? "light_all" : "dark_all"}/{z}/{x}/{y}{r}.png`,
        { subdomains: "abcd", maxZoom: 19 }
      ).addTo(map);

      // Attribution small bottom-right
      L.control.attribution({ position: "bottomright", prefix: false })
        .addAttribution('<span style="color:#888">&copy; OpenStreetMap &copy; CARTO</span>')
        .addTo(map);

      mapInstance.current = map;

      // Leaflet caches the container size at init and never re-reads it. The
      // install banner mounts after the map does and changes the container
      // height, which left the tile pane painting at the old size — the map
      // rendered inset with grey gutters on every load. Observe the element
      // rather than guessing at a timeout.
      const ro = new ResizeObserver(() => map.invalidateSize());
      ro.observe(mapRef.current!);
      resizeObs.current = ro;
    })();

    return () => {
      cancelled = true;
      resizeObs.current?.disconnect();
      resizeObs.current = null;
    };
  }, []);

  // Add markers when shops load and map is ready
  useEffect(() => {
    if (!mapInstance.current || shops.length === 0) return;

    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      // Attaches L.markerClusterGroup onto the Leaflet instance.
      await import("leaflet.markercluster");
      if (cancelled) return;

      const map = mapInstance.current;

      // Clear old markers and the group that held them.
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (clusterRef.current) {
        map.removeLayer(clusterRef.current);
        clusterRef.current = null;
      }

      /**
       * Clusters are drawn by us, not by the plugin. The default look is a
       * lime/amber bubble that belongs to another product — this is an
       * ink-filled disc with the count in mono, sized in three steps so a
       * dense block reads as heavier without shouting.
       */
      const cluster = (L as any).markerClusterGroup({
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
        maxClusterRadius: 60,
        disableClusteringAtZoom: 18,
        iconCreateFunction: (c: any) => {
          const n = c.getChildCount();
          const size = n < 10 ? 36 : n < 100 ? 44 : 52;
          const label = n < 1000 ? String(n) : `${Math.floor(n / 1000)}k+`;
          return L.divIcon({
            html: `<div style="
              width:${size}px;height:${size}px;border-radius:50%;
              background:var(--text-primary);color:var(--text-inverse);
              display:flex;align-items:center;justify-content:center;
              font-family:var(--font-mono,ui-monospace,SFMono-Regular,Menlo,monospace);
              font-size:${n < 100 ? 13 : 12}px;font-weight:600;
              letter-spacing:0.02em;
              box-shadow:0 2px 10px rgba(0,0,0,0.35);
            ">${label}</div>`,
            className: "",
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
          });
        },
      });
      clusterRef.current = cluster;

      shops.forEach((shop) => {
        const initial = shop.shop_name.charAt(0).toUpperCase();
        const p = progressMap[shop.slug];
        const rewardReady = p && p.visits >= p.goal;
        // An unclaimed place still gets a pin — that is the whole point of
        // places being first-class. It is muted rather than absent, because
        // a sparse map is worse than a full map of quiet places.
        const unclaimed = shop.verification_tier === "unclaimed";
        const ring = rewardReady
          ? "var(--text-primary)"
          : unclaimed
          ? "var(--border-subtle)"
          : "var(--border-strong)";

        const face = shop.logo_url
          ? `<img src="${shop.logo_url}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
          : `<span style="font-size:14px;font-weight:600;color:var(--text-muted);font-family:sans-serif;">${initial}</span>`;

        const iconHtml = `
          <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
            <div style="
              width:38px; height:38px; border-radius:50%;
              background:var(--surface-raised); border:2px solid ${ring};
              opacity:${unclaimed ? "0.7" : "1"};
              display:flex; align-items:center; justify-content:center;
              overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.6);
            ">${face}</div>
            ${rewardReady ? `<div style="
              background:var(--text-primary);color:var(--text-inverse);border-radius:999px;
              font-size:8px;font-weight:700;letter-spacing:0.05em;
              padding:1px 6px;font-family:sans-serif;white-space:nowrap;
            ">Ready</div>` : ""}
          </div>
        `;

        const icon = L.divIcon({
          html: iconHtml,
          className: "",
          iconSize: [38, rewardReady ? 52 : 38],
          iconAnchor: [19, rewardReady ? 26 : 19],
        });

        const marker = L.marker([shop.latitude, shop.longitude], { icon });
        marker.on("click", () => setSelected(shop));
        cluster.addLayer(marker);
        markersRef.current.push(marker);
      });

      map.addLayer(cluster);

      // Leaflet caches the container size at init. The cluster layer mounts
      // after the app-banner/chrome has settled the layout, so without this
      // the tile pane keeps painting at the old size and the map renders
      // inset with grey gutters.
      map.invalidateSize();

      // Fit map to markers if any
      if (shops.length > 0) {
        const bounds = L.latLngBounds(shops.map((s) => [s.latitude, s.longitude]));
        map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [shops, progressMap]);

  function locateMe() {
    if (!mapInstance.current || locating) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapInstance.current.setView([pos.coords.latitude, pos.coords.longitude], 14, { animate: true });
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  }

  return (
    <div className="relative flex flex-col" style={{ height: "100%", minHeight: "100dvh" }}>
      {/* Header */}
      <div
        className="absolute top-0 left-0 right-0 z-[1000] px-5 flex items-end"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 20px) + 16px)", paddingBottom: "12px" }}
      >
        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 rounded-card border border-subtle bg-surface/80 backdrop-blur-md px-4 py-3">
            <p className="text-2xs font-semibold uppercase tracking-caps text-muted">NEARBY</p>
            <p className="font-display text-lg font-semibold tracking-tight text-primary mt-0.5">
              {loading ? "Loading stores…" : shops.length === 0 ? "Explore nearby stores" : `${shops.length} store${shops.length === 1 ? "" : "s"} nearby`}
            </p>
          </div>
          <button
            onClick={locateMe}
            disabled={locating}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-card border border-subtle bg-surface/80 backdrop-blur-md transition-colors active:bg-surface-raised"
          >
            <Locate className={`h-5 w-5 ${locating ? "text-primary animate-pulse" : "text-muted"}`} />
          </button>
        </div>
      </div>

      {/* Map */}
      <div ref={mapRef} className="flex-1 w-full" style={{ minHeight: "100dvh" }} />


      {/* Shop detail sheet */}
      {selected && (
        <div className="absolute bottom-0 left-0 right-0 z-[1001] animate-in slide-in-from-bottom-4 duration-200">
          <div
            className="mx-3 mb-3 overflow-hidden rounded-sheet border border-subtle bg-surface-raised"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            {/* Dismiss */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div className="flex items-center gap-3">
                {selected.logo_url ? (
                  <img src={selected.logo_url} alt={selected.shop_name} className="h-10 w-10 rounded-ctl object-cover" />
                ) : (
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ctl"
                    style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}
                  >
                    <span className="font-display text-lg font-semibold tracking-tight" style={{ color: "var(--text-muted)" }}>
                      {selected.shop_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-display text-lg font-semibold tracking-tight text-primary truncate">{selected.shop_name}</p>
                    <span
                      className="text-2xs font-semibold uppercase tracking-caps shrink-0 rounded-full px-2 py-0.5"
                      style={{
                        backgroundColor: "var(--surface-raised)",
                        color: "var(--text-muted)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      {inferCategory(selected.shop_name, selected.deal_title, selected.deal_details).toUpperCase()}
                    </span>
                  </div>
                  {selected.address && (
                    <p className="text-xs text-muted truncate mt-0.5">{selected.address}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-raised"
              >
                <X className="h-4 w-4 text-muted" />
              </button>
            </div>

            {/* Unclaimed places have no reward programme yet. The sheet
                invites rather than showing a blank — an empty place is a
                recruitment surface. */}
            {!selected.deal_title && (
              <div className="elevation-1 mx-5 mb-3 flex items-center gap-3 rounded-card px-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-base font-medium text-primary">No one&rsquo;s posted here yet</p>
                  <p className="mt-0.5 text-sm text-secondary">
                    Be the first to show what it&rsquo;s like.
                  </p>
                </div>
                <button
                  onClick={() => router.push(`/place/${selected.slug}`)}
                  className="shrink-0 rounded-full bg-primary px-4 py-2 text-2xs font-semibold uppercase tracking-caps text-inverse transition-all duration-300 active:opacity-80"
                >
                  Be the first
                </button>
              </div>
            )}

            {/* Deal */}
            {selected.deal_title && (
              <div className="mx-5 mb-3 rounded-card border border-subtle bg-surface-raised px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-caps text-muted">Reward</p>
                <p className="font-display text-lg font-semibold tracking-tight text-primary mt-1">{selected.deal_title}</p>
                {selected.deal_details && (
                  <p className="text-xs text-muted mt-0.5">{selected.deal_details}</p>
                )}
                {(() => {
                  const p = progressMap[selected.slug];
                  if (!p) {
                    return <p className="text-xs text-muted mt-2">After {selected.reward_goal} visits</p>;
                  }
                  const remaining = Math.max(p.goal - p.visits, 0);
                  if (remaining === 0) {
                    return <span className="mt-2 inline-flex rounded-full bg-primary px-2.5 py-1 text-2xs font-semibold uppercase tracking-caps text-inverse">Reward ready</span>;
                  }
                  return (
                    <div className="mt-2 flex items-center gap-1.5">
                      <div className="flex gap-0.5">
                        {Array.from({ length: Math.min(p.goal, 8) }).map((_, i) => (
                          <div
                            key={i}
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: i < p.visits ? "var(--text-primary)" : "var(--border-subtle)" }}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted">
                        {remaining} more visit{remaining === 1 ? "" : "s"} to your reward
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* CTA */}
            <div className="px-5 pb-4">
              <button
                onClick={() => router.push(`/customer/shop/${selected.slug}`)}
                className="flex w-full items-center justify-between rounded-card bg-primary px-5 py-3.5 transition-colors active:opacity-80"
              >
                <span className="text-sm font-medium text-inverse">View loyalty card</span>
                <ChevronRight className="h-4 w-4 text-inverse" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

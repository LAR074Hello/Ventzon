"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Locate, X, ChevronRight, MapPin } from "lucide-react";

type ShopPin = {
  slug: string;
  shop_name: string;
  deal_title: string | null;
  deal_details: string | null;
  reward_goal: number;
  logo_url: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
};

const ACCENT_COLORS = [
  "#7c3aed", "#0891b2", "#059669", "#d97706",
  "#dc2626", "#db2777", "#2563eb", "#ca8a04",
];
function hashName(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h);
}
function getAccent(name: string) {
  return ACCENT_COLORS[hashName(name) % ACCENT_COLORS.length];
}

export default function MapPage() {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [shops, setShops] = useState<ShopPin[]>([]);
  const [selected, setSelected] = useState<ShopPin | null>(null);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);

  // Load shops
  useEffect(() => {
    fetch("/api/customer/shops-map")
      .then((r) => r.json())
      .then((d) => setShops(d.shops ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (cancelled || !mapRef.current) return;

      const map = L.map(mapRef.current, {
        center: [40.7128, -74.006], // Default: New York
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      // Dark tile layer (CartoDB Dark Matter)
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        { subdomains: "abcd", maxZoom: 19 }
      ).addTo(map);

      // Attribution small bottom-right
      L.control.attribution({ position: "bottomright", prefix: false })
        .addAttribution('<span style="color:#333">&copy; OpenStreetMap &copy; CARTO</span>')
        .addTo(map);

      mapInstance.current = map;
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Add markers when shops load and map is ready
  useEffect(() => {
    if (!mapInstance.current || shops.length === 0) return;

    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled) return;

      const map = mapInstance.current;

      // Clear old markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      shops.forEach((shop) => {
        const accent = getAccent(shop.shop_name);
        const initial = shop.shop_name.charAt(0).toUpperCase();

        const iconHtml = `
          <div style="
            width:36px; height:36px; border-radius:50%;
            background:${accent}22; border:2px solid ${accent};
            display:flex; align-items:center; justify-content:center;
            font-size:14px; font-weight:600; color:${accent};
            box-shadow:0 2px 8px rgba(0,0,0,0.6);
            font-family:sans-serif;
          ">${initial}</div>
        `;

        const icon = L.divIcon({
          html: iconHtml,
          className: "",
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const marker = L.marker([shop.latitude, shop.longitude], { icon }).addTo(map);
        marker.on("click", () => setSelected(shop));
        markersRef.current.push(marker);
      });

      // Fit map to markers if any
      if (shops.length > 0) {
        const bounds = L.latLngBounds(shops.map((s) => [s.latitude, s.longitude]));
        map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [shops]);

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
          <div className="flex-1 rounded-2xl border border-[#2a2a2a] bg-black/80 backdrop-blur-md px-4 py-3">
            <p className="text-[11px] font-light tracking-[0.15em] text-[#555]">NEARBY</p>
            <p className="text-[15px] font-semibold text-[#f5f5f5] mt-0.5">
              {loading ? "Loading stores…" : shops.length === 0 ? "No stores with map data yet" : `${shops.length} store${shops.length === 1 ? "" : "s"} on Ventzon`}
            </p>
          </div>
          <button
            onClick={locateMe}
            disabled={locating}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#2a2a2a] bg-black/80 backdrop-blur-md transition-colors active:bg-[#1a1a1a]"
          >
            <Locate className={`h-5 w-5 ${locating ? "text-[#ededed] animate-pulse" : "text-[#888]"}`} />
          </button>
        </div>
      </div>

      {/* Map */}
      <div ref={mapRef} className="flex-1 w-full" style={{ minHeight: "100dvh" }} />

      {/* Empty state overlay */}
      {!loading && shops.length === 0 && (
        <div className="absolute inset-0 z-[999] flex items-center justify-center pointer-events-none">
          <div className="mx-8 rounded-3xl border border-[#1f1f1f] bg-black/90 backdrop-blur-md p-8 text-center">
            <div className="mb-4 inline-flex items-center justify-center rounded-2xl border border-[#1f1f1f] bg-[#0d0d0d] p-4">
              <MapPin className="h-7 w-7 text-[#333]" />
            </div>
            <p className="text-[17px] font-semibold text-[#f0f0f0]">No stores on the map yet</p>
            <p className="mt-2 text-[13px] text-[#666] leading-relaxed">
              Stores appear here once they add their address in their merchant dashboard.
            </p>
          </div>
        </div>
      )}

      {/* Shop detail sheet */}
      {selected && (
        <div className="absolute bottom-0 left-0 right-0 z-[1001] animate-in slide-in-from-bottom-4 duration-200">
          <div
            className="mx-3 mb-3 overflow-hidden rounded-3xl border border-[#2a2a2a] bg-[#0a0a0a]"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            {/* Dismiss */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div className="flex items-center gap-3">
                {selected.logo_url ? (
                  <img src={selected.logo_url} alt={selected.shop_name} className="h-10 w-10 rounded-xl object-cover" />
                ) : (
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: `${getAccent(selected.shop_name)}20`, border: `1px solid ${getAccent(selected.shop_name)}35` }}
                  >
                    <span className="text-[16px] font-semibold" style={{ color: getAccent(selected.shop_name) }}>
                      {selected.shop_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-[#f5f5f5] truncate">{selected.shop_name}</p>
                  {selected.address && (
                    <p className="text-[12px] text-[#555] truncate mt-0.5">{selected.address}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1a1a1a]"
              >
                <X className="h-4 w-4 text-[#666]" />
              </button>
            </div>

            {/* Deal */}
            {selected.deal_title && (
              <div className="mx-5 mb-3 rounded-2xl border border-[#1f1f1f] bg-[#111] px-4 py-3">
                <p className="text-[11px] font-medium tracking-[0.1em] text-[#555]">REWARD</p>
                <p className="mt-1 text-[15px] font-semibold text-[#f0f0f0]">{selected.deal_title}</p>
                {selected.deal_details && (
                  <p className="mt-0.5 text-[12px] text-[#666]">{selected.deal_details}</p>
                )}
                <p className="mt-2 text-[11px] text-[#444]">After {selected.reward_goal} visits</p>
              </div>
            )}

            {/* CTA */}
            <div className="px-5 pb-4">
              <button
                onClick={() => router.push(`/customer/shop/${selected.slug}`)}
                className="flex w-full items-center justify-between rounded-2xl bg-[#ededed] px-5 py-3.5 transition-colors active:bg-[#d4d4d4]"
              >
                <span className="text-[13px] font-semibold tracking-[0.05em] text-black">View loyalty card</span>
                <ChevronRight className="h-4 w-4 text-black" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Locate, X, ChevronRight } from "lucide-react";
import "leaflet/dist/leaflet.css";

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
        const initial = shop.shop_name.charAt(0).toUpperCase();
        const p = progressMap[shop.slug];
        const rewardReady = p && p.visits >= p.goal;
        const ring = rewardReady ? "var(--gold)" : "var(--line)";

        const face = shop.logo_url
          ? `<img src="${shop.logo_url}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
          : `<span style="font-size:14px;font-weight:600;color:var(--muted);font-family:sans-serif;">${initial}</span>`;

        const iconHtml = `
          <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
            <div style="
              width:38px; height:38px; border-radius:50%;
              background:var(--surface); border:2px solid ${ring};
              display:flex; align-items:center; justify-content:center;
              overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.6);
            ">${face}</div>
            ${rewardReady ? `<div style="
              background:var(--gold);color:var(--gold-ink);border-radius:999px;
              font-size:8px;font-weight:700;letter-spacing:0.05em;
              padding:1px 6px;font-family:sans-serif;white-space:nowrap;
            ">REWARD</div>` : ""}
          </div>
        `;

        const icon = L.divIcon({
          html: iconHtml,
          className: "",
          iconSize: [38, rewardReady ? 52 : 38],
          iconAnchor: [19, rewardReady ? 26 : 19],
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
          <div className="flex-1 rounded-2xl border border-[#2a2a2a] bg-black/80 backdrop-blur-md px-4 py-3">
            <p className="text-[11px] font-light tracking-[0.15em] text-[#555]">NEARBY</p>
            <p className="text-[15px] font-semibold text-[#f5f5f5] mt-0.5">
              {loading ? "Loading stores…" : shops.length === 0 ? "Explore nearby stores" : `${shops.length} store${shops.length === 1 ? "" : "s"} nearby`}
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
                    style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
                  >
                    <span className="text-[16px] font-semibold" style={{ color: "var(--muted)" }}>
                      {selected.shop_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[15px] font-semibold text-[#f5f5f5] truncate">{selected.shop_name}</p>
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-medium tracking-[0.08em]"
                      style={{
                        backgroundColor: "var(--surface)",
                        color: "var(--muted)",
                        border: "1px solid var(--line)",
                      }}
                    >
                      {inferCategory(selected.shop_name, selected.deal_title, selected.deal_details).toUpperCase()}
                    </span>
                  </div>
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
                {(() => {
                  const p = progressMap[selected.slug];
                  if (!p) {
                    return <p className="mt-2 text-[11px] text-[#444]">After {selected.reward_goal} visits</p>;
                  }
                  const remaining = Math.max(p.goal - p.visits, 0);
                  if (remaining === 0) {
                    return <p className="mt-2 text-[11px] font-medium text-yellow-500">Your reward is ready to redeem</p>;
                  }
                  return (
                    <div className="mt-2 flex items-center gap-1.5">
                      <div className="flex gap-0.5">
                        {Array.from({ length: Math.min(p.goal, 8) }).map((_, i) => (
                          <div
                            key={i}
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: i < p.visits ? "var(--gold)" : "var(--line)" }}
                          />
                        ))}
                      </div>
                      <p className="text-[11px]" style={{ color: "var(--gold)" }}>
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

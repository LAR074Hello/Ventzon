"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin } from "lucide-react";

type Shop = {
  shop_slug: string;
  shop_name: string;
  deal_title: string;
  deal_details: string | null;
  reward_goal: number;
  logo_url: string | null;
};

export default function ExplorePage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [filtered, setFiltered] = useState<Shop[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/customer/explore")
      .then((r) => r.json())
      .then((d) => {
        setShops(d.shops ?? []);
        setFiltered(d.shops ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setFiltered(shops);
    } else {
      setFiltered(
        shops.filter(
          (s) =>
            s.shop_name.toLowerCase().includes(q) ||
            s.deal_title.toLowerCase().includes(q)
        )
      );
    }
  }, [query, shops]);

  return (
    <div className="flex min-h-full flex-col bg-black">
      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <h1 className="text-[22px] font-extralight tracking-[-0.01em] text-[#ededed]">
          Explore
        </h1>
        <p className="mt-1 text-[13px] font-light text-[#555]">
          Discover local rewards near you
        </p>

        {/* Search */}
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-[#444]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stores or deals…"
            className="flex-1 bg-transparent text-[14px] font-light text-[#ededed] outline-none placeholder:text-[#444]"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pb-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#333] border-t-[#ededed]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <MapPin className="h-8 w-8 text-[#333]" />
            <p className="mt-4 text-[14px] font-light text-[#555]">
              {query ? "No stores match your search" : "No stores available yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((shop) => (
              <ShopCard
                key={shop.shop_slug}
                shop={shop}
                onClick={() => router.push(`/customer/shop/${shop.shop_slug}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ShopCard({ shop, onClick }: { shop: Shop; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl border border-[#1a1a1a] bg-[#080808] p-4 text-left transition-colors duration-200 active:bg-[#111]"
    >
      <div className="flex items-center gap-4">
        {/* Logo */}
        {shop.logo_url ? (
          <img
            src={shop.logo_url}
            alt={shop.shop_name}
            className="h-14 w-14 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-[#1a1a1a] bg-[#111]">
            <span className="text-xl font-extralight text-[#555]">
              {shop.shop_name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-light text-[#ededed] truncate">
            {shop.shop_name}
          </p>
          <p className="mt-0.5 text-[13px] font-light text-[#666] truncate">
            {shop.deal_title}
          </p>
          {shop.deal_details && (
            <p className="mt-1 text-[11px] font-light text-[#444] truncate">
              {shop.deal_details}
            </p>
          )}
        </div>

        {/* Goal badge */}
        <div className="shrink-0 rounded-full border border-[#1a1a1a] px-2.5 py-1">
          <p className="text-[10px] font-light tracking-[0.1em] text-[#555]">
            {shop.reward_goal}x
          </p>
        </div>
      </div>
    </button>
  );
}

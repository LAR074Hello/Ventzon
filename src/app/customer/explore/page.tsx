"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, MapPin, Coffee, ShoppingBag, Utensils, Sparkles, Dumbbell, Tag } from "lucide-react";

type Shop = {
  shop_slug: string;
  shop_name: string;
  deal_title: string;
  deal_details: string | null;
  reward_goal: number;
  logo_url: string | null;
  created_at: string | null;
  member_count: number;
};

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "coffee", label: "Coffee", icon: Coffee },
  { id: "food", label: "Food", icon: Utensils },
  { id: "retail", label: "Retail", icon: ShoppingBag },
  { id: "beauty", label: "Beauty", icon: Sparkles },
  { id: "fitness", label: "Fitness", icon: Dumbbell },
  { id: "deals", label: "Deals", icon: Tag },
];

const ACCENT_COLORS = [
  "#7c3aed", "#059669", "#dc2626", "#d97706",
  "#2563eb", "#db2777", "#0891b2", "#ca8a04",
];

const CARD_GRADIENTS = [
  ["#1a0a2e", "#16213e"], ["#0d1f0d", "#0a2e1a"],
  ["#2e0d0d", "#1a0a0a"], ["#1a1200", "#2e1f00"],
  ["#0d0d2e", "#0a1a2e"], ["#2e0d1a", "#1a0020"],
  ["#002e2e", "#001a1a"], ["#1e1000", "#2e2000"],
];

function hashName(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h);
}
function getGradient(name: string): [string, string] {
  return CARD_GRADIENTS[hashName(name) % CARD_GRADIENTS.length] as [string, string];
}
function getAccent(name: string): string {
  return ACCENT_COLORS[hashName(name) % ACCENT_COLORS.length];
}
function inferCategory(shop: Shop): string {
  const text = `${shop.shop_name} ${shop.deal_title} ${shop.deal_details ?? ""}`.toLowerCase();
  if (/coffee|café|cafe|latte|espresso|brew|tea/.test(text)) return "coffee";
  if (/pizza|burger|taco|sushi|food|eat|restaurant|grill|bbq|sandwich|wrap/.test(text)) return "food";
  if (/salon|spa|beauty|nail|hair|skin|barber/.test(text)) return "beauty";
  if (/gym|fitness|yoga|workout|sport|crossfit/.test(text)) return "fitness";
  if (/shop|store|retail|boutique|fashion|cloth/.test(text)) return "retail";
  return "other";
}
function isNew(shop: Shop) {
  if (!shop.created_at) return false;
  return (Date.now() - new Date(shop.created_at).getTime()) / 86400000 < 30;
}
function isLimitedDeal(shop: Shop) {
  return /limited|offer|special|promo|discount|free|today|week|deal/.test(
    `${shop.deal_title} ${shop.deal_details ?? ""}`.toLowerCase()
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/* ── Large featured card (horizontal scroll) ── */
function FeaturedCard({ shop, onClick }: { shop: Shop; onClick: () => void }) {
  const [g0, g1] = getGradient(shop.shop_name);
  const accent = getAccent(shop.shop_name);
  return (
    <button
      onClick={onClick}
      className="shrink-0 w-72 rounded-3xl overflow-hidden text-left active:scale-[0.97] transition-transform duration-150"
      style={{ background: `linear-gradient(145deg, ${g0}, ${g1})` }}
    >
      <div className="relative h-40 w-full overflow-hidden">
        {shop.logo_url ? (
          <img src={shop.logo_url} alt={shop.shop_name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center" style={{ background: `linear-gradient(145deg, ${g0}, ${g1})` }}>
            <span className="text-7xl font-extralight opacity-20" style={{ color: accent }}>
              {shop.shop_name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 60%)" }} />
        <div className="absolute bottom-3 left-4 right-4">
          <p className="text-[16px] font-light text-white leading-tight">{shop.shop_name}</p>
          <p className="mt-0.5 text-[12px] text-white/60 truncate">{shop.deal_title}</p>
        </div>
        <div className="absolute top-3 right-3 rounded-full px-2.5 py-1" style={{ backgroundColor: accent + "30", border: `1px solid ${accent}50` }}>
          <span className="text-[10px] font-light tracking-[0.08em]" style={{ color: accent }}>
            {shop.reward_goal}× REWARD
          </span>
        </div>
      </div>
    </button>
  );
}

/* ── Store row card ── */
function StoreCard({ shop, onClick, tag }: { shop: Shop; onClick: () => void; tag?: string }) {
  const [g0, g1] = getGradient(shop.shop_name);
  const accent = getAccent(shop.shop_name);
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 px-5 py-3 text-left active:bg-[#0a0a0a] transition-colors duration-150"
    >
      <div className="relative h-[60px] w-[60px] shrink-0 rounded-2xl overflow-hidden">
        {shop.logo_url ? (
          <img src={shop.logo_url} alt={shop.shop_name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center" style={{ background: `linear-gradient(145deg, ${g0}, ${g1})` }}>
            <span className="text-2xl font-extralight" style={{ color: accent, opacity: 0.8 }}>
              {shop.shop_name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[15px] font-light text-[#ededed] truncate">{shop.shop_name}</p>
          {tag && (
            <span className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-light tracking-[0.1em]" style={{ backgroundColor: accent + "20", color: accent }}>
              {tag}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[12px] font-light text-[#555] truncate">{shop.deal_title}</p>
        <p className="mt-0.5 text-[11px] font-light text-[#333]">
          {shop.reward_goal} visits to reward
          {shop.member_count > 0 && (
            <span className="ml-2 text-[#2a2a2a]">· {shop.member_count} member{shop.member_count !== 1 ? "s" : ""}</span>
          )}
        </p>
      </div>
    </button>
  );
}

/* ── Category pill ── */
function Pill({ label, icon: Icon, active, onClick }: { label: string; icon?: any; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-light tracking-[0.04em] transition-all duration-200 ${
        active ? "bg-[#ededed] text-black" : "bg-[#0f0f0f] text-[#555] border border-[#1a1a1a]"
      }`}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </button>
  );
}

/* ── Section header ── */
function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="px-5 mb-4">
      <h2 className="text-[18px] font-light text-[#ededed] tracking-[-0.01em]">{title}</h2>
      {sub && <p className="mt-0.5 text-[12px] font-light text-[#444]">{sub}</p>}
    </div>
  );
}

/* ── Divider ── */
function Divider() {
  return <div className="h-px bg-[#111] mx-5 my-6" />;
}

export default function ExplorePage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/customer/explore")
      .then((r) => r.json())
      .then((d) => setShops(d.shops ?? []))
      .finally(() => setLoading(false));
  }, []);

  const go = (slug: string) => router.push(`/customer/shop/${slug}`);
  const searchActive = query.trim().length > 0;
  const searchResults = searchActive
    ? shops.filter((s) =>
        s.shop_name.toLowerCase().includes(query.toLowerCase()) ||
        s.deal_title.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const filtered = activeCategory === "all"
    ? shops
    : shops.filter((s) => inferCategory(s) === activeCategory || (activeCategory === "deals" && isLimitedDeal(s)));

  const featured = filtered.slice(0, 8);
  const newArrivals = filtered.filter(isNew).slice(0, 6);
  const deals = filtered.filter(isLimitedDeal).slice(0, 5);
  const all = filtered;

  return (
    <div className="flex min-h-full flex-col bg-black">

      {/* Header */}
      <div className="px-5 pt-2 pb-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 20px) + 16px)" }}>
        <p className="text-[13px] font-light text-[#555]">{greeting()}</p>
        <h1 className="mt-0.5 text-[26px] font-extralight tracking-[-0.02em] text-[#ededed] leading-tight">
          Discover rewards<br />near you
        </h1>

        {/* Search */}
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3.5">
          <Search className="h-4 w-4 shrink-0 text-[#333]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stores, deals…"
            className="flex-1 bg-transparent text-[14px] font-light text-[#ededed] outline-none placeholder:text-[#333]"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-[#444] active:text-[#888]">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category pills */}
      {!searchActive && (
        <div className="flex gap-2 overflow-x-auto px-5 pb-5 scrollbar-none">
          {CATEGORIES.map(({ id, label, icon }) => (
            <Pill key={id} label={label} icon={icon} active={activeCategory === id} onClick={() => setActiveCategory(id)} />
          ))}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="px-5 space-y-6">
          <div className="flex gap-3 overflow-hidden">
            {[0, 1, 2].map((i) => (
              <div key={i} className="shrink-0 w-72">
                <div className="skeleton h-40 w-full rounded-3xl" />
              </div>
            ))}
          </div>
          <div className="skeleton h-4 w-24 rounded" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 px-0">
              <div className="skeleton h-[60px] w-[60px] rounded-2xl shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="skeleton h-3.5 w-32 rounded" />
                <div className="skeleton h-3 w-44 rounded" />
                <div className="skeleton h-3 w-20 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search results */}
      {!loading && searchActive && (
        <div className="flex-1 pb-4">
          {searchResults.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center px-8">
              <MapPin className="h-8 w-8 text-[#222]" />
              <p className="mt-4 text-[15px] font-extralight text-[#ededed]">No results for "{query}"</p>
              <p className="mt-1 text-[13px] font-light text-[#444]">Try a different store name or deal</p>
            </div>
          ) : (
            <>
              <p className="px-5 pb-3 text-[12px] font-light text-[#444]">{searchResults.length} result{searchResults.length !== 1 ? "s" : ""}</p>
              <div className="divide-y divide-[#0f0f0f]">
                {searchResults.map((s) => <StoreCard key={s.shop_slug} shop={s} onClick={() => go(s.shop_slug)} />)}
              </div>
            </>
          )}
        </div>
      )}

      {/* Main content */}
      {!loading && !searchActive && (
        <div className="flex-1 pb-8">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center px-8">
              <p className="text-[15px] font-extralight text-[#ededed]">No stores in this category yet</p>
              <button onClick={() => setActiveCategory("all")} className="mt-5 rounded-full border border-[#222] px-6 py-2.5 text-[12px] font-light tracking-[0.15em] text-[#666]">
                SEE ALL STORES
              </button>
            </div>
          ) : (
            <>
              {/* Featured horizontal scroll */}
              {featured.length > 0 && (
                <div className="mb-8">
                  <SectionHeader title="Featured" sub="Top reward programs" />
                  <div className="flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-none">
                    {featured.map((s) => <FeaturedCard key={s.shop_slug} shop={s} onClick={() => go(s.shop_slug)} />)}
                  </div>
                </div>
              )}

              {/* Deals */}
              {deals.length > 0 && (
                <>
                  <Divider />
                  <div className="mb-2">
                    <SectionHeader title="Deals & Offers" sub="Limited-time rewards" />
                    <div className="divide-y divide-[#0f0f0f]">
                      {deals.map((s) => <StoreCard key={s.shop_slug} shop={s} onClick={() => go(s.shop_slug)} tag="DEAL" />)}
                    </div>
                  </div>
                </>
              )}

              {/* New arrivals */}
              {newArrivals.length > 0 && (
                <>
                  <Divider />
                  <div className="mb-2">
                    <SectionHeader title="New on Ventzon" sub="Recently joined" />
                    <div className="flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-none">
                      {newArrivals.map((s) => <FeaturedCard key={s.shop_slug} shop={s} onClick={() => go(s.shop_slug)} />)}
                    </div>
                  </div>
                </>
              )}

              {/* All stores */}
              <Divider />
              <div>
                <SectionHeader title={activeCategory === "all" ? "All Stores" : CATEGORIES.find(c => c.id === activeCategory)?.label ?? "Stores"} sub={`${all.length} store${all.length !== 1 ? "s" : ""} on Ventzon`} />
                <div className="divide-y divide-[#0f0f0f]">
                  {all.map((s) => (
                    <StoreCard
                      key={s.shop_slug}
                      shop={s}
                      onClick={() => go(s.shop_slug)}
                      tag={isNew(s) ? "NEW" : isLimitedDeal(s) ? "DEAL" : undefined}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, ChevronRight, Coffee, ShoppingBag, Utensils, Sparkles, Dumbbell, Tag } from "lucide-react";

type Shop = {
  shop_slug: string;
  shop_name: string;
  deal_title: string;
  deal_details: string | null;
  reward_goal: number;
  logo_url: string | null;
  created_at: string | null;
};

const CATEGORIES = [
  { id: "all", label: "All", icon: null },
  { id: "coffee", label: "Coffee", icon: Coffee },
  { id: "food", label: "Food", icon: Utensils },
  { id: "retail", label: "Retail", icon: ShoppingBag },
  { id: "beauty", label: "Beauty", icon: Sparkles },
  { id: "fitness", label: "Fitness", icon: Dumbbell },
  { id: "deals", label: "Deals", icon: Tag },
];

const GRADIENTS = [
  ["#1a0a2e", "#16213e"],
  ["#0d1f0d", "#0a2e1a"],
  ["#2e0d0d", "#1a0a0a"],
  ["#1a1200", "#2e1f00"],
  ["#0d0d2e", "#0a1a2e"],
  ["#2e0d1a", "#1a0020"],
  ["#002e2e", "#001a1a"],
  ["#1e1000", "#2e2000"],
];

function getGradient(name: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length] as [string, string];
}

function getAccent(name: string): string {
  const accents = ["#7c3aed", "#059669", "#dc2626", "#d97706", "#2563eb", "#db2777", "#0891b2", "#ca8a04"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return accents[Math.abs(hash) % accents.length];
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

function isNew(shop: Shop): boolean {
  if (!shop.created_at) return false;
  const days = (Date.now() - new Date(shop.created_at).getTime()) / (1000 * 60 * 60 * 24);
  return days < 30;
}

function isLimitedDeal(shop: Shop): boolean {
  const text = `${shop.deal_title} ${shop.deal_details ?? ""}`.toLowerCase();
  return /limited|offer|special|promo|discount|free|today|week|deal/.test(text);
}

/* ── Big hero card for horizontal scroll sections ── */
function HeroCard({ shop, onClick }: { shop: Shop; onClick: () => void }) {
  const [grad0, grad1] = getGradient(shop.shop_name);
  const accent = getAccent(shop.shop_name);

  return (
    <button
      onClick={onClick}
      className="shrink-0 w-64 rounded-2xl overflow-hidden text-left active:scale-[0.98] transition-transform duration-150"
      style={{ background: `linear-gradient(135deg, ${grad0}, ${grad1})` }}
    >
      {/* Image or gradient hero */}
      <div className="relative h-36 w-full overflow-hidden">
        {shop.logo_url ? (
          <img src={shop.logo_url} alt={shop.shop_name} className="h-full w-full object-cover" />
        ) : (
          <div
            className="h-full w-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${grad0}, ${grad1})` }}
          >
            <span className="text-5xl font-extralight" style={{ color: accent, opacity: 0.6 }}>
              {shop.shop_name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)" }} />
        {/* Reward badge */}
        <div className="absolute top-2.5 right-2.5 rounded-full px-2 py-0.5" style={{ backgroundColor: accent + "33", border: `1px solid ${accent}55` }}>
          <span className="text-[10px] font-light tracking-[0.1em]" style={{ color: accent }}>
            {shop.reward_goal}x REWARD
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3.5">
        <p className="text-[14px] font-light text-[#ededed] truncate">{shop.shop_name}</p>
        <p className="mt-0.5 text-[12px] font-light text-[#888] truncate">{shop.deal_title}</p>
      </div>
    </button>
  );
}

/* ── Compact row card ── */
function RowCard({ shop, onClick, badge }: { shop: Shop; onClick: () => void; badge?: string }) {
  const [grad0, grad1] = getGradient(shop.shop_name);
  const accent = getAccent(shop.shop_name);

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3.5 rounded-2xl border border-[#111] bg-[#080808] p-3.5 text-left active:bg-[#111] transition-colors duration-150"
    >
      {/* Thumbnail */}
      <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden">
        {shop.logo_url ? (
          <img src={shop.logo_url} alt={shop.shop_name} className="h-full w-full object-cover" />
        ) : (
          <div
            className="h-full w-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${grad0}, ${grad1})` }}
          >
            <span className="text-xl font-extralight" style={{ color: accent, opacity: 0.7 }}>
              {shop.shop_name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[14px] font-light text-[#ededed] truncate">{shop.shop_name}</p>
          {badge && (
            <span className="shrink-0 rounded-full bg-[#1a1a1a] px-1.5 py-0.5 text-[9px] font-light tracking-[0.1em] text-[#666]">
              {badge}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[12px] font-light text-[#555] truncate">{shop.deal_title}</p>
        {shop.deal_details && (
          <p className="mt-0.5 text-[11px] font-light text-[#3a3a3a] truncate">{shop.deal_details}</p>
        )}
      </div>

      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#333]" />
    </button>
  );
}

/* ── Small square card for category grids ── */
function SquareCard({ shop, onClick }: { shop: Shop; onClick: () => void }) {
  const [grad0, grad1] = getGradient(shop.shop_name);
  const accent = getAccent(shop.shop_name);

  return (
    <button
      onClick={onClick}
      className="shrink-0 w-40 rounded-2xl overflow-hidden text-left active:scale-[0.97] transition-transform duration-150"
    >
      <div
        className="h-28 w-full flex items-center justify-center relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${grad0}, ${grad1})` }}
      >
        {shop.logo_url ? (
          <img src={shop.logo_url} alt={shop.shop_name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-4xl font-extralight" style={{ color: accent, opacity: 0.6 }}>
            {shop.shop_name.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)" }} />
      </div>
      <div className="bg-[#080808] px-2.5 py-2">
        <p className="text-[12px] font-light text-[#ededed] truncate">{shop.shop_name}</p>
        <p className="text-[10px] font-light text-[#555] truncate">{shop.deal_title}</p>
      </div>
    </button>
  );
}

/* ── Section wrapper ── */
function Section({
  title,
  subtitle,
  onSeeAll,
  children,
}: {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-end justify-between px-5 mb-3">
        <div>
          <h2 className="text-[17px] font-light text-[#ededed]">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[12px] font-light text-[#555]">{subtitle}</p>}
        </div>
        {onSeeAll && (
          <button onClick={onSeeAll} className="text-[12px] font-light text-[#555] hover:text-[#888] transition-colors">
            See all
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

/* ── Category pill ── */
function CategoryPill({ label, icon: Icon, active, onClick }: { label: string; icon: any; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12px] font-light tracking-[0.05em] transition-all duration-200 ${
        active
          ? "border-[#ededed] bg-[#ededed] text-black"
          : "border-[#1a1a1a] bg-[#080808] text-[#666] hover:border-[#333] hover:text-[#999]"
      }`}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </button>
  );
}

export default function ExplorePage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/customer/explore")
      .then((r) => r.json())
      .then((d) => setShops(d.shops ?? []))
      .finally(() => setLoading(false));
  }, []);

  const go = (slug: string) => router.push(`/customer/shop/${slug}`);

  // Filtered by search
  const searchActive = query.trim().length > 0;
  const searchResults = searchActive
    ? shops.filter((s) =>
        s.shop_name.toLowerCase().includes(query.toLowerCase()) ||
        s.deal_title.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  // Category filter
  const categoryFiltered =
    activeCategory === "all"
      ? shops
      : shops.filter((s) => inferCategory(s) === activeCategory || activeCategory === "deals" && isLimitedDeal(s));

  // Section slices
  const featured = categoryFiltered.slice(0, 6);
  const popular = categoryFiltered.filter((_, i) => i % 3 === 0).slice(0, 5);
  const newShops = categoryFiltered.filter(isNew).slice(0, 8);
  const deals = categoryFiltered.filter(isLimitedDeal).slice(0, 5);
  const recommended = categoryFiltered.filter((_, i) => i % 2 === 1).slice(0, 5);
  const topRated = [...categoryFiltered].sort((a, b) => b.reward_goal - a.reward_goal).slice(0, 5);

  const isEmpty = categoryFiltered.length === 0;

  return (
    <div className="flex min-h-full flex-col bg-black">
      {/* Header */}
      <div className="px-5 pb-4" style={{ paddingTop: 'calc(env(safe-area-inset-top, 20px) + 16px)' }}>
        <h1 className="text-[24px] font-extralight tracking-[-0.02em] text-[#ededed]">Explore</h1>
        <p className="mt-1 text-[13px] font-light text-[#555]">Discover rewards near you</p>

        {/* Search */}
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3.5">
          <Search className="h-4 w-4 shrink-0 text-[#444]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stores or deals…"
            className="flex-1 bg-transparent text-[14px] font-light text-[#ededed] outline-none placeholder:text-[#444]"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-[#444] hover:text-[#888]">
              <span className="text-[18px] font-extralight">×</span>
            </button>
          )}
        </div>
      </div>

      {/* Category pills */}
      {!searchActive && (
        <div className="flex gap-2 overflow-x-auto px-5 pb-4 scrollbar-none" style={{ scrollbarWidth: "none" }}>
          {CATEGORIES.map(({ id, label, icon }) => (
            <CategoryPill
              key={id}
              label={label}
              icon={icon}
              active={activeCategory === id}
              onClick={() => setActiveCategory(id)}
            />
          ))}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="px-5 pb-4 space-y-6">
          {/* Featured skeleton */}
          <div>
            <div className="skeleton h-4 w-24 rounded mb-3" />
            <div className="flex gap-3 overflow-hidden">
              {[0,1,2].map(i => (
                <div key={i} className="shrink-0 w-64">
                  <div className="skeleton h-36 w-full rounded-2xl" />
                  <div className="mt-2 space-y-1.5">
                    <div className="skeleton h-3 w-32 rounded" />
                    <div className="skeleton h-3 w-24 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Row skeleton */}
          <div>
            <div className="skeleton h-4 w-20 rounded mb-3" />
            <div className="space-y-3">
              {[0,1,2].map(i => (
                <div key={i} className="flex gap-3.5 rounded-2xl border border-[#111] bg-[#080808] p-3.5">
                  <div className="skeleton h-16 w-16 shrink-0 rounded-xl" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="skeleton h-3.5 w-28 rounded" />
                    <div className="skeleton h-3 w-36 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search results */}
      {!loading && searchActive && (
        <div className="flex-1 px-5 pb-4 space-y-3">
          {searchResults.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center">
              <MapPin className="h-8 w-8 text-[#333]" />
              <p className="mt-4 text-[14px] font-light text-[#555]">No stores match "{query}"</p>
            </div>
          ) : (
            searchResults.map((s) => <RowCard key={s.shop_slug} shop={s} onClick={() => go(s.shop_slug)} />)
          )}
        </div>
      )}

      {/* Main content */}
      {!loading && !searchActive && (
        <div className="flex-1 pb-6">

          {isEmpty ? (
            <div className="flex flex-col items-center justify-center py-24 text-center px-8">
              <MapPin className="h-8 w-8 text-[#333]" />
              <p className="mt-4 text-[15px] font-extralight text-[#ededed]">No stores in this category yet</p>
              <button
                onClick={() => setActiveCategory("all")}
                className="mt-6 rounded-full border border-[#333] px-6 py-2.5 text-[12px] font-light tracking-[0.15em] text-[#ededed]"
              >
                SEE ALL STORES
              </button>
            </div>
          ) : (
            <>
              {/* Featured near you */}
              {featured.length > 0 && (
                <Section title="Featured near you" subtitle="Top picks in your area">
                  <div className="flex gap-3 overflow-x-auto px-5 pb-1" style={{ scrollbarWidth: "none" }}>
                    {featured.map((s) => <HeroCard key={s.shop_slug} shop={s} onClick={() => go(s.shop_slug)} />)}
                  </div>
                </Section>
              )}

              {/* Popular right now */}
              {popular.length > 0 && (
                <Section title="Popular right now" subtitle="Everyone's checking in">
                  <div className="flex gap-3 overflow-x-auto px-5 pb-1" style={{ scrollbarWidth: "none" }}>
                    {popular.map((s) => <SquareCard key={s.shop_slug} shop={s} onClick={() => go(s.shop_slug)} />)}
                  </div>
                </Section>
              )}

              {/* Deals & limited-time offers */}
              {deals.length > 0 && (
                <Section title="Deals & limited-time offers" subtitle="Don't miss out">
                  <div className="px-5 space-y-2.5">
                    {deals.map((s) => (
                      <RowCard key={s.shop_slug} shop={s} onClick={() => go(s.shop_slug)} badge="DEAL" />
                    ))}
                  </div>
                </Section>
              )}

              {/* Recommended for you */}
              {recommended.length > 0 && (
                <Section title="Recommended for you">
                  <div className="px-5 space-y-2.5">
                    {recommended.map((s) => <RowCard key={s.shop_slug} shop={s} onClick={() => go(s.shop_slug)} />)}
                  </div>
                </Section>
              )}

              {/* Top-rated */}
              {topRated.length > 0 && (
                <Section title="Top-rated" subtitle="Highest reward programs">
                  <div className="flex gap-3 overflow-x-auto px-5 pb-1" style={{ scrollbarWidth: "none" }}>
                    {topRated.map((s) => <SquareCard key={s.shop_slug} shop={s} onClick={() => go(s.shop_slug)} />)}
                  </div>
                </Section>
              )}

              {/* New on the app */}
              {newShops.length > 0 && (
                <Section title="New on the app" subtitle="Just joined Ventzon">
                  <div className="flex gap-3 overflow-x-auto px-5 pb-1" style={{ scrollbarWidth: "none" }}>
                    {newShops.map((s) => (
                      <HeroCard key={s.shop_slug} shop={s} onClick={() => go(s.shop_slug)} />
                    ))}
                  </div>
                </Section>
              )}

              {/* Categories to explore */}
              <Section title="Categories to explore">
                <div className="grid grid-cols-3 gap-3 px-5">
                  {[
                    { id: "coffee", label: "Coffee", icon: "☕" },
                    { id: "food", label: "Food", icon: "🍕" },
                    { id: "retail", label: "Retail", icon: "🛍️" },
                    { id: "beauty", label: "Beauty", icon: "✨" },
                    { id: "fitness", label: "Fitness", icon: "💪" },
                    { id: "deals", label: "Deals", icon: "🏷️" },
                  ].map(({ id, label, icon }) => (
                    <button
                      key={id}
                      onClick={() => { setActiveCategory(id); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-[#111] bg-[#080808] py-5 active:bg-[#111] transition-colors"
                    >
                      <span className="text-2xl">{icon}</span>
                      <span className="text-[11px] font-light tracking-[0.1em] text-[#666]">{label.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              </Section>

              {/* All stores */}
              <Section title="All stores">
                <div className="px-5 space-y-2.5">
                  {categoryFiltered.map((s) => <RowCard key={s.shop_slug} shop={s} onClick={() => go(s.shop_slug)} />)}
                </div>
              </Section>
            </>
          )}
        </div>
      )}
    </div>
  );
}

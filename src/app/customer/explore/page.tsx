"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, MapPin, Coffee, ShoppingBag, Utensils, Sparkles, Dumbbell, Tag } from "lucide-react";
import SocialFeed from "../components/SocialFeed";

type Shop = {
  shop_slug: string;
  shop_name: string;
  deal_title: string;
  deal_details: string | null;
  reward_goal: number;
  logo_url: string | null;
  created_at: string | null;
  latitude: number | null;
  longitude: number | null;
  member_count: number;
};

type Progress = { visits: number; goal: number };

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtMiles(mi: number) {
  return mi < 0.1 ? "nearby" : mi < 10 ? `${mi.toFixed(1)} mi` : `${Math.round(mi)} mi`;
}

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "coffee", label: "Coffee", icon: Coffee },
  { id: "food", label: "Food", icon: Utensils },
  { id: "retail", label: "Retail", icon: ShoppingBag },
  { id: "beauty", label: "Beauty", icon: Sparkles },
  { id: "fitness", label: "Fitness", icon: Dumbbell },
  { id: "deals", label: "Deals", icon: Tag },
];

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
function FeaturedCard({ shop, onClick, progress }: { shop: Shop; onClick: () => void; progress?: Progress }) {
  const remaining = progress ? Math.max(progress.goal - progress.visits, 0) : null;
  return (
    <button
      onClick={onClick}
      className="shrink-0 w-72 rounded-card overflow-hidden text-left bg-surface active:scale-[0.97] transition-transform duration-150"
    >
      <div className="relative h-40 w-full overflow-hidden">
        {shop.logo_url ? (
          <img src={shop.logo_url} alt={shop.shop_name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-surface">
            <span className="text-7xl font-extralight text-muted opacity-40">
              {shop.shop_name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 60%)" }} />
        <div className="absolute bottom-3 left-4 right-4">
          <p className="text-[16px] font-medium text-white leading-tight">{shop.shop_name}</p>
          <p className="mt-0.5 text-[12px] text-white/60 truncate">{shop.deal_title}</p>
        </div>
        {progress && remaining === 0 ? (
          <div className="absolute top-3 right-3 rounded-full bg-gold px-2.5 py-1">
            <span className="text-[10px] font-bold tracking-[0.08em] text-gold-ink">READY</span>
          </div>
        ) : progress && remaining !== null ? (
          <div className="absolute top-3 right-3 rounded-full bg-gold/20 border border-gold/40 px-2.5 py-1">
            <span className="text-[10px] font-semibold tracking-[0.08em] text-gold">
              {remaining} TO GO
            </span>
          </div>
        ) : (
          <div className="absolute top-3 right-3 rounded-full bg-black/50 px-2.5 py-1">
            <span className="text-[10px] font-medium tracking-[0.08em] text-ink/80">
              {shop.reward_goal}× REWARD
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

/* ── Store row card ── */
function StoreCard({ shop, onClick, tag, progress, distanceMi }: {
  shop: Shop; onClick: () => void; tag?: string; progress?: Progress; distanceMi?: number | null;
}) {
  const remaining = progress ? Math.max(progress.goal - progress.visits, 0) : null;
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 px-5 py-3 text-left active:bg-surface transition-colors duration-150"
    >
      <div className="relative h-[60px] w-[60px] shrink-0 rounded-card overflow-hidden">
        {shop.logo_url ? (
          <img src={shop.logo_url} alt={shop.shop_name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-surface border border-line">
            <span className="text-2xl font-extralight text-muted">
              {shop.shop_name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[15px] font-medium text-ink truncate">{shop.shop_name}</p>
          {tag && (
            <span className="shrink-0 rounded-full bg-surface border border-line px-2 py-0.5 text-[9px] font-medium tracking-[0.1em] text-muted">
              {tag}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[12px] font-normal text-muted truncate">{shop.deal_title}</p>
        {progress && remaining !== null && remaining > 0 ? (
          <div className="mt-1 flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {Array.from({ length: Math.min(progress.goal, 8) }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full ${i < progress.visits ? "bg-gold" : "bg-line"}`}
                />
              ))}
            </div>
            <p className="text-[11px] font-normal text-gold">
              {remaining} more visit{remaining === 1 ? "" : "s"} to your reward
            </p>
          </div>
        ) : progress && remaining === 0 ? (
          <p className="mt-1 text-[11px] font-medium text-gold">Reward ready to redeem</p>
        ) : (
          <p className="mt-0.5 text-[11px] font-normal text-muted">
            {shop.reward_goal} visits to reward
            {shop.member_count > 0 && (
              <span className="ml-2 text-muted">· {shop.member_count} member{shop.member_count !== 1 ? "s" : ""}</span>
            )}
          </p>
        )}
        {distanceMi != null && (
          <p className="mt-0.5 text-[11px] font-normal text-muted">
            <MapPin className="mr-1 inline h-2.5 w-2.5 align-[-1px] text-muted" />
            {fmtMiles(distanceMi)}
          </p>
        )}
      </div>
    </button>
  );
}

/* ── Category pill ── */
function Pill({ label, icon: Icon, active, onClick }: { label: string; icon?: any; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-medium tracking-[0.04em] transition-all duration-200 ${
        active ? "bg-ink text-black" : "bg-surface text-muted border border-line"
      }`}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </button>
  );
}

/* ── Deal card — leads with the reward text ── */
function DealCard({ shop, onClick, progress }: { shop: Shop; onClick: () => void; progress?: Progress }) {
  const filledDots = progress ? Math.min(progress.visits, Math.min(shop.reward_goal, 8)) : 0;
  const remaining = progress ? Math.max(progress.goal - progress.visits, 0) : null;
  return (
    <button
      onClick={onClick}
      className="shrink-0 w-52 rounded-card border border-line bg-surface p-4 text-left active:bg-surface transition-colors duration-150"
    >
      {/* Shop identity */}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-7 w-7 shrink-0 rounded-lg overflow-hidden">
          {shop.logo_url ? (
            <img src={shop.logo_url} alt={shop.shop_name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-surface border border-line">
              <span className="text-[11px] font-medium text-muted">
                {shop.shop_name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <p className="text-[12px] font-medium text-muted truncate">{shop.shop_name}</p>
      </div>

      {/* The reward — this is the hero */}
      <p className="text-[20px] font-semibold text-ink leading-tight mb-1">{shop.deal_title}</p>
      {shop.deal_details && (
        <p className="text-[12px] font-normal text-muted line-clamp-2 mb-3">{shop.deal_details}</p>
      )}

      {/* Stamp requirement — filled with the customer's live progress */}
      <div className="flex items-center gap-1.5 mt-auto">
        <div className="flex gap-0.5">
          {Array.from({ length: Math.min(shop.reward_goal, 8) }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${i < filledDots ? "bg-gold" : "bg-line"}`}
            />
          ))}
        </div>
        <p className={`text-[11px] font-normal ${progress && remaining !== null && remaining > 0 ? "text-gold" : "text-muted"}`}>
          {progress && remaining === 0
            ? "ready to redeem"
            : progress && remaining !== null
            ? `${remaining} visit${remaining === 1 ? "" : "s"} to go`
            : `after ${shop.reward_goal} visits`}
        </p>
      </div>
    </button>
  );
}

/* ── Section header ── */
function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="px-5 mb-4">
      <h2 className="text-[18px] font-semibold text-ink tracking-[-0.01em]">{title}</h2>
      {sub && <p className="mt-0.5 text-[12px] font-normal text-muted">{sub}</p>}
    </div>
  );
}

/* ── Divider ── */
function Divider() {
  return <div className="h-px bg-surface mx-5 my-6" />;
}

export default function ExplorePage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, Progress>>({});
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [friendActivity, setFriendActivity] = useState<
    { profile_id: string | null; display_name: string; avatar_url: string | null; shop_slug: string; shop_name: string; created_at: string }[]
  >([]);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  // Two-feed Home: "explore" = social feed, "rewards" = the original
  // discovery experience. Last choice persists across sessions.
  const [homeTab, setHomeTab] = useState<"explore" | "rewards">("rewards");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const t = localStorage.getItem("ventzon_home_tab");
      if (t === "explore" || t === "rewards") setHomeTab(t);
      // Shared profile links land here carrying a referral code — stash it
      // like the shop page does, credited on the first check-in.
      const ref = new URLSearchParams(window.location.search).get("ref");
      if (ref) localStorage.setItem("ventzon_ref", ref);
    } catch {}
  }, []);

  function switchTab(t: "explore" | "rewards") {
    setHomeTab(t);
    try { localStorage.setItem("ventzon_home_tab", t); } catch {}
  }

  useEffect(() => {
    fetch("/api/customer/explore")
      .then((r) => r.json())
      .then((d) => setShops(d.shops ?? []))
      .finally(() => setLoading(false));

    // Live reward progress — signed-out users simply get the default cards.
    fetch("/api/customer/memberships")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.memberships) return;
        const map: Record<string, Progress> = {};
        for (const m of d.memberships) {
          map[m.shop_slug] = { visits: m.visits ?? 0, goal: m.reward_goal ?? 5 };
        }
        setProgressMap(map);
      })
      .catch(() => {});

    // Friends' recent check-ins (creators the user follows) — quiet no-op signed out.
    fetch("/api/customer/friend-activity")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.activity && setFriendActivity(d.activity))
      .catch(() => {});

    // Location is optional — used only to sort "near you", never sent anywhere.
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { timeout: 6000, maximumAge: 300000 }
      );
    }
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
  const popular = [...filtered].sort((a, b) => b.member_count - a.member_count).slice(0, 8);
  const quickWins = [...filtered].sort((a, b) => a.reward_goal - b.reward_goal).slice(0, 8);

  const distanceFor = (s: Shop): number | null =>
    userLoc && s.latitude != null && s.longitude != null
      ? haversineMiles(userLoc.lat, userLoc.lng, s.latitude, s.longitude)
      : null;

  // "Almost there" — cards with progress, closest to the reward first.
  const almostThere = filtered
    .filter((s) => {
      const p = progressMap[s.shop_slug];
      return p && p.visits > 0;
    })
    .sort((a, b) => {
      const ra = Math.max(progressMap[a.shop_slug].goal - progressMap[a.shop_slug].visits, 0);
      const rb = Math.max(progressMap[b.shop_slug].goal - progressMap[b.shop_slug].visits, 0);
      return ra - rb;
    })
    .slice(0, 6);

  // "Near you" — proximity first, nudged up by reward progress so the
  // fastest answer to "where should I go right now" floats to the top.
  const nearYou = userLoc
    ? filtered
        .filter((s) => s.latitude != null && s.longitude != null)
        .map((s) => {
          const dist = distanceFor(s) as number;
          const p = progressMap[s.shop_slug];
          const remaining = p ? Math.max(p.goal - p.visits, 0) : null;
          const boost = remaining === 0 ? 2 : p && p.visits > 0 ? 1 : 0;
          return { shop: s, dist, score: dist - boost };
        })
        .filter((x) => x.dist <= 25)
        .sort((a, b) => a.score - b.score)
        .slice(0, 8)
    : [];

  return (
    <div className="flex min-h-full flex-col bg-black">

      {/* Header — editorial: micro kicker + display title, underline tabs */}
      <div className="px-5 pt-2 pb-0" style={{ paddingTop: "calc(env(safe-area-inset-top, 20px) + 16px)" }}>
        <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted">{greeting()}</p>
        <h1 className="mt-1 font-display text-[28px] font-semibold tracking-[-0.02em] text-ink leading-tight">
          What&rsquo;s good near you
        </h1>
      </div>

      {/* Two-feed tabs */}
      <div className="mx-5 mt-4 flex gap-6 border-b border-line">
        {([
          { id: "explore", label: "Explore" },
          { id: "rewards", label: "Rewards" },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => switchTab(t.id)}
            className={`relative pb-3 pt-1 text-[12px] font-medium tracking-[0.08em] transition-colors duration-200 ${
              homeTab === t.id ? "text-ink" : "text-muted"
            }`}
          >
            {t.label.toUpperCase()}
            {homeTab === t.id && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-ink" />
            )}
          </button>
        ))}
      </div>

      {/* Search — rewards tab only */}
      {homeTab === "rewards" && (
        <div className="mx-5 mt-4 mb-1 flex items-center gap-3 rounded-ctl border border-line bg-surface px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stores, deals…"
            className="flex-1 bg-transparent text-[14px] font-normal text-ink outline-none placeholder:text-muted"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-muted active:text-ink">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
      <div className="pt-4" />

      {/* Explore tab — the social feed */}
      {homeTab === "explore" && <SocialFeed userLoc={userLoc} />}

      {/* Category pills */}
      {homeTab === "rewards" && !searchActive && (
        <div className="flex gap-2 overflow-x-auto px-5 pb-5 scrollbar-none">
          {CATEGORIES.map(({ id, label, icon }) => (
            <Pill key={id} label={label} icon={icon} active={activeCategory === id} onClick={() => setActiveCategory(id)} />
          ))}
        </div>
      )}

      {/* Loading skeleton */}
      {homeTab === "rewards" && loading && (
        <div className="px-5 space-y-6">
          <div className="flex gap-3 overflow-hidden">
            {[0, 1, 2].map((i) => (
              <div key={i} className="shrink-0 w-72">
                <div className="skeleton h-40 w-full rounded-sheet" />
              </div>
            ))}
          </div>
          <div className="skeleton h-4 w-24 rounded" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 px-0">
              <div className="skeleton h-[60px] w-[60px] rounded-card shrink-0" />
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
      {homeTab === "rewards" && !loading && searchActive && (
        <div className="flex-1 pb-4">
          {searchResults.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center px-8">
              <MapPin className="h-8 w-8 text-muted" />
              <p className="mt-4 text-[15px] font-semibold text-ink">No results for "{query}"</p>
              <p className="mt-1 text-[13px] font-normal text-muted">Try a different store name or deal</p>
            </div>
          ) : (
            <>
              <p className="px-5 pb-3 text-[12px] font-normal text-muted">{searchResults.length} result{searchResults.length !== 1 ? "s" : ""}</p>
              <div className="divide-y divide-line/60">
                {searchResults.map((s) => (
                  <StoreCard key={s.shop_slug} shop={s} progress={progressMap[s.shop_slug]} distanceMi={distanceFor(s)} onClick={() => go(s.shop_slug)} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Main content — the original discovery experience (Rewards tab) */}
      {homeTab === "rewards" && !loading && !searchActive && (
        <div className="flex-1 pb-8">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center px-8">
              <p className="text-[15px] font-semibold text-ink">No stores in this category yet</p>
              <button onClick={() => setActiveCategory("all")} className="mt-5 rounded-full border border-line px-6 py-2.5 text-[12px] font-normal tracking-[0.15em] text-muted">
                SEE ALL STORES
              </button>
            </div>
          ) : (
            <>
              {/* Almost there — your progress, closest reward first */}
              {almostThere.length > 0 && (
                <div className="mb-8">
                  <SectionHeader title="Almost there" sub="You're close to these rewards" />
                  <div className="divide-y divide-line/60">
                    {almostThere.map((s) => (
                      <StoreCard
                        key={s.shop_slug}
                        shop={s}
                        progress={progressMap[s.shop_slug]}
                        distanceMi={distanceFor(s)}
                        onClick={() => go(s.shop_slug)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Friends' recent check-ins — creators you follow */}
              {friendActivity.length > 0 && (
                <>
                  {almostThere.length > 0 && <Divider />}
                  <div className="mb-8">
                    <SectionHeader title="Friends were here" sub="Recent check-ins from creators you follow" />
                    <div className="flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-none">
                      {friendActivity.slice(0, 10).map((a, i) => (
                        <button
                          key={`${a.profile_id}-${a.created_at}-${i}`}
                          onClick={() => router.push(`/customer/shop/${a.shop_slug}`)}
                          className="flex shrink-0 items-center gap-3 rounded-card border border-line bg-surface px-4 py-3 text-left active:bg-surface"
                        >
                          {a.avatar_url ? (
                            <img src={a.avatar_url} alt={a.display_name} className="h-9 w-9 shrink-0 rounded-full object-cover" />
                          ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface">
                              <span className="text-[13px] font-medium text-muted">{a.display_name.charAt(0).toUpperCase()}</span>
                            </div>
                          )}
                          <div>
                            <p className="text-[13px] font-medium text-ink whitespace-nowrap">{a.display_name}</p>
                            <p className="text-[11px] font-normal text-muted whitespace-nowrap">
                              checked in at {a.shop_name}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Near you — the fastest answer to "where do I go right now" */}
              {nearYou.length > 0 && (
                <>
                  {almostThere.length > 0 && <Divider />}
                  <div className="mb-8">
                    <SectionHeader title="Near you" sub="Closest rewards first" />
                    <div className="divide-y divide-line/60">
                      {nearYou.map(({ shop: s, dist }) => (
                        <StoreCard
                          key={s.shop_slug}
                          shop={s}
                          progress={progressMap[s.shop_slug]}
                          distanceMi={dist}
                          onClick={() => go(s.shop_slug)}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {(almostThere.length > 0 || nearYou.length > 0) && <Divider />}

              {/* Featured horizontal scroll */}
              {featured.length > 0 && (
                <div className="mb-8">
                  <SectionHeader title="Featured" sub="Top reward programs" />
                  <div className="flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-none">
                    {featured.map((s) => <FeaturedCard key={s.shop_slug} shop={s} progress={progressMap[s.shop_slug]} onClick={() => go(s.shop_slug)} />)}
                  </div>
                </div>
              )}

              {/* Today's Deals — explicit reward showcase */}
              {filtered.length > 0 && (
                <>
                  <Divider />
                  <div className="mb-8">
                    <SectionHeader title="What you'll earn" sub="The actual rewards on offer" />
                    <div className="flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-none">
                      {filtered.map((s) => <DealCard key={s.shop_slug} shop={s} progress={progressMap[s.shop_slug]} onClick={() => go(s.shop_slug)} />)}
                    </div>
                  </div>
                </>
              )}

              {/* Popular */}
              {popular.length > 0 && (
                <>
                  <Divider />
                  <div className="mb-8">
                    <SectionHeader title="Popular" sub="Most members on Ventzon" />
                    <div className="flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-none">
                      {popular.map((s) => <FeaturedCard key={s.shop_slug} shop={s} progress={progressMap[s.shop_slug]} onClick={() => go(s.shop_slug)} />)}
                    </div>
                  </div>
                </>
              )}

              {/* Quick Wins */}
              {quickWins.length > 0 && (
                <>
                  <Divider />
                  <div className="mb-8">
                    <SectionHeader title="Quick wins" sub="Earn a reward in fewer visits" />
                    <div className="flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-none">
                      {quickWins.map((s) => <FeaturedCard key={s.shop_slug} shop={s} progress={progressMap[s.shop_slug]} onClick={() => go(s.shop_slug)} />)}
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
                      {newArrivals.map((s) => <FeaturedCard key={s.shop_slug} shop={s} progress={progressMap[s.shop_slug]} onClick={() => go(s.shop_slug)} />)}
                    </div>
                  </div>
                </>
              )}

            </>
          )}
        </div>
      )}
    </div>
  );
}

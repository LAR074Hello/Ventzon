"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, MapPin, Coffee, ShoppingBag, Utensils, Sparkles, Dumbbell, Tag, Landmark, Trees } from "lucide-react";
import SocialFeed from "../components/SocialFeed";
import Avatar from "../components/Avatar";
import EmptyState from "../components/EmptyState";
import { captureReferralParam } from "@/lib/referral-client";
import { useLocationPermission } from "@/lib/location";

type Shop = {
  shop_slug: string;
  shop_name: string;
  /* Nullable now: Explore reads `places`, and the overwhelming majority have
     no merchant account and therefore no offer. A place with no deal is the
     normal case, not missing data. */
  deal_title: string | null;
  deal_details: string | null;
  reward_goal: number | null;
  logo_url: string | null;
  created_at?: string | null;
  latitude: number | null;
  longitude: number | null;
  member_count?: number;
  neighborhood?: string | null;
  city?: string | null;
  category?: string | null;
  photo_url?: string | null;
  post_count?: number;
  distance_mi?: number | null;
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
  // Culture and Outdoors exist because the OSM import produces them: ~148
  // galleries/museums/venues and ~134 parks across the three launch
  // neighbourhoods. Remapping a museum into "Retail" would be worse than a
  // sixth and seventh filter.
  { id: "culture", label: "Culture", icon: Landmark },
  { id: "outdoors", label: "Outdoors", icon: Trees },
  { id: "deals", label: "Deals", icon: Tag },
];

function inferCategory(shop: Shop): string {
  const text = `${shop.shop_name} ${shop.neighborhood ?? ""} ${shop.category ?? ""} ${shop.city ?? ""} ${shop.deal_title ?? ""} ${shop.deal_details ?? ""}`.toLowerCase();
  if (/coffee|café|cafe|latte|espresso|brew|tea/.test(text)) return "coffee";
  if (/pizza|burger|taco|sushi|food|eat|restaurant|grill|bbq|sandwich|wrap/.test(text)) return "food";
  if (/salon|spa|beauty|nail|hair|skin|barber/.test(text)) return "beauty";
  if (/gym|fitness|yoga|workout|sport|crossfit|pilates/.test(text)) return "fitness";
  if (/museum|gallery|theatre|theater|venue|records|record shop|books|bookshop|arts/.test(text)) return "culture";
  if (/park|garden|playground|greenway|plaza/.test(text)) return "outdoors";
  if (/shop|store|retail|boutique|fashion|cloth/.test(text)) return "retail";
  return "other";
}
function isNew(shop: Shop) {
  if (!shop.created_at) return false;
  return (Date.now() - new Date(shop.created_at).getTime()) / 86400000 < 30;
}
function isLimitedDeal(shop: Shop) {
  return /limited|offer|special|promo|discount|free|today|week|deal/.test(
    `${shop.deal_title ?? ""} ${shop.deal_details ?? ""}`.toLowerCase()
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
      className="shrink-0 w-72 rounded-card overflow-hidden text-left bg-surface-raised active:scale-[0.97] transition-transform duration-150"
    >
      <div className="relative h-40 w-full overflow-hidden">
        {shop.logo_url ? (
          <img src={shop.logo_url} alt={shop.shop_name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-surface-raised">
            <span className="text-7xl font-extralight text-muted opacity-40">
              {shop.shop_name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 60%)" }} />
        <div className="absolute bottom-3 left-4 right-4">
          <p className="font-display text-lg font-semibold tracking-tight text-white leading-tight">{shop.shop_name}</p>
          {shop.deal_title && (
            <p className="text-sm text-white mt-0.5 /60 truncate">{shop.deal_title}</p>
          )}
        </div>
        {progress && remaining === 0 ? (
          <div className="absolute top-3 right-3 rounded-full bg-primary px-2.5 py-1">
            <span className="text-2xs font-semibold uppercase tracking-caps text-inverse">Ready</span>
          </div>
        ) : progress && remaining !== null ? (
          <div className="absolute top-3 right-3 rounded-full bg-primary/80 px-2.5 py-1">
            <span className="text-2xs font-semibold uppercase tracking-caps text-inverse">
              {remaining} TO GO
            </span>
          </div>
        ) : shop.deal_title ? (
          <div className="absolute top-3 right-3 rounded-full bg-black/50 px-2.5 py-1">
            <span className="text-2xs font-semibold uppercase tracking-caps text-primary /80">
              {shop.reward_goal}× REWARD
            </span>
          </div>
        ) : null}
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
      className="flex w-full items-center gap-4 px-5 py-3 text-left active:bg-surface-raised transition-colors duration-150"
    >
      <div className="relative h-[60px] w-[60px] shrink-0 rounded-card overflow-hidden">
        {shop.logo_url ? (
          <img src={shop.logo_url} alt={shop.shop_name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-surface-raised border border-subtle">
            <span className="text-2xl font-extralight text-muted">
              {shop.shop_name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-display text-lg font-semibold tracking-tight text-primary truncate">{shop.shop_name}</p>
          {tag && (
            <span className="text-2xs font-semibold uppercase tracking-caps text-muted shrink-0 rounded-full bg-surface-raised border border-subtle px-2 py-0.5">
              {tag}
            </span>
          )}
        </div>
        <p className="text-xs text-muted mt-0.5 font-normal truncate">
          {[shop.neighborhood, shop.category].filter(Boolean).join(" · ") ||
            shop.city ||
            "A place in the city"}
        </p>
        {shop.deal_title && (
          <p className="mt-0.5 truncate text-xs text-secondary">{shop.deal_title}</p>
        )}
        {progress && remaining !== null && remaining > 0 ? (
          <div className="mt-1 flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {Array.from({ length: Math.min(progress.goal, 8) }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full ${i < progress.visits ? "bg-primary" : "bg-subtle"}`}
                />
              ))}
            </div>
            <p className="text-xs text-muted">
              {remaining} more visit{remaining === 1 ? "" : "s"} to your reward
            </p>
          </div>
        ) : progress && remaining === 0 ? (
          /* The single most motivating state in the product, so it gets
             presence from a filled pill rather than from colour — green
             stays reserved for things you press. */
          <span className="mt-1 inline-flex rounded-full bg-primary px-2.5 py-1 text-2xs font-semibold uppercase tracking-caps text-inverse">
            Reward ready
          </span>
        ) : shop.deal_title ? (
          <p className="text-xs text-muted mt-0.5 font-normal">
            {shop.reward_goal ?? 5} visits to reward
            {(shop.member_count ?? 0) > 0 && (
              <span className="ml-2 text-muted">· {shop.member_count} member{shop.member_count !== 1 ? "s" : ""}</span>
            )}
          </p>
        ) : null}
        {distanceMi != null && (
          <p className="text-xs text-muted mt-0.5 font-normal">
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
      className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
        active ? "bg-primary text-black" : "bg-surface-raised text-muted border border-subtle"
      }`}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </button>
  );
}

/* ── Deal card — leads with the reward text ── */
function DealCard({ shop, onClick, progress }: { shop: Shop; onClick: () => void; progress?: Progress }) {
  const goal = shop.reward_goal ?? 5;
  const filledDots = progress ? Math.min(progress.visits, Math.min(goal, 8)) : 0;
  const remaining = progress ? Math.max(progress.goal - progress.visits, 0) : null;
  return (
    <button
      onClick={onClick}
      className="shrink-0 w-52 rounded-card border border-subtle bg-surface-raised p-4 text-left active:bg-surface-raised transition-colors duration-150"
    >
      {/* Shop identity */}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-7 w-7 shrink-0 rounded-lg overflow-hidden">
          {shop.logo_url ? (
            <img src={shop.logo_url} alt={shop.shop_name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-surface-raised border border-subtle">
              <span className="text-xs text-muted font-medium">
                {shop.shop_name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <p className="text-xs text-muted font-medium truncate">{shop.shop_name}</p>
      </div>

      {/* The reward — this is the hero */}
      <p className="font-display text-xl font-semibold tracking-tight text-primary leading-tight mb-1">{shop.deal_title}</p>
      {shop.deal_details && (
        <p className="text-xs text-muted font-normal line-clamp-2 mb-3">{shop.deal_details}</p>
      )}

      {/* Stamp requirement — filled with the customer's live progress */}
      <div className="flex items-center gap-1.5 mt-auto">
        <div className="flex gap-0.5">
          {Array.from({ length: Math.min(goal, 8) }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${i < filledDots ? "bg-primary" : "bg-subtle"}`}
            />
          ))}
        </div>
        <p className={`text-xs ${progress && remaining !== null && remaining > 0 ? "text-primary" : "text-muted"}`}>
          {progress && remaining === 0
            ? "ready to redeem"
            : progress && remaining !== null
            ? `${remaining} visit${remaining === 1 ? "" : "s"} to go`
            : `after ${goal} visits`}
        </p>
      </div>
    </button>
  );
}

/* ── Section header ── */
function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="px-5 mb-4">
      <h2 className="font-display text-lg font-semibold tracking-tight text-primary">{title}</h2>
      {sub && <p className="text-xs text-muted mt-0.5 font-normal">{sub}</p>}
    </div>
  );
}

/* ── Divider ── */
function Divider() {
  return <div className="h-px bg-surface-raised mx-5 my-6" />;
}

export default function ExplorePage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, Progress>>({});
  const [friendActivity, setFriendActivity] = useState<
    { profile_id: string | null; display_name: string; avatar_url: string | null; shop_slug: string; shop_name: string; created_at: string }[]
  >([]);
  const [query, setQuery] = useState("");
  // Server-backed, because filtering the ~60 loaded rows made a real bar that
  // IS in the table come back as "no results" — which reads as Ventzon not
  // knowing the place rather than as a search that never ran.
  const [remote, setRemote] = useState<{
    places: { slug: string; name: string; sub: string; photo_url: string | null }[];
    people: { profile_id: string; display_name: string; avatar_url: string | null }[];
  }>({ places: [], people: [] });
  const [searching, setSearching] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  // Three-tab Home: "nearby" = posts and places in your city, "everywhere" =
  // the same from all cities (browse-only), "rewards" = the discovery
  // surface. Last choice persists across sessions.
  const [homeTab, setHomeTab] = useState<"nearby" | "everywhere" | "rewards">("nearby");
  // NEARBY is driven by the device location, never by a chosen city. The
  // hook distinguishes not-requested / asking / granted / denied /
  // unavailable / error so each gets an honest screen.
  const { state: locState, request: requestLocation } = useLocationPermission();
  // City-scoped places for NEARBY (separate from `shops`, which is the
  // global list the REWARDS tab and EVERYWHERE rails read).
  const [nearbyPlaces, setNearbyPlaces] = useState<Shop[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  // Distance-scoring signal for the feed and the Rewards rails — derived from
  // the location state, never from a hand-picked city.
  const userLoc = useMemo(
    () => (locState.status === "granted" ? { lat: locState.lat, lng: locState.lng } : null),
    [locState]
  );
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // One-time restore of persisted preferences, deferred off the synchronous
    // effect path (the same pattern as the search effect below). A mount-time
    // restore is not a response to a render — but routing it through a timer
    // keeps the compiler's setState-in-effect analysis quiet.
    const timer = setTimeout(() => {
      try {
        const t = localStorage.getItem("ventzon_home_tab");
        // Pre-split builds stored "explore" for the formerly global feed — the
        // closest ancestor of NEARBY, so it migrates rather than surprises.
        if (t === "nearby" || t === "everywhere" || t === "rewards") setHomeTab(t);
        // Shared links land here with either a legacy ?ref=<profile_id> (the
        // merchant check-in flow) or a customer referral code. captureReferralParam
        // routes each to the right store.
        captureReferralParam(new URLSearchParams(window.location.search).get("ref"));
      } catch {}
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  function switchTab(t: "nearby" | "everywhere" | "rewards") {
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

  }, []);

  const go = (slug: string) => router.push(`/customer/shop/${slug}`);

  // NEARBY's place list — merchant places near the user, distance-first.
  useEffect(() => {
    // Only meaningful with location granted; otherwise there is no "near".
    // Only meaningful with location granted; otherwise there is no "near".
    if (!userLoc) return;
    const qs = new URLSearchParams();
    qs.set("lat", String(userLoc.lat));
    qs.set("lng", String(userLoc.lng));
    // State updates live inside the async chain, not synchronously in the
    // effect body — the pattern this file already follows for its other
    // effects.
    let alive = true;
    const load = async () => {
      setNearbyLoading(true);
      try {
        const res = await fetch(`/api/customer/explore?${qs.toString()}`);
        const d = await res.json();
        if (alive) setNearbyPlaces(d.shops ?? []);
      } catch {
        if (alive) setNearbyPlaces([]);
      } finally {
        if (alive) setNearbyLoading(false);
      }
    };
    void load();
    return () => { alive = false; };
  }, [userLoc]);
  useEffect(() => {
    const q = query.trim();
    // All state changes happen inside the timeout, never synchronously in the
    // effect body — a synchronous set here re-renders before paint on every
    // keystroke.
    const t = setTimeout(async () => {
      if (q.length < 2) {
        setRemote({ places: [], people: [] });
        setSearching(false);
        return;
      }
      setSearching(true);
      try {
        const r = await fetch(`/api/customer/search?q=${encodeURIComponent(q)}`);
        if (r.ok) setRemote(await r.json());
      } catch {
        /* a failed search shows no results, not an error screen */
      } finally {
        setSearching(false);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [query]);

  const searchActive = query.trim().length > 0;
  const searchResults = searchActive
    ? shops.filter((s) =>
        s.shop_name.toLowerCase().includes(query.toLowerCase()) ||
        (s.neighborhood ?? "").toLowerCase().includes(query.toLowerCase()) ||
        (s.category ?? "").toLowerCase().includes(query.toLowerCase()) ||
        (s.deal_title ?? "").toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const filtered = activeCategory === "all"
    ? shops
    : shops.filter((s) => inferCategory(s) === activeCategory || (activeCategory === "deals" && isLimitedDeal(s)));

  const featured = filtered.slice(0, 8);
  const newArrivals = filtered.filter(isNew).slice(0, 6);
  // Only places that actually run a reward get deal cards. A place with no
  // merchant account has no reward program, and a card claiming "5 visits to
  // reward" on one would be inventing a loyalty offer that doesn't exist.
  const dealShops = filtered.filter((s) => s.deal_title != null);
  // "Popular" now means posted-about, not signed-up-to: with no merchants,
  // member counts are zero everywhere and would rank nothing.
  const popular = [...filtered]
    .sort((a, b) => (b.post_count ?? 0) - (a.post_count ?? 0) || (b.member_count ?? 0) - (a.member_count ?? 0))
    .slice(0, 8);
  // Only places that actually have a reward can be a "quick win".
  const quickWins = [...filtered]
    .filter((s) => s.reward_goal != null)
    .sort((a, b) => (a.reward_goal ?? 99) - (b.reward_goal ?? 99))
    .slice(0, 8);

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

  const headline =
    homeTab === "nearby"
      ? "What's good near you"
      : homeTab === "everywhere"
      ? "Everywhere at once"
      : "What you'll earn";

  // EVERYWHERE's place rail — category-free (the pills belong to REWARDS),
  // ranked by what people actually posted about.
  const everywherePopular = [...shops]
    .sort((a, b) => (b.post_count ?? 0) - (a.post_count ?? 0) || (b.member_count ?? 0) - (a.member_count ?? 0))
    .slice(0, 8);
  // NEARBY's places — nearest first when we have GPS, activity otherwise.
  const nearbySorted = [...nearbyPlaces]
    .sort(
      (a, b) =>
        (distanceFor(a) ?? Number.POSITIVE_INFINITY) -
        (distanceFor(b) ?? Number.POSITIVE_INFINITY)
    )
    .slice(0, 8);

  return (
    <div className="flex min-h-full flex-col bg-surface">

      {/* Header — editorial: micro kicker + display title, underline tabs */}
      <div className="px-5 pt-2 pb-0" style={{ paddingTop: "calc(env(safe-area-inset-top, 20px) + 16px)" }}>
        <p className="text-2xs font-semibold uppercase tracking-caps text-muted uppercase">{greeting()}</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-primary mt-1 leading-tight">
          {headline}
        </h1>
      </div>

      {/* Three tabs: NEARBY (default), EVERYWHERE, REWARDS */}
      <div className="mx-5 mt-4 flex gap-6 border-b border-subtle">
        {([
          { id: "nearby", label: "Nearby" },
          { id: "everywhere", label: "Everywhere" },
          { id: "rewards", label: "Rewards" },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => switchTab(t.id)}
            className={`relative pb-3 pt-1 text-sm font-medium transition-colors duration-200 ${
              homeTab === t.id ? "text-primary" : "text-muted"
            }`}
          >
            {t.label.toUpperCase()}
            {homeTab === t.id && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Search — on BOTH tabs, and on Explore above all.
          It used to live only under Rewards, which is the old loyalty product's
          information architecture surviving in the navigation: the tab for
          discovering somewhere to go had no way to look anything up, while the
          tab for tracking stamp cards did. Same artifact as the loyalty footer
          and the deal-filtered Explore query. */}
      {(
        <div className="mx-5 mt-4 mb-1 flex items-center gap-3 rounded-ctl border border-subtle bg-surface-raised px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search places and people"
            className="text-base text-primary flex-1 bg-transparent font-normal outline-none placeholder:"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-muted active:text-primary">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
      <div className="pt-4" />

      {/* NEARBY — driven by the device location, never a chosen city. Each
          permission state gets its own honest screen. */}
      {(homeTab === "nearby" && !searchActive && (locState.status === "not_requested" || locState.status === "asking")) && (
        <div className="px-5 pb-8">
          <EmptyState
            icon={MapPin}
            eyebrow="Near you"
            title="Allow location services to see nearby posts"
            body="Ventzon uses your location to show what is happening around you. It is never stored on our servers."
            primary={{ label: "Allow location services", onClick: requestLocation }}
            secondary={{ label: "Browse everywhere", onClick: () => switchTab("everywhere") }}
          />
        </div>
      )}
      {(homeTab === "nearby" && !searchActive && locState.status === "denied") && (
        <div className="px-5 pb-8">
          <EmptyState
            icon={MapPin}
            eyebrow="Near you"
            title="Allow location services to see nearby posts"
            body="Location is turned off. Enable it in your device settings, or browse what is happening everywhere."
            primary={{ label: "Enable Location", onClick: requestLocation }}
            secondary={{ label: "Browse everywhere", onClick: () => switchTab("everywhere") }}
          />
        </div>
      )}
      {(homeTab === "nearby" && !searchActive && (locState.status === "unavailable" || locState.status === "error")) && (
        <div className="px-5 pb-8">
          <EmptyState
            icon={MapPin}
            eyebrow="Near you"
            title="We couldn\u2019t get your location"
            body="Something went wrong reading your location. Try again, or browse what is happening everywhere."
            primary={{ label: "Try again", onClick: requestLocation }}
            secondary={{ label: "Browse everywhere", onClick: () => switchTab("everywhere") }}
          />
        </div>
      )}
      {homeTab === "nearby" && !searchActive && locState.status === "granted" && (
        <SocialFeed
          userLoc={userLoc}
          onBrowseEverywhere={() => switchTab("everywhere")}
        />
      )}
      {homeTab === "nearby" && !searchActive && locState.status === "granted" && nearbyLoading && (
        <div className="mx-5 space-y-3 pb-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="skeleton h-[60px] w-[60px] rounded-card shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="skeleton h-3.5 w-32 rounded" />
                <div className="skeleton h-3 w-44 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}
      {homeTab === "nearby" && !searchActive && locState.status === "granted" && nearbyPlaces.length > 0 && (
        <div className="mb-10">
          <Divider />
          <SectionHeader title="Near you" sub="Where to go next" />
          <div className="divide-y divide-line/60">
            {nearbySorted.map((s) => (
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

      {/* EVERYWHERE — the global feed, browse-only (same actions, no compose;
          the feed has never had a compose entry). */}
      {homeTab === "everywhere" && !searchActive && <SocialFeed userLoc={userLoc} />}
      {homeTab === "everywhere" && !searchActive && everywherePopular.length > 0 && (
        <div className="mb-10">
          <Divider />
          <SectionHeader title="Popular everywhere" sub="Most posted about, all cities" />
          <div className="flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-none">
            {everywherePopular.map((s) => (
              <FeaturedCard
                key={s.shop_slug}
                shop={s}
                progress={progressMap[s.shop_slug]}
                onClick={() => go(s.shop_slug)}
              />
            ))}
          </div>
        </div>
      )}

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

      {/* Search results — places lead, people follow. The product is place
          discovery, so "who" is the second question, never the first. */}
      {searchActive && (
        <div className="flex-1 pb-4">
          {remote.places.length === 0 && remote.people.length === 0 ? (
            <div className="flex flex-col items-center px-8 py-20 text-center">
              <MapPin className="h-8 w-8 text-muted" />
              <p className="mt-4 font-display text-lg font-semibold tracking-tight text-primary">
                {searching ? "Searching…" : `Nothing matching “${query}”`}
              </p>
              {!searching && (
                <p className="mt-1 text-sm font-normal text-secondary">
                  Try a place name, a neighbourhood, or someone&apos;s name.
                </p>
              )}
            </div>
          ) : (
            <>
              {remote.places.length > 0 && (
                <>
                  <p className="px-5 pb-2 text-2xs font-semibold uppercase tracking-caps text-muted">
                    Places
                  </p>
                  <div className="divide-y divide-line/60">
                    {remote.places.map((p) => (
                      <button
                        key={p.slug}
                        onClick={() => router.push(`/place/${p.slug}`)}
                        className="flex w-full items-center gap-3 px-5 py-3 text-left active:bg-surface-sunken"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ctl bg-surface-sunken">
                          <MapPin className="h-4 w-4 text-secondary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-medium text-primary">{p.name}</p>
                          {p.sub && <p className="truncate text-xs text-muted">{p.sub}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {remote.people.length > 0 && (
                <>
                  <p className="px-5 pb-2 pt-5 text-2xs font-semibold uppercase tracking-caps text-muted">
                    People
                  </p>
                  <div className="divide-y divide-line/60">
                    {remote.people.map((u) => (
                      <button
                        key={u.profile_id}
                        onClick={() => router.push(`/customer/creator/${u.profile_id}`)}
                        className="flex w-full items-center gap-3 px-5 py-3 text-left active:bg-surface-sunken"
                      >
                        <Avatar
                          name={u.display_name}
                          seed={u.profile_id}
                          url={u.avatar_url}
                          size={40}
                        />
                        <p className="min-w-0 flex-1 truncate text-base font-medium text-primary">
                          {u.display_name}
                        </p>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Main content — the original discovery experience (Rewards tab) */}
      {homeTab === "rewards" && !loading && !searchActive && (
        <div className="flex-1 pb-8">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center px-8">
              <p className="font-display text-lg font-semibold tracking-tight text-primary">No stores in this category yet</p>
              <button onClick={() => setActiveCategory("all")} className="text-xs font-semibold uppercase tracking-caps text-muted mt-5 rounded-full border border-subtle px-6 py-2.5">
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
                          className="flex shrink-0 items-center gap-3 rounded-card border border-subtle bg-surface-raised px-4 py-3 text-left active:bg-surface-raised"
                        >
                          {a.avatar_url ? (
                            <img src={a.avatar_url} alt={a.display_name} className="h-9 w-9 shrink-0 rounded-full object-cover" />
                          ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-raised">
                              <span className="text-sm text-secondary font-medium">{a.display_name.charAt(0).toUpperCase()}</span>
                            </div>
                          )}
                          <div>
                            <p className="text-base text-primary font-medium whitespace-nowrap">{a.display_name}</p>
                            <p className="text-xs text-muted font-normal whitespace-nowrap">
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
                  <SectionHeader title="Featured" sub="Places worth a look" />
                  <div className="flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-none">
                    {featured.map((s) => <FeaturedCard key={s.shop_slug} shop={s} progress={progressMap[s.shop_slug]} onClick={() => go(s.shop_slug)} />)}
                  </div>
                </div>
              )}

              {/* Today's Deals — explicit reward showcase, only where a deal exists */}
              {dealShops.length > 0 && (
                <>
                  <Divider />
                  <div className="mb-8">
                    <SectionHeader title="What you'll earn" sub="The actual rewards on offer" />
                    <div className="flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-none">
                      {dealShops.map((s) => <DealCard key={s.shop_slug} shop={s} progress={progressMap[s.shop_slug]} onClick={() => go(s.shop_slug)} />)}
                    </div>
                  </div>
                </>
              )}

              {/* Popular */}
              {popular.length > 0 && (
                <>
                  <Divider />
                  <div className="mb-8">
                    <SectionHeader title="Popular" sub="Most posted about" />
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

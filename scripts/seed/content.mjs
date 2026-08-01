/**
 * The demo city — CONTENT ONLY.
 *
 * Deliberately free of any database concern: no table names, no column
 * names, no client. Slice 1.3 turns businesses into places and will rewrite
 * the insert layer wholesale; this file should survive that untouched.
 *
 * Everything is deterministic (seeded PRNG, fixed base date) so two runs
 * produce identical content and screenshots can be compared across runs.
 */

// ── deterministic randomness ────────────────────────────────────────
let _s = 0x2f6e2b1;
export function rnd() {
  _s ^= _s << 13; _s ^= _s >>> 17; _s ^= _s << 5; _s >>>= 0;
  return _s / 0xffffffff;
}
export function resetRnd(seed = 0x2f6e2b1) { _s = seed; }
const pick = (a) => a[Math.floor(rnd() * a.length)];
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

/** Fixed "now" so relative times are stable between runs. */
export const BASE_DATE = new Date("2026-07-25T18:00:00Z");
export const daysAgo = (n) => new Date(BASE_DATE.getTime() - n * 86400e3);
export const hoursAgo = (n) => new Date(BASE_DATE.getTime() - n * 3600e3);

/**
 * The demo metro is New York — East Village / Lower East Side, Williamsburg,
 * and Hoboken. Moved off Pittsburgh 2026-07-28: the friends test targets the
 * NYC metro (NJ / NYC / CT), and seeding the real target means the map, the
 * neighbourhood labels and the imported-place fixtures all sit in one
 * coherent place.
 *
 * THE BUSINESS NAMES BELOW ARE INVENTED AND MUST STAY THAT WAY. This seed is
 * DEV-ONLY, permanently — fabricated businesses must never reach real users.
 * Real places come from the OSM import, which carries real businesses that
 * actually exist. See design-notes.md.
 */
export const CITY = { name: "New York", state: "NY" };
// Between the East Village and the Lower East Side. The jitter below is sized
// to reach Hoboken to the west and Williamsburg to the east.
const CITY_CENTRE = { lat: 40.7250, lng: -73.9900 };

export const NEIGHBOURHOODS = [
  "East Village", "Lower East Side", "Williamsburg", "Hoboken",
];

/** Local fixture images, served by the app itself — no external host. */
export const MEDIA = [
  "/dev-fixtures/feed-cafe.jpg",
  "/dev-fixtures/feed-bakery.jpg",
  "/dev-fixtures/grid-1.jpg",
  "/dev-fixtures/grid-2.jpg",
  "/dev-fixtures/grid-3.jpg",
  "/dev-fixtures/grid-4.jpg",
  "/dev-fixtures/grid-5.jpg",
];

/** 30 places. Category drives the reward wording so copy reads plausibly. */
export const PLACES = [
  ["Cafe Mercado", "Coffee", "East Village", "Free drink", 10],
  ["Bao Down", "Food", "Lower East Side", "Free bao", 5],
  ["Bloom & Co", "Retail", "Williamsburg", "10% off stems", 6],
  ["The Reading Room", "Retail", "Hoboken", "Free paperback", 8],
  ["Kettle & Crumb", "Coffee", "Williamsburg", "Free pastry", 7],
  ["Corner & Co Grocers", "Retail", "East Village", "10% off a shop", 9],
  ["Fade Room", "Beauty", "Lower East Side", "Free line-up", 6],
  ["Salt & Char", "Food", "Hoboken", "Free side", 5],
  ["Perch Coffee", "Coffee", "Lower East Side", "Free filter", 10],
  ["Dandelion Nails", "Beauty", "Williamsburg", "Free file & polish", 6],
  ["Iron Gate Gym", "Fitness", "East Village", "Free class", 12],
  ["The Pressing Room", "Retail", "Hoboken", "Free print", 8],
  ["Noodle Parade", "Food", "East Village", "Free starter", 5],
  ["Sunday Best", "Retail", "Williamsburg", "15% off", 7],
  ["Halcyon Yoga", "Fitness", "Lower East Side", "Free drop-in", 10],
  ["The Cure Deli", "Food", "Hoboken", "Free coffee with lunch", 6],
  ["Tin Whistle Bar", "Food", "East Village", "Free snack", 8],
  ["Camellia Tea", "Coffee", "Williamsburg", "Free pot", 9],
  ["Crosstown Bikes", "Retail", "Hoboken", "Free tune-up", 10],
  ["Sable Barbers", "Beauty", "Lower East Side", "Free hot towel", 6],
  ["Pome & Seed", "Retail", "East Village", "Free bunch", 7],
  ["Rye & Ember Bakery", "Food", "Williamsburg", "Free loaf", 8],
  ["Alder Kitchen", "Food", "Lower East Side", "Free dessert", 6],
  ["The Wash House", "Retail", "Hoboken", "Free service wash", 10],
  ["Ridgeline Outfitters", "Retail", "Williamsburg", "10% off", 9],
  // Deliberately left UNCLAIMED below — see UNCLAIMED_SLUGS.
  ["Moth & Moon", "Retail", "East Village", "Free candle", 8],
  ["Copper Pot", "Food", "Hoboken", "Free side", 5],
  ["Still Water Spa", "Beauty", "Williamsburg", "Free add-on", 12],
  ["The Green Door", "Coffee", "Lower East Side", "Free refill", 7],
  ["Larkspur Records", "Retail", "East Village", "Free 7-inch", 10],
];

/**
 * Places that must render as UNCLAIMED even though they were seeded from a
 * merchant. Covers the "shop exists but nobody has claimed the place" state
 * that the place page and map both have to handle.
 */
export const UNCLAIMED_SLUGS = new Set(["moth-moon"]);

/**
 * Imported-place fixtures: unclaimed, no photos, OSM provenance. This is what
 * an OSM import actually produces, and the first two are the state the
 * "no one's posted here yet — be the first" invitation exists for. Kept in the
 * seed rather than inserted by hand so `dev:reset` reproduces exactly the
 * database that gets reviewed.
 *
 * `seedPosts` marks the two that DO carry activity. They are separate fixtures
 * on purpose: the empty ones must stay empty or the invitation state has
 * nowhere to be reviewed, and an imported place with posts is the only way to
 * see a verified-visit badge where there is no merchant account at all — the
 * case Slice 1.9 exists for.
 */
export const IMPORTED_PLACES = [
  {
    slug: "orchard-street-coffee",
    name: "Orchard Street Coffee",
    address: "88 Orchard St",
    neighborhood: "Lower East Side",
    city: "New York",
    category: "Coffee",
    lat: 40.7185,
    lng: -73.9895,
  },
  {
    slug: "grand-street-hardware",
    name: "Grand Street Hardware",
    address: "412 Grand St",
    neighborhood: "Williamsburg",
    city: "New York",
    category: "Retail",
    lat: 40.7118,
    lng: -73.9600,
  },
  {
    slug: "delancey-bagels",
    name: "Delancey Bagels",
    address: "155 Delancey St",
    neighborhood: "Lower East Side",
    city: "New York",
    category: "Food",
    lat: 40.7181,
    lng: -73.9852,
    seedPosts: 3,
  },
  {
    slug: "bedford-cycle-works",
    name: "Bedford Cycle Works",
    address: "230 Bedford Ave",
    neighborhood: "Williamsburg",
    city: "New York",
    category: "Retail",
    lat: 40.7167,
    lng: -73.9578,
    seedPosts: 2,
  },
];

/** 15 people. postCount is set explicitly for the two sparse/dense cases. */
export const PEOPLE = [
  { name: "Mara Ellison",   creator: true,  postCount: 60, bio: "Looking for the good corner table. Coffee, mostly." },
  { name: "Devon Park",     creator: true,  postCount: 24, bio: "Eating my way down one street at a time." },
  { name: "Ilse Bergman",   creator: true,  postCount: 18, bio: "Filter coffee and quiet rooms." },
  { name: "Ray Okonkwo",    creator: true,  postCount: 16, bio: "42 places and counting." },
  { name: "Nadia Haddad",   creator: true,  postCount: 14, bio: "Neighbourhood scout." },
  { name: "Tom Alvarez",    creator: true,  postCount: 12, bio: "Bread, mainly." },
  { name: "Priya Raman",    creator: true,  postCount: 11, bio: "Runs early, eats late." },
  { name: "Joss Whitlock",  creator: true,  postCount: 9,  bio: null },
  { name: "Beatrix Ng",     creator: true,  postCount: 8,  bio: "Ceramics and tea." },
  { name: "Callum Reid",    creator: false, postCount: 6,  bio: null },
  { name: "Sofia Marchetti",creator: true,  postCount: 5,  bio: "Here for the pastries." },
  { name: "Kwame Boateng",  creator: false, postCount: 4,  bio: null },
  { name: "Anouk Lefevre",  creator: true,  postCount: 3,  bio: "New in town." },
  { name: "Hana Sato",      creator: false, postCount: 2,  bio: null },
  { name: "Miles Turner",   creator: false, postCount: 0,  bio: null },
];

const OPENERS = [
  "Corner table by the window",
  "Third time this month",
  "Finally got here before the queue",
  "Rainy afternoon, empty room",
  "Came for one thing, left with three",
  "The good hour, just after opening",
  "Walked past this for a year",
  "Back again, obviously",
  "Quietest table in the place",
  "Sunday, slow start",
];
const MIDDLES = [
  "and the oat flat white is still the best on this street.",
  "and they still open up themselves most days.",
  "and the seasonal one never makes it onto the menu board.",
  "and nobody rushed me for two hours.",
  "and the owner remembered my order.",
  "and it is somehow cheaper than the chain round the corner.",
  "and the light in here at four is worth the walk.",
  "and I have thoughts about the sourdough.",
  "and the playlist was, unexpectedly, perfect.",
  "and I will be back on Thursday.",
];
const TAILS = [
  "Ask for the jam.",
  "Go before ten.",
  "Sit at the back.",
  "Bring cash.",
  "Worth the detour.",
  "",
  "",
  "",
];

export function caption() {
  const t = pick(TAILS);
  return `${pick(OPENERS)}, ${pick(MIDDLES)}${t ? " " + t : ""}`;
}

const COMMENTS = [
  "This is my Sunday spot.",
  "Been meaning to try this one.",
  "The pastries are the whole point.",
  "Agreed on the corner table.",
  "How busy is it on a weekday?",
  "Adding to my list.",
  "The owner is lovely.",
  "Best in the neighbourhood, easily.",
  "Went yesterday on your recommendation — good call.",
  "Is it dog friendly?",
];
export const comment = () => pick(COMMENTS);

/** A handful of items that should appear reported / hidden. */
export const FLAGGED_REASONS = ["spam", "harassment", "inappropriate", "other"];

/**
 * The whole city, resolved. Returns plain objects with no storage concerns.
 * `postCount` totals 192; two more posts are added for the flagged cases so
 * the feed has reported content to render.
 */
export function buildCity() {
  resetRnd();

  const people = PEOPLE.map((p, i) => ({
    ...p,
    email: `${p.name.toLowerCase().replace(/[^a-z]+/g, ".")}@ventzon.test`,
    handle: p.name.toLowerCase().replace(/[^a-z]+/g, ""),
    avatarSeed: i,
  }));

  const places = PLACES.map(([name, category, hood, reward, goal], i) => ({
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    category,
    neighbourhood: hood,
    rewardTitle: reward,
    rewardGoal: goal,
    // A spread of programme shapes so merchant-facing states vary.
    rewardMode: i % 7 === 0 ? "points" : "stamps",
    pointsPerVisit: 10,
    // Rough coordinates around the demo city centre.
    lat: CITY_CENTRE.lat + (rnd() - 0.5) * 0.06,
    lng: CITY_CENTRE.lng + (rnd() - 0.5) * 0.09,
    address: `${int(10, 890)} ${pick(["Penn", "Liberty", "Butler", "Ellsworth", "Negley", "Carson"])} ${pick(["St", "Ave", "Row", "Way"])}`,
    // Three tiers of maturity, standing in for verification_tier until 1.5.
    claimed: i % 3 !== 0,
    subscribed: i % 5 === 0,
  }));

  // Posts, distributed by each person's postCount.
  const posts = [];
  let n = 0;
  for (const person of people) {
    for (let k = 0; k < person.postCount; k++) {
      const place = places[int(0, places.length - 1)];
      const hasMedia = rnd() > 0.18;
      posts.push({
        key: `p${n++}`,
        authorEmail: person.email,
        placeSlug: place.slug,
        body: caption(),
        mediaUrl: hasMedia ? MEDIA[int(0, MEDIA.length - 1)] : null,
        mediaType: hasMedia ? "image" : null,
        createdAt: hoursAgo(int(1, 24 * 45)),
        likes: int(0, 60),
        commentBodies: Array.from({ length: int(0, 5) }, () => comment()),
        hidden: false,
        flagged: false,
        // Roughly two in five carry a verified visit. Deliberately a mix: the
        // badge only reads as a signal if the feed also shows posts without
        // it, and a feed where everything is verified says nothing.
        verifiedVisit: rnd() < 0.4,
      });
    }
  }

  // Posts at imported places — no merchant account, therefore no membership
  // and no shop_slug. Before Slice 1.9 a check-in could not exist here at all,
  // so this is the only place the badge's new lane can be reviewed.
  for (const place of IMPORTED_PLACES.filter((p) => p.seedPosts)) {
    for (let k = 0; k < place.seedPosts; k++) {
      const person = people[int(0, people.length - 1)];
      posts.push({
        key: `imported${n++}`,
        authorEmail: person.email,
        placeSlug: place.slug,
        imported: true,
        body: caption(),
        mediaUrl: MEDIA[int(0, MEDIA.length - 1)],
        mediaType: "image",
        createdAt: hoursAgo(int(1, 24 * 12)),
        likes: int(0, 18),
        commentBodies: Array.from({ length: int(0, 2) }, () => comment()),
        hidden: false,
        flagged: false,
        // First post at each imported place is verified, the rest are not —
        // both states, side by side, on the same place page.
        verifiedVisit: k === 0,
      });
    }
  }

  // A few reported items, one of them hidden pending review.
  for (let i = 0; i < 3; i++) {
    const person = people[int(0, people.length - 1)];
    const place = places[int(0, places.length - 1)];
    posts.push({
      key: `flag${i}`,
      authorEmail: person.email,
      placeSlug: place.slug,
      body: "BUY FOLLOWERS CHEAP >>> click my profile link, limited offer today only",
      mediaUrl: null,
      mediaType: null,
      createdAt: hoursAgo(int(2, 72)),
      likes: 0,
      commentBodies: [],
      hidden: i === 0,
      flagged: true,
      verifiedVisit: false,
      flagReason: FLAGGED_REASONS[i % FLAGGED_REASONS.length],
    });
  }

  // Memberships: who is a customer of what, with varied reward progress.
  const memberships = [];
  for (const person of people) {
    const count = int(2, 9);
    const chosen = new Set();
    while (chosen.size < count) chosen.add(int(0, places.length - 1));
    for (const idx of chosen) {
      const place = places[idx];
      const roll = rnd();
      // Deliberate spread: fresh, mid, one-away, and ready-to-redeem.
      const visits =
        roll < 0.2 ? 0 :
        roll < 0.55 ? int(1, Math.max(1, place.rewardGoal - 2)) :
        roll < 0.8 ? place.rewardGoal - 1 :
        place.rewardGoal;
      memberships.push({
        email: person.email,
        placeSlug: place.slug,
        visits,
        rewardReady: visits >= place.rewardGoal,
        // Distinct days so the per-day unique index is respected.
        checkinDays: Array.from({ length: Math.min(visits, 20) }, (_, k) => k + 1),
      });
    }
  }

  // Follows: people follow people, and people follow places.
  const userFollows = [];
  for (const a of people) {
    for (const b of people) {
      if (a.email !== b.email && rnd() < 0.22) {
        userFollows.push({ follower: a.email, followee: b.email });
      }
    }
  }
  const placeFollows = [];
  for (const person of people) {
    for (const place of places) {
      if (rnd() < 0.12) placeFollows.push({ email: person.email, placeSlug: place.slug });
    }
  }

  // Notifications for the Activity tab, some unread.
  const NOTIF_TYPES = ["drop", "reward_expiry", "new_nearby", "new_follower", "post_like", "post_comment"];
  const notifications = [];
  for (const person of people.slice(0, 8)) {
    for (let i = 0; i < int(2, 7); i++) {
      notifications.push({
        email: person.email,
        type: NOTIF_TYPES[int(0, NOTIF_TYPES.length - 1)],
        placeSlug: places[int(0, places.length - 1)].slug,
        refId: `seed-${person.handle}-${i}`,
        sentAt: hoursAgo(int(1, 24 * 14)),
        read: rnd() > 0.45,
      });
    }
  }

  return { city: CITY, places, people, posts, memberships, userFollows, placeFollows, notifications };
}

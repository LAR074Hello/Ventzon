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

export const CITY = { name: "San Vicente", state: "CA" };

export const NEIGHBOURHOODS = [
  "Mission Flats", "Old Harbour", "Cedar Hill", "The Annex",
  "Riverside", "Printworks", "North Gate", "Lantern Row",
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
  ["Cafe Mercado", "Coffee", "Mission Flats", "Free drink", 10],
  ["Bao Down", "Food", "Old Harbour", "Free bao", 5],
  ["Bloom & Co", "Retail", "Cedar Hill", "10% off stems", 6],
  ["The Reading Room", "Retail", "The Annex", "Free paperback", 8],
  ["Kettle & Crumb", "Coffee", "Riverside", "Free pastry", 7],
  ["Govans Groceries", "Retail", "Printworks", "10% off a shop", 9],
  ["Fade Room", "Beauty", "North Gate", "Free line-up", 6],
  ["Salt & Char", "Food", "Lantern Row", "Free side", 5],
  ["Perch Coffee", "Coffee", "Mission Flats", "Free filter", 10],
  ["Dandelion Nails", "Beauty", "Cedar Hill", "Free file & polish", 6],
  ["Iron Gate Gym", "Fitness", "Old Harbour", "Free class", 12],
  ["The Pressing Room", "Retail", "Printworks", "Free print", 8],
  ["Noodle Parade", "Food", "The Annex", "Free starter", 5],
  ["Sunday Best", "Retail", "Lantern Row", "15% off", 7],
  ["Halcyon Yoga", "Fitness", "Riverside", "Free drop-in", 10],
  ["The Cure Deli", "Food", "North Gate", "Free coffee with lunch", 6],
  ["Tin Whistle Bar", "Food", "Old Harbour", "Free snack", 8],
  ["Camellia Tea", "Coffee", "Cedar Hill", "Free pot", 9],
  ["Two Rivers Bikes", "Retail", "Riverside", "Free tune-up", 10],
  ["Sable Barbers", "Beauty", "Mission Flats", "Free hot towel", 6],
  ["Pome & Seed", "Retail", "The Annex", "Free bunch", 7],
  ["Ferry Building Bakery", "Food", "Old Harbour", "Free loaf", 8],
  ["Alder Kitchen", "Food", "Printworks", "Free dessert", 6],
  ["The Wash House", "Retail", "North Gate", "Free service wash", 10],
  ["Ridgeline Outfitters", "Retail", "Cedar Hill", "10% off", 9],
  ["Moth & Moon", "Retail", "Lantern Row", "Free candle", 8],
  ["Copper Pot", "Food", "Mission Flats", "Free side", 5],
  ["Still Water Spa", "Beauty", "Riverside", "Free add-on", 12],
  ["The Green Door", "Coffee", "The Annex", "Free refill", 7],
  ["Larkspur Records", "Retail", "Printworks", "Free 7-inch", 10],
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
    lat: 37.7749 + (rnd() - 0.5) * 0.08,
    lng: -122.4194 + (rnd() - 0.5) * 0.08,
    address: `${int(10, 890)} ${pick(["Alder", "Cedar", "Harbour", "Mission", "Lantern", "River"])} ${pick(["St", "Ave", "Row", "Way"])}`,
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

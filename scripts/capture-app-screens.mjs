#!/usr/bin/env node
/**
 * Capture the five marketing app screens against a seeded, signed-in dev
 * server, so they show succeeding states instead of auth walls / empty states.
 *
 *   node scripts/capture-app-screens.mjs
 *
 * Targets (written to .screenshots/recapture/, gitignored):
 *   app-explore.png  — /customer/explore, NEARBY: the Places in New York
 *                     directory (a discovery view — deliberately not the feed)
 *   app-feed.png     — /customer/explore, EVERYWHERE tab (the global feed)
 *   app-checkin.png  — fresh check-in landed (The Pressing Room, falling back
 *                     to another mid-progress shop once today's check-in is in)
 *   app-post.png     — /customer/profile?compose=1, place + photo + caption
 *   app-join.png     — /join/the-pressing-room, the public join screen
 *
 * Reuses shot.mjs' login machinery: signs in through Supabase with a seeded
 * @ventzon.test account and injects the session via @supabase/ssr cookies.
 *
 * Viewport is 390x823 @2x (= 780x1646) — the exact 9:19 frame the marketing
 * site draws in DeviceFrame, so object-cover object-top does not crop.
 *
 * Programmatic checks gate each capture; a nonzero exit means one failed.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { loadEnv, projectRefFrom } from "./dev-guard.mjs";

const EMAIL = "mara.ellison@ventzon.test";
const PASSWORD = "ventzon-dev-password";
const SHOP = "the-pressing-room";
const SHOP_NAME = "The Pressing Room";
// The composer attaches a plate-of-food photo (grid-2.jpg), so the tagged
// place must be a food venue to keep the pair coherent.
const POST_SHOP = "the-cure-deli";
const BASE = "http://localhost:3000";
const OUT = path.join(".screenshots", "recapture");
const VIEWPORT = { width: 390, height: 823 };

const env = { ...loadEnv(), ...process.env };
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});
const { data, error } = await sb.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
if (error) {
  console.error(`sign-in failed: ${error.message}`);
  process.exit(1);
}
const session = data.session;
const storageKey = `sb-${projectRefFrom(env.NEXT_PUBLIC_SUPABASE_URL)}-auth-token`;
console.log(`  signed in as ${EMAIL}`);

/**
 * The app uses @supabase/ssr's createBrowserClient, which keeps the session in
 * cookies. Same encoding/chunking as shot.mjs.
 */
function sessionCookies(sess, key, base) {
  const encoded = "base64-" + Buffer.from(JSON.stringify(sess)).toString("base64");
  const CHUNK = 3180;
  const host = new URL(base).hostname;
  const common = { domain: host, path: "/", httpOnly: false, secure: false, sameSite: "Lax" };
  if (encoded.length <= CHUNK) return [{ name: key, value: encoded, ...common }];
  const out = [];
  for (let i = 0, n = 0; i < encoded.length; i += CHUNK, n++) {
    out.push({ name: `${key}.${n}`, value: encoded.slice(i, i + CHUNK), ...common });
  }
  return out;
}

let failures = 0;
function check(name, ok, detail = "") {
  const mark = ok ? "PASS" : "FAIL";
  if (!ok) failures++;
  console.log(`  [${mark}] ${name}${detail ? ` — ${detail}` : ""}`);
}

// Run a subset of targets, e.g. CAPTURE_ONLY=explore node scripts/capture-app-screens.mjs
const ONLY = (process.env.CAPTURE_ONLY || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const wants = (t) => ONLY.length === 0 || ONLY.includes(t);

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: VIEWPORT,
  deviceScaleFactor: 2,
  colorScheme: "dark",
});

// Pre-paint preferences: dark theme (matching the marketing site), onboarding
// dismissed, city pinned to New York, the auth session mirroring the injected
// cookies, and a style rule that hides the Next dev overlay on EVERY document
// (a page-level addStyleTag is wiped by each goto, which is why the dev "N"
// showed up in all five captures before).
await context.addInitScript(
  ([key, sess]) => {
    try {
      localStorage.setItem("ventzon_theme", "dark");
      localStorage.setItem("ventzon_onboarded_v1", "1");
      localStorage.setItem("ventzon_city", "New York");
      sessionStorage.setItem("ventzon_banner_dismissed", "1");
      if (key && sess) localStorage.setItem(key, JSON.stringify(sess));
    } catch {}
    const s = document.createElement("style");
    s.textContent =
      "nextjs-portal,nextjs-dev-indicator,[data-nextjs-toast],#__next-build-watcher{display:none!important}";
    (document.head || document.documentElement).appendChild(s);
  },
  [storageKey, session]
);
if (session) await context.addCookies(sessionCookies(session, storageKey, BASE));

const page = await context.newPage();
// Belt and braces — this one only survives until the first navigation.
await page.addStyleTag({
  content: "nextjs-portal,[data-nextjs-toast],#__next-build-watcher{display:none!important}",
});

/** Remove any dev overlay elements from the current document (fixed-position,
 *  so they would otherwise bake into captures on top of the app UI). */
async function stripDevOverlays() {
  await page.evaluate(() => {
    document
      .querySelectorAll("nextjs-portal,[data-nextjs-toast],#__next-build-watcher")
      .forEach((el) => el.remove());
  });
}

/** Remove moderation-test spam cards from the CAPTURE PATH only. The posts
 *  stay in the product and the DB — they are deliberate fixtures for the
 *  report/moderation flow. A marketing screenshot simply must not lead with
 *  "BUY FOLLOWERS CHEAP". */
async function stripSpam() {
  await page.evaluate(() => {
    for (let i = 0; i < 10; i++) {
      const leaves = [...document.querySelectorAll("div")]
        .filter((d) => /buy followers/i.test(d.textContent || ""))
        .sort((a, b) => (a.textContent || "").length - (b.textContent || "").length);
      if (leaves.length === 0) break;
      // The spam body sits OUTSIDE the media envelope (a sibling), so walk up
      // to the nearest ancestor that contains the envelope — the post card.
      let card = leaves[0];
      while (card && card !== document.body) {
        if (card.querySelector?.('[class*="elevation-1"]')) break;
        card = card.parentElement;
      }
      (card && card !== document.body ? card : leaves[0]).remove();
    }
  });
}

function isDark() {
  return page.evaluate(() => document.documentElement.dataset.theme === "dark");
}

async function settle() {
  await page.waitForLoadState("networkidle", { timeout: 6000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready);
}

async function goto(url) {
  await page.goto(url, { waitUntil: "load", timeout: 45000 });
  await settle();
}

/** Feed post cards in the DOM + how many media images have decoded. */
async function feedStats() {
  return page.evaluate(() => {
    const feeds = [...document.querySelectorAll("div")].filter(
      (d) => d.className.includes("max-w-[510px]") && d.className.includes("space-y-7")
    );
    const f = feeds[0];
    if (!f) return { cards: 0, loaded: 0 };
    const cards = [...f.querySelectorAll("div")].filter(
      (d) =>
        d.className.includes("elevation-1") &&
        d.className.includes("rounded-card") &&
        d.querySelector("img")
    ).length;
    const loaded = [...f.querySelectorAll("img")].filter(
      (i) => i.complete && i.naturalWidth > 0
    ).length;
    return { cards, loaded };
  });
}

/** True once the feed has rendered at least `min` post cards. */
function feedRendered(min) {
  return page.waitForFunction(
    (n) => {
      const feeds = [...document.querySelectorAll("div")].filter(
        (d) => d.className.includes("max-w-[510px]") && d.className.includes("space-y-7")
      );
      const f = feeds[0];
      if (!f) return false;
      return (
        [...f.querySelectorAll("div")].filter(
          (d) =>
            d.className.includes("elevation-1") &&
            d.className.includes("rounded-card") &&
            d.querySelector("img")
        ).length >= n
      );
    },
    min,
    { timeout: 20000 }
  ).catch(() => {});
}

/* ── 1. EXPLORE — /customer/explore, NEARBY: the Places directory ───────── */
if (wants("explore")) {
console.log("\n== app-explore.png (NEARBY, New York — Places directory) ==");
await goto(`${BASE}/customer/explore`);
check("explore: signed in (not bounced to auth)", !page.url().includes("/customer/auth"), page.url());
await page.waitForFunction(
  () => document.body.textContent?.includes("New York"),
  { timeout: 20000 }
).catch(() => {});
await feedRendered(2);
// Strip the moderation-test spam card FIRST — removing it collapses ~650px of
// feed above the directory, so a scroll computed before the strip lands the
// frame mid-row. Strip, then scroll to the section header.
await stripSpam();
await stripDevOverlays();
// Let images/fonts and the nearby-places fetch settle BEFORE positioning —
// a wait after the scroll lets late content (e.g. the feed's next page) shove
// the heading off the top and leave a sliced row in frame.
await page.waitForTimeout(700);
// The NEARBY feed posts sit above the directory. Scroll the "Places in New
// York" section to the top of the frame (below the dynamic-island band) so
// this shot reads as discovery, not as a second copy of the feed.
const alignToDirectory = () =>
  page.evaluate(() => {
    const headings = [...document.querySelectorAll("h2")].filter((h) =>
      /Places in New York/.test(h.textContent || "")
    );
    const h = headings[0];
    if (h) {
      const top = h.getBoundingClientRect().top + window.scrollY - 56;
      window.scrollTo({ top: Math.max(0, top), behavior: "auto" });
    }
  });
await alignToDirectory();
// The first scroll brings the lazy media just below the fold into view, which
// grows the feed ABOVE the heading (~76px) and drifts it off 56. Let that
// settle, then re-align so the frame lands on a clean row boundary.
await page.waitForTimeout(450);
await alignToDirectory();
check("explore: city chip shows New York", (await page.getByText("New York", { exact: false }).count()) > 0);
check("explore: Places directory in frame", (await page.getByText("Places in New York", { exact: false }).count()) > 0);
const storeRows = await page.evaluate(
  () =>
    [...document.querySelectorAll("button")].filter((b) =>
      b.className.includes("flex w-full items-center gap-4")
    ).length
);
check("explore: place rows visible", storeRows >= 3, `${storeRows} store row(s)`);
// Guard the composition: the section heading must sit at the top of the frame
// (not scrolled past into a sliced row) — the regression this section had.
const exploreHeadingTop = await page.evaluate(() => {
  const h = [...document.querySelectorAll("h2")].find((el) =>
    /Places in New York/.test(el.textContent || "")
  );
  return h ? Math.round(h.getBoundingClientRect().top) : null;
});
check("explore: section heading at frame top", exploreHeadingTop !== null && exploreHeadingTop >= 0 && exploreHeadingTop < 100, `heading top=${exploreHeadingTop}`);
check("explore: dark theme", await isDark());
check(
  "explore: no dev overlay",
  await page.evaluate(() => document.querySelectorAll("nextjs-portal,[data-nextjs-toast]").length === 0)
);
await page.screenshot({ path: path.join(OUT, "app-explore.png") });
console.log("  wrote app-explore.png");
}

/* ── 2. FEED — /customer/explore, EVERYWHERE tab ───────────────────────── */
if (wants("feed")) {
console.log("\n== app-feed.png (EVERYWHERE) ==");
await page.getByRole("button", { name: "EVERYWHERE", exact: true }).click();
// Tab switches change content in place, so the window may still be scrolled
// down at the directory — bring the feed top into view first.
await page.evaluate(() => window.scrollTo(0, 0));
await feedRendered(2);
await stripSpam();
await stripDevOverlays();
await page.waitForTimeout(700);
check("feed: EVERYWHERE tab active", (await page.getByRole("button", { name: "EVERYWHERE", exact: true }).count()) === 1);
check(
  "feed: Popular everywhere section",
  (await page.getByText("Popular everywhere", { exact: false }).count()) > 0
);
const feed = await feedStats();
check("feed: posts visible", feed.cards >= 2, `${feed.cards} post card(s), ${feed.loaded} media loaded`);
// The first VISIBLE card must be a genuine post, never the spam fixture.
const topCard = await page.evaluate(() => {
  const feeds = [...document.querySelectorAll("div")].filter(
    (d) => d.className.includes("max-w-[510px]") && d.className.includes("space-y-7")
  );
  const f = feeds[0];
  if (!f) return null;
  const envelope = [...f.querySelectorAll("div")].find(
    (d) => d.className.includes("elevation-1") && d.className.includes("rounded-card")
  );
  if (!envelope) return null;
  // The media envelope is inside the post card; its parent is the full card
  // (header + envelope + caption), so the text read includes the place name.
  const card = envelope.parentElement ?? envelope;
  const rect = card.getBoundingClientRect();
  return {
    top: Math.round(rect.top),
    text: (card.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80),
    media: envelope.querySelector("img")?.getAttribute("src") ?? null,
  };
});
check(
  "feed: first visible card is genuine",
  Boolean(topCard) && !/buy followers/i.test(topCard.text ?? "") && (topCard.top ?? -1) < 300 && !!topCard.media,
  topCard?.text ?? "no card"
);
check("feed: dark theme", await isDark());
check(
  "feed: no dev overlay",
  await page.evaluate(() => document.querySelectorAll("nextjs-portal,[data-nextjs-toast]").length === 0)
);
await page.screenshot({ path: path.join(OUT, "app-feed.png") });
console.log("  wrote app-feed.png");
}

/* ── 3. CHECK-IN — land a fresh check-in on a mid-progress membership ──── */
if (wants("checkin")) {
// The Pressing Room is the approved target (6/8). A successful run leaves
// today's check-in in the dev DB, so the fallbacks keep the script
// re-runnable: the first shop whose CHECK IN HERE button is live wins.
const CHECKIN_SHOPS = [
  { slug: "the-pressing-room", name: "The Pressing Room" },
  { slug: "crosstown-bikes", name: "Crosstown Bikes" },
  { slug: "the-cure-deli", name: "The Cure Deli" },
  { slug: "moth-moon", name: "Moth & Moon" },
];
let checkin = null;
let checkinProgress = null;
for (const candidate of CHECKIN_SHOPS) {
  await goto(`${BASE}/customer/shop/${candidate.slug}`);
  const btn = page.getByRole("button", { name: /CHECK IN HERE/i });
  try {
    await btn.waitFor({ timeout: 3500 });
  } catch {
    // Already checked in today at this shop — try the next one.
    continue;
  }
  // Keep the shot mid-progress: skip a shop where this check-in would COMPLETE
  // the reward (visits+1 >= goal), so the landed state still shows room to grow.
  const progress = await page.evaluate(() => {
    const cards = [...document.querySelectorAll("div.rounded-card")];
    const card = cards.find((c) => c.textContent?.includes("YOUR PROGRESS"));
    const m = card?.textContent?.match(/(\d+)\s*\/\s*(\d+)/);
    return m ? { visits: Number(m[1]), goal: Number(m[2]) } : null;
  });
  if (!progress || progress.visits + 1 >= progress.goal) continue;
  checkin = candidate;
  checkinProgress = progress;
  break;
}
if (!checkin) {
  check("checkin: found a mid-progress shop with a live CHECK IN HERE", false, "no candidate is both mid-progress and unchecked today");
} else {
  console.log(`\n== app-checkin.png (just landed at ${checkin.name}) ==`);
  const { visits: visitsBefore, goal } = checkinProgress;
  check("checkin: mid-progress card (not checked in today)", visitsBefore > 0 && visitsBefore < goal, `${visitsBefore}/${goal}`);
  await page.getByRole("button", { name: /CHECK IN HERE/i }).click();
  // Full-screen "Checked in" overlay — wait until it is actually painted
  // (it fades in over ~500ms and auto-dismisses after ~2.8s).
  await page.waitForSelector('h2:text-is("Checked in")', { state: "visible", timeout: 10000 });
  const overlay = await page.evaluate(() => {
    const t = document.body.textContent || "";
    const o = t.match(/(\d+) of (\d+) visit/);
    return o ? `${o[1]}/${o[2]}` : null;
  });
  check("checkin: overlay landed", Boolean(overlay), overlay ?? "no overlay text");
  check("checkin: progress advanced by one", overlay === `${visitsBefore + 1}/${goal}`, `${overlay} vs ${visitsBefore + 1}/${goal}`);
  // Captured exactly as the product renders it — no zoom, no DOM scaling.
  await stripDevOverlays();
  check("checkin: dark theme", await isDark());
  await page.screenshot({ path: path.join(OUT, "app-checkin.png") });
  console.log("  wrote app-checkin.png");
}
}

/* ── 4. POST — compose with a place, a photo, and a caption ────────────── */
if (wants("post")) {
console.log("\n== app-post.png (composer with photo) ==");
await goto(`${BASE}/customer/profile?compose=1`);
check("post: signed in (not bounced to auth)", !page.url().includes("/customer/auth"), page.url());
const composerTextarea = page.locator("textarea").first();
await composerTextarea.waitFor({ timeout: 20000 });
check("post: composer open", true);
const placeSelect = page.locator("select");
await placeSelect.waitFor({ timeout: 15000 });
await placeSelect.selectOption(POST_SHOP);
check("post: place selected", (await placeSelect.inputValue()) === POST_SHOP, await placeSelect.inputValue());
const caption = "The Cure Deli never misses — Saturday special, seat by the window, worth the walk.";
await composerTextarea.fill(caption);
check("post: caption typed", (await composerTextarea.inputValue()).length >= 20);

// Attach a real photo that MATCHES the place: The Cure Deli is food, and
// grid-2.jpg is a plate of food (seaside-toast) — coherent, not stock-adjacent.
const abs = new URL("/dev-fixtures/grid-2.jpg", BASE).href;
const res = await fetch(abs);
const tmp = "/tmp/ventzon-post-photo.jpg";
writeFileSync(tmp, Buffer.from(await res.arrayBuffer()));
await page.setInputFiles('input[accept="image/*,video/*"]', tmp);
await page.waitForSelector('img[src^="blob:"]', { timeout: 10000 });
check("post: photo preview shown", (await page.locator('img[src^="blob:"]').count()) > 0);

// Hide the media-limits hint line — form chrome the review flagged as clutter,
// sitting at the card's bottom edge in this composition.
await page.evaluate(() => {
  const t = [...document.querySelectorAll("p,span")].find((el) =>
    /Photos, or videos up to 30s/.test(el.textContent || "")
  );
  if (t) t.style.display = "none";
});

// Bring the composer card into the frame with its TOP aligned just below the
// dynamic-island band — NOT centered, which previously cut the BADGES label
// into the top edge and clipped the place select at the bottom.
await page.evaluate(() => {
  const cards = [...document.querySelectorAll("div")].filter(
    (d) => d.className.includes("rounded-card") && d.className.includes("elevation-1")
  );
  const comp = cards.find((c) => c.querySelector("textarea"));
  if (comp) {
    const top = comp.getBoundingClientRect().top + window.scrollY - 64;
    window.scrollTo({ top: Math.max(0, top), behavior: "auto" });
  }
});
await page.waitForTimeout(600);
await stripDevOverlays();
// Composition checks: the place select and its value are fully on-screen, the
// photo preview is visible, and no BADGES label bleeds into the frame top.
const postLayout = await page.evaluate(() => {
  const vh = window.innerHeight;
  const sel = document.querySelector("select");
  const sr = sel?.getBoundingClientRect();
  const img = [...document.querySelectorAll('img[src^="blob:"]')][0];
  const ir = img?.getBoundingClientRect();
  const badges = [...document.querySelectorAll("*")]
    .filter((el) => el.children.length === 0 && el.textContent?.trim() === "BADGES")
    .map((el) => el.getBoundingClientRect().top);
  return {
    selectValue: sel?.value ?? null,
    selectFullyVisible: !!sr && sr.top >= 0 && sr.bottom <= vh,
    previewVisible: !!ir && ir.bottom > 0 && ir.top < vh,
    // Above the viewport or below the top band — never cut through it.
    badgesOut: badges.every((t) => t < 0 || t > 80),
  };
});
check("post: select fully in frame", postLayout.selectFullyVisible, `value=${postLayout.selectValue}`);
check("post: photo preview in frame", postLayout.previewVisible);
check("post: no BADGES cut at top", postLayout.badgesOut);
check("post: dark theme", await isDark());
check(
  "post: no dev overlay",
  await page.evaluate(() => document.querySelectorAll("nextjs-portal,[data-nextjs-toast]").length === 0)
);
await page.screenshot({ path: path.join(OUT, "app-post.png") });
console.log("  wrote app-post.png");
}

/* ── 5. JOIN — the public join screen ──────────────────────────────────── */
if (wants("join")) {
console.log("\n== app-join.png (public join screen) ==");
await goto(`${BASE}/join/${SHOP}`);
const joinText = await page.evaluate(() => document.body.textContent || "");
check("join: shop name visible", joinText.toUpperCase().includes(SHOP_NAME.toUpperCase()));
check("join: not an error state", !page.url().includes("/404") && !joinText.includes("Something went wrong"));
check("join: CTA present", (await page.getByText(/check in|join|sign in/i).count()) > 0);
check("join: dark theme", await isDark());
await stripDevOverlays();
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(OUT, "app-join.png") });
console.log("  wrote app-join.png");
}

await browser.close();

/* ── Summary ───────────────────────────────────────────────────────────── */
const dims = await (async () => {
  const { execFileSync } = await import("node:child_process");
  const files = ["app-explore.png", "app-feed.png", "app-checkin.png", "app-post.png", "app-join.png"];
  const rows = files.map((f) => {
    const out = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", path.join(OUT, f)]).toString();
    const w = out.match(/pixelWidth: (\d+)/)?.[1];
    const h = out.match(/pixelHeight: (\d+)/)?.[1];
    return `${f}: ${w}x${h}`;
  });
  const allCorrect = rows.every((r) => /780x1646$/.test(r));
  check("all captures are 780x1646 (exact 9:19)", allCorrect, rows.join(" | "));
  return rows.join(" | ");
})();
console.log(`\n${failures === 0 ? "ALL CHECKS PASS" : `${failures} CHECK(S) FAILED`}`);
console.log(`captures -> ${OUT}/`);
console.log(`sample dims: ${dims}`);
process.exit(failures === 0 ? 0 : 1);

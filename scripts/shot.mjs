#!/usr/bin/env node
/**
 * Full-page screenshots for design review.
 *
 * Replaces the scroll-then-capture approach, which blanked on any scrolled
 * state in three consecutive sessions. Playwright renders the whole document
 * in one pass — `fullPage: true` involves no scroll state at all — so a
 * 6000px reference page comes back in a single image.
 *
 *   npm run shot -- /dev/tokens
 *   npm run shot -- /dev/components --width 375
 *   npm run shot -- /dev/tokens /dev/components --theme light,dark
 *
 * Options
 *   --width   viewport width in px (default 375)
 *   --theme   comma list of light|dark (default both)
 *   --out     output dir (default .screenshots/)
 *   --base    origin (default http://localhost:3000)
 *   --clip    capture only the viewport instead of the full page
 *
 * Output is written to .screenshots/ which is gitignored — these are review
 * artifacts, not repo content.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { loadEnv, projectRefFrom } from "./dev-guard.mjs";

const argv = process.argv.slice(2);
// Options that take a value; everything else beginning with -- is a bare flag.
const VALUED = new Set(["width", "theme", "out", "base", "login", "password"]);

function opt(name, fallback) {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
}
const flag = (name) => argv.includes(`--${name}`);

// Routes are the positional args — skipping both the option tokens and the
// values that follow them. Without the second check, `--theme light` left
// "light" behind and the script tried to navigate to it as a route.
const routes = argv.filter((a, i) => {
  if (a.startsWith("--")) return false;
  const prev = argv[i - 1];
  if (prev && prev.startsWith("--") && VALUED.has(prev.slice(2))) return false;
  return true;
});

const width = Number(opt("width", 375));
const themes = String(opt("theme", "light,dark")).split(",").map((t) => t.trim());
const outDir = opt("out", ".screenshots");
const base = opt("base", "http://localhost:3000");
const fullPage = !flag("clip");

if (routes.length === 0) {
  console.error("usage: npm run shot -- <route> [route...] [--width 375] [--theme light,dark]");
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

/**
 * --login <email> signs in through Supabase here and injects the resulting
 * session into localStorage, so authenticated screens can be captured without
 * driving a login form. Dev only: it refuses anything but a seeded account.
 */
let session = null;
let storageKey = null;
const loginEmail = opt("login", null);
if (loginEmail) {
  if (!loginEmail.endsWith("@ventzon.test")) {
    console.error("--login only accepts seeded @ventzon.test accounts");
    process.exit(1);
  }
  const env = { ...loadEnv(), ...process.env };
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
  const { data, error } = await sb.auth.signInWithPassword({
    email: loginEmail,
    password: opt("password", "ventzon-dev-password"),
  });
  if (error) {
    console.error(`--login failed: ${error.message}`);
    process.exit(1);
  }
  session = data.session;
  storageKey = `sb-${projectRefFrom(env.NEXT_PUBLIC_SUPABASE_URL)}-auth-token`;
  console.log(`  signed in as ${loginEmail}`);
}

/**
 * The app uses @supabase/ssr's createBrowserClient, which keeps the session in
 * COOKIES rather than localStorage — an injected localStorage entry is simply
 * ignored and the screen redirects to auth. Recent versions store a
 * `base64-`-prefixed JSON blob, chunked across `.0`, `.1`, … once it exceeds
 * ~3180 characters.
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

const browser = await chromium.launch();
const written = [];

for (const theme of themes) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    deviceScaleFactor: 2,
    // Matches the app's own resolution of `system`, so a page rendered here
    // looks like a page rendered on a device set to this appearance.
    colorScheme: theme === "dark" ? "dark" : "light",
  });

  // Seed the theme preference before any script runs, so the pre-paint
  // script in layout.tsx resolves to the theme we asked for rather than
  // flashing and correcting.
  // --onboarding leaves the onboarded flag unset so the first-run overlay
  // renders; it is fixed inset-0 and so cannot be shown in the gallery.
  await context.addInitScript(
    ([t, showOnboarding, key, sess]) => {
      try {
        localStorage.setItem("ventzon_theme", t);
        if (!showOnboarding) localStorage.setItem("ventzon_onboarded_v1", "1");
        sessionStorage.setItem("ventzon_banner_dismissed", "1");
        if (key && sess) localStorage.setItem(key, JSON.stringify(sess));
      } catch {}
    },
    [theme, flag("onboarding"), storageKey, session]
  );

  if (session) await context.addCookies(sessionCookies(session, storageKey, base));

  const page = await context.newPage();

  for (const route of routes) {
    const url = base + route;
    // `load` rather than `networkidle`: app screens poll and hold open
    // connections, so networkidle never settles and the capture times out.
    await page.goto(url, { waitUntil: "load", timeout: 45000 });
    // Best-effort quiet period, but never fatal.
    await page
      .waitForLoadState("networkidle", { timeout: 6000 })
      .catch(() => {});
    // Webfonts must be in before we capture, or we screenshot the fallback
    // stack — exactly the mistake that made an entire review invalid once.
    await page.evaluate(() => document.fonts.ready);
    // The Next dev overlay is fixed-position, so fullPage capture bakes it
    // into the image on top of whatever it happens to cover.
    await page.addStyleTag({
      content: "nextjs-portal,[data-nextjs-toast],#__next-build-watcher{display:none!important}",
    });

    const slug = route.replace(/^\//, "").replace(/[^\w-]+/g, "-") || "root";
    const file = path.join(outDir, `${slug}--${width}--${theme}.png`);
    await page.screenshot({ path: file, fullPage });
    const dims = await page.evaluate(() => ({
      w: document.documentElement.scrollWidth,
      h: document.documentElement.scrollHeight,
    }));
    written.push({ file, dims });
    console.log(`  ${file}  (${dims.w}x${dims.h})`);
  }

  await context.close();
}

await browser.close();
console.log(`\n${written.length} screenshot(s) -> ${outDir}/`);

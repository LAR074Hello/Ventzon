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

const argv = process.argv.slice(2);
const routes = argv.filter((a) => !a.startsWith("--") && !/^\d+$/.test(a));
function opt(name, fallback) {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
}
const flag = (name) => argv.includes(`--${name}`);

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
    ([t, showOnboarding]) => {
      try {
        localStorage.setItem("ventzon_theme", t);
        if (!showOnboarding) localStorage.setItem("ventzon_onboarded_v1", "1");
        sessionStorage.setItem("ventzon_banner_dismissed", "1");
      } catch {}
    },
    [theme, flag("onboarding")]
  );

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

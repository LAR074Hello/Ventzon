#!/usr/bin/env node

/**
 * generate-favicons.mjs
 *
 * Generates circular favicon PNGs from public/logo.png.
 * Outputs:
 *   public/favicon.ico        (32×32 — actually a PNG, works in all modern browsers)
 *   public/favicon-16x16.png  (16×16)
 *   public/favicon-32x32.png  (32×32)
 *   public/icon-192.png       (192×192)
 *   public/icon-512.png       (512×512)
 *   public/apple-touch-icon.png (180×180)
 *
 * Requirements: Node 18+ (uses native sharp alternative via canvas-less approach)
 * Install sharp first: npm install --save-dev sharp
 *
 * Usage: node scripts/generate-favicons.mjs
 */

import sharp from "sharp";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PUBLIC = join(ROOT, "public");
const LOGO_PATH = join(PUBLIC, "logo.png");

const SIZES = [
  { name: "favicon.ico", size: 32 },
  { name: "favicon-16x16.png", size: 16 },
  { name: "favicon-32x32.png", size: 32 },
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
];

async function generateCircularIcon(inputPath, outputPath, size) {
  // Create a circular mask
  const circleMask = Buffer.from(
    `<svg width="${size}" height="${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/>
    </svg>`
  );

  await sharp(inputPath)
    .resize(size, size, { fit: "cover", position: "centre" })
    .composite([
      {
        input: circleMask,
        blend: "dest-in",
      },
    ])
    .png()
    .toFile(outputPath);
}

async function main() {
  console.log("Generating circular favicons from public/logo.png...\n");

  for (const { name, size } of SIZES) {
    const outputPath = join(PUBLIC, name);
    try {
      await generateCircularIcon(LOGO_PATH, outputPath, size);
      console.log(`  ✓ ${name} (${size}×${size})`);
    } catch (err) {
      console.error(`  ✗ ${name}: ${err.message}`);
    }
  }

  console.log("\nDone! All favicon files updated in /public/");
}

main().catch(console.error);

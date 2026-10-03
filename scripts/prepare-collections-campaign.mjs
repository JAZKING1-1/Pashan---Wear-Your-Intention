// Collections campaign photography — asset preparation only.
//
// Transcodes the newly generated campaign frames in design-references/ into
// responsive WebP files in public/images/collections/. Resize and re-encode
// only: no crop, no retouch, no colour change, no overlay. The originals in
// design-references/ stay untouched, so any browser framing remains reversible.
//
//   node scripts/prepare-collections-campaign.mjs

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { encodeWebp, findChrome } from "./lib/chrome-webp.mjs";

const root = process.cwd();
const output = path.join(root, "public/images/collections");

// Every campaign frame is 1448x1086 (4:3) with the same atelier, camera
// distance and light, so one shared width ladder keeps the grid consistent.
const TARGETS = [
  {
    source: "design-references/collection-pyrite.png",
    quality: 0.86,
    widths: [560, 900, 1440],
    name: (width) => `campaign-pyrite-${width}.webp`,
  },
  {
    source: "design-references/collection-tiger-eye.png",
    quality: 0.86,
    widths: [560, 900, 1440],
    name: (width) => `campaign-tiger-eye-${width}.webp`,
  },
  {
    source: "design-references/collection-hematite.png",
    quality: 0.86,
    widths: [560, 900, 1440],
    name: (width) => `campaign-hematite-${width}.webp`,
  },
  {
    source: "design-references/collection-amethyst.png",
    quality: 0.86,
    widths: [560, 900, 1440],
    name: (width) => `campaign-amethyst-${width}.webp`,
  },
  {
    source: "design-references/collection-green-quartz.png",
    quality: 0.86,
    widths: [560, 900, 1440],
    name: (width) => `campaign-green-quartz-${width}.webp`,
  },
  {
    source: "design-references/collection-lava-stone.png",
    quality: 0.86,
    widths: [560, 900, 1440],
    name: (width) => `campaign-lava-${width}.webp`,
  },
  {
    source: "design-references/collection-dhan-yog.png",
    quality: 0.86,
    widths: [560, 900, 1440],
    name: (width) => `campaign-dhan-yog-${width}.webp`,
  },
  {
    source: "design-references/collection-make-it-yours.png",
    quality: 0.86,
    widths: [560, 900, 1440],
    name: (width) => `campaign-make-your-own-${width}.webp`,
  },
  // The same atelier without a bracelet. Serves the Collections hero band.
  // The 1672x941 source is used at its native ratio, so the browser crops
  // rather than stretches. Original stays in design-references/.
  {
    source: "design-references/collections-background.png",
    quality: 0.82,
    widths: [900, 1400, 1672],
    name: (width) => `collections-hero-${width}.webp`,
  },
];

const chrome = findChrome(root);
if (!chrome) {
  console.error("No Chromium found. Set CHROME_PATH to an executable.");
  process.exit(1);
}
mkdirSync(output, { recursive: true });

for (const target of TARGETS) {
  const source = path.join(root, target.source);
  console.log("Source:", target.source);
  for (const { width, buffer } of encodeWebp(chrome, source, {
    widths: target.widths,
    quality: target.quality,
    root,
  })) {
    writeFileSync(path.join(output, target.name(width)), buffer);
    console.log(
      target.name(width),
      `${width}px`,
      `${(buffer.length / 1024).toFixed(0)}KB`,
    );
  }
}
console.log("Originals unchanged; browser framing stays reversible.");
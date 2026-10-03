// Ritual section photography — asset preparation only.
//
// Transcodes the approved reference photographs into responsive WebP files in
// public/images/ritual-kit/. Resize and re-encode only: no crop, no retouch,
// no colour change. The originals in design-references/ stay untouched, so the
// browser framing in styles-ritual-kit.css remains reversible.
//
//   node scripts/prepare-ritual-section-assets.mjs

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { encodeWebp, findChrome } from "./lib/chrome-webp.mjs";

const root = process.cwd();
const output = path.join(root, "public/images/ritual-kit");

const TARGETS = [
  {
    source: "design-references/ritual-kit-photo.png",
    quality: 0.86,
    widths: [640, 1024, 1536],
    name: (width) => `pashan-box-${width}.webp`,
  },
  {
    source: "design-references/ritual-section-background.png",
    quality: 0.78,
    widths: [900, 1400, 1672],
    name: (width) => `ritual-environment-${width}.webp`,
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
    console.log(target.name(width), `${width}px`, `${(buffer.length / 1024).toFixed(0)}KB`);
  }
}
console.log("Originals unchanged; browser framing stays reversible.");
// Rashi doorway entrance — asset preparation only.
//
// Transcodes the newly saved door, interior and bracelet frames in
// design-references/ into responsive WebP files in public/images/rashi-door/.
// Resize and re-encode only: no crop, no retouch, no colour change, no overlay.
// The originals in design-references/ stay untouched, so any browser framing
// remains reversible in CSS.
//
//   node scripts/prepare-rashi-door.mjs

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { encodeWebp, findChrome } from "./lib/chrome-webp.mjs";

const root = process.cwd();
const output = path.join(root, "public/images/rashi-door");

// The two door leaves are 1024x1536 (2:3) and are each drawn into one half of a
// 4:3 stage, so they need no cropping at any breakpoint.
const TARGETS = [
  {
    source: "design-references/door-left.png",
    quality: 0.86,
    widths: [480, 768, 1024],
    name: (width) => `door-left-${width}.webp`,
  },
  {
    source: "design-references/door-right.png",
    quality: 0.86,
    widths: [480, 768, 1024],
    name: (width) => `door-right-${width}.webp`,
  },
  // 1672x941 interior, behind the doors. Wide enough to cover a 4:3 stage.
  {
    source: "design-references/doorway-interior.png",
    quality: 0.8,
    widths: [800, 1200, 1672],
    name: (width) => `doorway-interior-${width}.webp`,
  },
  // 1448x1086 (4:3) bracelet photograph — the same ratio as the stage, so it
  // is revealed whole and undistorted.
  {
    source: "design-references/rashi-bracelet.png",
    quality: 0.88,
    widths: [480, 720, 960, 1448],
    name: (width) => `rashi-bracelet-${width}.webp`,
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
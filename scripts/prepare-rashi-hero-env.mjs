// Rashi hero — environment derivatives.
//
// rashi-hero-environment.png is the full-bleed hero background. A 2.1MB PNG is
// far too heavy for a first-paint image, so it is re-encoded to responsive WebP
// here, following the same convention as the other prepare-* scripts: resize and
// re-encode only, no crop, no retouch, no colour change, so the CSS keeps full
// control of framing. The original is only ever read.
//
//   node scripts/prepare-rashi-hero-env.mjs

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { encodeWebp, findChrome } from "./lib/chrome-webp.mjs";

const root = process.cwd();
const source = path.join(root, "design-references/rashi-hero-environment.png");
const output = path.join(root, "public/images/rashi-hero");

const chrome = findChrome(root);
if (!chrome) {
  console.error("No Chromium found. Set CHROME_PATH to an executable.");
  process.exit(1);
}

const widths = [900, 1400, 2000];
mkdirSync(output, { recursive: true });
for (const { width, height, buffer } of encodeWebp(chrome, source, {
  widths,
  quality: 0.82,
  root,
})) {
  const name = `environment-${width}.webp`;
  writeFileSync(path.join(output, name), buffer);
  console.log(name, `${width}x${height}`, `${(buffer.length / 1024).toFixed(0)}KB`);
}
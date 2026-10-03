// Atelier backdrop — asset preparation only.
//
// Encodes the approved atelier environment photograph into responsive WebP
// files for the Make Your Own page. Resize and re-encode only; the original in
// design-references/ stays untouched and the CSS framing stays reversible.
//
//   node scripts/prepare-atelier-backdrop.mjs

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { encodeWebp, findChrome } from "./lib/chrome-webp.mjs";

const root = process.cwd();
const source = path.join(root, "design-references/atelier-background.png");
const output = path.join(root, "public/images/atelier");
const widths = [900, 1440, 1920];
const quality = 0.78;

const chrome = findChrome(root);
if (!chrome) {
  console.error("No Chromium found. Set CHROME_PATH to an executable.");
  process.exit(1);
}
mkdirSync(output, { recursive: true });

console.log("Source: design-references/atelier-background.png");
for (const { width, height, buffer } of encodeWebp(chrome, source, {
  widths,
  quality,
  root,
})) {
  const file = path.join(output, `atelier-backdrop-${width}.webp`);
  writeFileSync(file, buffer);
  console.log(
    `atelier-backdrop-${width}.webp`,
    `${width}x${height}`,
    `${(buffer.length / 1024).toFixed(0)}KB`,
  );
}
console.log("Original unchanged; browser framing stays reversible.");
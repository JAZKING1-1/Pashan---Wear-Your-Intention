import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
const require = createRequire(
  process.env.PASHAN_PLAYWRIGHT_ROOT + "/package.json",
);
const sharp = require("sharp");
const crops = {
  pyrite: { left: 0, top: 550, width: 900, height: 675 },
  "tiger-eye": { left: 100, top: 450, width: 560, height: 420 },
  hematite: { left: 0, top: 450, width: 720, height: 540 },
  amethyst: { left: 60, top: 470, width: 620, height: 465 },
  "green-quartz": { left: 0, top: 400, width: 720, height: 540 },
  lava: { left: 40, top: 380, width: 660, height: 495 },
  "dhan-yog": null,
  "make-your-own": null,
};
mkdirSync("public/atelier-products", { recursive: true });
const manifest = [];
for (const [slug, crop] of Object.entries(crops)) {
  const source =
    slug === "make-your-own"
      ? "src/assets/products/make-your-own.webp"
      : `src/assets/products/${slug}/01.webp`;
  const meta = await sharp(source).metadata();
  for (const width of [480, 720]) {
    const outputWidth = Math.min(width, crop?.width ?? meta.width);
    let pipeline = sharp(source);
    if (crop) pipeline = pipeline.extract(crop);
    await pipeline
      .resize({ width: outputWidth, withoutEnlargement: true })
      .webp({ quality: 84 })
      .toFile(`public/atelier-products/${slug}-${width}.webp`);
  }
  manifest.push({
    slug,
    source,
    sourceWidth: meta.width,
    sourceHeight: meta.height,
    crop,
    alterations: "crop and resize only; original preserved",
    previewApproval:
      slug === "tiger-eye"
        ? "photo-count supported; maker material approval pending"
        : "photographic fallback; no verified 3D recipe",
  });
}
writeFileSync(
  "public/atelier-products/manifest.json",
  JSON.stringify(manifest, null, 2),
);

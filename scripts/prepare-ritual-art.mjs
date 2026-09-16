import { createRequire } from "node:module";
import { mkdir, copyFile, writeFile } from "node:fs/promises";
const require = createRequire(
  process.env.PASHAN_PLAYWRIGHT_ROOT + "/package.json",
);
const sharp = require("sharp");
const source =
  "C:/Users/dshm1/.codex/generated_images/01a03a74-62a7-7f43-8d77-378b38e5a5ac/exec-6b0ce449-dc5f-4dbd-b186-225d7272a641.png";
await mkdir("public/images/ritual", { recursive: true });
await mkdir(".asset-review/ritual", { recursive: true });
await copyFile(source, ".asset-review/ritual/devotional-triptych-original.png");
const sizes = [];
for (const width of [768, 1440]) {
  const result = await sharp(source)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile("public/images/ritual/devotional-triptych-" + width + ".webp");
  sizes.push({
    path: "public/images/ritual/devotional-triptych-" + width + ".webp",
    width: result.width,
    height: result.height,
    bytes: result.size,
  });
}
await writeFile(
  "docs/ritual-art-sizes.json",
  JSON.stringify(sizes, null, 2) + "\n",
);
console.log(sizes);

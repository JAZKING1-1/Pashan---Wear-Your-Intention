import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const require = createRequire(
  process.env.PASHAN_PLAYWRIGHT_ROOT + "/package.json",
);
const sharp = require("sharp");
const manifest = JSON.parse(
  await readFile("docs/original-photo-manifest.json", "utf8"),
);
await mkdir("public/images/originals", { recursive: true });
const outputs = [];
for (const photo of manifest.photos) {
  const source = await readFile(photo.path);
  if (source.byteLength !== photo.bytes)
    throw new Error(`Original byte size differs: ${photo.name}`);
  const sha256 = createHash("sha256").update(source).digest("hex");
  for (const width of [480, 960]) {
    const path = `public/images/originals/${photo.key}-${width}.webp`;
    const info = await sharp(source)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(path);
    outputs.push({
      key: photo.key,
      driveId: photo.driveId,
      sourceSha256: sha256,
      path,
      width: info.width,
      height: info.height,
      bytes: info.size,
    });
  }
}
await writeFile(
  "docs/original-photo-sizes.json",
  JSON.stringify(outputs, null, 2) + "\n",
);
console.log(JSON.stringify(outputs));

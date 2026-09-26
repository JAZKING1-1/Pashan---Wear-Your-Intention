import { createRequire } from "node:module";
import { readdir, mkdir } from "node:fs/promises";
import path from "node:path";

const require = createRequire(
  `${process.env.PASHAN_PLAYWRIGHT_ROOT}/package.json`,
);
const sharp = require("sharp");
const root = path.resolve(".asset-review/ritual-kit");
const originals = (await readdir(root))
  .filter((file) => file.endsWith(".jpg"))
  .sort();
await mkdir(root, { recursive: true });
const tiles = await Promise.all(
  originals.map(async (file, index) => {
    const photo = await sharp(path.join(root, file))
      .rotate()
      .resize(300, 310, { fit: "contain", background: "#eee6dc" })
      .toBuffer();
    const label = Buffer.from(
      `<svg width="300" height="40"><rect width="100%" height="100%" fill="#fff9f0"/><text x="10" y="25" font-size="14" fill="#32170f">${index + 1}. ${file}</text></svg>`,
    );
    const input = await sharp({
      create: { width: 300, height: 350, channels: 3, background: "#fff9f0" },
    })
      .composite([
        { input: photo, top: 0, left: 0 },
        { input: label, top: 310, left: 0 },
      ])
      .png()
      .toBuffer();
    return { input, left: (index % 4) * 300, top: Math.floor(index / 4) * 350 };
  }),
);
await sharp({
  create: {
    width: 1200,
    height: Math.ceil(tiles.length / 4) * 350,
    channels: 3,
    background: "#fff9f0",
  },
})
  .composite(tiles)
  .png()
  .toFile(path.join(root, "contact-sheet.png"));
console.log(
  "Created contact sheet from",
  originals.length,
  "untouched originals.",
);

// Resize/compress only: original pixels, colour, products and background remain
// unchanged. The component's documented CSS framing is reversible in-browser.
const selected = "IMG_20260725_170744.jpg";
const output = path.resolve("public/images/ritual-kit");
await mkdir(output, { recursive: true });
const meta = await sharp(path.join(root, selected)).metadata();
console.log("Source:", selected, meta.width, "x", meta.height);
for (const width of [480, 960, 1440]) {
  const info = await sharp(path.join(root, selected))
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(path.join(output, `pashan-box-${width}.webp`));
  console.log(width, info.width, info.height, info.size, "bytes");
}

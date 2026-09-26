import { createRequire } from "node:module";
import { readdir } from "node:fs/promises";
const require = createRequire(
  process.env.PASHAN_PLAYWRIGHT_ROOT + "/package.json",
);
const sharp = require("sharp");
const dir = ".asset-review/experience-refresh";
const files = (await readdir(dir))
  .filter((name) => /^IMG_.*\.jpg$/.test(name))
  .sort();
const tiles = [];
for (const [i, file] of files.entries()) {
  tiles.push({
    input: await sharp(`${dir}/${file}`)
      .rotate()
      .resize(260, 290, { fit: "contain", background: "#fff9f0" })
      .png()
      .toBuffer(),
    left: (i % 5) * 260,
    top: Math.floor(i / 5) * 320,
  });
  tiles.push({
    input: Buffer.from(
      `<svg width="260" height="30"><rect width="260" height="30" fill="#fff9f0"/><text x="8" y="21" font-size="15" fill="#32170f">${file}</text></svg>`,
    ),
    left: (i % 5) * 260,
    top: Math.floor(i / 5) * 320 + 290,
  });
}
await sharp({
  create: {
    width: 1300,
    height: Math.ceil(files.length / 5) * 320,
    channels: 3,
    background: "#fff9f0",
  },
})
  .composite(tiles)
  .png()
  .toFile(`${dir}/contact-sheet.png`);
console.log(`${files.length} originals reviewed in contact sheet`);

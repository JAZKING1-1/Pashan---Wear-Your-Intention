import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
const require = createRequire(
  process.env.PASHAN_PLAYWRIGHT_ROOT + "/package.json",
);
const sharp = require("sharp");
const manifest = JSON.parse(
  await readFile("docs/rashi-drive-manifest.json", "utf8"),
);
const ids = [
  ["aries", "1yR-OsQz6t8M_nAQLy96NjkJIaglTUiiJ"],
  ["taurus", "1FewKyb1dKPhhLkauQ6X0i6JMd2R03z0F"],
  ["gemini", "1NCFLZ4YnSuqQrffqnJxRrJ9oK7ogD4dD"],
  ["cancer", "1ao2KrtUdQvZAim_8lzNoQJ5NS9NH_ti-"],
  ["leo", "1rSwhVzDboj738qxsr5LIto7eRPP5aSgj"],
  ["virgo", "1Oxi4NiYm6X5uEY23YLHvhrK-JuLi8GwC"],
  ["libra", "1FLbRbG1W6d9OY_huksq4UpA6iCCWZDEW"],
  ["scorpio", "1ojg8op45IzwwgXDzVhd9jVoFYFmpmZ9R"],
  ["sagittarius", "1dhUTKCXYOFRoDSu845xE2pwqxLMuK_6q"],
  ["capricorn", "1m1W2LVnmhxnpKc3J3Aqo8guYEYaxi53Y"],
  ["aquarius", "1OCioGX6pOHh2LNaBUyf8ZeTS5yqlmO3I"],
  ["pisces", "11phpCRo2LSsgMg9Q-JtGnHLKvxLhBcNW"],
];
await mkdir("public/images/rashi", { recursive: true });
const tiles = [],
  outputs = [];
for (const [index, [slug, id]] of ids.entries()) {
  if (!manifest.some((file) => file.id === id))
    throw new Error("Source missing from manifest: " + slug);
  const original = ".asset-review/rashi-drive/" + id + ".jpg";
  const metadata = await sharp(original).metadata();
  for (const width of [480, 960]) {
    const dest = "public/images/rashi/" + slug + "-" + width + ".webp";
    const result = await sharp(original)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(dest);
    outputs.push({
      slug,
      driveId: id,
      path: dest,
      width: result.width,
      height: result.height,
      bytes: result.size,
      originalWidth: metadata.width,
      originalHeight: metadata.height,
    });
  }
  const tile = await sharp(original)
    .rotate()
    .resize(240, 360, { fit: "contain", background: "#fff9f0" })
    .png()
    .toBuffer();
  tiles.push({
    input: tile,
    left: (index % 4) * 240,
    top: Math.floor(index / 4) * 400,
  });
  const label = Buffer.from(
    '<svg width="240" height="40"><rect width="240" height="40" fill="#fff9f0"/><text x="12" y="26" font-size="22" fill="#32170f">' +
      slug +
      "</text></svg>",
  );
  tiles.push({
    input: label,
    left: (index % 4) * 240,
    top: Math.floor(index / 4) * 400 + 360,
  });
}
await sharp({
  create: { width: 960, height: 1200, channels: 3, background: "#fff9f0" },
})
  .composite(tiles)
  .png()
  .toFile(".asset-review/rashi-contact-sheet.png");
await writeFile(
  "docs/rashi-image-sizes.json",
  JSON.stringify(outputs, null, 2) + "\n",
);
console.log(JSON.stringify(outputs));

// Rashi hero — arch mask derivation for the hero environment.
//
// rashi-hero-environment.png is now the full-bleed hero background, and the
// doors and bracelet photograph have to sit inside the archway that is already
// painted into that artwork. The opening is therefore measured from the image at
// build time and written out as an alpha mask, so the CSS mask and the painted
// architecture are guaranteed to agree even if the artwork is re-exported.
//
//   node scripts/prepare-rashi-hero-mask.mjs
//
// Unlike the earlier alcove, this opening is right of centre, so the seed column
// is given explicitly rather than assumed to be the middle of the frame.
//
// Writes public/images/rashi-hero/arch-mask.png (white where the opening is
// open, transparent elsewhere) and prints the measured geometry. The source is
// only ever read.

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { findChrome } from "./lib/chrome-webp.mjs";

const root = process.cwd();
const source = path.join(root, "design-references/rashi-hero-environment.png");
const output = path.join(root, "public/images/rashi-hero");
const MASK_NAME = "arch-mask.png";

// The opening is measured as fractions of the source image so the numbers can
// be pasted straight into the stylesheet.
//
// SEED_X   the middle of the opening. The doorway sits right of centre here, so
//          this cannot be assumed to be the middle of the frame.
// FLOOR_Y  where the room's own floor meets the back of the recess. Below this
//          the image is the polished floor in front of the doorway, which the
//          mask must not cover or the photograph would spill onto it.
const SEED_X = 0.735;
const FLOOR_Y = 0.669;
// How far the walk is opened back out to meet the real jamb face.
const MARGIN = 26;

const chrome = findChrome(root);
if (!chrome) {
  console.error("No Chromium found. Set CHROME_PATH to an executable.");
  process.exit(1);
}

// The opening is a smooth, evenly lit recess. The stonework around it is
// moulded, carved and planted, so it carries far more local contrast. Walking
// outward from the middle of the recess until detail appears therefore traces
// the opening without any hand-placed geometry.
const PAGE = `<!doctype html><meta charset="utf-8"><body><script>
const img = new Image();
img.onload = () => {
  const W = img.naturalWidth, H = img.naturalHeight;
  const src = document.createElement("canvas");
  src.width = W; src.height = H;
  src.getContext("2d").drawImage(img, 0, 0);
  const d = src.getContext("2d").getImageData(0, 0, W, H).data;
  const lum = new Float32Array(W * H);
  for (let i = 0, p = 0; i < d.length; i += 4, p++)
    lum[p] = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];

  // Local detail: largest luminance step over a short baseline.
  const R = 4;
  const detail = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let m = 0;
      for (let k = -R; k <= R; k += 2) {
        const xr = x + k < 0 || x + k >= W ? x : x + k;
        const yd = y + k < 0 || y + k >= H ? y : y + k;
        const a = Math.abs(lum[y * W + x] - lum[y * W + xr]);
        const b = Math.abs(lum[y * W + x] - lum[yd * W + x]);
        if (a > m) m = a;
        if (b > m) m = b;
      }
      detail[y * W + x] = m;
    }
  }

  // Median-filter the detail so carved ornament does not read as a boundary.
  const win = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  const sd = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const s = [];
      for (const dy of win) for (const dx of win) {
        const yy = y + dy - 4, xx = x + dx - 4;
        if (yy < 0 || yy >= H || xx < 0 || xx >= W) continue;
        s.push(detail[yy * W + xx]);
      }
      s.sort((p, q) => p - q);
      sd[y * W + x] = s[(s.length / 2) | 0];
    }
  }

  const cx = Math.round(W * __SEED__);
  const floorY = Math.round(H * __FLOOR__);
  // Provisional springline used only to choose where to sample the jambs.
  const springGuess = Math.round(H * 0.30);
  const DETAIL_T = Number(__DETAIL_T__);
  const edges = [];
  for (let y = 0; y < floorY; y++) {
    let l = cx, r = cx;
    while (l > 0 && sd[y * W + l] < DETAIL_T) l--;
    while (r < W - 1 && sd[y * W + r] < DETAIL_T) r++;
    edges.push([l, r]);
  }

  // The widest stretch of the walk is the clear opening between the jambs.
  // Sample the jambs from the clear band between the springline and the vessels
  // standing on the right of the recess. Lower rows carry the plant and the pots,
  // which are detail inside the opening and would truncate the walk.
  const band = [];
  for (let y = Math.round(springGuess * 1.15); y < Math.round(floorY * 0.76); y++) band.push(edges[y]);
  band.sort((a, b) => (b[1] - b[0]) - (a[1] - a[0]));
  const best = band[0][1] - band[0][0];

  // The springline is the first row that has reached full jamb width; above it
  // the arch curves in, below it the jambs are vertical. Deriving the two
  // separately stops the threshold and floor detail from truncating the opening
  // partway down.
  let spring = 0;
  for (let y = 0; y < floorY; y++) if (edges[y][1] - edges[y][0] >= best * 0.97) { spring = y; break; }

  const settled = [];
  for (let y = spring; y < floorY; y++) {
    if (edges[y][1] - edges[y][0] >= best * 0.9) settled.push([y, edges[y][0], edges[y][1]]);
  }
  settled.sort((a, b) => a[0] - b[0]);
  const mid = settled[settled.length >> 1];
  const jambMidL = mid[1], jambMidR = mid[2];

  // Ease onto the vertical jamb line above the springline so the head reads as
  // one continuous arch rather than a detected edge with a step in it.
  let apex = spring;
  for (let y = spring - 1; y >= 0; y--) {
    if (edges[y][1] - edges[y][0] < 3) { apex = y; break; }
  }
  for (let y = 0; y < apex; y++) edges[y] = [cx, cx];
  for (let y = apex; y < spring; y++) {
    const t = spring === 0 ? 0 : (spring - y) / spring;
    const l = Math.round(jambMidL + (edges[y][0] - jambMidL) * t);
    const r = Math.round(jambMidR + (edges[y][1] - jambMidR) * t);
    edges[y] = [Math.max(l, jambMidL), Math.min(r, jambMidR)];
  }
  for (let y = spring; y < floorY; y++) edges[y] = [jambMidL, jambMidR];

  // Build the alpha mask from those edges, opened back out a little so the
  // photograph meets the real jamb without spilling onto the stonework.
  const MARGIN = __MARGIN__;
  const out = document.createElement("canvas");
  out.width = W; out.height = H;
  const g = out.getContext("2d");
  const id = g.createImageData(W, H);
  for (let y = 0; y < floorY; y++) {
    const [el, er] = edges[y];
    // Taper the margin to nothing at the apex. The head's topmost rows are a
    // degenerate one-pixel walk, and a fixed margin would widen those into a
    // stub standing above the arch.
    const m = Math.round(MARGIN * Math.min(1, (er - el) / 24));
    const l = Math.max(0, el - m), r = Math.min(W - 1, er + m);
    for (let x = l; x <= r; x++) {
      const i = (y * W + x) * 4;
      id.data[i] = id.data[i + 1] = id.data[i + 2] = 255;
      id.data[i + 3] = 255;
    }
  }
  g.putImageData(id, 0, 0);

  // Feather the boundary so the photograph meets the jamb without a hard cut.
  const soft = document.createElement("canvas");
  soft.width = W; soft.height = H;
  const sg = soft.getContext("2d");
  sg.filter = "blur(3px)";
  sg.drawImage(out, 0, 0);
  sg.filter = "none";

  const pre = document.createElement("pre");
  pre.id = "mask";
  pre.textContent = soft.toDataURL("image/png");
  document.body.appendChild(pre);

  const rows = [];
  for (let f = 0; f <= 1.0001; f += 0.05) {
    const y = Math.min(floorY - 1, Math.round(f * (H - 1)));
    rows.push([+f.toFixed(2), y, edges[y][0], edges[y][1]]);
  }
  const rep = document.createElement("pre");
  rep.id = "report";
  rep.textContent = JSON.stringify({ W, H, cx, best, spring, apex, jambMid: [jambMidL, jambMidR], rows });
  document.body.appendChild(rep);
  document.title = "DONE";
};
img.src = "__SOURCE__";
</script></body>`;

const html = PAGE
  .replace("__SEED__", String(SEED_X))
  .replace("__FLOOR__", String(FLOOR_Y))
  .replace("__DETAIL_T__", "14")
  .replace("__MARGIN__", String(MARGIN))
  .replace("__SOURCE__", "data:image/png;base64," + readFileSync(source).toString("base64"));
const temp = path.join(root, ".hero-mask.html");
writeFileSync(temp, html);

try {
  const dom = execFileSync(
    chrome,
    ["--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars",
     "--virtual-time-budget=300000", "--dump-dom", `file:///${temp.replace(/\\/g, "/")}`],
    { maxBuffer: 1024 * 1024 * 512, encoding: "utf8" },
  );
  const mask = dom.match(/<pre id="mask">data:image\/png;base64,([A-Za-z0-9+/=]+)<\/pre>/);
  const report = dom.match(/<pre id="report">([\s\S]*?)<\/pre>/);
  if (!mask) throw new Error("Chromium produced no arch mask");
  mkdirSync(output, { recursive: true });
  const buffer = Buffer.from(mask[1], "base64");
  writeFileSync(path.join(output, MASK_NAME), buffer);
  console.log(MASK_NAME, `${(buffer.length / 1024).toFixed(0)}KB`);
  if (report) {
    const { W, H, cx, spring, apex, jambMid, rows } = JSON.parse(
      report[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&"),
    );
    const pw = (v) => ((v / W) * 100).toFixed(2);
    const ph = (v) => ((v / H) * 100).toFixed(2);
    console.log(`environment ${W}x${H}, seed x=${cx}`);
    console.log("");
    console.log("  paste into the stylesheet, as percentages of the environment image:");
    console.log(`    left jamb    ${pw(jambMid[0] - 16)}%`);
    console.log(`    right jamb   ${pw(jambMid[1] + 16)}%`);
    console.log(`    opening      ${pw(jambMid[1] - jambMid[0] + 32)}% of width, centred on ${pw((jambMid[0] + jambMid[1]) / 2)}%`);
    console.log(`    apex         ${ph(apex)}% of height`);
    console.log(`    springline   ${ph(spring)}% of height`);
    console.log(`    floor        ${(FLOOR_Y * 100).toFixed(2)}% of height`);
    console.log("");
    console.log("  yFrac   y     left%   right%");
    for (const [f, y, l, r] of rows)
      console.log(`  ${f.toFixed(2)}  ${String(y).padStart(4)}  ${pw(l).padStart(7)} ${pw(r).padStart(7)}`);
  }
} finally {
  rmSync(temp, { force: true });
}
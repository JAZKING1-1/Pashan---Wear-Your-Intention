// Rashi doorway — alcove mask derivation.
//
// The bracelet photograph has to sit *inside* the archway that already exists
// in doorway-interior.png, not in a rectangle floating in front of it. The
// alcove silhouette is therefore measured from that artwork at build time and
// written out as an alpha mask, so the CSS mask and the painted frame are
// guaranteed to agree even if the artwork is ever re-exported.
//
//   node scripts/prepare-rashi-alcove-mask.mjs
//
// Writes public/images/rashi-door/alcove-mask.png (white where the alcove is
// open, transparent elsewhere). Reads the source read-only.

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { findChrome } from "./lib/chrome-webp.mjs";

const root = process.cwd();
const source = path.join(root, "design-references/doorway-interior.png");
const output = path.join(root, "public/images/rashi-door");
const MASK_NAME = "alcove-mask.png";

const chrome = findChrome(root);
if (!chrome) {
  console.error("No Chromium found. Set CHROME_PATH to an executable.");
  process.exit(1);
}

// The alcove is the smooth, evenly lit back wall of the niche. Architecture
// around it is moulded, carved and planted, so it carries far more local
// contrast. Walking outward from the centre of the niche until detail appears
// therefore traces the opening without any hand-placed geometry.
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
  const smoothDetail = new Float32Array(W * H);
  const win = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const s = [];
      for (const dy of win) for (const dx of win) {
        const yy = y + dy - 4, xx = x + dx - 4;
        if (yy < 0 || yy >= H || xx < 0 || xx >= W) continue;
        s.push(detail[yy * W + xx]);
      }
      s.sort((p, q) => p - q);
      smoothDetail[y * W + x] = s[(s.length / 2) | 0];
    }
  }

  // Walk out from the centre column until detail rises above the threshold.
  const cx = W >> 1;
  const cy = Math.round(H * 0.5);
  const DETAIL_T = Number(__DETAIL_T__);
  const edges = [];
  for (let y = 0; y < H; y++) {
    let l = cx, r = cx;
    while (l > 0 && smoothDetail[y * W + l] < DETAIL_T) l--;
    while (r < W - 1 && smoothDetail[y * W + r] < DETAIL_T) r++;
    edges.push([l, r]);
  }
  // The widest stretch of the walk is the clear opening between the jambs.
  const band = [];
  for (let y = Math.round(H * 0.25); y < Math.round(H * 0.7); y++) band.push(edges[y]);
  band.sort((a, b) => (b[1] - b[0]) - (a[1] - a[0]));
  const best = band[0][1] - band[0][0];
  const jambL = band[0][0], jambR = band[0][1];

  // The springline is the first row that has reached full jamb width; above it
  // the arch curves in, below it the jambs are vertical. Deriving the two
  // separately stops the bench edge and floor detail from truncating the
  // opening partway down.
  let spring = 0;
  for (let y = 0; y < H; y++) if (edges[y][1] - edges[y][0] >= best * 0.97) { spring = y; break; }

  const settled = [];
  for (let y = spring; y < H; y++) {
    if (edges[y][1] - edges[y][0] >= best * 0.9) settled.push([y, edges[y][0], edges[y][1]]);
  }
  settled.sort((a, b) => a[0] - b[0]);
  const mid = settled[settled.length >> 1];
  const jambMidL = mid[1], jambMidR = mid[2];

  // Ease onto the vertical jamb line above the springline so the head reads as
  // one continuous arch rather than a detected edge with a step in it. The
  // arch head is always narrower than the opening, so both sides are pulled
  // inwards only.
  let apex = spring;
  for (let y = 0; y < spring; y++) if (edges[y][1] > edges[y][0]) { apex = y; break; }
  // Nothing is open above the apex of the head; that band is carved stonework.
  for (let y = 0; y < apex; y++) edges[y] = [cx, cx];
  for (let y = apex; y < spring; y++) {
    const t = spring === 0 ? 0 : (spring - y) / spring;
    const l = Math.round(jambMidL + (edges[y][0] - jambMidL) * t);
    const r = Math.round(jambMidR + (edges[y][1] - jambMidR) * t);
    edges[y] = [Math.max(l, jambMidL), Math.min(r, jambMidR)];
  }
  for (let y = spring; y < H; y++) edges[y] = [jambMidL, jambMidR];

  // Build the alpha mask from those edges. The walk stops at the first carved
  // detail, which lands just inside the jamb reveal, so it is opened back out a
  // little to meet the real edge without spilling onto the stonework.
  const MARGIN = 14;
  const out = document.createElement("canvas");
  out.width = W; out.height = H;
  const g = out.getContext("2d");
  const id = g.createImageData(W, H);
  for (let y = 0; y < H; y++) {
    const [el, er] = edges[y];
    const l = Math.max(0, el - MARGIN), r = Math.min(W - 1, er + MARGIN);
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
    const y = Math.min(H - 1, Math.round(f * (H - 1)));
    rows.push([f.toFixed(2), edges[y][0], edges[y][1], edges[y][1] - edges[y][0]]);
  }
  const rep = document.createElement("pre");
  rep.id = "report";
  rep.textContent = JSON.stringify({ W, H, best, spring, apex, jamb: [jambL, jambR], jambMid: [jambMidL, jambMidR], rows });
  document.body.appendChild(rep);
  document.title = "DONE";
};
img.src = "__SOURCE__";
</script></body>`;

const DETAIL_T = 12;
const html = PAGE.replace("__DETAIL_T>", `__DETAIL_T__`).replace("__DETAIL_T__", String(DETAIL_T))
  .replace("__SOURCE__", "data:image/png;base64," + readFileSync(source).toString("base64"));
const temp = path.join(root, ".alcove-mask.html");
writeFileSync(temp, html);

try {
  const dom = execFileSync(
    chrome,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--hide-scrollbars",
      "--virtual-time-budget=300000",
      "--dump-dom",
      `file:///${temp.replace(/\\/g, "/")}`,
    ],
    { maxBuffer: 1024 * 1024 * 512, encoding: "utf8" },
  );
  const mask = dom.match(/<pre id="mask">data:image\/png;base64,([A-Za-z0-9+/=]+)<\/pre>/);
  const report = dom.match(/<pre id="report">([\s\S]*?)<\/pre>/);
  if (!mask) throw new Error("Chromium produced no alcove mask");
  mkdirSync(output, { recursive: true });
  const buffer = Buffer.from(mask[1], "base64");
  writeFileSync(path.join(output, MASK_NAME), buffer);
  console.log(MASK_NAME, `${(buffer.length / 1024).toFixed(0)}KB`);
  if (report) {
    const { W, H, best, spring, apex, jambMid, rows } = JSON.parse(report[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&"));
    console.log(`interior ${W}x${H}`);
    console.log(`  widest opening ${best}px, jambs x=${jambMid[0]}..${jambMid[1]} (${((jambMid[1] - jambMid[0]) / W * 100).toFixed(2)}% of width, centred on ${((jambMid[0] + jambMid[1]) / 2).toFixed(0)} vs ${W / 2})`);
    console.log(`  apex y=${apex} (${(apex / H * 100).toFixed(1)}%), springline y=${spring} (${(spring / H * 100).toFixed(1)}%)`);
    console.log("  yFrac   left  right  width");
    for (const [f, l, r, w] of rows) console.log(`  ${f}   ${String(l).padStart(5)} ${String(r).padStart(5)} ${String(w).padStart(5)}`);
  }
} finally {
  rmSync(temp, { force: true });
}
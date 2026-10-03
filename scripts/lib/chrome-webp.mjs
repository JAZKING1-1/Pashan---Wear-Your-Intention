// Shared image helper: re-encodes source photographs to responsive WebP using
// a locally installed Chromium (canvas -> toDataURL).
//
// This repository has no image-encoder dependency, and asset preparation must
// not add one, so preparation reuses the Chromium that ships with the
// Playwright browser cache. Override the executable with CHROME_PATH.
//
// Resize and re-encode only: no crop, no retouch, no colour change. Originals
// stay untouched, so any browser framing remains reversible in CSS.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

export function findChrome(root = process.cwd()) {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH))
    return process.env.CHROME_PATH;
  const cache = path.join(
    process.env.LOCALAPPDATA ?? path.join(root, ".cache"),
    "ms-playwright",
  );
  if (!existsSync(cache)) return null;
  for (const entry of readdirSync(cache)) {
    if (!entry.startsWith("chromium-")) continue;
    for (const relative of [
      ["chrome-win64", "chrome.exe"],
      ["chrome-win", "chrome.exe"],
      ["chrome-linux", "chrome"],
      ["chrome-mac", "Chromium.app", "Contents", "MacOS", "Chromium"],
    ]) {
      const candidate = path.join(cache, entry, ...relative);
      if (existsSync(candidate)) return candidate;
    }
  }
  return null;
}

const PAGE = `<!doctype html><meta charset="utf-8"><body><script>
const jobs = __JOBS__;
let pending = jobs.length;
for (const job of jobs) {
  const img = new Image();
  img.onload = () => {
    for (const width of job.widths) {
      const height = Math.round((img.naturalHeight / img.naturalWidth) * width);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      const pre = document.createElement("pre");
      pre.id = "out-" + width;
      pre.textContent = canvas.toDataURL("image/webp", job.quality);
      document.body.appendChild(pre);
    }
    if (--pending === 0) document.title = "DONE";
  };
  img.src = "__SOURCE__";
}
</script></body>`;

/** Returns [{ width, height, buffer }] for the requested widths. */
export function encodeWebp(chrome, sourcePath, { widths, quality, root }) {
  const base64 = readFileSync(sourcePath).toString("base64");
  const html = PAGE.replace("__JOBS__", JSON.stringify([{ widths, quality }])).replace(
    "__SOURCE__",
    "data:image/png;base64," + base64,
  );
  const temp = path.join(root, ".webp-encode.html");
  writeFileSync(temp, html);
  try {
    const dom = execFileSync(
      chrome,
      [
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--hide-scrollbars",
        "--virtual-time-budget=180000",
        "--dump-dom",
        `file:///${temp.replace(/\\/g, "/")}`,
      ],
      { maxBuffer: 1024 * 1024 * 512, encoding: "utf8" },
    );
    const head = readFileSync(sourcePath).readUInt32BE(16);
    const ratio = readFileSync(sourcePath).readUInt32BE(20) / head;
    return widths.map((width) => {
      const match = dom.match(
        new RegExp(`<pre id="out-${width}">data:image/webp;base64,([A-Za-z0-9+/=]+)</pre>`),
      );
      if (!match) throw new Error(`Chromium produced no WebP for ${width}px`);
      return {
        width,
        height: Math.round(width * ratio),
        buffer: Buffer.from(match[1], "base64"),
      };
    });
  } finally {
    rmSync(temp, { force: true });
  }
}
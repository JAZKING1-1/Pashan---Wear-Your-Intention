import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import assert from "node:assert/strict";
const require = createRequire(
  process.env.PASHAN_PLAYWRIGHT_ROOT + "/package.json",
);
const { chromium } = require("playwright");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const measurements = [];
for (const path of ["/", "/collections", "/products/make-your-own"]) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.__lcp = 0;
    window.__cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) window.__lcp = entry.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries())
        if (!entry.hadRecentInput) window.__cls += entry.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto("http://127.0.0.1:8085" + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const data = await page.evaluate(() => ({
    lcpMs: window.__lcp,
    cls: window.__cls,
    domContentLoadedMs:
      performance.getEntriesByType("navigation")[0].domContentLoadedEventEnd,
    resources: performance
      .getEntriesByType("resource")
      .filter((r) => r.name.includes("127.0.0.1"))
      .map((r) => ({
        url: r.name.split("/").pop(),
        bytes: r.encodedBodySize,
        initiator: r.initiatorType,
      })),
    release: document
      .querySelector("[data-release]")
      ?.getAttribute("data-release"),
  }));
  measurements.push({ path, ...data });
  await context.close();
}
const blocked = await browser.newContext({
  viewport: { width: 390, height: 844 },
  reducedMotion: "reduce",
});
await blocked.addInitScript(() => {
  const get = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...args) {
    return /^webgl/.test(type) ? null : get.call(this, type, ...args);
  };
});
const page = await blocked.newPage();
await page.goto("http://127.0.0.1:8085/products/make-your-own", {
  waitUntil: "networkidle",
});
await page
  .getByText("Your design is still here. Showing a simpler preview.", {
    exact: true,
  })
  .waitFor();
await page.getByRole("button", { name: "Add Citrine", exact: true }).click();
assert.equal(
  await page.locator(".atelier").getAttribute("data-bead-count"),
  "1",
);
await browser.close();
writeFileSync(
  "docs/v4-performance.json",
  JSON.stringify(
    {
      profile:
        "One cold-context Chrome headless sample per route. Production Node server on loopback, 390x844, DPR1, no CPU/network throttling. Not field data, not a Lighthouse score; no comparable baseline performance run.",
      webglUnavailable: "Fallback and editing pass with reduced motion",
      measurements,
    },
    null,
    2,
  ),
);
console.log(
  measurements.map(({ path, lcpMs, cls, resources }) => ({
    path,
    lcpMs,
    cls,
    localBytes: resources.reduce((n, r) => n + r.bytes, 0),
  })),
);

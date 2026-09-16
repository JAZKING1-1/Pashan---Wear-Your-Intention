import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
const require = createRequire(
  process.env.PASHAN_PLAYWRIGHT_ROOT + "/package.json",
);
const { chromium } = require("playwright");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
await mkdir("docs/screenshots/rashi", { recursive: true });
for (const width of [390, 1440]) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto("http://127.0.0.1:8084/rashi", { waitUntil: "networkidle" });
  if (process.argv[2] !== "before") {
    await page.locator(".rashi-product-card").last().scrollIntoViewIfNeeded();
    await page.evaluate(() =>
      Promise.all(
        Array.from(document.images).map((img) => {
          img.loading = "eager";
          return img.decode().catch(() => {});
        }),
      ),
    );
    await page.evaluate(() => window.scrollTo(0, 0));
  }
  await page.screenshot({
    path:
      "docs/screenshots/rashi/" +
      (process.argv[2] || "before") +
      "-" +
      width +
      ".png",
    fullPage: true,
  });
  if (process.argv[2] !== "before") {
    await page.screenshot({
      path: "docs/screenshots/rashi/preview-" + width + ".png",
    });
    if (width === 390) {
      await page
        .locator("#rashi-collection")
        .evaluate((el) =>
          el.scrollIntoView({ block: "start", behavior: "instant" }),
        );
      await page.screenshot({
        path: "docs/screenshots/rashi/collection-mobile.png",
      });
    }
  }
}
await browser.close();

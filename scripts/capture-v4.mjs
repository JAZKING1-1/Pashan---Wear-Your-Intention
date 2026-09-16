import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
const require = createRequire(
  process.env.PASHAN_PLAYWRIGHT_ROOT + "/package.json",
);
const { chromium } = require("playwright");
const phase = process.argv[2] || "before";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const out = `docs/screenshots/v4/${phase}`;
mkdirSync(out, { recursive: true });
for (const width of [320, 390, 430, 1440]) {
  const page = await browser.newPage({
    viewport: { width, height: width > 1000 ? 1000 : 844 },
    deviceScaleFactor: 1,
  });
  for (const [name, path] of [
    ["builder", "/products/make-your-own"],
    ["collection", "/collections"],
  ]) {
    await page.goto("http://127.0.0.1:8084" + path, {
      waitUntil: "networkidle",
    });
    if (phase !== "before") {
      await page.evaluate(async () => {
        for (const img of document.querySelectorAll("img")) {
          img.loading = "eager";
        }
        await Promise.all(
          [...document.images].map((img) => img.decode().catch(() => {})),
        );
      });
    }
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({
      path: `${out}/${name}-${width}.png`,
      fullPage: true,
    });
    await page.screenshot({ path: `${out}/${name}-${width}-viewport.png` });
    console.log(
      name,
      width,
      await page.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
      })),
    );
  }
  await page.close();
}
await browser.close();

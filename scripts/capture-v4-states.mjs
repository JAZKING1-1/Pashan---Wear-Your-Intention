import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
const require = createRequire(
  process.env.PASHAN_PLAYWRIGHT_ROOT + "/package.json",
);
const { chromium } = require("playwright");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const out = "docs/screenshots/v4/states";
mkdirSync(out, { recursive: true });
for (const width of [320, 390, 430, 1440]) {
  const page = await browser.newPage({
    viewport: { width, height: width === 1440 ? 1000 : 844 },
  });
  const shot = async (name) => {
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({
      path: `${out}/${name}-${width}.png`,
      fullPage: true,
    });
  };
  await page.goto("http://127.0.0.1:8084/products/make-your-own", {
    waitUntil: "networkidle",
  });
  await shot("sample");
  await page
    .getByRole("button", { name: "Use this sample", exact: true })
    .click();
  await shot("populated");
  await page.locator(".atelier-sequence summary").click();
  await page.locator("[data-bead-id]").nth(2).click();
  await shot("selected");
  await page.getByRole("button", { name: "Done editing", exact: true }).click();
  await page.locator(".atelier-sequence summary").click();
  await page.locator(".atelier-steps button").nth(1).click();
  await page.locator(".atelier-fit-sources button").first().click();
  await page.locator("#atelier-wrist").fill("16.5 cm");
  await shot("fit");
  await page.locator(".atelier-steps button").nth(2).click();
  await shot("review");
  if (width === 390) {
    await page
      .getByRole("button", { name: "Create design card", exact: true })
      .click();
    await page.locator(".atelier-export img").waitFor();
    const wait = page.waitForEvent("download");
    await page.locator(".atelier-export button").first().click();
    await (await wait).saveAs(out + "/sample-export.png");
  }
  await page.goto("http://127.0.0.1:8084/collections", {
    waitUntil: "networkidle",
  });
  await page.locator("[data-product=tiger-eye] button").click();
  await page.locator("[role=dialog] canvas").waitFor();
  await page.screenshot({ path: `${out}/viewer-${width}.png` });
  await page.getByRole("button", { name: "Close-up", exact: true }).click();
  await page.screenshot({ path: `${out}/detail-${width}.png` });
  await page.close();
  console.log("Captured states", width);
}
await browser.close();

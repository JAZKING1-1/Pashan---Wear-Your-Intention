import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(
  process.env.PASHAN_PLAYWRIGHT_ROOT + "/package.json",
);
const { chromium } = require("playwright");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
});
const page = await context.newPage();
page.setDefaultTimeout(10000);
const base = "http://127.0.0.1:8084",
  results = [],
  errors = [];
page.on("pageerror", (error) => errors.push(String(error)));
await mkdir("docs/screenshots/rashi", { recursive: true });
async function test(name, fn) {
  try {
    await fn();
    results.push({ name, status: "pass" });
    console.log("PASS", name);
  } catch (error) {
    results.push({ name, status: "fail", error: String(error) });
    console.log("FAIL", name, String(error));
    await page.screenshot({
      path: "docs/screenshots/rashi/failure-" + results.length + ".png",
    });
  }
}
const visit = (path) => page.goto(base + path, { waitUntil: "networkidle" });
await test("All twelve actual photos, unique detail links and introductory prices", async () => {
  await visit("/rashi");
  assert.equal(await page.locator(".rashi-product-card").count(), 12);
  const links = await page
    .locator(".rashi-card-link")
    .evaluateAll((nodes) => nodes.map((n) => n.getAttribute("href")));
  assert.equal(new Set(links).size, 12);
  for (const image of await page.locator(".rashi-card-photo img").all()) {
    await image.scrollIntoViewIfNeeded();
    await image.evaluate((img) => img.decode());
    assert(await image.evaluate((img) => img.naturalWidth > 0));
  }
  assert.equal(
    await page
      .locator(".rashi-card-price strong")
      .allTextContents()
      .then((values) => values.every((v) => v === "₹899")),
    true,
  );
  assert.equal(await page.locator("del,s").count(), 0);
});
await test("Filter, reload, browser Back and clear preserve query and focus", async () => {
  const aries = page.getByRole("button", { name: "Aries", exact: true });
  await aries.click();
  await page.waitForURL("**/rashi?sign=aries");
  await page
    .locator('.rashi-signs button[aria-pressed="true"]')
    .filter({ hasText: "Aries" })
    .waitFor();
  assert.equal(await aries.getAttribute("aria-pressed"), "true");
  assert(await aries.evaluate((el) => el === document.activeElement));
  await page.getByRole("button", { name: "Scorpio", exact: true }).click();
  await page.waitForURL("**/rashi?sign=scorpio");
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(
    await page.locator(".rashi-product-card h3").innerText(),
    "Scorpio",
  );
  await page.goBack({ waitUntil: "networkidle" });
  await page.waitForURL("**/rashi?sign=aries");
  await page
    .locator(".rashi-product-card h3")
    .filter({ hasText: /^Aries$/ })
    .waitFor();
  assert.equal(
    await page.locator(".rashi-product-card h3").innerText(),
    "Aries",
  );
  await page
    .getByRole("button", { name: "Show all signs", exact: true })
    .click();
  await page.waitForFunction(
    () => document.querySelectorAll(".rashi-product-card").length === 12,
  );
  assert.equal(await page.locator(".rashi-product-card").count(), 12);
});
await test("All twelve detail pages render correct identity, image and enquiry (no live send)", async () => {
  await visit("/rashi");
  const links = await page
    .locator(".rashi-card-link")
    .evaluateAll((nodes) => nodes.map((n) => n.getAttribute("href")));
  assert.equal(links.length, 12);
  for (const link of links) {
    await visit(link);
    assert.equal(await page.locator(".rashi-detail").count(), 1);
    const title = await page.locator("h1").innerText();
    const href = await page
      .getByRole("link", { name: "Enquire on WhatsApp" })
      .getAttribute("href");
    assert(decodeURIComponent(href).includes(title));
    assert(decodeURIComponent(href).includes("₹899"));
    assert.equal(
      await page.locator(".rashi-detail-price strong").innerText(),
      "₹899",
    );
    await page
      .locator(".rashi-detail-photo img")
      .evaluate((img) => img.decode());
  }
  await page
    .getByRole("button", { name: "Enlarge photograph", exact: true })
    .click();
  assert.equal(await page.locator(".rashi-detail-photo.is-zoomed").count(), 1);
  await page
    .getByRole("button", { name: "Show full photograph", exact: true })
    .click();
  await page.screenshot({
    path: "docs/screenshots/rashi/product-mobile.png",
    fullPage: true,
  });
});
await test("Legacy links redirect; invalid sign filter resets; unknown product is not found", async () => {
  await visit("/rakhi/rashi");
  assert.equal(new URL(page.url()).pathname, "/rashi");
  await visit("/rakhi/product/scorpio?action=purchase");
  assert.equal(await page.locator("h1").innerText(), "Scorpio Rashi Rakhi");
  await visit("/rashi?sign=not-a-sign");
  assert.equal(await page.locator(".rashi-product-card").count(), 12);
  const response = await visit("/rakhi/rashi/not-a-sign");
  assert.equal(response.status(), 404);
});
await test("Shared search finds Rashi by English and Hindi and navigates by keyboard", async () => {
  await visit("/rashi");
  await page.getByRole("button", { name: "Search PASHAN" }).click();
  const input = page.getByRole("combobox");
  await input.fill("scorpio");
  await page.getByRole("option", { name: /Scorpio Rashi Rakhi/ }).waitFor();
  await input.press("ArrowDown");
  await input.press("Enter");
  await page.waitForURL("**/rakhi/rashi/scorpio");
  assert.equal(await page.getByRole("dialog").count(), 0);
  await visit("/search?q=" + encodeURIComponent("वृश्चिक"));
  assert.equal(
    await page.locator(".rashi-product-card h3").innerText(),
    "Scorpio",
  );
  await visit("/search?q=rashi");
  assert.equal(await page.locator(".rashi-product-card").count(), 12);
});
await test("Mobile menu traps focus, includes select/summary, closes with Escape and restores focus", async () => {
  await visit("/rashi");
  await page.getByRole("button", { name: "Open menu" }).click();
  const dialog = page.getByRole("dialog", { name: "PASHAN menu" });
  await dialog.waitFor();
  let sawSelect = false,
    sawSummary = false;
  for (let i = 0; i < 42; i++) {
    await page.keyboard.press("Tab");
    const state = await page.evaluate(() => ({
      inside: !!document.activeElement?.closest('[role="dialog"]'),
      tag: document.activeElement?.tagName,
    }));
    assert(state.inside);
    sawSelect ||= state.tag === "SELECT";
    sawSummary ||= state.tag === "SUMMARY";
  }
  assert(sawSelect);
  assert(sawSummary);
  await page.screenshot({ path: "docs/screenshots/rashi/menu-mobile.png" });
  await page.keyboard.press("Escape");
  assert.equal(await dialog.count(), 0);
  assert(
    await page
      .getByRole("button", { name: "Open menu" })
      .evaluate((el) => el === document.activeElement),
  );
});
await test("No page overflow at 320,360,390,768,1440 on catalogue and detail", async () => {
  for (const width of [320, 360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/rashi", "/rakhi/rashi/scorpio"]) {
      await visit(path);
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        width + " " + path + " overflow",
      );
    }
  }
});
await test("Desktop shop is keyboard operated and closes on Escape", async () => {
  await visit("/rashi");
  const shop = page.getByRole("button", { name: "Shop", exact: true });
  await shop.focus();
  await shop.press("Enter");
  await page.getByRole("menu").waitFor();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Escape");
  assert(await shop.evaluate((el) => el === document.activeElement));
});
await test("Primary navigation resolves and stone menu reaches actual product", async () => {
  for (const path of [
    "/",
    "/collections",
    "/products/make-your-own",
    "/about",
    "/journal",
    "/contact",
  ]) {
    const response = await visit(path);
    assert(response.status() < 400, path);
    assert(await page.locator("h1").first().isVisible(), path);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open menu" }).click();
  const dialog = page.getByRole("dialog", { name: "PASHAN menu" });
  await dialog.locator("summary").filter({ hasText: "Shop by stone" }).click();
  await dialog.getByRole("link", { name: "Tiger Eye", exact: true }).click();
  await page.waitForURL("**/products/tiger-eye");
  await page.locator("h1").filter({ hasText: /tiger/i }).first().waitFor();
  assert.match(await page.locator("h1").first().innerText(), /tiger/i);
});
await test("Reduced motion note reveal is immediate, accessible, ungated; page has no canvas", async () => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await visit("/rashi?sign=aries");
  await page
    .getByRole("button", { name: "A moment for you", exact: true })
    .click();
  assert(await page.locator("#rashi-note").isVisible());
  assert.equal(
    await page
      .locator("#rashi-note")
      .evaluate((el) => getComputedStyle(el).animationName),
    "none",
  );
  assert.equal(await page.locator("canvas").count(), 0);
});
await test("Server-rendered catalogue remains visible without JavaScript", async () => {
  const nojs = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await nojs.newPage();
  await staticPage.goto(base + "/rashi");
  assert.equal(await staticPage.locator(".rashi-product-card").count(), 12);
  assert(await staticPage.locator("h1").isVisible());
  await nojs.close();
});
await test("No uncaught browser errors across tested paths", async () =>
  assert.deepEqual(errors, []));
await writeFile(
  "docs/rashi-test-results.json",
  JSON.stringify(results, null, 2) + "\n",
);
await browser.close();
if (results.some((result) => result.status === "fail")) process.exitCode = 1;

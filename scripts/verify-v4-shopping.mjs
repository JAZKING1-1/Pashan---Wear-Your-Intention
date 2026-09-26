import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import assert from "node:assert/strict";
const require = createRequire(
  process.env.PASHAN_PLAYWRIGHT_ROOT + "/package.json",
);
const { chromium } = require("playwright");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});
const page = await context.newPage();
const base = "http://127.0.0.1:8084";
const results = [];
page.setDefaultTimeout(12000);
async function test(name, fn) {
  try {
    await fn();
    results.push({ name, status: "pass" });
    console.log("PASS", name);
  } catch (e) {
    results.push({ name, status: "fail", error: String(e) });
    console.log("FAIL", name, String(e));
  }
}
await test("Standard product add, reload, quantity, checkout form and remove without submitting", async () => {
  await page.goto(base + "/products/pyrite", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /^Add to bag/ }).click();
  await page.goto(base + "/cart", { waitUntil: "networkidle" });
  await page
    .getByRole("main")
    .getByRole("button", { name: "Increase", exact: true })
    .click();
  await page.reload({ waitUntil: "networkidle" });
  let cart = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("pashan-cart-v1")),
  );
  assert.equal(cart[0].slug, "pyrite");
  assert.equal(cart[0].qty, 2);
  await page
    .getByRole("link", { name: "Proceed to Checkout", exact: true })
    .click();
  await page.getByLabel("Email", { exact: true }).waitFor();
  assert(await page.getByLabel("Address", { exact: true }).isVisible());
  assert.equal(await page.locator("iframe[src*=razorpay]").count(), 0);
  await page.goto(base + "/cart", { waitUntil: "networkidle" });
  await page
    .getByRole("main")
    .getByRole("button", { name: "Remove", exact: true })
    .click();
  await page
    .getByText("Your cart is quiet for now.", { exact: true })
    .waitFor();
});
await test("Mounted homepage and related cards navigate; no Three.js scene requested by homepage", async () => {
  const requested = [];
  const response = (r) => requested.push(r.url());
  page.on("request", response);
  await page.goto(base + "/", { waitUntil: "networkidle" });
  assert((await page.locator(".atelier-card").count()) > 0);
  assert.equal(await page.locator("canvas").count(), 0);
  assert(
    !requested.some((u) =>
      /createBraceletScene|three\.js|BraceletScene3D/.test(u),
    ),
  );
  page.off("request", response);
  await page.locator(".atelier-card a.atelier-card-action").first().click();
  await page.locator(".product-purchase").waitFor();
  assert.equal(await page.locator(".atelier-card").count(), 3);
  await page.locator(".atelier-card a.atelier-card-action").first().click();
  assert(!page.url().includes("undefined"));
});
await test("Touch and keyboard, no pointer scroll capture; repeated viewer disposal", async () => {
  await page.goto(base + "/products/make-your-own", {
    waitUntil: "networkidle",
  });
  const add = page.getByRole("button", { name: "Add Citrine", exact: true });
  await add.focus();
  await page.keyboard.press("Enter");
  assert.equal(
    await page.locator(".atelier").getAttribute("data-bead-count"),
    "1",
  );
  await page.getByRole("button", { name: "Add Amethyst", exact: true }).tap();
  assert.equal(
    await page.locator(".atelier").getAttribute("data-bead-count"),
    "2",
  );
  assert.equal(
    await page
      .locator(".atelier-stage")
      .evaluate((e) => getComputedStyle(e).touchAction),
    "pan-y pinch-zoom",
  );
  await page.locator(".atelier-stage").scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 150);
  await page.waitForTimeout(200);
  assert((await page.evaluate(() => scrollY)) > 0);
  await page.goto(base + "/collections", { waitUntil: "networkidle" });
  for (let i = 0; i < 4; i++) {
    await page.locator("[data-product=tiger-eye] button").tap();
    await page.locator("[role=dialog] canvas").waitFor();
    assert.equal(await page.locator("canvas").count(), 1);
    await page
      .getByRole("button", { name: "Close viewer", exact: true })
      .click();
    assert.equal(await page.locator("canvas").count(), 0);
  }
});
await test("Primary photograph failure uses alternate original photograph", async () => {
  await page.route("**/images/originals/pyrite-1-*.webp", (r) => r.abort());
  await page.goto(base + "/collections", { waitUntil: "networkidle" });
  await page.locator("[data-product=pyrite]").scrollIntoViewIfNeeded();
  await page.waitForFunction(() => {
    const e = document.querySelector("[data-product=pyrite] img");
    return e?.dataset.fallback === "true" && e.complete && e.naturalWidth > 0;
  });
  assert.match(
    await page.locator("[data-product=pyrite] img").getAttribute("src"),
    /pyrite-2-960\.webp$/,
  );
  await page.unroute("**/images/originals/pyrite-1-*.webp");
});
await browser.close();
writeFileSync(
  "docs/v4-shopping-results.json",
  JSON.stringify(results, null, 2),
);
if (results.some((r) => r.status === "fail")) process.exitCode = 1;

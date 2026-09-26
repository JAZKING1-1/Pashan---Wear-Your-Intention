import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";

const base = "https://pashan-wear-your-intention.onrender.com";
const expected = process.env.PASHAN_EXPECTED_RELEASE;
assert(
  expected && /^[a-f0-9]{40}$/.test(expected),
  "PASHAN_EXPECTED_RELEASE must be the exact 40-character published commit SHA",
);
assert(
  process.env.PASHAN_PLAYWRIGHT_ROOT,
  "PASHAN_PLAYWRIGHT_ROOT is required",
);
const require = createRequire(
  process.env.PASHAN_PLAYWRIGHT_ROOT + "/package.json",
);
const { chromium } = require("playwright");
const output = "docs/screenshots/responsive-atelier";
const requiredPaths = [
  "/",
  "/collections",
  "/products/amethyst",
  "/rashi",
  "/rakhi/sacred",
];
const results = [];
const browserErrors = [];
const blockedRequests = [];
const captures = [];
const browser = await chromium.launch({ channel: "chrome", headless: true });

class ReleaseMismatch extends Error {}

async function createProfile(name, width, height, hasTouch) {
  const context = await browser.newContext({
    viewport: { width, height },
    hasTouch,
    serviceWorkers: "block",
    extraHTTPHeaders: { "Cache-Control": "no-cache" },
  });
  // Fresh isolated contexts only. Never let this live check send an order,
  // message, email subscription, analytics POST or other mutation request.
  await context.route("**/*", async (route) => {
    const request = route.request();
    if (!["GET", "HEAD"].includes(request.method())) {
      const url = new URL(request.url());
      blockedRequests.push({
        profile: name,
        method: request.method(),
        url: url.origin + url.pathname,
        resourceType: request.resourceType(),
        blocked: true,
      });
      await route.abort("blockedbyclient");
      return;
    }
    await route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on("pageerror", (error) => {
    browserErrors.push({ profile: name, message: String(error) });
  });
  return { name, context, page };
}

async function exactRelease(page) {
  const marker = page.locator("[data-release]").first();
  const observed = (await marker.count())
    ? await marker.getAttribute("data-release")
    : null;
  if (observed !== expected) {
    throw new ReleaseMismatch(
      `Refusing evidence writes: expected ${expected}, observed ${observed ?? "no release marker"} at ${new URL(page.url()).pathname}`,
    );
  }
  return observed;
}

async function visit(page, path) {
  const response = await page.goto(base + path, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  // Every visited document must identify itself before any test evidence is used.
  const observed = await exactRelease(page);
  assert.equal(response.status(), 200, path + " must return HTTP 200");
  await page.evaluate(() => document.fonts.ready);
  return { path, httpStatus: response.status(), release: observed };
}

async function test(name, run) {
  try {
    const evidence = await run();
    results.push({ name, status: "pass", evidence });
    console.log("PASS", name);
  } catch (error) {
    // A deployment change aborts the entire run, without writing even partial
    // screenshots or results. Ordinary check failures can be reported honestly.
    if (error instanceof ReleaseMismatch) throw error;
    results.push({ name, status: "fail", error: String(error) });
    console.log("FAIL", name, String(error));
  }
}

async function pageLayout(page) {
  const evidence = await page.evaluate(() => ({
    width: innerWidth,
    height: innerHeight,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
    anyCoarse: matchMedia("(any-pointer: coarse)").matches,
    fine: matchMedia("(pointer: fine)").matches,
  }));
  assert(evidence.documentWidth <= evidence.width + 1, "No document overflow");
  assert(evidence.bodyWidth <= evidence.width + 1, "No body overflow");
  return evidence;
}

async function visibleDock(page) {
  const dock = page.locator(".pashan-mobile-dock");
  await dock.waitFor({ state: "visible" });
  const links = await dock.locator("a").evaluateAll((nodes) =>
    nodes.map((node) => {
      const box = node.getBoundingClientRect();
      return {
        label: node.textContent.trim(),
        href: node.getAttribute("href"),
        width: box.width,
        height: box.height,
      };
    }),
  );
  assert.deepEqual(
    links.map(({ label, href }) => ({ label, href })),
    [
      { label: "Shop", href: "/collections" },
      { label: "Find", href: "/find-your-bracelet" },
      { label: "Create", href: "/products/make-your-own" },
    ],
  );
  assert(links.every((link) => link.width >= 44 && link.height >= 44));
  const box = await dock.boundingBox();
  assert(box.x >= -1 && box.x + box.width <= page.viewportSize().width + 1);
  assert(box.y + box.height <= page.viewportSize().height + 1);
  return { label: await dock.getAttribute("aria-label"), links, box };
}

async function captureHome(page, name) {
  const portal = page.locator(".portal-arch");
  if (await portal.count()) {
    await portal.scrollIntoViewIfNeeded();
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    await page.locator(".portal-doors").waitFor({ state: "detached" });
  }
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur();
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.waitForFunction(() => Math.abs(scrollY) < 1);
  await exactRelease(page);
  // Keep pixels in memory until the complete run passes its final SHA guard.
  captures.push({ name, data: await page.screenshot() });
}

try {
  const tablet = await createProfile("tablet820-touch", 820, 1180, true);

  // All five routes must identify the exact expected release before any mkdir,
  // screenshot write or report write. Existing evidence is left untouched otherwise.
  for (const path of requiredPaths) {
    const evidence = await visit(tablet.page, path);
    results.push({
      name: "HTTP 200 and exact release " + path,
      status: "pass",
      evidence,
    });
    console.log("PASS", "HTTP 200 and exact release", path);
  }

  await test("820px touch tablet has three usable dock links and compact header", async () => {
    await visit(tablet.page, "/");
    const layout = await pageLayout(tablet.page);
    assert(layout.anyCoarse, "This profile must exercise coarse-pointer CSS");
    const dock = await visibleDock(tablet.page);
    assert.equal(await tablet.page.locator(".header-nav").isVisible(), false);
    assert.equal(
      await tablet.page
        .getByRole("button", { name: "Open menu", exact: true })
        .isVisible(),
      true,
    );
    await captureHome(tablet.page, "live-tablet820");
    return { layout, dock };
  });

  await test("Tablet menu opens, has its Rashi link, closes and restores focus", async () => {
    const opener = tablet.page.getByRole("button", {
      name: "Open menu",
      exact: true,
    });
    await opener.click();
    const dialog = tablet.page.getByRole("dialog", {
      name: "PASHAN menu",
      exact: true,
    });
    await dialog.waitFor({ state: "visible" });
    assert.equal(
      await tablet.page.locator(".pashan-mobile-dock").isVisible(),
      false,
    );
    assert.equal(
      await dialog
        .getByRole("link", { name: "Rashi collection", exact: true })
        .count(),
      1,
    );
    await dialog.locator(".mobile-nav-details summary").first().click();
    assert.equal(
      await dialog.locator(".mobile-nav-details").first().getAttribute("open"),
      "",
    );
    await tablet.page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    await tablet.page.waitForFunction(
      () => document.activeElement?.getAttribute("aria-label") === "Open menu",
    );
    await visibleDock(tablet.page);
    return {
      opened: true,
      rashiLinkCount: 1,
      detailsOpened: true,
      escapeReturnsFocus: true,
    };
  });

  await test("Tablet search finds a real product and restores its opener on Escape", async () => {
    await tablet.page
      .getByRole("button", { name: "Search PASHAN", exact: true })
      .click();
    const dialog = tablet.page.getByRole("dialog", {
      name: "Search PASHAN",
      exact: true,
    });
    await dialog.waitFor({ state: "visible" });
    assert.equal(
      await tablet.page.locator(".pashan-mobile-dock").isVisible(),
      false,
    );
    await dialog.getByRole("combobox").fill("amethyst");
    const option = dialog.getByRole("option", { name: /Amethyst/i }).first();
    await option.waitFor({ state: "visible" });
    const photo = option.locator('[data-photo-slug="amethyst"] img');
    await photo.evaluate((node) => node.decode());
    assert(await photo.evaluate((node) => node.naturalWidth > 0));
    await tablet.page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    await tablet.page.waitForFunction(
      () => document.activeElement?.id === "pashan-search-trigger",
    );
    await visibleDock(tablet.page);
    return {
      query: "amethyst",
      realOriginalThumbnail: true,
      escapeReturnsFocus: true,
    };
  });

  await test("Collection original photographs load in shared square frames", async () => {
    await visit(tablet.page, "/collections");
    const frames = tablet.page.locator(".atelier-card .catalogue-photo");
    assert.equal(await frames.count(), 8);
    const photos = [];
    for (const frame of await frames.all()) {
      await frame.scrollIntoViewIfNeeded();
      const img = frame.locator("img");
      await img.evaluate((node) => node.decode());
      const evidence = await frame.evaluate((node) => {
        const box = node.getBoundingClientRect();
        const image = node.querySelector("img");
        return {
          slug: node.getAttribute("data-photo-slug"),
          width: box.width,
          height: box.height,
          source: new URL(image.currentSrc).pathname,
          naturalWidth: image.naturalWidth,
          position: getComputedStyle(image).position,
        };
      });
      assert(Math.abs(evidence.width - evidence.height) < 2);
      assert(evidence.naturalWidth > 0);
      assert(evidence.source.startsWith("/images/originals/"));
      assert.equal(evidence.position, "absolute");
      photos.push(evidence);
    }
    return { layout: await pageLayout(tablet.page), photos };
  });

  const phone = await createProfile("phone390-touch", 390, 844, true);
  await test("390px phone remains usable with the same three-link dock", async () => {
    await visit(phone.page, "/");
    const layout = await pageLayout(phone.page);
    const dock = await visibleDock(phone.page);
    await captureHome(phone.page, "live-home390");
    return { layout, dock };
  });

  const desktop = await createProfile("desktop1440-fine", 1440, 1000, false);
  await test("1440px fine-pointer desktop keeps full navigation and no dock", async () => {
    await visit(desktop.page, "/");
    const layout = await pageLayout(desktop.page);
    assert(layout.fine && !layout.anyCoarse);
    assert.equal(
      await desktop.page.locator(".pashan-mobile-dock").isVisible(),
      false,
    );
    assert.equal(await desktop.page.locator(".header-nav").isVisible(), true);
    await captureHome(desktop.page, "live-desktop1440");
    return layout;
  });

  // Detect a concurrent rolling deployment before committing any evidence files.
  for (const path of requiredPaths) await visit(tablet.page, path);
  await test("No uncaught page errors during live read-only verification", async () => {
    assert.deepEqual(browserErrors, []);
    return { browserErrors };
  });
  await test("All non-GET/HEAD requests were blocked before transmission", async () => {
    assert(blockedRequests.every((request) => request.blocked));
    return {
      serviceWorkersBlocked: true,
      blockedCount: blockedRequests.length,
      blockedRequests,
    };
  });

  const summary = {
    passed: results.filter((result) => result.status === "pass").length,
    failed: results.filter((result) => result.status === "fail").length,
  };
  const report = {
    url: base,
    expectedRelease: expected,
    verifiedAt: new Date().toISOString(),
    scope:
      "Read-only production route/release, tablet/phone/desktop navigation and original-photo framing checks. Fresh browser contexts; all non-GET/HEAD requests blocked; no orders, email, campaigns or deploy triggers.",
    summary,
    screenshots: captures.map(({ name }) => output + "/" + name + ".png"),
    results,
    browserErrors,
    blockedRequests,
  };
  // These are deliberately the first filesystem writes in the entire run.
  await mkdir(output, { recursive: true });
  for (const capture of captures)
    await writeFile(output + "/" + capture.name + ".png", capture.data);
  await writeFile(
    "docs/responsive-live-results.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(summary));
  if (summary.failed) process.exitCode = 1;
} catch (error) {
  console.error(String(error));
  console.error(
    "Live evidence was not written; existing evidence is unchanged.",
  );
  process.exitCode = 1;
} finally {
  await browser.close();
}

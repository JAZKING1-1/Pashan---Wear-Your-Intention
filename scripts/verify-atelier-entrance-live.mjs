import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";

const base = "https://pashan-wear-your-intention.onrender.com";
const expected = process.env.PASHAN_EXPECT_COMMIT;
assert(
  expected && /^[a-f0-9]{40}$/.test(expected),
  "PASHAN_EXPECT_COMMIT must be the exact 40-character published commit SHA",
);
assert(
  process.env.PASHAN_PLAYWRIGHT_ROOT,
  "PASHAN_PLAYWRIGHT_ROOT is required",
);
const require = createRequire(
  process.env.PASHAN_PLAYWRIGHT_ROOT + "/package.json",
);
const { chromium } = require("playwright");
const output = "docs/screenshots/atelier-entrance";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [],
  screenshots = [],
  errors = [],
  blockedRequests = [];
class ReleaseMismatch extends Error {}

async function fresh(name, width, height, options = {}) {
  const context = await browser.newContext({
    viewport: { width, height },
    hasTouch: width < 1000,
    serviceWorkers: "block",
    extraHTTPHeaders: { "Cache-Control": "no-cache" },
    ...options,
  });
  // Never attach to the owner's browser. Server writes are prevented even if
  // a future app effect attempts one without an intentional form action.
  await context.route("**/*", async (route) => {
    const request = route.request();
    if (!["GET", "HEAD"].includes(request.method())) {
      const url = new URL(request.url());
      blockedRequests.push({
        profile: name,
        method: request.method(),
        url: url.origin + url.pathname,
        blocked: true,
      });
      await route.abort("blockedbyclient");
    } else await route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on("pageerror", (error) =>
    errors.push({ profile: name, error: String(error) }),
  );
  return { context, page };
}
async function exactRelease(page) {
  const marker = page
    .locator("footer [data-release],footer[data-release]")
    .first();
  const observed = (await marker.count())
    ? await marker.getAttribute("data-release")
    : null;
  if (observed !== expected)
    throw new ReleaseMismatch(
      `Expected ${expected}; served ${observed ?? "no footer release marker"}. Existing evidence will not be overwritten.`,
    );
  return observed;
}
async function visit(page, path = "/") {
  const response = await page.goto(base + path, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await exactRelease(page);
  assert.equal(response.status(), 200);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => {
    document.activeElement?.blur();
    scrollTo({ top: 0, behavior: "instant" });
  });
  return { path, status: response.status(), release: expected };
}
async function test(name, action) {
  try {
    const evidence = await action();
    results.push({ name, status: "pass", evidence });
    console.log("PASS", name);
  } catch (error) {
    if (error instanceof ReleaseMismatch) throw error;
    results.push({ name, status: "fail", error: String(error) });
    console.log("FAIL", name, String(error));
  }
}
async function layout(page) {
  const evidence = await page.evaluate(() => ({
    viewport: innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  assert(
    evidence.documentWidth <= evidence.viewport + 1 &&
      evidence.bodyWidth <= evidence.viewport + 1,
    "No horizontal overflow",
  );
  return evidence;
}
async function take(page, name, selector) {
  await exactRelease(page);
  screenshots.push({
    name,
    data: selector
      ? await page.locator(selector).screenshot()
      : await page.screenshot(),
  });
}
async function portalVisible(page) {
  await page.locator(".portal-arch").evaluate((node) =>
    scrollTo({
      top:
        scrollY +
        node.getBoundingClientRect().top -
        document.querySelector(".site-header").getBoundingClientRect().height -
        12,
      behavior: "instant",
    }),
  );
}
async function completeHero(page, name) {
  const previous = page.viewportSize();
  const hero = page.locator(".ritual-hero");
  const height = await hero.evaluate(
    (node) =>
      node.getBoundingClientRect().height +
      document.querySelector(".site-header").getBoundingClientRect().height +
      200,
  );
  await page.setViewportSize({
    width: previous.width,
    height: Math.ceil(height),
  });
  await hero.evaluate((node) =>
    scrollTo({
      top:
        scrollY +
        node.getBoundingClientRect().top -
        document.querySelector(".site-header").getBoundingClientRect().height -
        12,
      behavior: "instant",
    }),
  );
  await take(page, name, ".ritual-hero");
  await page.setViewportSize(previous);
}

try {
  for (const profile of [
    { name: "phone-390", width: 390, height: 844 },
    { name: "tablet-820", width: 820, height: 1180 },
    { name: "desktop-1440", width: 1440, height: 1000 },
  ]) {
    const { context, page } = await fresh(
      profile.name,
      profile.width,
      profile.height,
      { reducedMotion: "reduce" },
    );
    try {
      await visit(page);
      await test(
        profile.name +
          ": exact new release, original image, reduced motion and reflow",
        async () => {
          assert.equal(await page.locator(".portal-atelier").count(), 1);
          assert.equal(
            await page
              .locator(".ritual-portal")
              .getAttribute("data-portal-duration"),
            "2400",
          );
          assert.equal(
            await page
              .getByRole("button", { name: "Entrance motion off", exact: true })
              .isDisabled(),
            true,
          );
          assert.equal(await page.locator(".portal-doors").count(), 0);
          const image = await page
            .locator(".portal-arch img")
            .evaluate(async (node) => {
              await node.decode();
              return {
                source: node.currentSrc,
                naturalWidth: node.naturalWidth,
                alt: node.alt,
              };
            });
          assert(
            image.source.includes("/images/originals/tiger-eye-1-") &&
              image.naturalWidth > 0,
          );
          const dock = page.getByRole("navigation", {
            name: "Quick navigation",
            exact: true,
          });
          assert.equal(await dock.isVisible(), profile.width < 1440);
          if (profile.width < 1440)
            assert.deepEqual(
              (await dock.locator("a").allTextContents()).map((value) =>
                value.trim(),
              ),
              ["Shop", "Find", "Create"],
            );
          const evidence = await layout(page);
          await take(page, "live-home-" + profile.name);
          await completeHero(page, "live-hero-complete-" + profile.name);
          return { release: expected, image, ...evidence };
        },
      );
      await test(
        profile.name +
          ": atmosphere choices respond without changing the product photograph",
        async () => {
          const group = page.getByRole("group", {
            name: "Choose the atmosphere",
            exact: true,
          });
          const original = await page
            .locator(".portal-arch img")
            .getAttribute("src");
          const choices = [];
          for (const name of ["Inspiration", "Joy", "Calm"]) {
            const button = group.getByRole("button", { name, exact: true });
            await button.focus();
            await page.keyboard.press("Enter");
            assert.equal(await button.getAttribute("aria-pressed"), "true");
            assert.equal(
              await group.locator('[aria-pressed="true"]').count(),
              1,
            );
            assert.equal(
              await page
                .locator(".ritual-hero")
                .getAttribute("data-atmosphere"),
              name.toLowerCase(),
            );
            assert.equal(
              await page.locator(".portal-arch img").getAttribute("src"),
              original,
            );
            await layout(page);
            choices.push(name);
          }
          return choices;
        },
      );
      if (profile.width === 390) {
        await test("Live phone search opens, suppresses dock and returns focus on Escape", async () => {
          const opener = page.getByRole("button", {
            name: "Search PASHAN",
            exact: true,
          });
          await opener.click();
          const dialog = page.getByRole("dialog", {
            name: "Search PASHAN",
            exact: true,
          });
          await dialog.waitFor();
          assert.equal(
            await page
              .getByRole("navigation", {
                name: "Quick navigation",
                exact: true,
              })
              .isVisible(),
            false,
          );
          await page.keyboard.press("Escape");
          await dialog.waitFor({ state: "hidden" });
          assert.equal(
            await opener.evaluate((node) => node === document.activeElement),
            true,
          );
          assert.equal(
            await page
              .getByRole("navigation", {
                name: "Quick navigation",
                exact: true,
              })
              .isVisible(),
            true,
          );
          return { focusRestored: true };
        });
        await test("Live finder and bracelet-making routes remain reachable", async () => {
          await page
            .locator('.ritual-hero-actions a[href="/find-your-bracelet"]')
            .click();
          await page.waitForURL("**/find-your-bracelet");
          await exactRelease(page);
          await page.locator('[data-finder-ready="true"]').waitFor();
          await page
            .getByRole("navigation", { name: "Quick navigation", exact: true })
            .getByRole("link", { name: "Create", exact: true })
            .click();
          await page.waitForURL("**/products/make-your-own");
          await exactRelease(page);
          await page.locator('.atelier-viewer[data-ready="true"]').waitFor();
          assert.equal(
            await page
              .getByText("Explore every angle", { exact: true })
              .count(),
            1,
          );
          return { finder: true, builder: true, sampleNotSaved: true };
        });
      }
      await exactRelease(page);
    } finally {
      await context.close();
    }
  }
  const motion = await fresh("finite-motion", 1440, 1000);
  try {
    await visit(motion.page);
    await portalVisible(motion.page);
    await motion.page.waitForFunction(
      () => sessionStorage.getItem("pashan-portal-seen-v2") === "1",
    );
    await motion.page.locator(".portal-doors").waitFor({ state: "detached" });
    await test("Live replay is visible, nonmodal and immediately skippable", async () => {
      const page = motion.page;
      await page
        .getByRole("button", { name: "Replay entrance", exact: true })
        .click();
      await page.locator(".ritual-portal.is-playing").waitFor();
      const animations = await page
        .locator(".ritual-portal")
        .evaluate(
          (node) =>
            node
              .getAnimations({ subtree: true })
              .filter((animation) => animation.playState === "running").length,
        );
      assert(animations > 0);
      const body = await page.evaluate(() => ({
        overflow: getComputedStyle(document.body).overflowY,
        modal: document.querySelectorAll(
          "[role=dialog][data-state=open],[aria-modal=true]",
        ).length,
      }));
      assert(!["hidden", "clip"].includes(body.overflow));
      assert.equal(body.modal, 0);
      await take(page, "live-portal-playing-1440", ".ritual-portal");
      const start = Date.now();
      await page
        .getByRole("button", { name: "Skip entrance", exact: true })
        .click();
      await page.locator(".portal-doors").waitFor({ state: "detached" });
      assert(Date.now() - start < 700);
      return { animations, ...body, skipMs: Date.now() - start };
    });
    await test("Live entrance does not autoplay again on reload", async () => {
      await motion.page.reload({ waitUntil: "networkidle" });
      await exactRelease(motion.page);
      await portalVisible(motion.page);
      assert.equal(await motion.page.locator(".portal-doors").count(), 0);
      assert.equal(
        await motion.page.evaluate(() =>
          sessionStorage.getItem("pashan-portal-seen-v2"),
        ),
        "1",
      );
      return { replayOnly: true };
    });
  } finally {
    await motion.context.close();
  }
  const guard = await fresh("final-release-guard", 390, 844, {
    reducedMotion: "reduce",
  });
  try {
    await visit(guard.page);
  } finally {
    await guard.context.close();
  }
  await test("No uncaught browser errors", async () => {
    assert.deepEqual(errors, []);
    return errors;
  });
  await test("Read-only isolated browser safety", async () => {
    assert(blockedRequests.every((item) => item.blocked));
    return {
      isolatedContexts: true,
      serviceWorkersBlocked: true,
      allowedMethods: ["GET", "HEAD"],
      blockedRequests,
    };
  });
  const summary = {
    passed: results.filter((item) => item.status === "pass").length,
    failed: results.filter((item) => item.status === "fail").length,
  };
  // Only write after the exact served commit matches again at the end.
  await mkdir(output, { recursive: true });
  for (const screenshot of screenshots)
    await writeFile(output + "/" + screenshot.name + ".png", screenshot.data);
  await writeFile(
    "docs/atelier-entrance-live-results.json",
    JSON.stringify(
      {
        url: base,
        expectedCommit: expected,
        verifiedAt: new Date().toISOString(),
        summary,
        results,
        errors,
        blockedRequests,
        screenshots: screenshots.map(
          (item) => output + "/" + item.name + ".png",
        ),
        scope:
          "Public release smoke checks only. Disposable browser contexts, no owner session, no server writes, purchases, email, saves or enquiries.",
        limitations: [
          "Complete hero screenshots use a taller same-width viewport; normal viewport previews are separate.",
          "Public UI validation is not a server metrics or order-processing audit.",
        ],
      },
      null,
      2,
    ) + "\n",
  );
  console.log(JSON.stringify(summary));
  if (summary.failed) process.exitCode = 1;
} catch (error) {
  console.error(String(error));
  console.error("No live evidence written; existing evidence preserved.");
  process.exitCode = 1;
} finally {
  await browser.close();
}

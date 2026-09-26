import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";

const base = "https://pashan-wear-your-intention.onrender.com";
const path = "/products/make-your-own";
const expected = process.env.PASHAN_EXPECT_COMMIT;
assert(
  expected && /^[a-f0-9]{40}$/.test(expected),
  "PASHAN_EXPECT_COMMIT must contain the exact 40-character published commit SHA",
);
assert(
  process.env.PASHAN_PLAYWRIGHT_ROOT,
  "PASHAN_PLAYWRIGHT_ROOT is required",
);
const require = createRequire(
  process.env.PASHAN_PLAYWRIGHT_ROOT + "/package.json",
);
const { chromium } = require("playwright");
const output = "docs/screenshots/atelier-360";
const results = [],
  screenshots = [],
  browserErrors = [],
  blockedRequests = [];
const browser = await chromium.launch({ channel: "chrome", headless: true });

class ReleaseMismatch extends Error {}
async function createProfile(name, width, height, hasTouch) {
  // Never attach to the owner's browser/profile. All state is disposable.
  const context = await browser.newContext({
    viewport: { width, height },
    hasTouch,
    isMobile: hasTouch,
    serviceWorkers: "block",
    extraHTTPHeaders: { "Cache-Control": "no-cache" },
  });
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
      return;
    }
    await route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on("pageerror", (error) =>
    browserErrors.push({ profile: name, error: String(error) }),
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
      `Expected ${expected}; observed ${observed ?? "no footer release marker"} at ${page.url()}. Existing evidence will not be overwritten.`,
    );
  return observed;
}
async function visit(page, route = path) {
  const response = await page.goto(base + route, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  const release = await exactRelease(page);
  assert.equal(response.status(), 200);
  await page.evaluate(() => document.fonts.ready);
  if (route === path)
    await page.locator('.atelier-viewer[data-ready="true"]').waitFor();
  return { route, httpStatus: response.status(), release };
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
async function pose(page) {
  return page.locator(".atelier-canvas").evaluate((node) => ({
    yaw: Number(node.dataset.yaw),
    tilt: Number(node.dataset.tilt),
    zoom: Number(node.dataset.zoom),
    touring: node.dataset.touring,
    drawCount: Number(node.dataset.drawCount),
  }));
}
async function positionViewer(page) {
  await page.locator(".atelier-stage").evaluate((node) =>
    scrollTo({
      top:
        scrollY +
        node.getBoundingClientRect().top -
        document.querySelector(".site-header").getBoundingClientRect().bottom -
        16,
      behavior: "instant",
    }),
  );
}
async function layout(page) {
  const evidence = await page.evaluate(() => ({
    width: innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  assert(
    evidence.documentWidth <= evidence.width + 1 &&
      evidence.bodyWidth <= evidence.width + 1,
    "No horizontal page overflow",
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
async function captureWorkbench(page, name) {
  const previous = page.viewportSize();
  const workbench = page.locator(".atelier-workbench");
  const height = await workbench.evaluate(
    (node) =>
      node.getBoundingClientRect().height +
      document.querySelector(".site-header").getBoundingClientRect().height +
      200,
  );
  await page.setViewportSize({
    width: previous.width,
    height: Math.ceil(height),
  });
  await workbench.evaluate((node) =>
    scrollTo({
      top:
        node.getBoundingClientRect().top +
        scrollY -
        document.querySelector(".site-header").getBoundingClientRect().height -
        12,
      behavior: "instant",
    }),
  );
  await take(page, name, ".atelier-workbench");
  await page.setViewportSize(previous);
}
async function touchSwipe(page, start, finish) {
  const session = await page.context().newCDPSession(page);
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: start.x, y: start.y, id: 1 }],
  });
  for (let step = 1; step <= 12; step++) {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        {
          x: start.x + ((finish.x - start.x) * step) / 12,
          y: start.y + ((finish.y - start.y) * step) / 12,
          id: 1,
        },
      ],
    });
    await page.waitForTimeout(18);
  }
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await session.detach();
}
try {
  const profiles = [
    { name: "phone-390", width: 390, height: 844, hasTouch: true },
    { name: "tablet-820", width: 820, height: 1180, hasTouch: true },
    { name: "desktop-1440", width: 1440, height: 1000, hasTouch: false },
  ];
  for (const item of profiles) {
    const { context, page } = await createProfile(
      item.name,
      item.width,
      item.height,
      item.hasTouch,
    );
    const release = await visit(page);
    await test(
      item.name + ": exact live release and responsive 360 controls",
      async () => {
        assert.equal(
          await page
            .locator(".atelier-viewer-heading")
            .getByText("Explore every angle", { exact: true })
            .count(),
          1,
        );
        assert.equal(
          await page
            .getByRole("button", { name: "Turn once", exact: true })
            .isEnabled(),
          true,
        );
        assert.equal(
          await page.locator(".atelier-viewer").getAttribute("data-view"),
          "collection",
        );
        assert.equal(
          await page.locator(".atelier-stage").getAttribute("tabindex"),
          "0",
        );
        const controls = await page
          .locator(".atelier-viewer button")
          .evaluateAll((nodes) =>
            nodes.map((node) => ({
              label: node.getAttribute("aria-label") || node.textContent.trim(),
              width: node.getBoundingClientRect().width,
              height: node.getBoundingClientRect().height,
            })),
          );
        assert(
          controls.every((button) => button.width >= 44 && button.height >= 44),
        );
        const responsive = await layout(page);
        await page.evaluate(() => {
          document.activeElement?.blur();
          scrollTo({ top: 0, behavior: "instant" });
        });
        await take(page, "live-sample-" + item.name);
        await captureWorkbench(page, "live-workbench-" + item.name);
        return { ...release, responsive, controls };
      },
    );
    // This only adopts the illustrative sample in an isolated React state.
    // Do not save, add to bag, enquire, subscribe, export or call an API.
    await page
      .getByRole("button", { name: "Use this sample", exact: true })
      .click();
    assert.equal(
      await page.locator(".atelier").getAttribute("data-bead-count"),
      "18",
    );
    if (item.hasTouch) {
      await test(
        item.name +
          ": real horizontal touch rotates without selecting or scrolling",
        async () => {
          await positionViewer(page);
          const box = await page.locator(".atelier-canvas").boundingBox();
          const before = await pose(page);
          const scrollBefore = await page.evaluate(() => scrollY);
          await touchSwipe(
            page,
            { x: box.x + box.width * 0.2, y: box.y + box.height * 0.5 },
            { x: box.x + box.width * 0.8, y: box.y + box.height * 0.5 },
          );
          const after = await pose(page);
          const scrollAfter = await page.evaluate(() => scrollY);
          assert(Math.abs(after.yaw - before.yaw) > 0.3);
          assert(Math.abs(scrollAfter - scrollBefore) < 5);
          assert.equal(
            await page
              .locator('.atelier-sequence button[aria-pressed="true"]')
              .count(),
            0,
          );
          await take(page, "live-rotated-" + item.name);
          return { before, after, scrollBefore, scrollAfter };
        },
      );
      await test(
        item.name + ": vertical touch remains native page scrolling",
        async () => {
          await positionViewer(page);
          const box = await page.locator(".atelier-canvas").boundingBox();
          const before = await pose(page);
          const scrollBefore = await page.evaluate(() => scrollY);
          await touchSwipe(
            page,
            { x: box.x + box.width / 2, y: box.y + box.height * 0.75 },
            { x: box.x + box.width / 2, y: box.y + box.height * 0.25 },
          );
          await page.waitForTimeout(200);
          const after = await pose(page);
          const scrollAfter = await page.evaluate(() => scrollY);
          assert(scrollAfter > scrollBefore + 30);
          assert(Math.abs(after.yaw - before.yaw) < 0.01);
          return { before, after, scrollBefore, scrollAfter };
        },
      );
    } else {
      await test("Desktop real mouse drag rotates the bracelet", async () => {
        await positionViewer(page);
        const box = await page.locator(".atelier-canvas").boundingBox();
        const before = await pose(page);
        await page.mouse.move(
          box.x + box.width * 0.25,
          box.y + box.height * 0.5,
        );
        await page.mouse.down();
        await page.mouse.move(
          box.x + box.width * 0.75,
          box.y + box.height * 0.5,
          { steps: 12 },
        );
        await page.mouse.up();
        const after = await pose(page);
        assert(Math.abs(after.yaw - before.yaw) > 0.3);
        assert.equal(
          await page
            .locator('.atelier-sequence button[aria-pressed="true"]')
            .count(),
          0,
        );
        return { before, after };
      });
      await test("Live one-turn animation completes one revolution then idles", async () => {
        await positionViewer(page);
        const before = await pose(page);
        await page
          .getByRole("button", { name: "Turn once", exact: true })
          .click();
        await page.locator('.atelier-viewer[data-touring="true"]').waitFor();
        await page.locator('.atelier-viewer[data-touring="false"]').waitFor();
        const after = await pose(page);
        assert(Math.abs(Math.abs(after.yaw - before.yaw) - Math.PI * 2) < 0.02);
        await page.waitForTimeout(250);
        const idle = await pose(page);
        await page.waitForTimeout(350);
        assert.equal((await pose(page)).drawCount, idle.drawCount);
        return { before, after, idle };
      });
    }
    await exactRelease(page);
    await context.close();
  }
  const final = await createProfile("final-sha-guard", 390, 844, true);
  await visit(final.page);
  await visit(final.page, "/");
  await final.context.close();
  await test("No uncaught page errors", async () => {
    assert.deepEqual(browserErrors, []);
    return browserErrors;
  });
  await test("Mutation requests blocked; customer browser and production orders untouched", async () => {
    assert(blockedRequests.every((request) => request.blocked));
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
  const report = {
    url: base + path,
    expectedCommit: expected,
    verifiedAt: new Date().toISOString(),
    scope:
      "Read-only deployed release and actual on-screen gesture verification. Disposable sessions only; sample is unsaved local React state. No server writes, customer browser access, purchases, email or external enquiries.",
    summary,
    results,
    browserErrors,
    blockedRequests,
    screenshots: screenshots.map(({ name }) => output + "/" + name + ".png"),
    limitations: [
      "Complete-workbench captures use a taller same-width viewport; normal viewport previews are separate.",
      "This bounded production smoke check does not repeat all local storage, export or manufacturing validation tests.",
    ],
  };
  // Withhold all evidence until the final served SHA guard passes. Never
  // overwrite earlier local screenshots with stale-production screenshots.
  await mkdir(output, { recursive: true });
  for (const screenshot of screenshots)
    await writeFile(output + "/" + screenshot.name + ".png", screenshot.data);
  await writeFile(
    "docs/atelier-360-live-results.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(summary));
  if (summary.failed) process.exitCode = 1;
} catch (error) {
  console.error(String(error));
  console.error(
    "No live evidence files written; existing evidence remains untouched.",
  );
  process.exitCode = 1;
} finally {
  await browser.close();
}

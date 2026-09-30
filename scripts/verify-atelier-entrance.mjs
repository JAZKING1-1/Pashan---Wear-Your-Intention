import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";

const require = createRequire(
  process.env.PASHAN_PLAYWRIGHT_ROOT + "/package.json",
);
const { chromium } = require("playwright");
const base = process.env.PASHAN_BASE_URL || "http://127.0.0.1:8084";
assert(
  ["127.0.0.1", "localhost"].includes(new URL(base).hostname),
  "Local-only verification",
);
const output = "docs/screenshots/atelier-entrance";
const baselineOnly = process.argv.includes("--baseline");
const textOnly = process.argv.includes("--text-only");
const shouldRun = (name) =>
  !textOnly ||
  name.startsWith("Every hero HTML font") ||
  name === "No uncaught browser errors";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const screenshots = [],
  errors = [],
  results = [];
const profiles = [
  { name: "320", width: 320, height: 740, hasTouch: true },
  { name: "390", width: 390, height: 844, hasTouch: true },
  { name: "820", width: 820, height: 1180, hasTouch: true },
  { name: "1440", width: 1440, height: 1000, hasTouch: false },
];
await mkdir(output, { recursive: true });
async function fresh(profile, options = {}) {
  const context = await browser.newContext({
    viewport: { width: profile.width, height: profile.height },
    hasTouch: profile.hasTouch,
    serviceWorkers: "block",
    ...options,
  });
  await context.route("**/*", (route) =>
    ["GET", "HEAD"].includes(route.request().method())
      ? route.continue()
      : route.abort("blockedbyclient"),
  );
  await context.addInitScript(() => {
    window.__entranceEvents = [];
    let previous;
    new MutationObserver(() => {
      const portal = document.querySelector(".ritual-portal");
      if (!portal) return;
      const playing = portal.classList.contains("is-playing");
      if (playing !== previous) {
        window.__entranceEvents.push({ playing, at: performance.now() });
        previous = playing;
      }
    }).observe(document, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on("pageerror", (error) => errors.push(String(error)));
  return { context, page };
}
async function visit(page, path = "/") {
  const response = await page.goto(base + path, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  assert.equal(response.status(), 200);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => {
    document.activeElement?.blur();
    scrollTo({ top: 0, behavior: "instant" });
  });
}
async function capture(page, name, selector) {
  const path = output + "/" + name + ".png";
  if (selector) await page.locator(selector).screenshot({ path });
  else await page.screenshot({ path });
  screenshots.push(path);
}
async function captureSection(page, selector, name) {
  const previous = page.viewportSize();
  const section = page.locator(selector);
  await section.scrollIntoViewIfNeeded();
  for (const img of await section.locator("img").all())
    await img.evaluate((node) => node.decode());
  const height = await section.evaluate(
    (node) =>
      node.getBoundingClientRect().height +
      document.querySelector(".site-header").getBoundingClientRect().height +
      200,
  );
  await page.setViewportSize({
    width: previous.width,
    height: Math.ceil(height),
  });
  await section.evaluate((node) =>
    scrollTo({
      top:
        scrollY +
        node.getBoundingClientRect().top -
        document.querySelector(".site-header").getBoundingClientRect().height -
        12,
      behavior: "instant",
    }),
  );
  await capture(page, name, selector);
  await page.setViewportSize(previous);
}
async function settleEntrance(page) {
  await page.locator(".portal-arch").scrollIntoViewIfNeeded();
  await page.waitForFunction(
    () => sessionStorage.getItem("pashan-portal-seen-v1") === "1",
  );
  await page.locator(".portal-doors").waitFor({ state: "detached" });
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
}
async function test(name, action) {
  if (!shouldRun(name)) return;
  try {
    const evidence = await action();
    results.push({ name, status: "pass", evidence });
    console.log("PASS", name);
  } catch (error) {
    results.push({ name, status: "fail", error: String(error) });
    console.log("FAIL", name, String(error));
  }
}
async function layout(page) {
  const evidence = await page.evaluate(() => {
    const nodes = [
      ...document.querySelectorAll(
        ".ritual-hero h1,.ritual-hero button,.ritual-hero-actions a,.ritual-threshold span",
      ),
    ];
    return {
      viewport: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      controls: nodes
        .filter((node) => node.matches("button,a"))
        .map((node) => ({
          text: node.textContent.trim(),
          width: node.getBoundingClientRect().width,
          height: node.getBoundingClientRect().height,
        })),
      textOverflow: nodes
        .filter((node) => {
          const rect = node.getBoundingClientRect();
          const range = document.createRange();
          range.selectNodeContents(node);
          const text = range.getBoundingClientRect();
          return (
            node.scrollWidth > node.clientWidth + 2 ||
            text.left < rect.left - 2 ||
            text.right > rect.right + 2 ||
            rect.left < -1 ||
            rect.right > innerWidth + 1
          );
        })
        .map((node) => node.textContent.trim()),
    };
  });
  assert(
    evidence.documentWidth <= evidence.viewport + 1 &&
      evidence.bodyWidth <= evidence.viewport + 1,
    "No page horizontal overflow",
  );
  assert.deepEqual(
    evidence.textOverflow,
    [],
    "Hero text fits its controls/headline",
  );
  assert(
    evidence.controls.every(
      (control) => control.width >= 44 && control.height >= 44,
    ),
    "Hero touch controls at least 44px",
  );
  return evidence;
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
async function settledNewEntrance(page) {
  await portalVisible(page);
  await page.waitForFunction(
    () => sessionStorage.getItem("pashan-portal-seen-v2") === "1",
  );
  await page.locator(".portal-doors").waitFor({ state: "detached" });
}
async function replay(page) {
  await portalVisible(page);
  const skip = page.getByRole("button", { name: "Skip entrance", exact: true });
  if (await skip.isVisible()) await skip.click();
  await page
    .getByRole("button", { name: "Replay entrance", exact: true })
    .click();
  await page.locator(".ritual-portal.is-playing").waitFor();
}
async function scenario(name, profile, options, action, setup) {
  if (!shouldRun(name)) return;
  const { context, page } = await fresh(profile, options);
  try {
    if (setup) await setup(context, page);
    await test(name, () => action(page, context));
  } finally {
    await context.close();
  }
}
try {
  if (baselineOnly) {
    for (const profile of profiles) {
      const { context, page } = await fresh(profile);
      await visit(page);
      await settleEntrance(page);
      await capture(page, "before-home-" + profile.name);
      await captureSection(
        page,
        ".ritual-hero",
        "before-hero-complete-" + profile.name,
      );
      await page
        .getByRole("button", { name: "Replay entrance", exact: true })
        .click();
      await page.locator(".portal-doors").waitFor({ state: "visible" });
      await capture(
        page,
        "before-portal-playing-" + profile.name,
        ".ritual-portal",
      );
      await context.close();
      console.log("Captured baseline", profile.name);
    }
    const reduced = await fresh(profiles[1], { reducedMotion: "reduce" });
    await visit(reduced.page);
    await reduced.page.locator(".ritual-portal").scrollIntoViewIfNeeded();
    assert.equal(
      await reduced.page
        .getByRole("button", { name: "Entrance motion off", exact: true })
        .isDisabled(),
      true,
    );
    await capture(reduced.page, "before-portal-reduced-390", ".ritual-portal");
    await reduced.context.close();
    console.log(JSON.stringify({ screenshots, errors }, null, 2));
  } else {
    for (const profile of [
      profiles[0],
      profiles[1],
      { name: "768", width: 768, height: 1024, hasTouch: true },
      profiles[2],
      profiles[3],
    ]) {
      await scenario(
        "Responsive hero, original image and dock at " + profile.name,
        profile,
        { reducedMotion: "reduce" },
        async (page) => {
          await visit(page);
          assert.equal(
            await page.locator(".ritual-hero").getAttribute("data-atmosphere"),
            "calm",
          );
          assert.equal(
            await page
              .locator(".ritual-portal")
              .getAttribute("data-portal-duration"),
            "2400",
          );
          assert.equal(await page.locator(".portal-atelier").count(), 1);
          const image = await page
            .locator(".portal-arch img")
            .evaluate(async (node) => {
              await node.decode();
              return {
                source: node.currentSrc,
                width: node.naturalWidth,
                alt: node.alt,
              };
            });
          assert(image.source.includes("/images/originals/tiger-eye-1-"));
          // naturalWidth is density-corrected for a width-descriptor srcset.
          assert(image.width > 0);
          assert.equal(
            await page
              .getByRole("button", { name: "Entrance motion off", exact: true })
              .isDisabled(),
            true,
          );
          const dock = page.getByRole("navigation", {
            name: "Quick navigation",
            exact: true,
          });
          assert.equal(await dock.isVisible(), profile.width < 1440);
          if (profile.width < 1440)
            assert.deepEqual(await dock.locator("a").allTextContents(), [
              "Shop",
              "Find",
              "Create",
            ]);
          assert.equal(
            await page.locator(".ritual-hero-kit").getAttribute("href"),
            "#ritual-kit",
          );
          const evidence = await layout(page);
          await capture(page, "after-home-" + profile.name);
          await captureSection(
            page,
            ".ritual-hero",
            "after-hero-complete-" + profile.name,
          );
          if (profile.width <= 390) {
            const group = page.getByRole("group", {
              name: "Choose the atmosphere",
              exact: true,
            });
            for (const name of ["Inspiration", "Joy", "Calm"]) {
              await group.getByRole("button", { name, exact: true }).click();
              await layout(page);
            }
          }
          return { ...evidence, image };
        },
      );
    }
    await scenario(
      "Atmospheres are keyboard choices, preserve merchandise and announce meaning",
      profiles[1],
      { reducedMotion: "reduce" },
      async (page) => {
        await visit(page);
        const group = page.getByRole("group", {
          name: "Choose the atmosphere",
          exact: true,
        });
        assert.equal(await group.getByRole("button").count(), 3);
        const photo = await page
          .locator(".portal-arch img")
          .getAttribute("src");
        const states = [];
        for (const name of ["Inspiration", "Joy", "Calm"]) {
          const button = group.getByRole("button", { name, exact: true });
          await button.focus();
          await page.keyboard.press("Enter");
          assert.equal(await button.getAttribute("aria-pressed"), "true");
          assert.equal(await group.locator('[aria-pressed="true"]').count(), 1);
          assert.equal(
            await page.locator(".ritual-hero").getAttribute("data-atmosphere"),
            name.toLowerCase(),
          );
          assert.equal(
            await page.locator(".portal-arch img").getAttribute("src"),
            photo,
          );
          states.push({
            name,
            status: await page
              .locator(".ritual-hero [role=status]")
              .allTextContents(),
          });
          await layout(page);
          if (name !== "Calm")
            await captureSection(
              page,
              ".ritual-hero",
              "after-atmosphere-" + name.toLowerCase() + "-390",
            );
        }
        return states;
      },
    );
    await scenario(
      "First visible entrance runs for 2400ms once per session without locking the page",
      profiles[3],
      {},
      async (page) => {
        await visit(page);
        await settledNewEntrance(page);
        const events = await page.evaluate(() => window.__entranceEvents);
        const start = events.findIndex((event) => event.playing);
        const finish = events.slice(start + 1).find((event) => !event.playing);
        assert(start >= 0 && finish, "Autoplay was observed");
        const duration = finish.at - events[start].at;
        assert(
          duration >= 2250 && duration < 3500,
          "One finite 2.4-second entrance: " + duration,
        );
        const nonblocking = await page.evaluate(() => ({
          body: getComputedStyle(document.body).overflowY,
          html: getComputedStyle(document.documentElement).overflowY,
          dialogs: document.querySelectorAll(
            "[role=dialog][data-state=open],[aria-modal=true]",
          ).length,
        }));
        assert(!["hidden", "clip"].includes(nonblocking.body));
        assert(!["hidden", "clip"].includes(nonblocking.html));
        assert.equal(nonblocking.dialogs, 0);
        await page.reload({ waitUntil: "networkidle" });
        await portalVisible(page);
        await page.waitForTimeout(400);
        const reloadEvents = await page.evaluate(() => window.__entranceEvents);
        assert.equal(
          reloadEvents.some((event) => event.playing),
          false,
        );
        return { duration, events, reloadEvents, nonblocking };
      },
    );
    await scenario(
      "Short phone viewport: entrance waits until its arch is visible",
      profiles[1],
      { viewport: { width: 390, height: 500 } },
      async (page) => {
        await visit(page);
        const before = await page.evaluate(() => ({
          seen: sessionStorage.getItem("pashan-portal-seen-v2"),
          bounds: document
            .querySelector(".portal-arch")
            .getBoundingClientRect()
            .toJSON(),
          height: innerHeight,
        }));
        assert(
          before.bounds.top >= before.height,
          "Portal is below the first phone screen",
        );
        assert.equal(before.seen, null);
        await settledNewEntrance(page);
        return before;
      },
    );
    await scenario(
      "Replay visibly animates; keyboard skip opens immediately and preserves focus",
      profiles[3],
      {},
      async (page) => {
        await visit(page);
        await settledNewEntrance(page);
        const button = page.getByRole("button", {
          name: "Replay entrance",
          exact: true,
        });
        await button.focus();
        await page.keyboard.press("Enter");
        await page.locator(".ritual-portal.is-playing").waitFor();
        await page.waitForTimeout(300);
        const animations = await page
          .locator(".ritual-portal")
          .evaluate((node) =>
            node
              .getAnimations({ subtree: true })
              .filter((animation) => animation.playState === "running")
              .map((animation) => ({
                duration: animation.effect.getTiming().duration,
                currentTime: animation.currentTime,
              })),
          );
        assert(animations.length > 0, "Door/light motion is actually running");
        await capture(page, "after-portal-playing-1440", ".ritual-portal");
        const start = Date.now();
        await page.keyboard.press("Space");
        await page.locator(".portal-doors").waitFor({ state: "detached" });
        assert(Date.now() - start < 500);
        assert.equal(
          await page
            .locator(".portal-control")
            .evaluate((node) => node === document.activeElement),
          true,
        );
        return { animations, skipMs: Date.now() - start };
      },
    );
    await scenario(
      "Scrolling away cancels entrance without restarting on return",
      profiles[1],
      {},
      async (page) => {
        await visit(page);
        await settledNewEntrance(page);
        await replay(page);
        const start = await page.evaluate(() => scrollY);
        await page.mouse.wheel(0, 700);
        await page.locator(".portal-doors").waitFor({ state: "detached" });
        const end = await page.evaluate(() => scrollY);
        assert(end > start + 100, "Native page scroll remains available");
        await portalVisible(page);
        await page.waitForTimeout(200);
        assert.equal(await page.locator(".portal-doors").count(), 0);
        return { start, end };
      },
    );
    await scenario(
      "Menu and search cancel entrance, trap focus and restore opener/dock",
      profiles[1],
      {},
      async (page) => {
        await visit(page);
        await settledNewEntrance(page);
        const evidence = [];
        for (const control of [
          { open: "Open menu", title: "PASHAN menu" },
          { open: "Search PASHAN", title: "Search PASHAN" },
        ]) {
          await replay(page);
          const opener = page.getByRole("button", {
            name: control.open,
            exact: true,
          });
          await opener.click();
          const dialog = page.getByRole("dialog", {
            name: control.title,
            exact: true,
          });
          await dialog.waitFor();
          await page.locator(".portal-doors").waitFor({ state: "detached" });
          assert.equal(
            await page
              .getByRole("navigation", {
                name: "Quick navigation",
                exact: true,
              })
              .isVisible(),
            false,
          );
          for (let i = 0; i < 5; i++) {
            await page.keyboard.press("Tab");
            assert.equal(
              await dialog.evaluate((node) =>
                node.contains(document.activeElement),
              ),
              true,
            );
          }
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
          assert.equal(await page.locator(".portal-doors").count(), 0);
          evidence.push(control.open);
        }
        return evidence;
      },
    );
    await scenario(
      "Tab-hidden visibility event cancels without automatic resume",
      profiles[3],
      {},
      async (page) => {
        await visit(page);
        await settledNewEntrance(page);
        await replay(page);
        await page.evaluate(() => {
          Object.defineProperty(document, "hidden", {
            configurable: true,
            value: true,
          });
          document.dispatchEvent(new Event("visibilitychange"));
        });
        await page.locator(".portal-doors").waitFor({ state: "detached" });
        await page.evaluate(() => {
          delete document.hidden;
          document.dispatchEvent(new Event("visibilitychange"));
        });
        await page.waitForTimeout(200);
        assert.equal(await page.locator(".portal-doors").count(), 0);
        return { simulatedDocumentHiddenEvent: true, resumed: false };
      },
    );
    await scenario(
      "Changing reduced-motion during replay cancels all entrance animation",
      profiles[3],
      {},
      async (page) => {
        await visit(page);
        await settledNewEntrance(page);
        await replay(page);
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page
          .getByRole("button", { name: "Entrance motion off", exact: true })
          .waitFor();
        assert.equal(
          await page
            .getByRole("button", { name: "Entrance motion off", exact: true })
            .isDisabled(),
          true,
        );
        assert.equal(await page.locator(".portal-doors").count(), 0);
        const running = await page
          .locator(".ritual-portal")
          .evaluate(
            (node) =>
              node
                .getAnimations({ subtree: true })
                .filter((animation) => animation.playState === "running")
                .length,
          );
        assert.equal(running, 0);
        return { running };
      },
    );
    for (const failure of ["missing", "throwing"])
      await scenario(
        "Observer " + failure + ": photo stays open and manual replay works",
        profiles[1],
        {},
        async (page) => {
          await visit(page);
          await portalVisible(page);
          await page.waitForTimeout(200);
          assert.equal(await page.locator(".portal-doors").count(), 0);
          assert.equal(
            await page
              .locator(".portal-arch img")
              .evaluate((node) => node.complete && node.naturalWidth > 0),
            true,
          );
          await replay(page);
          await page
            .getByRole("button", { name: "Skip entrance", exact: true })
            .click();
          assert.equal(await page.locator(".portal-doors").count(), 0);
          return { failure, manualReplay: true };
        },
        async (context) => {
          await context.addInitScript((mode) => {
            if (mode === "missing") window.IntersectionObserver = undefined;
            else
              window.IntersectionObserver = class {
                constructor() {
                  throw new Error("Simulated unavailable observer");
                }
              };
          }, failure);
        },
      );
    await scenario(
      "Blocked storage retains once-per-tab memory across client route changes",
      profiles[3],
      {},
      async (page) => {
        await visit(page);
        await portalVisible(page);
        await page.waitForFunction(() =>
          window.__entranceEvents.some((event) => event.playing),
        );
        await page.locator(".portal-doors").waitFor({ state: "detached" });
        await page
          .locator('.ritual-hero-actions a[href="/collections"]')
          .click();
        await page.waitForURL("**/collections");
        await page.goBack({ waitUntil: "networkidle" });
        await portalVisible(page);
        await page.waitForTimeout(300);
        const events = await page.evaluate(() => window.__entranceEvents);
        assert.equal(events.filter((event) => event.playing).length, 1);
        return { events };
      },
      async (context) => {
        await context.addInitScript(() => {
          Storage.prototype.getItem = function () {
            throw new DOMException("Simulated denied storage", "SecurityError");
          };
          Storage.prototype.setItem = function () {
            throw new DOMException("Simulated denied storage", "SecurityError");
          };
        });
      },
    );
    await scenario(
      "No-JavaScript hero stays readable and its shop link works",
      profiles[1],
      { javaScriptEnabled: false },
      async (page) => {
        await visit(page);
        assert.equal(await page.locator(".ritual-hero h1").isVisible(), true);
        assert.equal(await page.locator(".portal-doors").count(), 0);
        assert.equal(
          await page
            .locator(".portal-arch img")
            .evaluate((node) => node.complete && node.naturalWidth > 0),
          true,
        );
        await layout(page);
        await capture(page, "after-no-javascript-390");
        await page
          .locator('.ritual-hero-actions a[href="/collections"]')
          .click();
        await page.waitForURL("**/collections");
        return { readable: true, shoppingUrl: new URL(page.url()).pathname };
      },
    );
    await scenario(
      "Unavailable original photograph presents honest fallback and usable links",
      profiles[1],
      { reducedMotion: "reduce" },
      async (page) => {
        await visit(page);
        await page
          .locator(".portal-arch .catalogue-photo-unavailable")
          .waitFor();
        assert.equal(
          await page
            .locator('.ritual-hero-actions a[href="/collections"]')
            .isVisible(),
          true,
        );
        await layout(page);
        await captureSection(page, ".ritual-hero", "after-image-fallback-390");
        return {
          fallback: await page
            .locator(".portal-arch .catalogue-photo-unavailable")
            .textContent(),
        };
      },
      async (context) => {
        await context.route("**/images/originals/tiger-eye-*", (route) =>
          route.abort("failed"),
        );
      },
    );
    for (const locale of ["hi", "ar"])
      await scenario(
        "Localized heading/English atmosphere reflow: " + locale,
        profiles[1],
        { reducedMotion: "reduce" },
        async (page) => {
          await visit(page, "/?lang=" + locale);
          await page.waitForFunction(
            (expected) => document.documentElement.lang === expected,
            locale,
          );
          assert.equal(
            await page.locator("#ritual-hero-title").getAttribute("dir"),
            locale === "ar" ? "rtl" : "ltr",
          );
          assert.equal(
            await page.locator(".ritual-hero").getAttribute("dir"),
            "ltr",
          );
          const evidence = await layout(page);
          await captureSection(
            page,
            ".ritual-hero",
            "after-hero-" + locale + "-390",
          );
          return evidence;
        },
      );
    await scenario(
      "Every hero HTML font enlarged to 200 percent reflows at 320px",
      profiles[0],
      { reducedMotion: "reduce" },
      async (page) => {
        await visit(page);
        const enlargement = await page
          .locator(".ritual-hero")
          .evaluate((hero) => {
            // Snapshot before changing ancestors: fixed-pixel fonts enlarge too,
            // and inherited sizes do not accidentally compound beyond 200%.
            const snapshots = [hero, ...hero.querySelectorAll("*")]
              .filter((node) => node instanceof HTMLElement)
              .map((node) => ({
                node,
                size: Number.parseFloat(getComputedStyle(node).fontSize),
              }));
            for (const item of snapshots)
              item.node.style.setProperty(
                "font-size",
                item.size * 2 + "px",
                "important",
              );
            return snapshots
              .filter((item) =>
                item.node.matches("h1,button,.ritual-hero-actions a"),
              )
              .map((item) => ({
                label: item.node.textContent.trim(),
                before: item.size,
                after: Number.parseFloat(getComputedStyle(item.node).fontSize),
              }));
          });
        assert(enlargement.every((item) => item.after === item.before * 2));
        const evidence = await layout(page);
        await captureSection(page, ".ritual-hero", "after-text-200-320");
        return { ...evidence, enlargement };
      },
    );
    await scenario(
      "Hero URLs and adaptive dock navigate to real routes",
      profiles[1],
      { reducedMotion: "reduce" },
      async (page) => {
        const paths = [];
        for (const path of ["/collections", "/find-your-bracelet"]) {
          await visit(page);
          await page
            .locator('.ritual-hero-actions a[href="' + path + '"]')
            .click();
          await page.waitForURL("**" + path);
          paths.push(new URL(page.url()).pathname);
        }
        await visit(page);
        await page
          .getByRole("navigation", { name: "Quick navigation", exact: true })
          .getByRole("link", { name: "Create", exact: true })
          .click();
        await page.waitForURL("**/products/make-your-own");
        await page.locator(".atelier").waitFor();
        assert.equal(await page.locator(".atelier").count(), 1);
        return paths.concat("/products/make-your-own");
      },
    );
    await scenario(
      "Classic Rashi entrance remains separate and preserves its real image",
      profiles[1],
      { reducedMotion: "reduce" },
      async (page) => {
        await visit(page, "/rashi");
        assert.equal(await page.locator(".portal-atelier").count(), 0);
        const image = await page
          .locator(".portal-arch img")
          .evaluate(async (node) => {
            await node.decode();
            return { source: node.currentSrc, alt: node.alt };
          });
        assert(image.source.includes("rashi"));
        const evidence = await layout(page);
        await capture(page, "after-rashi-390");
        return { ...evidence, image };
      },
    );
    await scenario(
      "Builder still supports keyboard rotation, sample saving and reload",
      profiles[1],
      { reducedMotion: "reduce" },
      async (page) => {
        await visit(page, "/products/make-your-own");
        await page.locator('.atelier-viewer[data-ready="true"]').waitFor();
        await page
          .getByRole("button", { name: "Use this sample", exact: true })
          .click();
        assert.equal(
          await page.locator(".atelier").getAttribute("data-bead-count"),
          "18",
        );
        const before = Number(
          await page.locator(".atelier-canvas").getAttribute("data-yaw"),
        );
        await page.locator(".atelier-stage").focus();
        await page.keyboard.press("ArrowRight");
        const after = Number(
          await page.locator(".atelier-canvas").getAttribute("data-yaw"),
        );
        assert(after > before + 0.4);
        await page
          .getByRole("button", { name: "Save design", exact: true })
          .click();
        await page.locator('.atelier[data-saved="true"]').waitFor();
        const stored = await page.evaluate(() =>
          localStorage.getItem("pashan-bracelet-design-v1"),
        );
        assert(stored);
        await page.reload({ waitUntil: "networkidle" });
        await page.locator('.atelier[data-saved="true"]').waitFor();
        assert.equal(
          await page.locator(".atelier").getAttribute("data-bead-count"),
          "18",
        );
        assert.equal(
          await page.evaluate(() =>
            localStorage.getItem("pashan-bracelet-design-v1"),
          ),
          stored,
        );
        const evidence = await layout(page);
        await capture(page, "after-builder-390");
        return {
          ...evidence,
          yawBefore: before,
          yawAfter: after,
          reloadRestored: true,
        };
      },
    );
    await test("No uncaught browser errors", async () => {
      assert.deepEqual(errors, []);
      return errors;
    });
    const previousReport = textOnly
      ? JSON.parse(await readFile("docs/atelier-entrance-results.json", "utf8"))
      : null;
    const recordedResults = previousReport
      ? previousReport.results.map(
          (previous) =>
            results.find((item) => item.name === previous.name) ?? previous,
        )
      : results;
    const recordedScreenshots = previousReport
      ? [...new Set([...previousReport.screenshots, ...screenshots])]
      : screenshots;
    const summary = {
      passed: recordedResults.filter((item) => item.status === "pass").length,
      failed: recordedResults.filter((item) => item.status === "fail").length,
    };
    await writeFile(
      "docs/atelier-entrance-results.json",
      JSON.stringify(
        {
          verifiedAt: new Date().toISOString(),
          ...(previousReport
            ? {
                fullSuiteVerifiedAt:
                  previousReport.fullSuiteVerifiedAt ??
                  previousReport.verifiedAt,
                focusedRecheck: {
                  at: new Date().toISOString(),
                  names: results.map((item) => item.name),
                },
              }
            : {}),
          base,
          summary,
          results: recordedResults,
          errors,
          screenshots: recordedScreenshots,
          scope:
            "Local disposable browser contexts. Non-GET/HEAD requests blocked; no payments, email or customer sessions.",
          limitations: [
            "Complete-hero screenshots use a taller same-width viewport; normal viewport captures are separate.",
            "Tab-hidden cancellation uses an explicit simulated document visibility event.",
            "The 200% check doubles every hero HTML element's computed font size from an initial snapshot, including fixed-pixel fonts; it is not full-page browser zoom.",
          ],
        },
        null,
        2,
      ) + "\n",
    );
    console.log(JSON.stringify(summary));
    if (summary.failed) process.exitCode = 1;
  }
} finally {
  await browser.close();
}

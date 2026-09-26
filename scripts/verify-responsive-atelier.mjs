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
  "This suite is local-only",
);
const output = "docs/screenshots/responsive-atelier";
const baselineOnly = process.argv.includes("--baseline");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [],
  screenshots = [],
  errors = [];
await mkdir(output, { recursive: true });
async function visit(page, path) {
  const response = await page.goto(base + path, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  assert.equal(response.status(), 200);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => {
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur();
    scrollTo({ top: 0, behavior: "instant" });
    return Math.abs(scrollY) < 1;
  });
}
async function capture(page, name) {
  if (name.startsWith("after-home-")) {
    await page.locator(".portal-arch").scrollIntoViewIfNeeded();
    await page.locator(".portal-doors").waitFor({ state: "detached" });
    await page.waitForFunction(() => {
      scrollTo({ top: 0, behavior: "instant" });
      return Math.abs(scrollY) < 1;
    });
  }
  const path = output + "/" + name + ".png";
  await page.screenshot({ path });
  screenshots.push(path);
}
async function captureSection(page, selector, name) {
  const previous = page.viewportSize();
  const section = page.locator(selector);
  await section.scrollIntoViewIfNeeded();
  for (const image of await section.locator("img").all())
    await image.evaluate((node) => node.decode());
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
        node.getBoundingClientRect().top +
        scrollY -
        document.querySelector(".site-header").getBoundingClientRect().height -
        12,
      behavior: "instant",
    }),
  );
  await page.locator(".portal-doors").waitFor({ state: "detached" });
  const path = output + "/" + name + ".png";
  await section.screenshot({ path });
  screenshots.push(path);
  await page.setViewportSize(previous);
}
async function waitForFocus(page, locator) {
  const element = await locator.elementHandle();
  await page.waitForFunction(
    (node) => node === document.activeElement,
    element,
    { timeout: 1500 },
  );
}
const baselineProfiles = [
  { name: "phone-390", width: 390, height: 844, hasTouch: true },
  { name: "tablet-820", width: 820, height: 1180, hasTouch: true },
  { name: "landscape-1180", width: 1180, height: 820, hasTouch: true },
  { name: "desktop-1440", width: 1440, height: 1000, hasTouch: false },
];

const profiles = [
  { name: "narrow-320", width: 320, height: 740, hasTouch: true },
  baselineProfiles[0],
  { name: "tablet-768", width: 768, height: 1024, hasTouch: true },
  baselineProfiles[1],
  { name: "tablet-1024", width: 1024, height: 768, hasTouch: true },
  baselineProfiles[2],
  { name: "compact-fine-1180", width: 1180, height: 820, hasTouch: false },
  { name: "wide-touch-1366", width: 1366, height: 1024, hasTouch: true },
  { name: "wide-fine-1366", width: 1366, height: 1024, hasTouch: false },
  baselineProfiles[3],
];
const dock = (page) => page.locator(".pashan-mobile-dock");
async function test(page, name, fn) {
  try {
    const evidence = await fn();
    results.push({ name, status: "pass", evidence });
    console.log("PASS", name);
  } catch (error) {
    results.push({ name, status: "fail", error: String(error) });
    console.log("FAIL", name, String(error));
    await capture(page, "failure-" + results.length);
  }
}
async function layout(page) {
  return page.evaluate(() => {
    const visible = (node) =>
      node.checkVisibility() &&
      !node.closest('[aria-hidden="true"],[inert]') &&
      node.getBoundingClientRect().width > 2;
    return {
      viewport: { width: innerWidth, height: innerHeight },
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      pointer: {
        coarse: matchMedia("(pointer: coarse)").matches,
        anyCoarse: matchMedia("(any-pointer: coarse)").matches,
        fine: matchMedia("(pointer: fine)").matches,
        touchPoints: navigator.maxTouchPoints,
      },
      headings: [...document.querySelectorAll("h1,h2,h3")]
        .filter(visible)
        .map((node) => {
          const rect = node.getBoundingClientRect();
          const range = document.createRange();
          range.selectNodeContents(node);
          const text = range.getBoundingClientRect();
          return {
            text: node.textContent.trim(),
            client: node.clientWidth,
            scroll: node.scrollWidth,
            left: rect.left,
            right: rect.right,
            textLeft: text.left,
            textRight: text.right,
          };
        }),
      headerControls: [
        ...document.querySelectorAll(
          ".site-header button,.site-header a,.site-header select",
        ),
      ]
        .filter(visible)
        .map((node) => {
          const rect = node.getBoundingClientRect();
          return {
            name: node.getAttribute("aria-label") || node.textContent.trim(),
            left: rect.left,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom,
          };
        }),
    };
  });
}
function assertLayout(evidence) {
  assert(
    evidence.documentWidth <= evidence.viewport.width + 1 &&
      evidence.bodyWidth <= evidence.viewport.width + 1,
    "No horizontal page overflow",
  );
  assert.deepEqual(
    evidence.headings.filter(
      (item) =>
        item.scroll > item.client + 2 ||
        item.textLeft < item.left - 3 ||
        item.textRight > item.right + 3,
    ),
    [],
    "Heading text fits its own box",
  );
  assert(
    evidence.headerControls.every(
      (item) => item.left >= -1 && item.right <= evidence.viewport.width + 1,
    ),
    "Header controls fit within the viewport",
  );
}
async function dialogCheck(page, trigger, dialog, closeName) {
  await trigger.click();
  await dialog.waitFor({ state: "visible" });
  await dock(page).waitFor({ state: "hidden" });
  for (let index = 0; index < 5; index++) {
    await page.keyboard.press("Tab");
    assert(
      await dialog.evaluate((node) => node.contains(document.activeElement)),
      "Dialog contains keyboard focus",
    );
  }
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  await waitForFocus(page, trigger);
  assert(
    await trigger.evaluate((node) => node === document.activeElement),
    "Escape restores opener focus",
  );
  await dock(page).waitFor({ state: "visible" });
  await trigger.click();
  await dialog.waitFor({ state: "visible" });
  await dialog.getByRole("button", { name: closeName, exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  await waitForFocus(page, trigger);
  assert(
    await trigger.evaluate((node) => node === document.activeElement),
    "Close button restores opener focus",
  );
  return {
    dockSuppressed: true,
    keyboardContained: true,
    escapeRestores: true,
    closeButtonRestores: true,
  };
}

try {
  if (baselineOnly) {
    for (const profile of baselineProfiles) {
      const context = await browser.newContext({
        viewport: { width: profile.width, height: profile.height },
        hasTouch: profile.hasTouch,
      });
      const page = await context.newPage();
      page.on("pageerror", (error) => errors.push(String(error)));
      for (const [path, label] of [
        ["/", "home"],
        ["/collections", "catalogue"],
      ]) {
        await visit(page, path);
        await capture(page, "before-" + label + "-" + profile.name);
      }
      await context.close();
      console.log("Captured baseline", profile.name);
    }
    console.log(JSON.stringify({ screenshots, errors }, null, 2));
  } else {
    for (const profile of profiles) {
      const context = await browser.newContext({
        viewport: { width: profile.width, height: profile.height },
        hasTouch: profile.hasTouch,
      });
      const page = await context.newPage();
      page.setDefaultTimeout(12000);
      page.on("pageerror", (error) =>
        errors.push({ profile: profile.name, error: String(error) }),
      );
      const expectsDock =
        profile.width <= 1180 || (profile.hasTouch && profile.width <= 1366);
      for (const [path, label] of [
        ["/", "home"],
        ["/collections", "catalogue"],
      ]) {
        await test(
          page,
          "Adaptive " + label + " at " + profile.name,
          async () => {
            await visit(page, path);
            const evidence = await layout(page);
            assertLayout(evidence);
            assert.equal(
              await dock(page).isVisible(),
              expectsDock,
              "Dock follows compact/touch policy",
            );
            assert.equal(
              await page
                .getByRole("button", { name: "Open menu", exact: true })
                .isVisible(),
              expectsDock,
              "Compact header aligns with dock policy",
            );
            assert.equal(
              await page
                .getByRole("navigation", {
                  name: "Main navigation",
                  exact: true,
                })
                .isVisible(),
              !expectsDock,
            );
            if (expectsDock) {
              const links = await dock(page)
                .locator("a")
                .evaluateAll((nodes) =>
                  nodes.map((node) => {
                    const rect = node.getBoundingClientRect();
                    return {
                      text: node.textContent.trim(),
                      href: node.getAttribute("href"),
                      current: node.getAttribute("aria-current"),
                      left: rect.left,
                      right: rect.right,
                      top: rect.top,
                      bottom: rect.bottom,
                      width: rect.width,
                      height: rect.height,
                    };
                  }),
                );
              assert.deepEqual(
                links.map((item) => [item.text, item.href]),
                [
                  ["Shop", "/collections"],
                  ["Find", "/find-your-bracelet"],
                  ["Create", "/products/make-your-own"],
                ],
              );
              assert(
                links.every(
                  (item) =>
                    item.width >= 44 &&
                    item.height >= 44 &&
                    item.left >= -1 &&
                    item.right <= profile.width + 1 &&
                    item.bottom <= profile.height + 1,
                ),
              );
              if (path === "/collections")
                assert.equal(links[0].current, "page");
              assert.equal(
                await page.locator(".concierge-launcher:visible").count(),
                0,
              );
              evidence.dock = links;
            }
            if (label === "catalogue") {
              const frames = await page
                .locator(".atelier-card-image")
                .evaluateAll((nodes) =>
                  nodes.map((node) => {
                    const rect = node.getBoundingClientRect();
                    return {
                      width: rect.width,
                      height: rect.height,
                      ratio: rect.width / rect.height,
                    };
                  }),
                );
              assert.equal(frames.length, 8);
              assert(
                frames.every(
                  (item) => Math.abs(item.ratio - frames[0].ratio) < 0.01,
                ),
                "All catalogue cards use a consistent photograph frame",
              );
              evidence.photoFrames = frames;
              const labels = await page
                .locator(".atelier-card-category")
                .evaluateAll((nodes) =>
                  nodes.map((node) =>
                    parseFloat(getComputedStyle(node).fontSize),
                  ),
                );
              assert(labels.every((size) => size >= 14));
              evidence.categoryLabelSizes = labels;
            } else {
              const pathways = await page
                .locator(".atelier-pathways a")
                .evaluateAll((nodes) =>
                  nodes.map((node) => ({
                    href: node.getAttribute("href"),
                    text: node.textContent.trim(),
                  })),
                );
              assert.deepEqual(
                pathways.map((item) => item.href),
                ["/collections", "/products/make-your-own", "/rituals"],
              );
              assert.match(pathways[2].text, /A daily ritual/);
              evidence.pathways = pathways;
            }
            if (
              profile.name === "narrow-320" ||
              baselineProfiles.some((item) => item.name === profile.name)
            ) {
              await capture(page, "after-" + label + "-" + profile.name);
              if (
                label === "home" &&
                ["phone-390", "tablet-820", "desktop-1440"].includes(
                  profile.name,
                )
              ) {
                await captureSection(
                  page,
                  ".ritual-hero",
                  "after-hero-complete-" + profile.name,
                );
                await captureSection(
                  page,
                  ".makeover-products",
                  "after-featured-complete-" + profile.name,
                );
                await captureSection(
                  page,
                  ".atelier-pathways",
                  "after-pathways-" + profile.name,
                );
              }
            }
            return evidence;
          },
        );
      }
      if (
        ["tablet-820", "landscape-1180", "wide-touch-1366"].includes(
          profile.name,
        )
      ) {
        for (const [opener, title, closeName] of [
          ["Open menu", "PASHAN menu", "Close menu"],
          ["Search PASHAN", "Search PASHAN", "Close search"],
        ]) {
          await test(
            page,
            title + " keyboard and dock suppression at " + profile.name,
            async () => {
              await visit(page, "/");
              return dialogCheck(
                page,
                page.getByRole("button", { name: opener, exact: true }),
                page.getByRole("dialog", { name: title, exact: true }),
                closeName,
              );
            },
          );
        }
      }
      if (profile.name === "tablet-820") {
        await test(
          page,
          "Tablet menu screenshot and search typing remain accessible",
          async () => {
            await visit(page, "/");
            await page
              .getByRole("button", { name: "Open menu", exact: true })
              .tap();
            await page
              .getByRole("dialog", { name: "PASHAN menu", exact: true })
              .waitFor();
            await capture(page, "after-menu-tablet-820");
            await page.keyboard.press("Escape");
            await page
              .getByRole("button", { name: "Search PASHAN", exact: true })
              .tap();
            const input = page.getByRole("combobox", {
              name: "Search bracelets, stones and intentions",
              exact: true,
            });
            await input.fill("amethyst");
            assert.equal(await dock(page).isVisible(), false);
            const photo = page
              .getByRole("dialog", { name: "Search PASHAN", exact: true })
              .locator(".catalogue-photo")
              .first();
            await photo.locator("img").evaluate((node) => node.decode());
            const frame = await photo.evaluate((node) => ({
              width: node.getBoundingClientRect().width,
              height: node.getBoundingClientRect().height,
              position: getComputedStyle(node.querySelector("img")).position,
            }));
            assert(
              Math.abs(frame.width - frame.height) < 1 &&
                frame.width === 48 &&
                frame.position === "absolute",
            );
            await capture(page, "after-search-tablet-820");
            await page.keyboard.press("Escape");
            return {
              touchMenu: true,
              labelledSearchAcceptsText: true,
              noFormSubmission: true,
              thumbnailFrame: frame,
            };
          },
        );
        await test(
          page,
          "Tablet bag dialog suppresses dock and restores focus",
          async () => {
            await visit(page, "/");
            return dialogCheck(
              page,
              page.getByRole("button", { name: /^Open bag with/ }),
              page.getByRole("dialog", { name: "Your bracelets", exact: true }),
              "Close bag",
            );
          },
        );
        await test(
          page,
          "Tablet viewer dialog suppresses dock and restores focus",
          async () => {
            await visit(page, "/collections");
            const trigger = page
              .locator(".atelier-card")
              .first()
              .getByRole("button")
              .first();
            await trigger.click();
            const dialog = page.getByRole("dialog").first();
            await dialog.waitFor({ state: "visible" });
            await dock(page).waitFor({ state: "hidden" });
            await page.keyboard.press("Tab");
            assert(
              await dialog.evaluate((node) =>
                node.contains(document.activeElement),
              ),
            );
            await page.keyboard.press("Escape");
            await dialog.waitFor({ state: "hidden" });
            await waitForFocus(page, trigger);
            assert(
              await trigger.evaluate((node) => node === document.activeElement),
            );
            return {
              viewerOpened: true,
              dockSuppressed: true,
              focusReturned: true,
            };
          },
        );
        await test(
          page,
          "Tablet dock touch actions resolve and stay selected",
          async () => {
            for (const [name, path] of [
              ["Shop", "/collections"],
              ["Find", "/find-your-bracelet"],
              ["Create", "/products/make-your-own"],
            ]) {
              await visit(page, "/");
              await dock(page).getByRole("link", { name, exact: true }).tap();
              await page.waitForURL("**" + path);
              await page.locator("main h1").first().waitFor();
              await dock(page).waitFor({ state: "visible" });
              assert.equal(
                await dock(page)
                  .getByRole("link", { name, exact: true })
                  .getAttribute("aria-current"),
                "page",
              );
              assertLayout(await layout(page));
            }
            return {
              touchActions: ["Shop", "Find", "Create"],
              routesResolved: true,
            };
          },
        );
        await test(
          page,
          "Finder recommendations use the same square framed photographs",
          async () => {
            await visit(page, "/find-your-bracelet");
            await page.locator('[data-finder-ready="true"]').waitFor();
            const choices = [
              "A quieter moment",
              "Violet & green",
              "A considered accent",
              "Up to ₹999",
            ];
            for (let index = 0; index < choices.length; index++) {
              await page
                .locator(".ritual-finder-option")
                .filter({
                  has: page.locator("strong", { hasText: choices[index] }),
                })
                .click();
              await page
                .getByRole("button", {
                  name: index === 3 ? "Find my bracelet" : "Continue",
                  exact: true,
                })
                .click();
            }
            const first = page
              .locator(".ritual-finder-results .catalogue-photo")
              .first();
            await first.scrollIntoViewIfNeeded();
            await first.locator("img").evaluate((node) => node.decode());
            const frames = await page
              .locator(".ritual-finder-results .catalogue-photo")
              .evaluateAll((nodes) =>
                nodes.map((node) => {
                  const rect = node.getBoundingClientRect();
                  const img = node.querySelector("img");
                  return {
                    slug: node.getAttribute("data-photo-slug"),
                    width: rect.width,
                    height: rect.height,
                    position: getComputedStyle(img).position,
                    source: img.currentSrc,
                  };
                }),
              );
            assert(
              frames.length > 0 &&
                frames.every(
                  (item) =>
                    Math.abs(item.width - item.height) < 1 &&
                    item.position === "absolute",
                ),
            );
            assert.equal(frames[0].slug, "amethyst");
            assertLayout(await layout(page));
            await page.locator(".ritual-finder-results").evaluate((node) =>
              scrollTo({
                top:
                  node.getBoundingClientRect().top +
                  scrollY -
                  document.querySelector(".site-header").getBoundingClientRect()
                    .height -
                  12,
                behavior: "instant",
              }),
            );
            await capture(page, "after-finder-results-tablet-820");
            return frames;
          },
        );
        await test(
          page,
          "Tablet focused forms and checkout suppress the dock",
          async () => {
            await visit(page, "/contact");
            await page
              .getByRole("textbox", { name: "Your name", exact: true })
              .focus();
            await dock(page).waitFor({ state: "hidden" });
            for (const path of ["/cart", "/checkout"]) {
              await visit(page, path);
              assert.equal(await dock(page).isVisible(), false);
            }
            return {
              inputSuppressed: true,
              cartAndCheckoutSuppressed: true,
              noSubmission: true,
            };
          },
        );
        await test(
          page,
          "Tablet keyboard focus, native scrolling and footer clearance",
          async () => {
            await visit(page, "/");
            await dock(page)
              .getByRole("link", { name: "Shop", exact: true })
              .focus();
            await page.keyboard.press("Tab");
            const find = dock(page).getByRole("link", {
              name: "Find",
              exact: true,
            });
            const focus = await find.evaluate((node) => ({
              active: node === document.activeElement,
              visible: node.matches(":focus-visible"),
              outline: getComputedStyle(node).outlineStyle,
              width: getComputedStyle(node).outlineWidth,
            }));
            assert(
              focus.active &&
                focus.visible &&
                focus.outline !== "none" &&
                parseFloat(focus.width) >= 2,
            );
            await page.mouse.move(350, 500);
            await page.mouse.wheel(0, 700);
            await page.waitForFunction(() => scrollY > 100);
            await page.evaluate(() => {
              document.activeElement.blur();
              scrollTo({
                top: document.documentElement.scrollHeight,
                behavior: "instant",
              });
            });
            const clearance = await page.evaluate(() => {
              const nav = document
                .querySelector(".pashan-mobile-dock")
                .getBoundingClientRect();
              const footer = document.querySelector(".site-footer");
              return {
                padding: parseFloat(getComputedStyle(footer).paddingBottom),
                dockHeight: nav.height,
                dockTop: nav.top,
                lowestLink: Math.max(
                  ...[...footer.querySelectorAll("a")].map(
                    (node) => node.getBoundingClientRect().bottom,
                  ),
                ),
              };
            });
            assert(
              clearance.padding >= clearance.dockHeight + 20 &&
                clearance.lowestLink < clearance.dockTop,
            );
            return { focus, clearance };
          },
        );
        await test(
          page,
          "All catalogue photographs load with consistent explicit dimensions",
          async () => {
            await visit(page, "/collections");
            const cards = page.locator(".atelier-card");
            const photographs = [];
            for (let index = 0; index < (await cards.count()); index++) {
              const card = cards.nth(index);
              const image = card.locator("img");
              await image.scrollIntoViewIfNeeded();
              await image.evaluate((node) => node.decode());
              const evidence = await image.evaluate((node) => ({
                source: node.currentSrc,
                alt: node.alt,
                width: node.naturalWidth,
                height: node.naturalHeight,
                widthAttribute: node.getAttribute("width"),
                heightAttribute: node.getAttribute("height"),
                fit: getComputedStyle(node).objectFit,
              }));
              assert(
                evidence.width > 0 &&
                  evidence.height > 0 &&
                  evidence.alt.length > 0 &&
                  evidence.widthAttribute &&
                  evidence.heightAttribute,
              );
              photographs.push(evidence);
              const frame = card.locator(".atelier-card-image");
              await frame.evaluate((node) =>
                scrollTo({
                  top:
                    node.getBoundingClientRect().top +
                    scrollY -
                    document
                      .querySelector(".site-header")
                      .getBoundingClientRect().height -
                    12,
                  behavior: "instant",
                }),
              );
              const path =
                output +
                "/after-photo-" +
                (await card.getAttribute("data-product")) +
                ".png";
              await frame.screenshot({ path });
              screenshots.push(path);
            }
            return photographs;
          },
        );
        await test(
          page,
          "Tablet reduced motion remains complete and readable",
          async () => {
            await page.emulateMedia({ reducedMotion: "reduce" });
            await visit(page, "/");
            const entrance = page.getByRole("button", {
              name: "Entrance motion off",
              exact: true,
            });
            await entrance.waitFor();
            assert(await entrance.isDisabled());
            assert.equal(await page.locator(".portal-doors").count(), 0);
            await page.locator(".making-photo-table").scrollIntoViewIfNeeded();
            const light = page.getByRole("button", {
              name: "Light motion off",
              exact: true,
            });
            assert(await light.isDisabled());
            assert.equal(await page.locator(".light-passage-glow").count(), 0);
            assert(await dock(page).isVisible());
            assertLayout(await layout(page));
            await page.emulateMedia({ reducedMotion: "no-preference" });
            return {
              entranceDisabled: true,
              lightDisabled: true,
              contentAndDockVisible: true,
            };
          },
        );
      }
      if (profile.name === "tablet-820") {
        for (const [path, name] of [
          ["/rashi", "rashi"],
          ["/products/make-your-own", "builder"],
          ["/products/amethyst", "product"],
        ]) {
          await test(
            page,
            "Tablet " + name + " visual and layout smoke",
            async () => {
              await visit(page, path);
              const evidence = await layout(page);
              assertLayout(evidence);
              await dock(page).waitFor({ state: "visible" });
              await capture(page, "after-" + name + "-tablet-820");
              return evidence;
            },
          );
        }
      }
      if (profile.name === "compact-fine-1180") {
        await test(
          page,
          "Open compact menu survives wide resize with a visible focus return",
          async () => {
            await visit(page, "/");
            await page
              .getByRole("button", { name: "Open menu", exact: true })
              .click();
            const dialog = page.getByRole("dialog", {
              name: "PASHAN menu",
              exact: true,
            });
            await dialog.waitFor({ state: "visible" });
            await page.setViewportSize({ width: 1440, height: 1000 });
            await page.keyboard.press("Escape");
            await dialog.waitFor({ state: "hidden" });
            const search = page.getByRole("button", {
              name: "Search PASHAN",
              exact: true,
            });
            assert(
              await search.evaluate((node) => node === document.activeElement),
            );
            assert.equal(await dock(page).isVisible(), false);
            assert(
              await page
                .getByRole("navigation", {
                  name: "Main navigation",
                  exact: true,
                })
                .isVisible(),
            );
            await page.setViewportSize({ width: 1180, height: 820 });
            await dock(page).waitFor({ state: "visible" });
            return {
              wideFocusReturnsToSearch: true,
              compactDockRestored: true,
            };
          },
        );
      }
      await context.close();
    }
    const sheetContext = await browser.newContext({
      viewport: { width: 1440, height: 850 },
    });
    const sheet = await sheetContext.newPage();
    const slugs = [
      "pyrite",
      "tiger-eye",
      "hematite",
      "amethyst",
      "green-quartz",
      "lava",
      "dhan-yog",
      "make-your-own",
    ];
    const tiles = await Promise.all(
      slugs.map(
        async (slug) =>
          `<figure><img src="data:image/png;base64,${(await readFile(output + "/after-photo-" + slug + ".png")).toString("base64")}" alt="${slug}"><figcaption>${slug}</figcaption></figure>`,
      ),
    );
    await sheet.setContent(
      `<html><head><style>body{margin:0;padding:24px;background:#fff9f0;color:#32170f;font:16px Arial,sans-serif}main{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px}figure{margin:0}img{width:100%;aspect-ratio:1;display:block}figcaption{padding-top:8px}</style></head><body><main>${tiles.join("")}</main></body></html>`,
    );
    await capture(sheet, "after-photo-contact-sheet");
    await sheetContext.close();
    const report = {
      base,
      checkedAt: new Date().toISOString(),
      scope:
        "Local adaptive navigation and photography checks. Touch media emulated by Chromium; not physical-tablet or screen-reader certification. No orders, payment, email or publishing.",
      summary: {
        passed: results.filter((item) => item.status === "pass").length,
        failed: results.filter((item) => item.status === "fail").length,
        browserErrors: errors.length,
      },
      screenshots,
      results,
      errors,
    };
    await writeFile(
      "docs/responsive-atelier-results.json",
      JSON.stringify(report, null, 2) + "\n",
    );
    console.log(JSON.stringify(report.summary));
    if (report.summary.failed || errors.length) process.exitCode = 1;
  }
} finally {
  await browser.close();
}

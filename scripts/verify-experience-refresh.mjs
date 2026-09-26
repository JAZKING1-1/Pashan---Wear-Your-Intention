import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";

const require = createRequire(
  process.env.PASHAN_PLAYWRIGHT_ROOT + "/package.json",
);
const { chromium } = require("playwright");
const base = process.env.PASHAN_BASE_URL || "http://127.0.0.1:8084";
assert(
  new URL(base).hostname === "127.0.0.1" ||
    new URL(base).hostname === "localhost",
  "This verification is local-only",
);
const output = "docs/screenshots/experience-refresh";
const baselineOnly = process.argv.includes("--baseline");
const heroRefresh = process.argv.includes("--refresh-heroes");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
});
const page = await context.newPage();
page.setDefaultTimeout(15000);
const results = [],
  screenshots = [],
  errors = [];
page.on("pageerror", (error) => errors.push(String(error)));
await mkdir(output, { recursive: true });
async function visit(path) {
  const response = await page.goto(base + path, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  assert.equal(response.status(), 200);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur();
    scrollTo({ top: 0, behavior: "instant" });
  });
  await page.waitForFunction(() => {
    scrollTo({ top: 0, behavior: "instant" });
    return Math.abs(scrollY) < 1;
  });
}
async function capture(name) {
  if (name.includes("home-")) {
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement)
        document.activeElement.blur();
      scrollTo({ top: 0, behavior: "instant" });
    });
    await page.waitForFunction(() => {
      scrollTo({ top: 0, behavior: "instant" });
      return Math.abs(scrollY) < 1;
    });
  }
  const path = output + "/" + name + ".png";
  await page.screenshot({ path });
  screenshots.push(path);
}
async function builderCapture(name) {
  await page.locator(".makeover-builder").evaluate((node) => {
    const top = node.getBoundingClientRect().top + scrollY;
    const offset = document
      .querySelector(".site-header")
      .getBoundingClientRect().height;
    scrollTo({ top: top - offset - 12, behavior: "instant" });
  });
  await capture(name);
}

async function completeBuilderCapture(width) {
  const previous = page.viewportSize();
  const section = page.locator(".makeover-builder");
  await section
    .locator("img")
    .first()
    .evaluate((image) => image.decode());
  const height = await section.evaluate(
    (node) =>
      node.getBoundingClientRect().height +
      document.querySelector(".site-header").getBoundingClientRect().height +
      200,
  );
  // A tall same-width capture fits the complete section between fixed header
  // and dock; normal-phone viewport evidence is recorded separately.
  await page.setViewportSize({ width, height: Math.ceil(height) });
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
  const path = output + "/after-builder-complete-" + width + ".png";
  await section.screenshot({ path });
  screenshots.push(path);
  await page.setViewportSize(previous);
}

const dock = () =>
  page.getByRole("navigation", {
    name: "Mobile quick navigation",
    exact: true,
  });
async function test(name, fn) {
  try {
    const evidence = await fn();
    results.push({ name, status: "pass", evidence });
    console.log("PASS", name);
  } catch (error) {
    results.push({ name, status: "fail", error: String(error) });
    console.log("FAIL", name, String(error));
    await capture("failure-" + results.length);
  }
}
async function layoutEvidence() {
  return page.evaluate(() => {
    const headings = [...document.querySelectorAll("h1,h2,h3")]
      .filter(
        (node) =>
          node.checkVisibility() &&
          !node.closest('[aria-hidden="true"],[inert]'),
      )
      .map((node) => {
        const rect = node.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(node);
        const text = range.getBoundingClientRect();
        return {
          text: node.textContent.trim(),
          left: rect.left,
          right: rect.right,
          textLeft: text.left,
          textRight: text.right,
          client: node.clientWidth,
          scroll: node.scrollWidth,
        };
      });
    return {
      viewport: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      headings,
    };
  });
}
function assertLayout(evidence) {
  assert(
    evidence.documentWidth <= evidence.viewport + 1 &&
      evidence.bodyWidth <= evidence.viewport + 1,
    "Page must not overflow horizontally",
  );
  assert.deepEqual(
    evidence.headings.filter(
      (item) =>
        item.scroll > item.client + 2 ||
        item.textLeft < item.left - 3 ||
        item.textRight > item.right + 3,
    ),
    [],
    "Heading text must fit its box",
  );
}

try {
  if (heroRefresh) {
    for (const width of [390, 1440]) {
      await test("Final real-photo hero at " + width, async () => {
        await page.setViewportSize({
          width,
          height: width === 390 ? 844 : 1000,
        });
        await visit("/");
        const hero = page.locator(".portal-arch img");
        await hero.evaluate((image) => image.decode());
        const layout = await layoutEvidence();
        assertLayout(layout);
        await capture("after-home-" + width);
        await page
          .locator(".portal-arch")
          .evaluate((node) =>
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
        const skip = page.getByRole("button", {
          name: "Skip entrance",
          exact: true,
        });
        if (await skip.isVisible()) await skip.click();
        await page.locator(".portal-doors").waitFor({ state: "detached" });
        if (width === 390) await capture("after-hero-photo-390");
        const photograph = await hero.evaluate((image) => ({
          src: image.currentSrc,
          width: image.naturalWidth,
          height: image.naturalHeight,
          fit: getComputedStyle(image).objectFit,
        }));
        assert(
          photograph.width > 0 &&
            photograph.src.includes("/images/originals/tiger-eye-"),
        );
        return { layout, photograph };
      });
    }
    const reportPath = "docs/experience-refresh-results.json";
    const report = JSON.parse(await readFile(reportPath, "utf8"));
    report.finalHeroRefresh = {
      checkedAt: new Date().toISOString(),
      results,
      errors,
    };
    report.screenshots = [...new Set([...report.screenshots, ...screenshots])];
    await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
    if (results.some((item) => item.status === "fail") || errors.length)
      process.exitCode = 1;
  } else if (baselineOnly) {
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      await visit("/");
      await capture("before-home-" + width);
      await builderCapture("before-builder-" + width);
      if (width === 390) {
        await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
        await page
          .getByRole("button", { name: "Open menu", exact: true })
          .click();
        await page
          .getByRole("dialog", { name: "PASHAN menu", exact: true })
          .waitFor({ state: "visible" });
        await capture("before-menu-390");
        await page.keyboard.press("Escape");
      }
    }
    console.log(JSON.stringify({ baseline: screenshots, errors }, null, 2));
  } else {
    for (const width of [320, 390, 768, 1440]) {
      await test("Homepage and three-action dock at " + width, async () => {
        await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
        await visit("/");
        const layout = await layoutEvidence();
        assertLayout(layout);
        const mobile = width <= 760;
        if (mobile) {
          await dock().waitFor({ state: "visible" });
          assert.deepEqual(await dock().getByRole("link").allTextContents(), [
            "Shop",
            "Find",
            "Create",
          ]);
          const targets = await dock()
            .getByRole("link")
            .evaluateAll((nodes) =>
              nodes.map((node) => {
                const rect = node.getBoundingClientRect();
                return {
                  text: node.textContent.trim(),
                  href: node.getAttribute("href"),
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
            targets.map((item) => item.href),
            ["/collections", "/find-your-bracelet", "/products/make-your-own"],
          );
          assert(
            targets.every(
              (item) =>
                item.width >= 44 &&
                item.height >= 44 &&
                item.left >= -1 &&
                item.right <= width + 1 &&
                item.top >= 0 &&
                item.bottom <= 845,
            ),
          );
          assert.equal(
            await page.locator(".concierge-launcher:visible").count(),
            0,
          );
          layout.dockTargets = targets;
        } else assert.equal(await dock().isVisible(), false);
        if ([390, 1440].includes(width)) {
          await capture("after-home-" + width);
          await builderCapture("after-builder-" + width);
          await completeBuilderCapture(width);
        }
        return layout;
      });
    }

    await page.setViewportSize({ width: 390, height: 844 });
    for (const [name, path] of [
      ["Shop", "/collections"],
      ["Find", "/find-your-bracelet"],
      ["Create", "/products/make-your-own"],
    ]) {
      await test(
        "Dock " + name + " navigation and current-page state",
        async () => {
          await visit("/");
          await dock().getByRole("link", { name, exact: true }).click();
          await page.waitForURL("**" + path);
          await page.locator("main h1").first().waitFor({ state: "visible" });
          assert.equal(
            await dock()
              .getByRole("link", { name, exact: true })
              .getAttribute("aria-current"),
            "page",
          );
          assert.equal(
            await dock().locator('[aria-current="page"]').count(),
            1,
          );
          const layout = await layoutEvidence();
          assertLayout(layout);
          return { path: new URL(page.url()).pathname, current: name, layout };
        },
      );
    }

    for (const width of [320, 768, 1440]) {
      await test("Builder route remains usable at " + width, async () => {
        await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
        await visit("/products/make-your-own");
        const layout = await layoutEvidence();
        assertLayout(layout);
        return layout;
      });
    }

    await page.setViewportSize({ width: 390, height: 844 });
    for (const [opener, title] of [
      ["Open menu", "PASHAN menu"],
      ["Search PASHAN", "Search PASHAN"],
    ]) {
      await test(
        title + " suppresses dock and returns keyboard focus",
        async () => {
          await visit("/");
          const trigger = page.getByRole("button", {
            name: opener,
            exact: true,
          });
          await trigger.click();
          const dialog = page.getByRole("dialog", { name: title, exact: true });
          await dialog.waitFor({ state: "visible" });
          await dock().waitFor({ state: "hidden" });
          for (let count = 0; count < 4; count++) {
            await page.keyboard.press("Tab");
            assert(
              await dialog.evaluate((node) =>
                node.contains(document.activeElement),
              ),
              "Keyboard focus remains inside the dialog",
            );
          }
          if (title === "PASHAN menu") await capture("after-menu-390");
          else await capture("after-search-390");
          await page.keyboard.press("Escape");
          await dialog.waitFor({ state: "hidden" });
          await dock().waitFor({ state: "visible" });
          assert(
            await trigger.evaluate((node) => node === document.activeElement),
            "Dialog must return focus to its opener",
          );
          await trigger.click();
          await dialog.waitFor({ state: "visible" });
          await dialog
            .getByRole("button", {
              name: title === "PASHAN menu" ? "Close menu" : "Close search",
              exact: true,
            })
            .click();
          await dialog.waitFor({ state: "hidden" });
          await dock().waitFor({ state: "visible" });
          assert(
            await trigger.evaluate((node) => node === document.activeElement),
            "Close button must also return focus to its opener",
          );
          return {
            hiddenWhileOpen: true,
            focusContained: true,
            escapeCloses: true,
            focusReturned: true,
            closeButtonRestores: true,
          };
        },
      );
    }

    await test("Bag dialog suppresses dock, traps focus and restores its opener", async () => {
      await visit("/");
      const trigger = page.getByRole("button", { name: /^Open bag with/ });
      await trigger.click();
      const bag = page.getByRole("dialog", {
        name: "Your bracelets",
        exact: true,
      });
      await bag.waitFor({ state: "visible" });
      await dock().waitFor({ state: "hidden" });
      assert(
        await bag
          .getByRole("button", { name: "Close bag", exact: true })
          .evaluate((node) => node === document.activeElement),
      );
      for (let index = 0; index < 8; index++) {
        await page.keyboard.press("Tab");
        assert(
          await bag.evaluate((node) => node.contains(document.activeElement)),
        );
      }
      await page.keyboard.press("Escape");
      await bag.waitFor({ state: "hidden" });
      await dock().waitFor({ state: "visible" });
      assert(await trigger.evaluate((node) => node === document.activeElement));
      await trigger.click();
      await bag.getByRole("button", { name: "Close bag", exact: true }).click();
      await dock().waitFor({ state: "visible" });
      assert(await trigger.evaluate((node) => node === document.activeElement));
      return {
        hiddenWhileOpen: true,
        focusTrapped: true,
        escapeAndButtonClose: true,
        focusRestored: true,
      };
    });

    await test("Bag quantities, offers and removal work at 320px with a short viewport", async () => {
      await page.setViewportSize({ width: 320, height: 568 });
      await visit("/products/amethyst");
      await page.getByRole("button", { name: /^Add to bag/ }).click();
      const bag = page.getByRole("dialog", {
        name: "Your bracelets",
        exact: true,
      });
      await bag.waitFor({ state: "visible" });
      await bag.getByRole("button", { name: /^Increase quantity of/ }).click();
      assert.equal(
        await bag
          .locator('.bag-dialog-quantity [aria-label="Quantity 2"]')
          .count(),
        1,
      );
      const doubledSubtotal = await bag
        .locator(".bag-dialog-subtotal strong")
        .innerText();
      await bag.getByRole("button", { name: /^Decrease quantity of/ }).click();
      assert.equal(
        await bag
          .locator('.bag-dialog-quantity [aria-label="Quantity 1"]')
          .count(),
        1,
      );
      const singleSubtotal = await bag
        .locator(".bag-dialog-subtotal strong")
        .innerText();
      assert.notEqual(doubledSubtotal, singleSubtotal);
      await bag
        .getByRole("textbox", { name: "Offer code", exact: true })
        .fill("PASHAN10");
      await bag.getByRole("button", { name: "Apply", exact: true }).click();
      assert(
        await bag
          .getByRole("button", { name: "Remove offer PASHAN10", exact: true })
          .isVisible(),
      );
      assert(await bag.locator(".cart-offer-total").isVisible());
      const discountedTotal = await bag
        .locator(".cart-grand-total strong")
        .innerText();
      assert.notEqual(discountedTotal, singleSubtotal);
      const checkout = bag.getByRole("link", {
        name: "Proceed to Checkout",
        exact: true,
      });
      await checkout.scrollIntoViewIfNeeded();
      const geometry = await bag.evaluate((node) => {
        const rect = node.getBoundingClientRect();
        const scroller = node.querySelector(".bag-dialog-scroll");
        return {
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          width: node.clientWidth,
          scrollWidth: node.scrollWidth,
          scrollArea: {
            height: scroller.clientHeight,
            contentHeight: scroller.scrollHeight,
            width: scroller.clientWidth,
            scrollWidth: scroller.scrollWidth,
          },
          targets: [...node.querySelectorAll("button,a,input")]
            .filter((target) => target.checkVisibility())
            .map((target) => {
              const box = target.getBoundingClientRect();
              return {
                name:
                  target.getAttribute("aria-label") ||
                  target.textContent.trim(),
                width: box.width,
                height: box.height,
              };
            }),
        };
      });
      assert(
        geometry.left >= -1 &&
          geometry.right <= 321 &&
          geometry.top >= -1 &&
          geometry.bottom <= 569 &&
          geometry.scrollWidth <= geometry.width + 1,
      );
      assert(
        geometry.scrollArea.height > 0 &&
          geometry.scrollArea.contentHeight > geometry.scrollArea.height &&
          geometry.scrollArea.scrollWidth <= geometry.scrollArea.width + 1,
      );
      assert(
        geometry.targets.every(
          (target) => target.width >= 44 && target.height >= 44,
        ),
      );
      await capture("after-bag-320-short");
      await bag
        .getByRole("button", { name: "Remove offer PASHAN10", exact: true })
        .click();
      await bag
        .getByRole("button", { name: /^Remove .*, item 1, from bag$/ })
        .click();
      assert.equal(await bag.locator(".bag-dialog-line").count(), 0);
      assert(
        await bag
          .getByText("Your cart awaits intention.", { exact: true })
          .isVisible(),
      );
      await page.keyboard.press("Escape");
      await bag.waitFor({ state: "hidden" });
      await page.setViewportSize({ width: 390, height: 844 });
      return {
        singleSubtotal,
        doubledSubtotal,
        discountedTotal,
        geometry,
        removalWorks: true,
        noCheckoutOrOrder: true,
      };
    });

    for (const path of ["/cart", "/checkout"]) {
      await test("No dock in purchase flow " + path, async () => {
        await visit(path);
        assert.equal(await dock().isVisible(), false);
        return { path, dockHidden: true };
      });
    }

    await test("Focused form controls suppress dock without submitting data", async () => {
      await visit("/contact");
      await dock().waitFor({ state: "visible" });
      const name = page.getByRole("textbox", {
        name: "Your name",
        exact: true,
      });
      await name.focus();
      await dock().waitFor({ state: "hidden" });
      assert(await name.evaluate((node) => node === document.activeElement));
      await page.locator("main h1").evaluate((node) => {
        node.tabIndex = -1;
        node.focus();
      });
      await dock().waitFor({ state: "visible" });
      return {
        focusedInputHidden: true,
        focusOutsideRestores: true,
        noDataSubmitted: true,
      };
    });

    await test("Dock has visible keyboard focus and does not block native scrolling", async () => {
      await visit("/");
      await dock().getByRole("link", { name: "Shop", exact: true }).focus();
      await page.keyboard.press("Tab");
      const find = dock().getByRole("link", { name: "Find", exact: true });
      const focus = await find.evaluate((node) => ({
        focused: node === document.activeElement,
        visible: node.matches(":focus-visible"),
        outline: getComputedStyle(node).outlineStyle,
        outlineWidth: getComputedStyle(node).outlineWidth,
      }));
      assert(
        focus.focused &&
          focus.visible &&
          focus.outline !== "none" &&
          parseFloat(focus.outlineWidth) >= 2,
      );
      await page.keyboard.press("Tab");
      assert(
        await dock()
          .getByRole("link", { name: "Create", exact: true })
          .evaluate((node) => node === document.activeElement),
      );
      await page.mouse.move(150, 400);
      await page.mouse.wheel(0, 650);
      await page.waitForFunction(() => scrollY > 100);
      assert.notEqual(
        await page.evaluate(() => getComputedStyle(document.body).overflow),
        "hidden",
      );
      return { focus, nativeScrollY: await page.evaluate(() => scrollY) };
    });

    await test("Last footer links have reserved space above the mobile dock", async () => {
      await visit("/");
      await page.evaluate(() =>
        scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: "instant",
        }),
      );
      const spacing = await page.evaluate(() => {
        const footer = document.querySelector(".site-footer");
        const nav = document.querySelector(".pashan-mobile-dock");
        const footerLinks = [...footer.querySelectorAll("a")].filter((node) =>
          node.checkVisibility(),
        );
        return {
          padding: parseFloat(getComputedStyle(footer).paddingBottom),
          dockHeight: nav.getBoundingClientRect().height,
          dockTop: nav.getBoundingClientRect().top,
          lowestLinkBottom: Math.max(
            ...footerLinks.map((node) => node.getBoundingClientRect().bottom),
          ),
        };
      });
      assert(spacing.padding >= spacing.dockHeight + 20);
      assert(spacing.lowestLinkBottom < spacing.dockTop);
      return spacing;
    });

    await test("Original catalogue photographs load with a truthful custom-design caption", async () => {
      await visit("/collections");
      const cards = page.locator(".atelier-card");
      assert.equal(await cards.count(), 8);
      const photos = [];
      for (let index = 0; index < (await cards.count()); index++) {
        const card = cards.nth(index);
        await card.scrollIntoViewIfNeeded();
        await card.locator("img").evaluate((image) => image.decode());
        const photo = await card.locator("img").evaluate((image) => ({
          src: image.getAttribute("src"),
          currentSrc: image.currentSrc,
          alt: image.alt,
          width: image.naturalWidth,
          height: image.naturalHeight,
          objectFit: getComputedStyle(image).objectFit,
        }));
        assert(
          photo.src.startsWith("/images/originals/") &&
            photo.width > 0 &&
            photo.height > 0,
        );
        await card.locator(".atelier-card-image").evaluate((node) =>
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
        const path =
          output +
          "/after-photo-" +
          (await card.getAttribute("data-product")) +
          ".png";
        await card.locator(".atelier-card-image").screenshot({ path });
        screenshots.push(path);
        photos.push(photo);
      }
      assert.match(
        await page
          .locator('[data-product="make-your-own"] .atelier-photo-caption')
          .innerText(),
        /Existing mixed-stone piece shown for inspiration/,
      );
      return photos;
    });

    await test("Making-table light reveal is finite, repeatable, and never gates content", async () => {
      await visit("/");
      const surface = page.locator(".light-passage-surface");
      await surface.scrollIntoViewIfNeeded();
      await page.locator(".light-passage-glow").waitFor({ state: "attached" });
      await surface.locator("img").evaluate((image) => image.decode());
      assert(await surface.locator("img").isVisible());
      await page
        .locator(".light-passage-glow")
        .waitFor({ state: "detached", timeout: 2500 });
      await page
        .getByRole("button", { name: "Replay light", exact: true })
        .click();
      await page.locator(".light-passage-glow").waitFor({ state: "attached" });
      await page
        .locator(".light-passage-glow")
        .waitFor({ state: "detached", timeout: 2500 });
      assert.notEqual(
        await page.evaluate(() => getComputedStyle(document.body).overflow),
        "hidden",
      );
      await page.locator(".making-photo-table").evaluate((node) =>
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
      await capture("after-making-photo-390");
      return {
        initialFinite: true,
        replayFinite: true,
        photoAlwaysVisible: true,
        nativeScrollUnlocked: true,
      };
    });

    await test("Reduced motion keeps content visible and disables decorative animation", async () => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await visit("/");
      await page
        .getByRole("button", { name: "Entrance motion off", exact: true })
        .waitFor({ state: "visible" });
      assert.equal(await page.locator(".portal-doors").count(), 0);
      await dock().waitFor({ state: "visible" });
      await builderCapture("after-builder-reduced-390");
      const light = page.getByRole("button", {
        name: "Light motion off",
        exact: true,
      });
      await light.waitFor({ state: "visible" });
      assert(await light.isDisabled());
      assert.equal(await page.locator(".light-passage-glow").count(), 0);
      const motion = await page.evaluate(() => {
        const selectors = [
          ".pashan-mobile-dock",
          ".ritual-hero",
          ".makeover-builder",
        ];
        return selectors.map((selector) => {
          const node = document.querySelector(selector);
          const style = getComputedStyle(node);
          return {
            selector,
            opacity: style.opacity,
            animation: style.animationName,
            transitionDuration: style.transitionDuration,
          };
        });
      });
      assert(
        motion.every(
          (item) => Number(item.opacity) > 0 && item.animation === "none",
        ),
      );
      await page.emulateMedia({ reducedMotion: "no-preference" });
      return motion;
    });

    await test("No-JavaScript hero and making-table photographs remain visible", async () => {
      const fallback = await browser.newContext({
        javaScriptEnabled: false,
        viewport: { width: 390, height: 844 },
      });
      try {
        const staticPage = await fallback.newPage();
        await staticPage.goto(base, { waitUntil: "networkidle" });
        assert(await staticPage.locator("#ritual-hero-title").isVisible());
        assert(await staticPage.locator(".portal-arch img").isVisible());
        assert(await staticPage.locator(".making-photo-table img").isVisible());
        assert(
          await staticPage
            .getByRole("link", { name: "Start creating →", exact: true })
            .isVisible(),
        );
        return {
          heroVisible: true,
          photographsVisible: true,
          creationLinkVisible: true,
        };
      } finally {
        await fallback.close();
      }
    });

    await test("No browser page errors", async () => {
      assert.deepEqual(errors, []);
      return { errors };
    });
    const report = {
      base,
      checkedAt: new Date().toISOString(),
      scope:
        "Local-only experience refresh; no orders, payments, email, commit or deployment",
      summary: {
        passed: results.filter((item) => item.status === "pass").length,
        failed: results.filter((item) => item.status === "fail").length,
      },
      screenshots,
      results,
      errors,
    };
    await writeFile(
      "docs/experience-refresh-results.json",
      JSON.stringify(report, null, 2) + "\n",
    );
    console.log(JSON.stringify(report.summary));
    if (report.summary.failed) process.exitCode = 1;
  }
} finally {
  await browser.close();
}

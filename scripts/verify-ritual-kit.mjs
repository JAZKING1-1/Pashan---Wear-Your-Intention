import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
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
const output = "docs/screenshots/ritual-kit";
const baselineOnly = process.argv.includes("--baseline");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [],
  screenshots = [],
  errors = [];
await mkdir(output, { recursive: true });
async function visit(page, path = "/") {
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
async function settleEntrance(page) {
  const arch = page.locator(".portal-arch");
  if (await arch.count()) {
    await arch.scrollIntoViewIfNeeded();
    await page.locator(".portal-doors").waitFor({ state: "detached" });
    await page.waitForFunction(() => {
      scrollTo({ top: 0, behavior: "instant" });
      return Math.abs(scrollY) < 1;
    });
  }
}
async function capture(page, name) {
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
const profiles = [
  { name: "phone-390", width: 390, height: 844, hasTouch: true },
  { name: "tablet-820", width: 820, height: 1180, hasTouch: true },
  { name: "desktop-1440", width: 1440, height: 1000, hasTouch: false },
];
const responsiveProfiles = [
  { name: "narrow-320", width: 320, height: 740, hasTouch: true },
  profiles[0],
  { name: "tablet-768", width: 768, height: 1024, hasTouch: true },
  profiles[1],
  { name: "landscape-1180", width: 1180, height: 820, hasTouch: true },
  profiles[2],
];
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
async function layoutEvidence(page) {
  return page.evaluate(() => ({
    width: innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
    headings: [...document.querySelectorAll("h1,h2,h3")]
      .filter(
        (node) =>
          node.checkVisibility() &&
          !node.closest('[aria-hidden="true"],[inert]'),
      )
      .map((node) => {
        const box = node.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(node);
        const text = range.getBoundingClientRect();
        return {
          text: node.textContent.trim(),
          left: box.left,
          right: box.right,
          textLeft: text.left,
          textRight: text.right,
          clientWidth: node.clientWidth,
          scrollWidth: node.scrollWidth,
        };
      }),
  }));
}
function assertLayout(evidence) {
  assert(
    evidence.documentWidth <= evidence.width + 1 &&
      evidence.bodyWidth <= evidence.width + 1,
    "No horizontal page overflow",
  );
  assert.deepEqual(
    evidence.headings.filter(
      (item) =>
        item.scrollWidth > item.clientWidth + 2 ||
        item.textLeft < item.left - 3 ||
        item.textRight > item.right + 3,
    ),
    [],
    "Headings fit their own boxes",
  );
}
async function newPage(options = {}) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    ...options,
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(String(error)));
  return { context, page };
}
async function kitReady(page) {
  await page.locator(".ritual-kit-gallery").scrollIntoViewIfNeeded();
  await page
    .locator(".ritual-kit-gallery img")
    .evaluate((node) => node.decode());
}
async function positionAt(page, selector) {
  await page.locator(selector).evaluate((node) =>
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
async function checkAnchor(page) {
  const anchor = page.locator(".ritual-hero-kit");
  await anchor.focus();
  await page.keyboard.press("Enter");
  await page.waitForFunction(
    () => {
      const kit = document.querySelector("#ritual-kit").getBoundingClientRect();
      const header = document
        .querySelector(".site-header")
        .getBoundingClientRect();
      return kit.top >= header.bottom - 1 && kit.top <= header.bottom + 25;
    },
    { timeout: 5000 },
  );
  const evidence = await page.evaluate(() => ({
    hash: location.hash,
    top: document.querySelector("#ritual-kit").getBoundingClientRect().top,
    headerBottom: document.querySelector(".site-header").getBoundingClientRect()
      .bottom,
    activeId: document.activeElement.id,
    headingBottom: document
      .querySelector("#ritual-kit-title")
      .getBoundingClientRect().bottom,
    dockTop: document.querySelector(".pashan-mobile-dock")?.checkVisibility()
      ? document.querySelector(".pashan-mobile-dock").getBoundingClientRect()
          .top
      : innerHeight,
  }));
  assert.equal(evidence.hash, "#ritual-kit");
  assert.equal(evidence.activeId, "ritual-kit");
  assert(evidence.headingBottom < evidence.dockTop);
  return evidence;
}
try {
  if (baselineOnly) {
    for (const profile of profiles) {
      const context = await browser.newContext({
        viewport: { width: profile.width, height: profile.height },
        hasTouch: profile.hasTouch,
      });
      const page = await context.newPage();
      page.on("pageerror", (error) => errors.push(String(error)));
      await visit(page);
      await settleEntrance(page);
      await capture(page, "before-home-" + profile.name);
      await captureSection(
        page,
        ".ritual-hero",
        "before-hero-complete-" + profile.name,
      );
      await context.close();
      console.log("Captured baseline", profile.name);
    }
    console.log(JSON.stringify({ screenshots, errors }, null, 2));
  } else {
    for (const profile of responsiveProfiles) {
      const { context, page } = await newPage({
        viewport: { width: profile.width, height: profile.height },
        hasTouch: profile.hasTouch,
      });
      await visit(page);
      await settleEntrance(page);
      await test(
        page,
        profile.name + ": responsive layout and prominent inclusion",
        async () => {
          const layout = await layoutEvidence(page);
          assertLayout(layout);
          const placement = await page.evaluate(() => {
            const hero = document.querySelector(".ritual-hero");
            const kit = document.querySelector("#ritual-kit");
            const promise = document.querySelector(".ritual-hero-kit");
            return {
              nextToHero: hero.nextElementSibling === kit,
              nextSection: kit.nextElementSibling.className,
              heroPromise: promise.textContent.trim(),
              promiseHref: promise.getAttribute("href"),
              promiseTop: promise.getBoundingClientRect().top,
              headingTop: hero.querySelector("h1").getBoundingClientRect().top,
              promiseFont: getComputedStyle(promise).fontSize,
              title: document
                .querySelector("#ritual-kit-title")
                .textContent.trim(),
            };
          });
          assert.equal(placement.nextToHero, true);
          assert.match(placement.nextSection, /atelier-pathways/);
          assert.equal(
            placement.heroPromise,
            "A free ritual kit with every product.",
          );
          assert.equal(placement.promiseHref, "#ritual-kit");
          assert(placement.promiseTop < placement.headingTop);
          assert(placement.promiseTop < profile.height - 80);
          assert(parseFloat(placement.promiseFont) >= 14);
          assert.match(
            placement.title,
            /Not just a piece\.\s*A ritual, included\./,
          );
          return { layout, placement };
        },
      );
      await test(
        page,
        profile.name + ": keyboard anchor clears fixed header and dock",
        () => checkAnchor(page),
      );
      await test(
        page,
        profile.name +
          ": genuine responsive kit photograph and usable controls",
        async () => {
          await kitReady(page);
          const evidence = await page
            .locator(".ritual-kit-gallery")
            .evaluate((node) => {
              const img = node.querySelector("img");
              const box = node
                .querySelector(".ritual-kit-photo")
                .getBoundingClientRect();
              return {
                image: {
                  src: img.currentSrc,
                  naturalWidth: img.naturalWidth,
                  naturalHeight: img.naturalHeight,
                  alt: img.alt,
                },
                frame: { width: box.width, height: box.height },
                controls: [...node.querySelectorAll("button")].map(
                  (button) => ({
                    text: button.textContent.trim(),
                    pressed: button.getAttribute("aria-pressed"),
                    width: button.getBoundingClientRect().width,
                    height: button.getBoundingClientRect().height,
                    fontSize: getComputedStyle(button).fontSize,
                  }),
                ),
              };
            });
          assert.match(
            evidence.image.src,
            /\/images\/ritual-kit\/pashan-box-(480|960|1440)\.webp$/,
          );
          assert(
            evidence.image.naturalWidth > 0 &&
              evidence.image.naturalHeight > evidence.image.naturalWidth,
          );
          assert.match(evidence.image.alt, /Actual open PASHAN box/);
          assert(Math.abs(evidence.frame.width - evidence.frame.height) <= 1);
          assert.equal(
            evidence.controls.filter((item) => item.pressed === "true").length,
            1,
          );
          assert(
            evidence.controls.every(
              (item) =>
                item.width >= 44 &&
                item.height >= 44 &&
                parseFloat(item.fontSize) >= 14,
            ),
          );
          assert.equal(
            await page.locator(".ritual-kit-details-label").innerText(),
            "Inside the photographed box",
          );
          return evidence;
        },
      );
      if (profiles.some((item) => item.name === profile.name)) {
        await page.evaluate(() => {
          document.activeElement?.blur();
          scrollTo({ top: 0, behavior: "instant" });
        });
        await capture(page, "after-home-" + profile.name);
        await captureSection(
          page,
          ".ritual-hero",
          "after-hero-complete-" + profile.name,
        );
        await captureSection(
          page,
          "#ritual-kit",
          "after-kit-complete-" + profile.name,
        );
        await positionAt(page, ".ritual-kit-gallery");
        await capture(page, "after-kit-photo-" + profile.name);
      }
      await context.close();
    }
    const { context, page } = await newPage();
    await visit(page);
    await kitReady(page);
    await test(
      page,
      "Gallery keyboard selection updates one actual photograph and live caption",
      async () => {
        const group = page.getByRole("group", {
          name: "Choose a view of the ritual kit",
        });
        const presentation = group.getByRole("button", {
          name: "The presentation",
          exact: true,
        });
        const detail = group.getByRole("button", {
          name: "Ritual details",
          exact: true,
        });
        const image = page.locator(".ritual-kit-gallery img");
        const src = await image.getAttribute("src");
        await presentation.focus();
        await page.keyboard.press("Tab");
        assert(
          await detail.evaluate((node) => node === document.activeElement),
        );
        await page.keyboard.press("Enter");
        assert.equal(await detail.getAttribute("aria-pressed"), "true");
        assert.equal(await presentation.getAttribute("aria-pressed"), "false");
        assert.equal(await image.getAttribute("src"), src);
        assert.equal(
          await page.locator(".ritual-kit-photo.is-detail").count(),
          1,
        );
        const caption = page.locator(
          ".ritual-kit-gallery figcaption [aria-live=polite]",
        );
        assert.match(await caption.innerText(), /same box/);
        assert.equal(await caption.getAttribute("aria-atomic"), "true");
        const focus = await detail.evaluate((node) => ({
          outlineWidth: getComputedStyle(node).outlineWidth,
          outlineStyle: getComputedStyle(node).outlineStyle,
          outlineOffset: getComputedStyle(node).outlineOffset,
        }));
        assert.equal(focus.outlineWidth, "2px");
        assert.equal(focus.outlineStyle, "solid");
        await page.waitForFunction(() => {
          const transform = getComputedStyle(
            document.querySelector(".ritual-kit-gallery img"),
          ).transform;
          return transform.startsWith("matrix(1.45,");
        });
        await positionAt(page, ".ritual-kit-gallery");
        await capture(page, "after-kit-detail-phone-390");
        await page.keyboard.press("Shift+Tab");
        await page.keyboard.press("Space");
        assert.equal(await presentation.getAttribute("aria-pressed"), "true");
        assert.equal(await detail.getAttribute("aria-pressed"), "false");
        assert.equal(
          await page.locator(".ritual-kit-photo.is-presentation").count(),
          1,
        );
        assert.match(await caption.innerText(), /Rose Quartz bracelet/);
        return {
          sourceUnchanged: src,
          focus,
          caption: await caption.innerText(),
        };
      },
    );
    await test(
      page,
      "Full photograph opens a genuine uncropped image in a separate tab",
      async () => {
        const link = page.getByRole("link", {
          name: /^See the full photograph/,
        });
        assert.equal(await link.getAttribute("target"), "_blank");
        assert.match(await link.getAttribute("rel"), /noreferrer|noopener/);
        const popupPromise = page.waitForEvent("popup");
        await link.click();
        const popup = await popupPromise;
        await popup.waitForLoadState("load");
        assert.match(
          popup.url(),
          /\/images\/ritual-kit\/pashan-box-1440\.webp$/,
        );
        const image = popup.locator("img");
        const dimensions = await image.evaluate(async (node) => {
          await node.decode();
          return { width: node.naturalWidth, height: node.naturalHeight };
        });
        assert.equal(dimensions.width, 1440);
        assert(dimensions.height > dimensions.width);
        await popup.close();
        return dimensions;
      },
    );
    await test(
      page,
      "Choose your piece navigates to the actual catalogue",
      async () => {
        await page
          .locator(".ritual-kit-actions")
          .getByRole("link", { name: "Choose your piece" })
          .click();
        await page.waitForURL("**/collections");
        assert((await page.locator(".atelier-card").count()) > 0);
        return {
          url: page.url(),
          productCount: await page.locator(".atelier-card").count(),
        };
      },
    );
    await context.close();
    const reduced = await newPage({ reducedMotion: "reduce" });
    await visit(reduced.page);
    await test(
      reduced.page,
      "Reduced motion leaves content visible and gallery changes immediate",
      async () => {
        await kitReady(reduced.page);
        await reduced.page
          .getByRole("button", { name: "Ritual details", exact: true })
          .click();
        const evidence = await reduced.page
          .locator(".ritual-kit-gallery img")
          .evaluate((node) => ({
            transitionDuration: getComputedStyle(node).transitionDuration,
            animationName: getComputedStyle(node).animationName,
            opacity: getComputedStyle(node).opacity,
            detail: node.parentElement.classList.contains("is-detail"),
          }));
        assert(
          parseFloat(evidence.transitionDuration) <= 0.00001,
          "Reduced motion uses at most the site's 0.01ms near-zero duration",
        );
        assert.equal(evidence.animationName, "none");
        assert.equal(evidence.opacity, "1");
        assert.equal(evidence.detail, true);
        assert.equal(await reduced.page.locator(".portal-doors").count(), 0);
        return evidence;
      },
    );
    await reduced.context.close();
    const nojs = await newPage({ javaScriptEnabled: false });
    await visit(nojs.page);
    await test(
      nojs.page,
      "No JavaScript retains kit promise, actual photograph, contents and shopping links",
      async () => {
        await kitReady(nojs.page);
        assert.equal(
          await nojs.page.locator(".ritual-kit-promise").innerText(),
          "A free ritual kit with every product.",
        );
        assert.deepEqual(
          await nojs.page.locator(".ritual-kit-details h3").allTextContents(),
          ["Ganga Jal", "Dhoop", "A PASHAN note"],
        );
        assert.equal(
          await nojs.page.locator(".ritual-kit-actions a").getAttribute("href"),
          "/collections",
        );
        assert.equal(
          await nojs.page
            .locator(".ritual-kit-gallery figcaption a")
            .getAttribute("href"),
          "/images/ritual-kit/pashan-box-1440.webp",
        );
        const layout = await layoutEvidence(nojs.page);
        assertLayout(layout);
        return { renderedWithoutJavaScript: true, width: layout.width };
      },
    );
    await nojs.context.close();
    const failure = await newPage();
    await failure.context.route("**/images/ritual-kit/*.webp", (route) =>
      route.abort(),
    );
    await visit(failure.page);
    await test(
      failure.page,
      "Image failure gives an honest visible fallback without losing kit details",
      async () => {
        await failure.page
          .locator(".ritual-kit-gallery")
          .scrollIntoViewIfNeeded();
        const message = failure.page.locator(".ritual-kit-image-error");
        await message.waitFor({ state: "visible" });
        assert.equal(await message.getAttribute("role"), "status");
        assert.match(await message.innerText(), /photograph could not load/);
        assert.equal(
          await failure.page.locator(".ritual-kit-gallery img").count(),
          0,
        );
        assert.equal(
          await failure.page.locator(".ritual-kit-details h3").count(),
          3,
        );
        assert.equal(
          await failure.page
            .locator(".ritual-kit-actions a")
            .getAttribute("href"),
          "/collections",
        );
        const layout = await layoutEvidence(failure.page);
        assertLayout(layout);
        return { message: await message.innerText(), detailsRetained: true };
      },
    );
    await failure.context.close();
    results.push({
      name: "No uncaught browser JavaScript errors",
      status: errors.length ? "fail" : "pass",
      evidence: errors,
    });
    const report = {
      base,
      timestamp: new Date().toISOString(),
      passed: results.filter((item) => item.status === "pass").length,
      failed: results.filter((item) => item.status === "fail").length,
      results,
      screenshots,
      errors,
      limitations: [
        "Local-only prototype verification; no payments, email, orders, production changes or inferred kit contents.",
        "Complete-section captures use a temporarily taller same-width viewport to avoid fixed-header and dock overlays; normal viewport captures are supplied separately.",
        "No-JavaScript verifies static content, not interactive gallery behavior.",
      ],
    };
    await writeFile(
      "docs/ritual-kit-results.json",
      JSON.stringify(report, null, 2) + "\n",
    );
    console.log(
      JSON.stringify(
        { passed: report.passed, failed: report.failed, errors, screenshots },
        null,
        2,
      ),
    );
    if (report.failed) process.exitCode = 1;
  }
} finally {
  await browser.close();
}

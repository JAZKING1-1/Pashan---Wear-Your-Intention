import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";

const require = createRequire(
  process.env.PASHAN_PLAYWRIGHT_ROOT + "/package.json",
);
const { chromium } = require("playwright");
const base = process.env.PASHAN_BASE_URL || "http://127.0.0.1:8084";
const output = "docs/screenshots/headings";
const reportPath = "docs/heading-font-results.json";
const baselineOnly = process.argv.includes("--baseline");
const finderRefresh = process.argv.includes("--refresh-finder");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
});
const page = await context.newPage();
page.setDefaultTimeout(12000);
const results = [],
  errors = [],
  captures = [];
page.on("pageerror", (error) => errors.push(String(error)));
await mkdir(output, { recursive: true });
const visit = (path) => page.goto(base + path, { waitUntil: "networkidle" });

async function capture(name, fullPage = false) {
  await page.screenshot({ path: output + "/" + name + ".png", fullPage });
  captures.push(output + "/" + name + ".png");
}

async function test(name, fn) {
  if (
    finderRefresh &&
    !name.startsWith("Heading font and reflow /find-your-bracelet ")
  )
    return;
  try {
    const evidence = await fn();
    results.push({ name, status: "pass", ...(evidence ? { evidence } : {}) });
    console.log("PASS", name);
  } catch (error) {
    results.push({ name, status: "fail", error: String(error) });
    console.log("FAIL", name, String(error));
    await capture("failure-" + results.length);
  }
}

async function headingEvidence() {
  return page
    .locator("h1,h2,h3,h4,h5,h6,[role=heading],.pashan-heading,.font-heading")
    .evaluateAll((nodes) =>
      nodes
        .filter(
          (node) =>
            node.checkVisibility() &&
            !node.closest('[aria-hidden="true"],[inert]') &&
            node.getBoundingClientRect().width > 2,
        )
        .map((node) => {
          const style = getComputedStyle(node);
          const box = node.getBoundingClientRect();
          const range = document.createRange();
          range.selectNodeContents(node);
          const text = range.getBoundingClientRect();
          return {
            tag: node.tagName,
            text: node.textContent.trim(),
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            fontStyle: style.fontStyle,
            lineHeight: style.lineHeight,
            left: box.left,
            right: box.right,
            width: box.width,
            clientWidth: node.clientWidth,
            scrollWidth: node.scrollWidth,
            textLeft: text.left,
            textRight: text.right,
            textWidth: text.width,
          };
        }),
    );
}

if (baselineOnly) {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    for (const [path, name] of [
      ["/", "home"],
      ["/rashi", "rashi"],
      ["/find-your-bracelet", "finder"],
      ["/collections", "catalogue"],
    ]) {
      await test("Baseline " + name + " at " + width, async () => {
        await visit(path);
        const headings = await headingEvidence();
        await capture("before-" + name + "-" + width);
        return {
          headings,
          headingPatchAlreadyPresent: headings.every((heading) =>
            heading.fontFamily.includes("Cinzel"),
          ),
        };
      });
    }
  }
} else {
  const routes = [
    "/",
    "/collections",
    "/products/amethyst",
    "/products/make-your-own",
    "/rashi",
    "/rakhi/rashi/aries",
    "/find-your-bracelet",
    "/about",
    "/journal",
    "/rituals",
    "/contact",
    "/cart",
    "/checkout",
    "/search",
  ];
  const capturesFor = new Map([
    ["/", "home"],
    ["/collections", "catalogue"],
    ["/rashi", "rashi"],
    ["/find-your-bracelet", "finder"],
  ]);
  const cdp = await context.newCDPSession(page);
  await cdp.send("DOM.enable");
  await cdp.send("CSS.enable");
  const renderedFonts = async (selector) => {
    const { root } = await cdp.send("DOM.getDocument");
    const { nodeId } = await cdp.send("DOM.querySelector", {
      nodeId: root.nodeId,
      selector,
    });
    assert(nodeId > 0, selector + " must resolve");
    return (await cdp.send("CSS.getPlatformFontsForNode", { nodeId })).fonts;
  };

  await test("Cinzel loads as a real web font and renders the English hero", async () => {
    await visit("/");
    const faces = await page.evaluate(async () => {
      const fonts = await document.fonts.load(
        "500 32px Cinzel",
        "Wear the quality you wish to become",
      );
      await document.fonts.ready;
      return fonts.map((font) => ({
        family: font.family,
        status: font.status,
        weight: font.weight,
      }));
    });
    assert(faces.length > 0 && faces.every((font) => font.status === "loaded"));
    const actual = await renderedFonts("#ritual-hero-title");
    assert(
      actual.some(
        (font) => /Cinzel/i.test(font.familyName) && font.glyphCount > 0,
      ),
    );
    return { faces, actual };
  });

  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
    for (const route of routes) {
      await test(
        "Heading font and reflow " + route + " at " + width + "px",
        async () => {
          await visit(route);
          await page.evaluate(() => document.fonts.ready);
          const headings = await headingEvidence();
          assert(headings.length > 0);
          assert.deepEqual(
            headings.filter(
              (heading) => !heading.fontFamily.includes("Cinzel"),
            ),
            [],
            "Every visible heading uses the heading stack",
          );
          const textOverflow = headings.filter(
            (heading) =>
              heading.scrollWidth > heading.clientWidth + 2 ||
              heading.textLeft < heading.left - 3 ||
              heading.textRight > heading.right + 3,
          );
          assert.deepEqual(
            textOverflow,
            [],
            "Heading text must fit its own box",
          );
          const pageOverflow = await page.evaluate(() => ({
            viewport: innerWidth,
            document: document.documentElement.scrollWidth,
            body: document.body.scrollWidth,
          }));
          assert(
            pageOverflow.document <= width + 1 &&
              pageOverflow.body <= width + 1,
            JSON.stringify(pageOverflow),
          );
          const changedControls = await page
            .locator(
              "button,input,select,textarea,.ritual-hero-lede,.rashi-card-price,.atelier-card-price,.product-price-line strong",
            )
            .evaluateAll((nodes) =>
              nodes
                .filter(
                  (node) =>
                    node.checkVisibility() &&
                    !node.closest('[aria-hidden="true"],[inert]') &&
                    getComputedStyle(node).fontFamily.includes("Cinzel"),
                )
                .map((node) => ({
                  tag: node.tagName,
                  text: node.textContent.trim().slice(0, 60),
                  fontFamily: getComputedStyle(node).fontFamily,
                })),
            );
          assert.deepEqual(
            changedControls,
            [],
            "Body, prices and controls must not inherit the heading font",
          );
          const bodyFont = await page.evaluate(
            () => getComputedStyle(document.body).fontFamily,
          );
          assert(bodyFont.includes("Inter"));
          if ([390, 1440].includes(width) && capturesFor.has(route))
            await capture("after-" + capturesFor.get(route) + "-" + width);
          return { headings, pageOverflow, bodyFont };
        },
      );
    }
  }

  await test("Search and bag overlay headings use Cinzel without overflowing on mobile", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await visit("/");
    await page
      .getByRole("button", { name: "Search PASHAN", exact: true })
      .click();
    const search = page.getByRole("dialog");
    await search.waitFor();
    const searchTitle = search.locator("h2");
    assert(
      await searchTitle.evaluate(
        (node) =>
          getComputedStyle(node).fontFamily.includes("Cinzel") &&
          node.scrollWidth <= node.clientWidth + 2,
      ),
    );
    await capture("search-390");
    await page
      .getByRole("button", { name: "Close search", exact: true })
      .click();
    await page.getByRole("button", { name: /^Open bag with/ }).click();
    const bag = page.locator('aside[aria-label="Cart"]');
    await page.waitForFunction(
      () =>
        document
          .querySelector('aside[aria-label="Cart"]')
          .getAttribute("aria-hidden") === "false",
    );
    assert(
      await bag
        .locator("h2")
        .evaluate(
          (node) =>
            getComputedStyle(node).fontFamily.includes("Cinzel") &&
            node.scrollWidth <= node.clientWidth + 2,
        ),
    );
    await capture("bag-390");
    await bag.getByRole("button", { name: "Close", exact: true }).click();
  });

  await test("Shared 3D viewer heading uses Cinzel and keeps interface controls readable", async () => {
    await visit("/collections");
    await page.locator('[data-product="pyrite"] button').click();
    const dialog = page.getByRole("dialog");
    await dialog.waitFor();
    assert(
      await dialog
        .locator("h2")
        .evaluate(
          (node) =>
            getComputedStyle(node).fontFamily.includes("Cinzel") &&
            node.scrollWidth <= node.clientWidth + 2,
        ),
    );
    await capture("product-viewer-390");
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
  });

  for (const locale of ["hi", "ar"]) {
    await test(
      "Translated " + locale + " hero renders glyphs and reflows at 320px",
      async () => {
        await page.setViewportSize({ width: 320, height: 844 });
        await visit("/?lang=" + locale);
        await page.evaluate(async () => {
          await document.fonts.load(
            '500 32px "Noto Serif Devanagari"',
            "नमस्ते",
          );
          await document.fonts.ready;
        });
        const title = page.locator("#ritual-hero-title");
        assert.equal(await title.getAttribute("lang"), locale);
        const shape = await title.evaluate((node) => ({
          text: node.textContent,
          font: getComputedStyle(node).fontFamily,
          direction: getComputedStyle(node).direction,
          client: node.clientWidth,
          scroll: node.scrollWidth,
        }));
        assert(shape.text.length > 0 && shape.scroll <= shape.client + 2);
        assert.equal(shape.direction, locale === "ar" ? "rtl" : "ltr");
        const actual = await renderedFonts("#ritual-hero-title");
        assert(actual.some((font) => font.glyphCount > 0));
        if (locale === "hi")
          assert(actual.some((font) => /Devanagari/i.test(font.familyName)));
        assert(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
        );
        await capture("translated-" + locale + "-320");
        return { shape, actual };
      },
    );
  }

  await test("No uncaught browser errors in heading verification", async () =>
    assert.deepEqual(errors, []));
}

let previous = {};
try {
  previous = JSON.parse(await readFile(reportPath, "utf8"));
} catch {}
const report = {
  ...previous,
  [baselineOnly
    ? "baseline"
    : finderRefresh
      ? "finderRefresh"
      : "verification"]: {
    capturedAt: new Date().toISOString(),
    base,
    results,
    errors,
    captures,
  },
};
await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
await browser.close();
process.exitCode =
  results.some((result) => result.status === "fail") || errors.length ? 1 : 0;

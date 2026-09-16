import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";

const require = createRequire(
  process.env.PASHAN_PLAYWRIGHT_ROOT + "/package.json",
);
const { chromium } = require("playwright");
const base = process.env.PASHAN_BASE_URL || "http://127.0.0.1:8084";
const output = "docs/screenshots/ritual";
const reportPath = "docs/ritual-browser-results.json";
const baselineOnly = process.argv.includes("--baseline");
const mainOnly = process.argv.includes("--main-only");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [],
  errors = [],
  captures = [];
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
});
const page = await context.newPage();
page.setDefaultTimeout(10000);
page.on("pageerror", (error) => errors.push(String(error)));
const visit = (path) => page.goto(base + path, { waitUntil: "networkidle" });

async function capture(name, fullPage = true) {
  if (fullPage) {
    for (const image of await page.locator("main img").all()) {
      if (await image.isVisible()) {
        await image.scrollIntoViewIfNeeded();
        await image.evaluate((img) =>
          Promise.race([
            img.decode().catch(() => {}),
            new Promise((resolve) => setTimeout(resolve, 2000)),
          ]),
        );
      }
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  }
  await page.screenshot({ path: output + "/" + name + ".png", fullPage });
  captures.push(output + "/" + name + ".png");
}

async function test(name, fn) {
  try {
    const evidence = await fn();
    results.push({ name, status: "pass", ...(evidence ? { evidence } : {}) });
    console.log("PASS", name);
  } catch (error) {
    results.push({ name, status: "fail", error: String(error) });
    console.log("FAIL", name, String(error));
    await capture("failure-" + results.length, false);
  }
}

async function writeReport() {
  let previous = {};
  try {
    previous = JSON.parse(await readFile(reportPath, "utf8"));
  } catch {}
  const current = {
    capturedAt: new Date().toISOString(),
    base,
    scope: baselineOnly ? "baseline" : mainOnly ? "home-and-rashi" : "complete",
    results,
    errors,
    captures,
  };
  const report = baselineOnly
    ? { ...previous, baseline: current }
    : { ...previous, verification: current };
  await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
}

if (baselineOnly) {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    for (const [path, name] of [
      ["/", "home"],
      ["/rashi", "rashi"],
    ]) {
      await test("Baseline " + name + " at " + width, async () => {
        await visit(path);
        const newPortalAlreadyPresent =
          (await page.locator(".ritual-portal,.ritual-home").count()) > 0;
        await capture("before-" + name + "-" + width);
        return { newPortalAlreadyPresent, title: await page.title() };
      });
    }
  }
} else {
  await test("Portal is non-modal, immediately skippable, and preserves native scrolling", async () => {
    await page.goto(base + "/", { waitUntil: "networkidle" });
    const initialVisibility = await page
      .locator(".portal-arch")
      .evaluate((element) => {
        const box = element.getBoundingClientRect();
        return (
          Math.max(
            0,
            Math.min(box.bottom, innerHeight) - Math.max(0, box.top),
          ) / box.height
        );
      });
    if (initialVisibility < 0.35) {
      assert.equal(
        await page.evaluate(() =>
          sessionStorage.getItem("pashan-portal-seen-v1"),
        ),
        null,
        "An unseen entrance must not be marked seen before scrolling",
      );
      assert.equal(await page.locator(".portal-doors").count(), 0);
    }
    await page.locator(".portal-arch").scrollIntoViewIfNeeded();
    await page
      .getByRole("button", { name: "Skip entrance", exact: true })
      .waitFor({ state: "visible" });
    assert.equal(await page.getByRole("dialog").count(), 0);
    assert.notEqual(
      await page.evaluate(() => getComputedStyle(document.body).overflow),
      "hidden",
    );
    assert.notEqual(
      await page.evaluate(
        () => getComputedStyle(document.documentElement).overflow,
      ),
      "hidden",
    );
    const started = Date.now();
    await page
      .getByRole("button", { name: "Skip entrance", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Replay entrance", exact: true })
      .waitFor({ state: "visible" });
    assert(
      Date.now() - started < 1800,
      "Skip must not wait for a timed entrance",
    );
    const scrollBefore = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, 400);
    await page.waitForFunction(
      (before) => window.scrollY > before,
      scrollBefore,
    );
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    return {
      initialVisibility,
      skipCompletionMs: Date.now() - started,
      sessionSeen: await page.evaluate(() =>
        sessionStorage.getItem("pashan-portal-seen-v1"),
      ),
    };
  });

  await test("Portal replay works, one session entrance persists, and route changes do not stack it", async () => {
    await page
      .getByRole("button", { name: "Replay entrance", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Skip entrance", exact: true })
      .waitFor();
    assert.equal(await page.locator(".ritual-portal").count(), 1);
    await page
      .getByRole("button", { name: "Skip entrance", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Replay entrance", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Replay entrance", exact: true })
      .click();
    const autoStart = Date.now();
    await page.evaluate(() =>
      window.scrollTo({
        top:
          document.querySelector(".ritual-portal").getBoundingClientRect().top +
          window.scrollY -
          document.querySelector(".site-header").getBoundingClientRect()
            .height -
          16,
        behavior: "instant",
      }),
    );
    await capture("portal-entrance-390", false);
    await page
      .getByRole("button", { name: "Replay entrance", exact: true })
      .waitFor({ state: "visible", timeout: 3000 });
    const autoCompletionMs = Date.now() - autoStart;
    assert.equal(await page.locator(".portal-doors").count(), 0);
    await capture("portal-open-390", false);
    assert.equal(
      await page.evaluate(() =>
        sessionStorage.getItem("pashan-portal-seen-v1"),
      ),
      "1",
    );
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(
      await page
        .getByRole("button", { name: "Skip entrance", exact: true })
        .count(),
      0,
    );
    await visit("/rashi");
    assert.equal(await page.locator(".ritual-portal").count(), 1);
    assert.equal(
      await page
        .getByRole("button", { name: "Skip entrance", exact: true })
        .count(),
      0,
    );
    return { autoCompletionMs };
  });

  await test("Sacred story buttons switch pressed state and story, and artwork finishes", async () => {
    const stories = page.locator(".sacred-stories");
    await stories.scrollIntoViewIfNeeded();
    const choices = stories.getByRole("group", {
      name: "Explore a deity's story",
    });
    assert.equal(await choices.getByRole("button").count(), 3);
    const texts = [];
    for (const name of ["Ganesha", "Shiva", "Lakshmi"]) {
      const button = choices.getByRole("button", {
        name: new RegExp(name, "i"),
      });
      await button.click();
      assert.equal(await button.getAttribute("aria-pressed"), "true");
      assert.equal(
        await choices.locator('button[aria-pressed="true"]').count(),
        1,
      );
      const panel = stories.locator(".sacred-story");
      assert.equal(await panel.count(), 1);
      texts.push(await panel.innerText());
    }
    assert.equal(new Set(texts).size, 3);
    const play = stories.getByRole("button", { name: /Play artwork/i });
    await play.click();
    await page.waitForFunction(
      () => {
        const root = document.querySelector(".sacred-stories");
        return (
          root &&
          root
            .getAnimations({ subtree: true })
            .every((animation) => animation.playState !== "running")
        );
      },
      null,
      { timeout: 7000 },
    );
    assert(await play.isEnabled());
    await page.evaluate(() =>
      window.scrollTo({
        top:
          document.querySelector(".sacred-art").getBoundingClientRect().top +
          window.scrollY -
          document.querySelector(".site-header").getBoundingClientRect()
            .height -
          16,
        behavior: "instant",
      }),
    );
    await capture("sacred-stories-mobile", false);
    return {
      stories: ["Ganesha", "Shiva", "Lakshmi"],
      distinctPanels: new Set(texts).size,
    };
  });

  await test("Dismissing the offer strip shrinks the header and matching main offset", async () => {
    await visit("/");
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    const metrics = () =>
      page.evaluate(() => ({
        headerHeight: document
          .querySelector(".site-header")
          .getBoundingClientRect().height,
        mainPadding: Number.parseFloat(
          getComputedStyle(document.querySelector(".site-main")).paddingTop,
        ),
      }));
    const before = await metrics();
    await page
      .getByRole("button", { name: "Dismiss offer", exact: true })
      .click();
    await page.waitForFunction(
      (height) =>
        document.querySelector(".site-header").getBoundingClientRect().height <
        height,
      before.headerHeight,
    );
    const after = await metrics();
    assert(
      after.mainPadding < before.mainPadding,
      "Main padding must shrink with the dismissed strip",
    );
    assert(
      Math.abs(after.mainPadding - after.headerHeight) <= 2,
      "No empty header-offset gap",
    );
    return { before, after };
  });

  await test("Mobile navigation retains keyboard trapping, Escape and opener focus after visual changes", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await visit("/");
    const opener = page.getByRole("button", { name: "Open menu", exact: true });
    await opener.click();
    const dialog = page.getByRole("dialog", { name: "PASHAN menu" });
    await dialog.waitFor();
    for (let index = 0; index < 26; index++) {
      await page.keyboard.press("Tab");
      assert(
        await dialog.evaluate((element) =>
          element.contains(document.activeElement),
        ),
      );
    }
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    assert(
      await opener.evaluate((element) => element === document.activeElement),
    );
    assert.equal(await page.locator(".portal-doors").count(), 0);
  });

  await test("Rashi cards retain all twelve uncropped original photographs and an aligned grid", async () => {
    await visit("/rashi");
    const cards = page.locator(".rashi-product-card");
    assert.equal(await cards.count(), 12);
    assert.equal(
      await page
        .locator(".rashi-card-price strong")
        .allTextContents()
        .then((values) => values.every((value) => value === "₹899")),
      true,
    );
    const images = [];
    for (const image of await page.locator(".rashi-card-photo img").all()) {
      await image.scrollIntoViewIfNeeded();
      const details = await image.evaluate(async (img) => {
        await img.decode();
        return {
          src: new URL(img.currentSrc).pathname,
          width: img.naturalWidth,
          height: img.naturalHeight,
          objectFit: getComputedStyle(img).objectFit,
        };
      });
      assert(details.width > 0 && details.height > 0);
      assert.equal(
        details.objectFit,
        "contain",
        "Product photos must not be cropped to fill",
      );
      images.push(details);
    }
    assert.equal(new Set(images.map((img) => img.src)).size, 12);
    const geometry = await cards.evaluateAll((nodes) =>
      nodes.map((node) => ({
        top: node.getBoundingClientRect().top,
        height: node.getBoundingClientRect().height,
        shadow: getComputedStyle(node).boxShadow,
      })),
    );
    assert(Math.abs(geometry[0].top - geometry[1].top) <= 1);
    assert(Math.abs(geometry[0].height - geometry[1].height) <= 1);
    assert(
      geometry.every((card) => card.shadow === "none"),
      "No legacy offset gold card shadows",
    );
    await page.evaluate(() =>
      window.scrollTo({
        top:
          document.querySelector(".rashi-product-grid").getBoundingClientRect()
            .top +
          window.scrollY -
          document.querySelector(".site-header").getBoundingClientRect()
            .height -
          16,
        behavior: "instant",
      }),
    );
    await capture("rashi-cards-390", false);
    return { images, firstRow: geometry.slice(0, 2) };
  });

  await test("Rashi dark-surface body text meets 4.5:1 contrast", async () => {
    const samples = await page
      .locator(
        ".rashi-hero-copy > p:not(.rashi-eyebrow),.rashi-card-intention,.rashi-card-copy .rashi-small",
      )
      .evaluateAll((elements) =>
        elements.map((element) => {
          let parent = element;
          let background = "rgb(255, 255, 255)";
          while (parent) {
            const value = getComputedStyle(parent).backgroundColor;
            if (value !== "rgba(0, 0, 0, 0)" && value !== "transparent") {
              background = value;
              break;
            }
            parent = parent.parentElement;
          }
          return {
            text: element.textContent.trim().slice(0, 70),
            foreground: getComputedStyle(element).color,
            background,
          };
        }),
      );
    const luminance = (colour) => {
      const channels = colour
        .match(/[\d.]+/g)
        .slice(0, 3)
        .map(Number)
        .map((value) => value / 255)
        .map((value) =>
          value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
        );
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    };
    const checked = samples.map((sample) => {
      const a = luminance(sample.foreground),
        b = luminance(sample.background);
      return {
        ...sample,
        contrast: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
      };
    });
    assert.deepEqual(
      checked.filter((sample) => sample.contrast < 4.5),
      [],
    );
    return { samples: checked };
  });

  await test("Daily note reveals without consent gates, copies actual text and freezes across Kolkata midnight", async () => {
    const noteContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const notePage = await noteContext.newPage();
    notePage.on("pageerror", (error) => errors.push(String(error)));
    try {
      await notePage.clock.setFixedTime(new Date("2026-09-16T18:29:50Z"));
      await notePage.goto(base + "/", { waitUntil: "networkidle" });
      await notePage
        .getByRole("button", { name: "Turn the beads", exact: true })
        .click();
      const oldNote = await notePage
        .locator("#ritual-daily-note blockquote")
        .innerText();
      assert(oldNote.length > 10);
      assert.equal(await notePage.getByRole("dialog").count(), 0);
      await notePage.clock.setFixedTime(new Date("2026-09-16T18:30:10Z"));
      await notePage
        .getByRole("button", { name: "Today's note is open", exact: true })
        .click();
      assert.equal(
        await notePage.locator("#ritual-daily-note blockquote").innerText(),
        oldNote,
      );
      await notePage.reload({ waitUntil: "networkidle" });
      await notePage
        .getByRole("button", { name: "Turn the beads", exact: true })
        .click();
      const newNote = await notePage
        .locator("#ritual-daily-note blockquote")
        .innerText();
      assert.notEqual(newNote, oldNote);
      await notePage
        .getByRole("button", { name: "Copy text", exact: true })
        .click();
      await notePage
        .getByRole("status")
        .filter({ hasText: "Copied to clipboard." })
        .waitFor();
      assert.equal(
        await notePage.evaluate(() => navigator.clipboard.readText()),
        newNote + " — PASHAN",
      );
      await notePage.clock.setFixedTime(new Date("2026-09-16T18:29:50Z"));
      await notePage.reload({ waitUntil: "networkidle" });
      await notePage.clock.setFixedTime(new Date("2026-09-16T18:30:10Z"));
      await notePage
        .getByRole("button", { name: "Turn the beads", exact: true })
        .click();
      assert.equal(
        await notePage.locator("#ritual-daily-note blockquote").innerText(),
        newNote,
        "An idle unopened note must use the date when first activated",
      );
      await notePage.evaluate(() =>
        window.scrollTo({
          top:
            document
              .querySelector(".ritual-note-circle")
              .getBoundingClientRect().top +
            window.scrollY -
            document.querySelector(".site-header").getBoundingClientRect()
              .height -
            16,
          behavior: "instant",
        }),
      );
      await notePage.screenshot({ path: output + "/daily-note-390.png" });
      captures.push(output + "/daily-note-390.png");
      return {
        oldNote,
        newNote,
        rolloverUTC: "2026-09-16T18:30:00Z",
        rolloverZone: "Asia/Kolkata",
      };
    } finally {
      await noteContext.close();
    }
  });

  await test("Arabic shell preserves left-to-right deity illustration and matching story buttons", async () => {
    const rtlContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const rtlPage = await rtlContext.newPage();
    rtlPage.on("pageerror", (error) => errors.push(String(error)));
    try {
      await rtlPage.goto(base + "/?lang=ar", { waitUntil: "networkidle" });
      assert.equal(await rtlPage.locator("html").getAttribute("dir"), "rtl");
      const stories = rtlPage.locator(".sacred-stories");
      assert.equal(await stories.getAttribute("dir"), "ltr");
      const buttons = stories.locator(".sacred-choices button");
      const order = await buttons.evaluateAll((elements) =>
        elements.map((element) => ({
          name: element.querySelector("span").textContent,
          left: element.getBoundingClientRect().left,
        })),
      );
      assert.deepEqual(
        order.map((item) => item.name),
        ["Ganesha", "Shiva", "Lakshmi"],
      );
      assert(order[0].left < order[1].left && order[1].left < order[2].left);
      await stories.getByRole("button", { name: /^Lakshmi/ }).click();
      assert.equal(
        await stories.locator(".sacred-story .ritual-kicker").textContent(),
        "Lakshmi",
      );
      return { order };
    } finally {
      await rtlContext.close();
    }
  });

  if (!mainOnly) {
    const chooseFinder = async (label) => {
      const option = page
        .locator(".ritual-finder-option")
        .filter({ has: page.locator("strong", { hasText: label }) });
      await option.focus();
      await page.keyboard.press("Enter");
      assert.equal(await option.getAttribute("aria-pressed"), "true");
    };
    const nextFinder = async () => {
      await page
        .locator(".ritual-finder-actions .ritual-finder-primary")
        .click();
      await page.waitForFunction(
        () => document.activeElement?.id === "finder-question",
      );
    };
    await test("Finder keyboard choices, Back and reload preserve answers and recommend Amethyst transparently", async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await visit("/find-your-bracelet");
      await page.locator('[data-finder-ready="true"]').waitFor();
      assert(
        await page
          .getByRole("button", { name: "Continue", exact: true })
          .isDisabled(),
      );
      await chooseFinder("A quieter moment");
      await nextFinder();
      await page.getByRole("button", { name: "Back", exact: true }).click();
      assert.equal(
        await page
          .locator('.ritual-finder-option[aria-pressed="true"] strong')
          .innerText(),
        "A quieter moment",
      );
      await nextFinder();
      await chooseFinder("Violet & green");
      await nextFinder();
      await page.reload({ waitUntil: "networkidle" });
      await page.locator('[data-finder-ready="true"]').waitFor();
      assert.equal(
        await page.locator("#finder-question").innerText(),
        "How do you want to wear it?",
      );
      await chooseFinder("A considered accent");
      await nextFinder();
      await chooseFinder("Up to ₹999");
      await nextFinder();
      assert.equal(
        await page
          .locator("[data-finder-product]")
          .first()
          .getAttribute("data-finder-product"),
        "amethyst",
      );
      const recommendations = await page
        .locator("[data-finder-product]")
        .evaluateAll((elements) =>
          elements.map((element) => ({
            slug: element.getAttribute("data-finder-product"),
            price: element.querySelector(".ritual-finder-result-title > span")
              .textContent,
            reasons: element.querySelectorAll("li").length,
          })),
        );
      assert(
        recommendations.every(
          (product) =>
            Number(product.price.replace(/[^\d]/g, "")) <= 999 &&
            product.reasons > 0,
        ),
      );
      await page
        .getByText("How these suggestions are chosen", { exact: true })
        .click();
      assert(
        await page
          .locator(".ritual-finder-method")
          .innerText()
          .then(
            (text) =>
              text.includes("8 points") &&
              text.includes("budget is a strict limit"),
          ),
      );
      await capture("finder-results-390");
      await page.locator("#finder-question").scrollIntoViewIfNeeded();
      await capture("finder-results-preview-390", false);
      await page.evaluate(() =>
        window.scrollTo({
          top:
            document
              .querySelector("[data-finder-product]")
              .getBoundingClientRect().top +
            window.scrollY -
            document.querySelector(".site-header").getBoundingClientRect()
              .height -
            16,
          behavior: "instant",
        }),
      );
      await capture("finder-recommendation-390", false);
      await page.reload({ waitUntil: "networkidle" });
      await page.locator('[data-finder-ready="true"]').waitFor();
      assert.equal(
        await page
          .locator("[data-finder-product]")
          .first()
          .getAttribute("data-finder-product"),
        "amethyst",
      );
      const stored = await page.evaluate(() =>
        JSON.parse(sessionStorage.getItem("pashan-bracelet-finder-v1")),
      );
      assert.equal(stored.version, 1);
      assert.equal(stored.step, 4);
      assert.equal(new URL(page.url()).search, "");
      return { recommendations, session: stored };
    });

    await test("Finder budget edit shows an honest empty state and never recommends above ₹799", async () => {
      await page
        .locator(".ritual-finder-answer-summary")
        .getByRole("button", { name: /^Budget/ })
        .click();
      await chooseFinder("Up to ₹799");
      await nextFinder();
      assert.equal(
        await page.locator("#finder-question").innerText(),
        "Let’s keep your budget.",
      );
      assert.equal(await page.locator("[data-finder-product]").count(), 0);
      await page
        .getByRole("button", { name: "Review budget", exact: true })
        .click();
      assert.equal(
        await page
          .locator('.ritual-finder-option[aria-pressed="true"] strong')
          .innerText(),
        "Up to ₹799",
      );
      await chooseFinder("Up to ₹999");
      await nextFinder();
      const productLink = page
        .locator("[data-finder-product]")
        .first()
        .getByRole("link", { name: "Explore this bracelet", exact: true });
      await productLink.click();
      await page.waitForURL("**/products/amethyst");
      await page.locator(".product-purchase h1").waitFor({ state: "visible" });
      assert(
        await page
          .locator(".product-purchase h1")
          .innerText()
          .then((text) => /amethyst/i.test(text)),
      );
    });

    await test("Finder reset clears choices and invalid saved sessions recover safely", async () => {
      await visit("/find-your-bracelet");
      await page.locator('[data-finder-ready="true"]').waitFor();
      await page
        .getByRole("button", { name: "Start again", exact: true })
        .click();
      assert.equal(
        await page.locator("#finder-question").innerText(),
        "What would you like to carry with you?",
      );
      assert.equal(
        await page
          .locator('.ritual-finder-option[aria-pressed="true"]')
          .count(),
        0,
      );
      assert.equal(
        await page.evaluate(() =>
          sessionStorage.getItem("pashan-bracelet-finder-v1"),
        ),
        null,
      );
      await page.evaluate(() =>
        sessionStorage.setItem(
          "pashan-bracelet-finder-v1",
          JSON.stringify({
            version: 99,
            answers: { intention: "unknown" },
            step: 4,
          }),
        ),
      );
      await page.reload({ waitUntil: "networkidle" });
      await page.locator('[data-finder-ready="true"]').waitFor();
      assert.equal(
        await page.locator("#finder-question").innerText(),
        "What would you like to carry with you?",
      );
      assert(
        await page
          .getByRole("button", { name: "Continue", exact: true })
          .isDisabled(),
      );
      assert.equal(
        await page.evaluate(() =>
          sessionStorage.getItem("pashan-bracelet-finder-v1"),
        ),
        null,
      );
    });
  }

  for (const width of [320, 360, 390, 768, 1440]) {
    for (const [path, name] of [
      ["/", "home"],
      ["/rashi", "rashi"],
      ...(!mainOnly ? [["/find-your-bracelet", "finder"]] : []),
    ]) {
      await test(
        "Responsive " + name + " has no page overflow at " + width + "px",
        async () => {
          await page.setViewportSize({
            width,
            height: width < 768 ? 844 : 1000,
          });
          await visit(path);
          const dimensions = await page.evaluate(() => ({
            viewport: window.innerWidth,
            document: document.documentElement.scrollWidth,
            body: document.body.scrollWidth,
          }));
          assert(dimensions.document <= width + 1, JSON.stringify(dimensions));
          assert(dimensions.body <= width + 1, JSON.stringify(dimensions));
          assert(await page.locator("h1").first().isVisible());
          if (name === "finder")
            assert.equal(
              await page.locator(".concierge-launcher").count(),
              0,
              "Finder is a quiet flow without floating controls",
            );
          const clippedControls = await page
            .locator(
              ".site-main a,.site-main button,.site-main input,.site-main select,.site-main summary",
            )
            .evaluateAll((elements) =>
              elements
                .filter((element) => {
                  if (!element.checkVisibility()) return false;
                  const box = element.getBoundingClientRect();
                  return (
                    box.width > 2 &&
                    (box.left < -1 || box.right > innerWidth + 1)
                  );
                })
                .map((element) => ({
                  text: (
                    element.textContent ||
                    element.getAttribute("aria-label") ||
                    element.tagName
                  )
                    .trim()
                    .slice(0, 80),
                  left: element.getBoundingClientRect().left,
                  right: element.getBoundingClientRect().right,
                })),
            );
          assert.deepEqual(
            clippedControls,
            [],
            "Visible main controls must not be clipped off the page",
          );
          if ([390, 1440].includes(width)) {
            await capture("after-" + name + "-" + width);
            await capture("preview-" + name + "-" + width, false);
          }
          return dimensions;
        },
      );
    }
  }

  await test("No-JavaScript homepage preserves headline, photography and shop navigation", async () => {
    const noJsContext = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 390, height: 844 },
    });
    const noJs = await noJsContext.newPage();
    try {
      await noJs.goto(base + "/", { waitUntil: "networkidle" });
      assert(await noJs.locator(".ritual-home h1").isVisible());
      const shop = noJs.locator('.ritual-hero a[href="/collections"]').first();
      assert(await shop.isVisible());
      assert.equal(await noJs.getByRole("dialog").count(), 0);
      assert.notEqual(
        await noJs.evaluate(() => getComputedStyle(document.body).overflow),
        "hidden",
      );
      await noJs.screenshot({
        path: output + "/no-js-home-390.png",
        fullPage: false,
      });
      captures.push(output + "/no-js-home-390.png");
    } finally {
      await noJsContext.close();
    }
  });

  await test("Reduced-motion skips entrance immediately and keeps sacred artwork static", async () => {
    const reducedContext = await browser.newContext({
      reducedMotion: "reduce",
      viewport: { width: 390, height: 844 },
    });
    const reducedPage = await reducedContext.newPage();
    reducedPage.on("pageerror", (error) => errors.push(String(error)));
    try {
      await reducedPage.goto(base + "/", { waitUntil: "networkidle" });
      assert.equal(
        await reducedPage
          .getByRole("button", { name: "Skip entrance", exact: true })
          .count(),
        0,
      );
      assert(await reducedPage.locator(".ritual-home h1").isVisible());
      assert(
        await reducedPage
          .getByRole("button", { name: "Entrance motion off", exact: true })
          .isDisabled(),
      );
      assert.equal(await reducedPage.locator(".portal-doors").count(), 0);
      await reducedPage.locator(".sacred-stories").scrollIntoViewIfNeeded();
      assert(
        await reducedPage
          .getByRole("button", { name: "Motion off", exact: true })
          .isDisabled(),
      );
      const active = await reducedPage.evaluate(
        () =>
          [...document.querySelectorAll(".ritual-portal,.sacred-stories")]
            .flatMap((root) => root.getAnimations({ subtree: true }))
            .filter(
              (animation) =>
                animation.playState === "running" &&
                animation.effect.getComputedTiming().duration > 1,
            ).length,
      );
      assert.equal(active, 0);
      await reducedPage.screenshot({
        path: output + "/reduced-motion-390.png",
        fullPage: false,
      });
      captures.push(output + "/reduced-motion-390.png");
    } finally {
      await reducedContext.close();
    }
  });

  await test("No uncaught browser errors during the verified flows", async () => {
    assert.deepEqual(errors, []);
  });
}
await writeReport();
await browser.close();
process.exitCode = results.some((result) => result.status === "fail") ? 1 : 0;

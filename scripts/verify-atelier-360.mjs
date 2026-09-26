import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";

const require = createRequire(
  process.env.PASHAN_PLAYWRIGHT_ROOT + "/package.json",
);
const { chromium } = require("playwright");
const base = process.env.PASHAN_BASE_URL || "http://127.0.0.1:8084";
assert(
  ["localhost", "127.0.0.1"].includes(new URL(base).hostname),
  "Local-only verification",
);
const baselineOnly = process.argv.includes("--baseline");
const output = "docs/screenshots/atelier-360";
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
const finalProfiles = [
  profiles[0],
  profiles[1],
  { name: "768", width: 768, height: 1024, hasTouch: true },
  profiles[2],
  { name: "1180", width: 1180, height: 820, hasTouch: true },
  profiles[3],
];
await mkdir(output, { recursive: true });
async function visit(page) {
  const response = await page.goto(base + "/products/make-your-own", {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  assert.equal(response.status(), 200);
  await page.locator('[data-testid="atelier"][data-loaded="true"]').waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => {
    document.activeElement?.blur();
    scrollTo({ top: 0, behavior: "instant" });
  });
}
async function capture(page, name) {
  const path = output + "/" + name + ".png";
  await page.screenshot({ path });
  screenshots.push(path);
}
async function captureSection(page, selector, name) {
  const previous = page.viewportSize();
  const section = page.locator(selector);
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
  const path = output + "/" + name + ".png";
  await section.screenshot({ path });
  screenshots.push(path);
  await page.setViewportSize(previous);
}
async function fresh(options = {}) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    ...options,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on("pageerror", (error) => errors.push(String(error)));
  return { context, page };
}
async function test(page, name, action) {
  try {
    const evidence = await action();
    results.push({ name, status: "pass", evidence });
    console.log("PASS", name);
  } catch (error) {
    results.push({ name, status: "fail", error: String(error) });
    console.log("FAIL", name, String(error));
    await capture(page, "failure-" + results.length);
  }
}
async function pageLayout(page) {
  const evidence = await page.evaluate(() => ({
    width: innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
    headings: [
      ...document.querySelectorAll(".atelier h1,.atelier h2,.atelier h3"),
    ]
      .filter((node) => node.checkVisibility())
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
  assert(
    evidence.documentWidth <= evidence.width + 1 &&
      evidence.bodyWidth <= evidence.width + 1,
    "No page overflow",
  );
  assert.deepEqual(
    evidence.headings.filter(
      (item) =>
        item.scrollWidth > item.clientWidth + 2 ||
        item.textLeft < item.left - 3 ||
        item.textRight > item.right + 3,
    ),
    [],
    "Heading text remains inside its box",
  );
  return evidence;
}
const host = (page) => page.locator(".atelier-canvas");
async function pose(page) {
  return host(page).evaluate((node) => ({
    yaw: Number(node.dataset.yaw),
    tilt: Number(node.dataset.tilt),
    zoom: Number(node.dataset.zoom),
    interacting: node.dataset.interacting,
    touring: node.dataset.touring,
    drawCount: Number(node.dataset.drawCount),
  }));
}
async function settledPreset(page, tilt = Math.atan2(7.5, 9)) {
  await page.waitForFunction((expectedTilt) => {
    const values = document.querySelector(".atelier-canvas").dataset;
    return (
      Math.abs(Number(values.yaw)) < 0.0001 &&
      Math.abs(Number(values.tilt) - expectedTilt) < 0.0001 &&
      Math.abs(Number(values.zoom) - 1) < 0.0001
    );
  }, tilt);
}
async function useSample(page) {
  await page
    .getByRole("button", { name: "Use this sample", exact: true })
    .click();
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="atelier"]').dataset.beadCount ===
      "18",
  );
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
  await host(page).waitFor({ state: "visible" });
}
async function settledScroll(page) {
  await page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        let previous = scrollY;
        let still = 0;
        const started = performance.now();
        const frame = () => {
          still = Math.abs(scrollY - previous) < 0.5 ? still + 1 : 0;
          previous = scrollY;
          if (still >= 6) resolve();
          else if (performance.now() - started > 3000)
            reject(new Error("Viewport scroll did not settle"));
          else requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      }),
  );
}
async function selectedBead(page) {
  const selected = page.locator(
    '.atelier-sequence button[aria-pressed="true"]',
  );
  return (await selected.count())
    ? selected.getAttribute("data-bead-id")
    : null;
}
async function sequence(page) {
  return page
    .locator(".atelier-sequence button[data-bead-id]")
    .evaluateAll((nodes) =>
      nodes.map((node) => ({
        id: node.dataset.beadId,
        stone: node.dataset.stone,
        seed: node.dataset.seed,
      })),
    );
}
async function mouseDrag(page, start, finish) {
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(finish.x, finish.y, { steps: 12 });
  await page.mouse.up();
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
async function storedDesign(page) {
  return page.evaluate(() =>
    JSON.parse(localStorage.getItem("pashan-bracelet-design-v1")),
  );
}
async function exportEvidence(page) {
  await page
    .getByRole("button", { name: "Create design card", exact: true })
    .click();
  const image = page.locator(".atelier-export img");
  await image.waitFor({ state: "visible" });
  const evidence = await image.evaluate(async (node) => {
    await node.decode();
    const blob = await (await fetch(node.src)).blob();
    return {
      width: node.naturalWidth,
      height: node.naturalHeight,
      type: blob.type,
      bytes: Array.from(new Uint8Array(await blob.arrayBuffer())),
    };
  });
  assert.equal(evidence.width, 1080);
  assert.equal(evidence.height, 1350);
  assert.equal(evidence.type, "image/png");
  const bytes = Buffer.from(evidence.bytes);
  assert(bytes.length > 10000);
  return {
    width: evidence.width,
    height: evidence.height,
    byteLength: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
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
      await capture(page, "before-sample-" + profile.name);
      await captureSection(
        page,
        ".atelier-workbench",
        "before-workbench-" + profile.name,
      );
      await page
        .getByRole("button", { name: "Use this sample", exact: true })
        .click();
      const count = Number(
        await page
          .locator('[data-testid="atelier"]')
          .getAttribute("data-bead-count"),
      );
      assert(count > 1);
      await page.locator(".atelier-preview").evaluate((node) =>
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
      await capture(page, "before-populated-" + profile.name);
      await context.close();
      console.log("Captured baseline", profile.name, count, "beads");
    }
    console.log(JSON.stringify({ screenshots, errors }, null, 2));
  } else {
    for (const item of finalProfiles) {
      const { context, page } = await fresh({
        viewport: { width: item.width, height: item.height },
        hasTouch: item.hasTouch,
      });
      await visit(page);
      await page.locator('.atelier-viewer[data-ready="true"]').waitFor();
      await test(
        page,
        item.name + "px: responsive making table, live 3D and usable controls",
        async () => {
          const responsive = await pageLayout(page);
          assert.equal(
            await page.locator(".atelier-viewer").getAttribute("data-view"),
            "collection",
          );
          const controls = await page
            .locator(".atelier-viewer button")
            .evaluateAll((nodes) =>
              nodes.map((node) => ({
                label:
                  node.getAttribute("aria-label") || node.textContent.trim(),
                width: node.getBoundingClientRect().width,
                height: node.getBoundingClientRect().height,
                disabled: node.disabled,
              })),
            );
          assert(
            controls.every((item) => item.width >= 44 && item.height >= 44),
            "Viewer controls at least44px",
          );
          assert(
            controls.every((item) => !item.disabled),
            "WebGL controls active",
          );
          assert.equal(
            await page.locator(".atelier-stage").getAttribute("tabindex"),
            "0",
          );
          assert.equal(await page.locator(".atelier-canvas canvas").count(), 1);
          const state = await pose(page);
          assert(
            Number.isFinite(state.yaw) &&
              Number.isFinite(state.tilt) &&
              Number.isFinite(state.zoom),
          );
          if (profiles.some((profile) => profile.name === item.name)) {
            await capture(page, "after-sample-" + item.name);
            await captureSection(
              page,
              ".atelier-workbench",
              "after-workbench-" + item.name,
            );
          }
          await useSample(page);
          assert.equal(
            await page.locator(".atelier").getAttribute("data-saved"),
            "false",
          );
          assert.match(
            await page.getByTestId("draft-status").innerText(),
            /Unsaved changes/,
          );
          assert.equal(
            await page
              .locator('.atelier-composition-progress [role="progressbar"]')
              .getAttribute("aria-valuenow"),
            "18",
          );
          await positionViewer(page);
          if (profiles.some((profile) => profile.name === item.name))
            await capture(page, "after-populated-" + item.name);
          assert.equal((await sequence(page)).length, 18);
          return { responsive, controls, camera: state };
        },
      );
      await context.close();
    }

    const desktop = await fresh();
    const page = desktop.page;
    await visit(page);
    await useSample(page);
    await page.locator('.atelier-viewer[data-ready="true"]').waitFor();
    const originalSequence = await sequence(page);
    await test(
      page,
      "Real mouse drag rotates beyond a full circle without selecting a bead",
      async () => {
        await positionViewer(page);
        const box = await host(page).boundingBox();
        const before = await pose(page);
        for (let i = 0; i < 5; i++)
          await mouseDrag(
            page,
            { x: box.x + box.width * 0.2, y: box.y + box.height * 0.5 },
            { x: box.x + box.width * 0.85, y: box.y + box.height * 0.5 },
          );
        const after = await pose(page);
        assert(
          Math.abs(after.yaw - before.yaw) > Math.PI * 2,
          "Yaw is not capped at one revolution",
        );
        assert.equal(await selectedBead(page), null);
        assert.deepEqual(await sequence(page), originalSequence);
        assert.equal(after.interacting, "false");
        return { before, after, sequenceUnchanged: true };
      },
    );
    await test(
      page,
      "A deliberate tap selects the visible front bead while drag does not",
      async () => {
        await page
          .getByRole("button", { name: "Overhead", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Reset view", exact: true })
          .click();
        await positionViewer(page);
        const box = await host(page).boundingBox();
        // The front bead in the overhead full-bracelet view is centered at the
        // lower ring edge; this is a real pointer hit, not a test-only engine hook.
        await page.mouse.click(
          box.x + box.width / 2,
          box.y + box.height * 0.818,
        );
        assert.notEqual(
          await selectedBead(page),
          null,
          "Raycast tap selects a bead",
        );
        const selected = await selectedBead(page);
        await mouseDrag(
          page,
          { x: box.x + box.width / 2, y: box.y + box.height * 0.818 },
          { x: box.x + box.width * 0.8, y: box.y + box.height * 0.818 },
        );
        assert.equal(
          await selectedBead(page),
          selected,
          "Dragging never changes selected bead",
        );
        return {
          selectedId: selected,
          tapCoordinate: {
            x: box.x + box.width / 2,
            y: box.y + box.height * 0.818,
          },
        };
      },
    );
    await test(
      page,
      "Keyboard turn, tilt, zoom and Home reset preserve the design",
      async () => {
        await page.getByRole("button", { name: "Angled", exact: true }).click();
        await settledPreset(page);
        const stage = page.locator(".atelier-stage");
        await stage.focus();
        const before = await pose(page);
        await page.keyboard.press("ArrowRight");
        await page.keyboard.press("ArrowUp");
        await page.keyboard.press("+");
        const adjusted = await pose(page);
        assert(
          adjusted.yaw !== before.yaw &&
            adjusted.tilt !== before.tilt &&
            adjusted.zoom > before.zoom,
        );
        await page.keyboard.press("Home");
        await settledPreset(page);
        const reset = await pose(page);
        assert(
          Math.abs(reset.yaw - before.yaw) < 0.001 &&
            Math.abs(reset.tilt - before.tilt) < 0.001 &&
            Math.abs(reset.zoom - before.zoom) < 0.001,
        );
        assert.deepEqual(await sequence(page), originalSequence);
        const focus = await stage.evaluate((node) => ({
          active: node === document.activeElement,
          width: getComputedStyle(node).outlineWidth,
          style: getComputedStyle(node).outlineStyle,
        }));
        assert(
          focus.active &&
            parseFloat(focus.width) >= 2 &&
            focus.style !== "none",
        );
        return { before, adjusted, reset, focus };
      },
    );
    await test(
      page,
      "Visible orbit buttons tilt, zoom and reset with bounded camera movement",
      async () => {
        // The preceding test programmatically focuses the stage. CSS-native
        // smooth focus scrolling must finish before mixing in mouse input;
        // no repeated clicks or relaxed camera assertions are used here.
        await positionViewer(page);
        await settledScroll(page);
        const leftButton = page.getByRole("button", {
          name: "Turn left",
          exact: true,
        });
        await leftButton.focus();
        await settledScroll(page);
        const boundsBefore = await leftButton.boundingBox();
        await page
          .locator(".atelier-stage")
          .evaluate((node) => node.focus({ preventScroll: true }));
        const boundsDuringKeyboardFocus = await leftButton.boundingBox();
        assert.deepEqual(
          boundsDuringKeyboardFocus,
          boundsBefore,
          "Keyboard help never shifts the pointer controls",
        );
        const before = await pose(page);
        await leftButton.click();
        const oneClick = await pose(page);
        assert(
          oneClick.yaw < before.yaw,
          "One click after stage focus turns left without a retry",
        );
        assert.deepEqual(
          await leftButton.boundingBox(),
          boundsBefore,
          "Controls stay fixed as keyboard help disappears",
        );
        await page
          .getByRole("button", { name: "Tilt down", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Zoom in", exact: true })
          .click();
        const adjusted = await pose(page);
        assert(
          adjusted.yaw < before.yaw &&
            adjusted.tilt < before.tilt &&
            adjusted.zoom > before.zoom,
          "Button changes " + JSON.stringify({ before, adjusted }),
        );
        for (let i = 0; i < 12; i++)
          await page
            .getByRole("button", { name: "Zoom in", exact: true })
            .click();
        const bounded = await pose(page);
        assert(bounded.zoom > 0 && bounded.zoom < 10);
        await page
          .getByRole("button", { name: "Reset view", exact: true })
          .click();
        await settledPreset(page);
        const reset = await pose(page);
        assert(Math.abs(reset.zoom - before.zoom) < 0.001);
        return {
          before,
          oneClick,
          adjusted,
          bounded,
          reset,
          boundsBefore,
          boundsDuringKeyboardFocus,
        };
      },
    );
    await test(
      page,
      "Reset and view presets finish at their target if scrolled out of view",
      async () => {
        await positionViewer(page);
        await page
          .getByRole("button", { name: "Turn right", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Zoom in", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Reset view", exact: true })
          .click();
        await page.evaluate(() =>
          scrollTo({ top: document.body.scrollHeight, behavior: "instant" }),
        );
        await settledPreset(page);
        const reset = await pose(page);
        await page
          .getByRole("button", { name: "Overhead", exact: true })
          .click();
        await page.evaluate(() =>
          scrollTo({ top: document.body.scrollHeight, behavior: "instant" }),
        );
        await settledPreset(page, Math.PI / 2 - 0.001);
        const overhead = await pose(page);
        await page.getByRole("button", { name: "Angled", exact: true }).click();
        await settledPreset(page);
        return { reset, overhead };
      },
    );
    await test(
      page,
      "Requested turn makes exactly one revolution then stops drawing at idle",
      async () => {
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
        const later = await pose(page);
        assert.equal(idle.drawCount, later.drawCount);
        return { before, after, idle, later };
      },
    );
    await test(
      page,
      "Turn can be stopped explicitly and stops when the viewer leaves view",
      async () => {
        await page
          .getByRole("button", { name: "Turn once", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Stop turning", exact: true })
          .click();
        assert.equal((await pose(page)).touring, "false");
        await page
          .getByRole("button", { name: "Turn once", exact: true })
          .click();
        await page.evaluate(() =>
          scrollTo({ top: document.body.scrollHeight, behavior: "instant" }),
        );
        await page.waitForFunction(
          () =>
            document.querySelector(".atelier-canvas").dataset.touring ===
            "false",
        );
        const offscreen = await pose(page);
        await page.waitForTimeout(350);
        const later = await pose(page);
        assert.equal(offscreen.drawCount, later.drawCount);
        return { offscreen, later };
      },
    );
    await test(
      page,
      "Save and reload preserve ordered IDs, seeds and requested wrist fit",
      async () => {
        await page
          .locator(".atelier-steps")
          .getByRole("button", { name: /Find your fit/ })
          .click();
        await page.locator(".atelier-fit-sources button").first().click();
        await page
          .getByLabel("Length around your wrist", { exact: true })
          .fill("16.5");
        await page
          .locator('.atelier-fit-options input[type="radio"]')
          .last()
          .check();
        await page
          .getByRole("button", { name: "Save design", exact: true })
          .click();
        const before = await storedDesign(page);
        assert.equal(
          await page.locator(".atelier").getAttribute("data-saved"),
          "true",
        );
        assert.equal(before.fit.wristMm, 165);
        assert.equal(before.fit.preference, "relaxed");
        assert.equal(before.fit.status, "unconfirmed");
        assert.equal(before.beads.length, 18);
        assert.equal(
          Object.hasOwn(before, "yaw") || Object.hasOwn(before, "zoom"),
          false,
        );
        await page.reload({ waitUntil: "networkidle" });
        await page
          .locator('[data-testid="atelier"][data-loaded="true"]')
          .waitFor();
        const after = await storedDesign(page);
        assert.deepEqual(after, before);
        assert.equal(
          await page.locator(".atelier").getAttribute("data-saved"),
          "true",
        );
        assert.deepEqual(await sequence(page), originalSequence);
        assert.match(
          await page.locator(".atelier-save [role=status]").innerText(),
          /restored/,
        );
        return {
          schemaVersion: after.schemaVersion,
          beadCount: after.beads.length,
          fit: after.fit,
          exactDataPreserved: true,
        };
      },
    );
    await test(
      page,
      "Actual bracelet export is unchanged by camera pose and downloads as PNG",
      async () => {
        const first = await exportEvidence(page);
        await page
          .getByRole("button", { name: "Turn right", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Zoom in", exact: true })
          .click();
        const second = await exportEvidence(page);
        assert.equal(
          second.sha256,
          first.sha256,
          "Camera changes never change the actual design export",
        );
        const downloadPromise = page.waitForEvent("download");
        await page
          .getByRole("button", { name: "Download PNG", exact: true })
          .click();
        const download = await downloadPromise;
        assert.equal(download.suggestedFilename(), "pashan-design.png");
        await download.saveAs(output + "/verified-design-export.png");
        screenshots.push(output + "/verified-design-export.png");
        return { first, second, download: download.suggestedFilename() };
      },
    );
    await test(
      page,
      "Editing one actual bead changes exported artwork and keeps identity stable",
      async () => {
        const first = await exportEvidence(page);
        await page.locator(".atelier-sequence summary").click();
        await page
          .locator(".atelier-sequence button[data-bead-id]")
          .first()
          .click();
        const oldBeads = await sequence(page);
        const replacement = page
          .locator(".atelier-palette button")
          .filter({ hasText: "Lava" });
        await replacement.click();
        const newBeads = await sequence(page);
        assert.equal(
          await page.locator(".atelier").getAttribute("data-saved"),
          "false",
        );
        assert.equal(newBeads[0].id, oldBeads[0].id);
        assert.equal(newBeads[0].seed, oldBeads[0].seed);
        assert.notEqual(newBeads[0].stone, oldBeads[0].stone);
        assert.deepEqual(newBeads.slice(1), oldBeads.slice(1));
        const second = await exportEvidence(page);
        assert.notEqual(second.sha256, first.sha256);
        await page.getByRole("button", { name: /Undo/ }).click();
        assert.deepEqual(await sequence(page), oldBeads);
        assert.equal(
          await page.locator(".atelier").getAttribute("data-saved"),
          "true",
        );
        await page.getByRole("button", { name: /Redo/ }).click();
        assert.deepEqual(await sequence(page), newBeads);
        assert.equal(
          await page.locator(".atelier").getAttribute("data-saved"),
          "false",
        );
        return { oldFirst: oldBeads[0], newFirst: newBeads[0], first, second };
      },
    );
    await desktop.context.close();

    const touch = await fresh({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });
    await visit(touch.page);
    await useSample(touch.page);
    await touch.page.locator('.atelier-viewer[data-ready="true"]').waitFor();
    await test(
      touch.page,
      "Native horizontal touch drag rotates without page scrolling or bead selection",
      async () => {
        await positionViewer(touch.page);
        const box = await host(touch.page).boundingBox();
        const before = await pose(touch.page);
        const scrollBefore = await touch.page.evaluate(() => scrollY);
        await touchSwipe(
          touch.page,
          { x: box.x + box.width * 0.2, y: box.y + box.height * 0.5 },
          { x: box.x + box.width * 0.8, y: box.y + box.height * 0.5 },
        );
        const after = await pose(touch.page);
        assert(Math.abs(after.yaw - before.yaw) > 0.3);
        assert(
          Math.abs((await touch.page.evaluate(() => scrollY)) - scrollBefore) <
            5,
        );
        assert.equal(await selectedBead(touch.page), null);
        return { before, after, scrollBefore };
      },
    );
    await test(
      touch.page,
      "Vertical touch gesture remains native page scrolling, not bracelet rotation",
      async () => {
        await positionViewer(touch.page);
        const box = await host(touch.page).boundingBox();
        const before = await pose(touch.page);
        const scrollBefore = await touch.page.evaluate(() => scrollY);
        await touchSwipe(
          touch.page,
          { x: box.x + box.width / 2, y: box.y + box.height * 0.75 },
          { x: box.x + box.width / 2, y: box.y + box.height * 0.25 },
        );
        await touch.page.waitForTimeout(200);
        const scrollAfter = await touch.page.evaluate(() => scrollY);
        const after = await pose(touch.page);
        assert(scrollAfter > scrollBefore + 30);
        assert(Math.abs(after.yaw - before.yaw) < 0.01);
        assert.equal(await selectedBead(touch.page), null);
        return { before, after, scrollBefore, scrollAfter };
      },
    );
    await touch.context.close();

    const shared = await fresh({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
    });
    await shared.page.goto(base + "/collections", { waitUntil: "networkidle" });
    await test(
      shared.page,
      "Shared product viewer uses the same 360 controls and disposes cleanly on close",
      async () => {
        const opener = shared.page.locator('[data-product="tiger-eye"] button');
        for (let i = 0; i < 3; i++) {
          await opener.click();
          const dialog = shared.page.getByRole("dialog");
          await dialog.locator('.atelier-viewer[data-ready="true"]').waitFor();
          assert.equal(await shared.page.locator("canvas").count(), 1);
          assert.equal(
            await shared.page.locator(".pashan-mobile-dock").isVisible(),
            false,
          );
          const box = await dialog.boundingBox();
          assert(box.x >= -1 && box.x + box.width <= 391);
          const stage = dialog.locator(".atelier-stage");
          await stage.focus();
          const before = await pose(shared.page);
          await shared.page.keyboard.press("ArrowRight");
          assert((await pose(shared.page)).yaw > before.yaw);
          await dialog
            .getByRole("button", { name: "Turn once", exact: true })
            .click();
          await dialog
            .getByRole("button", { name: "Close viewer", exact: true })
            .click();
          await dialog.waitFor({ state: "hidden" });
          assert.equal(await shared.page.locator("canvas").count(), 0);
          await shared.page.waitForFunction(
            (node) => node === document.activeElement,
            await opener.elementHandle(),
          );
        }
        return {
          openCloseCycles: 3,
          exactlyOneCanvasPerOpen: true,
          noCanvasAfterClose: true,
          focusReturned: true,
        };
      },
    );
    await shared.context.close();

    const reduced = await fresh({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      reducedMotion: "reduce",
    });
    await visit(reduced.page);
    await reduced.page.locator('.atelier-viewer[data-ready="true"]').waitFor();
    await test(
      reduced.page,
      "Reduced motion disables the animated tour, keeps manual controls, and idles",
      async () => {
        assert.equal(
          await reduced.page
            .getByRole("button", { name: "Turn once", exact: true })
            .isDisabled(),
          true,
        );
        await reduced.page
          .getByRole("button", { name: "Turn right", exact: true })
          .click();
        const moved = await pose(reduced.page);
        assert(Math.abs(moved.yaw) > 0.1);
        await reduced.page.waitForTimeout(250);
        const before = await pose(reduced.page);
        await reduced.page.waitForTimeout(350);
        const after = await pose(reduced.page);
        assert.equal(before.drawCount, after.drawCount);
        assert.equal(after.touring, "false");
        await pageLayout(reduced.page);
        return { before, after };
      },
    );
    await reduced.context.close();

    const fallback = await fresh({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
    });
    await fallback.context.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (kind, ...rest) {
        return /webgl/i.test(kind) ? null : original.call(this, kind, ...rest);
      };
    });
    await visit(fallback.page);
    await test(
      fallback.page,
      "WebGL denial retains an honest SVG preview and editable ordered design",
      async () => {
        await fallback.page
          .getByText("Your design is still here. Showing a simpler preview.", {
            exact: true,
          })
          .waitFor();
        assert.equal(
          await fallback.page.locator(".atelier-flat svg").count(),
          1,
        );
        assert.equal(
          await fallback.page.locator(".atelier-canvas canvas").count(),
          0,
        );
        await useSample(fallback.page);
        await fallback.page.locator(".atelier-sequence summary").click();
        await fallback.page.locator(".atelier-sequence button").first().click();
        await fallback.page
          .locator(".atelier-palette button")
          .filter({ hasText: "Lava" })
          .click();
        const beads = await sequence(fallback.page);
        assert.equal(beads[0].stone, "lava");
        assert.equal(beads.length, 18);
        assert.equal(
          await fallback.page
            .getByRole("button", { name: "Turn once", exact: true })
            .isDisabled(),
          true,
        );
        await captureSection(
          fallback.page,
          ".atelier-viewer",
          "after-svg-fallback-390",
        );
        return {
          fallbackVisible: true,
          beads: beads.length,
          firstStone: beads[0].stone,
          layout: await pageLayout(fallback.page),
        };
      },
    );
    await test(
      fallback.page,
      "WebGL fallback still saves and exports the edited design",
      async () => {
        await fallback.page
          .getByRole("button", { name: "Save design", exact: true })
          .click();
        assert.equal(
          (await storedDesign(fallback.page)).beads[0].stoneKey,
          "lava",
        );
        const exported = await exportEvidence(fallback.page);
        return { exported, saved: true };
      },
    );
    await fallback.context.close();
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
        "Local only. Fresh isolated browser contexts; no existing user drafts, payments, email, production changes or external actions.",
        "Full-workbench captures use a taller same-width viewport to avoid fixed header and dock overlays; normal viewport captures are separate.",
        "Rendered beads are illustrative material previews, not product photographs or fit measurements.",
      ],
    };
    await writeFile(
      "docs/atelier-360-results.json",
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

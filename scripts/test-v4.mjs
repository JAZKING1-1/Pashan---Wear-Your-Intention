import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
const require = createRequire(
  process.env.PASHAN_PLAYWRIGHT_ROOT + "/package.json",
);
const { chromium } = require("playwright");
const sharp = require("sharp");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const base = process.env.PASHAN_TEST_URL || "http://127.0.0.1:8084";
const out = "docs/screenshots/v4/evidence";
mkdirSync(out, { recursive: true });
const results = [];
const errors = [];
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  acceptDownloads: true,
});
const page = await context.newPage();
page.on("pageerror", (e) => errors.push(e.message));
page.setDefaultTimeout(10000);
const key = "pashan-bracelet-design-v1";
const button = (name) => page.getByRole("button", { name, exact: true });
const count = async (n) =>
  assert.equal(
    await page.locator("[data-testid=atelier]").getAttribute("data-bead-count"),
    String(n),
  );
const list = () =>
  page.locator("[data-bead-id]").evaluateAll((nodes) =>
    nodes.map((n) => ({
      id: n.dataset.beadId,
      stone: n.dataset.stone,
      seed: n.dataset.seed,
    })),
  );
async function test(name, run) {
  try {
    await run();
    results.push({ name, status: "pass" });
    console.log("PASS", name);
  } catch (e) {
    results.push({ name, status: "fail", error: String(e) });
    console.log("FAIL", name, String(e));
    await page
      .screenshot({
        path: `${out}/failure-${results.length}.png`,
        fullPage: true,
      })
      .catch(() => {});
  }
}
async function builder() {
  await page.goto(base + "/products/make-your-own", {
    waitUntil: "networkidle",
  });
  await page.locator("[data-loaded=true]").waitFor();
}
async function clean() {
  await page.evaluate(() => localStorage.clear());
  await builder();
}
await builder();
await test("Canonical validation, migrations, units, history, translation coverage", async () => {
  const data = await page.evaluate(async () => {
    const m = await import("/src/lib/bracelet-design.ts");
    const s = await import("/src/data/sizing-policy.ts");
    const p = await import("/src/data/products.ts");
    const t = await import("/src/data/atelier-copy.ts");
    const valid = m.createDesign(p.customStoneOptions.map((x) => x.key));
    const bad = [
      { ...valid, schemaVersion: 3 },
      { ...valid, beads: [{ ...valid.beads[0], stoneKey: "clear-quartz" }] },
      {
        ...valid,
        beads: Array.from({ length: 19 }, () => m.createBead("citrine")),
      },
      { ...valid, beads: [valid.beads[0], valid.beads[0]] },
      { ...valid, fit: { ...valid.fit, status: "confirmed" } },
      { ...valid, fit: { ...valid.fit, wristMm: -1 } },
      { ...valid, fit: { ...valid.fit, source: "assistance", wristMm: 165 } },
    ];
    const old = {
      ...valid,
      schemaVersion: 1,
      beads: valid.beads.map(({ id, stoneKey }) => ({ id, stoneKey })),
      fit: { ...valid.fit, status: "confirmed" },
    };
    const initial = {
      present: { design: valid, selectedId: valid.beads[0].id },
      past: [],
      future: [],
    };
    const changed = m.commitDesign(initial, {
      ...valid,
      beads: [...valid.beads].reverse(),
    });
    return {
      valid: m.parseStoredDesign(JSON.stringify(valid))?.beads.length,
      bad: bad.map((d) => m.parseStoredDesign(JSON.stringify(d))),
      migrated: m.parseStoredDesign(JSON.stringify(old)),
      roundtrip:
        JSON.stringify(m.redoDesign(m.undoDesign(changed)).present) ===
        JSON.stringify(changed.present),
      mirror: m.mirrorBeads(valid.beads)?.map((x) => x.stoneKey),
      overMirror: m.mirrorBeads(
        Array.from({ length: 10 }, () => m.createBead("citrine")),
      ),
      measurements: [
        "16,5 cm",
        "6.5 in",
        "१६.५ cm",
        "১৬.৫ cm",
        "١٦٫٥ cm",
        "੧੬.੫ cm",
        "0",
        "-1",
        "Infinity",
        "12x",
      ].map((x) => s.parseWristMeasurement(x, "cm")),
      translations: Object.entries(t.atelierTranslationRows).filter(
        ([, row]) => row.length !== 10 || row.some((x) => !x),
      ),
      publicText: m.publicDesignSummary({
        ...valid,
        fit: { ...valid.fit, knownSizeReference: "PRIVATE-NOTE" },
      }),
    };
  });
  assert.equal(data.valid, 8);
  assert(data.bad.every((x) => x === null));
  assert.equal(data.migrated.schemaVersion, 2);
  assert.equal(data.migrated.fit.status, "needs-help");
  assert(data.roundtrip);
  assert.equal(data.mirror.length, 16);
  assert.equal(data.overMirror, null);
  assert.equal(data.measurements[0].mm, 165);
  assert.equal(data.measurements[1].mm, 165.1);
  for (const m of data.measurements.slice(2, 6)) assert.equal(m.mm, 165);
  for (const m of data.measurements.slice(6)) assert(m.error);
  assert.equal(data.translations.length, 0);
  assert(!data.publicText.includes("PRIVATE-NOTE"));
});
await test("Unaccepted sample, scratch first bead, all eight stones save and restore", async () => {
  await clean();
  await count(0);
  assert(await button("Use this sample").isVisible());
  assert(await button("Save design").isDisabled());
  await button("Add Citrine").click();
  await count(1);
  assert.deepEqual(
    (await list()).map((x) => x.stone),
    ["citrine"],
  );
  for (const name of [
    "Tiger Eye",
    "Hematite",
    "Amethyst",
    "Pyrite",
    "Green Quartz",
    "Lava Stone",
    "Heart Quartz",
  ])
    await button("Add " + name).click();
  await count(8);
  const before = await list();
  await button("Save design").click();
  await page.getByText("Saved on this device.", { exact: true }).waitFor();
  await page.reload({ waitUntil: "networkidle" });
  await count(8);
  assert.deepEqual(await list(), before);
  assert.equal(await button("Use this sample").count(), 0);
});
await test("Full capacity replacement, Done editing, move and exact undo/redo identity", async () => {
  await clean();
  await button("Use this sample").click();
  await count(18);
  assert(await button("Add Citrine").isDisabled());
  await page.locator(".atelier-sequence summary").click();
  await page.locator("[data-bead-id]").first().click();
  const before = await list();
  await button("Replace with Citrine").click();
  const replaced = await list();
  assert.equal(replaced[0].stone, "citrine");
  assert.equal(replaced[0].id, before[0].id);
  assert.equal(replaced[0].seed, before[0].seed);
  await button("Move later").click();
  const moved = await list();
  assert.equal(moved[1].id, before[0].id);
  await button("↶ Undo").click();
  assert.deepEqual(await list(), replaced);
  await button("↷ Redo").click();
  assert.deepEqual(await list(), moved);
  await page.screenshot({ path: out + "/selected-390.png", fullPage: true });
  await button("Done editing").click();
  assert(await button("Add Citrine").isDisabled());
  await button("Mirror pattern").click();
  assert(
    (await page.getByText(/Mirror needs at most/).count()) ||
      (await page.locator(".atelier-mirror-confirm").isVisible()),
  );
  await count(18);
  assert.equal(await button("Apply pattern").count(), 0);
  await button("Cancel").click();
});
await test("Legal mirror previews exact reverse, stable IDs and undo", async () => {
  await clean();
  await button("Add Citrine").click();
  await button("Add Amethyst").click();
  const before = await list();
  await button("Mirror pattern").click();
  await page.locator(".atelier-mirror-confirm button").first().click();
  const mirrored = await list();
  assert.deepEqual(
    mirrored.map((x) => x.stone),
    ["citrine", "amethyst", "amethyst", "citrine"],
  );
  assert.equal(new Set(mirrored.map((x) => x.id)).size, 4);
  await button("↶ Undo").click();
  assert.deepEqual(await list(), before);
  await button("↷ Redo").click();
  assert.deepEqual(await list(), mirrored);
});
await test("Measured fit, unit conversion, preference persist; known and assistance never invent circumference", async () => {
  await page.locator(".atelier-steps button").nth(1).click();
  await page.locator(".atelier-fit-sources button").first().click();
  await page.locator("#atelier-wrist").fill("16,5 cm");
  await page.locator(".atelier-measurement-row select").selectOption("in");
  await page.getByRole("radio").last().check();
  await button("Save design").click();
  const draft = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)),
    key,
  );
  assert.equal(draft.fit.wristMm, 165);
  assert.equal(draft.fit.unit, "in");
  assert.equal(draft.fit.preference, "relaxed");
  await page.reload({ waitUntil: "networkidle" });
  await page.locator(".atelier-steps button").nth(1).click();
  assert.equal(
    await page.locator(".atelier-measurement-row select").inputValue(),
    "in",
  );
  assert(await page.getByRole("radio").last().isChecked());
  await page.screenshot({ path: out + "/fit-390.png", fullPage: true });
  await page.locator(".atelier-fit-sources button").nth(1).click();
  await page
    .locator(".atelier-known textarea")
    .fill("Existing bracelet reference 17");
  await button("Save design").click();
  await page.reload({ waitUntil: "networkidle" });
  await page.locator(".atelier-steps button").nth(1).click();
  assert.equal(
    await page.locator(".atelier-known textarea").inputValue(),
    "Existing bracelet reference 17",
  );
  assert.equal(
    (await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), key)).fit
      .wristMm,
    null,
  );
  await page.locator(".atelier-fit-sources button").nth(2).click();
  await button("Save design").click();
  assert.equal(
    (await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), key)).fit
      .status,
    "needs-help",
  );
});
await test("Export real ordered composition 1080x1350, different design changes pixels, no private fit", async () => {
  await page.locator(".atelier-steps button").nth(2).click();
  await page.screenshot({ path: out + "/review-390.png", fullPage: true });
  const exportImage = async (filename) => {
    await button("Create design card").click();
    await page.locator(".atelier-export img").waitFor();
    const download = page.waitForEvent("download");
    await page.locator(".atelier-export button").first().click();
    await (await download).saveAs(out + "/" + filename);
  };
  await exportImage("actual-design.png");
  const metadata = await sharp(out + "/actual-design.png").metadata();
  assert.equal(metadata.width, 1080);
  assert.equal(metadata.height, 1350);
  const saved = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)),
    key,
  );
  assert.deepEqual(
    (await list()).map((x) => x.stone),
    saved.beads.map((x) => x.stoneKey),
  );
  await page.locator(".atelier-steps button").first().click();
  await button("Add Hematite").click();
  await exportImage("changed-design.png");
  const first = await sharp(out + "/actual-design.png")
    .raw()
    .toBuffer();
  const second = await sharp(out + "/changed-design.png")
    .raw()
    .toBuffer();
  assert(!first.equals(second));
});
await test("Malformed and overcapacity storage retained, recovery reset backs up original", async () => {
  for (const raw of [
    "{bad",
    JSON.stringify({ schemaVersion: 99 }),
    await page.evaluate(async () => {
      const m = await import("/src/lib/bracelet-design.ts");
      return JSON.stringify(m.createDesign(Array(19).fill("citrine")));
    }),
  ]) {
    await page.evaluate(([k, v]) => localStorage.setItem(k, v), [key, raw]);
    await builder();
    assert(await page.locator(".atelier-recovery").isVisible());
    assert.equal(await page.evaluate((k) => localStorage.getItem(k), key), raw);
    assert(await button("Save design").isDisabled());
    await page.locator(".atelier-recovery button").last().click();
    assert.equal(
      await page.evaluate((k) => localStorage.getItem(k + "-recovery"), key),
      raw,
    );
  }
});
await test("Blocked storage gives error, never saved success", async () => {
  await clean();
  await button("Add Citrine").click();
  await page.evaluate(() => {
    Storage.prototype.setItem = function () {
      throw new DOMException("Test blocked storage", "QuotaExceededError");
    };
  });
  await button("Save design").click();
  assert.equal(
    await page.getByText("Saved on this device.", { exact: true }).count(),
    0,
  );
  assert(
    (await page.locator(".atelier-save [role=status]").innerText()).length > 10,
  );
  await page.reload({ waitUntil: "networkidle" });
});
await test("Demand rendering stops idle, context loss falls back without losing design", async () => {
  await clean();
  await button("Use this sample").click();
  await page.locator(".atelier-canvas").scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  const before = await page
    .locator(".atelier-canvas")
    .getAttribute("data-draw-count");
  await page.waitForTimeout(1000);
  assert.equal(
    await page.locator(".atelier-canvas").getAttribute("data-draw-count"),
    before,
  );
  assert(Number(before) > 0);
  const saved = await list();
  await page
    .locator(".atelier-canvas canvas")
    .evaluate((canvas) =>
      canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true })),
    );
  await page.waitForTimeout(100);
  assert.deepEqual(await list(), saved);
  assert(
    await page
      .getByText("Your design is still here. Showing a simpler preview.", {
        exact: true,
      })
      .isVisible(),
  );
  await page.screenshot({ path: out + "/fallback-390.png", fullPage: true });
});
await test("All eight real cards, one shared modal, focus return and honest gallery fallback", async () => {
  await page.goto(base + "/collections", { waitUntil: "networkidle" });
  assert.equal(await page.locator(".atelier-card").count(), 8);
  assert.equal(await page.locator("canvas").count(), 0);
  const trigger = page.locator("[data-product=tiger-eye] button");
  await trigger.click();
  await page.locator("[role=dialog] canvas").waitFor();
  assert.equal(await page.locator("canvas").count(), 1);
  await page.screenshot({ path: out + "/viewer-390.png" });
  await page.keyboard.press("Escape");
  assert(await trigger.evaluate((e) => e === document.activeElement));
  assert.equal(await page.locator("canvas").count(), 0);
  await page.locator("[data-product=pyrite] button").click();
  assert(await page.locator(".atelier-gallery img").isVisible());
  assert.equal(await page.locator("canvas").count(), 0);
  await page.keyboard.press("Escape");
});
await test("320/390/430/1440 layouts, individual bounds, reduced motion and Arabic RTL", async () => {
  for (const width of [320, 390, 430, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await builder();
    for (let step = 0; step < 3; step++) {
      await page.locator(".atelier-steps button").nth(step).click();
      if (step === 1)
        await page.locator(".atelier-fit-sources button").first().click();
      const bad = await page.locator(".atelier").evaluate((root) =>
        [...root.querySelectorAll("button,input,select,textarea,p,fieldset")]
          .filter((e) => e.getClientRects().length)
          .filter((e) => {
            const r = e.getBoundingClientRect();
            return (
              r.left < -1 ||
              r.right > innerWidth + 1 ||
              (e.scrollWidth > e.clientWidth + 3 &&
                getComputedStyle(e).overflowX === "hidden")
            );
          })
          .map((e) => e.className + ":" + e.textContent.slice(0, 60)),
      );
      assert.deepEqual(bad, []);
      await page.screenshot({
        path: `${out}/step-${step}-${width}.png`,
        fullPage: true,
      });
    }
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + "/products/make-your-own?lang=ar", {
    waitUntil: "networkidle",
  });
  assert.equal(await page.locator("html").getAttribute("dir"), "rtl");
  assert.equal(await page.locator("html").getAttribute("lang"), "ar");
  await page.screenshot({ path: out + "/arabic-390.png", fullPage: true });
  await page.addStyleTag({
    content:
      ".atelier{font-size:32px!important}.atelier button,.atelier p,.atelier input,.atelier select,.atelier summary{font-size:inherit!important}.atelier h1{font-size:76px!important}",
  });
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth),
    390,
  );
  await page.screenshot({
    path: out + "/enlarged-text-arabic-390.png",
    fullPage: true,
  });
});
await test("SSR language isolation, actual release marker, no hydration errors", async () => {
  const [ar, en] = await Promise.all([
    fetch(base + "/products/make-your-own?lang=ar").then((r) => r.text()),
    fetch(base + "/products/make-your-own?lang=en").then((r) => r.text()),
  ]);
  assert(ar.includes('lang="ar" dir="rtl"'));
  assert(en.includes('lang="en" dir="ltr"'));
  assert(en.includes("data-release="));
  assert.deepEqual(errors, []);
});
await test("Pierced bead outward-facing surface and stable capacity", async () => {
  const geometry = await page.evaluate(async () => {
    const m = await import("/src/lib/bracelet-scene/createBraceletScene.ts");
    const g = m.buildBeadGeometry();
    const p = g.getAttribute("position");
    const n = g.getAttribute("normal");
    const result = {
      outsideDot: p.getX(20) * n.getX(20) + p.getZ(20) * n.getZ(20),
      vertices: p.count,
    };
    g.dispose();
    return result;
  });
  assert(geometry.outsideDot > 0.4);
  assert(geometry.vertices > 1000);
});
await browser.close();
writeFileSync(
  "docs/v4-test-results.json",
  JSON.stringify(
    {
      base,
      profile: "Chrome headless, Windows, unthrottled; not field CWV",
      results,
      errors,
    },
    null,
    2,
  ),
);
if (results.some((r) => r.status === "fail")) process.exitCode = 1;

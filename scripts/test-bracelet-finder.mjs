import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

// Run the actual pure algorithm and catalogue data without loading browser image modules.
// Image import bindings become their source paths; prices and product fields are unchanged.
function moduleUrl(source) {
  const code = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
  }).outputText;
  return `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
}
const finder = await import(
  moduleUrl(
    readFileSync(
      new URL("../src/lib/bracelet-finder.ts", import.meta.url),
      "utf8",
    ),
  )
);
const photographyUrl = moduleUrl(
  readFileSync(
    new URL("../src/data/product-photography.ts", import.meta.url),
    "utf8",
  ),
);
const productSource = readFileSync(
  new URL("../src/data/products.ts", import.meta.url),
  "utf8",
)
  .replace('"./product-photography"', JSON.stringify(photographyUrl))
  .replace(
    /^import (\w+) from ("[^"]+");$/gm,
    (_, binding, imagePath) => `const ${binding} = ${imagePath};`,
  );
const { collections } = await import(moduleUrl(productSource));
const complete = {
  intention: "quiet",
  palette: "colour",
  wearing: "expressive",
  budget: "under-1000",
};
let passed = 0;
function test(name, run) {
  run();
  passed += 1;
  console.log(`PASS ${name}`);
}

test("unknown or malformed answers rejected; incomplete answers not ranked", () => {
  for (const input of [
    null,
    [],
    "quiet",
    { ...complete, intention: "wealth-cure" },
    { ...complete, birthDate: "private" },
    { ...complete, budget: -1 },
  ]) {
    assert.equal(
      finder.recommendBracelets(input, collections).status,
      "invalid",
    );
  }
  assert.equal(
    finder.recommendBracelets({ intention: "quiet" }, collections).status,
    "incomplete",
  );
});
test("session round trip and corrupt, unsupported or skipped-step rejection", () => {
  const saved = { version: 1, answers: complete, step: 4 };
  assert.deepEqual(finder.parseFinderSession(JSON.stringify(saved)), saved);
  for (const raw of [
    "{",
    "null",
    "[]",
    JSON.stringify({ ...saved, version: 2 }),
    JSON.stringify({ ...saved, step: 5 }),
    JSON.stringify({ ...saved, step: -1 }),
    JSON.stringify({ ...saved, step: 1.5 }),
    JSON.stringify({ ...saved, answers: {} }),
    JSON.stringify({ ...saved, step: 2, answers: { palette: "dark" } }),
  ]) {
    assert.equal(finder.parseFinderSession(raw), null);
  }
});
test("quiet intention + colour + accent begins with Amethyst", () => {
  const result = finder.recommendBracelets(complete, collections);
  assert.equal(result.status, "ready");
  assert.equal(result.matches[0].product.slug, "amethyst");
  assert.equal(result.matches[0].score, 32);
  assert.equal(result.matches[0].reasons.length, 3);
});
test("focus, growth, and courage choices meaningfully change first result", () => {
  const cases = [
    [
      { intention: "focus", palette: "dark", wearing: "understated" },
      "hematite",
    ],
    [
      { intention: "growth", palette: "colour", wearing: "expressive" },
      "green-quartz",
    ],
    [{ intention: "courage", palette: "dark", wearing: "textural" }, "lava"],
    [
      { intention: "purpose", palette: "mixed", wearing: "expressive" },
      "dhan-yog",
    ],
  ];
  for (const [answers, expected] of cases)
    assert.equal(
      finder.recommendBracelets({ ...complete, ...answers }, collections)
        .matches[0].product.slug,
      expected,
    );
});
test("budget is a hard ceiling with an honest current minimum", () => {
  const result = finder.recommendBracelets(
    { ...complete, budget: "under-800" },
    collections,
  );
  assert.equal(result.status, "no-matches");
  assert.equal(result.matches.length, 0);
  assert.equal(result.lowestPrice, 899);
});
test("exact budget boundary is included; a one-rupee overage is excluded", () => {
  const amethyst = collections.find((product) => product.slug === "amethyst");
  assert.equal(
    finder.recommendBracelets(complete, [{ ...amethyst, price: 999 }]).status,
    "ready",
  );
  assert.equal(
    finder.recommendBracelets(complete, [{ ...amethyst, price: 1000 }]).status,
    "no-matches",
  );
  assert.equal(
    finder.recommendBracelets({ ...complete, budget: "under-1500" }, [
      { ...amethyst, price: 1500 },
    ]).status,
    "no-matches",
  );
  assert.equal(
    finder.recommendBracelets({ ...complete, budget: "open" }, [
      { ...amethyst, price: 1500 },
    ]).status,
    "ready",
  );
});
test("result prices and images remain current catalogue values, not saved answers", () => {
  const updated = collections.map((product) => ({ ...product, price: 998 }));
  const top = finder.recommendBracelets(complete, updated).matches[0];
  assert.equal(top.product.price, 998);
  assert.equal(
    top.product.image,
    updated.find((product) => product.slug === top.product.slug).image,
  );
});
test("unknown products, custom service, invalid prices and duplicate slugs excluded", () => {
  const amethyst = collections.find((product) => product.slug === "amethyst");
  const samples = [
    { ...amethyst, isCustom: true },
    { ...amethyst, slug: "not-in-curation" },
    ...[NaN, Infinity, -1, 0].map((price) => ({ ...amethyst, price })),
  ];
  assert.equal(finder.recommendBracelets(complete, samples).matches.length, 0);
  assert.equal(
    finder.recommendBracelets(complete, [amethyst, amethyst]).matches.length,
    1,
  );
});
test("deterministic tie-breaking independent of catalogue input order", () => {
  const answer = {
    ...complete,
    intention: "courage",
    palette: "open",
    wearing: "open",
  };
  const forward = finder
    .recommendBracelets(answer, collections)
    .matches.map((match) => match.product.slug);
  const reverse = finder
    .recommendBracelets(answer, [...collections].reverse())
    .matches.map((match) => match.product.slug);
  assert.deepEqual(forward, reverse);
});
test("all 400 answer combinations keep explanations, budget limits and real products", () => {
  const [intentions, palettes, wearing, budgets] = finder.finderSteps.map(
    (step) => step.options,
  );
  const limits = {
    "under-800": 799,
    "under-1000": 999,
    "under-1500": 1499,
    open: Infinity,
  };
  let combinations = 0;
  for (const intention of intentions)
    for (const palette of palettes)
      for (const style of wearing)
        for (const budget of budgets) {
          combinations += 1;
          const result = finder.recommendBracelets(
            {
              intention: intention.key,
              palette: palette.key,
              wearing: style.key,
              budget: budget.key,
            },
            collections,
          );
          assert.ok(["ready", "no-matches"].includes(result.status));
          assert.ok(result.matches.length <= 3);
          for (const match of result.matches) {
            assert.ok(match.product.price <= limits[budget.key]);
            assert.ok(collections.includes(match.product));
            assert.equal(match.product.isCustom, undefined);
            assert.ok(match.reasons.length > 0);
            assert.ok(match.score > 0);
          }
        }
  assert.equal(combinations, 400);
});
console.log(`${passed} finder unit checks passed.`);

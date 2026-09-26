import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(
  new URL("../src/lib/bracelet-scene/orbit.ts", import.meta.url),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
  },
}).outputText;
const {
  ORBIT_LIMITS,
  clampOrbitTilt,
  clampOrbitZoom,
  interpolateOrbit,
  orbitPointerIntent,
  wrapOrbitAzimuth,
} = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
);
let passed = 0;
function test(name, run) {
  run();
  console.log("PASS", name);
  passed++;
}

test("tilt and zoom stay within supported camera bounds", () => {
  assert.equal(clampOrbitTilt(-100), ORBIT_LIMITS.minTilt);
  assert.equal(clampOrbitTilt(100), ORBIT_LIMITS.maxTilt);
  assert.equal(clampOrbitTilt(0.7), 0.7);
  assert.equal(clampOrbitZoom(-100), ORBIT_LIMITS.minZoom);
  assert.equal(clampOrbitZoom(100), ORBIT_LIMITS.maxZoom);
  assert.equal(clampOrbitZoom(1), 1);
});
test("mouse and pen motion preserve a six-pixel tap threshold", () => {
  for (const type of ["mouse", "pen"]) {
    assert.equal(orbitPointerIntent(3, 4, type), "pending");
    assert.equal(orbitPointerIntent(6, 0, type), "rotate");
    assert.equal(orbitPointerIntent(0, -7, type), "rotate");
  }
});
test("touch reserves vertical gestures for native scroll and tolerates tap jitter", () => {
  assert.equal(orbitPointerIntent(5, 5, "touch"), "pending");
  assert.equal(orbitPointerIntent(10, 2, "touch"), "rotate");
  assert.equal(orbitPointerIntent(-10, 2, "touch"), "rotate");
  assert.equal(orbitPointerIntent(2, -10, "touch"), "scroll");
  assert.equal(orbitPointerIntent(8, 8, "touch"), "scroll");
});
const from = {
  azimuth: 1.3,
  tilt: 0.7,
  zoom: 1,
  distance: 11.7,
  targetFactor: 0,
};
const fullTurn = { ...from, azimuth: from.azimuth + Math.PI * 2 };
test("a requested tour traverses a full turn, including its halfway back view", () => {
  const middle = interpolateOrbit(from, fullTurn, 0.5);
  assert(Math.abs(middle.azimuth - from.azimuth - Math.PI) < 1e-12);
  assert.deepEqual(interpolateOrbit(from, fullTurn, 1), fullTurn);
  assert.deepEqual(interpolateOrbit(from, fullTurn, 0), from);
  assert.equal(middle.tilt, from.tilt);
  assert.equal(middle.zoom, from.zoom);
});
test("pose interpolation clamps time and smoothly includes fit-independent camera fields", () => {
  const to = {
    azimuth: 0,
    tilt: 1.5,
    zoom: 0.8,
    distance: 6,
    targetFactor: 0.85,
  };
  assert.deepEqual(interpolateOrbit(from, to, -1), from);
  assert.deepEqual(interpolateOrbit(from, to, 2), to);
  assert(
    Math.abs(interpolateOrbit(from, to, 0.5).targetFactor - 0.425) < 1e-12,
  );
});
test("reset normalizes accumulated turns without changing the visible orientation", () => {
  for (const angle of [-101, -Math.PI * 2, -0.4, 0, 0.4, Math.PI * 2, 101]) {
    const normalized = wrapOrbitAzimuth(angle);
    assert(normalized >= -Math.PI && normalized <= Math.PI);
    assert(Math.abs(Math.sin(normalized) - Math.sin(angle)) < 1e-12);
    assert(Math.abs(Math.cos(normalized) - Math.cos(angle)) < 1e-12);
  }
});
console.log(`${passed} orbit checks passed.`);

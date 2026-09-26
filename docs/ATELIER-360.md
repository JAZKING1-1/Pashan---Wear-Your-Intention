# Making table: interactive 360° preview

Implemented and verified locally on 26 September 2026, based on
`premium-redesign-v1` at `9d40611a8fad326050269737514967937ea783e1`.
The owner subsequently authorized publication of this update on the same day.
No payment, customer message, or production order data change was performed.

## What changed

- Direct full-turn drag rotation in the shared bracelet viewer. Mouse/pen
  movement also tilts; touch reserves vertical gestures for normal page scrolling
  and leaves browser pinch zoom available.
- Overhead, angled and close-up views, tilt/zoom buttons, reset, and an optional
  1.8-second single-turn animation with a Stop control. A drag is not treated as
  a bead-selection tap. A requested preset/reset still reaches its target when
  the preview scrolls offscreen mid-transition; decorative tours stop in place.
- Keyboard controls when the preview is focused: Left/Right to turn, Up/Down to
  tilt, +/- to zoom, Home to reset and Escape to stop the tour. Focus guidance
  overlays the stage without shifting buttons or cancelling the next click.
- Warmer paper-and-stone workbench, clearer stone trays, short placement and
  panel transitions, composition progress, and a verified saved/unsaved badge.
  The badge compares canonical design data rather than object-property order.
- All new interface copy is present in the existing ten locales. Native-language
  editorial review is still advisable before treating translations as final.
- Reduced motion removes automatic animation while retaining manual controls.
  The renderer stops drawing while idle/offscreen. If WebGL is unavailable,
  the SVG preview and ordered bead-editing controls remain usable.

The engine's bead geometry, material recipes, random seeds, fit schema, saved
design format, and actual-design export format were preserved. Existing undo,
redo, reorder, replacement, mirror, fit and recovery behavior remains in place.
Three.js remains lazy-loaded; the homepage does not request a 3D scene.

## Where to review

Run `npm run dev -- --host 127.0.0.1 --port 8084 --strictPort`, then open
<http://127.0.0.1:8084/products/make-your-own> on this computer.
This private loopback address is not a phone-accessible public deployment.

| View | Before | After |
| --- | --- | --- |
| Phone, 390px | [Before](screenshots/atelier-360/before-workbench-390.png) | [After](screenshots/atelier-360/after-workbench-390.png) |
| Tablet, 820px | [Before](screenshots/atelier-360/before-workbench-820.png) | [After](screenshots/atelier-360/after-workbench-820.png) |
| Desktop, 1440px | [Before](screenshots/atelier-360/before-workbench-1440.png) | [After](screenshots/atelier-360/after-workbench-1440.png) |

Normal-height viewport captures, 320px reflow evidence, the SVG fallback and a
real exported design are in the same folder. Full-workbench images use a taller
viewport at the stated width so fixed navigation does not cover the capture;
they are not a claim that the entire workbench fits on one phone screen.

## Verification

- `npm run build` and `npx tsc --noEmit`: pass.
- Targeted ESLint for changed TypeScript and test scripts: pass.
- `node scripts/test-bracelet-orbit.mjs`: 6 pure orbit/gesture checks pass.
- `node scripts/test-v4.mjs`: 13 regression groups pass, including exact bead
  identity, storage failures/recovery, fit conversion, ordered image export,
  Arabic RTL, enlarged text and WebGL context loss.
- `node scripts/verify-v4-shopping.mjs`: 4 groups pass, including ordinary cart
  operations without submitting checkout, shared viewer disposal and focus
  return, real-photo fallback, and no homepage Three.js scene request.
- Final interaction run: 23/23 pass, zero uncaught browser errors. See
  [machine-readable results](atelier-360-results.json). It exercises actual
  mouse and browser-native touch input, keyboard controls,
  finite tours, camera bounds, saved-state changes, fit persistence and exports.

Browser checks use fresh isolated Chrome contexts on localhost. Set
`PASHAN_PLAYWRIGHT_ROOT` to the installed Playwright runtime's `node_modules`
directory before running the browser scripts. No user browser storage is cleared.
Screenshots and v4 regression evidence were refreshed by those scripts.

## Boundaries and remaining inputs

- The 18 positions are a composition preview, not a bracelet sizing formula.
  Maker-confirmed sizing and commercial rules are still needed before custom
  purchase can be enabled. This change does not enable that purchase path.
- Rendered beads are illustrative, not photographs or measured product twins.
  Rotation changes only the camera, never the saved stone order or wrist data.
- PNG export reflects the ordered design; it is not an exported 3D model/video.
  Wrist measurements are not included in the public artwork.
- Existing build warnings include the unresolved `/light-rays.png` reference
  and Vite's tsconfig-paths plugin advisory. No claim of a repository-wide lint
  cleanup or field Core Web Vitals improvement is made.
- Safari and physical-device testing remain advisable; current browser evidence
  is Chrome on Windows with phone/tablet viewport and native touch emulation.

## Implementation references

Native scroll behavior follows the browser's
[touch-action rules](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action)
and [Pointer Events lifecycle](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events).
The viewer follows Three.js's
[render-on-demand approach](https://threejs.org/manual/pages/rendering-on-demand.html)
instead of a perpetual animation loop. No new library was added.

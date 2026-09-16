# PASHAN v4 — local review handoff

Publication update: the owner approved committing and pushing this reviewed work on 16 September 2026. The local-review findings below are retained as the pre-publication record. Deployment must be checked against the newly pushed commit's `data-release` marker; earlier screenshots deliberately show the local baseline marker.

16 September 2026. This is a **local review**, not a deployed release. The latest instruction was to build locally and show the result first. No commit, push, live charge, customer email or support message has been performed in this pass.

Repository: `JAZKING1-1/Pashan---Wear-Your-Intention`; branch `premium-redesign-v1`. Baseline HEAD: `a859cc2974e0bbcc301c2eda131bd62f387adb25`. The initial working tree was clean; fetching origin showed no ahead/behind divergence. Existing published history and lockfiles are unchanged. `AGENTS.md` was followed.

Read: v4 start document, full agent prompt, visual PDF and corrected PNG, reference images, manifest and v2/v3/research background. v4 governs conflicts. Source handoff remains outside the repository under `../handoff-v4/Pashan_Codex_Handoff_v4`; it is not a production asset directory.

## What visibly changed

- A compact, responsive making table: ivory tray, orange actions, three explicit steps and a full-width status. The original Pashan mark and botanical ornament remain. There is no second custom-product purchase panel or competing H1.
- A labelled sample separate from the customer's design. First stone starts a one-bead design; accepting the sample is one undoable action.
- An actual canonical design model with stable bead identities/seeds, full-capacity replacement, selection highlight, move/remove/deselect, exact mirror confirmation, undo/redo, validated save/restore and recoverable invalid drafts.
- Eight mounted catalogue cards with the requested copy, current catalogue prices, full-bracelet photographs and separate actions. All homepage/search/collection/related uses of ProductCard share the new component.
- One lazy shared Three.js viewer, with overhead/angled/detail cameras, pierced beads and demand rendering. Tiger Eye has a photo-count-supported preview; the other seven cards open photographic galleries, not fabricated SKU recipes.
- A real 1080×1350 PNG of the ordered design, safe sequence copying and deliberate fit-help link. No wrist measurement or private note is put into a public URL/share summary.
- All newly introduced controls/statuses/errors/card descriptions use ten-language resources; request-scoped initial locale prevents SSR/client language mismatches.

## Open locally

From this repository:

```powershell
npm run dev -- --host 127.0.0.1 --port 8084
```

- Making table: http://127.0.0.1:8084/products/make-your-own
- Collection: http://127.0.0.1:8084/collections
- Arabic check: http://127.0.0.1:8084/products/make-your-own?lang=ar

Production build was also run locally on port 8085 with `node .output/server/index.mjs`, `HOST=127.0.0.1`, `PORT=8085`. These addresses are private to this PC; they are not phone-accessible public links. Screenshots below can be reviewed without publishing the site.

## Screenshot index

All captures are real local browser output, not the supplied concept image. `before/` preserves the original source baseline. `after/` is the redesigned builder/collection at 320, 390, 430 and 1440px. `states/` contains sample, populated, selected, fit, review, viewer and close-up at those same widths. `evidence/` contains test-state captures, Arabic, simulated doubled text, fallback and two different exported images.

| View | Before | After |
|---|---|---|
| Phone making table | [390px](screenshots/v4/before/builder-390.png) | [390px](screenshots/v4/after/builder-390.png) |
| Desktop making table | [1440px](screenshots/v4/before/builder-1440.png) | [1440px](screenshots/v4/after/builder-1440.png) |
| Phone collection | [390px](screenshots/v4/before/collection-390.png) | [390px](screenshots/v4/after/collection-390.png) |
| Desktop collection | [1440px](screenshots/v4/before/collection-1440.png) | [1440px](screenshots/v4/after/collection-1440.png) |

[Selected bead](screenshots/v4/states/selected-390.png) · [Fit](screenshots/v4/states/fit-390.png) · [Review](screenshots/v4/states/review-390.png) · [Viewer](screenshots/v4/states/viewer-390.png) · [Close-up](screenshots/v4/states/detail-390.png) · [Actual sample export](screenshots/v4/states/sample-export.png) · [Arabic](screenshots/v4/evidence/arabic-390.png).

## Requirement → implementation → evidence

| Requirement | Implemented component / asset | Verification and limitation |
|---|---|---|
| Phone flow, no squeezed status | BraceletComposer, styles-atelier.css | Bounds checks for buttons, inputs, paragraphs and fieldsets at 320/390/430/1440; all pass. Full state screenshots. |
| Consolidate old composer CSS | styles.css; prune-retired-atelier-css.mjs | 146 obsolete selector branches removed, with unrelated branches preserved. No new global `!important` override stack. |
| One clear custom builder | products.$slug.tsx | Old parent bead/reset state and duplicate custom summary removed. Builder owns its model/restore. Standard product screen retained. |
| Sample independent of order/design | BraceletComposer, SAMPLE_BEADS | 0 customer beads; save/export disabled until accepted/edited; first Citrine gives exactly 1; accepted sample gives 18. |
| All eight real stone keys | bracelet-design.ts | Enum derives from customStoneOptions. Eight-stone save/reload passes, including Citrine; Clear Quartz rejected. Heart Quartz identity unchanged. |
| Supported version, identity, capacity, fit | Zod design/fit/bead schemas | Unsupported versions, unknown stones, duplicate IDs, negative fit, asserted confirmation and 19-bead drafts rejected. 18 is explicitly visual capacity, not a wrist-size formula. |
| Migration and invalid-byte recovery | parseStoredDesign; recovery panel | v1 IDs retained, deterministic seeds added, claimed confirmation downgraded. Invalid/overcapacity bytes retained; reset backs up original; recovery download provided. |
| Truthful Save status | canonicalized write and parsed readback | Storage success + reload tested. Blocked storage never reports saved. No silent reset race. |
| Selection, full replacement, move, remove, deselect | ordered bead list and 3D halo | At 18, replacement remains enabled; bead ID/seed unchanged. Move and undo/redo preserve exact sequence and selection. |
| Exact mirror with preview | mirrorBeads and inline confirmation | Legal 2→4 order verified; all IDs unique; >9 source beads rejected without slicing; undo restores exact original. |
| Shared three-view representation | createBraceletScene + BraceletScene3D | Same ordered bead props in atelier/collection/detail. Explicit camera controls, no independent spin. Geometry normals regression test passes; bore follows tangent. |
| Real materials, truthful status | bracelet-assets.ts | Authored seeded procedural colour maps and per-stone finishes, not neutral scans/approved digital twins. No photo reused as bump. Material fidelity remains partial and needs maker review. |
| At least one product recipe | Tiger Eye config | 24 visible round beads counted clockwise from top centre in tiger-eye/01.webp, no spacers. Same recipe in all views. Photo-supported illustration, not certified manufacturing dimensions. Other SKU 3D recipes intentionally pending. |
| GPU lifecycle and failure | scene lifecycle / wrapper | Idle draw count does not grow; offscreen/hidden invalidation guards; context-loss fallback retains model. Four repeated modal cycles leave no extra canvas. Initial WebGL denial + reduced motion also passes in production build. |
| All eight mounted cards | ProductCard; collections/index/search/products routes | All 8 collection cards, homepage cards and related cards tested. Correct titles/copy and catalogue prices; siblings, no nested interactive links. |
| Image sizing and fallback | public/atelier-products + manifest | 16 resized/cropped WebPs, no upscaling, actual intrinsic widths, srcset; original files untouched. Asset failure before hydration now falls back correctly. |
| One reusable modal and focus | BraceletProductViewer at root | No per-card WebGL. Tiger Eye opens one canvas; closing removes it and returns focus. Pyrite opens gallery. |
| Fit measurement / units / assistance | WristSizeGuide; sizing-policy.ts | Decimal comma, pasted cm/in, Arabic/Indic digits tested. 165mm retained when display switches to inches. Source/reference/preference survive reload. Known/gift fit does not invent wrist circumference. |
| Custom checkout stays gated | Custom page and existing server gate | No custom Add to bag or Reserve flow. Fit confirmed before making; catalogue reference price is not approval of a sellable custom configuration. |
| Actual ordered export | bracelet-export; shared SVG layout/palette | 1080×1350 downloaded PNG verified. Changing stone sequence changes pixels. Ordered DOM list matches saved model; exact ID/seed/version model used for export. 2D illustration, not a photograph or exact WebGL raster capture. |
| Private fit excluded | publicDesignSummary; export | Summary includes ordered stone labels/design ID, not measurements/private reference; privacy explanation beside explicit copy/help actions. No message sent. |
| New strings in 10 languages | atelier-copy, cardDescriptions, existing I18nProvider | Every new resource has ten nonempty entries. Arabic RTL/expanded text, currency and request-isolated SSR tested. Native review outstanding; older site-wide content is not fully translated. |
| Standard-product shopping intact | existing cart / checkout | Pyrite add, quantity, reload, checkout fields and removal pass. Closed cart drawer made inert to avoid hidden keyboard targets. No payment submitted. |
| Build / type / lint / evidence | scripts + reports | Build passes; changed-file lint has 0 errors, 3 fast-refresh warnings. Existing full-project failures listed below. |
| Release identifier | vite.config.ts, SiteLayout footer | Render's documented RENDER_GIT_COMMIT compiled at build time; local git SHA plus `-local` for a dirty checkout. SSR output contains marker. No fabricated deployed SHA. |
| Commit/push/deployment verification | Deferred to local review | No new commit/push yet, per latest local-first instruction. Existing public URL is not evidence that this preview is deployed. |

## Automated checks

- `npm run build`: pass. Output in [build log](v4-build.log).
- `node scripts/test-v4.mjs`: **13 scenario groups pass**; see [functional results](v4-test-results.json). These include model validation, unit parsing, all-stone persistence, mirror/history, export, layout, SSR and geometry.
- `node scripts/verify-v4-shopping.mjs`: **4 scenario groups pass**; see [shopping results](v4-shopping-results.json).
- Production browser with WebGL blocked and reduced motion: pass; accurate fallback remains editable.
- Changed-file ESLint: **0 errors, 3 fast-refresh warnings** (provider/hook exports); [log](v4-changed-lint.log).
- `npx tsc --noEmit`: **20 pre-existing errors** remain: MegaMenu route typing; RakhiProductTemplate inferred easing type; SiteLayout legacy mobile link typing; Rakhi listing string-vs-array gemstone props. No new v4 module errors. [Log](v4-types.log).
- Full `npm run lint`: 11,943 errors / 11 warnings in the recorded run, overwhelmingly pre-existing CRLF/formatting issues; five existing `no-explicit-any` errors. Full-repo formatting was deliberately not applied to unrelated work. [Log](v4-lint.log).
- `git diff --check`: pass. Git warns about configured LF→CRLF conversion, not whitespace errors.

Tests use the available bundled Playwright and Chrome, not the unavailable attached Chrome-control connection. To rerun in this environment set:

```powershell
$env:PASHAN_PLAYWRIGHT_ROOT='C:/Users/dshm1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules'
node scripts/test-v4.mjs
node scripts/verify-v4-shopping.mjs
node scripts/capture-v4-states.mjs
node scripts/capture-v4.mjs after
```

## Performance and accessibility limits

[Recorded local profile](v4-performance.json): production Node build, fresh Chrome headless context per route, 390×844, DPR 1, unthrottled loopback, one sample—not mobile field data or a PageSpeed score.

| Route | Observed LCP | Observed CLS | Local encoded resource bytes |
|---|---:|---:|---:|
| Home | 924ms | 0.00014 | 1,134,797 |
| Collection | 304ms | 0.01202 | 1,075,081 |
| Builder | 444ms | 0.04117 | 1,521,226 |

No comparable baseline performance run was recorded, so no improvement percentage is claimed. INP/75th-percentile CWV were not measured. Homepage browser requests contain no Three.js scene module. Hero/source assets and the main application bundle still warrant wider performance work; this is not a claim that the whole storefront is lightweight.

Card variants: 480px files are 15–52KB; larger variants 23–89KB. Lava and Dhan Yog retain more image detail and exceed the original 60KB large-card aspiration. Runtime procedural colour maps are 256×128 RGBA (~128KiB per texture before mipmaps), cached across eight variants per stone; maximum 64 maps is ~8MiB base / ~10.7MiB with mipmaps, separate from environment/shadow buffers. No texture-map downloads, KTX2 or Draco added.

Keyboard and emulated touch actions, RTL, visible focus, 44px controls, reduced motion, native scroll permission, individual bounds and simulated 2× text were exercised. No full WCAG certification, screen-reader audit, physical-device virtual keyboard/pinch testing or cross-browser Safari testing is claimed. The unchanged older storefront still has accessibility and translation debt.

## Asset provenance and remakes

`public/atelier-products/manifest.json` records exact original paths/crop rectangles; `src/data/bracelet-assets.ts` records source/fallback, geometry, material version, approval status and unknown dimensions. All source originals remain untouched. Selected product photos retain their actual bead geometry/colour; only crop/resize was performed. Supplied images are not certifications of natural material or rights ownership.

Concrete new shots requested (do not silently generate substitute merchandise):

- For each `pyrite`, `tiger-eye`, `hematite`, `amethyst`, `green-quartz`, `lava`, `dhan-yog`: `{slug}-overhead-cutout.webp`, `{slug}-angled-full.webp`, `{slug}-macro-neutral.webp`, `{slug}-wrist-scale.webp`.
- `heart-quartz-macro-neutral.webp`, `citrine-macro-neutral.webp`: actual builder-only stone references; current colours are catalogue-based illustrations.
- `atelier-empty-tray-overhead.webp`: empty neutral ivory tray, no product, measured shooting setup.
- `pashan-hero-landscape.webp`, `pashan-hero-portrait.webp`, `pashan-making-hands.webp`, `pashan-shipped-packaging.webp`: actual products/process/packaging with confirmed provenance.
- Maker-approved ordered SKU recipes, bead dimensions, finish and any accessories. Do not infer Dhan Yog sequence from a decorative image. After approval create versioned colour/roughness/normal assets and retire illustrations.

## Specific remaining inputs / release gates

1. Maker-confirmed fit ranges, allowance trials, bead sizes/counts, finish and pricing/fulfilment rules. Custom orders remain disabled until these are real and server-validated.
2. SKU recipe and material-fidelity approval, especially Dhan Yog; genuine Heart Quartz/Citrine photos. The current Tiger Eye preview is photo-supported but not maker-approved photorealism.
3. Native review of the nine non-English new translations. Older stories/legal/checkout are not represented as fully localized.
4. Clear pre-existing type/lint gates before treating this as a clean whole-repository release; audit legacy Rakhi routes separately.
5. Review this local result, then commit/push the existing branch normally and verify Render's marker matches that commit. Live address retained: https://pashan-wear-your-intention.onrender.com/ . This pass does not claim a changed deployed version.
6. Operational sales readiness is separate: verify durable complete order persistence, captured-payment reconciliation, actual inventory/dispatch/returns, receipts/Mailjet and contact delivery. No credentials, live payments or campaigns were touched here.

## Roadmap — documentation only

Relative to the first stable release: month 3–4 **Your Mulank, Your Meaning** (optional birth-day-only symbolic calculation, not a horoscope); month 6–8 **One Bead, One Promise**; month 9–12 **The Story You Wear**. Optional Seasonal Atelier only with approved artist work. These are not activated, shipped features or health/fortune claims. Fix defects continuously rather than waiting for a campaign.

Release-marker reference: [Render default environment variables](https://render.com/docs/environment-variables), `RENDER_GIT_COMMIT`, checked 16 September 2026.

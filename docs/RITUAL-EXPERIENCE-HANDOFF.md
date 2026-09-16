# PASHAN ritual experience — local review

16 September 2026. Built on `premium-redesign-v1`, baseline commit `8b44eb65180d5a543a450ce474c5aa696284f70a`. The owner subsequently approved committing and pushing this reviewed update. The local-review evidence below is preserved; deployment verification is separate from a successful GitHub push. No live charge or customer message was performed.

## What changed

| Request | Mounted implementation | Evidence |
| --- | --- | --- |
| A richer ritual-shop identity | `RitualHero.tsx`, `styles-ritual.css`, active palette in `styles.css`: espresso, saffron, paper, restrained brass, burgundy secondary feature | Home before/after screenshots |
| Portal entrance | `OpeningRitual.tsx`, mounted on home and Rashi: architectural doors open in 1.2 seconds when at least 35% of the arch becomes visible; once per tab session, optional replay and immediate skip | Browser visibility/session/skip/replay checks; portal screenshots |
| Devotional character and motion | `SacredStories.tsx`, mounted on home and Rashi: original Ganesha/Shiva/Lakshmi triptych, three working story buttons, optional finite 2.4-second light/scale animation and pause | Story switching, pressed state and finite animation checks |
| Button-based bracelet finder | `/find-your-bracelet`, `BraceletFinder.tsx`, `lib/bracelet-finder.ts` | Unit tests and browser choice/edit/reload/navigation checks |
| Cleaner mobile Rashi cards | `RashiExperience.tsx`, `styles-rashi.css`: removed offset gold shadows and repeated offer labels, contained original photographs in square mats, aligned dark cards | All 12 images checked, price and detail navigation regression tests |
| A small daily interaction | `DailyNote.tsx`: accessible bead-ring reveal, copy feedback, no sign-up gate | Revealed text remains HTML; reduced-motion CSS |
| Shared mobile polish | `SiteLayout.tsx`, `styles-navigation.css`: readable wrapping offer strip, measured header offset on dismissal, no pulsing concierge shadow | Header gap, navigation focus and reflow checks |

No new dependency or lockfile change. Existing React/TanStack stack, native scrolling and real catalogue prices remain. No artificial scarcity, spiritual diagnosis, guaranteed health/wealth claim, product endorsement by deities, or checkout-enabling change.

The religious illustrations are an editorial storytelling section, not purchase buttons. Motion is optional and subtle; the figures are not animated into sales mascots. Reduced-motion settings produce static content. English-only additions declare `lang="en"` and `dir="ltr"`; the existing translated hero headline and shop action retain their locale/direction. These additions are **not represented as fully translated**.

## Finder algorithm

Four explicit choices: intention/reminder, colour, wearing style and budget. It ranks the seven current ready-made bracelet products, not the custom service or Rashi Rakhi catalogue.

- Current catalogue quality matching: 8 points each, up to 24.
- Curated photograph colour family: 5 points.
- Curated wearing/finish preference: 3 points.
- Budget is a strict ceiling, not a score bonus. Unknown products, custom service and invalid prices are excluded.
- Stable alphabetical slug order breaks ties. Up to three positive-scoring matches, each with visible reasons.
- No confidence percentages, randomness, birth details or personal-data tracking. The guide does not infer wrist fit, stock or dispatch.
- Back, edit and restart work. Versioned choices persist only in the current browser tab session; corrupt or blocked storage has an honest recovery state. Prices/images are read from the current catalogue, never the saved session.
- No matches means no recommendation; the UI never silently raises the budget.

## Screenshots

All screenshots are actual local browser captures, not concept mockups.

- Home: [before mobile](screenshots/ritual/before-home-390.png), [after mobile](screenshots/ritual/preview-home-390.png), [before desktop](screenshots/ritual/before-home-1440.png), [after desktop](screenshots/ritual/preview-home-1440.png).
- Rashi: [before mobile](screenshots/ritual/before-rashi-390.png), [new mobile cards](screenshots/ritual/rashi-cards-390.png), [after desktop](screenshots/ritual/preview-rashi-1440.png).
- [Portal entrance](screenshots/ritual/portal-entrance-390.png), [portal open](screenshots/ritual/portal-open-390.png), [devotional stories](screenshots/ritual/sacred-stories-mobile.png).
- Finder: [mobile](screenshots/ritual/preview-finder-390.png), [desktop](screenshots/ritual/preview-finder-1440.png), [recommendation close-up](screenshots/ritual/finder-recommendation-390.png), [result page](screenshots/ritual/finder-results-390.png).
- [Daily note](screenshots/ritual/daily-note-390.png). Full-page captures use `after-home-*`, `after-rashi-*` and `after-finder-*` in the same folder. Obsolete interim captures created during this task were removed after final verification.

## Verification

- `npm run build`: PASS on the final implementation. Existing build warnings include legacy `/light-rays.png` and Vite's tsconfig-path plugin notice.
- Targeted ESLint on all ten changed/new TS/TSX modules: PASS.
- `node scripts/test-bracelet-finder.mjs`: **10 checks passed**, including all 400 answer combinations, hard budget boundaries, invalid saved data, deterministic ties, explanations and current catalogue values.
- `node scripts/verify-v4-shopping.mjs`: **4 checks passed**. Standard add/quantity/reload/remove and checkout form verified without payment submission; product navigation, viewer disposal and photograph fallback verified. Home requested no Three.js scene.
- `node scripts/verify-rashi.mjs`: **12 checks passed**. All 12 photographs/prices/detail pages, URL filters, search, mobile/desktop keyboard navigation, reflow and reduced-motion reflection verified.
- Experience-specific browser suite: **30/30 checks passed, zero uncaught browser errors**. [Results and screenshot paths](ritual-browser-results.json). Includes 320, 360, 390, 768 and 1440px reflow; no horizontal page overflow in tested home/Rashi/finder states. Verified visibility-triggered portal autoplay, skip/replay, native scroll, reduced motion, static no-JS content, keyboard navigation, photograph containment/contrast, finder persistence/editing/hard budgets, real clipboard text, Kolkata midnight rollover/frozen open notes and Arabic artwork/control ordering. The floating concierge is suppressed on the finder at every tested width to keep answers and Continue unobscured.
- `git diff --check`: PASS.
- Whole-repository `npx tsc --noEmit`: still **16 pre-existing errors**: 15 legacy `RakhiProductTemplate.tsx` motion-variant typing errors and one `rakhi.sacred.tsx` prop mismatch. No error in this update's modules. These were already recorded in `RASHI-LOCAL-HANDOFF.md`.
- Whole-repository lint is not clean: the recorded run reports **10,146 errors / 11 warnings**, predominantly existing formatting/CRLF issues, with five existing non-formatting errors. No broad auto-format or unrelated fixes were applied. The new browser script was subsequently formatted individually.

No field Core Web Vitals or comparable Lighthouse performance claim is made. These checks do not constitute a complete assistive-technology or production security audit.

## Artwork, bytes and provenance

- Built-in image-generation mode; full original prompt and disclosure: [ritual-art-prompt.md](ritual-art-prompt.md).
- Original retained locally at `.asset-review/ritual/devotional-triptych-original.png` (ignored by Git); no source product photograph was altered.
- Responsive public assets: `public/images/ritual/devotional-triptych-768.webp` (113,768 bytes) and `devotional-triptych-1440.webp` (351,558 bytes). These are lazy-loaded below the fold. [Dimensions/bytes](ritual-art-sizes.json).
- Existing Tiger Eye hero photograph is approximately 98.21 KB. The portal uses CSS/SVG, not a new 3D library.
- Cultural source links are included in the actual story panels: Metropolitan Museum pages for Ganesha, Shiva and Lakshmi. These explain the iconography, not product benefits. The illustration is AI-generated, not attributed to an artisan, temple, or historic work.

## Run and review

From this repository: `npm run dev -- --host 127.0.0.1 --port 8084`.

Local pages: `http://127.0.0.1:8084/`, `/rashi`, `/find-your-bracelet`. Localhost is private to this PC; it is not a public phone-preview URL. The screenshots can be reviewed in the chat. Render was unchanged during local review; after publication, verify its deployed version separately against the new Git commit.

Browser scripts use Chrome and `PASHAN_PLAYWRIGHT_ROOT` pointing to the available Playwright dependency directory. No customer session is used; tests run in isolated browser contexts.

## Remaining release considerations

1. Review this visual direction and devotional illustration before publishing; proofread/approve any future translations and iconographic changes.
2. This request does not resolve existing maker sizing, fulfilment, verified production email/payment reconciliation, or Rashi enquiry-only purchasing constraints.
3. The ₹899 introductory Rashi price stays unchanged. No unverified ₹1,499 historical price is introduced.
4. Clear or explicitly accept the previously documented whole-repository type/lint issues separately. Preserve unrelated work and never force-push.
5. Two pre-existing untracked screenshots in `docs/screenshots/v4/evidence/failure-2.png` and `failure-6.png` were preserved. The Rashi regression run refreshed its two existing mobile screenshots with the new shared styling.

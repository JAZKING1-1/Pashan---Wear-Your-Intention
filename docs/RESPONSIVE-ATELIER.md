# Responsive atelier — 26 September 2026

## Implemented

- **Phone, tablet and desktop navigation:** `SiteLayout.tsx`, `styles-navigation.css`. Shop / Find / Create is available up to 1180 CSS pixels with any pointer, and through 1366 pixels when a coarse pointer is available. A tablet with a trackpad retains its touch-capable navigation. Wide fine-pointer desktops retain the full header. Menu content no longer disappears above the old phone breakpoint. The dock respects safe areas, dialogs, keyboard/form focus and the last footer links.
- **One photographic presentation system:** `CataloguePhoto.tsx`, `product-photography.ts`, `styles-photography.css`. The seven existing bracelets and custom-design inspiration use square frames with individually reviewed focal positions and comparable visual scale. The same frames appear in home, collection, search and finder results. The actual downloaded photo pixels, stone colours, bead arrangement and source files are unchanged. Alternate-photo and honest failure fallbacks remain.
- **Homepage hierarchy:** `index.tsx`, `RitualHero.tsx`, `OpeningRitual.tsx`, `styles-ritual.css`. Contained, consistently framed hero; discover / create / daily-ritual pathways; four aligned desktop product cards; two-column ordinary phone/tablet grid (one at 320px); square making-table inspiration; distinct hand-held story photograph; more consistent section spacing. Existing finite light/portal interactions and reduced-motion fallback remain.
- **Collection guidance:** `collections.tsx`, `styles-atelier.css`. Actual item count, finder/custom/Rashi links, clear material/category labels and calmer aligned actions. No inventory, prices or availability invented.
- **Product decision screens:** `products.$slug.tsx`, `styles-product-detail.css`. Full uncropped originals on a contained gallery mat; actual thumbnail count; labelled arrows outside photos; comfortable tablet columns and phone stacking; 44px control targets and semantic accordions. Product data, cart/pricing/fit checks are preserved.
- **Older sacred route repair:** `/rakhi/sacred` no longer offers two nonexistent Rakhi products with `/placeholder.jpg` and undefined purchase URLs. It leads to the actual Rashi collection and explicitly identified, existing Pyrite/Lava bracelets. Legacy motion variants receive correct TypeScript types.

## Reference review

- [Isha Foundation](https://isha.sadhguru.org/eu/en): reviewed the live image-led entry points, recurring ornament and distinct editorial sections. Applied the principle of clear visual chapters, not their photographs, beliefs, claims or identity.
- [House of Intuition](https://houseofintuitionla.com/): reviewed as a possible interpretation of the owner's “House of Interior” reference while asking for the exact URL. Their intended reference remains **unconfirmed**. The useful comparison was coordinated campaign imagery versus repeatable product-grid photography. None of their assets, reviews or efficacy claims was copied.

## Image limitations and the next shoot

This release improves framing, consistency and page composition; it is not a new studio photoshoot or AI-regenerated merchandise. Most originals share ivory cloth and sunlight; Lava is on green cloth. Background, lighting and camera angle cannot become perfectly identical through layout alone.

For the next image set: shoot every available SKU on the same matte warm-ivory surface, at the same camera height/angle, with the complete bracelet occupying about 75–80% of a square crop. Keep fixed diffuse daylight, white balance and exposure. Deliver one front packshot, one bead-detail image and one actual wrist/scale photo per SKU. Also supply real hands threading the actual stones, portrait plus landscape editorial frames, and only the packaging that really ships. Keep all product geometry/materials truthful. Do not reuse a different charm configuration as a product's packshot.

## Verification

Run privately with `npm run dev -- --host 127.0.0.1 --port 8084 --strictPort`.

Automated responsive evidence is in `responsive-atelier-results.json`; before/after views are in `screenshots/responsive-atelier/`. The suite covers 320, 390, 768, 820, 1024, 1180, 1366 and 1440px, including both fine and coarse-pointer profiles where the layouts differ. It checks overflow, image loading/framing, dock visibility/active route, tablet menu/search/viewer/bag, focused controls, navigation and reduced motion. These are browser-emulated sizes/input capabilities, not a claim of physical iPad/Safari certification.

Local results:

- `npm run build`: passed. Existing warnings remain for the legacy `/light-rays.png` reference and Vite's optional native tsconfig-path support.
- `npx tsc --noEmit`: passed. All 16 previously recorded errors were resolved in the two old Rakhi files.
- Targeted ESLint on all changed TS/TSX files: passed.
- `npm run lint -- --quiet`: not clean, with 9,003 errors across the wider repository: 8,998 auto-fixable formatting/line-ending issues and five existing `no-explicit-any` issues outside the edited files. No repository-wide rewrite was made.
- Responsive suite: 39 checks passed, no browser page errors.
- `scripts/test-v4.mjs`: 13 checks passed, including saved drafts, reloading/editing, measurement units, fit, actual composition export, blocked/corrupt storage, WebGL loss, reduced motion and RTL.
- `scripts/verify-v4-shopping.mjs`: four checks passed, including cart quantity/reload, real product links, no homepage 3D scene request and failed-photo fallback.
- `scripts/test-bracelet-finder.mjs`: ten checks passed, including all 400 answer combinations.
- Separate product-page checks at 320/820/1440px and sacred-route navigation checks passed. Independent photo review checked complete bead rings and primary/all-image failure states.

The seven original first photographs and the custom inspiration remain unchanged WebP assets. The existing 960px hero is about 139KB. Card 480px variants are generally 34–49KB; Lava is the detailed-texture exception at about 86KB. No new raster downloads, animation library, autoplay video or homepage 3D scene were added. This is not a field Core Web Vitals measurement.

No live payment, checkout submission, email or campaign is part of verification. The existing Render service is updated through its established Git auto-deploy branch; no infrastructure or account settings are changed. Public release verification must match the exact pushed commit in `data-release` before it is reported as live.

The known maker-confirmation/custom purchase and operational release-readiness caveats from `EXPERIENCE-REFRESH.md` remain. This visual release does not certify untested order persistence, provider configuration, receipts or customer-email delivery.

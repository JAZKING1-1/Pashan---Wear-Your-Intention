# PASHAN — original photographs & mobile experience

Local review, 26 September 2026. No commit, push, deployment, live order, payment or customer email in this iteration.

## What changed

| Request | Implemented in | Evidence |
| --- | --- | --- |
| Remove customer-facing AI references | SacredStories, BraceletFinder | Public copy and image description updated; cultural-symbolism caveats retained. Internal artwork provenance remains truthful. |
| Replace artificial builder image | Homepage making table | Original mixed-stone bracelet photo from Drive, ivory frame, explicit inspiration caption. It is not presented as the customer's final custom design. |
| Use original product photos | product-photography.ts, products.ts, ProductCard, finder, product gallery, hero | 21 original files visually reviewed; 14 chosen source photos, 480/960 WebP variants, 7 catalogue pieces plus the custom inspiration card. Full source map and byte-size/SHA evidence in original-photo-manifest.json and original-photo-sizes.json. |
| Three-button mobile guidance | SiteLayout, styles-navigation.css | Shop / Find / Create, active indicators and aria-current, safe-area spacing, 44px+ controls, reserved footer space. Hidden for dialogs, bag, keyboard/form interaction, checkout/cart and when it would obstruct focused controls. |
| Improve access | LuxurySearchOverlay, CartDrawer, navigation | Search returns focus; bag is an actual Radix modal with Escape, focus trap, opener return, clear labels, 44px controls and one keyboard-aware scroll region. Duplicated Rashi link and false unread badge removed from display. |
| Spiritual light transitions | OpeningRitual, LightPassage, styles-ritual.css | Warm light during the existing entrance; 900ms making-table light sweep once on arrival and by Replay light. All content stays visible; reduced motion reveals immediately. No flashing, forced waiting or scroll interception. |

Existing logo, heading typography, prices, product descriptions, offers, sizing restrictions and payment rules are preserved. Old source images remain untouched on disk. Product gallery imagery now comes from the original-photo mapping instead of campaign composites; the homepage story uses a real hand-held bracelet photograph, not a claim of photographed manufacturing.

This is app-like mobile navigation, not an installable/offline PWA. No service worker or checkout caching was added. Product photography is not certification of stone identity, geographic origin, dimensions or current manufacturing specifications.

## Photography found and still useful

Reviewed [OG Bracelets Raw](https://drive.google.com/drive/folders/1SGQZ9Zmj3sy8rhDV3Kv7MVNioStZ6zYk): 21 files, covering seven existing visual catalogue types, alternative angles and a mixed piece held in a hand. Originals are preserved privately in .asset-review/experience-refresh. Source-file hashes record the downloaded files, not an independent provider-side checksum comparison.

The separate [Image Photoshoot folder](https://drive.google.com/drive/folders/1D7907nUocGamCdjlWg2ARI24zpcBp0Mz) was inventoried; its Tiger Eye shot was inspected but not selected because it includes a different charm arrangement and water treatment that should not silently replace the catalogue piece.

The [Box Packaging folder](https://drive.google.com/drive/folders/1h67p8ZBWaD3W7zMN3DZRCOOyhiCe_Xdh) contains 14 image files. Those were inventoried, not visually reviewed in this iteration. Confirm the currently shipped packaging before selecting them; no need to assume a new packaging shoot is necessary.

Highest-value next photographs (not found in the reviewed 21-photo bracelet set):

1. **Real making hands:** a person threading the actual cord/beads at the actual table, overhead and 45-degree angles. No invented workshop props or claims.
2. **Eight loose stone options:** one labelled reference per actual material plus one shared tray, diffuse daylight, consistent background. Resolve Heart Quartz/Rose Quartz identity with the maker rather than renaming from appearance.
3. **Actual wrist fit:** front and side views, on two wrist sizes with measured circumference recorded privately for the size guide. Include tape-measure steps; a photograph alone is not a measuring tool.
4. **One finished custom example:** the exact ordered sequence beside its real bracelet, so the builder-to-finished-piece relationship can be shown honestly.
5. **Optional hero composition:** portrait and horizontal versions with space around the same real bracelet. Current originals work, but this would improve intentional framing.

Do not regenerate stones or recolour products for atmosphere. This implementation only rotates for orientation, resizes and compresses file copies. CSS uses warm mats, borders and composition crops with the full bracelet kept visible. Product galleries retain the full photograph. No new generated merchandise image was made.

## Research behind the choices

- Google's [navigation-bar guidance](https://github.com/material-components/material-components-android/blob/master/docs/components/BottomNavigation.md) describes three to five top-level destinations with icons and labels. Applied here as three stable, named routes; the website keeps its own PASHAN styling and existing React/Radix stack.
- [W3C Focus Not Obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum/) explains the risk from sticky headers/footers. Applied as reserved bottom space, scroll margins and suppression when an input or focused control needs the space.
- [W3C Animation from Interactions](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions) supports disabling nonessential motion. Reduced-motion users receive content immediately; replay controls become explicit motion-off controls. This particular criterion is AAA, not a claim that these changes alone certify WCAG AA/AAA.
- [web.dev animation performance](https://web.dev/articles/animations-and-performance) recommends transform/opacity over layout-changing animation. The new light layers follow that approach; no new animation library, particle engine or homepage 3D scene was added.

Design inference: an experiential shop should give people a small meaningful action and a clear way forward. Here that means the finder, real composition table and optional light/reflection moments, rather than extra blocking screens.

## Verification and local preview

Run from the existing repository with npm:

```sh
npm run dev -- --host 127.0.0.1 --port 8084 --strictPort
```

Local URL: http://127.0.0.1:8084 (available on this PC; not a public phone-preview link). Screenshots are in docs/screenshots/experience-refresh; before/after home, making table and mobile menu are included.

- Production build passes. Existing build warnings remain for legacy /light-rays.png and vite-tsconfig-paths.
- Focused experience suite: 24/24 browser checks plus 2/2 final hero checks pass, with zero browser errors; exact outcomes in experience-refresh-results.json. Covers 320/390/768/1440, all dock actions, menu/search/bag focus, forms, short viewport bag editing/offers, images, native scrolling, finite/reduced motion and no-JavaScript visible-content fallback. All eight card photo crops were visually reviewed with full bracelets visible. This is not a screen-reader or physical-device accessibility certification.
- Finder: 10 unit checks pass, including all 400 answer combinations and catalogue-consistent prices/images.
- Shopping/viewer: 4 regression checks pass, including add/reload/quantity/remove, checkout fields without submitting, no homepage Three.js, viewer disposal and failed primary-photo fallback to another original photograph. The old poster-failure test was updated for the new original-photo paths.
- All touched application TS/TSX files pass targeted ESLint; git diff --check passes.
- Project-wide TypeScript is still blocked by 16 existing errors (15 legacy RakhiProductTemplate easing-type errors, one rakhi.sacred string/string[] mismatch). No errors were reported for changed application files.
- Full-repository lint remains blocked: 9,141 errors and 11 warnings at this run, predominantly pre-existing formatting; five non-format errors in untouched legacy files. No unrelated mass formatting performed.

Image bytes: hero Tiger Eye 49,258 bytes at 480w / 139,836 at 960w. Mixed-piece photo 43,164 / 109,406. Most 480w photographs are 26–50KB; Lava is 86,216 bytes (264,812 at 960w) because its original fabric and porous texture are retained. Only hero is high-priority; below-fold images lazy-load with responsive candidates. No field Core Web Vitals or Lighthouse score is claimed.

## Remaining release decisions

Review this local iteration before publishing. Confirm the selected originals correspond to current shipped stock and approve photo rights/usage; confirm current packaging from the existing folder. Existing maker fit/fulfilment and live payment/email/order-persistence release checks remain separate and were not relaxed or exercised here.

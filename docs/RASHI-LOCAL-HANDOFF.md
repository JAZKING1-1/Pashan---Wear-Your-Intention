# Rashi collection — local handoff, 16 September 2026

## What changed

- All twelve signs now have reviewed Drive photographs, a ₹899 introductory price, a detail page and a real, prefilled WhatsApp enquiry link.
- The previously missing Scorpio is included. Its Drive filename says “वृश्चिक Libra”; the pictured plaque says Scorpio. Mapping follows the photographed product, not the incorrect English filename.
- The products are described as beaded woven-cord Rakhis. No gemstone identity, metal purity, certification, gift-box contents, stock count, fulfilment date or therapeutic effect is inferred from a photo.
- One active Rashi catalogue supplies cards, detail pages, search and enquiry text. Older image-glob inventories and the old product template remain in source history/workspace but are no longer used by the Rashi journey.
- Shareable sign filters, reset, reload and browser Back work. English and Hindi sign names work in shared search.
- Warm ivory, espresso and orange, botanical ornaments, text-style zodiac glyphs, a gently turning botanical seal when switching signs, and an optional reflection reveal. No autoplay, sound, email gate, camera use or birth-data collection.
- Reused installed Framer Motion and Radix. No dependency or lockfile changes. Reduced-motion users get immediate state changes. Content does not start invisible.
- Replaced the hover-only desktop mega-menu with a keyboard-operable dropdown. Mobile navigation is now a Radix modal with focus trapping/return, Escape, an independently scrollable link area, and an unobscured footer. Language controls remain.
- Stone links now open canonical product pages. Footer text is larger and higher-contrast.
- Repaired nested Rakhi route rendering: the parent previously did not render its child outlet.

## Website map and navigation

| Journey               | Destination                   | Purpose                                           |
| --------------------- | ----------------------------- | ------------------------------------------------- |
| Home                  | /                             | Brand introduction                                |
| Shop → All bracelets  | /collections                  | Existing eight-item bracelet catalogue            |
| Shop → Stone          | /products/:slug               | Actual standard product decision page             |
| Rashi                 | /rashi                        | Twelve-sign catalogue, ₹899, fit/order guidance   |
| Rashi detail          | /rakhi/rashi/:sign            | Correct photo, price, enquiry and product caveats |
| Make your own         | /products/make-your-own       | Existing v4 making table                          |
| Our story / Journal   | /about, /journal              | Brand and editorial                               |
| Find / Rituals & care | /find-your-bracelet, /rituals | Discovery and care                                |
| Search                | /search?q=...                 | Bracelets and Rashi results                       |
| Bag / Checkout        | /cart, /checkout              | Existing standard-product purchase flow           |
| Help                  | /contact, /track-order        | Support and tracking                              |

Compatibility: /rakhi/rashi redirects to /rashi. /rakhi/product/:sign redirects to /rakhi/rashi/:sign, including old action=purchase links. The Raksha Bandhan landing page remains at /rakhi and uses the new twelve-card Rashi grid.

Keep the top level focused on **Shop / Rashi / Make your own / Our story / Journal**. Future home/fragrance categories should appear only after real products exist. The older /rakhi/sacred placeholder catalogue and legacy /collections/:slug route still need their own cleanup; they are not evidence of launch-ready products.

## Pricing and purchase boundary

- ₹899 is the owner's requested introductory price.
- ₹1,499 is recorded as requested comparison pricing, but is NOT shown as a historical price. Owner confirmation is outstanding: was it actually charged, or is it a planned regular price?
- No invented offer end date, savings percentage, discount stacking or scarcity.
- The old Rashi Buy Now control had no purchase implementation. Rashi is absent from the server's sellable catalogue. This local update provides an honest enquiry path instead of bypassing server validation or simulating a successful order.
- Maker confirmation remains necessary for material identities, supported wrist range, availability, packaging, dispatch, delivery charges and return terms. Rashi is not added to the payment catalogue until these and its order contract are ready.
- The WhatsApp destination reuses the site's existing contact number. The test inspected the URL; it did not open/send a message.

## Assets

Source folder: https://drive.google.com/drive/folders/1gIl-VCVhI8QZcMvzyhKpIlxFlVgH7yeu

13 original JPGs were retrieved; twelve selected photographs are mapped in the preparation script and size report. The duplicate Sagittarius original is not used. Originals are untouched in ignored .asset-review/rashi-drive and are not shipped. The 24 responsive derivatives are in public/images/rashi.

See rashi-drive-manifest.json for stable source metadata and rashi-image-sizes.json for measured dimensions/bytes. No private download URLs or inline image data are committed.

Cards use 480/960 srcsets, contain (not product-altering crops), reserved aspect ratios and lazy loading. Only the hero/main detail image is eager. The largest 480 variant is Libra at 64,020 bytes; this modestly exceeds the earlier 60KB card target to retain bead detail. Aries hero 960 is 99,934 bytes. Some 960 detail images reach 210,814 bytes; these are optional responsive detail sizes rather than twelve eager mobile downloads.

## Verification

- npm run build: PASS (existing unresolved /light-rays.png warning and chunk-size warnings remain).
- Changed TypeScript/TSX files: targeted ESLint PASS.
- Browser suite: 12/12 PASS; see rashi-test-results.json and scripts/verify-rashi.mjs.
- Viewports: 320, 360, 390, 768, 1440; catalogue and detail have no horizontal page overflow.
- Checked all twelve detail pages and photos, displayed prices, enquiry payloads without sending, legacy redirects, invalid filter reset and unknown-product 404.
- Checked filter focus, URL state/reload/Back, English/Hindi search, keyboard result activation, mobile focus trap including select/summary, Escape/focus return, desktop keyboard menu, reduced motion and no-JavaScript catalogue visibility.
- No uncaught browser errors across tested routes.
- Existing v4 shopping regression suite: 4/4 PASS (ordinary add/reload/quantity/remove/checkout form, product navigation, shared viewer lifecycle, image-failure fallback). No payment submitted.
- Repo-wide TypeScript still reports 16 pre-existing errors: 15 motion-variant typing errors in the unused legacy RakhiProductTemplate.tsx and one gemstone prop mismatch in the existing rakhi.sacred.tsx placeholder. Baseline was 20 errors; the four errors in touched navigation/Rashi code are fixed.
- Repo-wide lint is not clean: the current run reports 10,364 errors, mostly existing formatting/legacy/generated-code issues. This is not represented as a clean project-wide lint result.
- These are local automated and visual checks, not a WCAG certification or real-device/field Core Web Vitals measurement.

## Preview and reproduction

From this repository: npm run dev -- --host 127.0.0.1 --port 8084

Open http://127.0.0.1:8084/rashi on this computer. Localhost is private and not a public phone link.

Screenshots in docs/screenshots/rashi:

- before-390.png / before-1440.png
- after-390.png / after-1440.png (complete pages)
- preview-390.png / preview-1440.png (first screens)
- collection-mobile.png / product-mobile.png / menu-mobile.png

Browser scripts use the existing bundled Playwright runtime. Set PASHAN_PLAYWRIGHT_ROOT to its node_modules directory and run node scripts/verify-rashi.mjs. Asset preparation uses the same bundled Sharp runtime and requires the original downloaded JPGs.

No push, deployment, live charge or customer communication was performed for this update.

# Inscription-style headings

Local review: 16 September 2026, following `8782aff`. Publication approved by the owner on 25 September 2026. This document preserves the reviewed local evidence; deployment must be verified separately against the publishing commit.

## Change

- Reused the already-loaded **Cinzel** family for a consistent carved, classical heading style. No new font service, library, dependency or weight was added.
- Added a separate `--font-heading` role for h1–h6, accessible role headings and explicit visual title utilities. Updated existing component heading rules rather than repointing the prose `--font-serif` token or adding `!important` overrides.
- Applied the style across storefront/editorial pages, Rashi, product cards, finder, builder and dialogs. Footer column titles now use semantic h2 elements; cart/search product names and empty-state titles use the heading utility.
- Adjusted larger heading sizes, line height and line lengths for Cinzel's wider forms. Heading emphasis stays upright rather than synthesizing an italic font. The mobile finder ornament is hidden to keep the wider heading unobscured; its desktop version remains.
- Kept logo, navigation, controls, prices, body copy and editorial quotations in their existing typography. No price, product, shopping, payment, email or recommendation logic changed.
- Preserved actual translations and script shaping. The heading stack includes the existing Noto Serif Devanagari family; other scripts retain browser glyph fallback. Cinzel is an ancient-inscription-inspired modern font, not a claim of historic Indian lettering.

## Verification and previews

- `npm run build`: passed.
- Targeted ESLint for all six changed TSX files: passed.
- `git diff --check`: passed.
- **48/48 browser checks passed**, plus **3/3 final finder layout checks**, with zero runtime errors. Actual font rendering, route headings, 320/390/1440px layout, dialogs and Hindi/Arabic checks: [browser results](heading-font-results.json), reproduced with `scripts/verify-heading-fonts.mjs`. Chrome's rendered-font data confirmed Cinzel for English, Noto Serif Devanagari for Hindi and Times New Roman fallback for Arabic.
- Main pages tested: home, collection, standard product, making table, Rashi and its detail page, finder, story, journal, rituals, contact, cart, checkout and search. Checks do not submit payments or messages.
- Existing whole-repository TypeScript/lint issues documented in earlier handoffs were not expanded into this typography task.

Screenshots:

- Home: [before mobile](screenshots/headings/before-home-390.png), [after mobile](screenshots/headings/after-home-390.png), [after desktop](screenshots/headings/after-home-1440.png).
- [Collection](screenshots/headings/after-catalogue-390.png), [Rashi](screenshots/headings/after-rashi-390.png), [finder](screenshots/headings/after-finder-390.png).
- [Search](screenshots/headings/search-390.png), [bag](screenshots/headings/bag-390.png), [viewer](screenshots/headings/product-viewer-390.png).
- [Hindi at 320px](screenshots/headings/translated-hi-320.png), [Arabic at 320px](screenshots/headings/translated-ar-320.png).

The local preview remains at `http://127.0.0.1:8084/`. This is private to the PC. The public site is `https://pashan-wear-your-intention.onrender.com/`; verify its release marker against the publishing commit before claiming the new fonts are live. Two unrelated v4 failure screenshots remain untouched.

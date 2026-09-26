# Complimentary ritual kit — local handoff

Date: 26 September 2026. Base: `premium-redesign-v1` at `b057dc186d8d33dcb47aa7ec67ddfd9d46303ff4`.

This handoff records the completed local implementation and verification. The owner subsequently authorized publication with “Push them”; this release is being committed to the existing deployment branch. Live verification is recorded separately. No email, live charge or fulfilment action is part of this release.

## What changed

- A first-screen, keyboard-accessible free-kit callout links to the actual kit section.
- The previously unused `PackagingShowcase` now appears directly after the homepage hero, ahead of the product catalogue. It has a warm paper layout, real box photograph, explicit views, written details and a clear route back to shopping.
- One shared `ritualKit` message supplies the owner-confirmed inclusion statement on home, product/custom pages, bag, cart, checkout and Rashi. Stock, sizing, pricing, enquiry-only and payment restrictions remain unchanged.
- Old product-page packaging artwork and unsupported itemized certification copy are no longer shown in those replaced presentation sections. Obsolete packaging CSS was removed without changing shared product-gallery rules.
- Photo views work with buttons and keyboard, announce the selected view and never autoplay. Reduced motion disables the optional zoom transition. The content is present without JavaScript; an image-load failure does not remove the written details.
- Phone/tablet/desktop layouts retain the existing three-button navigation, safe-area spacing and measured-header anchor offset.

## Source and claims ledger

The owner confirmed in this conversation that a ritual kit is free with all products. That is the source for the prominent universal inclusion claim, not an inference from a photo.

[Box Packaging on Drive](https://drive.google.com/drive/folders/1h67p8ZBWaD3W7zMN3DZRCOOyhiCe_Xdh) contains 14 JPGs. All were inventoried and viewed in a contact sheet; three open-box photographs were additionally inspected at full size. They show different bracelet/Rakhi presentations, so seasonal extras are not advertised as universal.

Selected original: `IMG_20260725_170744.jpg`, Drive ID `1kj6tcS18RAijzftIdeimlCpsVx1uD4Eo`, 3,337,027 bytes, 2304 × 4096. [Open original in Drive](https://drive.google.com/file/d/1kj6tcS18RAijzftIdeimlCpsVx1uD4Eo/view?usp=drivesdk).

Downloaded original SHA-256: `35E293AB9A694B89FE2951DAF087F9D62F37513BA4F07875B6833A0C4C24537D`. This records the local source; it is not a provider-side checksum comparison.

The selected photograph visibly shows a bracelet, labelled Ganga Jal bottle, packet of dhoop and printed thank-you/PASHAN card. The website labels these **Inside the photographed box**, rather than certifying the current universal contents. The view titled Ritual details is a closer framing of the same photograph, not a second kit.

The older [STORY_PLAN_2_DAYS.md](https://drive.google.com/file/d/1T4fl0M8H3gMIcHsqb7WrQzEBKmXhGUzK/view?usp=drivesdk) lists bracelet, certificate, Ganga Jal, dhoop and pouch. This is historical marketing copy, not proof of a gem certification. No certification, bottle-volume, provenance, blessing, therapeutic benefit, monetary gift value, code requirement or kit-count rule was added.

The Rakhi photographs with a diya, decorated container and food-like extras were not selected for the universal kit promotion. Their current applicability remains unconfirmed.

## Image handling

All 14 source JPGs remain untouched in ignored `.asset-review/ritual-kit/`. `scripts/prepare-ritual-kit.mjs` makes a review contact sheet and resize/compress-only WebP copies of the selected source. No AI generation, recolouring, background replacement or merchandise alteration was performed. The UI uses reversible CSS framing, with a link to the complete photograph.

| Width | Dimensions | File bytes |
| --- | --- | --- |
| 480 | 480 × 853 | 51,064 |
| 960 | 960 × 1707 | 177,544 |
| 1440 | 1440 × 2560 | 337,572 |

These are below-fold detail images with responsive sources, explicit dimensions and lazy loading; they do not replace the existing hero LCP image. The largest variant is retained for the optional full-photo view and high-density detail inspection.

## Verification

- Production build: passed. Existing warnings remain for `/light-rays.png` and Vite's native tsconfig-path option.
- TypeScript: `npx tsc --noEmit` passed.
- Targeted ESLint for changed TypeScript/React files: passed.
- Dead-style removal: parsed CSS before/after; non-packaging declarations, order, shared gallery and media rules preserved.
- Responsive/interaction suite: **25/25 passed**, zero uncaught browser errors. Widths: 320, 390, 768, 820, 1180 and 1440px. Includes visible first-screen promise, keyboard anchor/header/dock clearance, real image loading, view selection/live caption, settled detail zoom, full-photo link, catalogue navigation, reduced motion, no-JavaScript content and pre-hydration image failure. Evidence: `scripts/verify-ritual-kit.mjs` and `docs/ritual-kit-results.json`.
- Existing shopping regression suite: **4/4 passed** (add/reload/quantity/remove, checkout form without submitting, product navigation, builder controls/viewer disposal and alternate-photo fallback). Evidence: `docs/v4-shopping-results.json`.
- Screenshots: 6 before and 13 after in `docs/screenshots/ritual-kit/`, including homepage, complete hero, complete kit at 390/820/1440px, and a phone detail view. Complete-section captures temporarily increase viewport height at the same width to keep fixed navigation out of the evidence; normal viewport captures are separate.

No full-repository lint-clean claim is made. The prior baseline recorded thousands of unrelated formatting/CRLF failures; this change does not reformat the repository.

## Run locally

```powershell
npm run dev -- --host 127.0.0.1 --port 8084 --strictPort
```

Open `http://127.0.0.1:8084/` on this computer. The server remains private; localhost is not a remote-phone sharing URL. Screenshots provide the phone/tablet preview without deploying.

```powershell
$env:PASHAN_PLAYWRIGHT_ROOT='C:/Users/dshm1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules'
node scripts/verify-ritual-kit.mjs
```

## Remaining business inputs / existing issue

1. Confirm the standardized contents currently sent across bracelets, custom pieces and Rashi. Asked in this conversation; no answer yet. The photo and old marketing list differ; the broad free-kit promise is confirmed, but extra-item promises are deliberately withheld.
2. Confirm the packing quantity rule for multi-item orders and any seasonal substitutions before adding an itemized universal checklist or fulfilment automation.
3. A clean, current flat-lay of that standardized kit would improve photography further. The real July photo is used now; no new studio scene was fabricated.
4. A pre-existing route issue was found: `/collections/pyrite` renders the parent catalogue because the parent route has no outlet. Its legacy detail component's wording was aligned, but it is not claimed to be a functioning newly mounted page; no unrelated router restructuring was attempted.

Publication was authorized after the local review. Preserve existing unrelated untracked live-verification evidence; do not force-push.

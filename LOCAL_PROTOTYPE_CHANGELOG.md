# PASHAN local prototype — 5 September 2026

## Implemented in this local pass

- Introduced the orange-led paper, espresso, saddle, copper, antique-gold and silver token set and corrected primary orange actions to use espresso labels.
- Simplified primary navigation to Shop, Make Your Own, Our Story and Journal while preserving seasonal routes elsewhere.
- Replaced the moving opening strip with a dismissible offer sourced from the existing `PASHAN10` rule.
- Removed the automatic newsletter popup so the hero, search and builder are never blocked on entry.
- Added original contemporary Madhubani-inspired `LeafDivider`, `DoubleLineFrame` and `BotanicalSeal` SVG components.
- Added the founder sentiment once in the story section.
- Implemented a shared, normalized catalogue search with deliberate aliases, ranked results and working product navigation.
- Rebuilt `/search?q=` as a real TanStack route with reloadable/shareable state and useful empty states.
- Added wrist circumference input, centimetre/inch handling, canonical millimetre interpretation, measurement guidance and four fit preferences.
- Added an explicit preview sizing policy. Custom purchase is disabled until the maker confirms bead counts, allowances and pricing.
- Added a deterministic daily PASHAN note based on the Asia/Kolkata calendar date, using 30 editorial prompts and no tracking.
- Added stable optional cart identity fields as a compatibility step; full structured configuration persistence remains pending.

## Verification

- `npm run build`: passes.
- `/search`: generated in the TanStack route tree; `tigereye` returns the Tiger Eye product.
- Custom builder: sizing panel renders; Add to bag and Reserve remain disabled.
- Automatic welcome popup: removed from the shared layout.
- `npx tsc --noEmit`: still fails on pre-existing Rakhi/Framer Motion and catalogue metadata type errors.
- Repository-wide lint: pre-existing CRLF/Prettier noise remains extensive; no bulk formatting was performed.

## Business inputs still required

- Maker-confirmed wrist ranges, tested fit allowances, bead sizes/counts and internal circumference rules.
- Confirmed custom bracelet pricing and permitted material/finish variations.
- Confirmation that each product fit currently labelled “Free size” is accurate.
- Verified shipping, returns, packaging and Ganga Jal fulfilment details before treating them as sales promises.
- Confirmation of order persistence, captured-payment reconciliation, Mailjet receipts and contact-message delivery before live orders.
- `ASSET_SELECTION.md` and `asset-manifest.json` from the named ZIP were not present in this checkout; existing resized repository WebP files were retained.

No deployment, push, live payment or customer email was performed.

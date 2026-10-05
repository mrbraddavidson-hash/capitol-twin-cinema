# QA report — Marquee Modern refresh

Date: 2026-10-04

## Automated checks

- `npm.cmd run build` — passed (`Static-site validation passed`).
- `npm.cmd run deploy:check` — passed; Wrangler read 41 assets and found no bindings.
- `git diff --check` — passed.
- Live HTML request — `200`, expected title, versioned `assets/makeover.css?v=932a04e` reference, and brand-kit references present.
- Live stylesheet request — `200`, `text/css`, 13,723 bytes; exact `#D32734`, `#F7B519`, `#86CDDF`, and `#14171A` tokens present.
- Brand-kit SVGs and 4000px PNG masters — all return `200`; the stacked print master is `927,743` bytes and the horizontal print master is `366,412` bytes.
- Live HTML contains no legacy modern-logo references and no loyalty/punch-card/free-pass copy.

## Rendered checks

- Local Wrangler preview at `http://127.0.0.1:8787/` — inspected at desktop viewport in dark theatre mode.
- Local preview theme toggle — inspected in light mode; headings, surfaces, cards, and image crops remained readable.
- Live Worker at `https://capitol-twin-cinema.mrbraddavidson.workers.dev/?brand-kit=aa06252#hero` — inspected after the cache-busted stylesheet deployment.
- Live computed layout — hero logo badge is positioned absolutely at `152px × 152px`; header selects the brand-kit lockup in both light and dark themes.
- Accessibility tree retained the skip link, landmarks, headings, image alternatives, four primary navigation destinations, theme toggle, mobile menu control, and direct phone/email/Facebook actions.

## Deployment evidence

- GitHub commits: `932a04e` — `Adopt full Capitol brand kit as primary logo`; `aa06252` — `Bust makeover stylesheet cache for brand kit`.
- Cloudflare Worker version: `f919c80c-6786-472f-9d39-00d72e58d494`.

## 2026-10-05 — brighter photo-backed concession cards

- `public/assets/makeover.css` now renders the real concession photographs at full opacity with a lighter readability veil; the exact card copy and prices are unchanged.
- Local Wrangler preview was inspected at desktop `1440×900` and mobile `390×844`; the food, drink, candy, and combo subjects are visibly identifiable, with the supplied copy still readable.
- Live Worker `https://capitol-twin-cinema.mrbraddavidson.workers.dev/?photo-bright=2279c01#concessions` was inspected at both breakpoints; the versioned `assets/makeover.css?v=photo-cards3` loaded the new overlay values.
- Live image requests for all four concession assets returned `200 image/jpeg`; the live browser console reported no errors or warnings.
- GitHub commit: `2279c01` — `Lighten concession card photography`.
- Cloudflare Worker version: `17af7bfb-9d03-4a3e-b9ee-a5171c8099c4`.

## Remaining risk

- The named `capitol_twin_cinema_pngs.zip` was not present in the local filesystem during this pass. The separately supplied `capitol_twin_cinema.zip` was inspected; only its original circle logo was adopted because the rest of that package contains removed loyalty content and stale listings.
- A dedicated 375px device viewport was not available through the current browser surface; responsive rules were reviewed in source and desktop/live light-and-dark renders were verified.

## 2026-10-05 — tidy visual surfaces

- The final tidy layer softens the hero, listings, pricing, experience, concession, rental, and contact surfaces with consistent corners, neutral shadows, lighter section fields, and fewer hard-edged offset blocks; copy, brand colours, and real photography are unchanged.
- Local Wrangler preview was inspected at desktop `1440×900` and mobile `390×844`, including hero, current listings, and concessions; the layouts remained readable and balanced.
- Live Worker `https://capitol-twin-cinema.mrbraddavidson.workers.dev/?tidy=c747f11#hero` returned `200`; the cache-busted `assets/makeover.css?v=tidy1` returned `200` with the tidy tokens present.
- `npm.cmd run build`, `npm.cmd run deploy:check`, and `git diff --check` passed; live browser console reported no errors or warnings on the desktop/mobile checks.
- GitHub commit: `c747f11` — `Soften blocky site surfaces`.
- Cloudflare Worker version: `b5eba6a7-b724-4d6d-bcf2-4c1250f5400a`.

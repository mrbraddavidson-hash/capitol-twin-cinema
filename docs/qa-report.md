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

## 2026-10-05 — compact hero CTAs

- The hero showtimes and movie-line CTAs now use a 44px minimum height, smaller type and padding, tighter spacing, and no desktop text wrapping; mobile buttons retain full-width tap targets.
- Local preview was inspected at desktop `1440×900` and mobile `390×844`; both buttons measured `44px` high and remained readable.
- Live Worker `https://capitol-twin-cinema.mrbraddavidson.workers.dev/?hero-buttons=e610071&cb=e610071-2#hero` was checked at both breakpoints; the cache-busted `assets/makeover.css?v=hero-buttons1` served the compact rules.
- Live browser console reported no errors or warnings.
- GitHub commit: `e610071` — `Compact hero call-to-action buttons`.
- Cloudflare Worker version: `b3483ab4-56a1-4df4-9181-ab9c76ab1caa`.

## 2026-10-05 — centred desktop header navigation

- Desktop navigation is now positioned from the header's true centre between the left logo and right-side actions; the compact mobile logo/menu arrangement is unchanged.
- Local and live renders were inspected at desktop `1440×900` and mobile `390×844`; the nav remained centred without overlapping the brand or phone/theme controls.
- Live Worker `https://capitol-twin-cinema.mrbraddavidson.workers.dev/?header-center=d9f695b&cb=d9f695b-1#hero` returned `200`; `assets/makeover.css?v=header-center1` served the new centring rule.
- Live browser console reported no errors or warnings.
- GitHub commit: `d9f695b` — `Center desktop header navigation`.
- Cloudflare Worker version: `991f19f1-7713-4cf4-a4b6-2c77a24c4a1e`.

## 2026-10-05 — lighter marquee gold

- The orange-looking accent was shifted to a softer light gold `#FFD166` across the hero, header, buttons, borders, labels, and utility amber text; dark contrast roles remain on the existing deep-gold token.
- Local and live renders were inspected at desktop `1440×900` and mobile `390×844`; the lighter gold remained readable and the existing layout stayed intact.
- Live Worker `https://capitol-twin-cinema.mrbraddavidson.workers.dev/?lighter-gold=a32660f&cb=a32660f-1#hero` returned `200`; `assets/makeover.css?v=lighter-gold1` served the new token with no legacy orange token remaining.
- Live browser console reported no errors or warnings.
- GitHub commit: `a32660f` — `Lighten marquee gold accent`.
- Cloudflare Worker version: `4d683b1e-4837-4f21-a4e1-d05ccc613061`.

## 2026-10-05 — remove pricing section labels

- Removed the “Honest Canadian Pricing” and “Concession Stand” pill labels; the pricing and concession headings, copy, prices, and cards remain intact with the intro spacing preserved.
- Local Wrangler preview was inspected at desktop `1440×900` and mobile `390×844`; both sections remained readable and aligned without the removed labels.
- Live Worker `https://capitol-twin-cinema.mrbraddavidson.workers.dev/?pricing-label=55299fd&cb=55299fd-1#pricing` returned `200`; the HTML references `assets/makeover.css?v=pricing-label1`, and neither removed label is present.
- `npm.cmd run build`, `npm.cmd run deploy:check`, and `git diff --check` passed; live browser console reported no errors or warnings on the desktop pricing and mobile concessions checks.
- GitHub commit: `55299fd` — `Remove pricing section labels`.
- Cloudflare Worker version: `21d48925-ccb5-44ca-8f1f-bf95c6dd591f`.

## 2026-10-05 — remove hero address badge

- Removed the hero’s `120 Wallace Ave N • Listowel, Ontario` location badge while retaining the hero headline, supporting copy, phone CTA, and address details elsewhere on the page.
- Local Wrangler preview was inspected at desktop `1440×900` and mobile `390×844`; the hero reflowed cleanly with no empty badge gap.
- Live Worker `https://capitol-twin-cinema.mrbraddavidson.workers.dev/?hero-address=2dddd1d&cb=2dddd1d-1#hero` returned `200`; the exact hero badge text is absent and the hero headline/phone CTA remain present.
- `npm.cmd run build`, `npm.cmd run deploy:check`, and `git diff --check` passed; live browser console reported no errors or warnings at both breakpoints.
- GitHub commit: `2dddd1d` — `Remove hero address badge`.
- Cloudflare Worker version: `652495b2-aa2f-4237-816f-bf46b079b0d0`.

## 2026-10-05 — soften theatre lights control

- The light/dark control now uses a low-opacity tinted surface, muted icon colour, and restrained border; hover states remain visible and the 48px touch target plus `aria-pressed` behavior are unchanged.
- Local Wrangler preview was inspected at desktop `1440×900` in dark and light modes and mobile `390×844`; the control no longer competes with the phone CTA or mobile menu.
- Live Worker `https://capitol-twin-cinema.mrbraddavidson.workers.dev/?theme-toggle=756af43-livecheck&cb=756af43-2#hero` returned `200`; HTML references `assets/makeover.css?v=theme-toggle1`, and the deployed stylesheet contains the muted light/dark control states.
- `npm.cmd run build`, `npm.cmd run deploy:check`, and `git diff --check` passed; live browser console reported no errors or warnings on desktop and mobile.
- GitHub commit: `756af43` — `Soften theatre lights control`.
- Cloudflare Worker version: `1e08bc54-8031-4200-81d1-2780ce7bf660`.

## 2026-10-05 — Now Showing admin panel

- Added `/admin/` with signed admin-cookie authentication, a two-screen movie/time editor, add/remove listing controls, optional YouTube trailer candidate search, explicit trailer selection, and publish actions.
- Added the Worker `GET /api/showtimes` feed backed by the `NOW_SHOWING` KV namespace; the public `#showtimes` block replaces its static fallback cards only when published entries exist, and otherwise retains the movie-line/Facebook guidance.
- Local Wrangler preview was inspected at desktop `1440×900` and mobile `390×844`; login, dashboard, test publish, dynamic public card, and no-console-error checks passed.
- Live Worker `https://capitol-twin-cinema.mrbraddavidson.workers.dev/admin/?cb=4f25a5b-livecheck-2` returned `200` and rendered the login panel; the public `#showtimes` fallback rendered at desktop and the live mobile admin login rendered at `390×844` with no console errors or warnings.
- Production `ADMIN_PASSWORD` and `YOUTUBE_API_KEY` are intentionally not stored in source; the admin panel remains usable for direct listings, and Facebook is kept as a manual visitor link. No direct Facebook HTML scraping was added.
- `npm.cmd run build`, `npm.cmd run deploy:check`, `git diff --check`, and JavaScript syntax checks passed.
- GitHub commit: `4f25a5b` — `Add Now Showing admin panel`.
- Cloudflare Worker version: `70991ecf-2130-4175-b288-e2f44f6086d8`.

## 2026-10-05 — admin configuration tool

- Added a Configuration card to `/admin/` for the public Now Showing phone number, Facebook link, listings intro, confirmation heading, and confirmation message.
- Added readiness indicators for KV listings storage, admin sign-in, and YouTube trailer lookup, plus copy buttons for the secret setup commands without accepting secret values in the browser.
- Added authenticated `/api/admin/config` read/write endpoints and public `/api/site-config`; settings are stored under a separate `site-config` KV key and applied by the public showtimes script.
- Local Wrangler preview was inspected at desktop `1440×900`; a configuration save updated the public Now Showing copy and movie-line link, with no console errors or warnings. Unauthenticated configuration writes returned `401`.
- Live Worker `https://capitol-twin-cinema.mrbraddavidson.workers.dev/admin/?cb=468ad16-livecheck` returned `200` and rendered the protected login screen; live `/api/site-config` returned `200`, the public page served `assets/showtimes.js?v=admin-feed2`, and the live public Now Showing fallback rendered without console errors or warnings.
- `npm.cmd run build`, `npm.cmd run deploy:check`, `git diff --check`, and JavaScript syntax checks passed.
- GitHub commit: `468ad16` — `Add admin configuration tool`.
- Cloudflare Worker version: `a235306b-b9ea-49e7-afe7-f3edb12ee698`.

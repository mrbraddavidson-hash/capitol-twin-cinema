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

## Remaining risk

- The named `capitol_twin_cinema_pngs.zip` was not present in the local filesystem during this pass. The separately supplied `capitol_twin_cinema.zip` was inspected; only its original circle logo was adopted because the rest of that package contains removed loyalty content and stale listings.
- A dedicated 375px device viewport was not available through the current browser surface; responsive rules were reviewed in source and desktop/live light-and-dark renders were verified.

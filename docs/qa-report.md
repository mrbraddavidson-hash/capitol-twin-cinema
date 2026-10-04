# QA report — Marquee Modern refresh

Date: 2026-10-04

## Automated checks

- `npm.cmd run build` — passed (`Static-site validation passed`).
- `npm.cmd run deploy:check` — passed; Wrangler read 22 assets and found no bindings.
- `git diff --check` — passed.
- Live HTML request — `200`, expected title, and `assets/makeover.css` reference present.
- Live stylesheet request — `200`, `text/css`, 12,702 bytes; exact red/gold/pale-blue tokens present.
- Imported ZIP logo asset — `capitol_logo_original.png` is served from the hero badge without importing the ZIP's loyalty artwork or stale page shell.

## Rendered checks

- Local Wrangler preview at `http://127.0.0.1:8788/` — inspected at desktop viewport in dark theatre mode.
- Local preview theme toggle — inspected in light mode; headings, surfaces, cards, and image crops remained readable.
- Live Worker at `https://capitol-twin-cinema.mrbraddavidson.workers.dev/` — reloaded and inspected in the browser after deployment.
- Accessibility tree retained the skip link, landmarks, headings, image alternatives, four primary navigation destinations, theme toggle, mobile menu control, and direct phone/email/Facebook actions.

## Deployment evidence

- GitHub commit: `af03d5f` — `Refresh cinema visual system with logo palette`.
- Cloudflare Worker version: `0bc75423-dddd-43f5-b89e-558860cd2379`.

## Remaining risk

- The named `capitol_twin_cinema_pngs.zip` was not present in the local filesystem during this pass. The separately supplied `capitol_twin_cinema.zip` was inspected; only its original circle logo was adopted because the rest of that package contains removed loyalty content and stale listings.
- A dedicated 375px device viewport was not available through the current browser surface; responsive rules were reviewed in source and the desktop/live render was verified.

# Capitol Twin Cinema

Static website package for Capitol Twin Cinema in Listowel, Ontario.

## Local development

```powershell
npm.cmd install
npm.cmd run dev
```

## Deployment

The site is deployed as a Cloudflare Worker with Static Assets using `wrangler.jsonc`.

```powershell
npm.cmd run deploy:check
npm.cmd run deploy
```

Current film listings, showtimes, prices, concessions, accessibility claims, and rental terms must be confirmed with the theatre before publishing factual updates.

The production stylesheet is committed at `public/assets/styles.css`; the deployment build validates required files, internal destinations, and known stale content before Wrangler uploads the site.

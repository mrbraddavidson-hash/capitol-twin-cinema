# Now Showing admin panel

The public `/showtimes` section now reads a small published record from the `NOW_SHOWING` Worker KV namespace. The private `/admin/` panel can:

- add or edit a Screen 1 or Screen 2 movie;
- store a run/date note, rating, runtime, and comma-separated showtimes;
- search YouTube for Canadian official-trailer candidates when `YOUTUBE_API_KEY` is configured;
- require a human to select the trailer result before publishing; and
- remove a listing without editing the public HTML; and
- update the public Now Showing phone number, Facebook link, intro copy, and confirmation message from the Configuration card.
- connect the theatre's Facebook Page through Meta's authorization screen; and
- review the latest authorized Page posts without automatically publishing them.

The Configuration card also reports whether listings storage, admin sign-in, and trailer lookup are ready. It shows copy buttons for the Wrangler secret commands, but it never accepts or stores secret values in KV.

## One-time secrets

The Worker deliberately does not ship with credentials. Set these through Wrangler from the project directory:

```text
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put YOUTUBE_API_KEY
npx wrangler secret put META_APP_ID
npx wrangler secret put META_APP_SECRET
```

`ADMIN_PASSWORD` protects the panel. `YOUTUBE_API_KEY` is used only by the server-side trailer search endpoint and is never sent to the browser. If the YouTube secret is absent, movie/time publishing still works and the panel explains that trailer lookup needs configuration.

`META_APP_ID` and `META_APP_SECRET` configure the official Facebook Page connection. The Page owner starts the connection from the signed-in admin panel, signs in at Facebook, selects the Capitol Twin Cinema Page, and approves read-only Page permissions. The Worker stores the Page token encrypted in KV; the Facebook password is never sent to this site. Meta's app settings must list this exact callback URL:

```text
https://capitol-twin-cinema.mrbraddavidson.workers.dev/api/admin/facebook/callback
```

The connection displays recent Page posts for human review. It intentionally does not auto-publish a movie from free-form Facebook text.

The editable public settings are stored separately under the `site-config` KV key and are read by `/api/site-config`. The public page keeps its baked-in copy if the configuration endpoint is unavailable.

## Data path

The browser posts validated entries to `/api/admin/showtimes`; the Worker writes one `current` JSON record to KV. The public page reads `/api/showtimes` and keeps the existing movie-line/Facebook cards visible until at least one listing has been published. KV is suitable for this low-volume, read-heavy record; a short propagation delay after a publish is expected.

The connection intentionally does not scrape Facebook HTML or auto-publish an unverified movie. Facebook Page HTML is not a stable or authorized data source, and human review prevents free-form social posts from changing the theatre site unexpectedly.

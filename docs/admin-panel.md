# Now Showing admin panel

The public `/showtimes` section now reads a small published record from the `NOW_SHOWING` Worker KV namespace. The private `/admin/` panel can:

- add or edit a Screen 1 or Screen 2 movie;
- store a run/date note, rating, runtime, and comma-separated showtimes;
- search YouTube for Canadian official-trailer candidates when `YOUTUBE_API_KEY` is configured;
- require a human to select the trailer result before publishing; and
- remove a listing without editing the public HTML.

## One-time secrets

The Worker deliberately does not ship with credentials. Set these through Wrangler from the project directory:

```text
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put YOUTUBE_API_KEY
```

`ADMIN_PASSWORD` protects the panel. `YOUTUBE_API_KEY` is used only by the server-side trailer search endpoint and is never sent to the browser. If the YouTube secret is absent, movie/time publishing still works and the panel explains that trailer lookup needs configuration.

## Data path

The browser posts validated entries to `/api/admin/showtimes`; the Worker writes one `current` JSON record to KV. The public page reads `/api/showtimes` and keeps the existing movie-line/Facebook cards visible until at least one listing has been published. KV is suitable for this low-volume, read-heavy record; a short propagation delay after a publish is expected.

This first version intentionally does not scrape Facebook or auto-publish an unverified trailer. Facebook’s page HTML is not a stable or authorized data source, and a human selection prevents an unrelated YouTube result from appearing on the theatre site.

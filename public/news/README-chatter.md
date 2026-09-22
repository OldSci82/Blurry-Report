# chatter.json

Static feed for Latest Chatter. Generated from Scout’s `/workspace/blurry-report/published/` via:

`node scripts/refresh-chatter-from-published.js`

Each post uses `published_at` (ISO) from Scout `meta.json` for posted-time display,
the 7-day feed window, and the 3-day **New** badge on the news page.

See `scripts/README-chatter.md`.

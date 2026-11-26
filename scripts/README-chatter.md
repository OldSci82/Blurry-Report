# Latest Chatter refresh

GitHub Pages serves static files only. The live site cannot read Scout’s box path.

1. Scout publishes each post into `/workspace/blurry-report/published/<stamp-slug>/`
   (`meta.json` with live X URL + `published_at`, `post.txt`, media).
2. On the box, from the Blurry-Report repo root:
   ```bash
   node scripts/refresh-chatter-from-published.js
   # optional: node scripts/refresh-chatter-from-published.js --days 7
   ```
3. Commit and push `public/news/chatter.json` (and any news UI changes).
   The refresh script also runs `scripts/build-case-pages.js` first and **stages** any new case pages
   (`c/`, `public/images/c/`, `sitemap.xml`), so a plain `git commit` includes them. A generator failure
   only logs a warning; the chatter refresh still runs. Skip with `--no-case-pages`.
4. Hard-refresh https://blurryreport.com/public/news/news.html

## Windows

- **Feed window:** refresh keeps posts with `published_at` within the last **7 days** (cap 100).
- **New badge:** `news.js` shows **New** while `(now - published_at) < 3 days` (client-side).
- The page loads `./chatter.json` only — RapidAPI / `news-master.json` is no longer used for Latest Chatter.

## Caption links (approved items get a page before they are posted)

`tools/approve_pages.py` (called by approve.sh on the box) writes `scripts/pending-cases.json` (approved, not yet posted) and
`scripts/alias-locks.json` (aliases already used in captions; they never change), runs `node scripts/build-case-pages.js --prune`,
commits and pushes. When the real post is recorded in `published/` it supersedes the pending entry (matched by `meta.queue`, or
slug + date); if its slug differs, the reserved slug becomes a redirect alias and locked aliases follow the published slug.
`node scripts/build-case-pages.js --plan items.json` is read-only and prints the slug/alias each queue item would get.

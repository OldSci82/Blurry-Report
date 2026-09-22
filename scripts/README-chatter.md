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
4. Hard-refresh https://blurryreport.com/public/news/news.html

## Windows

- **Feed window:** refresh keeps posts with `published_at` within the last **7 days** (cap 100).
- **New badge:** `news.js` shows **New** while `(now - published_at) < 3 days` (client-side).
- The page loads `./chatter.json` only — RapidAPI / `news-master.json` is no longer used for Latest Chatter.

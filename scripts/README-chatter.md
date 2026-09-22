# Latest Chatter refresh

GitHub Pages serves static files only. The live site cannot read Scout’s box path.

1. Scout publishes each post into `/workspace/blurry-report/published/<stamp-slug>/`
   (`meta.json` with live X URL + timestamp, `post.txt`, media).
2. On the box, from the Blurry-Report repo root:
   ```bash
   node scripts/refresh-chatter-from-published.js
   ```
3. Commit and push `public/news/chatter.json` (and any news UI changes).
4. Hard-refresh https://blurryreport.com/public/news/news.html

The page loads `./chatter.json` only — RapidAPI / `news-master.json` is no longer used for Latest Chatter.

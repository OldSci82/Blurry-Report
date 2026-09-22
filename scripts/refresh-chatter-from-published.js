#!/usr/bin/env node
/**
 * refresh-chatter-from-published.js
 *
 * Static / Blurry Latest Chatter refresh:
 *   Reads Scout's shared publish folder:
 *     /workspace/blurry-report/published/
 *   Each post folder should contain:
 *     meta.json  — { url|x_url|live_url, published_at|timestamp, kind?, id? }
 *     post.txt   — exact live copy
 *     media.jpg|media.mp4 (optional for the site feed)
 *   Optional rolling index: index.jsonl
 *
 * Writes:
 *   public/news/chatter.json  (loaded by public/news/news.js on GitHub Pages)
 *
 * Usage (from repo root):
 *   node scripts/refresh-chatter-from-published.js
 *   node scripts/refresh-chatter-from-published.js --days 7
 *   PUBLISHED_DIR=/other/path node scripts/refresh-chatter-from-published.js
 *
 * GitHub Pages cannot read the box path at runtime — run this on the box
 * after Scout publishes, then commit + push chatter.json.
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const OUT_PATH = path.join(REPO_ROOT, "public", "news", "chatter.json");
const DEFAULT_PUBLISHED =
  process.env.PUBLISHED_DIR || "/workspace/blurry-report/published";

/** Keep about one week of chatter (50–100 posts is ample). */
const DEFAULT_DAYS = 7;
const MAX_POSTS = 100;

function parseArgs(argv) {
  let days = DEFAULT_DAYS;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--days" && argv[i + 1]) {
      days = Number(argv[++i]) || DEFAULT_DAYS;
    }
  }
  return { days };
}

function headlineFromText(text) {
  const body = String(text || "")
    .split(/\n\nSource:/i)[0]
    .trim();
  const first = body.split(/\n/)[0] || body;
  if (first.length > 140) return first.slice(0, 137).trimEnd() + "...";
  return first;
}

function pickUrl(meta) {
  return (
    meta.url ||
    meta.x_url ||
    meta.live_url ||
    meta.liveUrl ||
    meta.status_url ||
    meta.permalink ||
    null
  );
}

function pickPublishedAt(meta, folderName) {
  const raw =
    meta.published_at ||
    meta.publishedAt ||
    meta.timestamp ||
    meta.created_at ||
    meta.createdAt ||
    null;
  if (raw) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  // Folder pattern: YYYY-MM-DD-HHMMSS-slug
  const m = String(folderName).match(
    /^(\d{4}-\d{2}-\d{2})-(\d{2})(\d{2})(\d{2})/
  );
  if (m) {
    const iso = `${m[1]}T${m[2]}:${m[3]}:${m[4]}-04:00`;
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return null;
}

function idFromUrl(url) {
  if (!url) return null;
  const m = String(url).match(/status\/(\d+)/);
  return m ? m[1] : null;
}

async function readExisting() {
  try {
    const raw = await fs.readFile(OUT_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return { posts: [] };
  }
}

async function loadFromPublished(publishedDir) {
  const posts = [];
  let entries = [];
  try {
    entries = await fs.readdir(publishedDir, { withFileTypes: true });
  } catch (err) {
    if (err.code === "ENOENT") {
      console.warn(`Published dir missing: ${publishedDir}`);
      return posts;
    }
    throw err;
  }

  for (const ent of entries) {
    if (!ent.isDirectory()) continue;
    const dir = path.join(publishedDir, ent.name);
    const metaPath = path.join(dir, "meta.json");
    const postPath = path.join(dir, "post.txt");
    try {
      const meta = JSON.parse(await fs.readFile(metaPath, "utf8"));
      const text = (await fs.readFile(postPath, "utf8")).trim();
      const url = pickUrl(meta);
      if (!url || !text) {
        console.warn(`Skipping ${ent.name}: need live URL + post.txt`);
        continue;
      }
      const published_at = pickPublishedAt(meta, ent.name);
      posts.push({
        id: meta.id || idFromUrl(url),
        url,
        text,
        headline: headlineFromText(text),
        published_at,
        kind: meta.kind || "post",
        source: "@TheBlurryReport",
      });
    } catch (err) {
      console.warn(`Skipping ${ent.name}: ${err.message}`);
    }
  }
  return posts;
}

async function main() {
  const { days } = parseArgs(process.argv.slice(2));
  const publishedDir = DEFAULT_PUBLISHED;
  const fromScout = await loadFromPublished(publishedDir);
  const existing = await readExisting();

  // Prefer Scout posts; keep any existing that are still within the window
  // and not replaced by the same id/url.
  const byKey = new Map();
  for (const p of existing.posts || []) {
    const key = p.id || p.url;
    if (key) byKey.set(key, p);
  }
  for (const p of fromScout) {
    const key = p.id || p.url;
    if (key) byKey.set(key, p);
  }

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  let posts = [...byKey.values()].filter((p) => {
    if (!p.published_at) return true; // keep undated scout drops
    const t = new Date(p.published_at).getTime();
    return Number.isNaN(t) || t >= cutoff;
  });

  posts.sort(
    (a, b) =>
      new Date(b.published_at || 0).getTime() -
      new Date(a.published_at || 0).getTime()
  );

  // Cap feed size — design range ~50–100 links for a week of posts
  posts = posts.slice(0, MAX_POSTS);

  const out = {
    updated_at: new Date().toISOString(),
    source:
      fromScout.length > 0
        ? "scout-published"
        : existing.posts?.length
          ? existing.source || "existing-chatter.json"
          : "empty",
    account: "https://x.com/TheBlurryReport",
    published_dir: publishedDir,
    window_days: days,
    new_badge_days: 3,
    posts,
  };

  await fs.mkdir(path.dirname(OUT_PATH), { recursive: true });
  await fs.writeFile(OUT_PATH, JSON.stringify(out, null, 2) + "\n");
  console.log(
    `Wrote ${posts.length} post(s) to ${OUT_PATH} (scout=${fromScout.length}, days=${days})`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

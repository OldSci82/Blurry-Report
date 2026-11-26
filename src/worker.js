/**
 * blurryreport.com Worker (Phase 3a). Runs only for /c/* and /stats* (see wrangler.jsonc
 * assets.run_worker_first); everything else is served straight from static assets.
 *
 *  /c/<slug>[?s=yt|tt|fb|ig|x]  serve the generated case page, count one click (humans only)
 *  /c/<alias>                    302 to /c/<slug>, keeping ?s=  (counted once, on the case page)
 *  /c/                           case directory (not counted)
 *  /stats, /stats.json           click totals, HTTP Basic auth with secret STATS_PASSWORD
 *
 * Bindings: ASSETS (static assets), DB (D1, optional: without it pages still work, nothing is counted),
 * STATS_PASSWORD (secret).
 * Stored per click: slug, source, day (America/New_York) aggregated into a counter row. Nothing else.
 */
const SOURCES = new Set(["yt", "tt", "fb", "ig", "x"]);
const BOT_UA = /bot\b|bot\/|crawl|spider|slurp|facebookexternalhit|facebot|meta-externalagent|twitterbot|linkedinbot|slackbot|discordbot|telegrambot|whatsapp|skypeuripreview|embedly|quora link preview|pinterest|redditbot|applebot|googlebot|google-inspectiontool|bingbot|bingpreview|yandex|baiduspider|duckduckbot|petalbot|semrush|ahrefs|mj12bot|dotbot|bytespider|gptbot|claudebot|perplexitybot|ccbot|headlesschrome|lighthouse|preview|curl\/|wget\/|python-requests|python-urllib|go-http-client|node-fetch|axios|okhttp|java\/|libwww|httpclient|scrapy/i;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

let indexCache = null;
let indexAt = 0;

async function loadIndex(env, origin) {
  if (indexCache && Date.now() - indexAt < 60_000) return indexCache;
  const res = await env.ASSETS.fetch(new Request(`${origin}/c/cases.json`));
  indexCache = res.ok ? await res.json() : { cases: {}, aliases: {} };
  indexAt = Date.now();
  return indexCache;
}

const nyDay = (d = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

export function isHumanView(request) {
  if (request.method !== "GET") return false;
  const ua = request.headers.get("user-agent") || "";
  if (!ua || BOT_UA.test(ua)) return false;
  const purpose = (request.headers.get("sec-purpose") || request.headers.get("purpose") || "").toLowerCase();
  if (purpose.includes("prefetch") || purpose.includes("prerender")) return false;
  return true;
}

async function count(env, slug, source) {
  if (!env.DB) return;
  try {
    await env.DB.prepare(
      "INSERT INTO clicks (slug, source, day, count) VALUES (?1, ?2, ?3, 1) ON CONFLICT(slug, source, day) DO UPDATE SET count = count + 1"
    ).bind(slug, source, nyDay()).run();
  } catch (e) {
    console.log("click count failed", e && e.message);
  }
}

async function notFound(env, origin) {
  const r = await env.ASSETS.fetch(new Request(`${origin}/404.html`));
  return new Response(r.body, { status: 404, headers: { "content-type": "text/html; charset=utf-8" } });
}

async function handleCase(request, env, ctx, url) {
  const path = url.pathname;
  if (path === "/c" ) return Response.redirect(`${url.origin}/c/${url.search}`, 301);
  if (path === "/c/") return env.ASSETS.fetch(request);
  const m = path.match(/^\/c\/([^/]+)\/?$/);
  if (!m) return env.ASSETS.fetch(request); // /c/cases.json, /c/<slug>/index.html, etc.
  const want = decodeURIComponent(m[1]).toLowerCase();
  if (!SLUG_RE.test(want)) return notFound(env, url.origin);
  const idx = await loadIndex(env, url.origin);
  const slug = idx.cases[want] ? want : idx.aliases[want];
  if (!slug) return notFound(env, url.origin);
  if (slug !== m[1] || path.endsWith("/")) {
    // alias, uppercase or trailing slash -> one canonical URL (keeps ?s=)
    return Response.redirect(`${url.origin}/c/${slug}${url.search}`, idx.cases[want] ? 301 : 302);
  }
  const page = await env.ASSETS.fetch(new Request(`${url.origin}/c/${slug}/`, { headers: request.headers }));
  if (page.ok && isHumanView(request)) {
    const s = (url.searchParams.get("s") || "").toLowerCase();
    ctx.waitUntil(count(env, slug, SOURCES.has(s) ? s : "direct"));
  }
  const res = new Response(page.body, page);
  res.headers.set("cache-control", "public, max-age=0, must-revalidate");
  return res;
}

function authorized(request, env) {
  const pw = env.STATS_PASSWORD;
  if (!pw) return false;
  const h = request.headers.get("authorization") || "";
  if (!h.startsWith("Basic ")) return false;
  let given = "";
  try { given = atob(h.slice(6)).split(":").slice(1).join(":"); } catch { return false; }
  const a = new TextEncoder().encode(given), b = new TextEncoder().encode(pw);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

async function handleStats(request, env, url) {
  const priv = { "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" };
  if (!authorized(request, env)) {
    return new Response("Password required", { status: 401, headers: { ...priv, "www-authenticate": 'Basic realm="Blurry Report stats", charset="UTF-8"' } });
  }
  if (!env.DB) return new Response("Click storage is not configured.", { status: 503, headers: priv });
  const since7 = nyDay(new Date(Date.now() - 6 * 86400_000));
  const today = nyDay();
  const { results } = await env.DB.prepare(
    "SELECT slug, source, SUM(count) AS total, SUM(CASE WHEN day >= ?1 THEN count ELSE 0 END) AS last7, SUM(CASE WHEN day = ?2 THEN count ELSE 0 END) AS today FROM clicks GROUP BY slug, source"
  ).bind(since7, today).all();
  const idx = await loadIndex(env, url.origin);
  const cols = ["yt", "tt", "fb", "ig", "x", "direct"];
  const by = {};
  for (const r of results) {
    const o = (by[r.slug] ||= { slug: r.slug, title: idx.cases[r.slug]?.title || r.slug, type: idx.cases[r.slug]?.type || "", total: 0, last7: 0, today: 0, sources: {} });
    o.total += r.total; o.last7 += r.last7; o.today += r.today;
    o.sources[r.source] = { total: r.total, last7: r.last7 };
  }
  const rows = Object.values(by).sort((a, b) => b.last7 - a.last7 || b.total - a.total);
  if (url.pathname === "/stats.json") {
    return Response.json({ generated: new Date().toISOString(), since7, today, cases: rows }, { headers: priv });
  }
  const sum = (k) => rows.reduce((n, r) => n + r[k], 0);
  const srcTotals = Object.fromEntries(cols.map((c) => [c, rows.reduce((n, r) => n + (r.sources[c]?.total || 0), 0)]));
  const tr = rows.map((r) => `<tr><td><a href="/c/${esc(r.slug)}">${esc(r.title)}</a>${r.type === "haunted" ? ' <span class="t">haunt</span>' : ""}</td><td>${r.today}</td><td>${r.last7}</td><td><b>${r.total}</b></td>${cols.map((c) => `<td>${r.sources[c]?.total || ""}</td>`).join("")}</tr>`).join("");
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Case link stats | The Blurry Report</title>
<style>body{background:#090040;color:#f3e9ff;font:15px/1.45 system-ui,sans-serif;margin:0;padding:1rem}h1{color:#FFCC00;text-shadow:0 0 8px #B13BFF;font-size:1.5rem}a{color:burlywood}table{border-collapse:collapse;width:100%;max-width:70rem}th,td{border-bottom:1px solid rgba(177,59,255,.35);padding:.35rem .5rem;text-align:right}th:first-child,td:first-child{text-align:left}th{color:#FFCC00;position:sticky;top:0;background:#090040}.t{font-size:.75rem;border:1px solid #B13BFF;border-radius:3px;padding:0 .3rem}.sum{margin:.5rem 0 1rem;color:burlywood}</style></head>
<body><h1>Case link clicks</h1><p class="sum">Today ${sum("today")} · last 7 days ${sum("last7")} · all time ${sum("total")} · by source: ${cols.map((c) => `${c} ${srcTotals[c]}`).join(" · ")}<br>Days are America/New_York. Human visits only (link-preview bots are skipped). No IPs or visitor ids are stored. <a href="/stats.json">JSON</a></p>
<table><thead><tr><th>Case</th><th>Today</th><th>7 days</th><th>All</th>${cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${tr || '<tr><td colspan="10">No clicks yet.</td></tr>'}</tbody></table></body></html>`;
  return new Response(html, { headers: { ...priv, "content-type": "text/html; charset=utf-8" } });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/stats" || url.pathname === "/stats/" || url.pathname === "/stats.json") return handleStats(request, env, url);
    if (url.pathname === "/c" || url.pathname.startsWith("/c/")) return handleCase(request, env, ctx, url);
    return env.ASSETS.fetch(request);
  },
};

#!/usr/bin/env node
/**
 * build-case-pages.js — Phase 3a case pages for blurryreport.com/c/<slug>
 *
 * Reads Scout's publish folder (same source as refresh-chatter-from-published.js):
 *   /workspace/blurry-report/published/<YYYY-MM-DD-HHMMSS-slug>/{meta.json,post.txt,media*}
 *   /workspace/blurry-report/published/index.jsonl  (fills missing X URLs)
 * Only type/kind "case" and "haunted" get pages.
 *
 * Writes (all static assets; deterministic, so re-runs with no new posts produce no git diff):
 *   c/<slug>/index.html          case page with og:/twitter: tags
 *   c/index.html                 public case directory
 *   c/cases.json                 slug list + short aliases (read by src/worker.js)
 *   public/images/c/<slug>.jpg   1200x630 share image (only created if missing; ffmpeg)
 *   sitemap.xml                  /c/ entries refreshed
 *
 * Usage (repo root):
 *   node scripts/build-case-pages.js                 # incremental
 *   node scripts/build-case-pages.js --force-images  # rebuild every share image
 *   PUBLISHED_DIR=/other/path node scripts/build-case-pages.js
 *
 * Exit code is non-zero only on a hard failure; a single bad folder is skipped with a warning.
 */
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..");
const PUBLISHED = process.env.PUBLISHED_DIR || "/workspace/blurry-report/published";
const SITE = "https://blurryreport.com";
const FORCE_IMAGES = process.argv.includes("--force-images");
const OVERRIDES = JSON.parse(fs.readFileSync(path.join(__dirname, "case-aliases.json"), "utf8"));
const FONT_BOLD = process.env.CASE_FONT || "/usr/share/fonts/truetype/sand-box/google/Oswald/Oswald-VariableFont_wght.ttf";
const FONT_BRAND = process.env.CASE_BRAND_FONT || "/usr/share/fonts/truetype/sand-box/google/Orbitron/Orbitron-VariableFont_wght.ttf";
const IN_SCOPE = new Set(["case", "haunted"]);
const FOLDER_RE = /^(\d{4}-\d{2}-\d{2})-(\d{6})-(.+)$/;

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const slugify = (s) => String(s).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80).replace(/-+$/, "");

function readJsonl(p) {
  if (!fs.existsSync(p)) return [];
  return fs.readFileSync(p, "utf8").split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}

function parsePost(text) {
  const lines = String(text || "").replace(/\r/g, "").split("\n");
  const sources = [];
  const kept = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (/^the rabbit hole goes deeper/i.test(line)) continue;
    if (line && line.split(/\s+/).every((w) => w.startsWith("#"))) continue;
    const m = line.match(/^Sources?:\s*(.+)$/i);
    if (m) { for (const u of m[1].split(/\s+|,\s*/)) if (/^https?:\/\//.test(u)) sources.push(u.replace(/[).,]+$/, "")); continue; }
    kept.push(raw.trimEnd());
  }
  const paras = kept.join("\n").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return { paras, sources };
}

function describe(paras, max = 200) {
  const text = paras.join(" ").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const stop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "), cut.lastIndexOf("! "));
  return stop > 80 ? cut.slice(0, stop + 1) : cut.replace(/\s+\S*$/, "") + "…";
}

function loadCases() {
  const index = readJsonl(path.join(PUBLISHED, "index.jsonl"));
  const urlByDir = new Map();
  for (const r of index) {
    const dir = r.dir ? path.basename(r.dir) : null;
    if (dir && r.url) urlByDir.set(dir, r.url);
    if (r.slug && r.url) urlByDir.set("slug:" + r.slug, r.url);
  }
  const exclude = new Set(OVERRIDES.exclude || []);
  const cases = [];
  for (const name of fs.readdirSync(PUBLISHED).sort()) {
    const dir = path.join(PUBLISHED, name);
    const fm = name.match(FOLDER_RE);
    if (!fm || !fs.statSync(dir).isDirectory()) continue;
    try {
      const meta = JSON.parse(fs.readFileSync(path.join(dir, "meta.json"), "utf8"));
      const type = meta.type || meta.kind;
      if (!IN_SCOPE.has(type)) continue;
      const slug = slugify(meta.slug || fm[3]);
      if (!slug || exclude.has(slug)) continue;
      const post = fs.existsSync(path.join(dir, "post.txt")) ? fs.readFileSync(path.join(dir, "post.txt"), "utf8") : "";
      const { paras, sources } = parsePost(post);
      const files = fs.readdirSync(dir);
      const still = files.find((f) => /\.(jpe?g|png|webp)$/i.test(f));
      const video = files.find((f) => /\.(mp4|mov|webm)$/i.test(f));
      cases.push({
        slug, type, folder: name, dir,
        title: (meta.topic || meta.title || fm[3]).trim(),
        location: (meta.location || "").trim(),
        published_at: meta.published_at || `${fm[1]}T00:00:00-05:00`,
        x_url: meta.url || urlByDir.get(name) || urlByDir.get("slug:" + slug) || null,
        paras, sources, still, video,
      });
    } catch (e) {
      console.warn(`skip ${name}: ${e.message}`);
    }
  }
  // Slug collisions: later post gets -YYYY, then -YYYYMMDD
  const seen = new Set();
  for (const c of cases) {
    let s = c.slug;
    if (seen.has(s)) s = `${c.slug}-${c.folder.slice(0, 4)}`;
    if (seen.has(s)) s = `${c.slug}-${c.folder.slice(0, 10).replace(/-/g, "")}`;
    c.slug = s; seen.add(s);
  }
  return cases;
}

// ---------- short aliases ----------
// Distinctive word from the case name first (e.g. /c/valentich). If that word is shared with another
// case, add the year or the place (e.g. /c/ellsworth-1953). Two-word places stay joined (/c/fort-mifflin).
const GENERIC = new Set(("uap ufo ufos the and with from that this into over near north south east west fort point mount lake river road county city great falls fall house ghost ghosts haunting haunted lights light orbs orb triangle triangles black white blue green silver gray grey orange giant giants bigfoot sasquatch dogman monster beast creature figure figures sighting sightings case incident radar film disc discs disk saucer craft object objects tanker chase hotel castle bridge mansion theatre theater hospital prison penitentiary sanatorium asylum school church chapel cemetery farm ranch forest woods valley canyon creek island beach base airport station highway route trail park lodge pass bay pond hill hills mountain mountains stayed came head fell behind last ones room upstairs children stain stairs bride crew test quiz frames ring dry hornets rocks rock rocky dark night legion stadium not human too fast track antique store shop candy bird birds boulder broken eastern edge flap follow follows grove harbor hunt jersey lost michigan colorado california miracle mounds pilots pulsing splits swamp tavern wind liberty lion monk crawling sphere spheres pill rectangle chevron cube shape shifter morphing metallic rotating circling vanishing teardrop jellyfish capsule rainbow window face knocks howls dunes deer bounty attic cell boy captain soldier shadow music hall schoolhouse temple masonic brewery jail tunnels lighthouse staircase plantation reservoir dam formation stone relics horror axe murder mystery paranormal pursuit evp poltergeist flying glass hooded cctv moving help timeline time traveler state old new big little").split(/\s+/));
const STATE = new Set("al ak az ar ca co ct de fl ga hi id il in ia ks ky la me md ma mi mn ms mo mt ne nv nh nj nm ny nc nd oh ok or pa ri sc sd tn tx ut vt va wa wv wi wy pr dc uk au".split(" "));
const PREFIX = new Set("new st ste san santa los las la el fort mount mt point lake north south west east great red bar cedar rock rapid fall broken grand palm white green black old little big high long bass hudson ohio des sister".split(" "));
const raw = (s) => slugify(s).split("-").filter(Boolean);
function words(s) { // join two-word place names: fort-mifflin, st-anthony, rapid-city
  const t = raw(s), out = [];
  for (let i = 0; i < t.length; i++) {
    if (PREFIX.has(t[i]) && t[i + 1] && !STATE.has(t[i + 1]) && !/^\d+$/.test(t[i + 1])) { out.push(`${t[i]}-${t[i + 1]}`); i++; }
    else out.push(t[i]);
  }
  return out;
}

function buildAliases(cases) {
  const slugs = new Set(cases.map((c) => c.slug));
  const freq = new Map();
  const bump = (t) => freq.set(t, (freq.get(t) || 0) + 1);
  for (const c of cases) for (const t of new Set([...raw(c.slug), ...words(c.slug)])) bump(t);
  const ok = (t) => t.length >= 4 && !/^\d+$/.test(t) && !GENERIC.has(t) && !STATE.has(t) && !t.split("-").every((x) => GENERIC.has(x) || PREFIX.has(x));
  const yearOf = (c) => (`${c.title} ${c.location}`.match(/\b(1[89]\d\d|20[0-2]\d)\b/) || c.slug.match(/\b(1[89]\d\d|20[0-2]\d)\b/) || [])[1] || null;
  const aliases = {};
  const taken = new Set(slugs);
  const claim = (a, slug) => { if (!a || a === slug || taken.has(a)) return false; aliases[a] = slug; taken.add(a); return true; };
  const placeOf = (c, name) => [...words(c.location), ...words(c.slug)].find((t) => ok(t) && t !== name && !name.includes(t));
  const left = [];
  for (const c of cases) {
    const inSlug = new Set([...raw(c.slug), ...words(c.slug)]);
    const named = [...words(c.title), ...raw(c.title)].filter((t) => inSlug.has(t) && ok(t));
    const name = named[0];
    // 1) the case's name word, if no other case uses it
    if (name && freq.get(name) === 1 && claim(name, c.slug)) continue;
    // 2) name shared with another case: add year, then place
    if (name && freq.get(name) > 1) {
      const y = yearOf(c), pl = placeOf(c, name);
      if ((y && claim(`${name}-${y}`, c.slug)) || (pl && claim(`${name}-${pl}`, c.slug))) continue;
    }
    left.push(c);
  }
  for (const c of left) {
    // 3) first distinctive word of the slug (usually the place), unique only
    const w = words(c.slug).find((t) => ok(t) && freq.get(t) === 1);
    if (w && claim(w, c.slug)) continue;
    // 4) shared place word + year
    const w2 = words(c.slug).find(ok), y = yearOf(c);
    if (w2 && y) claim(`${w2}-${y}`, c.slug);
  }
  for (const b of OVERRIDES.block || []) delete aliases[b];
  for (const [a, s] of Object.entries(OVERRIDES.aliases || {})) if (slugs.has(s) && !slugs.has(a)) aliases[a] = s;
  return Object.fromEntries(Object.entries(aliases).sort());
}

// ---------- share image ----------
function wrap(text, width) {
  const out = []; let line = "";
  for (const w of String(text).split(/\s+/)) {
    if ((line + " " + w).trim().length > width && line) { out.push(line); line = w; } else line = (line + " " + w).trim();
  }
  if (line) out.push(line);
  return out;
}

function makeImage(c, outPath) {
  const src = c.still ? path.join(c.dir, c.still) : c.video ? path.join(c.dir, c.video) : null;
  const tmp = fs.mkdtempSync(path.join(process.env.TMPDIR || "/tmp", "casepg-"));
  try {
    let lines = wrap(c.title, 22);
    if (lines.length > 4) { lines = lines.slice(0, 4); lines[3] = lines[3].replace(/\s*\S*$/, "") + "…"; }
    fs.writeFileSync(path.join(tmp, "t.txt"), lines.join("\n"));
    fs.writeFileSync(path.join(tmp, "l.txt"), (c.location || (c.type === "haunted" ? "Haunted case file" : "Case file")).slice(0, 44));
    fs.writeFileSync(path.join(tmp, "b.txt"), "THE BLURRY REPORT");
    const fsz = lines.length > 3 ? 54 : 62;
    const text = `drawtext=fontfile='${FONT_BOLD}':textfile='${tmp}/t.txt':fontsize=${fsz}:fontcolor=0xFFCC00:line_spacing=6:x=470:y=(h-text_h)/2-30:shadowcolor=0xB13BFF:shadowx=3:shadowy=3,` +
      `drawtext=fontfile='${FONT_BOLD}':textfile='${tmp}/l.txt':fontsize=32:fontcolor=0xDEB887:x=470:y=h-110,` +
      `drawtext=fontfile='${FONT_BRAND}':textfile='${tmp}/b.txt':fontsize=26:fontcolor=0xFFFFFF:x=470:y=40`;
    const args = ["-y", "-v", "error"];
    if (src) {
      if (c.video && !c.still) args.push("-ss", "1.5");
      args.push("-i", src,
        "-filter_complex",
        `[0:v]scale=1200:630:force_original_aspect_ratio=increase,crop=1200:630,boxblur=18:2,eq=brightness=-0.35[bg];` +
        `[0:v]scale=-2:570:force_original_aspect_ratio=decrease,crop='min(iw,420)':ih[fg];` +
        `[bg][fg]overlay=30+(420-w)/2:30,drawbox=x=440:y=0:w=760:h=630:color=0x090040@0.55:t=fill,${text}`,
        "-frames:v", "1", "-q:v", "4", outPath);
    } else {
      args.push("-f", "lavfi", "-i", "color=c=0x090040:s=1200x630", "-vf", text, "-frames:v", "1", "-q:v", "4", outPath);
    }
    execFileSync("ffmpeg", args, { stdio: "pipe" });
    return true;
  } catch (e) {
    console.warn(`image failed for ${c.slug}: ${String(e.stderr || e.message).slice(0, 200)}`);
    return false;
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

// ---------- html ----------
const fmtDate = (iso) => { const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "America/New_York" }); };

function head({ title, desc, url, image, imageAlt, type = "article", published, jsonld }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(desc)}">
    <link rel="canonical" href="${esc(url)}">
    <meta property="og:site_name" content="The Blurry Report">
    <meta property="og:type" content="${type}">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(desc)}">
    <meta property="og:url" content="${esc(url)}">
    <meta property="og:image" content="${esc(image)}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${esc(imageAlt)}">
    <meta property="og:locale" content="en_US">${published ? `
    <meta property="article:published_time" content="${esc(published)}">` : ""}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@TheBlurryReport">
    <meta name="twitter:title" content="${esc(title)}">
    <meta name="twitter:description" content="${esc(desc)}">
    <meta name="twitter:image" content="${esc(image)}">
    <meta name="twitter:image:alt" content="${esc(imageAlt)}">
    <script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, "\\u003c")}</script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <link rel="icon" type="image/png" href="/public/images/BR_favicon.png" />
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
    <link rel="stylesheet" href="/public/styles/about.css">
    <style>
      .case { max-width: 46rem; margin: 0 auto; padding: 1.25rem 1rem 2.5rem; color: #f3e9ff; line-height: 1.6; }
      .case h2 { text-align: center; font-size: clamp(1.4rem, 4.5vw, 2.1rem); color: #FFCC00; text-shadow: 0 0 8px #B13BFF; letter-spacing: .04em; margin: .5rem 0 .25rem; }
      .case .where { text-align: center; color: burlywood; margin-bottom: 1rem; }
      .case .badge-type { display: inline-block; border: 1px solid #B13BFF; border-radius: 4px; padding: 0 .45rem; font-size: .8rem; letter-spacing: .08em; text-transform: uppercase; margin-right: .4rem; }
      .case img.hero { width: 100%; height: auto; border: 2px solid #B13BFF; box-shadow: 0 0 18px rgba(177,59,255,.45); border-radius: 6px; margin-bottom: 1.25rem; }
      .case-file { background: rgba(9,0,64,.75); border: 2px solid #B13BFF; border-radius: 6px; padding: 1.25rem; }
      .case a { color: burlywood; }
      .case .cta { display: flex; flex-wrap: wrap; gap: .75rem; justify-content: center; margin: 1.5rem 0 .5rem; }
      .case .cta a { border: 1px solid #B13BFF; border-radius: 6px; padding: .45rem .9rem; text-decoration: none; }
      .case .sources { font-size: .9rem; word-break: break-word; }
      .case-list { list-style: none; padding: 0; }
      .case-list li { border-bottom: 1px solid rgba(177,59,255,.35); padding: .55rem 0; }
      .case-list .meta { color: burlywood; font-size: .85rem; }
    </style>
    <link rel="stylesheet" href="/public/styles/hit-counter.css">
<script data-goatcounter="https://blurryreport.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
</head>
<body>
    <header>
        <a href="/" class="homeLink" aria-label="The Blurry Report Home">
            <h1>THE BLURRY REPORT</h1>
        </a>
    </header>
`;
}

const FOOT = `    <footer>
        <p class="copyright">Copyright © 2025 blurryreport.com</p>
        <div class="hit-counter" data-hit-counter data-key="site" role="status">
          <span class="hit-counter__label">Blurry Count:</span>
          <span class="hit-counter__digits" data-hit-counter-digits aria-hidden="true">-------</span>
          <span class="hit-counter__sr">loading</span>
        </div>
        <nav class="links" aria-label="Footer navigation">
            <a href="https://www.facebook.com/BlurryReport" target="_blank" rel="me noopener" aria-label="Facebook"><i class="fab fa-facebook" style="color: burlywood;"></i></a>
            <a href="https://x.com/TheBlurryReport" target="_blank" rel="me noopener" aria-label="X"><i class="fab fa-x-twitter" style="color: burlywood;"></i></a>
            <a href="https://www.youtube.com/@BlurryReport" target="_blank" rel="me noopener" aria-label="YouTube"><i class="fab fa-youtube" style="color: burlywood;"></i></a>
            <a href="https://www.instagram.com/theblurryreport/" target="_blank" rel="me noopener" aria-label="Instagram"><i class="fab fa-instagram" style="color: burlywood;"></i></a>
            <a href="/c/" class="link">All Cases</a>
            <a href="/public/pages/articles.html" class="link">Case Files</a>
            <a href="/public/pages/about.html" class="link">About</a>
            <a href="/public/pages/contact.html" class="link">Contact</a>
        </nav>
    </footer>
    <script src="/public/js/hit-counter.js" defer></script>
</body>
</html>
`;

function casePage(c, hasImage) {
  const url = `${SITE}/c/${c.slug}`;
  const image = hasImage ? `${SITE}/public/images/c/${c.slug}.jpg` : `${SITE}/public/images/og/blurry-report-og.jpg`;
  const where = c.location && !c.title.includes(c.location) ? c.location : "";
  const title = `${c.title}${where ? ` | ${where}` : ""} | The Blurry Report`;
  const desc = describe(c.paras) || `${c.title}. A ${c.type === "haunted" ? "haunted" : "case"} file from The Blurry Report.`;
  const typeLabel = c.type === "haunted" ? "Haunt" : "Case";
  const jsonld = { "@context": "https://schema.org", "@type": "Article", "@id": url, url, headline: c.title, description: desc, image, datePublished: c.published_at, publisher: { "@type": "Organization", name: "The Blurry Report", url: SITE + "/" }, isPartOf: { "@id": SITE + "/#website" }, inLanguage: "en" };
  const body = c.paras.map((p) => `                <p>${esc(p).replace(/\n/g, "<br>")}</p>`).join("\n");
  const src = c.sources.length ? `\n                <p class="sources">Source${c.sources.length > 1 ? "s" : ""}: ${c.sources.map((s) => `<a href="${esc(s)}" target="_blank" rel="noopener nofollow">${esc(s)}</a>`).join(" · ")}</p>` : "";
  const xEmbed = c.x_url ? `
            <blockquote class="twitter-tweet" data-theme="dark" data-dnt="true"><a href="${esc(c.x_url.replace("x.com", "twitter.com"))}">Watch the report on X</a></blockquote>
            <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>` : "";
  return head({ title, desc, url, image, imageAlt: `${c.title} — The Blurry Report share card`, published: c.published_at, jsonld }) +
`    <main class="case">
        <article>
            <h2>${esc(c.title)}</h2>
            <p class="where"><span class="badge-type">${typeLabel}</span>${esc(c.location)}${c.location ? " · " : ""}Posted ${esc(fmtDate(c.published_at))}</p>
            <img class="hero" src="${hasImage ? `/public/images/c/${c.slug}.jpg` : "/public/images/og/blurry-report-og.jpg"}" width="1200" height="630" alt="${esc(c.title)}" fetchpriority="high">
            <div class="case-file">
${body}${src}
            </div>
            <div class="cta">${c.x_url ? `
                <a href="${esc(c.x_url)}" target="_blank" rel="noopener"><i class="fab fa-x-twitter"></i> Watch on X</a>` : ""}
                <a href="/public/pages/report.html">Report a sighting</a>
                <a href="/c/">More cases</a>
            </div>${xEmbed}
        </article>
    </main>
` + FOOT;
}

function indexPage(cases) {
  const url = `${SITE}/c/`;
  const items = [...cases].sort((a, b) => b.published_at.localeCompare(a.published_at)).map((c) =>
    `            <li><a href="/c/${c.slug}">${esc(c.title)}</a><div class="meta">${c.type === "haunted" ? "Haunt" : "Case"}${c.location ? " · " + esc(c.location) : ""} · ${esc(fmtDate(c.published_at))}</div></li>`).join("\n");
  const desc = "Every cryptid, UAP and haunted case The Blurry Report has posted, newest first.";
  return head({ title: "All Cases | The Blurry Report", desc, url, image: `${SITE}/public/images/og/blurry-report-og.jpg`, imageAlt: "Neon retro sunset with a Bigfoot silhouette walking past a pine tree", type: "website", jsonld: { "@context": "https://schema.org", "@type": "CollectionPage", "@id": url, url, name: "All Cases", description: desc, isPartOf: { "@id": SITE + "/#website" }, inLanguage: "en" } }) +
`    <main class="case">
        <h2>All Cases</h2>
        <p class="where">${cases.length} case files, newest first</p>
        <ul class="case-list">
${items}
        </ul>
    </main>
` + FOOT;
}

function writeIfChanged(p, content) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  if (fs.existsSync(p) && fs.readFileSync(p, "utf8") === content) return false;
  fs.writeFileSync(p, content);
  return true;
}

function updateSitemap(cases) {
  const p = path.join(REPO, "sitemap.xml");
  if (!fs.existsSync(p)) return false;
  let xml = fs.readFileSync(p, "utf8");
  xml = xml.replace(/\s*<url>\s*<loc>https:\/\/blurryreport\.com\/c\/[^<]*<\/loc>[\s\S]*?<\/url>/g, "");
  const entries = [{ slug: "", published_at: cases.map((c) => c.published_at).sort().pop() || "" }, ...cases].map((c) =>
    `  <url>\n    <loc>${SITE}/c/${c.slug}</loc>\n    <lastmod>${String(c.published_at).slice(0, 10)}</lastmod>\n  </url>`).join("\n");
  xml = xml.replace(/\s*<\/urlset>\s*$/, `\n${entries}\n</urlset>\n`);
  return writeIfChanged(p, xml);
}

function main() {
  if (!fs.existsSync(PUBLISHED)) { console.error(`published dir missing: ${PUBLISHED}`); process.exit(1); }
  const cases = loadCases();
  const aliases = buildAliases(cases);
  let pages = 0, images = 0, imgFail = 0;
  for (const c of cases) {
    const img = path.join(REPO, "public", "images", "c", `${c.slug}.jpg`);
    fs.mkdirSync(path.dirname(img), { recursive: true });
    if (FORCE_IMAGES || !fs.existsSync(img)) { if (makeImage(c, img)) images++; else imgFail++; }
    if (writeIfChanged(path.join(REPO, "c", c.slug, "index.html"), casePage(c, fs.existsSync(img)))) pages++;
  }
  writeIfChanged(path.join(REPO, "c", "index.html"), indexPage(cases));
  const index = { cases: Object.fromEntries(cases.map((c) => [c.slug, { title: c.title, type: c.type, location: c.location, published_at: c.published_at }])), aliases };
  writeIfChanged(path.join(REPO, "c", "cases.json"), JSON.stringify(index, null, 1) + "\n");
  updateSitemap(cases);
  console.log(`case pages: ${cases.length} in scope, ${pages} written, ${images} images made${imgFail ? `, ${imgFail} image failures (fallback image used)` : ""}, ${Object.keys(aliases).length} aliases`);
}

main();

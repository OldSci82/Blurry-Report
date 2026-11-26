/**
 * case-directory.js: data helpers for the /c/ directory page (type, place, event date).
 * Pure functions, no I/O except the optional overrides file, so build-case-pages.js stays deterministic.
 *
 *   classify(c)   -> "ufo" | "cryptid" | "haunt" | "other"
 *   placeOf(c)    -> { code, label }   code is a US state/territory abbreviation or a country code ("" if unknown)
 *   eventOf(c)    -> { iso, label }    iso is "YYYY", "YYYY-MM" or "YYYY-MM-DD" ("" if the post gives no date)
 *
 * Anything the heuristics get wrong or miss can be pinned in scripts/case-directory-overrides.json:
 *   { "<slug>": { "kind": "ufo|cryptid|haunt|other", "place": "TX", "event": "1977-11" } }
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let OVERRIDES = {};
try { OVERRIDES = JSON.parse(fs.readFileSync(path.join(__dirname, "case-directory-overrides.json"), "utf8")); } catch { /* optional */ }

export const KINDS = { ufo: "UFOs", cryptid: "Cryptids", haunt: "Haunts", other: "Mysteries" };
const KIND_ONE = { ufo: "UFO", cryptid: "Cryptid", haunt: "Haunt", other: "Mystery" };

// ---------- type ----------
// Order: explicit hashtags on the post, then the case title and location, then the post body.
const KIND_RX = {
  ufo: /\b(ufos?|uaps?|nuforc|flying saucers?|saucers?|discs?|disks?|triangles?|triangular|orbs?|alien|aliens|abduct\w*|craft|aircraft|airliner|radar|missile|afb|air force|nuclear|roswell|rendlesham|phoenix lights|marfa lights|lights|fireballs?|starlink|extraterrestrials?|hovering|hovered|bomber|f-?51|rb-?47|mantell|kecksburg|exeter|socorro|pantex|ohare|o'hare|leo orb|glowing objects?|silver (?:oval|object)|oval|cube|sphere|rectangle|rectangular|chevron|jellyfish|teardrop|boomerang|object over|objects?)\b/i,
  cryptid: /\b(cryptids?|bigfoot|sasquatch|skunk ape|yeti|wood ?ape|nawac|mothman|champ|chessie|nessie|dogman|goatman|chupacabra|skinwalker|wendigo|thunderbird|giant birds?|lake monster|river monster|sea monster|monsters?|beast|vampire beast|bunny man|bunnyman|nightcrawler|dover demon|fouke|flatwoods|altamaha|pepie|flessie|jersey devil|werewolf|wolfman|swamp ape|hairy|biped\w*|humanoid|iceman|ape canyon|patterson|gimlin|boggy creek|creature|bladenboro|busco|turtle|yayali|gevaudan|goblin|gnome|fae|cat man|catman|batsquatch|sheepsquatch|grassman|honey island|loveland|frogman|lizard man|mogollon|sea serpent|serpent|bear lake|ogopogo|bunyip|yowie|devil monkey|black dog|hellhound|big cat|puma|wolf|furry|upright|ape-?like|missing link|manlike|long black being)\b/i,
  haunt: /\b(haunt\w*|ghosts?|poltergeist|paranormal|spirits?|apparitions?|specters?|spectres?|evp|seance|murder house|sanatorium|asylum|penitentiary|prison|mansion|plantation|lighthouse|theatre|theater|hotel|inn\b|castle|cemetery|graveyard|manor|hospital|brewery|jail|cell \d+\w*|black monk|bride|room \d+|stain on the stairs|stanley hotel|amityville|conjuring|winchester|whaley|lemp|villisca|myrtles|waverly|alcatraz)\b/i,
};
const TAG_KIND = [
  ["ufo", /^(ufo|ufos|uap|uaps|aliens?|alienabduction|ufosighting|nuforc|ufotwitter|roswell|disclosure)$/i],
  ["cryptid", /^(cryptid|cryptids|cryptozoology|bigfoot|sasquatch|woodape|nawac|mothman|dogman|goatman|chupacabra|lakemonster|skinwalker|yeti|cryptidtwitter|monster|humanoid|creature|woodapes|batsquatch|lizardman|sheepsquatch|seaserpent)$/i],
  ["haunt", /^(haunted|hauntedhistory|haunting|ghost|ghosts|ghoststories|hauntedplaces|hauntedhouse|poltergeist|evp|shadowfigure)$/i],
  ["other", /^(timetravel|timetraveler|nephilim|bible|hoax|relics|archaeology|ancientmysteries|miracle|apparition)$/i],
];
const OTHER_RX = /\b(hoax|miracle|our lady|lady of guadalupe|fatima|noah'?s ark|decalogue|mystery stone|relics?|durupinar|cardiff giant|time traveler|time-traveler|stone)\b/i;

export function classify(c) {
  const o = OVERRIDES[c.slug];
  if (o && o.kind) return o.kind;
  if (c.type === "haunted") return "haunt";
  const hay = `${c.title} ${c.location}`;
  // 1. hashtags: first matching kind in order of appearance
  for (const t of c.tags || []) for (const [k, rx] of TAG_KIND) if (rx.test(t)) return k;
  // 2. title + location; priority haunt > cryptid > ufo when names collide (a "haunted hotel" is not a UFO)
  if (OTHER_RX.test(hay) && !/\b(ufo|uap|bigfoot|ghost|haunt)/i.test(hay)) return "other";
  const hits = (rx, s) => (s.match(new RegExp(rx.source, "gi")) || []).length;
  const t = { ufo: hits(KIND_RX.ufo, hay), cryptid: hits(KIND_RX.cryptid, hay), haunt: hits(KIND_RX.haunt, hay) };
  const best = Object.entries(t).sort((a, b) => b[1] - a[1]);
  if (best[0][1] > 0 && best[0][1] > best[1][1]) return best[0][0];
  if (best[0][1] > 0 && best[0][1] === best[1][1]) { const tie = ["haunt", "cryptid", "ufo"].find((k) => t[k] === best[0][1]); if (tie) return tie; }
  // 3. body text
  const body = (c.paras || []).join(" ");
  const b = { ufo: hits(KIND_RX.ufo, body), cryptid: hits(KIND_RX.cryptid, body), haunt: hits(KIND_RX.haunt, body) };
  const bb = Object.entries(b).sort((x, y) => y[1] - x[1]);
  if (bb[0][1] > 0 && bb[0][1] > bb[1][1]) return bb[0][0];
  return "other";
}

// ---------- place ----------
const US = { AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia", FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", PR: "Puerto Rico" };
const WORLD = { GBR: ["United Kingdom", "england|scotland|wales|northern ireland|united kingdom|great britain|\\buk\\b|yorkshire|dorset|suffolk|cheshire|london|wotton|gloucestershire|somerset"], AUS: ["Australia", "australia|bass strait"], FRA: ["France", "france|g[eé]vaudan"], TUR: ["Turkey", "turkiye|turkey"], PRT: ["Portugal", "portugal"], MEX: ["Mexico", "mexico city|, mexico$|^tepeyac"], CAN: ["Canada", "canada|ontario|quebec|british columbia|alberta|manitoba|saskatchewan|nova scotia|new brunswick"], IRL: ["Ireland", "ireland"], DEU: ["Germany", "germany"], BRA: ["Brazil", "brazil"], JPN: ["Japan", "japan"], ITA: ["Italy", "italy"], ESP: ["Spain", "spain"], NZL: ["New Zealand", "new zealand"], RUS: ["Russia", "russia"], CHN: ["China", "china"], IND: ["India", "india"] };
const NAME_TO_ABBR = Object.fromEntries(Object.entries(US).map(([a, n]) => [n.toLowerCase(), a]));
// Longest names first so "West Virginia" wins over "Virginia" and "North Dakota" over "Dakota".
const NAME_RX = new RegExp(`\\b(${Object.values(US).map((n) => n.toLowerCase()).sort((a, b) => b.length - a.length).join("|")})\\b`, "i");

// Order matters: the state is almost always the LAST place word, so scan from the end.
function usState(s) {
  const str = String(s || "");
  const found = [];
  const rxName = new RegExp(NAME_RX.source, "gi");
  let m;
  while ((m = rxName.exec(str))) {
    const lower = m[1].toLowerCase();
    // "Washington" / "New York" can be a city or a county; only count them as the state when it is the last place token
    found.push({ i: m.index, code: NAME_TO_ABBR[lower] });
  }
  const rxCode = /(?:^|[\s,/(])([A-Z]{2})(?=$|[\s,/).;\u2014-])/g;
  while ((m = rxCode.exec(str))) if (US[m[1]]) found.push({ i: m.index + m[0].indexOf(m[1]), code: m[1] });
  if (!found.length) return "";
  // "Kensington / Exeter, New Hampshire", "Pantex Plant, Amarillo, TX": last mention wins, unless a trailing (YYYY) follows
  found.sort((a, b) => a.i - b.i);
  return found[found.length - 1].code;
}

export function placeOf(c) {
  const o = OVERRIDES[c.slug];
  if (o && o.place) return labelFor(o.place);
  // location field first; early cases have none, so fall back to the title ("Prim, AR", "Point Pleasant, WV, Mothman")
  for (const s of [c.location, c.title]) {
    if (!s) continue;
    for (const [code, [, rx]] of Object.entries(WORLD)) if (new RegExp(rx, "i").test(s) && !usState(s)) return labelFor(code);
    const st = usState(s);
    if (st) return labelFor(st);
  }
  return { code: "", label: "" };
}
function labelFor(code) {
  if (US[code]) return { code, label: US[code] };
  if (WORLD[code]) return { code, label: WORLD[code][0] };
  return { code, label: code };
}
export const regionName = (code) => US[code] || (WORLD[code] && WORLD[code][0]) || code;
export const isUS = (code) => !!US[code];

// ---------- event date ----------
const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const MON_RX = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\\.?";
const monIdx = (m) => MONTHS.findIndex((n) => n.startsWith(m.slice(0, 3).toLowerCase()));
const pad = (n) => String(n).padStart(2, "0");
const YEAR = "(1[5-9]\\d\\d|20[0-2]\\d)";
const NOW_YEAR = new Date().getFullYear();

function dateIn(s) {
  s = String(s || "");
  let m = s.match(new RegExp(`\\b${MON_RX}\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+${YEAR}\\b`, "i"));
  if (m) return `${m[3]}-${pad(monIdx(m[1]) + 1)}-${pad(+m[2])}`;
  m = s.match(new RegExp(`\\b(\\d{1,2})\\s+${MON_RX}\\s+${YEAR}\\b`, "i"));
  if (m) return `${m[3]}-${pad(monIdx(m[2]) + 1)}-${pad(+m[1])}`;
  m = s.match(new RegExp(`\\b${MON_RX},?\\s+${YEAR}\\b`, "i"));
  if (m) return `${m[2]}-${pad(monIdx(m[1]) + 1)}`;
  m = s.match(new RegExp(`\\b${YEAR}\\b`));
  if (m && +m[1] <= NOW_YEAR) return m[1];
  return "";
}

export function eventOf(c) {
  const o = OVERRIDES[c.slug];
  if (o && o.event) return fmtEvent(o.event);
  // 1. the title and location carry the date when the case is one dated incident ("(Oct 21, 1978)", "1952 airport saucer")
  let iso = dateIn(`${c.title} ${c.location}`);
  // 2. the opening line of the post, which is "Place. Month Year." in the standard format
  if (!iso) {
    const para = String((c.paras && c.paras[0]) || "").split("\n").slice(0, 2).join(" ").slice(0, 400);
    iso = dateIn(para);
  }
  // 3. a plain full date ("March 5, 1964") anywhere in the first paragraph, only when the post spells out month and day
  if (!iso) {
    const first = String((c.paras && c.paras[0]) || "").slice(0, 600);
    const m = first.match(new RegExp(`\\b${MON_RX}\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+${YEAR}\\b`, "i"));
    if (m) iso = `${m[3]}-${pad(monIdx(m[1]) + 1)}-${pad(+m[2])}`;
  }
  return fmtEvent(iso);
}
function fmtEvent(iso) {
  if (!iso) return { iso: "", label: "" };
  const [y, mo, d] = iso.split("-");
  const label = d ? `${MONTHS[+mo - 1][0].toUpperCase()}${MONTHS[+mo - 1].slice(1, 3)} ${+d}, ${y}` : mo ? `${MONTHS[+mo - 1][0].toUpperCase()}${MONTHS[+mo - 1].slice(1, 3)} ${y}` : y;
  return { iso, label };
}

/** Compact record for the page's inline JSON. Keys are short on purpose (222 rows ship inline). */
export function directoryRecord(c, fmtDate) {
  const kind = classify(c);
  const place = placeOf(c);
  const ev = eventOf(c);
  return {
    s: c.slug,
    t: c.title,
    k: kind,
    p: place.code,
    w: c.location || "",
    e: ev.iso,
    el: ev.label,
    d: String(c.published_at || "").slice(0, 10),
    dl: fmtDate(c.published_at),
  };
}

// ---------- page ----------
const escH = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export const DIRECTORY_CSS = `
      .cd-controls { display: grid; gap: .75rem; margin: 0 0 1rem; }
      .cd-pills { display: flex; flex-wrap: wrap; gap: .5rem; justify-content: center; }
      .cd-pill { font: inherit; font-size: .9rem; letter-spacing: .06em; text-transform: uppercase; color: #f3e9ff; background: rgba(9,0,64,.75); border: 1px solid #B13BFF; border-radius: 6px; padding: .4rem .8rem; cursor: pointer; min-height: 44px; }
      .cd-pill:hover, .cd-pill:focus-visible { box-shadow: 0 0 10px rgba(177,59,255,.8); outline: none; }
      .cd-pill[aria-pressed="true"] { background: #B13BFF; color: #090040; font-weight: bold; box-shadow: 0 0 12px rgba(177,59,255,.9); }
      .cd-pill .n { opacity: .8; font-size: .8em; margin-left: .25rem; }
      .cd-row { display: grid; grid-template-columns: 1fr; gap: .6rem; }
      @media (min-width: 40rem) { .cd-row { grid-template-columns: 2fr 1.3fr 1.3fr; } }
      .cd-field { display: grid; gap: .2rem; font-size: .75rem; letter-spacing: .08em; text-transform: uppercase; color: burlywood; }
      .cd-field input, .cd-field select { font: inherit; font-size: 1rem; letter-spacing: 0; text-transform: none; color: #f3e9ff; background: #090040; border: 1px solid #B13BFF; border-radius: 6px; padding: .5rem .6rem; min-height: 44px; width: 100%; box-sizing: border-box; }
      .cd-field input:focus, .cd-field select:focus { outline: none; box-shadow: 0 0 10px rgba(177,59,255,.8); }
      .cd-status { display: flex; flex-wrap: wrap; gap: .5rem 1rem; justify-content: space-between; align-items: baseline; color: burlywood; font-size: .9rem; }
      .cd-status button { font: inherit; color: burlywood; background: none; border: 0; text-decoration: underline; cursor: pointer; padding: .4rem 0; }
      .cd-status button[hidden] { display: none; }
      .cd-note { color: burlywood; font-size: .8rem; margin: .25rem 0 0; }
      .cd-list li { display: grid; gap: .1rem; }
      .cd-list a { font-size: 1.05rem; }
      .cd-list .meta .tag { display: inline-block; border: 1px solid currentColor; border-radius: 4px; padding: 0 .4rem; margin-right: .4rem; font-size: .72rem; letter-spacing: .08em; text-transform: uppercase; }
      .tag-ufo { color: #4DF0FF; } .tag-cryptid { color: #7CFF6B; } .tag-haunt { color: #FF6BE6; } .tag-other { color: #FFCC00; }
      .cd-empty { text-align: center; padding: 2rem 0; color: burlywood; }
`;

/** The <main> block for /c/: controls, a server-rendered list (works without JS), inline data and the filter script. */
export function directoryMain(recs) {
  const regions = {};
  for (const r of recs) if (r.p) regions[r.p] = [regionName(r.p), isUS(r.p) ? 1 : 0];
  const data = { kinds: KINDS, one: KIND_ONE, regions, cases: recs };
  const json = JSON.stringify(data).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  const byNew = [...recs].sort((a, b) => b.d.localeCompare(a.d) || b.i - a.i);
  const items = byNew.map((r) => itemHtml(r)).join("\n");
  const counts = Object.fromEntries(Object.keys(KINDS).map((k) => [k, recs.filter((r) => r.k === k).length]));
  const pills = [["", "All", recs.length], ...Object.entries(KINDS).filter(([k]) => counts[k]).map(([k, l]) => [k, l, counts[k]])]
    .map(([k, l, n]) => `<button type="button" class="cd-pill" data-type="${k}" aria-pressed="${k === "" ? "true" : "false"}">${escH(l)}<span class="n">${n}</span></button>`).join("\n                ");
  return `    <main class="case">
        <h2>All Cases</h2>
        <p class="where" id="cd-sub">${recs.length} case files, newest first</p>
        <section class="cd-controls" aria-label="Filter cases">
            <div class="cd-pills" role="group" aria-label="Case type">
                ${pills}
            </div>
            <div class="cd-row">
                <label class="cd-field">Search<input type="search" id="cd-q" placeholder="Name, place or year" autocomplete="off" enterkeyhint="search"></label>
                <label class="cd-field">Place<select id="cd-place"><option value="">All places</option></select></label>
                <label class="cd-field">Sort<select id="cd-sort">
                    <option value="new">Newest posted</option>
                    <option value="old">Oldest posted</option>
                    <option value="event">Event date, newest</option>
                    <option value="event-old">Event date, oldest</option>
                </select></label>
            </div>
            <div class="cd-status"><span id="cd-count" role="status" aria-live="polite">${recs.length} of ${recs.length} case files</span><button type="button" id="cd-clear" hidden>Clear filters</button></div>
        </section>
        <p class="cd-note" id="cd-note" hidden></p>
        <ul class="case-list cd-list" id="cd-list">
${items}
        </ul>
        <p class="cd-empty" id="cd-empty" hidden>No case files match. Try fewer filters.</p>
        <script type="application/json" id="cd-data">${json}</script>
        <script>${DIRECTORY_JS}</script>
    </main>
`;
}

export function itemHtml(r) {
  const bits = [r.w ? escH(r.w) : r.p ? escH(regionName(r.p)) : "", r.el ? `Event ${escH(r.el)}` : "", `Posted ${escH(r.dl)}`].filter(Boolean).join(" · ");
  return `            <li><a href="/c/${r.s}">${escH(r.t)}</a><div class="meta"><span class="tag tag-${r.k}">${escH(KIND_ONE[r.k])}</span>${bits}</div></li>`;
}

const DIRECTORY_JS = `
(function () {
  var D = JSON.parse(document.getElementById("cd-data").textContent);
  var C = D.cases, KINDS = D.kinds, ONE = D.one, R = D.regions;
  var $ = function (id) { return document.getElementById(id); };
  var qEl = $("cd-q"), placeEl = $("cd-place"), sortEl = $("cd-sort"), listEl = $("cd-list");
  var pills = [].slice.call(document.querySelectorAll(".cd-pill"));
  var TYPE_ALIAS = { ufo: "ufo", ufos: "ufo", uap: "ufo", uaps: "ufo", cryptid: "cryptid", cryptids: "cryptid", haunt: "haunt", haunts: "haunt", haunted: "haunt", ghost: "haunt", ghosts: "haunt", other: "other", mystery: "other", mysteries: "other" };
  var SORTS = { "new": 1, old: 1, event: 1, "event-old": 1 };
  var fold = function (s) { return String(s || "").normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase(); };
  C.forEach(function (c) { c.h = fold([c.t, c.w, c.p && R[c.p] ? R[c.p][0] : "", c.p, KINDS[c.k], c.el, c.e, c.dl].join(" ")); });

  // place picker: United States first, then international, each alphabetical, with counts
  var placeCount = {};
  C.forEach(function (c) { if (c.p) placeCount[c.p] = (placeCount[c.p] || 0) + 1; });
  [["United States", 1], ["International", 0]].forEach(function (g) {
    var codes = Object.keys(R).filter(function (k) { return R[k][1] === g[1]; }).sort(function (a, b) { return R[a][0].localeCompare(R[b][0]); });
    if (!codes.length) return;
    var og = document.createElement("optgroup"); og.label = g[0];
    codes.forEach(function (k) { var o = document.createElement("option"); o.value = k; o.textContent = R[k][0] + " (" + placeCount[k] + ")"; og.appendChild(o); });
    placeEl.appendChild(og);
  });

  var st = { type: "", state: "", q: "", sort: "new" };
  function readUrl() {
    var p = new URLSearchParams(location.search);
    st.type = TYPE_ALIAS[(p.get("type") || "").toLowerCase()] || "";
    var s = (p.get("state") || "").toUpperCase();
    st.state = R[s] ? s : "";
    st.q = (p.get("q") || "").slice(0, 80);
    var so = (p.get("sort") || "").toLowerCase();
    st.sort = SORTS[so] ? so : "new";
  }
  function writeUrl() {
    var p = new URLSearchParams();
    if (st.type) p.set("type", st.type);
    if (st.state) p.set("state", st.state);
    if (st.q) p.set("q", st.q);
    if (st.sort !== "new") p.set("sort", st.sort);
    var qs = p.toString();
    try { history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "")); } catch (e) {}
  }
  function key(c) { var e = c.e; return !e ? "" : e.length === 4 ? e + "-00-00" : e.length === 7 ? e + "-00" : e; }
  function sorter() {
    var s = st.sort;
    if (s === "old") return function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : a.i - b.i; };
    if (s === "event" || s === "event-old") {
      var dir = s === "event" ? -1 : 1;
      return function (a, b) {
        var ka = key(a), kb = key(b);
        if (!ka !== !kb) return ka ? -1 : 1;                    // undated always last
        if (ka !== kb) return (ka < kb ? -1 : 1) * dir;
        return b.i - a.i;
      };
    }
    return function (a, b) { return a.d < b.d ? 1 : a.d > b.d ? -1 : b.i - a.i; };
  }
  var terms = [];
  function textOk(c) { for (var i = 0; i < terms.length; i++) if (c.h.indexOf(terms[i]) < 0) return false; return true; }
  function make(c) {
    var li = document.createElement("li");
    var a = document.createElement("a"); a.href = "/c/" + c.s; a.textContent = c.t; li.appendChild(a);
    var m = document.createElement("div"); m.className = "meta";
    var tag = document.createElement("span"); tag.className = "tag tag-" + c.k; tag.textContent = ONE[c.k]; m.appendChild(tag);
    var where = c.w || (c.p && R[c.p] ? R[c.p][0] : "");
    m.appendChild(document.createTextNode([where, c.el ? "Event " + c.el : "", "Posted " + c.dl].filter(Boolean).join(" \\u00b7 ")));
    li.appendChild(m);
    return li;
  }
  function render() {
    terms = fold(st.q).split(/\\s+/).filter(Boolean);
    var base = C.filter(function (c) { return (!st.state || c.p === st.state) && textOk(c); });   // faceted counts ignore the type filter
    var rows = base.filter(function (c) { return !st.type || c.k === st.type; }).sort(sorter());
    var frag = document.createDocumentFragment();
    rows.forEach(function (c) { frag.appendChild(make(c)); });
    listEl.textContent = ""; listEl.appendChild(frag);
    $("cd-empty").hidden = rows.length > 0;
    pills.forEach(function (b) {
      var t = b.getAttribute("data-type");
      b.setAttribute("aria-pressed", String(t === st.type));
      b.querySelector(".n").textContent = t ? base.filter(function (c) { return c.k === t; }).length : base.length;
    });
    var filtered = st.type || st.state || terms.length;
    $("cd-count").textContent = rows.length + (filtered ? " of " + C.length : "") + " case file" + (rows.length === 1 ? "" : "s");
    $("cd-clear").hidden = !(filtered || st.sort !== "new");
    var label = { "new": "newest first", old: "oldest first", event: "by event date, newest first", "event-old": "by event date, oldest first" }[st.sort];
    $("cd-sub").textContent = (filtered ? "Filtered case files, " : C.length + " case files, ") + label;
    var note = $("cd-note"), undated = (st.sort === "event" || st.sort === "event-old") ? rows.filter(function (c) { return !c.e; }).length : 0;
    note.hidden = !undated;
    if (undated) note.textContent = undated + " of these " + (undated === 1 ? "has" : "have") + " no event date in the post and " + (undated === 1 ? "is" : "are") + " listed last.";
    placeEl.value = st.state; sortEl.value = st.sort;
    if (qEl.value !== st.q) qEl.value = st.q;
  }
  function update() { writeUrl(); render(); }
  pills.forEach(function (b) { b.addEventListener("click", function () { st.type = b.getAttribute("data-type"); update(); }); });
  placeEl.addEventListener("change", function () { st.state = placeEl.value; update(); });
  sortEl.addEventListener("change", function () { st.sort = sortEl.value; update(); });
  var timer;
  qEl.addEventListener("input", function () { st.q = qEl.value.trim(); clearTimeout(timer); timer = setTimeout(update, 120); });
  $("cd-clear").addEventListener("click", function () { st = { type: "", state: "", q: "", sort: "new" }; qEl.value = ""; update(); });
  readUrl(); qEl.value = st.q; render(); writeUrl();
})();
`;

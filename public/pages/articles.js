(function () {
  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function safeUrl(u) {
    u = String(u || "").trim();
    if (!/^https:\/\/(x|twitter)\.com\//i.test(u)) return "";
    try {
      var x = new URL(u);
      return x.protocol === "https:" ? x.href : "";
    } catch (e) {
      return "";
    }
  }

  function card(a) {
    var url = safeUrl(a.article_url);
    var title = esc(a.title || "Untitled case file");
    var date = esc(a.display_date || a.date || "");
    var week = a.week ? esc(a.week) : "";
    var teaser = esc(a.teaser || "");
    var alt = esc(a.cover_alt || a.title || "");
    var cover = String(a.cover || "").trim();
    // Only allow same-directory-relative image paths we generate.
    if (!/^\.\.\/images\/articles\/[A-Za-z0-9._-]+\.jpe?g$/i.test(cover)) cover = "";
    var media = cover
      ? '<a class="cover-wrap" href="' + esc(url) + '" target="_blank" rel="noopener">' +
        '<img src="' + esc(cover) + '" alt="' + alt + '" loading="lazy"></a>'
      : "";
    var cta = url
      ? '<a class="cta" href="' + esc(url) + '" target="_blank" rel="noopener">Read the Article on X</a>'
      : "";
    return (
      '<article class="article-card">' +
      media +
      '<div class="body">' +
      (date || week ? '<div class="meta">' + date + (week ? " &middot; " + week : "") + "</div>" : "") +
      "<h3>" + (url ? '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + title + "</a>" : title) + "</h3>" +
      (teaser ? '<p class="teaser">' + teaser + "</p>" : "") +
      cta +
      "</div></article>"
    );
  }

  var list = document.getElementById("article-list");
  if (!list) return;
  var emptyMsg = "No Case File Articles yet. Catch them first on X (@TheBlurryReport).";
  fetch("./articles.json", { cache: "no-cache" })
    .then(function (r) {
      if (!r.ok) throw new Error("bad status");
      return r.json();
    })
    .then(function (data) {
      var items = (data && Array.isArray(data.articles) ? data.articles : []).filter(function (a) {
        return a && (a.title || a.article_url);
      });
      items.sort(function (a, b) {
        var da = String(a.date || "");
        var db = String(b.date || "");
        return da < db ? 1 : da > db ? -1 : 0;
      });
      if (!items.length) {
        list.innerHTML = '<p class="empty">' + emptyMsg + "</p>";
        return;
      }
      list.innerHTML = items.map(card).join("");
    })
    .catch(function () {
      list.innerHTML =
        '<p class="empty">The case files could not be loaded. You can also read them on <a href="https://x.com/TheBlurryReport">X (@TheBlurryReport)</a>.</p>';
    });
})();

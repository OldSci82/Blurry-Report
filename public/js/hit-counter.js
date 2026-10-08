/*
 * Blurry Report retro hit counter
 * --------------------------------
 * Tiny, dependency-free visitor counter backed by Abacus
 * (https://abacus.jasoncameron.dev): free, no account, no secrets, CORS-enabled.
 *
 * Markup (one or more per page):
 *   <div class="hit-counter" data-hit-counter data-key="homepage">
 *     <span class="hit-counter__label">Witnesses logged</span>
 *     <span class="hit-counter__digits" data-hit-counter-digits></span>
 *   </div>
 *
 * Behaviour:
 *   - Counts once per browser session (sessionStorage). Later page views in the
 *     same tab session only READ the value (/get), they don't increment (/hit).
 *   - Only the real site (blurryreport.com) uses the production namespace.
 *     localhost / file:// / previews use the TEST namespace automatically,
 *     so local testing never inflates the real number.
 *   - If the API is slow or down, the digits stay as "-------" and the footer
 *     keeps working.
 */
(function () {
  "use strict";

  var API_BASE = "https://abacus.jasoncameron.dev";

  // >>> PRODUCTION counter namespace. Only used on the hosts listed below. <<<
  var PROD_NAMESPACE = "blurryreport-com";
  var PROD_HOSTS = ["blurryreport.com", "www.blurryreport.com"];

  // Used everywhere else (localhost, 127.0.0.1, file://, forks, previews).
  var TEST_NAMESPACE = "blurryreport-com-test";

  var DEFAULT_KEY = "homepage";
  var MIN_DIGITS = 7;
  var TIMEOUT_MS = 5000;
  var PLACEHOLDER_CHAR = "-";

  function pickNamespace() {
    var host = (window.location && window.location.hostname || "").toLowerCase();
    // ?hitcounter=test forces the test namespace even on the live site.
    var forceTest = /[?&]hitcounter=test\b/.test(window.location.search || "");
    return !forceTest && PROD_HOSTS.indexOf(host) !== -1 ? PROD_NAMESPACE : TEST_NAMESPACE;
  }

  // sessionStorage can throw (privacy modes, disabled storage) – never let it break the page.
  function storageGet(k) {
    try { return window.sessionStorage.getItem(k); } catch (e) { return null; }
  }
  function storageSet(k, v) {
    try { window.sessionStorage.setItem(k, v); } catch (e) { /* ignore */ }
  }

  function fetchJSON(url) {
    var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = setTimeout(function () { if (controller) controller.abort(); }, TIMEOUT_MS);
    return fetch(url, { signal: controller ? controller.signal : undefined, cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!data || typeof data.value !== "number" || data.value < 0) throw new Error("Bad payload");
        return data.value;
      })
      .finally(function () { clearTimeout(timer); });
  }

  function render(digitsEl, text, animate) {
    digitsEl.textContent = "";
    for (var i = 0; i < text.length; i++) {
      var cell = document.createElement("span");
      cell.className = "hit-counter__digit";
      cell.setAttribute("aria-hidden", "true");
      cell.textContent = text.charAt(i);
      if (animate) cell.style.animationDelay = (i * 60) + "ms";
      digitsEl.appendChild(cell);
    }
    if (animate) digitsEl.classList.add("is-rolling");
  }

  function initCounter(el) {
    var digitsEl = el.querySelector("[data-hit-counter-digits]") || el;
    var key = el.getAttribute("data-key") || DEFAULT_KEY;
    var minDigits = parseInt(el.getAttribute("data-digits"), 10) || MIN_DIGITS;
    var namespace = pickNamespace();
    var placeholder = new Array(minDigits + 1).join(PLACEHOLDER_CHAR);

    render(digitsEl, placeholder, false);
    el.setAttribute("aria-busy", "true");

    var sessionFlag = "br-hit-counter:" + namespace + ":" + key;
    var alreadyCounted = storageGet(sessionFlag) === "1";
    var action = alreadyCounted ? "get" : "hit";
    var url = API_BASE + "/" + action + "/" + encodeURIComponent(namespace) + "/" + encodeURIComponent(key);

    fetchJSON(url)
      .then(function (value) {
        if (action === "hit") storageSet(sessionFlag, "1");
        var text = String(value);
        while (text.length < minDigits) text = "0" + text;
        render(digitsEl, text, true);
        el.classList.add("is-live");
        el.setAttribute("title", value.toLocaleString() + " witnesses and counting");
        var sr = el.querySelector(".hit-counter__sr");
        if (sr) sr.textContent = value.toLocaleString();
      })
      .catch(function () {
        // Fail quietly: keep the dashes, mark as offline.
        el.classList.add("is-offline");
        el.setAttribute("title", "Signal lost – counter offline");
      })
      .finally(function () {
        el.removeAttribute("aria-busy");
      });
  }

  function initAll() {
    if (typeof fetch !== "function") return; // ancient browser: leave placeholder markup
    var nodes = document.querySelectorAll("[data-hit-counter]");
    for (var i = 0; i < nodes.length; i++) initCounter(nodes[i]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();

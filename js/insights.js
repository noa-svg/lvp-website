/* Insights: filters, search over titles, episode transcripts and article text, "Show more".
   Without JS the page stays the fixed-position list it was. */
(function () {
  "use strict";
  var main = document.getElementById("main"), list = document.querySelector(".ins-list");
  if (!main || !list) return;
  var items = Array.prototype.slice.call(list.children);
  var PAGE = 8, st = { type: "all", lang: "", q: "", shown: PAGE }, TX = null;
  var ALIAS = { apollo: ["אפולו"], amazon: ["אמזון"], netflix: ["נטפליקס"], nvidia: ["אנבידיה", "אנדיה", "נבידיה"], google: ["גוגל"], meta: ["מטא"], kkr: ["קקר"], apple: ["אפל"], microsoft: ["מיקרוסופט"], tesla: ["טסלה"], salesforce: ["סיילספורס"], disney: ["דיסני"], bazan: ["בזן"], gaon: ["גאון"] };

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function rx(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function fmt(s) { var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(x).padStart(2, "0"); }

  /* Card set-up: media on top, buttons in one row, plain text kept for search and highlight. */
  items.forEach(function (li) {
    var acts = document.createElement("div"); acts.className = "ins-acts";
    Array.prototype.slice.call(li.children).forEach(function (c) { if (c.tagName === "A") acts.appendChild(c); });
    li.appendChild(acts);
    var d = li.dataset, media;
    if (d.thumb) {
      media = document.createElement("a");
      var first = acts.querySelector("a");
      media.className = "ins-media"; media.target = "_blank"; media.rel = "noopener";
      media.href = d.yt ? "https://www.youtube.com/watch?v=" + d.yt : (first ? first.href : "#");
      if (d.yt) media.setAttribute("aria-label", "Watch on YouTube");
      media.innerHTML = '<img src="' + d.thumb + '" alt="" loading="lazy">';
    } else {
      media = document.createElement("div"); media.className = "ins-media";
      media.innerHTML = '<div class="ins-tile"><span class="nm f9">' + esc(d.tile || "") + '</span><span class="bar" aria-hidden="true"></span><span class="ev f9">' + esc(d.event || "") + '</span></div>';
    }
    /* Cut-out layer: the missile flies off, a person or object lifts toward you (depth). */
    if (d.fx && d.fxSrc && media.querySelector("img")) {
      media.classList.add("fx-" + d.fx);
      media.insertAdjacentHTML("beforeend", '<span class="fxw" aria-hidden="true"><span class="fx"><img src="' + d.fxSrc + '" alt="">' + (d.fx === "launch" ? '<i class="flame"></i>' : "") + '</span></span>');
      if (d.fxO) media.style.setProperty("--fx-o", d.fxO);
    }
    if (d.credit && media.querySelector("img")) media.setAttribute("data-credit", d.credit);
    var im = media.querySelector("img");
    if (im) {
      im.addEventListener("load", function () { if (im.naturalWidth / im.naturalHeight < 1.1) im.classList.add("sq"); });
      im.addEventListener("error", function () { if (!im.dataset.retry) { im.dataset.retry = "1"; im.src = d.thumb + "?r=1"; } });
    }
    li.insertBefore(media, li.firstChild);
    ["it", "isrc", "ib"].forEach(function (k) { var el = li.querySelector("." + k); if (el) el.dataset.html = el.innerHTML; });
    li._meta = (li.textContent || "").replace(/\s+/g, " ").toLowerCase();
  });

  /* Hover pop: the picture zooms a touch and drifts with the cursor. */
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    list.addEventListener("mousemove", function (e) {
      var m = e.target.closest(".ins-media"); if (!m || !m.querySelector("img")) return;
      var r = m.getBoundingClientRect();
      m.style.setProperty("--px", ((e.clientX - r.left) / r.width - .5).toFixed(3));
      m.style.setProperty("--py", ((e.clientY - r.top) / r.height - .5).toFixed(3));
      m.classList.add("pop");
    });
    list.addEventListener("mouseout", function (e) {
      var m = e.target.closest(".ins-media"); if (m && !m.contains(e.relatedTarget)) m.classList.remove("pop");
    });
  }

  /* Tools row, in the site's own pieces: an underlined field and outline pills. */
  var tools = document.createElement("div"); tools.className = "ins-tools";
  var chipsHtml = [["type", "all", "ALL"], ["type", "article", "ARTICLES"], ["type", "podcast", "PODCASTS"], ["type", "talk", "TALKS"], ["lang", "he", "HEBREW"], ["lang", "en", "ENGLISH"]]
    .map(function (c, i) { return '<button type="button" class="btn-o f5 ins-chip' + (i === 4 ? " gap" : "") + '" data-k="' + c[0] + '" data-v="' + c[1] + '">' + c[2] + '</button>'; }).join("");
  tools.innerHTML = '<div class="ins-q"><label class="sr-only" for="ins-q">Search</label><input class="fld f5" id="ins-q" type="text" dir="auto" placeholder="SEARCH" autocomplete="off" spellcheck="false"><button class="x" type="button" aria-label="Clear search" hidden>×</button></div>' +
    '<div class="ins-chips" role="group" aria-label="Filter">' + chipsHtml + '</div><p class="isrc f7 ins-count" role="status" aria-live="polite"></p>';
  list.parentNode.insertBefore(tools, list);
  var more = document.createElement("button"); more.type = "button"; more.className = "btn-o lg f5 ins-show"; more.textContent = "SHOW MORE";
  var none = document.createElement("p"); none.className = "isrc f7 ins-none"; none.textContent = "NO RESULTS"; none.hidden = true;
  list.parentNode.insertBefore(none, list.nextSibling); list.parentNode.insertBefore(more, list.nextSibling);
  main.classList.add("ins-flow");

  var q = tools.querySelector("#ins-q"), clr = tools.querySelector(".x"), count = tools.querySelector(".ins-count");
  function terms() { return st.q.toLowerCase().split(/\s+/).filter(Boolean).map(function (w) { return [w].concat(ALIAS[w] || []); }); }
  function has(text, T) { var t = text.toLowerCase(); return T.every(function (f) { return f.some(function (x) { return t.indexOf(x) >= 0; }); }); }
  function mark(html, forms) { if (!forms.length) return html; return html.replace(/(<[^>]+>)|([^<]+)/g, function (m, tag, txt) { return tag || txt.replace(new RegExp("(" + forms.map(rx).join("|") + ")", "ig"), "<mark>$1</mark>"); }); }

  function render() {
    var T = terms(), forms = [].concat.apply([], T), filtering = st.type !== "all" || st.lang || T.length, shown = [], moments = 0;
    var ranked = items.map(function (li) {
      var d = li.dataset, ok = (st.type === "all" || d.type === st.type) && (!st.lang || d.lang === st.lang), hits = [], meta = false;
      if (ok && T.length) {
        meta = has(li._meta, T);
        var segs = TX && ((d.yt && TX[d.yt]) || (d.art && TX[d.art]));
        if (segs) segs.forEach(function (s, i) {
          var w = s[0] < 0 ? s[1] : s[1] + " " + (segs[i + 1] ? segs[i + 1][1] : "");
          if (has(w, T) && !(hits.length && i - hits[hits.length - 1].i < 2)) hits.push({ i: i, t: s[0], text: w });
        });
        ok = meta || hits.length > 0;
      }
      return { li: li, ok: ok, hits: hits, score: (meta ? 1000 : 0) + hits.length };
    });
    if (T.length) ranked.sort(function (a, b) { return b.score - a.score; });
    ranked.forEach(function (r) { list.appendChild(r.li); });
    var matches = ranked.filter(function (r) { return r.ok; });
    var visible = filtering ? matches : matches.slice(0, st.shown);
    ranked.forEach(function (r) {
      var li = r.li, on = visible.indexOf(r) >= 0;
      li.hidden = !on;
      ["it", "isrc", "ib"].forEach(function (k) { var el = li.querySelector("." + k); if (el) el.innerHTML = mark(el.dataset.html, forms); });
      var box = li.querySelector(".ins-moments"); if (box) box.remove();
      var plus = li.querySelector(".ins-plus"); if (plus) plus.remove();
      if (on && r.hits.length) {
        moments += r.hits.length;
        box = document.createElement("div"); box.className = "ins-moments";
        var artHref = (li.querySelector(".ins-acts a") || {}).href || "#";
        box.innerHTML = r.hits.slice(0, 3).map(function (h) {
          var words = h.text.split(/\s+/), at = 0;
          for (var k = 0; k < words.length; k++) { if (forms.some(function (f) { return words[k].toLowerCase().indexOf(f) >= 0; })) { at = k; break; } }
          var a = Math.max(0, at - 10), snip = (a > 0 ? "… " : "") + words.slice(a, a + 24).join(" ") + (a + 24 < words.length ? " …" : "");
          var href = h.t < 0 ? artHref : "https://www.youtube.com/watch?v=" + li.dataset.yt + "&t=" + h.t + "s";
          return '<a class="ins-m' + (h.t < 0 ? ' art' : '') + '" href="' + href + '" target="_blank" rel="noopener">' + (h.t < 0 ? '' : '<span class="btn-o f5 ts">' + fmt(h.t) + '</span>') + '<span class="q f5">' + mark(esc(snip), forms) + '</span></a>';
        }).join("");
        li.querySelector(".ins-acts").before(box);
        if (r.hits.length > 3) { plus = document.createElement("p"); plus.className = "more f7 ins-plus"; plus.textContent = "+" + (r.hits.length - 3) + (li.dataset.art ? " MORE IN THIS ARTICLE" : " MORE IN THIS EPISODE"); box.after(plus); }
      }
      if (on) shown.push(li);
    });
    more.hidden = filtering || st.shown >= matches.length;
    none.hidden = matches.length > 0;
    count.textContent = filtering && matches.length ? matches.length + (matches.length === 1 ? " RESULT" : " RESULTS") : "";
    tools.querySelectorAll(".ins-chip").forEach(function (c) { var on = c.dataset.k === "type" ? st.type === c.dataset.v : st.lang === c.dataset.v; c.setAttribute("aria-pressed", on ? "true" : "false"); });
    clr.hidden = !st.q;
  }

  tools.querySelector(".ins-chips").addEventListener("click", function (e) {
    var c = e.target.closest(".ins-chip"); if (!c) return;
    if (c.dataset.k === "type") { st.type = c.dataset.v; if (c.dataset.v === "all") st.lang = ""; } else { st.lang = st.lang === c.dataset.v ? "" : c.dataset.v; }
    render();
  });
  var t0; q.addEventListener("input", function () { loadTx(); clearTimeout(t0); t0 = setTimeout(function () { st.q = q.value.trim(); render(); }, 120); });
  clr.addEventListener("click", function () { q.value = ""; st.q = ""; render(); q.focus(); });
  more.addEventListener("click", function () { st.shown += PAGE; render(); });
  var loading = false;
  function loadTx() { if (TX || loading) return; loading = true; fetch("/insights/transcripts.json").then(function (r) { return r.json(); }).then(function (j) { TX = j; if (st.q) render(); }).catch(function () { loading = false; }); }
  q.addEventListener("focus", loadTx);
  render();
})();

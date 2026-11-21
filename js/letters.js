/* Renders /letters/letters.json. Access is checked in the page head too. */
(function () {
  "use strict";
  try { if (sessionStorage.getItem("lvpLettersAccess") !== "1") { location.replace("/investor-letters/"); return; } }
  catch (x) { location.replace("/investor-letters/"); return; }
  var root = document.getElementById("letters-list");
  /* Desktop column pitch and centre offset per number of letters in a year (measured on the live page). */
  var PITCH = { 1: 300, 2: 290, 3: 313.5, 4: 245 };
  var SHIFT = { 1: 0, 2: 4, 3: -2.5, 4: 4 };
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  fetch("/letters/letters.json").then(function (r) { if (!r.ok) throw new Error("load"); return r.json(); }).then(function (letters) {
    var years = [];
    letters.forEach(function (l) { var y = years.find(function (g) { return g.year === l.year; }); if (!y) { y = { year: l.year, items: [] }; years.push(y); } y.items.push(l); });
    years.forEach(function (g) {
      var n = g.items.length, lang = g.items.some(function (l) { return l.language; });
      var sec = el("section", "l-year " + (lang ? "n3" : "n2"));
      sec.setAttribute("aria-labelledby", "y" + g.year);
      var h = el("h2", "f9", String(g.year)); h.id = "y" + g.year; sec.appendChild(h);
      sec.appendChild(el("div", "l-rule"));
      var row = el("ul", "l-row" + (lang ? "" : " stack"));
      row.style.transform = "translateX(var(--lshift," + SHIFT[n] + "px))";
      g.items.forEach(function (l, i) {
        var li = el("li", "l-item");
        if (lang && n % 2 === 1 && i === n - 1) li.classList.add("solo");
        li.style.width = PITCH[n] + "px";
        var t = el("h3", "f9");
        t.appendChild(document.createTextNode(l.period)); t.appendChild(el("br"));
        t.appendChild(document.createTextNode(l.title));
        if (l.language) { t.appendChild(el("br")); t.appendChild(document.createTextNode("(" + l.language + ")")); }
        li.appendChild(t);
        var a = el("a", "l-dl f5", "DOWNLOAD");
        a.href = l.pdf; a.target = "_blank"; a.rel = "noopener";
        a.setAttribute("aria-label", "DOWNLOAD " + l.period + " " + l.title + (l.language ? " (" + l.language + ")" : "") + " (PDF)");
        li.appendChild(a);
        row.appendChild(li);
      });
      sec.appendChild(row);
      root.appendChild(sec);
    });
  }).catch(function () {
    var p = el("p", "f5", "Letters are unavailable right now. Email ");
    var a = el("a", null, "info@legacyvpartners.com"); a.href = "mailto:info@legacyvpartners.com";
    p.appendChild(a); p.appendChild(document.createTextNode("."));
    p.style.textAlign = "center"; p.style.padding = "40px 16px";
    root.appendChild(p);
  });
})();

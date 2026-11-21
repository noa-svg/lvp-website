/* Accessibility menu: larger page, high contrast, underlined links, reset. Choices are remembered. */
(function () {
  "use strict";
  var root = document.documentElement, KEY = "lvpA11y";
  var st = { zoom: 0, hc: false, ul: false };
  var ZOOM = [1, 1.1, 1.2, 1.35];
  try { var s = JSON.parse(localStorage.getItem(KEY) || "null"); if (s) st = { zoom: s.zoom | 0, hc: !!s.hc, ul: !!s.ul }; } catch (e) {}
  function narrow() { return window.innerWidth < 768; }
  function apply() {
    root.style.zoom = !narrow() && st.zoom ? ZOOM[st.zoom] : "";
    root.classList.toggle("a11y-hc", st.hc);
    root.classList.toggle("a11y-ul", st.ul);
    if (ui) { ui.hc.setAttribute("aria-pressed", st.hc); ui.ul.setAttribute("aria-pressed", st.ul); ui.zoomRow.hidden = narrow(); }
    try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {}
  }
  var ui = null;
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
  function btn(label, fn) { var b = el("button", "a11y-b", label); b.type = "button"; b.addEventListener("click", fn); return b; }
  function build() {
    var wrap = el("div", "a11y");
    var tog = el("button", "a11y-t"); tog.type = "button"; tog.setAttribute("aria-label", "Accessibility menu"); tog.setAttribute("aria-expanded", "false"); tog.setAttribute("aria-controls", "a11y-panel");
    tog.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="4.5" r="2" fill="currentColor"/><path d="M5 8.5l7 1.5 7-1.5M12 10v5m0 0l-3 6m3-6l3 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var panel = el("div", "a11y-p"); panel.id = "a11y-panel"; panel.hidden = true; panel.setAttribute("role", "group"); panel.setAttribute("aria-label", "Accessibility menu");
    var zoomRow = el("div", "a11y-r");
    zoomRow.appendChild(btn("Larger", function () { st.zoom = Math.min(ZOOM.length - 1, st.zoom + 1); apply(); }));
    zoomRow.appendChild(btn("Smaller", function () { st.zoom = Math.max(0, st.zoom - 1); apply(); }));
    var hc = btn("High contrast", function () { st.hc = !st.hc; apply(); });
    var ul = btn("Underline links", function () { st.ul = !st.ul; apply(); });
    var rs = btn("Reset", function () { st = { zoom: 0, hc: false, ul: false }; apply(); });
    panel.appendChild(zoomRow); panel.appendChild(hc); panel.appendChild(ul); panel.appendChild(rs);
    var more = el("a", "a11y-l", "Accessibility statement"); more.href = "/accessibility-statement/"; panel.appendChild(more);
    function setOpen(o) { panel.hidden = !o; tog.setAttribute("aria-expanded", o ? "true" : "false"); }
    tog.addEventListener("click", function () { setOpen(panel.hidden); });
    wrap.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) { setOpen(false); tog.focus(); } });
    wrap.appendChild(panel); wrap.appendChild(tog); document.body.appendChild(wrap);
    ui = { hc: hc, ul: ul, zoomRow: zoomRow };
    window.addEventListener("resize", apply);
    apply();
  }
  if (document.body) build(); else document.addEventListener("DOMContentLoaded", build);
})();

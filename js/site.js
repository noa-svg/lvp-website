/* Legacy Value Partners - shared behaviour (menu, contact form, font switch). */
/* Where both forms POST. Leave empty until the backend exists; with an empty
   value the contact form shows the "write to us directly" message. */
var FORM_ENDPOINT = "https://site-forms-717035109771.us-central1.run.app/submit";

(function () {
  "use strict";
  var doc = document.documentElement;

  /* Tablets (768 to 979px) get the 980px desktop canvas scaled to fit, not a sideways scroll. */
  if (window.innerWidth >= 768 && window.innerWidth < 980) {
    var vp = document.querySelector('meta[name="viewport"]');
    if (vp) vp.setAttribute("content", "width=980");
  }

  /* Figtree-only tracking tweaks are removed once a Museo Sans face loads. */
  if (document.fonts && document.fonts.ready) {
    var museoCheck = function () {
      var museo = false;
      document.fonts.forEach(function (f) { if (/Museo Sans/.test(f.family) && f.status === "loaded") museo = true; });
      if (museo) doc.classList.remove("ff-figtree");
    };
    document.fonts.ready.then(museoCheck);
    if (document.fonts.addEventListener) document.fonts.addEventListener("loadingdone", museoCheck);
  }

  /* ---- Mobile menu ---- */
  var burger = document.querySelector(".burger");
  var menu = document.getElementById("mmenu");
  if (burger && menu) {
    var panel = menu.querySelector(".panel");
    var focusables = function () { return panel.querySelectorAll("a[href],button"); };
    var open = function () {
      menu.hidden = false;
      burger.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      requestAnimationFrame(function () {
        menu.classList.add("open");
        var f = panel.querySelectorAll("nav a[href]"); if (f.length) f[0].focus();
      });
    };
    var close = function (returnFocus) {
      menu.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      setTimeout(function () { menu.hidden = true; }, 260);
      if (returnFocus !== false) burger.focus();
    };
    burger.addEventListener("click", open);
    menu.querySelector(".close").addEventListener("click", function () { close(); });
    menu.querySelector(".scrim").addEventListener("click", function () { close(); });
    menu.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { close(); return; }
      if (e.key === "Tab") {
        var f = focusables(), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    panel.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { close(false); }); });
    window.matchMedia("(min-width: 768px)").addEventListener("change", function (m) { if (m.matches && !menu.hidden) close(false); });
  }

  /* ---- Shared helpers ---- */
  window.LVP = window.LVP || {};
  LVP.endpoint = function () { return FORM_ENDPOINT; };
  LVP.post = function (payload) {
    if (!FORM_ENDPOINT) return Promise.reject(new Error("no endpoint"));
    return fetch(FORM_ENDPOINT, {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok || !j || j.ok !== true) throw new Error("not ok");
        return j;
      });
    });
  };
  LVP.validate = function (form) {
    var bad = null;
    form.querySelectorAll("input:not([type=hidden]):not([name=website]),textarea").forEach(function (el) {
      var v = el.validity ? el.validity.valid : true;
      if (el.type !== "radio" && el.type !== "checkbox") el.setAttribute("aria-invalid", v ? "false" : "true");
      if (!v && !bad) bad = el;
    });
    return bad;
  };

  /* ---- Contact form ---- */
  var SUCCESS = "Thank you. We received your message and will get back to you shortly.";
  var FAIL_HTML = 'Your message could not be sent. Please email us directly at <a href="mailto:info@legacyvpartners.com">info@legacyvpartners.com</a>.';
  document.querySelectorAll("form.lvp-contact").forEach(function (form) {
    var status = form.querySelector(".fstatus");
    var btn = form.querySelector("button[type=submit]");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.classList.remove("err");
      status.textContent = "";
      var bad = LVP.validate(form);
      if (bad) { bad.focus(); return; }
      var payload = {
        form: "contact",
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        message: form.elements.message.value.trim(),
        page: location.pathname,
        website: form.elements.website.value
      };
      btn.disabled = true;
      LVP.post(payload).then(function () {
        status.textContent = SUCCESS;
        form.reset();
      }).catch(function () {
        status.classList.add("err");
        status.innerHTML = FAIL_HTML;
      }).then(function () { btn.disabled = false; });
    });
  });
})();

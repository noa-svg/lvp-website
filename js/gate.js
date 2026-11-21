/* Qualified-investor gate on /investor-letters/. */
(function () {
  "use strict";
  var form = document.querySelector("form.lvp-gate");
  if (!form) return;
  var err = form.querySelector(".g-err");
  /* Back from the letters (Safari keeps the page in memory): the button works again. */
  window.addEventListener("pageshow", function () { var b = form.querySelector("button[type=submit]"); if (b) b.disabled = false; });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    err.textContent = "";
    var bad = LVP.validate(form);
    if (bad) {
      if (bad.type === "radio" || bad.type === "checkbox") {
        var msg = bad.validationMessage || "";
        err.textContent = msg;
      }
      bad.focus();
      return;
    }
    var cat = form.querySelector("input[name=investorCategory]:checked");
    var payload = {
      form: "letters_access",
      investorCategory: cat ? cat.value : "",
      fullName: form.elements.fullName.value.trim(),
      email: form.elements.email.value.trim(),
      acknowledged: true,
      page: location.pathname,
      website: form.elements.website.value
    };
    /* Access never depends on the endpoint, but leaving the page cancels the request:
       wait for the answer (at most 4 seconds), then go to the letters either way. */
    try { sessionStorage.setItem("lvpLettersAccess", "1"); } catch (x) {}
    var gone = false;
    var go = function () { if (gone) return; gone = true; location.href = "/letters/"; };
    var btn = form.querySelector("button[type=submit]");
    if (btn) btn.disabled = true;
    setTimeout(go, 4000);
    try { LVP.post(payload).then(go, go); } catch (x) { go(); }
  });
})();

/* Qualified-investor gate on /investor-letters/. */
(function () {
  "use strict";
  var form = document.querySelector("form.lvp-gate");
  if (!form) return;
  var err = form.querySelector(".g-err");
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
    /* Fire and forget: access does not depend on the endpoint. */
    try { LVP.post(payload).catch(function () {}); } catch (x) {}
    try { sessionStorage.setItem("lvpLettersAccess", "1"); } catch (x) {}
    location.href = "/letters/";
  });
})();

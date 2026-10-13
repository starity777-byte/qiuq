(function () {
  var KEY = "qiuq-theme";

  function readNight() {
    try {
      return localStorage.getItem(KEY) === "night";
    } catch (err) {
      return false;
    }
  }

  function persist(night) {
    try {
      localStorage.setItem(KEY, night ? "night" : "light");
    } catch (err) {}
  }

  function apply(night) {
    document.body.classList.toggle("glass-night", night);
    var btn = document.getElementById("glassTheme");
    if (btn) {
      btn.setAttribute("aria-checked", night ? "true" : "false");
      btn.setAttribute("aria-label", night ? "Night" : "Light");
    }
    persist(night);
  }

  function refract() {
    document.querySelectorAll(".glass, .icon-face, .sheet, .glass-switch").forEach(function (el) {
      el.classList.add("glass-refract");
    });
  }

  apply(readNight());

  function bind() {
    refract();
    var btn = document.getElementById("glassTheme");
    if (!btn || btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";
    apply(document.body.classList.contains("glass-night"));
    btn.addEventListener("click", function () {
      apply(!document.body.classList.contains("glass-night"));
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})();

(function () {
  var BLURBS = {
    Chat: "Words you meant to send, kept soft and close.",
    "查手机": "A gentle look through this little phone.",
    Meituan: "Something warm is already on its way.",
    Music: "Songs for the long rain, and for you.",
    "世界书": "Tiny stories gathered from every world.",
    X: "A quiet window onto the passing world.",
    Paint: "Colors waiting, just for your hand.",
    Pay: "Little coins for little promises.",
    Hold: "Stay here a moment. Nothing has to move.",
    More: "More small rooms are waiting behind this."
  };

  var layer = document.getElementById("sheetLayer");
  var titleEl = document.getElementById("sheetTitle");
  var blurbEl = document.getElementById("sheetBlurb");
  var iconEl = document.getElementById("sheetIcon");
  var closeBtn = document.getElementById("sheetClose");
  var homeBits = document.querySelectorAll("[data-home]");
  var lastOpener = null;

  function openSheet(button) {
    var name = button.getAttribute("data-app") || "App";
    titleEl.textContent = name;
    blurbEl.textContent = BLURBS[name] || "A little room on this phone.";
    iconEl.replaceChildren();
    var svg = button.querySelector("svg");
    if (svg) iconEl.appendChild(svg.cloneNode(true));
    homeBits.forEach(function (el) {
      el.inert = true;
    });
    layer.hidden = false;
    lastOpener = button;
    closeBtn.focus({ preventScroll: true });
  }

  function closeSheet() {
    if (layer.hidden) return;
    layer.hidden = true;
    homeBits.forEach(function (el) {
      el.inert = false;
    });
    if (lastOpener) lastOpener.focus({ preventScroll: true });
  }

  document.querySelectorAll(".app").forEach(function (button) {
    button.addEventListener("pointerdown", function () {
      button.classList.add("is-pressed");
    });
    function release() {
      button.classList.remove("is-pressed");
    }
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("pointerleave", release);
    button.addEventListener("click", function () {
      openSheet(button);
    });
  });

  closeBtn.addEventListener("click", closeSheet);
  document.querySelector(".sheet-backdrop").addEventListener("click", closeSheet);

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeSheet();
  });

  var boot = document.getElementById("boot");
  function hideBoot() {
    boot.classList.add("is-done");
  }
  boot.addEventListener("animationend", function (event) {
    if (event.animationName === "bootOut") hideBoot();
  });
  window.setTimeout(hideBoot, 3600);
})();

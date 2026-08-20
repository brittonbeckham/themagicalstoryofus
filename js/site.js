(function () {
  var nav = document.querySelector(".nav");
  var toggle = document.querySelector(".nav-toggle");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  var frame = document.querySelector("[data-hero]");
  if (!frame) return;
  var slides = Array.prototype.slice.call(frame.querySelectorAll("img"));
  var i = 0;
  function show(n) {
    i = (n + slides.length) % slides.length;
    slides.forEach(function (img, idx) {
      img.classList.toggle("is-active", idx === i);
    });
  }
  var prev = frame.querySelector("[data-hero-prev]");
  var next = frame.querySelector("[data-hero-next]");
  if (prev) prev.addEventListener("click", function () { show(i - 1); });
  if (next) next.addEventListener("click", function () { show(i + 1); });
  setInterval(function () { show(i + 1); }, 6000);
})();

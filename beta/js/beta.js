(function () {
  var nav = document.querySelector(".nav");
  var toggle = document.querySelector(".nav-toggle");

  function setOpen(open) {
    if (!nav || !toggle) return;
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      setOpen(!nav.classList.contains("is-open"));
    });

    nav.querySelectorAll(".nav-links a").forEach(function (link) {
      link.addEventListener("click", function () {
        setOpen(false);
      });
    });
  }

  var rail = document.querySelector(".chapter-rail");
  if (rail) {
    var railLinks = Array.prototype.slice.call(rail.querySelectorAll("a[href^='#']"));
    var targets = railLinks.map(function (link) {
      return document.querySelector(link.getAttribute("href"));
    }).filter(Boolean);

    function setRailActive(id) {
      railLinks.forEach(function (link) {
        var on = link.getAttribute("href") === "#" + id;
        link.classList.toggle("is-active", on);
        if (on) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    }

    if ("IntersectionObserver" in window && targets.length) {
      var observer = new IntersectionObserver(function (entries) {
        var visible = entries
          .filter(function (entry) { return entry.isIntersecting; })
          .sort(function (a, b) { return b.intersectionRatio - a.intersectionRatio; });
        if (visible[0] && visible[0].target.id) setRailActive(visible[0].target.id);
      }, {
        rootMargin: "-30% 0px -50% 0px",
        threshold: [0.15, 0.4, 0.7]
      });
      targets.forEach(function (section) { observer.observe(section); });
    }
  }

  var frame = document.querySelector("[data-hero]");
  if (!frame) return;

  var slides = Array.prototype.slice.call(frame.querySelectorAll(".hero-slide"));
  if (!slides.length) return;

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var prev = frame.querySelector("[data-hero-prev]");
  var next = frame.querySelector("[data-hero-next]");
  var dotsWrap = frame.querySelector("[data-hero-dots]");
  var intervalMs = 6500;
  var timer = null;
  var i = 0;
  var paused = false;

  function show(n) {
    i = (n + slides.length) % slides.length;
    slides.forEach(function (slide, idx) {
      var on = idx === i;
      slide.classList.toggle("is-active", on);
      slide.setAttribute("aria-hidden", on ? "false" : "true");
    });
    if (dotsWrap) {
      Array.prototype.forEach.call(dotsWrap.children, function (dot, idx) {
        var on = idx === i;
        dot.classList.toggle("is-active", on);
        dot.setAttribute("aria-selected", on ? "true" : "false");
      });
    }
  }

  function play() {
    stop();
    if (reduce || paused || slides.length < 2) return;
    timer = window.setInterval(function () { show(i + 1); }, intervalMs);
  }

  function stop() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  if (dotsWrap) {
    slides.forEach(function (slide, idx) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "hero-dot" + (idx === 0 ? " is-active" : "");
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-label", "Show photo " + (idx + 1));
      btn.setAttribute("aria-selected", idx === 0 ? "true" : "false");
      btn.addEventListener("click", function () {
        show(idx);
        play();
      });
      dotsWrap.appendChild(btn);
    });
  }

  if (prev) prev.addEventListener("click", function () { show(i - 1); play(); });
  if (next) next.addEventListener("click", function () { show(i + 1); play(); });

  frame.addEventListener("mouseenter", function () {
    paused = true;
    stop();
  });
  frame.addEventListener("mouseleave", function () {
    paused = false;
    play();
  });
  frame.addEventListener("focusin", function () {
    paused = true;
    stop();
  });
  frame.addEventListener("focusout", function (event) {
    if (!frame.contains(event.relatedTarget)) {
      paused = false;
      play();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    var tag = (event.target && event.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (event.target && event.target.isContentEditable)) return;
    if (reduce) return;
    if (event.key === "ArrowLeft") show(i - 1);
    else show(i + 1);
    play();
  });

  slides.forEach(function (slide, idx) {
    slide.setAttribute("aria-hidden", idx === 0 ? "false" : "true");
  });

  if (reduce) {
    frame.classList.add("is-static");
    show(0);
    return;
  }

  show(0);
  play();
})();

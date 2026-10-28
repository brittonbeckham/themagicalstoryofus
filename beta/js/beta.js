(function () {
  document.documentElement.classList.add("js");

  var header = document.querySelector(".site-header");
  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 12);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  var toggle = document.querySelector(".menu-toggle");
  var menu = document.getElementById("mobile-menu");

  function setMenu(open) {
    if (!toggle || !menu) return;
    document.body.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      setMenu(!document.body.classList.contains("menu-open"));
    });
    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () { setMenu(false); });
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && document.body.classList.contains("menu-open")) {
        setMenu(false);
        toggle.focus();
      }
    });
    window.matchMedia("(min-width: 1080px)").addEventListener("change", function (mq) {
      if (mq.matches) setMenu(false);
    });
  }

  document.querySelectorAll("[data-until]").forEach(function (el) {
    var until = Date.parse(el.getAttribute("data-until"));
    if (!isNaN(until) && Date.now() > until) el.remove();
  });

  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if ("IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { revealObserver.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var magic = Array.prototype.slice.call(document.querySelectorAll(".magic"));
  var starfields = [];

  magic.forEach(function (section) {
    var canvas = section.querySelector("canvas.stars");
    if (canvas) starfields.push(makeStarfield(section, canvas));
  });

  if ("IntersectionObserver" in window) {
    var magicObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var el = entry.target;
        el.classList.toggle("magic-paused", !entry.isIntersecting);
        el.querySelectorAll("svg").forEach(function (svg) {
          if (!svg.pauseAnimations) return;
          if (entry.isIntersecting) svg.unpauseAnimations();
          else svg.pauseAnimations();
        });
        if (entry.isIntersecting && entry.intersectionRatio > 0.25) el.classList.add("is-drawn");
        starfields.forEach(function (field) {
          if (field.section === el) field.setRunning(entry.isIntersecting);
        });
      });
    }, { threshold: [0, 0.3] });
    magic.forEach(function (el) { magicObserver.observe(el); });
  } else {
    magic.forEach(function (el) { el.classList.add("is-drawn"); });
  }

  function makeStarfield(section, canvas) {
    var ctx = canvas.getContext("2d");
    var stars = [];
    var running = false;
    var frame = null;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      var w = section.clientWidth;
      var h = section.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.round((w * h) / 9000);
      stars = [];
      for (var n = 0; n < count; n++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 0.9 + 0.3,
          base: Math.random() * 0.35 + 0.1,
          speed: Math.random() * 0.0012 + 0.0004,
          phase: Math.random() * Math.PI * 2
        });
      }
      draw(0);
    }

    function draw(t) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(function (s) {
        var a = reduceMotion ? s.base : s.base + Math.sin(t * s.speed + s.phase) * s.base * 0.8;
        ctx.globalAlpha = Math.max(0, a);
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    function loop(t) {
      draw(t);
      if (running) frame = requestAnimationFrame(loop);
    }

    resize();
    window.addEventListener("resize", resize);

    return {
      section: section,
      setRunning: function (on) {
        if (reduceMotion || on === running) return;
        running = on;
        if (on) frame = requestAnimationFrame(loop);
        else cancelAnimationFrame(frame);
      }
    };
  }

  if (!reduceMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    document.querySelectorAll(".glow").forEach(function (el) {
      el.addEventListener("pointermove", function (event) {
        var rect = el.getBoundingClientRect();
        el.style.setProperty("--mx", (event.clientX - rect.left) + "px");
        el.style.setProperty("--my", (event.clientY - rect.top) + "px");
      });
    });
  }

  document.querySelectorAll("[data-ml-form]").forEach(function (form) {
    var status = form.querySelector(".waitlist-status");
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var action = form.getAttribute("data-ml-action");
      if (!action) {
        status.textContent = "The waitlist opens soon. In the meantime, email us at themagicalstoryofus@gmail.com.";
        return;
      }
      status.textContent = "Adding you to the list…";
      fetch(action, { method: "POST", body: new FormData(form), mode: "no-cors" })
        .then(function () {
          form.reset();
          status.textContent = "You’re on the waitlist. We’ll let you know the moment the book is out.";
        })
        .catch(function () {
          status.textContent = "Something went wrong. Please email us at themagicalstoryofus@gmail.com.";
        });
    });
  });

  var chapterNav = document.querySelector(".chapter-nav");
  if (chapterNav && "IntersectionObserver" in window) {
    var links = Array.prototype.slice.call(chapterNav.querySelectorAll("a[href^='#']"));
    var sections = links.map(function (link) {
      return document.querySelector(link.getAttribute("href"));
    }).filter(Boolean);

    var chapterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (link) {
          var on = link.getAttribute("href") === "#" + entry.target.id;
          link.classList.toggle("is-active", on);
          if (on) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    sections.forEach(function (section) { chapterObserver.observe(section); });
  }
})();

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

  var silkRibbons = [
    { cy: 165, amp: 34, spread: 0.1, lines: 12, opacity: 0.2, duration: 150, filter: "far" },
    { cy: 160, amp: 50, spread: 0.06, lines: 18, opacity: 0.3, duration: 105, filter: "mid", reverse: true },
    { cy: 150, amp: 64, spread: 0.075, lines: 26, opacity: 0.6, duration: 70, filter: "glow", motes: true }
  ];
  document.querySelectorAll("[data-silk]").forEach(buildSilk);

  function buildSilk(host, index) {
    var styles = getComputedStyle(host);
    var colorA = styles.getPropertyValue("--silk-a").trim();
    var colorB = styles.getPropertyValue("--silk-b").trim();
    var id = "silk" + index;
    var markup = "<defs>"
      + "<linearGradient id='" + id + "-g' gradientUnits='userSpaceOnUse' x1='0' y1='0' x2='600' y2='0' spreadMethod='repeat'>"
      + "<stop offset='0' stop-color='" + colorA + "'/><stop offset='0.5' stop-color='" + colorB + "'/><stop offset='1' stop-color='" + colorA + "'/></linearGradient>"
      + "<filter id='" + id + "-far' x='-5%' y='-60%' width='110%' height='220%'><feGaussianBlur stdDeviation='3'/></filter>"
      + "<filter id='" + id + "-mid' x='-5%' y='-60%' width='110%' height='220%'><feGaussianBlur stdDeviation='1.2'/></filter>"
      + "<filter id='" + id + "-glow' x='-5%' y='-60%' width='110%' height='220%'><feGaussianBlur stdDeviation='2.5' result='b'/><feMerge><feMergeNode in='b'/><feMergeNode in='SourceGraphic'/></feMerge></filter>"
      + "</defs>";

    silkRibbons.forEach(function (r) {
      markup += "<g class='silk-ribbon" + (r.reverse ? " silk-ribbon--reverse" : "") + "' style='animation-duration:" + r.duration + "s' filter='url(#" + id + "-" + r.filter + ")'>";
      for (var i = 0; i < r.lines; i++) {
        var t = r.lines > 1 ? i / (r.lines - 1) : 0.5;
        var d = "";
        for (var x = 0; x <= 2400; x += 12) d += (x ? "L" : "M") + x + " " + silkY(r, t, i, x).toFixed(1);
        var alpha = r.opacity * (0.25 + 0.75 * Math.sin(Math.PI * t));
        markup += "<path d='" + d + "' stroke='url(#" + id + "-g)' stroke-opacity='" + alpha.toFixed(3) + "' stroke-width='" + (Math.abs(t - 0.5) < 0.15 ? 1.1 : 0.7) + "'/>";
      }
      if (r.motes) {
        for (var m = 0; m < 8; m++) {
          var mx = 150 + m * 300;
          markup += "<circle class='silk-mote' cx='" + mx + "' cy='" + silkY(r, 0.5, r.lines / 2, mx).toFixed(1) + "' r='1.8'/>";
        }
      }
      markup += "</g>";
    });

    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 1200 300");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = markup;
    host.appendChild(svg);
  }

  function silkY(r, t, i, x) {
    var k = (x / 600) * Math.PI * 2;
    var phase = i * r.spread;
    var envelope = 0.55 + 0.45 * Math.sin((x / 1200) * Math.PI * 2 + 0.8);
    return r.cy + r.amp * Math.sin(k + phase) * envelope + (t - 0.5) * 16 * Math.cos(k / 2 + phase);
  }
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

/* Page-to-page transitions for the beta.
   Loaded in <head> on every beta page (before first render) so it can hook
   `pagereveal`. Uses the browser's cross-document View Transitions; browsers
   without them navigate normally. */
(function () {
  var DEFAULT_TRANSITION = "peel";
  var CHOICES = ["peel", "sigil", "moon"];
  var STORE_KEY = "tmsou-transition";
  var TONE_KEY = "tmsou-transition-tone";
  var PEEL_MS = 1050;

  var root = document.documentElement;
  var script = document.currentScript;
  var betaRoot = new URL("../", script ? script.src : window.location.href).pathname;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function read(key, store) {
    try { return window[store].getItem(key); } catch (e) { return null; }
  }
  function write(key, value, store) {
    try { window[store].setItem(key, value); } catch (e) {}
  }

  var fromQuery = new URLSearchParams(window.location.search).get("transition");
  if (CHOICES.indexOf(fromQuery) > -1) write(STORE_KEY, fromQuery, "localStorage");
  var stored = read(STORE_KEY, "localStorage");
  var choice = CHOICES.indexOf(stored) > -1 ? stored : DEFAULT_TRANSITION;
  root.setAttribute("data-vt", reduceMotion ? "fade" : choice);

  function preloadSigil() {
    if (!reduceMotion) new Image().src = new URL("../assets/sigil-400.png", new URL(betaRoot, window.location.href)).href;
  }
  if (choice === "sigil") preloadSigil();

  var finishDone;
  window.betaTransitionDone = new Promise(function (resolve) { finishDone = resolve; });
  window.setTimeout(finishDone, 2500);
  if (!("onpagereveal" in window)) finishDone();

  function isBetaPage(href) {
    var url = new URL(href, window.location.href);
    return url.origin === window.location.origin &&
      url.pathname.indexOf(betaRoot) === 0 &&
      url.pathname.indexOf(betaRoot + "prototypes/") !== 0;
  }

  /* ---------- Leaving a page ---------- */

  function sampleTone() {
    if (document.body.classList.contains("menu-open")) return "dark";
    var y = window.innerHeight * 0.7;
    var el = document.elementFromPoint(window.innerWidth * 0.25, y);
    if (!el || el === root || el === document.body) {
      // Hit testing only reaches the root while the page is being swapped out.
      el = Array.prototype.find.call(document.querySelectorAll("main > section, body > footer"), function (block) {
        var r = block.getBoundingClientRect();
        return r.top <= y && r.bottom >= y;
      });
    }
    for (; el && el !== root; el = el.parentElement) {
      var m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
      if (m && (m.length < 4 || Number(m[3]) > 0.5)) {
        return 0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2] < 128 ? "dark" : "light";
      }
    }
    return "light";
  }

  window.addEventListener("pageswap", function (event) {
    if (!event.viewTransition) return;
    var entry = event.activation && event.activation.entry;
    if (entry && entry.url && !isBetaPage(entry.url)) {
      event.viewTransition.skipTransition();
      return;
    }
    write(TONE_KEY, sampleTone(), "sessionStorage");
  });

  /* ---------- Arriving on a page ---------- */

  function landOnAnchor() {
    var nav = window.navigation && window.navigation.activation;
    var type = nav ? nav.navigationType : (performance.getEntriesByType("navigation")[0] || {}).type;
    if (type === "traverse" || type === "back_forward" || type === "reload") return;
    if (!window.location.hash) return;
    var target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
    if (target) target.scrollIntoView({ block: "start", behavior: "instant" });
  }

  function overlay(className, html) {
    var el = document.querySelector("." + className);
    if (!el) {
      el = document.createElement("div");
      el.className = className;
      el.setAttribute("aria-hidden", "true");
      if (html) el.innerHTML = html;
      document.body.appendChild(el);
    }
    return el;
  }

  window.addEventListener("pagereveal", function (event) {
    var vt = event.viewTransition;
    if (!vt) {
      finishDone();
      return;
    }
    var from = window.navigation && window.navigation.activation && window.navigation.activation.from;
    if (from && from.url && !isBetaPage(from.url)) {
      vt.skipTransition();
      finishDone();
      return;
    }

    landOnAnchor();
    var mode = root.getAttribute("data-vt");
    root.classList.add("vt-run");
    var end = function () {
      root.classList.remove("vt-run");
      finishDone();
    };
    vt.finished.then(end, end);

    if (mode === "sigil") overlay("vt-sigil");
    if (mode === "moon") overlay("vt-rim");
    if (mode === "peel") peel(vt);
  });

  /* ---------- Corner peel ---------- */
  // The old page is cut away along a diagonal line moving from the bottom-left
  // corner to the top-right. The curl is a page-sized layer mirrored across that
  // line (slightly squashed so it reads as curved), drawn above the old page.

  var ease = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var px = function (n) { return n.toFixed(1) + "px"; };

  function geometry(W, H) {
    var L = Math.hypot(W, H);
    return { W: W, H: H, L: L, nx: W / L, ny: -H / L, ang: (Math.atan2(W, H) * 180) / Math.PI };
  }

  // The part of the screen on one side of the line s = p, where s is the
  // distance from the bottom-left corner toward the top-right corner.
  function halfPlane(g, p, keepAbove) {
    var pts = [[0, 0], [g.W, 0], [g.W, g.H], [0, g.H]];
    var f = function (pt) { return (pt[0] * g.nx + (pt[1] - g.H) * g.ny - p) * (keepAbove ? 1 : -1); };
    var out = [];
    for (var i = 0; i < 4; i++) {
      var a = pts[i], b = pts[(i + 1) % 4], fa = f(a), fb = f(b);
      if (fa >= 0) out.push(a);
      if ((fa >= 0) !== (fb >= 0)) {
        var k = fa / (fa - fb);
        out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]);
      }
    }
    while (out.length < 5) out.push(out[out.length - 1] || [0, 0]);
    return "polygon(" + out.map(function (q) { return px(q[0]) + " " + px(q[1]); }).join(", ") + ")";
  }

  function peel(vt) {
    var W = window.innerWidth, H = window.innerHeight;
    var g = geometry(W, H);
    var dark = read(TONE_KEY, "sessionStorage") === "dark";
    var back = dark
      ? ["#101010", "#1b1b1b", "#2a2925", "#575038"]
      : ["#d2d2d2", "#e6e6e6", "#f4f4f4", "#ffffff"];
    var wrap = overlay("vt-peel", '<div class="vt-peel-crease"></div><div class="vt-peel-flap"></div>');
    var crease = wrap.firstChild;
    var flap = wrap.lastChild;
    var squash = 0.8;
    var opacityAt = function (t) { return t < 0.45 ? 1 : 1 - Math.pow((t - 0.45) / 0.55, 2); };

    function draw(t) {
      var p = ease(t) * g.L;
      var c = p + g.H * g.ny;
      var f = 1 + squash;
      flap.style.transform = "matrix(" + [1 - f * g.nx * g.nx, -f * g.nx * g.ny, -f * g.nx * g.ny, 1 - f * g.ny * g.ny, f * c * g.nx, f * c * g.ny].join(",") + ")";
      flap.style.clipPath = halfPlane(g, p, false);
      flap.style.background = "linear-gradient(" + g.ang + "deg, " + back[0] + " 0px, " + back[1] + " " + px(p * 0.45) + ", " + back[2] + " " + px(p * 0.82) + ", " + back[3] + " " + px(Math.max(0, p - 16)) + ", rgba(214,173,50,0.95) " + px(Math.max(0, p - 3)) + ", #f6dd92 " + px(p) + ")";
      crease.style.background = "linear-gradient(" + g.ang + "deg, transparent " + px(p - 64) + ", rgba(0,0,0,0.24) " + px(p) + ", transparent " + px(p + 0.5) + ")";
      wrap.style.opacity = opacityAt(t);
    }
    draw(0);

    vt.ready.then(function () {
      var frames = [];
      for (var i = 0; i <= 40; i++) {
        var t = i / 40;
        frames.push({ offset: t, clipPath: halfPlane(g, ease(t) * g.L, true), opacity: opacityAt(t) });
      }
      var anim;
      try {
        anim = root.animate(frames, { duration: PEEL_MS, easing: "linear", fill: "both", pseudoElement: "::view-transition-old(root)" });
      } catch (e) {
        root.setAttribute("data-vt", "fade");
        return;
      }
      (function tick() {
        var t = Math.min(1, (Number(anim.currentTime) || 0) / PEEL_MS);
        draw(t);
        if (t < 1 && anim.playState !== "finished") window.requestAnimationFrame(tick);
        else draw(1);
      })();
    }, function () {});
  }

  /* ---------- Same-page anchors scroll smoothly; arrivals stay instant ---------- */

  document.addEventListener("click", function (event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var link = event.target.closest && event.target.closest("a[href]");
    if (!link || link.target === "_blank") return;
    var url = new URL(link.href, window.location.href);
    if (url.hash && url.origin === window.location.origin && url.pathname === window.location.pathname && url.search === window.location.search) {
      root.classList.add("smooth-scroll");
    }
  }, true);

  /* ---------- Switcher in the beta pill ---------- */

  function buildSwitcher() {
    var pill = document.querySelector(".beta-pill");
    if (!pill || pill.querySelector(".vt-switch")) return;
    var label = pill.firstChild;
    if (label && label.nodeType === 3 && label.textContent.trim()) {
      var span = document.createElement("span");
      span.className = "beta-pill-label";
      span.textContent = label.textContent.trim();
      pill.replaceChild(span, label);
    }
    var group = document.createElement("span");
    group.className = "vt-switch";
    group.setAttribute("role", "group");
    group.setAttribute("aria-label", "Page transition");
    group.title = "Page transition for your next click";
    CHOICES.forEach(function (name) {
      var button = document.createElement("button");
      button.type = "button";
      button.setAttribute("data-vt-choice", name);
      button.textContent = name.charAt(0).toUpperCase() + name.slice(1);
      button.setAttribute("aria-pressed", String(name === choice));
      button.addEventListener("click", function () {
        choice = name;
        write(STORE_KEY, name, "localStorage");
        if (!reduceMotion) root.setAttribute("data-vt", name);
        if (name === "sigil") preloadSigil();
        group.querySelectorAll("button").forEach(function (b) {
          b.setAttribute("aria-pressed", String(b === button));
        });
      });
      group.appendChild(button);
    });
    pill.insertBefore(group, pill.querySelector("a"));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", buildSwitcher);
  else buildSwitcher();
})();

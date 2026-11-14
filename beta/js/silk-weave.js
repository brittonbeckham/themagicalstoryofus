/* Gold silk ribbons behind quote bands. Each frame the ribbons are redrawn from
   time-varying waves, so they twist and weave in place.
   Markup: <canvas class="silk-weave" data-weave="dawn|tide|ember" aria-hidden="true"></canvas>
   as the first child of a `.magic` quote band. The variant sets where the motion
   starts, which way each ribbon runs, and the tilt, so no two bands look alike. */
(function () {
  "use strict";

  var TAU = Math.PI * 2;
  var GOLD = [195, 154, 31];      // #c39a1f
  var GOLD_SOFT = [214, 173, 50]; // #d6ad32

  var variants = {
    dawn: { start: 40, dirs: [1, -1, 1], shift: 0, tilt: 0, amp: 1 },
    tide: { start: 11, dirs: [-1, 1, -1], shift: 1.9, tilt: 0.14, amp: 0.95 },
    ember: { start: 73, dirs: [1, 1, -1], shift: 3.6, tilt: -0.12, amp: 1.1 }
  };

  var ribbons = [
    { n: 14, len: 1.25, travel: 26, sway: 19, twist: 31, p: 0.4, q: 2.2, alpha: 0.26, width: 0.9 },
    { n: 18, len: 0.95, travel: 21, sway: 15, twist: 24, p: 2.6, q: 0.7, alpha: 0.4, width: 1 },
    { n: 22, len: 1.1, travel: 17, sway: 13, twist: 20, p: 4.4, q: 4.1, alpha: 0.6, width: 1.15 }
  ];

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function frac(v) { return v - Math.floor(v); }
  function bump(d) { return Math.exp(-d * d); }
  function gold(mix, alpha) {
    var m = clamp(mix, 0, 1);
    return "rgba("
      + Math.round(GOLD[0] + (GOLD_SOFT[0] - GOLD[0]) * m) + ","
      + Math.round(GOLD[1] + (GOLD_SOFT[1] - GOLD[1]) * m) + ","
      + Math.round(GOLD[2] + (GOLD_SOFT[2] - GOLD[2]) * m) + ","
      + clamp(alpha, 0, 1).toFixed(3) + ")";
  }
  function lightGradient(ctx, W, stops, light) {
    var g = ctx.createLinearGradient(0, 0, W, 0);
    for (var s = 0; s <= stops; s++) {
      var l = light((s / stops) * W);
      g.addColorStop(s / stops, gold(l[0], l[1]));
    }
    return g;
  }

  /* Thins the ribbons behind the quote so the words stay easy to read. */
  function quietBehindText(ctx, text, strength) {
    var rx = text.w * 0.5 + Math.max(48, text.w * 0.16);
    var ry = text.h * 0.5 + Math.max(34, text.h * 0.28) * (1 - 0.6 * text.crowd);
    strength *= 1 - 0.2 * text.crowd;
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.translate(text.cx, text.cy);
    ctx.scale(rx, ry);
    var g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, "rgba(0,0,0," + strength + ")");
    g.addColorStop(0.55 + 0.2 * text.crowd, "rgba(0,0,0," + strength + ")");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();
  }

  function paint(ctx, W, H, t, text, v) {
    var step = W < 700 ? 5 : 8;
    var tall = 1 + 0.7 * text.crowd;
    var amp = Math.min(H * 0.2, 86) * tall * v.amp;
    var ribbonW = Math.min(H * 0.2, 78) * tall;
    var span = Math.max(W, 760);

    ribbons.forEach(function (r, ri) {
      var dir = v.dirs[ri];
      var p = r.p + v.shift;
      var q = r.q + v.shift * 0.7;
      var n = W < 600 ? Math.round(r.n * 0.7) : r.n;
      var k = TAU / (span * r.len);
      var travel = dir * TAU * t / r.travel;
      var sway = Math.cos(TAU * t / r.sway + q);
      var turn = dir * TAU * t / r.twist;
      var pulseX = W * (-0.25 + 1.5 * frac(t / (r.travel * 0.62) + ri * 0.37));
      if (dir < 0) pulseX = W - pulseX;
      var pulseW = Math.max(W * 0.1, 90);

      function centre(x) {
        return H * (0.5 + v.tilt * (x / W - 0.5))
          + amp * (0.62 * Math.sin(k * x - travel + p) + 0.38 * Math.sin(1.7 * k * x + q) * sway);
      }
      function twist(x) { return 0.85 * k * x - turn + p * 2; }

      ctx.strokeStyle = lightGradient(ctx, W, 30, function (x) {
        var face = Math.abs(Math.cos(twist(x)));
        var pulse = bump((x - pulseX) / pulseW);
        return [0.25 + 0.75 * Math.max(face * 0.6, pulse), r.alpha * (0.3 + 0.7 * face) * (1 + 0.9 * pulse)];
      });

      for (var i = 0; i < n; i++) {
        var u = i / (n - 1);
        var off = u - 0.5;
        ctx.globalAlpha = 0.35 + 0.65 * Math.sin(Math.PI * u);
        ctx.lineWidth = Math.abs(off) < 0.12 ? 1.2 : 0.8;
        ctx.beginPath();
        for (var x = -step; x <= W + step; x += step) {
          var y = centre(x) + off * ribbonW * r.width * Math.cos(twist(x) + off * 0.9);
          if (x === -step) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    });
    quietBehindText(ctx, text, 0.6);
  }

  var reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var bands = [];
  var rafId = 0;
  var lastNow = 0;

  /* Offsets ignore CSS transforms, so the scroll-reveal slide does not shift the quiet zone. */
  function offsetWithin(el, ancestor) {
    var x = 0, y = 0;
    while (el && el !== ancestor) {
      x += el.offsetLeft;
      y += el.offsetTop;
      el = el.offsetParent;
    }
    return { x: x, y: y };
  }

  function Band(canvas) {
    this.canvas = canvas;
    this.section = canvas.parentElement;
    this.quote = this.section.querySelector("blockquote");
    this.ctx = canvas.getContext("2d");
    this.variant = variants[canvas.getAttribute("data-weave")] || variants.dawn;
    this.t = this.variant.start;
    this.visible = false;
  }
  Band.prototype.measure = function () {
    var W = this.section.clientWidth;
    var H = this.section.clientHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var pw = Math.max(1, Math.round(W * dpr));
    var ph = Math.max(1, Math.round(H * dpr));
    if (this.canvas.width !== pw || this.canvas.height !== ph) {
      this.canvas.width = pw;
      this.canvas.height = ph;
    }
    this.W = W;
    this.H = H;
    this.dpr = dpr;
    var qw = this.quote ? this.quote.offsetWidth : 0;
    var qh = this.quote ? this.quote.offsetHeight : 0;
    var at = this.quote ? offsetWithin(this.quote, this.section) : { x: W / 2, y: H / 2 };
    this.text = {
      cx: at.x + qw / 2,
      cy: at.y + qh / 2,
      w: qw,
      h: qh,
      crowd: clamp((qw / W - 0.45) / 0.4, 0, 1)
    };
  };
  Band.prototype.draw = function () {
    var ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, this.W, this.H);
    ctx.lineJoin = "round";
    paint(ctx, this.W, this.H, this.t, this.text, this.variant);
  };

  function shouldRun() {
    if (reduceQuery.matches || document.hidden) return false;
    for (var i = 0; i < bands.length; i++) if (bands[i].visible) return true;
    return false;
  }
  function frame(now) {
    rafId = 0;
    var dt = Math.min((now - lastNow) / 1000, 0.05);
    lastNow = now;
    bands.forEach(function (b) {
      if (!b.visible) return;
      b.t += dt;
      b.draw();
    });
    sync();
  }
  function sync() {
    if (shouldRun()) {
      if (!rafId) {
        if (!lastNow || performance.now() - lastNow > 200) lastNow = performance.now();
        rafId = requestAnimationFrame(frame);
      }
    } else if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  }
  function redrawAll() {
    bands.forEach(function (b) { b.measure(); b.draw(); });
  }

  document.querySelectorAll("canvas[data-weave]").forEach(function (canvas) {
    bands.push(new Band(canvas));
  });
  if (!bands.length) return;

  if ("IntersectionObserver" in window) {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        bands.forEach(function (b) {
          if (b.section === entry.target) b.visible = entry.isIntersecting;
        });
      });
      sync();
    }, { rootMargin: "60px 0px" });
    bands.forEach(function (b) { seen.observe(b.section); });
  } else {
    bands.forEach(function (b) { b.visible = true; });
  }

  if ("ResizeObserver" in window) {
    var sized = new ResizeObserver(redrawAll);
    bands.forEach(function (b) { sized.observe(b.section); });
  } else {
    window.addEventListener("resize", redrawAll);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(redrawAll);
  document.addEventListener("visibilitychange", sync);
  if (reduceQuery.addEventListener) reduceQuery.addEventListener("change", function () { redrawAll(); sync(); });

  redrawAll();
  sync();
})();

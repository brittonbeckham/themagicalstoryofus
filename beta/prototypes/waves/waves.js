/* Quote band waves prototype.
   Every frame each band redraws its strands on a canvas from time-varying wave maths,
   so the shape of the wave itself changes. */
(function () {
  "use strict";

  var TAU = Math.PI * 2;
  var GOLD = [195, 154, 31];      // #c39a1f
  var GOLD_SOFT = [214, 173, 50]; // #d6ad32

  function gold(mix, alpha) {
    var m = mix < 0 ? 0 : mix > 1 ? 1 : mix;
    var a = alpha < 0 ? 0 : alpha > 1 ? 1 : alpha;
    return "rgba("
      + Math.round(GOLD[0] + (GOLD_SOFT[0] - GOLD[0]) * m) + ","
      + Math.round(GOLD[1] + (GOLD_SOFT[1] - GOLD[1]) * m) + ","
      + Math.round(GOLD[2] + (GOLD_SOFT[2] - GOLD[2]) * m) + ","
      + a.toFixed(3) + ")";
  }
  function frac(v) { return v - Math.floor(v); }
  function bump(d) { return Math.exp(-d * d); }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  /* Repeatable pseudo-random numbers so every visit looks the same. */
  function seeded(seed) {
    var s = seed;
    return function () {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  /* Horizontal gradient whose brightness follows light(x) -> [mix, alpha]. */
  function lightGradient(ctx, W, stops, light) {
    var g = ctx.createLinearGradient(0, 0, W, 0);
    for (var s = 0; s <= stops; s++) {
      var l = light((s / stops) * W);
      g.addColorStop(s / stops, gold(l[0], l[1]));
    }
    return g;
  }

  function tracePath(ctx, W, step, fy) {
    ctx.beginPath();
    ctx.moveTo(-step, fy(-step));
    for (var x = 0; x <= W + step; x += step) ctx.lineTo(x, fy(x));
  }

  /* Thins out whatever is drawn behind the quote so the words stay easy to read. */
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

  /* 0 at the middle of the quote, 1 once clear of it. */
  function clearOfText(text, x, y) {
    var rx = text.w * 0.5 + 40;
    var ry = text.h * 0.5 + 30;
    var dx = (x - text.cx) / rx;
    var dy = (y - text.cy) / ry;
    return clamp(Math.sqrt(dx * dx + dy * dy) - 0.75, 0, 1);
  }

  var painters = {};

  /* ---------- Super subtle: a sheaf of threads that breathes ---------- */
  painters.breath = function (ctx, W, H, t, text) {
    var n = W < 600 ? 18 : 28;
    var step = W < 700 ? 5 : 8;
    var cy = H * 0.5;
    var tall = 1 + 0.9 * text.crowd;
    var amp = Math.min(H * 0.12, 44) * tall;
    var spread = Math.min(H * 0.24, 84) * tall;
    var k = TAU / (Math.max(W, 720) * 1.1);
    var glintX = W * (-0.3 + 1.6 * frac(t / 24));
    var glintW = Math.max(W * 0.13, 120);

    ctx.lineWidth = 1;
    for (var i = 0; i < n; i++) {
      var u = i / (n - 1);
      var breathe = 0.72 + 0.28 * Math.cos(TAU * t / 17 + u * 1.7);
      var ripple = Math.sin(TAU * t / 23 + u * 2.3);
      var fan = TAU * t / 31 + 1;
      var profile = 0.3 + 0.7 * Math.sin(Math.PI * u);
      var base = 0.2 * profile;
      ctx.strokeStyle = lightGradient(ctx, W, 14, function (x) {
        var g = bump((x - glintX) / glintW);
        return [g, base * (1 + 1.5 * g)];
      });
      tracePath(ctx, W, step, function (x) {
        return cy
          + amp * (Math.sin(k * x + 0.6) * breathe + 0.3 * Math.sin(2.3 * k * x + 1.9 + u * 0.9) * ripple)
          + (u - 0.5) * spread * (0.62 + 0.38 * Math.sin(0.5 * k * x + fan + u * 0.8));
      });
      ctx.stroke();
    }
    quietBehindText(ctx, text, 0.55);
  };

  /* ---------- In between: ribbons that twist and weave ---------- */
  var weaveRibbons = [
    { n: 14, len: 1.25, travel: 26, sway: 19, twist: 31, dir: 1, p: 0.4, q: 2.2, alpha: 0.26, width: 0.9 },
    { n: 18, len: 0.95, travel: 21, sway: 15, twist: 24, dir: -1, p: 2.6, q: 0.7, alpha: 0.4, width: 1 },
    { n: 22, len: 1.1, travel: 17, sway: 13, twist: 20, dir: 1, p: 4.4, q: 4.1, alpha: 0.6, width: 1.15 }
  ];
  painters.weave = function (ctx, W, H, t, text) {
    var step = W < 700 ? 5 : 8;
    var cy = H * 0.5;
    var tall = 1 + 0.7 * text.crowd;
    var amp = Math.min(H * 0.2, 86) * tall;
    var ribbonW = Math.min(H * 0.2, 78) * tall;
    var span = Math.max(W, 760);

    weaveRibbons.forEach(function (r, ri) {
      var n = W < 600 ? Math.round(r.n * 0.7) : r.n;
      var k = TAU / (span * r.len);
      var travel = r.dir * TAU * t / r.travel;
      var sway = Math.cos(TAU * t / r.sway + r.q);
      var turn = r.dir * TAU * t / r.twist;
      var pulseX = W * (-0.25 + 1.5 * frac(t / (r.travel * 0.62) + ri * 0.37));
      if (r.dir < 0) pulseX = W - pulseX;
      var pulseW = Math.max(W * 0.1, 90);

      function centre(x) {
        return cy + amp * (0.62 * Math.sin(k * x - travel + r.p) + 0.38 * Math.sin(1.7 * k * x + r.q) * sway);
      }
      function twist(x) { return 0.85 * k * x - turn + r.p * 2; }

      /* The ribbon is brightest where it faces the viewer and dims where it turns edge-on. */
      var sheen = lightGradient(ctx, W, 30, function (x) {
        var face = Math.abs(Math.cos(twist(x)));
        var p = bump((x - pulseX) / pulseW);
        return [0.25 + 0.75 * Math.max(face * 0.6, p), r.alpha * (0.3 + 0.7 * face) * (1 + 0.9 * p)];
      });
      ctx.strokeStyle = sheen;

      for (var i = 0; i < n; i++) {
        var u = i / (n - 1);
        var off = u - 0.5;
        ctx.globalAlpha = 0.35 + 0.65 * Math.sin(Math.PI * u);
        ctx.lineWidth = Math.abs(off) < 0.12 ? 1.2 : 0.8;
        tracePath(ctx, W, step, function (x) {
          return centre(x) + off * ribbonW * r.width * Math.cos(twist(x) + off * 0.9);
        });
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    });
    quietBehindText(ctx, text, 0.6);
  };

  /* ---------- Not so subtle: glowing currents with sparks ---------- */
  var currentLayers = [
    { n: 20, cy: 0.5, amp: 0.25, fan: 0.34, len: 1.3, period: 15, wobble: 1.15, wobbleT: 27, swell: 23, ph: 0.3, alpha: 0.2, lw: 0.9, glow: false },
    { n: 30, cy: 0.5, amp: 0.2, fan: 0.24, len: 0.92, period: 10, wobble: 0.95, wobbleT: 19, swell: 16, ph: 2.4, alpha: 0.5, lw: 1.1, glow: true }
  ];
  var sparks = (function () {
    var rnd = seeded(77);
    var list = [];
    for (var i = 0; i < 18; i++) {
      list.push({ x0: rnd(), u: 0.08 + rnd() * 0.84, speed: 1 / (34 + rnd() * 30), rate: 0.9 + rnd() * 1.6, ph: rnd() * TAU, r: 1 + rnd() * 1.1, star: i % 3 === 0 });
    }
    return list;
  })();

  painters.current = function (ctx, W, H, t, text) {
    var step = W < 700 ? 5 : 8;
    var span = Math.max(W, 760);
    var front = null;

    currentLayers.forEach(function (L, li) {
      var n = W < 600 ? Math.round(L.n * 0.7) : L.n;
      var k = TAU / (span * L.len);
      var flow = TAU * t / L.period;
      var wob = TAU * t / L.wobbleT;
      var swell = TAU * t / L.swell;
      var tall = 1 + 0.55 * text.crowd;
      var amp = Math.min(H * L.amp, 150) * tall;
      var fan = Math.min(H * L.fan, 170) * tall;

      function y(u, x) {
        var theta = k * x - flow + L.ph + L.wobble * Math.sin(0.6 * k * x + wob + u * 1.5);
        var env = 0.58 + 0.42 * Math.sin(0.45 * k * x + swell + L.ph);
        return H * L.cy + amp * env * Math.sin(theta) + (u - 0.5) * fan * Math.cos(theta * 0.5 + 0.7 + u * 0.6);
      }
      if (L.glow) front = y;

      var lightA = W * (-0.3 + 1.6 * frac(t / (L.period * 1.1) + li * 0.5));
      var lightB = W * (-0.3 + 1.6 * frac(t / (L.period * 1.7) + 0.45 + li * 0.2));
      var lightW = Math.max(W * 0.11, 110);
      var light = lightGradient(ctx, W, 24, function (x) {
        var p = Math.max(bump((x - lightA) / lightW), 0.7 * bump((x - lightB) / lightW));
        return [0.2 + 0.8 * p, L.alpha * (0.62 + 0.9 * p)];
      });

      if (L.glow) {
        /* Soft veil of gold between the outer strands. */
        var veil = ctx.createLinearGradient(0, H * 0.1, 0, H * 0.9);
        veil.addColorStop(0, gold(0, 0.02));
        veil.addColorStop(0.5, gold(0.5, 0.1));
        veil.addColorStop(1, gold(0, 0.02));
        ctx.beginPath();
        var x;
        ctx.moveTo(-step, y(0, -step));
        for (x = 0; x <= W + step; x += step) ctx.lineTo(x, y(0, x));
        for (x = W + step; x >= -step; x -= step) ctx.lineTo(x, y(1, x));
        ctx.closePath();
        ctx.fillStyle = veil;
        ctx.fill();
      }

      ctx.strokeStyle = light;
      for (var i = 0; i < n; i++) {
        var u = i / (n - 1);
        ctx.globalAlpha = 0.3 + 0.7 * Math.sin(Math.PI * u);
        ctx.lineWidth = L.lw;
        tracePath(ctx, W, step, function (x) { return y(u, x); });
        ctx.stroke();
      }

      if (L.glow) {
        /* A few bright crests with a halo. */
        ctx.shadowColor = gold(1, 0.9);
        ctx.shadowBlur = 14;
        ctx.lineWidth = 1.5;
        [0.3, 0.5, 0.72].forEach(function (u) {
          ctx.globalAlpha = 0.85;
          tracePath(ctx, W, step, function (x) { return y(u, x); });
          ctx.stroke();
        });
        ctx.shadowBlur = 0;
        ctx.shadowColor = "transparent";
      }
      ctx.globalAlpha = 1;
    });

    quietBehindText(ctx, text, 0.64);

    /* Sparks ride the front current. */
    var count = W < 600 ? 10 : sparks.length;
    for (var s = 0; s < count; s++) {
      var m = sparks[s];
      var mx = W * (-0.05 + 1.1 * frac(m.x0 + t * m.speed));
      var my = front(m.u, mx);
      var tw = 0.5 + 0.5 * Math.sin(t * m.rate + m.ph);
      var vis = (0.25 + 0.75 * tw) * (0.12 + 0.88 * clearOfText(text, mx, my));
      var halo = m.r * 7;
      var g = ctx.createRadialGradient(mx, my, 0, mx, my, halo);
      g.addColorStop(0, gold(1, 0.55 * vis));
      g.addColorStop(1, gold(1, 0));
      ctx.fillStyle = g;
      ctx.fillRect(mx - halo, my - halo, halo * 2, halo * 2);
      if (m.star) {
        var arm = m.r * (4 + 5 * tw);
        ctx.strokeStyle = "rgba(255,255,255," + (0.8 * vis).toFixed(3) + ")";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(mx - arm, my); ctx.lineTo(mx + arm, my);
        ctx.moveTo(mx, my - arm); ctx.lineTo(mx, my + arm);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(255,255,255," + vis.toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(mx, my, m.r * (0.7 + 0.4 * tw), 0, TAU);
      ctx.fill();
    }
  };

  /* ---------- Band shell: sizing, pausing, reduced motion ---------- */

  var reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var bands = [];
  var rafId = 0;
  var lastNow = 0;

  function Band(section) {
    this.section = section;
    this.canvas = section.querySelector("canvas");
    this.quote = section.querySelector("blockquote");
    this.ctx = this.canvas.getContext("2d");
    this.paint = painters[section.getAttribute("data-wave")];
    this.t = 40;
    this.visible = false;
    this.W = 0;
    this.H = 0;
    this.text = { cx: 0, cy: 0, w: 0, h: 0, crowd: 0 };
    this.measure();
  }
  Band.prototype.measure = function () {
    var box = this.section.getBoundingClientRect();
    var q = this.quote.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = box.width;
    this.H = box.height;
    this.dpr = dpr;
    var pw = Math.max(1, Math.round(box.width * dpr));
    var ph = Math.max(1, Math.round(box.height * dpr));
    if (this.canvas.width !== pw || this.canvas.height !== ph) {
      this.canvas.width = pw;
      this.canvas.height = ph;
    }
    this.text = {
      cx: q.left - box.left + q.width / 2,
      cy: q.top - box.top + q.height / 2,
      w: q.width,
      h: q.height,
      /* 0 when the quote leaves room either side, 1 when it fills the band edge to edge. */
      crowd: clamp((q.width / box.width - 0.45) / 0.4, 0, 1)
    };
  };
  Band.prototype.draw = function () {
    var ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, this.W, this.H);
    ctx.lineJoin = "round";
    this.paint(ctx, this.W, this.H, this.t, this.text);
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
    for (var i = 0; i < bands.length; i++) {
      if (!bands[i].visible) continue;
      bands[i].t += dt;
      bands[i].draw();
    }
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

  document.querySelectorAll("[data-wave]").forEach(function (section) {
    if (painters[section.getAttribute("data-wave")]) bands.push(new Band(section));
  });

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

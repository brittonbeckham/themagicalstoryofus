/* Page transitions prototype.
   Each option gets the outgoing page ("from"), the incoming page ("to"), and a
   per-frame callback with progress t in [0, 1]. Everything animates with
   transform / opacity / clip-path / mask plus one canvas for sparkles. */
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const rand = (a, b) => a + Math.random() * (b - a);
  const ease = {
    inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    inCubic: (t) => t * t * t,
    inQuad: (t) => t * t,
    outQuart: (t) => 1 - Math.pow(1 - t, 4),
    inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  };
  const px = (n) => `${n.toFixed(1)}px`;

  const screen = $("[data-screen]");
  const frameEl = $("[data-frame-el]");
  const holder = $("[data-holder]");
  const stage = $("[data-stage]");
  const under = $("[data-under]");
  const over = $("[data-over]");
  const canvas = $("[data-canvas]");
  const g2d = canvas.getContext("2d");
  const urlEl = $("[data-url]");
  const reducedBox = $("[data-reduced]");
  const rmBanner = $("[data-rm-banner]");
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  const pages = {};
  $$("[data-page]", screen).forEach((el) => {
    pages[el.dataset.page] = { id: el.dataset.page, el, scroller: $(".page-scroll", el), tone: el.dataset.tone };
  });
  const PATHS = { A: "themagicalstoryofus.com/", B: "themagicalstoryofus.com/astrology/" };

  const state = {
    current: "A",
    option: "peel",
    speed: 1,
    scale: 1,
    last: { from: "A", to: "B", hash: "readings", fromScroll: 0, point: null },
  };

  /* ---------- Diagonal geometry (bottom-left corner toward top-right) ---------- */

  // s(x, y) is the distance from the bottom-left corner measured toward the top-right corner.
  function diag(W, H) {
    const L = Math.hypot(W, H);
    return { W, H, L, nx: W / L, ny: -H / L, mx: H / L, my: W / L, ang: (Math.atan2(W, H) * 180) / Math.PI };
  }
  const sOf = (g, x, y) => x * g.nx + (y - g.H) * g.ny;

  // The part of the screen rectangle on one side of the line s = p, as a CSS polygon.
  function halfPlane(g, p, keepAbove) {
    const pts = [[0, 0], [g.W, 0], [g.W, g.H], [0, g.H]];
    const f = ([x, y]) => (sOf(g, x, y) - p) * (keepAbove ? 1 : -1);
    const out = [];
    for (let i = 0; i < 4; i++) {
      const a = pts[i], b = pts[(i + 1) % 4];
      const fa = f(a), fb = f(b);
      if (fa >= 0) out.push(a);
      if ((fa >= 0) !== (fb >= 0)) {
        const k = fa / (fa - fb);
        out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]);
      }
    }
    if (out.length < 3) return "polygon(0 0, 0 0, 0 0)";
    return `polygon(${out.map(([x, y]) => `${px(x)} ${px(y)}`).join(", ")})`;
  }

  // A random point on the line s = p that falls inside the screen.
  function pointOnLine(g, p) {
    for (let i = 0; i < 8; i++) {
      const u = rand(-g.L, g.L);
      const x = p * g.nx + u * g.mx;
      const y = g.H + p * g.ny + u * g.my;
      if (x >= 0 && x <= g.W && y >= 0 && y <= g.H) return [x, y];
    }
    return null;
  }

  /* ---------- Sparkle / dust particles on one canvas ---------- */

  function makeSprite(size, paint) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    paint(c.getContext("2d"), size);
    return c;
  }
  const SPRITES = {
    dot: makeSprite(64, (c, s) => {
      const r = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      r.addColorStop(0, "rgba(255,244,205,1)");
      r.addColorStop(0.18, "rgba(240,205,110,0.9)");
      r.addColorStop(0.45, "rgba(214,173,50,0.28)");
      r.addColorStop(1, "rgba(214,173,50,0)");
      c.fillStyle = r;
      c.fillRect(0, 0, s, s);
    }),
    star: makeSprite(64, (c, s) => {
      const m = s / 2;
      const r = c.createRadialGradient(m, m, 0, m, m, m);
      r.addColorStop(0, "rgba(255,240,190,0.9)");
      r.addColorStop(0.25, "rgba(214,173,50,0.25)");
      r.addColorStop(1, "rgba(214,173,50,0)");
      c.fillStyle = r;
      c.fillRect(0, 0, s, s);
      c.fillStyle = "rgba(255,246,215,1)";
      c.beginPath();
      c.moveTo(m, 2); c.quadraticCurveTo(m + 3, m - 3, s - 2, m);
      c.quadraticCurveTo(m + 3, m + 3, m, s - 2); c.quadraticCurveTo(m - 3, m + 3, 2, m);
      c.quadraticCurveTo(m - 3, m - 3, m, 2);
      c.fill();
    }),
    smoke: makeSprite(128, (c, s) => {
      const r = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      r.addColorStop(0, "rgba(10,10,10,0.55)");
      r.addColorStop(0.5, "rgba(10,10,10,0.22)");
      r.addColorStop(1, "rgba(10,10,10,0)");
      c.fillStyle = r;
      c.fillRect(0, 0, s, s);
    }),
    goldSmoke: makeSprite(128, (c, s) => {
      const r = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      r.addColorStop(0, "rgba(214,173,50,0.42)");
      r.addColorStop(0.55, "rgba(195,154,31,0.12)");
      r.addColorStop(1, "rgba(195,154,31,0)");
      c.fillStyle = r;
      c.fillRect(0, 0, s, s);
    }),
  };

  const fx = {
    list: [],
    dpr: Math.min(2, window.devicePixelRatio || 1),
    resize(W, H) {
      canvas.width = Math.round(W * this.dpr);
      canvas.height = Math.round(H * this.dpr);
    },
    spawn(p) {
      if (this.list.length > 900) return;
      this.list.push({ age: 0, drag: 0, sprite: "dot", alpha: 1, grow: 0, ...p });
    },
    clear() {
      this.list.length = 0;
      g2d.setTransform(1, 0, 0, 1, 0, 0);
      g2d.clearRect(0, 0, canvas.width, canvas.height);
    },
    step(dt, paint) {
      g2d.setTransform(1, 0, 0, 1, 0, 0);
      g2d.clearRect(0, 0, canvas.width, canvas.height);
      g2d.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      if (paint) paint(g2d);
      const keep = [];
      for (const q of this.list) {
        q.age += dt;
        if (q.age >= q.life) continue;
        const k = Math.pow(1 - q.drag, dt * 60);
        q.vx *= k; q.vy *= k;
        q.x += q.vx * dt; q.y += q.vy * dt;
        const life = q.age / q.life;
        const a = q.alpha * Math.min(1, life * 6) * (1 - life) * (q.twinkle ? 0.6 + 0.4 * Math.sin(q.age * 22 + q.x) : 1);
        const size = q.size * (1 + q.grow * life);
        g2d.globalAlpha = clamp(a);
        g2d.drawImage(SPRITES[q.sprite], q.x - size / 2, q.y - size / 2, size, size);
        keep.push(q);
      }
      g2d.globalAlpha = 1;
      this.list = keep;
    },
  };

  // Grainy alpha textures for the dust dissolve. Two tiles of different sizes are
  // intersected so the grains near the leading edge are sparse and never line up.
  function noiseTile(s, density) {
    const c = document.createElement("canvas");
    c.width = c.height = s;
    const x = c.getContext("2d");
    for (let i = 0; i < s; i += 2) {
      for (let j = 0; j < s; j += 2) {
        if (Math.random() < density) {
          x.fillStyle = `rgba(0,0,0,${rand(0.6, 1).toFixed(2)})`;
          x.fillRect(i, j, 2, 2);
        }
      }
    }
    return `url("${c.toDataURL()}")`;
  }
  const NOISE_A = noiseTile(96, 0.55);
  const NOISE_B = noiseTile(62, 0.55);

  function setMask(el, value, composite, size) {
    el.style.webkitMaskImage = value;
    el.style.maskImage = value;
    if (composite) el.style.maskComposite = composite;
    if (size) { el.style.webkitMaskSize = size; el.style.maskSize = size; }
    el.style.webkitMaskRepeat = "repeat";
    el.style.maskRepeat = "repeat";
  }

  function layer(parent, cls, html) {
    const d = document.createElement("div");
    d.className = cls;
    if (html) d.innerHTML = html;
    parent.appendChild(d);
    return d;
  }

  /* ---------- The options ---------- */

  const OPTIONS = [
    {
      id: "peel",
      letter: "A",
      name: "Corner peel",
      see: "The page curls up from the bottom-left corner like paper, a gold gleam riding the fold, and fades away toward the top-right.",
      build: "Built-in page transitions can do this: the old page is cut away along a moving diagonal and the curl is a shaded shape that rides above it. Because the curl’s angle depends on the screen’s proportions, a few lines of JS fit it to the screen on arrival. The gold flecks along the fold are a small optional JS layer.",
      tag: ["css-js", "Built-in + a little JS"],
      dur: 1050,
      front: "from",
      setup(ctx) {
        const { W, H, from } = ctx;
        const g = diag(W, H);
        const dark = from.tone === "dark";
        const shadow = layer(under, "full");
        const wrap = layer(over, "peel-wrap");
        const flap = layer(wrap, "peel-flap");
        flap.style.width = `${W}px`;
        flap.style.height = `${H}px`;
        flap.style.boxShadow = "inset 0 0 0 1.5px rgba(214,173,50,0.75)";
        const k = 0.8;
        const back = dark
          ? ["#101010", "#1b1b1b", "#2a2925", "#575038"]
          : ["#d2d2d2", "#e6e6e6", "#f4f4f4", "#ffffff"];
        return {
          frame(t) {
            const e = ease.inOutCubic(t);
            const p = e * g.L;
            const o = 1 - ease.inQuad(seg(t, 0.45, 1));
            from.el.style.clipPath = halfPlane(g, p, true);
            from.el.style.opacity = o;
            const c = p + g.H * g.ny;
            const f = 1 + k;
            flap.style.transform = `matrix(${1 - f * g.nx * g.nx}, ${-f * g.nx * g.ny}, ${-f * g.nx * g.ny}, ${1 - f * g.ny * g.ny}, ${f * c * g.nx}, ${f * c * g.ny})`;
            flap.style.clipPath = halfPlane(g, p, false);
            flap.style.background = `linear-gradient(${g.ang}deg, ${back[0]} 0px, ${back[1]} ${px(p * 0.45)}, ${back[2]} ${px(p * 0.82)}, ${back[3]} ${px(Math.max(0, p - 16))}, rgba(214,173,50,0.95) ${px(Math.max(0, p - 3))}, #f6dd92 ${px(p)})`;
            wrap.style.opacity = o;
            shadow.style.background = `linear-gradient(${g.ang}deg, transparent ${px(p - 64)}, rgba(0,0,0,0.24) ${px(p)}, transparent ${px(p + 0.5)})`;
            shadow.style.opacity = o;
            if (t < 0.9 && Math.random() < 0.7) {
              const pt = pointOnLine(g, p);
              if (pt) {
                ctx.fx.spawn({ x: pt[0], y: pt[1], vx: g.nx * rand(30, 80) + g.mx * rand(-15, 15), vy: g.ny * rand(30, 80) + g.my * rand(-15, 15), life: rand(0.6, 1.1), size: rand(7, 14), sprite: Math.random() < 0.3 ? "star" : "dot", drag: 0.02, twinkle: true });
              }
            }
          },
        };
      },
    },
    {
      id: "seam",
      letter: "B",
      name: "Gold seam wipe",
      see: "A soft diagonal edge sweeps from bottom-left to top-right, glowing with a thin line of gold and tiny sparkles, while the old page fades.",
      build: "Built-in page transitions, CSS only for the wipe and fade (a moving gradient mask on the old page). The glowing seam is a decoration layer drawn on the new page; the sparkles need a few lines of JS.",
      tag: ["css-js", "Built-in + a little JS"],
      dur: 950,
      front: "from",
      setup(ctx) {
        const { W, H, from } = ctx;
        const g = diag(W, H);
        const seamEl = layer(over, "full");
        const f = 46;
        return {
          frame(t) {
            const e = ease.inOutSine(t);
            const p = lerp(-f, g.L + f, e);
            setMask(from.el, `linear-gradient(${g.ang}deg, transparent ${px(p - f)}, #000 ${px(p + f)})`);
            from.el.style.opacity = 1 - 0.55 * ease.inQuad(t);
            seamEl.style.background =
              `linear-gradient(${g.ang}deg, transparent ${px(p - 4)}, rgba(255,240,196,0.95) ${px(p)}, transparent ${px(p + 4)}),` +
              `linear-gradient(${g.ang}deg, transparent ${px(p - 30)}, rgba(214,173,50,0.4) ${px(p)}, transparent ${px(p + 30)}),` +
              `linear-gradient(${g.ang}deg, transparent ${px(p - 110)}, rgba(214,173,50,0.12) ${px(p)}, transparent ${px(p + 110)})`;
            seamEl.style.opacity = Math.min(seg(t, 0, 0.08), 1 - seg(t, 0.9, 1));
            if (t < 0.95) {
              for (let i = 0; i < 3; i++) {
                const pt = pointOnLine(g, p);
                if (!pt) continue;
                ctx.fx.spawn({ x: pt[0], y: pt[1], vx: rand(-20, 20) + g.nx * 20, vy: rand(-26, 12), life: rand(0.4, 0.9), size: rand(5, 12), sprite: Math.random() < 0.35 ? "star" : "dot", drag: 0.04, twinkle: true });
              }
            }
          },
        };
      },
    },
    {
      id: "dust",
      letter: "C",
      name: "Gold dust dissolve",
      see: "Starting at the bottom-left, the page breaks into fine grains that drift up and to the right as glittering gold dust, revealing the new page.",
      build: "Built-in page transitions for the dissolve itself (a grainy moving mask plus a slight drift and blur on the old page, all CSS). The drifting gold dust is a small JS particle layer on top.",
      tag: ["css-js", "Built-in + a little JS"],
      dur: 1150,
      front: "from",
      setup(ctx) {
        const { W, H, from } = ctx;
        const g = diag(W, H);
        const b = clamp(g.L * 0.15, 70, 200);
        return {
          frame(t) {
            const e = ease.inOutSine(t);
            const p = lerp(-b, g.L + b, e);
            setMask(
              from.el,
              `linear-gradient(${g.ang}deg, transparent ${px(p)}, #000 ${px(p + b)}),` +
                `linear-gradient(${g.ang}deg, transparent ${px(p - b)}, #000 ${px(p + b * 0.5)}),` +
                `${NOISE_B}, ${NOISE_A}`,
              "add, intersect, intersect, add",
              "100% 100%, 100% 100%, 62px 62px, 96px 96px"
            );
            const d = 26 * e;
            from.el.style.transform = `translate(${px(g.nx * d)}, ${px(g.ny * d)})`;
            from.el.style.filter = `blur(${(1.4 * e).toFixed(2)}px)`;
            from.el.style.opacity = 1 - ease.inQuad(seg(t, 0.7, 1));
            if (t < 0.96) {
              for (let i = 0, n = W > 700 ? 15 : 9; i < n; i++) {
                const pt = pointOnLine(g, p + rand(-b * 0.5, b * 0.6));
                if (!pt) continue;
                const v = rand(50, 150);
                ctx.fx.spawn({ x: pt[0], y: pt[1], vx: g.nx * v + rand(-25, 25), vy: g.ny * v + rand(-35, 10), life: rand(0.8, 1.6), size: rand(3, 9), alpha: rand(0.5, 1), drag: 0.015, twinkle: Math.random() < 0.4, sprite: Math.random() < 0.08 ? "star" : "dot" });
              }
            }
          },
        };
      },
    },
    {
      id: "moon",
      letter: "D",
      name: "Moon-phase reveal",
      see: "A thin crescent of the new page appears in the center, waxes into a full moon edged in gold, and swells until it fills the screen.",
      build: "Built-in page transitions, CSS only: the new page is shown through two circular masks (the moon and its shadow) that grow and slide apart. The thin gold rim can be drawn as part of the same CSS or left off.",
      tag: ["css", "Built-in, CSS only"],
      dur: 1100,
      front: "to",
      setup(ctx) {
        const { W, H, from, to } = ctx;
        const cx = W / 2, cy = H * 0.46;
        const Rmax = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) + 30;
        const R0 = Math.min(W, H) * 0.09;
        let R = 0, sx = 0, Rs = 0, rim = 0;
        return {
          frame(t) {
            const grow = ease.inCubic(t);
            R = lerp(R0, Rmax, grow);
            const phase = ease.inOutSine(seg(t, 0, 0.75));
            Rs = R * 1.02;
            sx = cx - R * lerp(0.32, 2.3, phase);
            setMask(
              to.el,
              `radial-gradient(circle at ${px(cx)} ${px(cy)}, #000 ${px(R)}, transparent ${px(R + 1.5)}),` +
                `radial-gradient(circle at ${px(sx)} ${px(cy)}, #000 ${px(Rs - 5)}, transparent ${px(Rs + 5)})`,
              "subtract, add"
            );
            to.el.style.opacity = Math.min(1, seg(t, 0, 0.06) * 1);
            from.el.style.transform = `scale(${(1 - 0.03 * ease.inOutSine(t)).toFixed(4)})`;
            from.el.style.opacity = 1 - 0.45 * t;
            rim = 1 - seg(t, 0.62, 0.95);
          },
          paint(c) {
            if (rim <= 0) return;
            c.save();
            c.beginPath();
            c.rect(0, 0, W, H);
            c.arc(sx, cy, Math.max(0, Rs - 2), 0, Math.PI * 2, true);
            c.clip("evenodd");
            c.globalAlpha = rim;
            c.strokeStyle = "rgba(240,206,110,0.95)";
            c.shadowColor = "rgba(214,173,50,0.9)";
            c.shadowBlur = 14;
            c.lineWidth = 1.6;
            c.beginPath();
            c.arc(cx, cy, R, 0, Math.PI * 2);
            c.stroke();
            c.restore();
          },
        };
      },
    },
    {
      id: "veil",
      letter: "E",
      name: "Veil lift",
      see: "The page lifts from its bottom-left corner and tilts away like a silk veil, catching a soft sheen as it blurs and fades over the new page.",
      build: "Built-in page transitions, CSS only: a 3D tilt, slight drift, blur, and fade on the old page, with the new page settling in underneath.",
      tag: ["css", "Built-in, CSS only"],
      dur: 950,
      front: "from",
      setup(ctx) {
        const { W, H, from, to } = ctx;
        const g = diag(W, H);
        screen.style.perspective = `${Math.round(Math.max(W, H) * 2)}px`;
        screen.style.perspectiveOrigin = "100% 0%";
        from.el.style.transformOrigin = "100% 0%";
        const sheen = layer(from.el, "veil-sheen");
        return {
          frame(t) {
            const e = ease.inOutCubic(t);
            const a = 40 * e;
            const lift = 0.14 * g.L * e;
            from.el.style.transform = `translate3d(${px(g.nx * lift)}, ${px(g.ny * lift)}, 0) rotate3d(1, 1, 0, ${a.toFixed(2)}deg) scale(${(1 - 0.04 * e).toFixed(4)})`;
            from.el.style.filter = `blur(${(5 * ease.inQuad(t)).toFixed(2)}px)`;
            from.el.style.opacity = 1 - ease.inQuad(seg(t, 0.22, 1));
            from.el.style.boxShadow = `0 ${px(40 * e)} ${px(80 * e)} rgba(0,0,0,${(0.4 * e).toFixed(3)})`;
            const q = lerp(-0.3, 1.3, ease.outCubic(t)) * g.L;
            sheen.style.background = `linear-gradient(${g.ang}deg, transparent ${px(q - 180)}, rgba(255,255,255,0.09) ${px(q - 40)}, rgba(214,173,50,0.16) ${px(q)}, transparent ${px(q + 160)})`;
            to.el.style.transform = `scale(${(0.985 + 0.015 * ease.outCubic(t)).toFixed(4)})`;
          },
        };
      },
    },
    {
      id: "ink",
      letter: "F",
      name: "Ink bloom",
      see: "The new page blooms outward from exactly where the visitor tapped, its edge soft and smoky like ink spreading through water, with a few gold wisps.",
      build: "Built-in page transitions with a little JS: the reveal is one CSS mask, but it has to start where the visitor tapped, so the tap position is saved before leaving the page and read on arrival. The smoky edge is a small JS layer.",
      tag: ["css-js", "Built-in + a little JS"],
      dur: 1000,
      front: "to",
      setup(ctx) {
        const { W, H, to, from } = ctx;
        const pt = ctx.point || { x: W / 2, y: H / 2 };
        const Rmax = Math.hypot(Math.max(pt.x, W - pt.x), Math.max(pt.y, H - pt.y)) + 90;
        const puffs = Array.from({ length: 60 }, (_, i) => ({
          a: (i / 60) * Math.PI * 2 + rand(-0.05, 0.05),
          j: rand(-0.1, 0.06),
          s: rand(40, 110),
          w: rand(0, Math.PI * 2),
          gold: Math.random() < 0.36,
        }));
        let R = 0, tt = 0;
        return {
          frame(t) {
            tt = t;
            R = Rmax * ease.inOutCubic(t);
            const soft = 26 + 40 * t;
            setMask(to.el, `radial-gradient(circle at ${px(pt.x)} ${px(pt.y)}, #000 ${px(Math.max(0, R - soft))}, transparent ${px(R + soft * 0.4)})`);
            from.el.style.opacity = 1 - 0.3 * t;
            if (t < 0.8 && R > 10) {
              for (let i = 0; i < 2; i++) {
                const a = rand(0, Math.PI * 2);
                const x = pt.x + Math.cos(a) * R, y = pt.y + Math.sin(a) * R;
                if (x < 0 || x > W || y < 0 || y > H) continue;
                const v = rand(20, 60);
                ctx.fx.spawn({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 10, life: rand(0.5, 1), size: rand(5, 11), drag: 0.03, twinkle: true });
              }
            }
          },
          paint(c) {
            const fade = 1 - seg(tt, 0.65, 1);
            if (fade <= 0 || R < 2) return;
            const grow = 0.45 + 0.75 * (R / Rmax);
            for (const q of puffs) {
              const r = R * (1 + q.j) + Math.sin(tt * 9 + q.w) * 8;
              const s = q.s * grow;
              c.globalAlpha = fade * (q.gold ? 0.9 : 0.5) * Math.min(1, R / 60);
              c.drawImage(q.gold ? SPRITES.goldSmoke : SPRITES.smoke, pt.x + Math.cos(q.a) * r - s / 2, pt.y + Math.sin(q.a) * r - s / 2, s, s);
            }
            c.globalAlpha = 1;
          },
        };
      },
    },
    {
      id: "sigil",
      letter: "G",
      name: "Sigil flash",
      see: "The old page softly dims to black, your sigil glows gold in the center for a breath, then the new page fades up behind it.",
      build: "Built-in page transitions, CSS only: the default crossfade, slowed and split in two, with the sigil as a separate glowing layer that fades in and out between them.",
      tag: ["css", "Built-in, CSS only"],
      dur: 1150,
      front: "from",
      setup(ctx) {
        const { from, to } = ctx;
        const glow = layer(over, "sigil-glow");
        const mark = document.createElement("img");
        mark.className = "sigil-mark";
        mark.src = "../../../assets/sigil-400.png";
        mark.alt = "";
        over.appendChild(mark);
        return {
          frame(t) {
            from.el.style.opacity = 1 - ease.inOutSine(seg(t, 0, 0.42));
            from.el.style.filter = `blur(${(3 * seg(t, 0, 0.42)).toFixed(2)}px)`;
            to.el.style.opacity = ease.inOutSine(seg(t, 0.5, 0.95));
            to.el.style.transform = `scale(${(1.015 - 0.015 * ease.outCubic(seg(t, 0.5, 1))).toFixed(4)})`;
            const m = Math.min(ease.outCubic(seg(t, 0.12, 0.42)), 1 - ease.inOutSine(seg(t, 0.6, 0.9)));
            const sc = lerp(0.84, 1.06, ease.outCubic(t));
            mark.style.opacity = m;
            mark.style.transform = `scale(${sc.toFixed(4)}) rotate(${lerp(-10, 6, ease.outCubic(t)).toFixed(2)}deg)`;
            mark.style.filter = `drop-shadow(0 0 ${px(6 + 22 * m)} rgba(214,173,50,${(0.85 * m).toFixed(3)}))`;
            glow.style.opacity = m;
          },
        };
      },
    },
    {
      id: "today",
      letter: "·",
      name: "Today (for comparison)",
      see: "What the beta does now: the new page appears at the top, then visibly scrolls down to the section.",
      build: "This is the browser’s normal page load with smooth scrolling switched on for the whole page.",
      tag: ["today", "Current site"],
      dur: 1100,
      front: "to",
      keepsTop: true,
      setup(ctx) {
        const { from, to, anchorY } = ctx;
        from.el.classList.remove("is-visible");
        return {
          frame(t) {
            to.scroller.scrollTop = anchorY * ease.inOutCubic(seg(t, 0.25, 1));
          },
        };
      },
    },
  ];

  const FADE = {
    id: "fade",
    dur: 240,
    front: "from",
    setup(ctx) {
      return { frame(t) { ctx.from.el.style.opacity = 1 - t; } };
    },
  };

  /* ---------- Engine ---------- */

  let run = null;
  let looping = false;
  let lastTick = 0;

  function resetStage() {
    run = null;
    under.innerHTML = "";
    over.innerHTML = "";
    screen.style.perspective = "";
    screen.style.perspectiveOrigin = "";
    $$(".veil-sheen", screen).forEach((n) => n.remove());
    Object.values(pages).forEach((p) => {
      p.el.removeAttribute("style");
      p.el.classList.remove("is-front", "is-back", "is-visible");
      $$(".is-arrived", p.el).forEach((n) => n.classList.remove("is-arrived"));
    });
    fx.clear();
  }

  function sectionTop(page, id) {
    const target = page.el.querySelector(`#${id}`);
    if (!target) return 0;
    let y = 0;
    for (let n = target; n && n !== page.scroller; n = n.offsetParent) y += n.offsetTop;
    const header = $(".m-header", page.el);
    const max = page.scroller.scrollHeight - page.scroller.clientHeight;
    return clamp(y - (header ? header.offsetHeight : 0), 0, max);
  }

  function setUrl(id, hash) {
    urlEl.textContent = PATHS[id] + (hash ? `#${hash}` : "");
  }

  function isReduced() {
    return reducedBox.checked;
  }

  function play(nav) {
    resetStage();
    const opt = isReduced() ? FADE : OPTIONS.find((o) => o.id === state.option);
    const from = pages[nav.from], to = pages[nav.to];
    const W = screen.offsetWidth, H = screen.offsetHeight;
    from.el.classList.add("is-visible");
    to.el.classList.add("is-visible");
    from.scroller.scrollTop = nav.fromScroll;
    const anchorY = nav.hash ? sectionTop(to, nav.hash) : 0;
    to.scroller.scrollTop = opt.keepsTop ? 0 : anchorY;
    (opt.front === "to" ? to : from).el.classList.add("is-front");
    (opt.front === "to" ? from : to).el.classList.add("is-back");
    setUrl(nav.to, nav.hash);
    state.current = nav.to;

    const ctx = { W, H, from, to, fx, point: nav.point, anchorY };
    const hooks = opt.setup(ctx);
    hooks.frame(0);
    run = { nav, opt, hooks, to, anchorY, start: performance.now(), dur: opt.dur / state.speed };
    kick();
  }

  function finish(r) {
    const { nav, to, anchorY } = r;
    resetStage();
    to.el.classList.add("is-visible", "is-front");
    to.scroller.scrollTop = anchorY;
    if (nav.hash) {
      const sec = to.el.querySelector(`#${nav.hash}`);
      if (sec) sec.classList.add("is-arrived");
    }
  }

  function kick() {
    if (looping) return;
    looping = true;
    lastTick = performance.now();
    requestAnimationFrame(tick);
  }

  function tick(now) {
    const dt = Math.min(0.05, (now - lastTick) / 1000) * state.speed;
    lastTick = now;
    let paint = null;
    if (run) {
      const r = run;
      const t = clamp((now - r.start) / r.dur);
      r.hooks.frame(t);
      paint = r.hooks.paint || null;
      if (t >= 1) {
        paint = null;
        const keepParticles = fx.list.slice();
        finish(r);
        fx.list = keepParticles;
      }
    }
    fx.step(dt, paint);
    if (run || fx.list.length) requestAnimationFrame(tick);
    else looping = false;
  }

  function go(toId, hash, point) {
    if (run) finish(run);
    const fromId = state.current;
    const from = pages[fromId];
    if (toId === fromId) {
      const y = hash ? sectionTop(from, hash) : 0;
      from.scroller.scrollTo({ top: y, behavior: isReduced() ? "auto" : "smooth" });
      setUrl(fromId, hash);
      return;
    }
    state.last = { from: fromId, to: toId, hash: hash || "", fromScroll: from.scroller.scrollTop, point };
    play(state.last);
  }

  function replay() {
    play(state.last);
  }

  function showHome() {
    resetStage();
    pages.A.el.classList.add("is-visible", "is-front");
    pages.A.scroller.scrollTop = 0;
    pages.B.scroller.scrollTop = 0;
    state.current = "A";
    setUrl("A", "");
  }

  /* ---------- Frame sizing ---------- */

  function fit() {
    const W = screen.offsetWidth, H = screen.offsetHeight;
    const ow = frameEl.offsetWidth, oh = frameEl.offsetHeight;
    const cs = getComputedStyle(stage);
    const aw = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const ah = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const s = Math.min(1, aw / ow, ah / oh);
    state.scale = s;
    frameEl.style.transform = `scale(${s})`;
    holder.style.width = `${ow * s}px`;
    holder.style.height = `${oh * s}px`;
    fx.resize(W, H);
  }

  function setFrame(kind) {
    if (run) finish(run);
    frameEl.classList.toggle("phone", kind === "phone");
    frameEl.classList.toggle("desktop", kind === "desktop");
    $$("[data-frame]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.frame === kind)));
    fit();
  }

  /* ---------- UI ---------- */

  const optWrap = $("[data-options]");
  const noteSee = $("[data-note-see]");
  const noteBuild = $("[data-note-build]");

  function renderOptions() {
    optWrap.innerHTML = "";
    OPTIONS.forEach((o) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "opt";
      b.setAttribute("role", "radio");
      b.dataset.opt = o.id;
      b.innerHTML =
        `<span class="opt-letter">${o.letter}</span>` +
        `<span class="opt-name">${o.name}</span>` +
        `<span class="opt-see">${o.see}</span>` +
        `<span class="opt-tag" data-kind="${o.tag[0]}">${o.tag[1]}</span>`;
      b.addEventListener("click", () => {
        selectOption(o.id);
        replay();
      });
      optWrap.appendChild(b);
    });
  }

  function selectOption(id) {
    state.option = id;
    const o = OPTIONS.find((x) => x.id === id);
    $$(".opt", optWrap).forEach((b) => {
      const on = b.dataset.opt === id;
      b.setAttribute("aria-checked", String(on));
      b.tabIndex = on ? 0 : -1;
    });
    noteSee.textContent = o.see;
    noteBuild.textContent = o.build;
  }

  optWrap.addEventListener("keydown", (e) => {
    if (!["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(e.key)) return;
    e.preventDefault();
    const i = OPTIONS.findIndex((o) => o.id === state.option);
    const n = (i + (e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1) + OPTIONS.length) % OPTIONS.length;
    selectOption(OPTIONS[n].id);
    $(`[data-opt="${OPTIONS[n].id}"]`, optWrap).focus();
    replay();
  });

  screen.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a || !screen.contains(a)) return;
    e.preventDefault();
    if (!a.dataset.go) return;
    const rect = screen.getBoundingClientRect();
    let x = (e.clientX - rect.left) / state.scale;
    let y = (e.clientY - rect.top) / state.scale;
    if (!e.clientX && !e.clientY) {
      const r = a.getBoundingClientRect();
      x = (r.left + r.width / 2 - rect.left) / state.scale;
      y = (r.top + r.height / 2 - rect.top) / state.scale;
    }
    go(a.dataset.go, a.dataset.hash, { x, y });
  });

  $$("[data-frame]").forEach((b) => b.addEventListener("click", () => setFrame(b.dataset.frame)));
  $$("[data-speed]").forEach((b) =>
    b.addEventListener("click", () => {
      state.speed = Number(b.dataset.speed);
      $$("[data-speed]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    })
  );
  $("[data-replay]").addEventListener("click", replay);
  $("[data-reset]").addEventListener("click", showHome);

  reducedBox.checked = prefersReduced.matches;
  rmBanner.hidden = !prefersReduced.matches;
  reducedBox.addEventListener("change", () => { rmBanner.hidden = true; });

  window.addEventListener("resize", fit);
  if (window.ResizeObserver) new ResizeObserver(fit).observe(stage);

  renderOptions();
  selectOption(state.option);
  setFrame("phone");
  showHome();

  // Hook for automated screenshots.
  window.__tx = {
    go, replay, selectOption, setFrame, showHome, state,
    setSpeed: (s) => { state.speed = s; },
    jump: (id) => { resetStage(); pages[id].el.classList.add("is-visible", "is-front"); pages[id].scroller.scrollTop = 0; state.current = id; setUrl(id, ""); },
  };
})();

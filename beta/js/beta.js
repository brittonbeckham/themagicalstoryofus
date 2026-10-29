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

  var brandLink = document.querySelector(".brand");
  if (menu && brandLink) {
    var siteRoot = new URL(brandLink.getAttribute("href"), window.location.href);
    var spotify = "https://open.spotify.com/show/7aiuVvWeplDXFJOmTFpwqc";
    var icons = {
      home: '<path d="M6 15L16 6l10 9"/><path d="M8.5 13v13h15V13"/><path d="M13 26v-6a3 3 0 0 1 6 0v6"/>',
      story: '<circle cx="12.5" cy="16" r="6.5"/><circle cx="19.5" cy="16" r="6.5"/><path class="fill" d="M16 5.5l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6z"/>',
      astrology: '<circle cx="16" cy="16" r="11"/><circle cx="16" cy="16" r="6.5"/><path d="M16 5v4.5M16 22.5V27M5 16h4.5M22.5 16H27M8.2 8.2l3.2 3.2M20.6 20.6l3.2 3.2M23.8 8.2l-3.2 3.2M11.4 20.6l-3.2 3.2"/>',
      offerings: '<path d="M16 24c-3-3-4.5-6.5-4.5-10S13.5 7.5 16 5c2.5 2.5 4.5 5.5 4.5 9S19 21 16 24z"/><path d="M16 24c-4.5 0-8.5-2.5-10-7 3.5-.5 6.5.5 8.5 2.5"/><path d="M16 24c4.5 0 8.5-2.5 10-7-3.5-.5-6.5.5-8.5 2.5"/><path d="M8 27h16"/>',
      podcast: '<rect x="12" y="4.5" width="8" height="14" rx="4"/><path d="M8 15a8 8 0 0 0 16 0"/><path d="M16 23v4.5M12 27.5h8"/>',
      contact: '<rect x="4.5" y="8" width="23" height="16" rx="2"/><path d="M5.5 9.5L16 17.5l10.5-8"/>'
    };
    var pages = [
      { label: "Home", href: "", icon: "home" },
      { label: "Our Story", href: "our-story/", icon: "story" },
      { label: "Astrology", href: "astrology/", icon: "astrology" },
      { label: "Offerings", href: "offerings/", icon: "offerings" },
      { label: "Podcast", href: spotify, icon: "podcast", external: true },
      { label: "Contact", href: "contact/", icon: "contact" }
    ];
    var socials = [
      { label: "Instagram", href: "https://www.instagram.com/themagicalstoryofus/", svg: '<path d="M7.5 2.5h9a5 5 0 0 1 5 5v9a5 5 0 0 1-5 5h-9a5 5 0 0 1-5-5v-9a5 5 0 0 1 5-5Zm0 1.8a3.2 3.2 0 0 0-3.2 3.2v9a3.2 3.2 0 0 0 3.2 3.2h9a3.2 3.2 0 0 0 3.2-3.2v-9a3.2 3.2 0 0 0-3.2-3.2h-9ZM12 7.2a4.8 4.8 0 1 1 0 9.6 4.8 4.8 0 0 1 0-9.6Zm0 1.8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.2-2.6a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z"/>' },
      { label: "Spotify", href: spotify, svg: '<path d="M12 1.5a10.5 10.5 0 1 0 0 21 10.5 10.5 0 0 0 0-21Zm4.82 15.14a.66.66 0 0 1-.9.22c-2.47-1.51-5.58-1.85-9.24-1.02a.66.66 0 1 1-.29-1.28c4.01-.92 7.44-.52 10.21 1.17.31.19.41.6.22.91Zm1.29-2.86a.82.82 0 0 1-1.13.27c-2.83-1.74-7.14-2.24-10.48-1.23a.82.82 0 1 1-.48-1.57c3.82-1.16 8.57-.6 11.82 1.4.39.24.51.74.27 1.13Zm.11-2.98C14.82 8.79 9.2 8.6 5.95 9.59a.98.98 0 1 1-.57-1.88c3.730-1.13 9.94-.91 13.85 1.41a.98.98 0 0 1-1.01 1.68Z"/>' },
      { label: "TikTok", href: "https://www.tiktok.com/@themagicalstoryofus", svg: '<path d="M16.6 2h-3.4v13.4a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9.1a6.3 6.3 0 1 0 5.4 6.3V8.7a7.6 7.6 0 0 0 4.4 1.4V6.7a4.3 4.3 0 0 1-4.4-4.7Z"/>' }
    ];
    var here = window.location.pathname.replace(/index\.html$/, "");

    var orbs = pages.map(function (page, i) {
      var href = page.external ? page.href : new URL(page.href, siteRoot).pathname;
      var current = !page.external && href === here ? ' aria-current="page"' : "";
      var target = page.external ? ' target="_blank" rel="noopener"' : "";
      return '<li class="nc-slot" style="--a: ' + (i * 60 - 90) + "deg; --i: " + i + '">' +
        '<div class="nc-arm"><div class="nc-upright"><div class="nc-counter">' +
        '<a class="nc-orb" href="' + href + '"' + current + target + ">" +
        '<span class="nc-icon"><svg viewBox="0 0 32 32" aria-hidden="true">' + icons[page.icon] + "</svg></span>" +
        '<span class="nc-label">' + page.label + "</span></a>" +
        "</div></div></div></li>";
    }).join("");

    menu.classList.add("is-circle");
    menu.innerHTML =
      '<div class="nc-stars" aria-hidden="true"></div>' +
      '<nav class="nc-stage" aria-label="Mobile"><div class="nc-hub">' +
      '<svg class="nc-rings" viewBox="0 0 380 380" aria-hidden="true">' +
      '<circle class="nc-ring-outer" cx="190" cy="190" r="178"/><circle class="nc-ring-main" cx="190" cy="190" r="132"/><circle class="nc-ring-inner" cx="190" cy="190" r="80"/>' +
      '<g class="nc-ring-stars"><circle cx="190" cy="12" r="1.8"/><circle cx="344" cy="101" r="1.2"/><circle cx="344" cy="279" r="1.6"/><circle cx="190" cy="368" r="1.2"/><circle cx="36" cy="279" r="1.8"/><circle cx="36" cy="101" r="1.2"/></g>' +
      "</svg>" +
      '<span class="nc-glow" aria-hidden="true"></span><span class="nc-sigil" aria-hidden="true"></span>' +
      '<ul class="nc-orbit">' + orbs + "</ul>" +
      "</div></nav>" +
      '<div class="nc-foot">' +
      '<a class="btn btn-light" href="' + new URL("astrology/", siteRoot).pathname + '#readings">Book a reading</a>' +
      '<div class="nc-social">' + socials.map(function (s) {
        return '<a href="' + s.href + '" target="_blank" rel="noopener" aria-label="' + s.label + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + s.svg + "</svg></a>";
      }).join("") + "</div>" +
      "</div>";

    menu.querySelectorAll(".nc-orb:not([target])").forEach(function (orb) {
      orb.addEventListener("click", function (event) {
        if (event.metaKey || event.ctrlKey || event.shiftKey || orb.getAttribute("aria-current")) return;
        event.preventDefault();
        menu.querySelectorAll(".nc-orb").forEach(function (o) { o.classList.toggle("is-chosen", o === orb); });
        menu.classList.add("is-choosing");
        window.setTimeout(function () { window.location.href = orb.href; }, reduceMotion ? 0 : 520);
      });
    });
  }

  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      setMenu(!document.body.classList.contains("menu-open"));
    });
    menu.querySelectorAll("a").forEach(function (link) {
      if (link.matches(".nc-orb:not([target])")) return;
      link.addEventListener("click", function () { setMenu(false); });
    });
    menu.querySelectorAll(".nc-orb[aria-current]").forEach(function (link) {
      link.addEventListener("click", function (event) {
        event.preventDefault();
        setMenu(false);
      });
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
    window.addEventListener("pageshow", function (event) {
      if (!event.persisted) return;
      menu.style.transition = "none";
      menu.classList.remove("is-choosing");
      menu.querySelectorAll(".is-chosen").forEach(function (o) { o.classList.remove("is-chosen"); });
      setMenu(false);
      void menu.offsetWidth;
      menu.style.transition = "";
    });
  }

  document.querySelectorAll("[data-until]").forEach(function (el) {
    var until = Date.parse(el.getAttribute("data-until"));
    if (!isNaN(until) && Date.now() > until) el.remove();
  });

  var offerSlots = document.querySelectorAll("[data-limited-offer]");
  if (offerSlots.length) {
    var DAY = 86400000;
    var offers = window.LIMITED_OFFERINGS || [];
    var previewDate = new URLSearchParams(window.location.search).get("preview-date");
    var now = previewDate ? Date.parse(previewDate + "T12:00:00-06:00") : Date.now();
    if (isNaN(now)) now = Date.now();

    var esc = function (text) {
      return String(text).replace(/[&<>"]/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
      });
    };
    var shortDate = function (iso) {
      return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "America/Denver" });
    };
    var denverDay = function (ms) {
      return Date.parse(new Date(ms).toLocaleDateString("en-CA", { timeZone: "America/Denver" }));
    };
    var timeLeft = function (closes) {
      var closeMs = Date.parse(closes);
      if (closeMs - now < 6 * 3600000) return "Closing in a few hours";
      var days = Math.round((denverDay(closeMs) - denverDay(now)) / DAY);
      if (days === 0) return "Last day";
      if (days === 1) return "Closes tomorrow";
      return days <= 7 ? days + " days left" : "";
    };
    var byDate = function (key) {
      return function (a, b) { return Date.parse(a[key]) - Date.parse(b[key]); };
    };

    var open = offers.filter(function (o) {
      return Date.parse(o.opens) <= now && now < Date.parse(o.closes);
    }).sort(byDate("closes"))[0];
    var soon = open ? null : offers.filter(function (o) {
      var opens = Date.parse(o.opens);
      return now < opens && opens - now <= (o.announceDays || 21) * DAY;
    }).sort(byDate("opens"))[0];

    var notifyForm = function (label) {
      return '<form class="waitlist portal-notify" data-ml-form data-ml-action="" data-success="You’re on the list. We’ll email you the moment the next portal opens." novalidate>' +
        '<div class="waitlist-fields">' +
        '<label class="visually-hidden" for="portal-email">Email</label>' +
        '<input id="portal-email" type="email" name="fields[email]" placeholder="Email address" autocomplete="email" required>' +
        '<button class="btn btn-light" type="submit">' + esc(label) + "</button>" +
        "</div>" +
        '<p class="waitlist-status" role="status" aria-live="polite"></p>' +
        "</form>";
    };

    var offerCard = function (o, state) {
      var left = state === "open" ? timeLeft(o.closes) : "";
      var status = state === "open"
        ? "Open now · Closes " + shortDate(o.closes)
        : "Opening soon · " + shortDate(o.opens);
      var aside = '<p class="portal-price">' + esc(o.price) + "</p>" +
        (o.priceNote ? '<p class="portal-price-note">' + esc(o.priceNote) + "</p>" : "") +
        '<ul class="portal-includes">' + o.includes.map(function (item) { return "<li>" + esc(item) + "</li>"; }).join("") + "</ul>" +
        (state === "open"
          ? (left ? '<p class="portal-left">' + esc(left) + "</p>" : "") +
            '<a class="btn btn-light portal-cta" href="' + esc(o.url) + '">' + esc(o.cta || "Reserve your reading") + "</a>"
          : notifyForm("Notify me"));
      return '<div class="portal-card reveal" data-state="' + state + '">' +
        '<span class="portal-sigil" aria-hidden="true" style="--art: url(\'' + esc(o.art || "/assets/portal/rose-moons.png") + '\')"></span>' +
        '<div class="portal-main">' +
        '<p class="portal-status"><span class="portal-dot" aria-hidden="true"></span>' + esc(status) + "</p>" +
        '<p class="eyebrow">' + esc(o.kind || "Limited reading") + "</p>" +
        '<h2 class="portal-title">' + esc(o.name) + (o.subtitle ? "<span>" + esc(o.subtitle) + "</span>" : "") + "</h2>" +
        '<p class="portal-summary">' + esc(o.summary) + "</p>" +
        (o.transits ? '<ul class="portal-transits">' + o.transits.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" : "") +
        "</div>" +
        '<div class="portal-aside">' + aside + "</div>" +
        "</div>";
    };

    var nextPortalCard = function () {
      return '<div class="portal-card portal-card--quiet reveal" data-state="none">' +
        '<span class="portal-sigil" aria-hidden="true" style="--art: url(\'/assets/portal/rose-moons.png\')"></span>' +
        '<div class="portal-main">' +
        '<p class="eyebrow">Portal readings</p>' +
        '<h2 class="portal-title">When the sky opens a portal, <em>Carolee opens a reading.</em></h2>' +
        '<p class="portal-summary">A few times a year, around an eclipse, a retrograde, or a powerful full moon, Carolee offers a short reading tuned to that exact transit and how it moves through your chart. Each one is open for a week or two, then it closes.</p>' +
        "</div>" +
        '<div class="portal-aside">' +
        '<p class="portal-aside-label">Hear about the next one first</p>' +
        notifyForm("Tell me") +
        "</div>" +
        "</div>";
    };

    offerSlots.forEach(function (slot) {
      var html = open ? offerCard(open, "open") : soon ? offerCard(soon, "soon") : slot.getAttribute("data-limited-offer") === "notify" ? nextPortalCard() : "";
      if (!html) {
        slot.remove();
        return;
      }
      var target = slot.querySelector("[data-offer-target]") || slot;
      target.innerHTML = html;
      slot.hidden = false;
    });
  }

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
  document.querySelectorAll(".quote-card").forEach(function (card) {
    var quote = card.querySelector("blockquote");
    if (!quote) return;
    card.classList.add("is-clamped");
    if (quote.scrollHeight <= quote.clientHeight + 2) {
      card.classList.remove("is-clamped");
      return;
    }
    var more = document.createElement("button");
    more.type = "button";
    more.className = "quote-more";
    more.textContent = "Read more";
    more.setAttribute("aria-expanded", "false");
    quote.after(more);
    more.addEventListener("click", function () {
      var open = card.classList.toggle("is-clamped") === false;
      more.textContent = open ? "Show less" : "Read more";
      more.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  document.querySelectorAll(".quotes").forEach(function (track) {
    var cards = Array.prototype.slice.call(track.children);
    if (cards.length < 2) return;
    var arrow = function (dir, label) {
      return '<button class="quotes-arrow" type="button" data-dir="' + dir + '" aria-label="' + label + '">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + (dir < 0 ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7") + '"/></svg></button>';
    };
    var nav = document.createElement("div");
    nav.className = "quotes-nav";
    nav.innerHTML = arrow(-1, "Previous testimonial") +
      '<div class="quotes-dots">' + cards.map(function (_, i) {
        return '<button type="button" aria-label="Testimonial ' + (i + 1) + '"></button>';
      }).join("") + "</div>" +
      arrow(1, "Next testimonial");
    track.after(nav);
    var dots = Array.prototype.slice.call(nav.querySelectorAll(".quotes-dots button"));
    var prev = nav.querySelector('[data-dir="-1"]');
    var next = nav.querySelector('[data-dir="1"]');

    var step = function () { return cards[1].offsetLeft - cards[0].offsetLeft; };
    var update = function () {
      var max = track.scrollWidth - track.clientWidth;
      nav.hidden = max < 4;
      var index = Math.round(track.scrollLeft / step());
      dots.forEach(function (dot, i) {
        if (i === index) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });
      prev.disabled = track.scrollLeft < 4;
      next.disabled = track.scrollLeft > max - 4;
    };
    nav.addEventListener("click", function (event) {
      var button = event.target.closest("button");
      if (!button) return;
      var dir = Number(button.getAttribute("data-dir"));
      var left = dir ? track.scrollLeft + dir * step() : dots.indexOf(button) * step();
      track.scrollTo({ left: left, behavior: reduceMotion ? "auto" : "smooth" });
    });
    track.addEventListener("scroll", function () { window.requestAnimationFrame(update); }, { passive: true });
    window.addEventListener("resize", update);
    update();
  });

  var cardVideos = Array.prototype.slice.call(document.querySelectorAll("video[data-src]"));
  if (cardVideos.length && !reduceMotion && "IntersectionObserver" in window) {
    var hoverPlay = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    var playVideo = function (video) {
      if (!video.getAttribute("src") || video.ended) return;
      var playing = video.play();
      if (playing) playing.catch(function () {});
    };
    var videoWatch = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var video = entry.target;
        if (!entry.isIntersecting) {
          if (video.currentSrc) video.pause();
          return;
        }
        if (!video.getAttribute("src")) {
          video.muted = true;
          video.preload = "auto";
          video.addEventListener("playing", function () { video.classList.add("is-playing"); }, { once: true });
          video.addEventListener("error", function () { videoWatch.unobserve(video); }, { once: true });
          video.src = video.getAttribute("data-src");
        }
        if (hoverPlay) {
          if (video.matches(".path-card:hover video")) playVideo(video);
        } else {
          playVideo(video);
        }
      });
    }, { threshold: 0.25 });
    cardVideos.forEach(function (video) {
      videoWatch.observe(video);
      var card = video.closest(".path-card");
      if (!hoverPlay || !card) return;
      var pause = function () { video.pause(); };
      card.addEventListener("mouseenter", function () { playVideo(video); });
      card.addEventListener("mouseleave", pause);
      card.addEventListener("focus", function () { playVideo(video); });
      card.addEventListener("blur", pause);
    });
  }

  var slideshow = document.querySelector("[data-slides]");
  if (slideshow) {
    var slides = Array.prototype.slice.call(slideshow.querySelectorAll(".story-slide"));
    var current = 0;
    if (slides.length > 1) {
      window.setInterval(function () {
        slides[current].classList.remove("is-active");
        current = (current + 1) % slides.length;
        slides[current].classList.add("is-active");
      }, 6500);
    }
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
        status.textContent = form.getAttribute("data-fallback") || "Sign-ups open soon. In the meantime, email us at themagicalstoryofus@gmail.com.";
        return;
      }
      status.textContent = form.getAttribute("data-pending") || "Adding you to the list…";
      fetch(action, { method: "POST", body: new FormData(form), mode: "no-cors" })
        .then(function () {
          form.reset();
          status.textContent = form.getAttribute("data-success") || "You’re on the list. Thank you.";
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

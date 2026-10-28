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

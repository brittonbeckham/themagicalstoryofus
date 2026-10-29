/*
  Limited readings: short, transit-timed offerings Carolee opens for a week or two.

  Each entry shows on the Home and Astrology pages:
    - "Open now" from `opens` until `closes`.
    - "Opening soon" for `announceDays` days before `opens` (default 21), with a notify-me form.
  After `closes` it disappears on its own. When nothing is open or opening soon,
  the Astrology page shows a "next portal" sign-up and the Home page shows nothing.

  Dates are ISO strings with a time zone offset. Mountain Time is -06:00 in summer
  (until the first Sunday of November) and -07:00 in winter.
  Paths start with "/" so they work from any page.

  Preview a date with ?preview-date=YYYY-MM-DD on the Home or Astrology page.
*/
window.LIMITED_OFFERINGS = [
  {
    name: "Retrograde Revelations",
    subtitle: "Your Underworld Portal Reading",
    kind: "Limited transit reading",
    summary: "Venus and Mercury turn back through Scorpio while the Full Moon rises in Taurus. A reading on how this underworld portal moves through your own chart, so you can meet it as powerfully as it meets you.",
    transits: ["Venus retrograde", "Mercury retrograde", "Full Moon in Taurus"],
    includes: [
      "Pre-recorded retrograde teaching",
      "20-minute personal voice-message reading",
      "Three days of direct message access"
    ],
    price: "$66–$88",
    priceNote: "Sliding scale · suggested $77",
    opens: "2026-10-14T00:00:00-06:00",
    closes: "2026-10-28T23:59:00-06:00",
    url: "/portal/",
    cta: "Receive your reading",
    art: "/assets/portal/rose-moons.png"
  }
];

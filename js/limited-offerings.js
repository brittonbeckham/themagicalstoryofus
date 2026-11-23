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
    name: "Awakening Transmission",
    subtitle: "Your Full Moon in Gemini Reading",
    kind: "Limited transit reading",
    summary: "The Full Moon in Gemini rises right beside Uranus, the great awakener, while Mars and Jupiter stand together in Leo. A personal reading of where this full moon and Uranus fall in your chart, and what is ready to awaken in you.",
    transits: ["Full Moon in Gemini", "Uranus", "Mars + Jupiter in Leo"],
    includes: [
      "Your personal Awakening Transmission",
      "Teaching on full moon ritual",
      "My integration support after the full moon"
    ],
    price: "$55",
    priceNote: "Personal reading · ritual teaching · support",
    opens: "2026-11-23T00:00:00-07:00",
    closes: "2026-11-25T23:59:00-07:00",
    url: "/preview/awakening-transmission/#offer",
    cta: "Book your Awakening Transmission"
  },
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
    cta: "Receive your reading"
  }
];

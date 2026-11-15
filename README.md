# The Magical Story of Us

Static site for [themagicalstoryofus.com](https://themagicalstoryofus.com/), hosted on GitHub Pages.

## Pages

- `/`, `/our-story/`, `/astrology/`, `/offerings/`, `/contact/`: the main site. Styles in `css/beta.css`, scripts in `js/`.
- `/portal/`: the active limited portal reading. The Astrology page reads the reading's name from this page's `.p-name-main` heading, so the "Open now" link updates when this page changes.
- `/feedback/`: reading feedback form.
- `/preview/`: draft portal pages.
- `/blog/`, `/single-post/`, `404.html`: pages carried over from the original site.
- `/beta/...`: redirects to the matching main page.

## Deploying

The **Check and deploy site** workflow (`.github/workflows/deploy.yml`) runs on every pull request and every push to `main`:

1. **Check links** (`.github/scripts/check_links.py`) fails if any page or stylesheet points at a local file that does not exist.
2. **Deploy to GitHub Pages** runs after the check passes, on `main` only.

Merge a pull request into `main` and the site deploys within a couple of minutes. GitHub → Settings → Pages has Source set to **GitHub Actions**, and the custom domain `themagicalstoryofus.com` (also in `CNAME`).

## Forms

- Ritual Shadow Work book waitlist (Home, Our Story): MailerLite form "MSOU – Ritual Shadow Work Book Waitlist", group Ritual Shadow Work.
- Portal sign-up (Astrology): "MSOU – Astrology Portal Readings", group Astrology.
- Footer sign-up (every page): "MSOU – Site Footer Subscribe", group Magical Story of Us.
- Contact page: Formspree form `xqpqernd`, emailed to the site's Gmail. The opt-in box also submits the footer form.

Each MailerLite form has a matching confirmation automation in MailerLite.

## Local preview

From this directory:

```bash
python -m http.server 8080
```

Open http://localhost:8080/. Root-relative links such as `/portal/` need the server to run from this directory.

## Notes

- Analytics: Google Analytics `G-JNWGR4YDGB`.
- Podcast links go to the Spotify show.

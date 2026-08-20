# The Magical Story of Us

Static recreation of the live Showit site [themagicalstoryofus.com](https://themagicalstoryofus.com/) for GitHub Pages.

This is a faithful front-end of what visitors actually see: home, our story, astrology, offerings, blog (live placeholder posts), and a 404. Photography-template leftovers from Showit (lorem packages, Gallery 1–6) are not included.

## GitHub Pages

Published from `main`, site root `/`. Preview URL (no custom DNS yet):

https://brittonbeckham.github.io/themagicalstoryofus/

Paths are relative, so this also works later at `themagicalstoryofus.com` once DNS is pointed at GitHub Pages.

### Enable Pages

1. Push this folder to `brittonbeckham/themagicalstoryofus`.
2. GitHub → Settings → Pages → Source: **Deploy from a branch** → `main` / `/ (root)`.
3. Leave custom domain empty until you are ready to cut over `themagicalstoryofus.com`.
4. Check **Enforce HTTPS**.

### DNS cutover (drop Showit)

At your domain registrar, replace Showit’s records with GitHub Pages:

**Apex (`themagicalstoryofus.com`) — A records**

```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

Optional IPv6 AAAA:

```
2606:50c0:8000::153
2606:50c0:8001::153
2606:50c0:8002::153
2606:50c0:8003::153
```

**`www` — CNAME**

```
www  CNAME  brittonbeckham.github.io
```

(If GitHub later shows a different Pages CNAME target in Settings → Pages, use that.)

TTL: 300–3600s. After DNS propagates, HTTPS will provision automatically.

Remove Showit’s old A/CNAME/ANAME records so they do not conflict.

## Local preview

Any static server from this directory:

```bash
python3 -m http.server 8080
```

Open http://localhost:8080/

## Notes

- MailerLite list embed: account `994210`, form `jIKAvz`.
- Analytics: Google Analytics / GTM `G-JNWGR4YDGB` (present on the live site).
- Images are downloaded from `static.showit.co` into `/assets/` — nothing hotlinks Showit.
- Nav **Podcast** → Podbean; footer **Podcast** text + Spotify icon → the Spotify show (matching live).
- Nav **Contact** → `mailto:themagicalstoryofus@gmail.com`.

"""Fail when a page or stylesheet points at a local file that does not exist.

Checks href, src, data-src, poster and srcset in every HTML page, and url() in
every stylesheet. External links, anchors, mailto/tel and data URIs are skipped.
"""
import pathlib
import re
import sys
from urllib.parse import unquote, urlsplit

ROOT = pathlib.Path(__file__).resolve().parents[2]
SKIP_DIRS = {".git", ".github", "node_modules"}
ATTR = re.compile(r'\b(?:href|src|data-src|poster)\s*=\s*"([^"]*)"', re.I)
SRCSET = re.compile(r'\bsrcset\s*=\s*"([^"]*)"', re.I)
CSS_URL = re.compile(r'url\(\s*["\']?([^"\')]+)["\']?\s*\)')


def is_local(ref):
    ref = unquote(ref.strip())
    if not ref or ref.startswith(("#", "{", "data:", "mailto:", "tel:", "javascript:", "//")):
        return False
    return not urlsplit(ref).scheme


def target_for(ref, base_dir):
    path = unquote(urlsplit(ref.strip()).path)
    if not path:
        return None
    resolved = (ROOT / path.lstrip("/")) if path.startswith("/") else (base_dir / path)
    resolved = pathlib.Path(resolved.as_posix())
    if path.endswith("/") or resolved.is_dir():
        resolved = resolved / "index.html"
    return resolved


def files(pattern):
    for path in ROOT.rglob(pattern):
        if not SKIP_DIRS.intersection(path.relative_to(ROOT).parts):
            yield path


def main():
    missing = []
    for page in files("*.html"):
        text = page.read_text(encoding="utf-8", errors="replace")
        refs = ATTR.findall(text)
        for srcset in SRCSET.findall(text):
            refs += [part.strip().split(" ")[0] for part in srcset.split(",") if part.strip()]
        for ref in refs:
            if is_local(ref):
                target = target_for(ref, page.parent)
                if target and not target.exists():
                    missing.append((page, ref))
    for sheet in files("*.css"):
        for ref in CSS_URL.findall(sheet.read_text(encoding="utf-8", errors="replace")):
            if is_local(ref):
                target = target_for(ref, sheet.parent)
                if target and not target.exists():
                    missing.append((sheet, ref))

    for source, ref in missing:
        print(f"{source.relative_to(ROOT).as_posix()}: missing {ref}")
    print(f"Checked links: {len(missing)} missing.")
    return 1 if missing else 0


if __name__ == "__main__":
    sys.exit(main())

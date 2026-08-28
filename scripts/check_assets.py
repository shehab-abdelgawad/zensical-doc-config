#!/usr/bin/env python3
"""Verify that every local asset referenced by a built site actually exists.

Zensical does not validate `extra_css` / `extra_javascript` targets: a missing
file builds cleanly, exits 0, and reports "No issues found" while emitting a
<link>/<script> tag that 404s in the browser. `--strict` does not catch it
either. This script closes that gap.

It exists mainly to catch the two ways the shared config silently breaks:

  * a project sets its own `theme.custom_dir`, replacing the inherited value,
    so nothing under theme_overlay/ ships and every base asset 404s;
  * an asset is renamed in the submodule without updating base.yml.

Usage:
    python scripts/check_assets.py [site_dir] [--base PATH]

`site_dir` defaults to `site`. Pass `--base` when the project sets a `site_url`
with a path, e.g. `https://example.com/docs/` -> `--base /docs/`: root-absolute
references are then emitted with that prefix, which is correct in production but
does not exist under `site_dir`.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlparse

# href="..." on <link>, src="..." on <script>/<img>. Deliberately simple: the
# generated markup is machine-written and predictable.
REF_RE = re.compile(r"""\b(?:href|src)\s*=\s*["']([^"']+)["']""", re.IGNORECASE)

SKIP_PREFIXES = ("http://", "https://", "//", "data:", "mailto:", "javascript:")


def local_refs(html: str) -> set[str]:
    """Return local (non-external, non-anchor) asset references in a document."""
    refs = set()
    for raw in REF_RE.findall(html):
        ref = raw.strip()
        if not ref or ref.startswith("#") or ref.lower().startswith(SKIP_PREFIXES):
            continue
        # Drop query strings and fragments, then percent-decode.
        path = unquote(urlparse(ref).path)
        if path:
            refs.add(path)
    return refs


def resolve(ref: str, page: Path, site: Path, base: str = "") -> Path:
    """Resolve a reference against its containing page, or the site root."""
    if ref.startswith("/"):
        # A `site_url` with a path makes root-absolute refs carry that prefix.
        # Match on the trailing slash so `/docs` never swallows `/docsearch`.
        if base and (ref == base.rstrip("/") or ref.startswith(base)):
            ref = ref[len(base) - 1:]
        return site / ref.lstrip("/")
    return (page.parent / ref).resolve()


def main(argv: list[str]) -> int:
    args = argv[1:]
    base = ""
    if "--base" in args:
        i = args.index("--base")
        if i + 1 >= len(args):
            print("error: --base requires a value, e.g. --base /docs/", file=sys.stderr)
            return 2
        base = "/" + args[i + 1].strip("/") + "/"
        del args[i:i + 2]
    site = Path(args[0] if args else "site")
    if not site.is_dir():
        print(f"error: site directory not found: {site}", file=sys.stderr)
        return 2

    pages = sorted(site.rglob("*.html"))
    if not pages:
        print(f"error: no HTML pages found under {site} - did the build run?",
              file=sys.stderr)
        return 2

    broken: list[tuple[Path, str]] = []
    checked = 0
    for page in pages:
        html = page.read_text(encoding="utf-8", errors="replace")
        for ref in sorted(local_refs(html)):
            target = resolve(ref, page, site, base)
            # Directory-style URLs ("../about/") map to that directory's index.
            if target.is_dir():
                target = target / "index.html"
            checked += 1
            if not target.exists():
                broken.append((page.relative_to(site), ref))

    if broken:
        print(f"BROKEN: {len(broken)} unresolved reference(s) in {site}/\n",
              file=sys.stderr)
        for page, ref in broken:
            print(f"  {page}: {ref}", file=sys.stderr)
        refs = [ref for _, ref in broken]
        if all(ref.startswith("/") for ref in refs) and not base:
            print(
                "\nEvery unresolved reference is root-absolute. If this project "
                "sets a\n`site_url` with a path, that path is prefixed here but "
                "absent from the build\noutput - re-run with e.g. `--base /docs/`.",
                file=sys.stderr,
            )
        elif all("assets/base/" in ref for ref in refs):
            print(
                "\nEvery unresolved reference is a base asset, so the theme "
                "overlay did not ship.\nCheck that theme.custom_dir still points "
                "at the submodule's theme_overlay/.",
                file=sys.stderr,
            )
        else:
            print(
                "\nIf the missing files are under assets/base/, the theme overlay "
                "did not ship:\ncheck that theme.custom_dir still points at the "
                "submodule's theme_overlay/.",
                file=sys.stderr,
            )
        return 1

    print(f"OK: {checked} local reference(s) across {len(pages)} page(s) resolve.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))

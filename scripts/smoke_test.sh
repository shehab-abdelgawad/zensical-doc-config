#!/usr/bin/env bash
#
# End-to-end check that this repo still works as a submodule.
#
#     ./scripts/smoke_test.sh
#
# The dev/ harness cannot cover this. It overrides `theme.custom_dir` to
# `../theme_overlay`, so it never exercises the value real projects get -
# `docs-config/theme_overlay`. Rename theme_overlay/ and dev/ still builds
# green while every consumer 404s. This script builds a throwaway project the
# way a project actually consumes the submodule, and asserts:
#
#   1. the build succeeds under --strict;
#   2. every local reference resolves (check_assets.py);
#   3. all base assets reached site/assets/base/;
#   4. a project's own extra_css is appended, not dropped;
#   5. nothing from the submodule leaks in as a page.

set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -n "${VIRTUAL_ENV:-}" && -x "$VIRTUAL_ENV/bin/zensical" ]]; then
  ZENSICAL="$VIRTUAL_ENV/bin/zensical"
elif [[ -x "$REPO/.venv/bin/zensical" ]]; then
  ZENSICAL="$REPO/.venv/bin/zensical"
else
  echo "error: no zensical found - run 'uv sync' first" >&2
  exit 2
fi

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
PROJECT="$WORK/project"

# Mirror the submodule the way git would: every tracked and every new file,
# honouring .gitignore. Copying the *whole* checkout (README, LICENSE, dev/,
# pyproject) is deliberate - it is what a real project gets, and assertion 5
# depends on it.
mkdir -p "$PROJECT/docs-config"
# (-c also lists staged-but-deleted paths, which tar would choke on, so keep
# only what is actually on disk.)
git -C "$REPO" ls-files -co --exclude-standard -z \
  | (cd "$REPO" && while IFS= read -r -d '' f; do [[ -e "$f" ]] && printf '%s\0' "$f"; done) \
  | tar -C "$REPO" --null -T - -cf - \
  | tar -C "$PROJECT/docs-config" -xf -

mkdir -p "$PROJECT/docs/stylesheets"

cat > "$PROJECT/mkdocs.yml" <<'YAML'
INHERIT: docs-config/base.yml
site_name: Smoke Test

# Deliberately no `theme:` block - the point is to prove the inherited
# custom_dir works untouched. Do not add one.
extra_css:
  - stylesheets/project.css
YAML

echo '/* project override */' > "$PROJECT/docs/stylesheets/project.css"

cat > "$PROJECT/docs/index.md" <<'MD'
# Smoke Test

Math: $E = mc^2$ - emoji: :smile:

```mermaid
graph LR
  A --> B
```
MD

cd "$PROJECT"
"$ZENSICAL" build --strict

fail=0

# Not `set -e`-fatal: a checker failure should not hide assertions 3-5.
python3 "$REPO/scripts/check_assets.py" site || fail=1

# 3. every asset in theme_overlay/ shipped.
while IFS= read -r asset; do
  if [[ ! -f "site/assets/base/$asset" ]]; then
    echo "FAIL: theme_overlay asset did not ship: assets/base/$asset" >&2
    fail=1
  fi
done < <(cd "$REPO/theme_overlay/assets/base" && ls)

# 4. INHERIT still appends project lists rather than replacing the base ones.
grep -q 'assets/base/table_filter.css' site/index.html \
  || { echo "FAIL: base extra_css missing from output" >&2; fail=1; }
grep -q 'stylesheets/project.css' site/index.html \
  || { echo "FAIL: project extra_css was dropped - list append broke" >&2; fail=1; }

# 5. the submodule's own markdown must not become pages.
if find site -name '*.html' | grep -q 'docs-config'; then
  echo "FAIL: submodule content leaked into the site as pages" >&2
  fail=1
fi

if (( fail )); then
  echo "smoke test FAILED" >&2
  exit 1
fi

echo "smoke test OK: consumed as docs-config/, all base assets shipped."

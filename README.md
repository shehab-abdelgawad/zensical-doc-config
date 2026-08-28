# Zensical base documentation config

Shared [Zensical](https://zensical.org) configuration, styles and scripts for all
our documentation sites. Consumed as a **git submodule**, so a fix made once
rolls out everywhere, while each project stays free to add its own CSS and JS
without ever touching this repo.

Provides: Material theme preset (light/dark indigo), KaTeX math, sortable +
filterable tables, and pan/zoom Mermaid diagrams with ELK layout.

## Integrating into a project

**1. Add the submodule at `docs-config/`.** The path matters — see
[Why the path is fixed](#why-the-path-is-fixed).

```bash
git submodule add https://github.com/shehab-abdelgawad/zensical-doc-config.git docs-config
```

**2. Create `mkdocs.yml` in the project root.** That is the whole integration:

```yaml
INHERIT: docs-config/base.yml
site_name: My Project
site_description: Developer documentation for My Project.
site_url: https://example.com/docs/
repo_url: https://github.com/org/my-project
```

**3. If the project already has a `zensical.toml`, delete it.** This is not
optional and it is the single most likely way an integration silently fails.
Zensical resolves config in the order `zensical.toml` → `mkdocs.yml` → 
`mkdocs.yaml` and stops at the first hit, so a leftover `zensical.toml` shadows
your new `mkdocs.yml` entirely: the build succeeds, reports no issues, and
ignores every inherited setting. (`zensical build -f mkdocs.yml` is the escape
hatch if one genuinely must stay.)

**4. Add Zensical, pinned.** See [Version pinning](#version-pinning).

```bash
uv add 'zensical==0.0.57'
```

**5. Build and verify.**

```bash
uv run zensical serve
uv run zensical build && uv run python docs-config/scripts/check_assets.py site
```

If the project's `site_url` has a path (`https://example.com/docs/`), pass it to
the checker — root-absolute references carry that prefix, which is right in
production but absent from `site/`:

```bash
uv run python docs-config/scripts/check_assets.py site --base /docs/
```

### Updating a project to a new version of this config

```bash
git -C docs-config fetch && git -C docs-config checkout <tag-or-sha>
git add docs-config && git commit -m "Bump docs config"
```

Nothing else changes — the submodule pointer is the only thing a project tracks.

## Extending it per-project

`INHERIT` **appends** lists and **overrides** scalars. Add your own assets under
`docs/` and list them; they are appended after the base ones, so they win on CSS
specificity and load after base scripts:

```yaml
INHERIT: docs-config/base.yml
site_name: My Project

extra_css:
  - stylesheets/project.css      # docs/stylesheets/project.css
extra_javascript:
  - javascripts/project.js       # docs/javascripts/project.js
```

Scalars simply replace the inherited value:

```yaml
theme:
  name: material
  logo: assets/logo.svg          # overrides
```

### What projects must not override

| Key | Why |
| --- | --- |
| `theme.custom_dir` | Base assets ship through it. Overriding it silently 404s all of them — the build still reports success. |
| `theme.palette` | Lists append, so a project palette becomes a *third* entry with a broken light/dark toggle chain, not an override. |
| `nav` | Appends rather than replaces. Base ships none, so projects own this outright — just don't add it to `base.yml`. |

If a project genuinely needs its own template overrides, it cannot simply set
`custom_dir`. Add the overriding templates to `theme_overlay/` here instead, or
raise it and we will reshape the overlay.

## Contributing a change to all projects

```bash
uv sync
uv run zensical serve -f dev/mkdocs.yml
```

`dev/` is a working consumer site used only to preview changes to `base.yml` and
`theme_overlay/` before rolling them out. It overrides `theme.custom_dir` to
`../theme_overlay` because from inside this repo the overlay is not at
`docs-config/theme_overlay`.

That override is also `dev/`'s blind spot: it never exercises the `custom_dir`
value real projects get, so renaming `theme_overlay/` leaves `dev/` building
green while every consumer breaks. **Before pushing, run the smoke test** — it
builds a throwaway project that consumes this repo exactly as a submodule:

```bash
./scripts/smoke_test.sh
```

It asserts the build succeeds, every reference resolves, all of
`theme_overlay/assets/base/` shipped, a project's own `extra_css` is still
appended rather than dropped, and nothing from this repo leaks in as a page.
Run it in CI.

## Layout

```
base.yml                     shared config; the INHERIT target
theme_overlay/               shipped verbatim into every site via theme.custom_dir
  assets/base/
    katex.js                 KaTeX auto-render hook
    mermaid.mjs              Mermaid + ELK + svg-pan-zoom renderer
    tablesort.js             sortable/filterable tables
    mermaid-zoom.css
    table_filter.css
scripts/
  check_assets.py            post-build broken-asset check
  smoke_test.sh              builds a throwaway consumer; run before pushing
dev/                         local preview harness (not consumed by projects)
```

## Design notes

### Why the path is fixed

`base.yml` sets `theme.custom_dir: docs-config/theme_overlay`, and Zensical
resolves `custom_dir` relative to the **consuming project's** config file rather
than to `base.yml`. One path must therefore be valid from every project root,
which makes `docs-config/` a hard convention. A project that must mount this repo
elsewhere has to override `theme.custom_dir` in its own `mkdocs.yml` to match.

### Why assets ship via `custom_dir` instead of `docs/`

Zensical deliberately refuses to follow symbolic links pointing outside
`docs_dir` ([zensical#39](https://github.com/zensical/zensical/issues/39)), and
skips them **silently** — a symlinked CSS file simply never appears in the build
while the `<link>` tag is still emitted. So the base assets cannot be linked into
each project's `docs/`. `theme.custom_dir` is
[officially supported](https://zensical.org/docs/customization/) and copies its
contents verbatim into the site, which makes it the one working channel.

Loosening the symlink restriction is on the upstream backlog
([#55](https://github.com/zensical/backlog/issues/55)), as is support for
multiple source directories ([#110](https://github.com/zensical/backlog/issues/110)),
which would be a cleaner fit if it lands.

### Why YAML and not `zensical.toml`

`INHERIT` is implemented only for MkDocs-style YAML config. In `zensical.toml`
the key sits outside the `[project]` table and is discarded without warning, so
the inherited file is silently ignored — there is no TOML equivalent today.
Tracked upstream as [zensical#503](https://github.com/zensical/zensical/issues/503)
→ backlog [#126](https://github.com/zensical/backlog/issues/126), still open.

### Why `check_assets.py` exists

Zensical does not validate `extra_css` / `extra_javascript` targets. A missing
file builds cleanly, exits 0 and prints "No issues found" — even under
`--strict` — while emitting a tag that 404s. Both failure modes above are
silent, so run the checker in CI. `scripts/smoke_test.sh` wraps it in a full
consumer build, which is the only way the shipping `custom_dir` path gets
tested at all.

### Version pinning

Pin `zensical==0.0.57` rather than a floating range. This setup relies on
`custom_dir` as an asset channel and on `INHERIT` merge semantics, and Zensical's
[roadmap](https://zensical.org/about/roadmap/) states configuration will be
"completely rethought" around **presets** — which will eventually be the right
home for this repo. `base.yml` is deliberately kept a flat list of shared keys
with no project-specific values so that port stays mechanical. Upgrade
deliberately, and run the checker afterwards.

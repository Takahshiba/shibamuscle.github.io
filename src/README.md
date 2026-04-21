# Source Structure

`src/` is the editable source of truth for the site pages that are generated into the repo root.

- `catalog.json`
  Shared exercise library data used by the homepage and exercise pages.
- `exercises/*.json`
  One file per exercise slug. Each file keeps:
  - shared exercise data such as the Japanese name, image, muscle groups, and shared section blocks
  - source-driven `metadata` for category labels, measurement kind, primary muscles, descriptions, tags, and SEO copy
  - `kg` / `lb` variant blocks for the average and standards sections
- `taxonomy.json`
  Canonical category labels, aliases, and shared vocabulary used to normalize section names and search terms.
- `pages/*.json`
  Source content for shared static pages like the homepage, contact page, and privacy policy.

Build flow:

```bash
node scripts/build-site.mjs
```

The build also:

- syncs exercise metadata back into `src/exercises/*.json` and `src/catalog.json`
- generates dedicated OG assets in `assets/og/`
- audits SEO, analytics, and breadcrumbs

Bootstrap / re-extract source from the current generated HTML:

```bash
node scripts/extract-exercise-source.mjs
```

The generated root HTML files are build outputs. Edit `src/` instead of editing the generated exercise pages directly.

Today this covers the homepage, contact page, privacy policy, and all exercise pages. `Shift2ics.html` is still hand-maintained because it is a standalone PDF tool with its own inline runtime.

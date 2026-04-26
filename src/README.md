# Source Structure

`src/` is the editable source of truth for the site pages that are generated into the repo root and locale subdirectories.

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
- `locales.json`
  Locale routing and SEO configuration. Japanese is generated at `/`; Korean is generated under `/ko/`; Traditional Chinese is generated under `/zh-hant/`; Simplified Chinese is generated under `/zh-hans/`.

Build flow:

```bash
node scripts/build-site.mjs
```

The build also:

- syncs exercise metadata back into `src/exercises/*.json` and `src/catalog.json`
- generates dedicated OG assets in `assets/og/`
- audits SEO, analytics, breadcrumbs, locale routing, and Korean output quality

Bootstrap / re-extract source from the current generated HTML:

```bash
node scripts/extract-exercise-source.mjs
```

The generated root HTML files and `/ko/` HTML files are build outputs. Edit `src/` instead of editing the generated exercise pages directly.

Today this covers the homepage, contact page, privacy policy, and all exercise pages. `Shift2ics.html` is still hand-maintained because it is a standalone PDF tool with its own inline runtime.

Localization notes:

- Japanese exercise numeric data, standards, and section structure are canonical.
- Korean pages reuse the same filenames and slugs under `/ko/`.
- Traditional Chinese pages reuse the same filenames and slugs under `/zh-hant/`.
- Simplified Chinese pages reuse the same filenames and slugs under `/zh-hans/`.
- Korean copy should use natural Korean gym terminology and must not visibly fall back to Japanese.
- Traditional Chinese copy should use natural Traditional Chinese gym terminology and must not visibly fall back to Japanese or Simplified Chinese.
- Simplified Chinese copy should use natural Simplified Chinese gym terminology and must not visibly fall back to Japanese or Traditional Chinese.
- SEO normalization owns canonical, hreflang, OG/Twitter tags, footer language URLs, and sitemap entries for generated locales.

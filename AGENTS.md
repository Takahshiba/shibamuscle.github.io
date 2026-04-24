# AGENTS.md

## Repository rules
- `src/` is the editable source of truth.
- Do not hand-edit generated HTML unless there is a documented exception.
- Prefer changing source data and build scripts, then regenerating output.

## Build and verification
- Run `node scripts/build-site.mjs` before finishing.
- Keep Japanese root output working.
- Treat build warnings or audit failures as blockers unless clearly documented.

## Localization rules
- Japanese numeric data and section structure are canonical.
- Localized copy should sound natural in the target locale.
- Use common local fitness/gym terminology rather than literal translation.
- Keep slugs and filenames shared across locales.
- Japanese stays at `/`.
- Korean is generated under `/ko/`.
- Default unit is `kg`.

## SEO rules
- Update canonical, hreflang, sitemap, OG, and internal language links for locale changes.
- Do not ship localized pages with missing localized title, description, or H1.

## QA rules
- Check for untranslated source strings in completed locales.
- Check section/schema drift versus Japanese canonical pages.
- Check broken internal links.
- Keep locale diffs reviewable.

## Dependency policy
- Avoid adding new dependencies unless clearly justified.
- Prefer extending existing Node scripts and source structure.

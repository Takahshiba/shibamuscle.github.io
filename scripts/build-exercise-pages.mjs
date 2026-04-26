#!/usr/bin/env node

import { writeFileSync } from "node:fs";
import { join } from "node:path";

import {
    cleanSectionLabel,
    escapeAttribute,
    escapeHtml,
    renderAdSlot,
    renderBreadcrumb,
    renderDocument,
    renderExerciseLibrary,
    renderStaticFooter,
    renderStaticHeader
} from "./site-template.mjs";
import {
    assetHref,
    buildExerciseDescription,
    buildExerciseSeo,
    buildExerciseSeoDescription,
    buildExerciseSummary,
    buildOutputPath,
    getCategoryLabel,
    getExerciseName,
    getGeneratedLocales,
    getLocalizedMuscleGroups,
    getMeasurementCopy,
    getRelatedTags,
    getUiText,
    localizeExerciseHtml,
    stylesheetHref
} from "./localization.mjs";
import { ensureDirectory, loadCatalog, loadExercises } from "./source-data.mjs";

const catalog = loadCatalog();
const exercises = loadExercises();
const locales = getGeneratedLocales();
assertExpectedLocales(locales);

let generatedPages = 0;

for (const locale of locales) {
    if (locale.outputDir) {
        ensureDirectory(join(process.cwd(), locale.outputDir));
    }

    console.log(`Generating exercise pages for ${locale.code}...`);

    for (const exercise of exercises) {
        for (const [unit, variant] of Object.entries(exercise.variants)) {
            const html = renderExercisePage(exercise, catalog, unit, variant, locale.code);
            writeFileSync(buildOutputPath(variant.file, locale.code), html);
            generatedPages += 1;

            if (generatedPages % 500 === 0) {
                console.log(`Generated ${generatedPages} exercise pages...`);
            }
        }
    }
}

console.log(`Generated ${generatedPages} localized exercise pages from src/.`);

function assertExpectedLocales(locales) {
    const localeCodes = locales.map((locale) => locale.code);
    if (!localeCodes.includes("zh-hans")) {
        throw new Error(`zh-hans locale is required for this build. Active locales: ${localeCodes.join(", ")}`);
    }
    if (!localeCodes.includes("de")) {
        throw new Error(`de locale is required for this build. Active locales: ${localeCodes.join(", ")}`);
    }
}

function renderExercisePage(exercise, catalogData, unit, variant, locale) {
    const name = getExerciseName(exercise, locale);
    const currentFile = variant.file;
    const currentCategory = catalogData.sections.find((section) => section.id === exercise.categoryId);
    const measurementKind = exercise.metadata?.measurementKind || "weight";
    const measurementCopy = getMeasurementCopy(measurementKind, locale);
    const title = buildExerciseSeo(exercise, measurementKind, unit, locale).title;
    const categoryLabel = getCategoryLabel(currentCategory || exercise.categoryId, locale);
    const summary = buildExerciseSummary(exercise, currentCategory, measurementKind, locale);
    const description = buildExerciseDescription(exercise, currentCategory, measurementKind, locale);
    const seoDescription = buildExerciseSeoDescription(exercise, currentCategory, measurementKind, unit, locale);
    const relatedTags = getRelatedTags(exercise, exercise.categoryId, locale);
    const unitSwitchHtml = `<div class="toggle-buttons">
                <a href="kg_${exercise.slug}.html"${unit === "kg" ? ' class="active"' : ""}>kg</a>
                <a href="lb_${exercise.slug}.html"${unit === "lb" ? ' class="active"' : ""}>lb</a>
            </div>`;
    const body = `${renderStaticHeader({ pageType: "exercise", unitSwitchHtml, locale })}

    <hr class="top-divider">

    <main class="page-main"
        data-exercise-slug="${escapeAttribute(exercise.slug)}"
        data-category-id="${escapeAttribute(exercise.categoryId)}"
        data-category-label="${escapeAttribute(categoryLabel)}"
        data-measurement-kind="${escapeAttribute(measurementKind)}"
        data-average-label="${escapeAttribute(measurementCopy.averageLabel)}"
        data-standards-label="${escapeAttribute(measurementCopy.standardsLabel)}"
        data-summary="${escapeAttribute(summary)}"
        data-description="${escapeAttribute(description)}"
        data-primary-muscles="${escapeAttribute((getLocalizedPrimaryMuscles(exercise, locale)).join(" | "))}"
        data-related-tags="${escapeAttribute(relatedTags.join(" | "))}">
${renderBreadcrumb([
        { label: getUiText(locale, "home"), href: "index.html" },
        { label: cleanSectionLabel(categoryLabel, locale), href: `index.html#${exercise.categoryId || "whole-body-section"}` },
        { label: name }
    ], locale)}
        ${renderHero(exercise, measurementCopy, locale)}
        ${renderMuscles(exercise, locale)}
${renderAdSlot()}
        ${localizeExerciseHtml(variant.averageBlock, { exercise, unit, locale, block: "average" }).trim()}
        ${localizeExerciseHtml(variant.standardsBlock, { exercise, unit, locale, block: "standards" }).trim()}
        ${exercise.sharedBlocks.records ? localizeExerciseHtml(exercise.sharedBlocks.records, { exercise, unit, locale, block: "records" }).trim() : ""}
        ${exercise.sharedBlocks.about ? localizeExerciseHtml(exercise.sharedBlocks.about, { exercise, unit, locale, block: "about" }).trim() : ""}
${renderAdSlot()}
${renderExerciseLibrary(catalogData, { unit, locale })}
${renderAdSlot()}
    </main>

${renderStaticFooter(currentFile, locale)}

    <script src="${stylesheetHref("app.js", locale)}"></script>
`;

    return renderDocument({
        title,
        stylesheets: ["styles.css"],
        body,
        locale,
        seo: {
            file: currentFile,
            description: seoDescription,
            ogImage: `https://shibamuscle.com/assets/og/exercises/${exercise.slug}.svg`,
            type: "article",
            twitterCard: "summary_large_image"
        },
        generatedComment: "<!-- Generated by scripts/build-exercise-pages.mjs. Edit src/exercises/*.json and src/catalog.json instead of editing this file directly. -->"
    });
}

function renderHero(exercise, measurementCopy, locale) {
    const tags = getRelatedTags(exercise, exercise.categoryId, locale).filter((tag) => tag !== measurementCopy.pageTerm).slice(0, 5);
    const name = getExerciseName(exercise, locale);
    const summary = buildExerciseSummary(exercise, null, exercise.metadata?.measurementKind || "weight", locale);

    return `
    <div class="container">
        <div class="main-image-title">
            <h1>${escapeHtml(name)}</h1>
            <p class="hero-description">${escapeHtml(summary)}</p>
            <div class="muscle-chip-row">
                <span class="muscle-chip">${escapeHtml(measurementCopy.averageLabel)}</span>
                ${tags.map((tag) => `<span class="muscle-chip">${escapeHtml(tag)}</span>`).join("")}
            </div>
            <img loading="eager" src="${escapeAttribute(assetHref(exercise.image.src, locale))}" alt="${escapeAttribute(name)}" class="workout-main-image">
        </div>
    </div>
`;
}

function renderMuscles(exercise, locale) {
    const groups = getLocalizedMuscleGroups(exercise, locale);
    return `
    <div class="container">
        <h2 class="section-title">${escapeHtml(getUiText(locale, "musclesHeading"))}</h2>
        <table class="muscle-activated-table">
            <thead>
                <tr>
                    <th>${escapeHtml(getUiText(locale, "group"))}</th>
                    <th>${escapeHtml(getUiText(locale, "muscles"))}</th>
                </tr>
            </thead>
            <tbody>
                ${groups.map((group) => {
                    return `
                <tr>
                    <th>${escapeHtml(group.label)}</th>
                    <td>${escapeHtml(group.items.join(", "))}</td>
                </tr>
`;
                }).join("")}
            </tbody>
        </table>
    </div>
`;
}

function getLocalizedPrimaryMuscles(exercise, locale) {
    return getLocalizedMuscleGroups(exercise, locale)[0]?.items || [];
}

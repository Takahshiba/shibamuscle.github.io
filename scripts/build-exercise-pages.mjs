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
const APP_THEME_COLOR = "#ff6a00";
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
    const requiredLocales = ["ja", "ko", "zh-hant", "zh-hans", "es", "fr", "de", "en"];
    const missingLocales = requiredLocales.filter((locale) => !localeCodes.includes(locale));

    if (missingLocales.length) {
        throw new Error(`${missingLocales.join(", ")} locale(s) are required for this build. Active locales: ${localeCodes.join(", ")}`);
    }
}

function renderExercisePage(exercise, catalogData, unit, variant, locale) {
    const name = getExerciseName(exercise, locale);
    const currentFile = variant.file;
    const canonicalFile = `kg_${exercise.slug}.html`;
    const isIndexableUnit = unit === "kg";
    const currentCategory = catalogData.sections.find((section) => section.id === exercise.categoryId);
    const measurementKind = exercise.metadata?.measurementKind || "weight";
    const measurementCopy = getMeasurementCopy(measurementKind, locale);
    const title = buildExerciseSeo(exercise, measurementKind, unit, locale).title;
    const categoryLabel = getCategoryLabel(currentCategory || exercise.categoryId, locale);
    const summary = buildExerciseSummary(exercise, currentCategory, measurementKind, locale);
    const description = buildExerciseDescription(exercise, currentCategory, measurementKind, locale);
    const seoDescription = buildExerciseSeoDescription(exercise, currentCategory, measurementKind, unit, locale);
    const relatedTags = getRelatedTags(exercise, exercise.categoryId, locale);
    const postMusclesAdSlotHtml = isIndexableUnit ? renderAdSlot("after-muscles") : "";
    const postDetailsAdSlotHtml = isIndexableUnit ? renderAdSlot("after-details") : "";
    const preFooterAdSlotHtml = isIndexableUnit ? renderAdSlot("before-footer") : "";
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
        { label: cleanSectionLabel(categoryLabel, locale), href: `#${exercise.categoryId || "whole-body-section"}` },
        { label: name }
    ], locale)}
${renderHero(exercise, locale)}
${renderAverageSummary(exercise, variant, measurementKind, locale)}
${renderLocalizedExerciseBlock(variant.averageBlock, { exercise, unit, locale, block: "average" })}
${renderLocalizedExerciseBlock(variant.standardsBlock, { exercise, unit, locale, block: "standards" })}
${renderMuscles(exercise, locale)}
${postMusclesAdSlotHtml}
${renderAppAnalysisCta(locale)}
${exercise.sharedBlocks.records ? renderLocalizedExerciseBlock(exercise.sharedBlocks.records, { exercise, unit, locale, block: "records" }) : ""}
${exercise.sharedBlocks.about ? renderLocalizedExerciseBlock(exercise.sharedBlocks.about, { exercise, unit, locale, block: "about" }) : ""}
${postDetailsAdSlotHtml}
${renderExerciseLibrary(catalogData, { unit, locale })}
${preFooterAdSlotHtml}
    </main>

${renderStaticFooter(currentFile, locale)}

    <script src="${stylesheetHref("app.js?v=category-jump-20260704", locale)}"></script>
`;

    return renderDocument({
        title,
        stylesheets: ["styles.css"],
        body,
        locale,
        seo: {
            file: currentFile,
            canonicalFile,
            description: seoDescription,
            ogImage: `https://shibamuscle.com/assets/og/exercises/${exercise.slug}.svg`,
            includeAlternates: isIndexableUnit,
            robots: isIndexableUnit ? "index,follow,max-image-preview:large" : "noindex,follow,noarchive",
            type: "article",
            twitterCard: "summary_large_image",
            themeColor: APP_THEME_COLOR
        },
        ads: isIndexableUnit,
        bodyClass: "exercise-page",
        generatedComment: "<!-- Generated by scripts/build-exercise-pages.mjs. Edit src/exercises/*.json and src/catalog.json instead of editing this file directly. -->"
    });
}

function renderLocalizedExerciseBlock(html, options) {
    return localizeExerciseHtml(html, options).trim().replace(/[ \t]+$/gm, "");
}

function renderHero(exercise, locale) {
    const name = getExerciseName(exercise, locale);
    const summary = buildExerciseSummary(exercise, null, exercise.metadata?.measurementKind || "weight", locale);
    const appCta = getExerciseHeroCtaText(locale);

    return `
    <section class="container exercise-hero">
        <div class="exercise-hero-copy">
            <h1>${escapeHtml(name)}</h1>
            <p class="hero-description">${escapeHtml(summary)}</p>
            <div class="exercise-hero-actions">
                <a href="index.html#app-store" class="exercise-hero-cta">${escapeHtml(appCta)}</a>
            </div>
        </div>
        <div class="exercise-hero-media">
            <img loading="eager" src="${escapeAttribute(assetHref(exercise.image.src, locale))}" alt="${escapeAttribute(name)}" class="workout-main-image">
        </div>
    </section>
`;
}

function renderAverageSummary(exercise, variant, measurementKind, locale) {
    const snapshot = extractAverageSnapshot(variant.averageBlock);
    if (!snapshot) {
        return "";
    }

    const measurementCopy = getMeasurementCopy(measurementKind, locale);
    const copy = getAverageSummaryCopy(locale, measurementCopy);
    const maleLabel = getUiText(locale, "male");
    const femaleLabel = getUiText(locale, "female");
    const statCards = [
        renderAverageStatCard(maleLabel, snapshot.male),
        renderAverageStatCard(femaleLabel, snapshot.female)
    ].join("\n");

    return `
    <section class="container exercise-average-summary" aria-labelledby="average-summary-title">
        <div class="exercise-average-summary-copy">
            <h2 id="average-summary-title">${escapeHtml(copy.title)}</h2>
            <p>${escapeHtml(copy.note)}</p>
        </div>
        <div class="exercise-average-summary-grid">
${statCards}
        </div>
    </section>
`;
}

function renderAverageStatCard(label, value) {
    return `            <div class="exercise-stat-card">
                <span class="exercise-stat-label">${escapeHtml(label)}</span>
                <strong class="exercise-stat-value">${escapeHtml(value)}</strong>
            </div>`;
}

function renderAppAnalysisCta(locale) {
    const copy = getAppAnalysisCtaCopy(locale);

    return `
    <section class="container exercise-app-cta-band">
        <div>
            <h2>${escapeHtml(copy.title)}</h2>
            <p>${escapeHtml(copy.description)}</p>
        </div>
        <a href="index.html#app-store" class="exercise-app-cta-button">${escapeHtml(copy.cta)}</a>
    </section>
`;
}

function renderMuscles(exercise, locale) {
    const groups = getLocalizedMuscleGroups(exercise, locale);
    const rows = groups.map((group) => {
        return `                <tr>
                    <th>${escapeHtml(group.label)}</th>
                    <td>${escapeHtml(group.items.join(", "))}</td>
                </tr>`;
    }).join("\n");

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
${rows}
            </tbody>
        </table>
    </div>
`;
}

function getLocalizedPrimaryMuscles(exercise, locale) {
    return getLocalizedMuscleGroups(exercise, locale)[0]?.items || [];
}

function extractAverageSnapshot(averageBlock) {
    const rows = extractTableRows(averageBlock);
    const row = rows.find((current) => current[0] === "中級") || rows[0];
    if (!row?.[1] || !row?.[2]) {
        return null;
    }

    return {
        label: row[0],
        male: row[1],
        female: row[2]
    };
}

function extractTableRows(tableHtml) {
    const body = (tableHtml.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i) || [])[1] || "";

    return Array.from(body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)).map((match) => {
        return Array.from(match[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)).map((cell) => {
            return normalizeTableCell(cell[1]);
        });
    });
}

function normalizeTableCell(html) {
    return decodeHtml(stripTags(html.replace(/<br\s*\/?>/gi, " "))).replace(/\s+/g, " ").trim();
}

function stripTags(html) {
    return html.replace(/<[^>]+>/g, "");
}

function decodeHtml(text) {
    const named = {
        amp: "&",
        lt: "<",
        gt: ">",
        quot: "\"",
        apos: "'",
        nbsp: " "
    };

    return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
        if (entity[0] === "#") {
            const codePoint = entity[1].toLowerCase() === "x" ? Number.parseInt(entity.slice(2), 16) : Number.parseInt(entity.slice(1), 10);
            return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
        }

        return named[entity.toLowerCase()] || match;
    });
}

function getAverageSummaryCopy(locale, measurementCopy) {
    const level = getIntermediateLabel(locale);
    const copy = {
        ja: {
            title: `${level}の${measurementCopy.averageLabel}`,
            note: "平均的な中級者の目安です。"
        },
        ko: {
            title: `${level} ${measurementCopy.averageLabel}`,
            note: "평균적인 중급자의 기준입니다."
        },
        "zh-hant": {
            title: `${level}${measurementCopy.averageLabel}`,
            note: "一般中級訓練者的參考值。"
        },
        "zh-hans": {
            title: `${level}${measurementCopy.averageLabel}`,
            note: "一般中级训练者的参考值。"
        },
        es: {
            title: `${measurementCopy.averageLabel}: ${level}`,
            note: "Referencia para una persona de nivel intermedio."
        },
        fr: {
            title: `${measurementCopy.averageLabel} : ${level}`,
            note: "Repère pour une personne de niveau intermédiaire."
        },
        de: {
            title: `${measurementCopy.averageLabel}: ${level}`,
            note: "Richtwert für eine Person auf mittlerem Niveau."
        },
        id: {
            title: `${measurementCopy.averageLabel}: ${level}`,
            note: "Acuan untuk level menengah."
        }
    };

    return copy[locale] || {
        title: `${measurementCopy.averageLabel}: ${level}`,
        note: "Reference for an intermediate lifter."
    };
}

function getIntermediateLabel(locale) {
    const labels = {
        ja: "中級",
        ko: "중급",
        "zh-hant": "中級",
        "zh-hans": "中级",
        es: "Intermedio",
        fr: "Intermédiaire",
        de: "Mittelstufe",
        id: "Menengah"
    };

    return labels[locale] || "Intermediate";
}

function getAppAnalysisCtaCopy(locale) {
    const copy = {
        ja: {
            title: "記録と分析はShibaアプリで",
            description: "重量、回数、成長の変化をまとめて確認できます。",
            cta: "アプリを見る"
        },
        ko: {
            title: "기록과 분석은 Shiba 앱에서",
            description: "중량, 반복 횟수, 성장 변화를 한곳에서 확인할 수 있습니다.",
            cta: "앱 보기"
        },
        "zh-hant": {
            title: "用 Shiba App 記錄與分析",
            description: "集中查看重量、次數與進步變化。",
            cta: "查看 App"
        },
        "zh-hans": {
            title: "用 Shiba App 记录与分析",
            description: "集中查看重量、次数与进步变化。",
            cta: "查看 App"
        },
        es: {
            title: "Registra y analiza en la app Shiba",
            description: "Consulta pesos, repeticiones y progreso en un solo lugar.",
            cta: "Ver la app"
        },
        fr: {
            title: "Suivi et analyse dans l'app Shiba",
            description: "Consultez poids, répétitions et progression au même endroit.",
            cta: "Voir l'app"
        },
        de: {
            title: "Tracking und Analyse in der Shiba App",
            description: "Gewichte, Wiederholungen und Fortschritt an einem Ort.",
            cta: "App ansehen"
        },
        id: {
            title: "Catat dan analisis di aplikasi Shiba",
            description: "Lihat beban, repetisi, dan perkembangan di satu tempat.",
            cta: "Lihat aplikasi"
        }
    };

    return copy[locale] || {
        title: "Track and analyze in the Shiba app",
        description: "Review weight, reps, and progress in one place.",
        cta: "View app"
    };
}

function getExerciseHeroCtaText(locale) {
    const text = {
        ja: "Shibaアプリを見る",
        ko: "Shiba 앱 보기",
        "zh-hant": "查看 Shiba App",
        "zh-hans": "查看 Shiba App",
        es: "Ver la app Shiba",
        fr: "Voir l'app Shiba",
        de: "Shiba App ansehen",
        id: "Lihat aplikasi Shiba"
    };

    return text[locale] || "View Shiba App";
}

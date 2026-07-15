#!/usr/bin/env node

import { writeFileSync } from "node:fs";
import { join } from "node:path";

import {
    escapeAttribute,
    escapeHtml,
    imageSizeAttributes,
    renderAdSlot,
    renderBreadcrumb,
    renderDocument,
    renderExerciseLibrary,
    renderStaticFooter,
    renderStaticHeader
} from "./site-template.mjs";
import {
    absoluteUrlForFile,
    assetHref,
    buildExerciseDescription,
    buildExerciseSeo,
    buildExerciseSeoDescription,
    buildExerciseSummary,
    buildOutputPath,
    getCategoryLabel,
    getExerciseName,
    getGeneratedLocales,
    getLocaleConfig,
    getLocalizedMuscleGroups,
    getMeasurementCopy,
    getRelatedTags,
    getUiText,
    localizeExerciseHtml,
    stylesheetHref
} from "./localization.mjs";
import {
    CATALOG_PATH,
    EXERCISE_SRC_ROOT,
    ensureDirectory,
    getSourceCreatedIso,
    getSourceLastmodIso,
    loadCatalog,
    loadExercises,
    loadSlugAliases
} from "./source-data.mjs";

const catalog = loadCatalog();
const exercises = loadExercises();
const slugAliases = loadSlugAliases();
const exerciseBySlug = new Map(exercises.map((exercise) => [exercise.slug, exercise]));
const locales = getGeneratedLocales();
const SITE_ORIGIN = "https://shibamuscle.com";
const APP_THEME_COLOR = "#ff6a00";
const INDEXABLE_ROBOTS = "index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1";
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

    for (const [legacySlug, canonicalSlug] of Object.entries(slugAliases)) {
        const exercise = exerciseBySlug.get(canonicalSlug);
        if (!exercise) {
            throw new Error(`Legacy slug ${legacySlug} points to missing canonical exercise ${canonicalSlug}`);
        }

        for (const unit of Object.keys(exercise.variants)) {
            const aliasFile = `${unit}_${legacySlug}.html`;
            const html = renderLegacyExerciseAliasPage(exercise, legacySlug, unit, aliasFile, locale.code);
            writeFileSync(buildOutputPath(aliasFile, locale.code), html);
            generatedPages += 1;
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
    const datePublished = getExerciseDatePublished(exercise);
    const dateModified = getExerciseDateModified(exercise);
    const canonicalUrl = absoluteUrlForFile(canonicalFile, locale);
    const relatedTags = getRelatedTags(exercise, exercise.categoryId, locale);
    const primaryMuscles = getLocalizedPrimaryMuscles(exercise, locale);
    const homeUrl = absoluteUrlForFile("index.html", locale);
    const breadcrumbs = [
        { label: getUiText(locale, "home"), href: homeUrl },
        { label: getUiText(locale, "exerciseLibrary"), href: `exercises.html#${exercise.categoryId || "whole-body-section"}` },
        { label: name }
    ];
    const postMusclesAdSlotHtml = isIndexableUnit ? renderAdSlot("after-muscles") : "";
    const postDetailsAdSlotHtml = isIndexableUnit ? renderAdSlot("after-details") : "";
    const preFooterAdSlotHtml = isIndexableUnit ? renderAdSlot("before-footer") : "";
    const kgSwitchAttributes = unit === "kg" ? ' class="active" aria-current="page"' : "";
    const lbSwitchAttributes = unit === "lb" ? ' class="active" aria-current="page"' : ' rel="nofollow"';
    const unitSwitchHtml = `<div class="toggle-buttons">
                <a href="kg_${exercise.slug}.html"${kgSwitchAttributes}>kg</a>
                <a href="lb_${exercise.slug}.html"${lbSwitchAttributes}>lb</a>
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
        data-primary-muscles="${escapeAttribute(primaryMuscles.join(" | "))}"
        data-related-tags="${escapeAttribute(relatedTags.join(" | "))}">
${renderBreadcrumb(breadcrumbs, locale)}
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
${renderExerciseLibrary(catalogData, { unit, locale, includeCardImages: false })}
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
            ogImageAlt: summary,
            includeAlternates: isIndexableUnit,
            robots: isIndexableUnit ? INDEXABLE_ROBOTS : "noindex,follow,noarchive",
            type: "article",
            twitterCard: "summary_large_image",
            themeColor: APP_THEME_COLOR,
            webPageType: "ItemPage",
            preloadImages: isIndexableUnit ? [assetHref(exercise.image.src, locale)] : [],
            articlePublishedTime: isIndexableUnit ? datePublished : null,
            articleModifiedTime: isIndexableUnit ? dateModified : null,
            articleSection: isIndexableUnit ? categoryLabel : null,
            articleTags: isIndexableUnit ? relatedTags : [],
            breadcrumbs,
            mainEntity: isIndexableUnit ? [
                { "@id": `${canonicalUrl}#article` },
                { "@id": `${canonicalUrl}#dataset` },
                { "@id": `${canonicalUrl}#exercise` }
            ] : null,
            datePublished: isIndexableUnit ? datePublished : null,
            dateModified,
            structuredData: buildExerciseStructuredData({
                exercise,
                unit,
                locale,
                canonicalFile,
                title,
                datePublished,
                dateModified,
                description,
                seoDescription,
                summary,
                categoryLabel,
                measurementKind,
                relatedTags,
                primaryMuscles
            })
        },
        ads: isIndexableUnit,
        bodyClass: "exercise-page",
        generatedComment: "<!-- Generated by scripts/build-exercise-pages.mjs. Edit src/exercises/*.json and src/catalog.json instead of editing this file directly. -->"
    });
}

function renderLegacyExerciseAliasPage(exercise, legacySlug, unit, aliasFile, locale) {
    const name = getExerciseName(exercise, locale);
    const targetFile = `${unit}_${exercise.slug}.html`;
    const canonicalFile = `kg_${exercise.slug}.html`;
    const copy = getLegacyAliasCopy(locale, name);
    const breadcrumbs = [
        { label: getUiText(locale, "home"), href: absoluteUrlForFile("index.html", locale) },
        { label: name, href: targetFile }
    ];
    const body = `${renderStaticHeader({ pageType: "content", locale })}

    <hr class="top-divider">
    <main class="page-main" data-legacy-exercise-slug="${escapeAttribute(legacySlug)}" data-canonical-exercise-slug="${escapeAttribute(exercise.slug)}">
${renderBreadcrumb(breadcrumbs, locale)}
        <section class="container content-shell legacy-exercise-alias">
            <div class="content-intro">
                <h1>${escapeHtml(copy.heading)}</h1>
                <p>${escapeHtml(copy.message)}</p>
                <p><a href="${escapeAttribute(targetFile)}">${escapeHtml(copy.link)}</a></p>
            </div>
        </section>
    </main>

${renderStaticFooter(targetFile, locale)}

    <script>window.location.replace(${JSON.stringify(targetFile)} + window.location.hash);</script>
`;

    return renderDocument({
        title: copy.title,
        stylesheets: ["styles.css"],
        body,
        locale,
        seo: {
            file: aliasFile,
            canonicalFile,
            description: copy.description,
            ogImage: `${SITE_ORIGIN}/assets/og/exercises/${exercise.slug}.svg`,
            ogImageAlt: name,
            includeAlternates: false,
            robots: "noindex,follow,noarchive",
            type: "website",
            twitterCard: "summary_large_image",
            themeColor: APP_THEME_COLOR
        },
        enableAds: false,
        bodyClass: "content-page legacy-exercise-alias-page",
        generatedComment: "<!-- Generated legacy exercise URL alias. Edit src/slug-aliases.json instead of editing this file directly. -->"
    });
}

function getLegacyAliasCopy(locale, name) {
    const copy = {
        ja: {
            heading: "ページを移動しました",
            message: `${name}の詳細ページは新しいURLで公開しています。自動的に移動します。`,
            link: "新しいページを開く"
        },
        ko: {
            heading: "페이지가 이동되었습니다",
            message: `${name} 상세 페이지는 새 URL에서 제공됩니다. 자동으로 이동합니다.`,
            link: "새 페이지 열기"
        },
        "zh-hant": {
            heading: "頁面已移動",
            message: `${name}的詳細頁面已移至新網址，系統將自動前往。`,
            link: "開啟新頁面"
        },
        "zh-hans": {
            heading: "页面已移动",
            message: `${name}的详细页面已移至新网址，系统将自动前往。`,
            link: "打开新页面"
        },
        es: {
            heading: "La página se ha trasladado",
            message: `La página de ${name} está disponible en una URL nueva. Te redirigiremos automáticamente.`,
            link: "Abrir la página nueva"
        },
        fr: {
            heading: "La page a été déplacée",
            message: `La page de ${name} est disponible à une nouvelle adresse. Redirection automatique en cours.`,
            link: "Ouvrir la nouvelle page"
        },
        de: {
            heading: "Die Seite wurde verschoben",
            message: `Die Detailseite für ${name} ist unter einer neuen URL verfügbar. Du wirst automatisch weitergeleitet.`,
            link: "Neue Seite öffnen"
        },
        id: {
            heading: "Halaman telah dipindahkan",
            message: `Halaman detail ${name} tersedia di URL baru. Anda akan dialihkan secara otomatis.`,
            link: "Buka halaman baru"
        },
        en: {
            heading: "This page has moved",
            message: `The ${name} detail page now has a new URL. You will be redirected automatically.`,
            link: "Open the new page"
        }
    };
    const localized = copy[locale] || copy.en;

    return {
        ...localized,
        title: `${localized.heading} | Shiba Muscle`,
        description: localized.message
    };
}

function buildExerciseStructuredData({ exercise, unit, locale, canonicalFile, title, datePublished, dateModified, description, seoDescription, summary, categoryLabel, measurementKind, relatedTags, primaryMuscles }) {
    if (unit !== "kg") {
        return [];
    }

    const canonicalUrl = absoluteUrlForFile(canonicalFile, locale);
    const dataCatalogId = `${canonicalUrl}#exercise-data-catalog`;
    const dataCatalogUrl = `${canonicalUrl}#other-workouts`;
    const name = getExerciseName(exercise, locale);
    const measurementCopy = getMeasurementCopy(measurementKind, locale);
    const exerciseTermId = `${canonicalUrl}#exercise`;
    const imageUrl = absoluteAssetUrl(exercise.image.src);
    const ogImageUrl = `${SITE_ORIGIN}/assets/og/exercises/${exercise.slug}.svg`;
    const publisher = { "@id": `${SITE_ORIGIN}/#organization` };
    const publishingPrinciplesUrl = absoluteUrlForFile("methodology.html", locale);
    const licenseUrl = absoluteUrlForFile("data-terms.html", locale);
    const keywordText = relatedTags.join(", ");
    const datasetId = `${canonicalUrl}#dataset`;
    const muscleMentions = primaryMuscles.map((muscle) => ({
        "@type": "AnatomicalStructure",
        name: muscle
    }));

    return [
        {
            "@type": "DefinedTerm",
            "@id": exerciseTermId,
            name,
            description: summary || description || seoDescription,
            termCode: exercise.slug,
            inDefinedTermSet: {
                "@type": "DefinedTermSet",
                name: categoryLabel,
                url: `${canonicalUrl}#${exercise.categoryId || "whole-body-section"}`
            }
        },
        {
            "@type": "Article",
            "@id": `${canonicalUrl}#article`,
            headline: title.replace(/\s*\|\s*Shiba Muscle$/, ""),
            name,
            description: seoDescription,
            url: canonicalUrl,
            inLanguage: getLocaleConfig(locale).hreflang,
            datePublished,
            dateModified,
            image: [ogImageUrl, imageUrl],
            mainEntityOfPage: { "@id": `${canonicalUrl}#webpage` },
            articleSection: categoryLabel,
            keywords: keywordText,
            about: { "@id": exerciseTermId },
            mentions: muscleMentions,
            author: publisher,
            publisher,
            publishingPrinciples: publishingPrinciplesUrl,
            isAccessibleForFree: true
        },
        {
            "@type": "DataCatalog",
            "@id": dataCatalogId,
            name: getExerciseDataCatalogName(locale),
            description: getExerciseDataCatalogDescription(locale),
            url: dataCatalogUrl,
            inLanguage: getLocaleConfig(locale).hreflang,
            publisher,
            dataset: { "@id": datasetId },
            publishingPrinciples: publishingPrinciplesUrl
        },
        {
            "@type": "Dataset",
            "@id": datasetId,
            identifier: datasetId,
            name: `${name} ${measurementCopy.averageLabel} / ${measurementCopy.standardsLabel} (${unit})`,
            description: seoDescription,
            url: canonicalUrl,
            inLanguage: getLocaleConfig(locale).hreflang,
            datePublished,
            dateModified,
            image: ogImageUrl,
            keywords: relatedTags,
            about: { "@id": exerciseTermId },
            creator: publisher,
            publisher,
            publishingPrinciples: publishingPrinciplesUrl,
            license: licenseUrl,
            includedInDataCatalog: { "@id": dataCatalogId },
            isAccessibleForFree: true,
            variableMeasured: [
                `${measurementCopy.averageLabel} (${unit})`,
                `${measurementCopy.standardsLabel} (${unit})`,
                measurementCopy.detailLabel,
                ...primaryMuscles
            ],
            measurementTechnique: getDatasetMeasurementTechnique(measurementKind, locale)
        }
    ];
}

function getDatasetMeasurementTechnique(measurementKind, locale) {
    const techniques = {
        ja: {
            reps: "性別、体重、年齢別の平均レップ数と基準レップ数の表です。",
            weight: "性別、体重、年齢別の平均重量と筋力基準の表です。"
        },
        ko: {
            reps: "성별, 체중, 나이별 평균 반복 횟수와 기준 반복 횟수 표입니다.",
            weight: "성별, 체중, 나이별 평균 중량과 근력 기준 표입니다."
        },
        "zh-hant": {
            reps: "依性別、體重與年齡整理的平均次數與標準次數表。",
            weight: "依性別、體重與年齡整理的平均重量與肌力標準表。"
        },
        "zh-hans": {
            reps: "按性别、体重和年龄整理的平均次数与标准次数表。",
            weight: "按性别、体重和年龄整理的平均重量与力量标准表。"
        },
        es: {
            reps: "Tablas de repeticiones medias y estándares de repeticiones por sexo, peso corporal y edad.",
            weight: "Tablas de peso medio y estándares de fuerza por sexo, peso corporal y edad."
        },
        fr: {
            reps: "Tableaux de répétitions moyennes et de standards de répétitions par sexe, poids corporel et âge.",
            weight: "Tableaux de poids moyen et de standards de force par sexe, poids corporel et âge."
        },
        de: {
            reps: "Tabellen zu durchschnittlichen Wiederholungen und Wiederholungsstandards nach Geschlecht, Körpergewicht und Alter.",
            weight: "Tabellen zu Durchschnittsgewicht und Kraftstandards nach Geschlecht, Körpergewicht und Alter."
        },
        id: {
            reps: "Tabel repetisi rata-rata dan standar repetisi berdasarkan jenis kelamin, berat badan, dan usia.",
            weight: "Tabel berat rata-rata dan standar kekuatan berdasarkan jenis kelamin, berat badan, dan usia."
        },
        en: {
            reps: "Average rep and rep standard tables by sex, bodyweight, and age.",
            weight: "Average load and strength standard tables by sex, bodyweight, and age."
        }
    };
    const kind = measurementKind === "reps" ? "reps" : "weight";

    return techniques[locale]?.[kind] || techniques.en[kind];
}

function getExerciseDataCatalogName(locale) {
    const names = {
        ja: "Shiba Muscle 筋力基準データ",
        ko: "Shiba Muscle 근력 기준 데이터",
        "zh-hant": "Shiba Muscle 肌力標準資料",
        "zh-hans": "Shiba Muscle 力量标准数据",
        es: "Datos de estándares de fuerza de Shiba Muscle",
        fr: "Données de standards de force Shiba Muscle",
        de: "Shiba Muscle Kraftstandard-Daten",
        id: "Data standar kekuatan Shiba Muscle",
        en: "Shiba Muscle Strength Standards Data"
    };

    return names[locale] || names.en;
}

function getExerciseDataCatalogDescription(locale) {
    const descriptions = {
        ja: "種目別の平均重量、基準重量、体重別・年齢別の筋力基準をまとめたShiba Muscleのデータカタログです。",
        ko: "운동별 평균 중량, 기준 중량, 체중 및 나이별 근력 기준을 모은 Shiba Muscle 데이터 카탈로그입니다.",
        "zh-hant": "Shiba Muscle 的資料目錄，彙整各動作平均重量、標準重量，以及依體重與年齡區分的肌力標準。",
        "zh-hans": "Shiba Muscle 的数据目录，汇总各动作平均重量、标准重量，以及按体重和年龄划分的力量标准。",
        es: "Catálogo de datos de Shiba Muscle con pesos medios, estándares de fuerza y tablas por peso corporal y edad para cada ejercicio.",
        fr: "Catalogue de données Shiba Muscle avec charges moyennes, standards de force et tableaux par poids corporel et âge pour chaque exercice.",
        de: "Shiba Muscle Datenkatalog mit Durchschnittsgewichten, Kraftstandards sowie Tabellen nach Körpergewicht und Alter für jede Übung.",
        id: "Katalog data Shiba Muscle berisi rata-rata beban, standar kekuatan, serta tabel berdasarkan berat badan dan usia untuk setiap latihan.",
        en: "Shiba Muscle data catalog covering average loads, strength standards, and bodyweight and age tables for each exercise."
    };

    return descriptions[locale] || descriptions.en;
}

function getExerciseDatePublished(exercise) {
    return getSourceCreatedIso(join(EXERCISE_SRC_ROOT, `${exercise.slug}.json`));
}

function getExerciseDateModified(exercise) {
    return getSourceLastmodIso([
        join(EXERCISE_SRC_ROOT, `${exercise.slug}.json`),
        CATALOG_PATH
    ]);
}

function absoluteAssetUrl(file) {
    if (/^https?:\/\//i.test(file || "")) {
        return file;
    }

    return `${SITE_ORIGIN}/assets/${String(file || "").replace(/^\.?\/?assets\//, "")}`;
}

function renderLocalizedExerciseBlock(html, options) {
    return normalizeTargetBlankRel(normalizeContentImageLoading(normalizeRecordFlagAltText(localizeExerciseHtml(html, options), options.locale))).trim().replace(/[ \t]+$/gm, "");
}

function normalizeRecordFlagAltText(html, locale) {
    return html.replace(/<img\b(?=[^>]*countryflags\.com)(?=[^>]*\bclass="[^"]*\bflag-icon\b[^"]*")[^>]*\salt="([^"]*)"[^>]*>/gi, (tag, alt) => {
        const cleanAlt = alt.trim();
        if (!cleanAlt || isDescriptiveFlagAlt(cleanAlt)) {
            return tag;
        }

        return tag.replace(/\salt="[^"]*"/i, ` alt="${escapeAttribute(buildRecordFlagAlt(cleanAlt, locale))}"`);
    });
}

function isDescriptiveFlagAlt(value) {
    return /flag|国旗|國旗|Bandera|Drapeau|Flagge|Bendera/i.test(value);
}

function buildRecordFlagAlt(country, locale) {
    if (locale === "ja") {
        return `${country}の国旗`;
    }

    if (locale === "ko") {
        return `${country} 국기`;
    }

    if (locale === "zh-hant") {
        return `${country}國旗`;
    }

    if (locale === "zh-hans") {
        return `${country}国旗`;
    }

    if (locale === "es") {
        return `Bandera de ${country}`;
    }

    if (locale === "fr") {
        return `Drapeau de ${country}`;
    }

    if (locale === "de") {
        return `Flagge ${country}`;
    }

    if (locale === "id") {
        return `Bendera ${country}`;
    }

    return `${country} flag`;
}

function normalizeContentImageLoading(html) {
    return html.replace(/<img\b[^>]*>/gi, (tag) => {
        let next = tag;

        if (!/\sloading="/i.test(next)) {
            next = next.replace(/>$/, ' loading="lazy">');
        }

        if (!/\sdecoding="/i.test(next)) {
            next = next.replace(/>$/, ' decoding="async">');
        }

        if (/\sloading="lazy"/i.test(next) && !/\sfetchpriority="/i.test(next)) {
            next = next.replace(/>$/, ' fetchpriority="low">');
        }

        if (!/\swidth="/i.test(next) || !/\sheight="/i.test(next)) {
            const sizeAttributes = getContentImageSizeAttributes(next);
            if (sizeAttributes) {
                next = next
                    .replace(/\swidth=(?:"[^"]*"|'[^']*'|[^\s>]+)/i, "")
                    .replace(/\sheight=(?:"[^"]*"|'[^']*'|[^\s>]+)/i, "")
                    .replace(/>$/, `${sizeAttributes}>`);
            }
        }

        return next;
    });
}

function getContentImageSizeAttributes(tag) {
    const src = tag.match(/\ssrc="([^"]+)"/i)?.[1] || "";
    if (!src) {
        return "";
    }

    if (/countryflags\.com/i.test(src) || /\bclass="[^"]*\bflag-icon\b/i.test(tag)) {
        return imageSizeAttributes(src, { fallbackWidth: "32", fallbackHeight: "20" });
    }

    if (/\bclass="[^"]*\bprofile-photo\b/i.test(tag)) {
        return imageSizeAttributes(src, { fallbackWidth: "64", fallbackHeight: "64" });
    }

    return imageSizeAttributes(src);
}

function normalizeTargetBlankRel(html) {
    return html.replace(/<a\b(?=[^>]*\btarget=(?:"_blank"|'_blank'|_blank))[^>]*>/gi, (tag) => {
        const relAttributePattern = /\srel=(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i;
        const relMatch = tag.match(relAttributePattern);
        const tokens = new Set((relMatch?.[1] || relMatch?.[2] || relMatch?.[3] || "").split(/\s+/).filter(Boolean));

        tokens.add("noopener");
        tokens.add("noreferrer");

        const relAttribute = ` rel="${escapeAttribute(Array.from(tokens).join(" "))}"`;
        if (relMatch) {
            return tag.replace(relAttributePattern, relAttribute);
        }

        return tag.replace(/>$/, `${relAttribute}>`);
    });
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
                <a href="${escapeAttribute(`${absoluteUrlForFile("index.html", locale)}#app-store`)}" class="exercise-hero-cta">${escapeHtml(appCta)}</a>
            </div>
        </div>
        <div class="exercise-hero-media">
            <img loading="eager" fetchpriority="high" decoding="async" src="${escapeAttribute(assetHref(exercise.image.src, locale))}" alt="${escapeAttribute(name)}" class="workout-main-image"${imageSizeAttributes(assetHref(exercise.image.src, locale))}>
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
        <a href="${escapeAttribute(`${absoluteUrlForFile("index.html", locale)}#app-store`)}" class="exercise-app-cta-button">${escapeHtml(copy.cta)}</a>
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

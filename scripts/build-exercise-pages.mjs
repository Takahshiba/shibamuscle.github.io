#!/usr/bin/env node

import { writeFileSync } from "node:fs";
import { join } from "node:path";

import {
    escapeAttribute,
    escapeHtml,
    getAppStoreUrl,
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
    const requiredLocales = ["ja", "ko", "zh-hant", "zh-hans", "es", "fr", "de", "id", "pt-br", "en"];
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
${isIndexableUnit ? renderStrengthLevelTool(exercise, unit, measurementKind, locale) : ""}
${renderLocalizedExerciseBlock(variant.standardsBlock, { exercise, unit, locale, block: "standards" })}
${renderMuscles(exercise, locale)}
${postMusclesAdSlotHtml}
${renderAppAnalysisCta(exercise, locale)}
${exercise.sharedBlocks.records ? renderLocalizedExerciseBlock(exercise.sharedBlocks.records, { exercise, unit, locale, block: "records" }) : ""}
${exercise.sharedBlocks.about ? renderLocalizedExerciseBlock(exercise.sharedBlocks.about, { exercise, unit, locale, block: "about" }) : ""}
${postDetailsAdSlotHtml}
${renderExerciseLibrary(catalogData, {
        unit,
        locale,
        includeCardImages: false,
        sectionIds: [exercise.categoryId],
        excludeSlugs: [exercise.slug],
        cardLimit: 12,
        currentSlug: exercise.slug,
        viewAllHref: `exercises.html#${exercise.categoryId || "whole-body-section"}`,
        viewAllText: getUiText(locale, "exerciseLibrary")
    })}
${preFooterAdSlotHtml}
    </main>

${renderStaticFooter(currentFile, locale)}

    <script src="${stylesheetHref("app.js?v=site-ui-20260716", locale)}"></script>
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
            appleAppId: isIndexableUnit ? "6785443075" : "",
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
        "pt-br": {
            heading: "Esta página foi movida",
            message: `A página de detalhes de ${name} está disponível em uma nova URL. Você será redirecionado automaticamente.`,
            link: "Abrir a nova página"
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
        "pt-br": {
            reps: "Tabelas de repetições médias e padrões de repetições por sexo, peso corporal e idade.",
            weight: "Tabelas de carga média e padrões de força por sexo, peso corporal e idade."
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
        "pt-br": "Dados de padrões de força do Shiba Muscle",
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
        "pt-br": "Catálogo de dados do Shiba Muscle com cargas médias, padrões de força e tabelas por peso corporal e idade para cada exercício.",
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
    return /flag|国旗|國旗|Bandera|Drapeau|Flagge|Bendera|Bandeira/i.test(value);
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

    if (locale === "pt-br") {
        return `Bandeira de ${country}`;
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
    const appCta = getExerciseHeroCtaText(locale, name);

    return `
    <section class="container exercise-hero">
        <div class="exercise-hero-copy">
            <h1>${escapeHtml(name)}</h1>
            <p class="hero-description">${escapeHtml(summary)}</p>
            <div class="exercise-hero-actions">
                <a href="${escapeAttribute(getAppStoreUrl(locale))}" class="exercise-hero-cta" target="_blank" rel="noopener noreferrer external" data-analytics-link="app-store" data-analytics-placement="exercise_hero">${escapeHtml(appCta)}</a>
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

function renderStrengthLevelTool(exercise, unit, measurementKind, locale) {
    const name = getExerciseName(exercise, locale);
    const copy = getStrengthLevelToolCopy(locale, measurementKind, name);
    const isWeight = measurementKind !== "reps";
    const isPerDumbbell = isWeight && /ダンベル1個あたり/.test(exercise.variants?.[unit]?.standardsBlock || "");
    const loadQualifier = isPerDumbbell ? getPerDumbbellQualifier(locale) : "";
    const valueField = isWeight
        ? `                <label class="strength-level-field">
                    <span>${escapeHtml(copy.loadLabel)}${escapeHtml(loadQualifier)} (${escapeHtml(unit)})</span>
                    <input type="number" min="0.5" step="0.5" inputmode="decimal" autocomplete="off" required data-level-load>
                </label>
                <label class="strength-level-field">
                    <span>${escapeHtml(copy.repsLabel)}</span>
                    <input type="number" min="1" max="12" step="1" inputmode="numeric" autocomplete="off" value="1" required data-level-reps>
                </label>`
        : `                <label class="strength-level-field">
                    <span>${escapeHtml(copy.repsLabel)}</span>
                    <input type="number" min="1" step="1" inputmode="numeric" autocomplete="off" required data-level-reps>
                </label>`;

    return `
    <section class="container strength-level-tool" data-strength-level-tool
        data-measurement-kind="${escapeAttribute(measurementKind)}"
        data-unit="${escapeAttribute(unit)}"
        data-below-label="${escapeAttribute(copy.belowLabel)}"
        data-result-template="${escapeAttribute(copy.resultTemplate)}"
        data-estimate-template="${escapeAttribute(copy.estimateTemplate)}"
        data-next-template="${escapeAttribute(copy.nextTemplate)}"
        data-top-template="${escapeAttribute(copy.topTemplate)}"
        data-reference-template="${escapeAttribute(copy.referenceTemplate)}"
        data-error-message="${escapeAttribute(copy.errorMessage)}">
        <div class="strength-level-copy">
            <p class="eyebrow">${escapeHtml(copy.eyebrow)}</p>
            <h2>${escapeHtml(copy.title)}</h2>
            <p>${escapeHtml(copy.description)}</p>
        </div>
        <form class="strength-level-form" data-level-form>
            <div class="strength-level-fields">
                <label class="strength-level-field">
                    <span>${escapeHtml(copy.genderLabel)}</span>
                    <select data-level-gender>
                        <option value="Male">${escapeHtml(getUiText(locale, "male"))}</option>
                        <option value="Female">${escapeHtml(getUiText(locale, "female"))}</option>
                    </select>
                </label>
                <label class="strength-level-field">
                    <span>${escapeHtml(copy.bodyweightLabel)} (${escapeHtml(unit)})</span>
                    <input type="number" min="20" max="700" step="0.5" inputmode="decimal" autocomplete="off" required data-level-bodyweight>
                </label>
${valueField}
            </div>
            <button type="submit" class="strength-level-submit">${escapeHtml(copy.submit)}</button>
        </form>
        <p class="strength-level-live" data-level-live role="status" aria-live="polite" aria-atomic="true"></p>
        <div class="strength-level-result" data-level-result hidden>
            <span class="strength-level-result-label">${escapeHtml(copy.resultLabel)}</span>
            <strong data-level-result-primary></strong>
            <p data-level-result-estimate></p>
            <p data-level-result-next></p>
            <a href="${escapeAttribute(getAppStoreUrl(locale))}" target="_blank" rel="noopener noreferrer external" data-analytics-link="app-store" data-analytics-placement="level_result">${escapeHtml(copy.appCta)}</a>
        </div>
        <p class="strength-level-note">${escapeHtml(copy.note)} <a href="methodology.html">${escapeHtml(copy.methodology)}</a></p>
    </section>
`;
}

function getPerDumbbellQualifier(locale) {
    const qualifiers = {
        ja: "（ダンベル1個あたり）",
        ko: " (덤벨 1개 기준)",
        "zh-hant": "（每支啞鈴）",
        "zh-hans": "（每只哑铃）",
        es: " (por mancuerna)",
        fr: " (par haltère)",
        de: " (pro Hantel)",
        id: " (per dumbel)",
        "pt-br": " (por halter)",
        en: " (per dumbbell)"
    };

    return qualifiers[locale] || qualifiers.en;
}

function getStrengthLevelToolCopy(locale, measurementKind, name) {
    const isWeight = measurementKind !== "reps";
    const copy = {
        ja: {
            eyebrow: "あなたの現在地",
            title: isWeight ? `${name}の推定1RMとレベルを計算` : `${name}のレベルを確認`,
            description: isWeight ? "実際に挙げた重量と回数から推定1RMを計算し、体重別の基準と比較します。" : "1セットでできた回数を、体重別の基準と比較します。",
            genderLabel: "性別", bodyweightLabel: "体重", loadLabel: "挙げた重量", repsLabel: isWeight ? "回数（1〜12回）" : "できた回数", submit: "レベルを判定",
            resultLabel: "判定結果", belowLabel: "基礎未満", resultTemplate: "目安レベル: {level}", estimateTemplate: isWeight ? "推定1RM: {value} {unit}" : "入力した回数: {value}回", nextTemplate: isWeight ? "次の「{level}」基準は約{value} {unit}です。" : "次の「{level}」基準は約{value}回です。", topTemplate: "最上位の基準を満たしています。", referenceTemplate: "体重{bodyweight} {unit}の基準を使って判定しました。", errorMessage: "入力値と基準表を確認してください。",
            appCta: `${name}をShibaで記録`, note: "推定値は目安です。フォーム、可動域、疲労などで結果は変わります。", methodology: "計算方法を見る"
        },
        ko: {
            eyebrow: "나의 현재 위치", title: isWeight ? `${name} 추정 1RM과 레벨 계산` : `${name} 레벨 확인`, description: isWeight ? "실제로 든 중량과 반복 횟수로 추정 1RM을 계산해 체중별 기준과 비교합니다." : "한 세트에서 수행한 횟수를 체중별 기준과 비교합니다.",
            genderLabel: "성별", bodyweightLabel: "체중", loadLabel: "사용 중량", repsLabel: isWeight ? "반복 횟수(1~12회)" : "수행 횟수", submit: "레벨 확인", resultLabel: "결과", belowLabel: "입문 미만", resultTemplate: "예상 레벨: {level}", estimateTemplate: isWeight ? "추정 1RM: {value} {unit}" : "입력 횟수: {value}회", nextTemplate: isWeight ? "다음 ‘{level}’ 기준은 약 {value} {unit}입니다." : "다음 ‘{level}’ 기준은 약 {value}회입니다.", topTemplate: "최상위 기준을 충족했습니다.", referenceTemplate: "체중 {bodyweight} {unit} 기준으로 판정했습니다.", errorMessage: "입력값과 기준표를 확인해 주세요.", appCta: `Shiba에서 ${name} 기록하기`, note: "추정치는 참고용입니다. 자세, 가동 범위, 피로도에 따라 달라질 수 있습니다.", methodology: "계산 방법 보기"
        },
        "zh-hant": {
            eyebrow: "你的目前位置", title: isWeight ? `計算${name}估算 1RM 與等級` : `查看${name}等級`, description: isWeight ? "依實際重量與次數估算 1RM，並和體重標準比較。" : "將單組完成次數和體重標準比較。", genderLabel: "性別", bodyweightLabel: "體重", loadLabel: "實際重量", repsLabel: isWeight ? "次數（1–12 次）" : "完成次數", submit: "判定等級", resultLabel: "判定結果", belowLabel: "低於初學者", resultTemplate: "參考等級：{level}", estimateTemplate: isWeight ? "估算 1RM：{value} {unit}" : "輸入次數：{value} 次", nextTemplate: isWeight ? "下一個「{level}」標準約為 {value} {unit}。" : "下一個「{level}」標準約為 {value} 次。", topTemplate: "已達最高等級標準。", referenceTemplate: "依體重 {bodyweight} {unit} 的標準判定。", errorMessage: "請確認輸入值與標準表。", appCta: `用 Shiba 記錄${name}`, note: "估算結果僅供參考，姿勢、活動範圍與疲勞都會影響結果。", methodology: "查看計算方式"
        },
        "zh-hans": {
            eyebrow: "你的当前位置", title: isWeight ? `计算${name}估算 1RM 与等级` : `查看${name}等级`, description: isWeight ? "根据实际重量与次数估算 1RM，并与体重标准比较。" : "将单组完成次数与体重标准比较。", genderLabel: "性别", bodyweightLabel: "体重", loadLabel: "实际重量", repsLabel: isWeight ? "次数（1–12 次）" : "完成次数", submit: "判断等级", resultLabel: "判断结果", belowLabel: "低于初学者", resultTemplate: "参考等级：{level}", estimateTemplate: isWeight ? "估算 1RM：{value} {unit}" : "输入次数：{value} 次", nextTemplate: isWeight ? "下一个“{level}”标准约为 {value} {unit}。" : "下一个“{level}”标准约为 {value} 次。", topTemplate: "已达到最高等级标准。", referenceTemplate: "按体重 {bodyweight} {unit} 的标准判断。", errorMessage: "请检查输入值与标准表。", appCta: `用 Shiba 记录${name}`, note: "估算结果仅供参考，动作姿势、活动范围和疲劳都会影响结果。", methodology: "查看计算方式"
        },
        es: {
            eyebrow: "Tu nivel actual", title: isWeight ? `Calcula el 1RM estimado y nivel de ${name}` : `Comprueba tu nivel de ${name}`, description: isWeight ? "Calcula el 1RM estimado con el peso y las repeticiones reales y compáralo con el estándar por peso corporal." : "Compara las repeticiones de una serie con el estándar por peso corporal.", genderLabel: "Sexo", bodyweightLabel: "Peso corporal", loadLabel: "Peso levantado", repsLabel: isWeight ? "Repeticiones (1–12)" : "Repeticiones logradas", submit: "Calcular nivel", resultLabel: "Resultado", belowLabel: "Por debajo de principiante", resultTemplate: "Nivel orientativo: {level}", estimateTemplate: isWeight ? "1RM estimado: {value} {unit}" : "Repeticiones: {value}", nextTemplate: isWeight ? "El siguiente nivel, «{level}», está cerca de {value} {unit}." : "El siguiente nivel, «{level}», está cerca de {value} repeticiones.", topTemplate: "Cumples el estándar del nivel más alto.", referenceTemplate: "Calculado con el estándar para {bodyweight} {unit} de peso corporal.", errorMessage: "Revisa los valores y la tabla de estándares.", appCta: `Registrar ${name} en Shiba`, note: "Es una estimación. La técnica, el rango de movimiento y la fatiga pueden cambiar el resultado.", methodology: "Ver el método"
        },
        fr: {
            eyebrow: "Ton niveau actuel", title: isWeight ? `Calcul du 1RM estimé et du niveau en ${name}` : `Vérifier ton niveau en ${name}`, description: isWeight ? "Estime le 1RM à partir de la charge et des répétitions, puis compare-le au standard par poids de corps." : "Compare les répétitions d’une série au standard par poids de corps.", genderLabel: "Sexe", bodyweightLabel: "Poids de corps", loadLabel: "Charge soulevée", repsLabel: isWeight ? "Répétitions (1–12)" : "Répétitions réalisées", submit: "Calculer le niveau", resultLabel: "Résultat", belowLabel: "En dessous du niveau débutant", resultTemplate: "Niveau indicatif : {level}", estimateTemplate: isWeight ? "1RM estimé : {value} {unit}" : "Répétitions : {value}", nextTemplate: isWeight ? "Le niveau suivant « {level} » se situe vers {value} {unit}." : "Le niveau suivant « {level} » se situe vers {value} répétitions.", topTemplate: "Le standard du niveau le plus élevé est atteint.", referenceTemplate: "Calcul avec le standard correspondant à {bodyweight} {unit} de poids de corps.", errorMessage: "Vérifie les valeurs et le tableau de standards.", appCta: `Noter ${name} dans Shiba`, note: "Cette estimation reste indicative. Technique, amplitude et fatigue peuvent modifier le résultat.", methodology: "Voir la méthode"
        },
        de: {
            eyebrow: "Dein aktueller Stand", title: isWeight ? `Geschätztes 1RM und Level für ${name}` : `Level für ${name} prüfen`, description: isWeight ? "Berechne aus Gewicht und Wiederholungen das geschätzte 1RM und vergleiche es mit dem Körpergewichtsstandard." : "Vergleiche Wiederholungen pro Satz mit dem Körpergewichtsstandard.", genderLabel: "Geschlecht", bodyweightLabel: "Körpergewicht", loadLabel: "Bewegtes Gewicht", repsLabel: isWeight ? "Wiederholungen (1–12)" : "Erreichte Wiederholungen", submit: "Level berechnen", resultLabel: "Ergebnis", belowLabel: "Unter Einsteiger-Niveau", resultTemplate: "Richtwert-Level: {level}", estimateTemplate: isWeight ? "Geschätztes 1RM: {value} {unit}" : "Wiederholungen: {value}", nextTemplate: isWeight ? "Das nächste Level „{level}“ liegt bei etwa {value} {unit}." : "Das nächste Level „{level}“ liegt bei etwa {value} Wiederholungen.", topTemplate: "Der höchste Standard ist erreicht.", referenceTemplate: "Berechnet mit dem Standard für {bodyweight} {unit} Körpergewicht.", errorMessage: "Prüfe Eingaben und Standardtabelle.", appCta: `${name} in Shiba loggen`, note: "Die Schätzung ist ein Richtwert. Technik, Bewegungsumfang und Ermüdung verändern das Ergebnis.", methodology: "Methode ansehen"
        },
        id: {
            eyebrow: "Posisimu saat ini", title: isWeight ? `Hitung estimasi 1RM dan level ${name}` : `Cek level ${name}`, description: isWeight ? "Hitung estimasi 1RM dari beban dan repetisi lalu bandingkan dengan standar berat badan." : "Bandingkan repetisi satu set dengan standar berat badan.", genderLabel: "Jenis kelamin", bodyweightLabel: "Berat badan", loadLabel: "Beban yang diangkat", repsLabel: isWeight ? "Repetisi (1–12)" : "Repetisi tercapai", submit: "Hitung level", resultLabel: "Hasil", belowLabel: "Di bawah pemula", resultTemplate: "Perkiraan level: {level}", estimateTemplate: isWeight ? "Estimasi 1RM: {value} {unit}" : "Repetisi: {value}", nextTemplate: isWeight ? "Level berikutnya, “{level}”, sekitar {value} {unit}." : "Level berikutnya, “{level}”, sekitar {value} repetisi.", topTemplate: "Standar level tertinggi telah tercapai.", referenceTemplate: "Dihitung dengan standar berat badan {bodyweight} {unit}.", errorMessage: "Periksa input dan tabel standar.", appCta: `Catat ${name} di Shiba`, note: "Hasil ini hanya perkiraan. Teknik, rentang gerak, dan kelelahan dapat mengubah hasil.", methodology: "Lihat metode"
        },
        "pt-br": {
            eyebrow: "Seu nível atual", title: isWeight ? `Calcule o 1RM estimado e o nível de ${name}` : `Confira seu nível em ${name}`, description: isWeight ? "Estime o 1RM pela carga e repetições realizadas e compare com padrões por peso corporal." : "Compare as repetições de uma série com padrões por peso corporal.", genderLabel: "Sexo", bodyweightLabel: "Peso corporal", loadLabel: "Carga levantada", repsLabel: isWeight ? "Repetições (1–12)" : "Repetições feitas", submit: "Calcular nível", resultLabel: "Resultado", belowLabel: "Abaixo de iniciante", resultTemplate: "Nível estimado: {level}", estimateTemplate: isWeight ? "1RM estimado: {value} {unit}" : "Repetições informadas: {value}", nextTemplate: isWeight ? "O próximo padrão “{level}” fica perto de {value} {unit}." : "O próximo padrão “{level}” fica perto de {value} repetições.", topTemplate: "Você atinge o padrão mais alto exibido.", referenceTemplate: "Calculado com o padrão para {bodyweight} {unit} de peso corporal.", errorMessage: "Confira os valores e a tabela de padrões.", appCta: `Registrar ${name} no Shiba`, note: "Isto é uma estimativa. Técnica, amplitude e fadiga podem alterar o resultado.", methodology: "Ver método"
        },
        en: {
            eyebrow: "Your current level", title: isWeight ? `Calculate your ${name} estimated 1RM and level` : `Check your ${name} level`, description: isWeight ? "Estimate 1RM from the weight and reps you performed, then compare it with bodyweight standards." : "Compare reps in one set with bodyweight standards.", genderLabel: "Sex", bodyweightLabel: "Bodyweight", loadLabel: "Weight lifted", repsLabel: isWeight ? "Reps (1–12)" : "Reps achieved", submit: "Calculate level", resultLabel: "Result", belowLabel: "Below beginner", resultTemplate: "Estimated level: {level}", estimateTemplate: isWeight ? "Estimated 1RM: {value} {unit}" : "Reps entered: {value}", nextTemplate: isWeight ? "The next “{level}” standard is about {value} {unit}." : "The next “{level}” standard is about {value} reps.", topTemplate: "You meet the highest standard shown.", referenceTemplate: "Calculated with the standard for {bodyweight} {unit} bodyweight.", errorMessage: "Check the inputs and standards table.", appCta: `Log ${name} in Shiba`, note: "This is an estimate. Technique, range of motion, and fatigue can change the result.", methodology: "See the method"
        }
    };

    return copy[locale] || copy.en;
}

function renderAverageStatCard(label, value) {
    return `            <div class="exercise-stat-card">
                <span class="exercise-stat-label">${escapeHtml(label)}</span>
                <strong class="exercise-stat-value">${escapeHtml(value)}</strong>
            </div>`;
}

function renderAppAnalysisCta(exercise, locale) {
    const name = getExerciseName(exercise, locale);
    const copy = getAppAnalysisCtaCopy(locale, name);

    return `
    <section class="container exercise-app-cta-band">
        <div>
            <h2>${escapeHtml(copy.title)}</h2>
            <p>${escapeHtml(copy.description)}</p>
        </div>
        <a href="${escapeAttribute(getAppStoreUrl(locale))}" class="exercise-app-cta-button" target="_blank" rel="noopener noreferrer external" data-analytics-link="app-store" data-analytics-placement="exercise_mid">${escapeHtml(copy.cta)}</a>
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
        },
        "pt-br": {
            title: `${measurementCopy.averageLabel}: ${level}`,
            note: "Referência para uma pessoa de nível intermediário."
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
        id: "Menengah",
        "pt-br": "Intermediário"
    };

    return labels[locale] || "Intermediate";
}

function getAppAnalysisCtaCopy(locale, name) {
    const copy = {
        ja: {
            title: "記録と分析はShibaアプリで",
            description: "重量、回数、成長の変化をまとめて確認できます。",
            cta: `${name}をShibaで記録`
        },
        ko: {
            title: "기록과 분석은 Shiba 앱에서",
            description: "중량, 반복 횟수, 성장 변화를 한곳에서 확인할 수 있습니다.",
            cta: `${name} Shiba에서 기록`
        },
        "zh-hant": {
            title: "用 Shiba App 記錄與分析",
            description: "集中查看重量、次數與進步變化。",
            cta: `用 Shiba 記錄${name}`
        },
        "zh-hans": {
            title: "用 Shiba App 记录与分析",
            description: "集中查看重量、次数与进步变化。",
            cta: `用 Shiba 记录${name}`
        },
        es: {
            title: "Registra y analiza en la app Shiba",
            description: "Consulta pesos, repeticiones y progreso en un solo lugar.",
            cta: `Registrar ${name} en Shiba`
        },
        fr: {
            title: "Suivi et analyse dans l'app Shiba",
            description: "Consultez poids, répétitions et progression au même endroit.",
            cta: `Noter ${name} dans Shiba`
        },
        de: {
            title: "Tracking und Analyse in der Shiba App",
            description: "Gewichte, Wiederholungen und Fortschritt an einem Ort.",
            cta: `${name} in Shiba loggen`
        },
        id: {
            title: "Catat dan analisis di aplikasi Shiba",
            description: "Lihat beban, repetisi, dan perkembangan di satu tempat.",
            cta: `Catat ${name} di Shiba`
        },
        "pt-br": {
            title: "Registre e analise no app Shiba",
            description: "Revise carga, repetições e progresso em um só lugar.",
            cta: `Registrar ${name} no Shiba`
        }
    };

    return copy[locale] || {
        title: "Track and analyze in the Shiba app",
        description: "Review weight, reps, and progress in one place.",
        cta: `Log ${name} in Shiba`
    };
}

function getExerciseHeroCtaText(locale, name) {
    const text = {
        ja: `${name}を記録する`,
        ko: `${name} 기록하기`,
        "zh-hant": `記錄${name}`,
        "zh-hans": `记录${name}`,
        es: `Registrar ${name}`,
        fr: `Noter ${name}`,
        de: `${name} loggen`,
        id: `Catat ${name}`,
        "pt-br": `Registrar ${name}`
    };

    return text[locale] || `Log ${name}`;
}

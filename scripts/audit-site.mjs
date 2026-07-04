#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, posix } from "node:path";

import {
    JAPANESE_LEFTOVER_PATTERNS,
    absoluteUrlForFile,
    getGeneratedLocales,
    getLocaleConfig,
    getMeasurementCopy,
    localizeStaticPage,
    stripIntentionalLanguageSwitchText
} from "./localization.mjs";
import { buildExerciseFileIndex, loadExercises, loadPages } from "./source-data.mjs";

const ROOT = process.cwd();
const ANALYTICS_ID = "G-D9K58THBFM";
const SITE_ORIGIN = "https://shibamuscle.com";
const CATEGORY_SECTION_IDS = [
    "whole-body-section",
    "chest-section",
    "back-section",
    "shoulder-section",
    "arm-section",
    "leg-section",
    "core-section"
];
const htmlEntries = listHtmlEntries();
const availableHtml = new Set(htmlEntries.map((entry) => entry.relativePath));
const sitemap = readFileSync(join(ROOT, "sitemap.xml"), "utf8");
const sitemapUrls = new Set(Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)).map((match) => match[1]));
const sitemapLastmods = Array.from(sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)).map((match) => match[1]);
const sitemapUrlBlocks = Array.from(sitemap.matchAll(/<url>\s*<loc>([^<]+)<\/loc>[\s\S]*?<\/url>/g));
const sitemapBlocksByUrl = new Map(sitemapUrlBlocks.map((match) => [match[1], match[0]]));
const sitemapAlternateLinkCount = (sitemap.match(/<xhtml:link\b/g) || []).length;
const staticPageByFile = new Map(loadPages().map((page) => [page.file, page]));
const exerciseFileIndex = buildExerciseFileIndex(loadExercises());
const localFileExistsCache = new Map();
const englishOnlySitemapUrls = new Set(Array.from(staticPageByFile.values())
    .filter((page) => page.englishOnly === true)
    .map((page) => absoluteUrlForFile(page.file, "ja")));
const englishOnlyDuplicatePaths = new Set(Array.from(staticPageByFile.values())
    .filter((page) => page.englishOnly === true)
    .flatMap((page) => getGeneratedLocales()
        .filter((locale) => locale.code !== "ja")
        .map((locale) => `${locale.outputDir}/${page.file}`)));
const expectedSitemapAlternateLinkCount = Array.from(sitemapUrls)
    .filter((url) => !englishOnlySitemapUrls.has(url)).length * (getGeneratedLocales().length + 1);
const indexableMetadata = [];
const errors = [];

assert(!/https:\/\/(?:ko|zh-hant|zh-hans|es|fr|de|id|en)\.shibamuscle\.com/i.test(sitemap), "sitemap.xml: old locale subdomain URL remains");
assert(sitemap.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"'), "sitemap.xml: xhtml namespace for hreflang alternates is missing");
assert(sitemap.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"'), "sitemap.xml: image namespace is missing");
assert(sitemapUrlBlocks.length === sitemapUrls.size, "sitemap.xml: duplicate or malformed url entries are present");
assert(sitemapLastmods.length === sitemapUrls.size, "sitemap.xml: every URL should have one lastmod");
assert(new Set(sitemapLastmods).size > 1, "sitemap.xml: lastmod values should reflect source changes, not one build timestamp");
sitemapLastmods.forEach((lastmod) => {
    assert(isValidSitemapLastmod(lastmod), `sitemap.xml: invalid lastmod value ${lastmod}`);
});
assert(sitemapAlternateLinkCount === expectedSitemapAlternateLinkCount, "sitemap.xml: hreflang alternate link count is incomplete");
auditRobotsTxt();
auditImageSitemapMarkup();
auditSitemapImageFiles();

for (const entry of htmlEntries) {
    const html = readFileSync(entry.path, "utf8");
    const sourceStaticPage = staticPageByFile.get(entry.file);
    const localizedStaticPage = sourceStaticPage ? localizeStaticPageForAudit(sourceStaticPage, entry.locale) : null;
    const isExercisePage = /^(kg|lb)_/.test(entry.file);
    const isSecondaryUnitPage = entry.file.startsWith("lb_");
    const isHomePage = entry.file === "index.html";
    const isToolPage = entry.file === "Shift2ics.html";
    const isAppHomePage = isHomePage && html.includes("app-home-shell");
    const isAppShellPage = html.includes("app-policy-shell");
    const isAppPage = isAppHomePage || isAppShellPage;
    const isEnglishOnlyPage = sourceStaticPage?.englishOnly === true;
    const isEnglishOnlyDuplicate = isEnglishOnlyPage && entry.locale !== "ja";
    const isIndexablePage = !isToolPage && !isSecondaryUnitPage && !isEnglishOnlyDuplicate;
    const localeConfig = getLocaleConfig(entry.locale);
    const expectedHtmlLang = localizedStaticPage?.htmlLang || localeConfig.hreflang;
    const canonicalFile = isSecondaryUnitPage ? entry.file.replace(/^lb_/, "kg_") : entry.file;
    const canonicalUrl = absoluteUrlForFile(canonicalFile, isEnglishOnlyPage ? "ja" : entry.locale);
    const pageUrl = absoluteUrlForFile(entry.file, entry.locale);

    assert(!/https:\/\/(?:ko|zh-hant|zh-hans|es|fr|de|id|en)\.shibamuscle\.com/i.test(localeConfig.origin), `${entry.locale}: old locale subdomain origin remains`);
    assert(!/https:\/\/(?:ko|zh-hant|zh-hans|es|fr|de|id|en)\.shibamuscle\.com/i.test(html), `${entry.relativePath}: old locale subdomain link remains`);
    assert(!html.includes("precaonnect"), `${entry.relativePath}: precaonnect typo is still present`);
    assert(!html.includes("G-ZPM6B2KLSV"), `${entry.relativePath}: legacy GA id is still present`);
    assert(html.includes(`gtag/js?id=${ANALYTICS_ID}`), `${entry.relativePath}: current GA script is missing`);
    assert(html.includes(`<html lang="${expectedHtmlLang}"`), `${entry.relativePath}: html lang is incorrect`);
    const expectedAlternates = isToolPage || isSecondaryUnitPage || isEnglishOnlyPage ? 0 : getGeneratedLocales().length + 1;
    assert((html.match(/<link rel="alternate" hreflang="/g) || []).length === expectedAlternates, `${entry.relativePath}: hreflang set is incomplete`);
    assert(html.includes(`<link rel="canonical" href="${canonicalUrl}">`), `${entry.relativePath}: canonical is missing or malformed`);
    assert(/<title>[^<]+<\/title>/.test(html), `${entry.relativePath}: title is missing`);
    assert(/<meta name="description" content="[^"]+">/.test(html), `${entry.relativePath}: meta description is missing`);
    if (isAppHomePage) {
        auditAppHomeDescription(entry, html);
    }
    if (isIndexablePage) {
        indexableMetadata.push({
            path: entry.relativePath,
            canonicalUrl,
            title: extractFirstGroup(html, /<title>([\s\S]*?)<\/title>/i),
            description: extractFirstGroup(html, /<meta name="description" content="([^"]+)">/i)
        });
    }
    assertSocialImageMetadata(entry, html, isToolPage);
    assert(/<h1[\s>]/i.test(html) || isToolPage, `${entry.relativePath}: H1 is missing`);
    if (isEnglishOnlyDuplicate) {
        assert(!sitemapUrls.has(pageUrl), `${entry.relativePath}: duplicate English-only page should not be in sitemap`);
        assert(html.includes('<meta name="robots" content="noindex,follow,noarchive">'), `${entry.relativePath}: duplicate English-only page should be noindex`);
    } else if (!isToolPage && !isSecondaryUnitPage) {
        assert(sitemapUrls.has(canonicalUrl), `${entry.relativePath}: sitemap is missing ${canonicalUrl}`);
        if (isEnglishOnlyPage) {
            auditNoSitemapAlternates(entry, canonicalUrl);
        } else {
            auditSitemapAlternates(entry, canonicalFile, canonicalUrl);
        }
        auditSitemapImages(entry, canonicalFile, canonicalUrl);
    } else if (isSecondaryUnitPage) {
        assert(!sitemapUrls.has(pageUrl), `${entry.relativePath}: secondary lb page should not be in sitemap`);
        assert(html.includes('<meta name="robots" content="noindex,follow,noarchive">'), `${entry.relativePath}: secondary lb page should be noindex`);
        assert(!html.includes("pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"), `${entry.relativePath}: secondary lb page should not load AdSense script`);
        assert(!html.includes("ins class=\"adsbygoogle\""), `${entry.relativePath}: secondary lb page should not render ad slots`);
    } else {
        assert(!sitemapUrls.has(canonicalUrl), `${entry.relativePath}: noindex tool page should not be in sitemap`);
    }

    auditStructuredData(entry, html, {
        canonicalUrl,
        isIndexable: isIndexablePage,
        isHomePage,
        isExercisePage,
        hasVisibleBreadcrumb: /<nav class="breadcrumb" aria-label="/.test(html)
    });

    if (!isToolPage && !isSecondaryUnitPage && !isEnglishOnlyPage) getGeneratedLocales().forEach((locale) => {
        assert(html.includes(`<link rel="alternate" hreflang="${locale.hreflang}" href="${absoluteUrlForFile(canonicalFile, locale.code)}">`), `${entry.relativePath}: ${locale.code} hreflang target is incorrect`);
    });
    if (!isToolPage && !isSecondaryUnitPage && !isEnglishOnlyPage) {
        assert(html.includes(`<link rel="alternate" hreflang="x-default" href="${absoluteUrlForFile(canonicalFile, "ja")}">`), `${entry.relativePath}: x-default hreflang target is incorrect`);
        assert((html.match(/<meta property="og:locale:alternate"/g) || []).length === getGeneratedLocales().length - 1, `${entry.relativePath}: og:locale:alternate set is incomplete`);
        if (!isAppPage) {
            getGeneratedLocales().forEach((locale) => {
                assert(html.includes(`href="${absoluteUrlForFile(canonicalFile, locale.code)}" data-lang="${locale.code}"`), `${entry.relativePath}: footer language link for ${locale.code} is incorrect`);
            });
        }
    }

    auditInternalLinks(entry, html);
    auditLocalAssetReferences(entry, html);
    auditImageAltText(entry, html);
    auditNoLinksToEnglishOnlyDuplicates(entry, html, isIndexablePage);

    if (entry.locale === "ko") {
        auditKoreanHtml(entry, html);
    }

    if (entry.locale === "es") {
        auditSpanishHtml(entry, html);
    }

    if (entry.locale === "id") {
        auditIndonesianHtml(entry, html);
    }

    if (entry.locale === "en") {
        auditEnglishHtml(entry, html);
    }

    if (entry.locale === "ja" && sourceStaticPage?.englishOnly !== true) {
        auditJapaneseStaticPageHtml(entry, html, Boolean(sourceStaticPage));
    }

    if (entry.locale !== "ja") {
        auditSectionDrift(entry, html);
    }

    if (isExercisePage) {
        assert(/<main class="page-main"/.test(html), `${entry.relativePath}: static main wrapper is missing`);
        assert(/<nav class="breadcrumb" aria-label="/.test(html), `${entry.relativePath}: static breadcrumb is missing`);
        assert(html.includes('id="other-workouts"'), `${entry.relativePath}: other workouts section is missing`);
        auditRecordImageLoading(entry, html);
        auditExerciseCategoryLinks(entry, html);
        auditExerciseUnitDisplay(entry, html);
        assert(!/<h1 class="section-title"/.test(html), `${entry.relativePath}: section heading is still h1`);
        assert(html.includes("/assets/og/exercises/"), `${entry.relativePath}: dedicated exercise OG image is missing`);

        if (entry.locale === "ko") {
            assert(/<meta name="description" content="[^"]+(kg 기준표|lb 기준표)[^"]*주동근[^"]+">/.test(html), `${entry.relativePath}: Korean exercise description is not specific enough`);
        } else if (entry.locale === "es") {
            assert(/<meta name="description" content="[^"]+(tabla en kg|tabla en lb)[^"]*(músculos principales|estándares)[^"]+">/i.test(html), `${entry.relativePath}: Spanish exercise description is not specific enough`);
        } else if (entry.locale === "zh-hant") {
            assert(/<meta name="description" content="[^"]+(kg 表|lb 表)[^"]*(主要肌群為|主動肌)[^"]+">/.test(html), `${entry.relativePath}: Traditional Chinese exercise description is not specific enough`);
        } else if (entry.locale === "zh-hans") {
            assert(/<meta name="description" content="[^"]+(kg 表|lb 表)[^"]*(主要肌群为|主动肌)[^"]+">/.test(html), `${entry.relativePath}: Simplified Chinese exercise description is not specific enough`);
        } else if (entry.locale === "fr") {
            assert(/<meta name="description" content="[^"]+(tableau en kg|tableau en lb)[^"]*(muscles principaux|standards)[^"]+">/i.test(html), `${entry.relativePath}: French exercise description is not specific enough`);
        } else if (entry.locale === "de") {
            assert(/<meta name="description" content="[^"]+(kg Tabelle|lb Tabelle)[^"]*(Zielmuskulatur|Tabellen)[^"]+">/.test(html), `${entry.relativePath}: German exercise description is not specific enough`);
        } else if (entry.locale === "id") {
            assert(/<meta name="description" content="[^"]+(tabel kg|tabel lb)[^"]*(Otot utama|tabel berdasarkan|standar)[^"]+">/i.test(html), `${entry.relativePath}: Indonesian exercise description is not specific enough`);
        } else if (entry.locale === "en") {
            assert(/<meta name="description" content="[^"]+(kg table|lb table)[^"]*(Primary muscles|bodyweight tables|strength standards)[^"]+">/i.test(html), `${entry.relativePath}: English exercise description is not specific enough`);
        } else {
            assert(/<meta name="description" content="[^"]+(kg表|lb表)[^"]*(主働筋は|主な筋肉は)[^"]+">/.test(html), `${entry.relativePath}: exercise description is not specific enough`);
        }
    }

    if (isHomePage && !isAppHomePage) {
        assert((html.match(/<h2 id="[^"]+-section" class="section-title">/g) || []).length === 7, `${entry.relativePath}: homepage category sections are incomplete`);
    }

    if (!isHomePage && !isToolPage && !isAppShellPage) {
        assert(/<nav class="breadcrumb" aria-label="/.test(html), `${entry.relativePath}: breadcrumb is missing`);
    }

    if (!isExercisePage) {
        auditNoCategorySubNav(entry, html);
    }
}

auditIndexableMetadataQuality();

if (errors.length) {
    console.error("Site audit failed:\n");
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
}

console.log(`Site audit passed for ${htmlEntries.length} HTML files.`);

function auditExerciseCategoryLinks(entry, html) {
    CATEGORY_SECTION_IDS.forEach((sectionId) => {
        assert(html.includes(`id="${sectionId}"`), `${entry.relativePath}: ${sectionId} target section is missing`);
        assert(html.includes(`href="#${sectionId}"`), `${entry.relativePath}: ${sectionId} category link does not target this page`);
        assert(!html.includes(`href="index.html#${sectionId}"`), `${entry.relativePath}: ${sectionId} category link still points to the homepage`);
    });
}

function auditRecordImageLoading(entry, html) {
    Array.from(html.matchAll(/<img\b[^>]*(?:official-icon|profile-photo|countryflags\.com)[^>]*>/gi)).forEach((match) => {
        const tag = match[0];

        assert(/\sloading="lazy"/i.test(tag), `${entry.relativePath}: record image should use native lazy loading`);
        assert(/\sdecoding="async"/i.test(tag), `${entry.relativePath}: record image should use async decoding`);
    });
}

function auditRobotsTxt() {
    const robotsPath = join(ROOT, "robots.txt");
    assert(existsSync(robotsPath), "robots.txt: file is missing");
    if (!existsSync(robotsPath)) {
        return;
    }

    const robots = readFileSync(robotsPath, "utf8");
    assert(/User-agent:\s*\*/i.test(robots), "robots.txt: default User-agent rule is missing");
    assert(/Sitemap:\s*https:\/\/shibamuscle\.com\/sitemap\.xml/i.test(robots), "robots.txt: canonical sitemap URL is missing");
    assert(!/Disallow:\s*\/(?:assets\/|styles\.css|app\.js|sitemap\.xml)/i.test(robots), "robots.txt: crawl-critical assets or sitemap should not be disallowed");
}

function auditSitemapImageFiles() {
    Array.from(sitemap.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)).forEach((match) => {
        const resolved = resolveLocalCrawlPath("sitemap.xml", match[1]);
        if (resolved) {
            assertLocalFileExists("sitemap.xml", resolved, match[1]);
        }
    });
}

function auditImageSitemapMarkup() {
    ["caption", "geo_location", "title", "license"].forEach((tag) => {
        assert(!sitemap.includes(`<image:${tag}>`), `sitemap.xml: deprecated image sitemap tag image:${tag} should not be emitted`);
    });

    sitemapUrlBlocks.forEach((match) => {
        const url = match[1];
        const block = match[0];
        const imageBlocks = Array.from(block.matchAll(/<image:image>([\s\S]*?)<\/image:image>/g)).map((imageMatch) => imageMatch[1]);

        assert(imageBlocks.length <= 1000, `sitemap.xml: ${url} has more than 1000 image entries`);
        imageBlocks.forEach((imageBlock) => {
            const locs = Array.from(imageBlock.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)).map((locMatch) => locMatch[1]);
            assert(locs.length === 1, `sitemap.xml: ${url} image block should contain exactly one image:loc`);
            if (locs[0]) {
                assert(/^https:\/\/shibamuscle\.com\/assets\//.test(locs[0]), `sitemap.xml: ${url} image URL should be an absolute HTTPS asset URL`);
            }
        });
    });
}

function auditImageAltText(entry, html) {
    const bareFlagAlts = new Set([
        "UK",
        "Japan",
        "Korea",
        "Spain",
        "China",
        "France",
        "Germany",
        "Indonesia",
        "Deutschland",
        "Spanien",
        "Frankreich"
    ]);

    Array.from(html.matchAll(/<img\b[^>]*>/gi)).forEach((match) => {
        const tag = match[0];
        const altMatch = tag.match(/\salt="([^"]*)"/i);

        assert(Boolean(altMatch), `${entry.relativePath}: image alt attribute is missing`);
        if (/\bflag-icon\b/.test(tag) && altMatch) {
            assert(!bareFlagAlts.has(altMatch[1].trim()), `${entry.relativePath}: flag image alt should describe the flag, not just "${altMatch[1]}"`);
            if (/countryflags\.com/i.test(tag)) {
                assert(isDescriptiveFlagAlt(altMatch[1]), `${entry.relativePath}: external country flag image alt should describe the flag`);
            }
        }
    });
}

function isDescriptiveFlagAlt(value) {
    return /flag|国旗|國旗|국기|Bandera|Drapeau|Flagge|Bendera/i.test(value);
}

function auditIndexableMetadataQuality() {
    auditUniqueMetadataField("title");
    auditUniqueMetadataField("description");
    indexableMetadata.forEach((page) => {
        const titleLength = countCharacters(page.title);
        const descriptionLength = countCharacters(page.description);
        assert(titleLength >= 12 && titleLength <= 75, `${page.path}: title length should stay between 12 and 75 characters`);
        assert(descriptionLength >= 15 && descriptionLength <= 360, `${page.path}: description length should stay between 15 and 360 characters`);
        assert(page.title !== page.description, `${page.path}: title and description should not be identical`);
    });
}

function auditAppHomeDescription(entry, html) {
    const description = extractFirstGroup(html, /<meta name="description" content="([^"]+)">/i);
    const requiredPatterns = {
        ja: [/筋トレ/, /計画/, /セット記録/, /進捗分析/, /種目選び/],
        ko: [/근력 운동 계획/, /세트 기록/, /진행 분석/, /운동 선택/],
        "zh-hant": [/規劃訓練/, /記錄組數/, /查看進度/, /選擇下一個動作/],
        "zh-hans": [/规划训练/, /记录组数/, /查看进度/, /选择下一个动作/],
        es: [/planificar entrenamientos de fuerza/i, /registrar series/i, /revisar progreso/i, /elegir ejercicios/i],
        fr: [/planifier .*séances de musculation/i, /noter les séries/i, /suivre les progrès/i, /choisir les exercices/i],
        de: [/Krafttrainings zu planen/, /Sätze zu loggen/, /Fortschritt zu prüfen/, /Übungen/],
        id: [/merencanakan latihan beban/i, /mencatat set/i, /melihat progres/i, /memilih latihan/i],
        en: [/plan strength workouts/i, /log sets/i, /review progress/i, /choose exercises/i]
    };
    const patterns = requiredPatterns[entry.locale] || requiredPatterns.en;

    patterns.forEach((pattern) => {
        assert(pattern.test(description), `${entry.relativePath}: app homepage description is missing ${pattern}`);
    });
}

function auditUniqueMetadataField(field) {
    const values = new Map();

    indexableMetadata.forEach((page) => {
        const value = page[field];
        if (!value) {
            assert(false, `${page.path}: ${field} should not be empty`);
            return;
        }

        if (!values.has(value)) {
            values.set(value, []);
        }
        values.get(value).push(page);
    });

    values.forEach((pages, value) => {
        if (pages.length <= 1) {
            return;
        }

        assert(false, `indexable metadata duplicate ${field} "${value}" appears on ${pages.map((page) => page.path).join(", ")}`);
    });
}

function auditSitemapAlternates(entry, canonicalFile, canonicalUrl) {
    const block = sitemapBlocksByUrl.get(canonicalUrl);
    assert(Boolean(block), `${entry.relativePath}: sitemap url block is missing`);
    if (!block) {
        return;
    }

    getGeneratedLocales().forEach((locale) => {
        const expected = buildExpectedSitemapAlternateLink(locale.hreflang, absoluteUrlForFile(canonicalFile, locale.code));
        assert(block.includes(expected), `${entry.relativePath}: sitemap ${locale.code} hreflang target is incorrect`);
    });

    const expectedDefault = buildExpectedSitemapAlternateLink("x-default", absoluteUrlForFile(canonicalFile, "ja"));
    assert(block.includes(expectedDefault), `${entry.relativePath}: sitemap x-default hreflang target is incorrect`);
}

function auditNoSitemapAlternates(entry, canonicalUrl) {
    const block = sitemapBlocksByUrl.get(canonicalUrl);
    assert(Boolean(block), `${entry.relativePath}: sitemap url block is missing`);
    if (!block) {
        return;
    }

    assert(!block.includes("<xhtml:link"), `${entry.relativePath}: English-only sitemap URL should not have localized hreflang alternates`);
}

function auditSitemapImages(entry, canonicalFile, canonicalUrl) {
    const expectedImages = getExpectedSitemapImageUrls(canonicalFile);
    if (!expectedImages.length) {
        return;
    }

    const block = sitemapBlocksByUrl.get(canonicalUrl);
    assert(Boolean(block), `${entry.relativePath}: sitemap url block is missing`);
    if (!block) {
        return;
    }

    expectedImages.forEach((imageUrl) => {
        assert(block.includes(`<image:loc>${imageUrl}</image:loc>`), `${entry.relativePath}: sitemap image is missing ${imageUrl}`);
    });
}

function getExpectedSitemapImageUrls(file) {
    const urls = new Set();
    const staticPage = staticPageByFile.get(file);
    if (staticPage) {
        addExpectedSitemapImageUrl(urls, staticPage.ogImage);
        if (file === "index.html" && staticPage.appImages) {
            Object.values(staticPage.appImages).forEach((image) => addExpectedSitemapImageUrl(urls, image));
        }
        return Array.from(urls);
    }

    const exerciseMatch = exerciseFileIndex.byFile.get(file);
    if (exerciseMatch?.unit === "kg") {
        addExpectedSitemapImageUrl(urls, exerciseMatch.exercise.image?.src);
    }

    return Array.from(urls);
}

function addExpectedSitemapImageUrl(urls, image) {
    if (!image) {
        return;
    }

    urls.add(absoluteAssetUrl(image));
}

function absoluteAssetUrl(file) {
    if (/^https?:\/\//i.test(file || "")) {
        return file;
    }

    return `${SITE_ORIGIN}/assets/${String(file || "").replace(/^\.?\/?assets\//, "")}`;
}

function buildExpectedSitemapAlternateLink(hreflang, href) {
    return `<xhtml:link rel="alternate" hreflang="${hreflang}" href="${href}" />`;
}

function isValidSitemapLastmod(value) {
    const timestamp = Date.parse(value);
    if (!Number.isFinite(timestamp)) {
        return false;
    }

    return new Date(timestamp).toISOString() === value;
}

function isChronologicalDateRange(start, end) {
    const startTimestamp = Date.parse(start);
    const endTimestamp = Date.parse(end);

    return Number.isFinite(startTimestamp) && Number.isFinite(endTimestamp) && startTimestamp <= endTimestamp;
}

function assertSocialImageMetadata(entry, html, isToolPage) {
    if (isToolPage) {
        return;
    }

    assert(/<meta property="og:image:alt" content="[^"]+">/.test(html), `${entry.relativePath}: og:image:alt is missing`);
    assert(/<meta name="twitter:image:alt" content="[^"]+">/.test(html), `${entry.relativePath}: twitter:image:alt is missing`);
}

function auditStructuredData(entry, html, { canonicalUrl, isIndexable, isHomePage, isExercisePage, hasVisibleBreadcrumb }) {
    const scripts = extractJsonLdScripts(entry, html);

    if (!isIndexable) {
        assert(scripts.length === 0, `${entry.relativePath}: noindex page should not emit JSON-LD structured data`);
        return;
    }

    assert(scripts.length === 1, `${entry.relativePath}: expected exactly one JSON-LD script`);
    if (scripts.length !== 1) {
        return;
    }

    const document = scripts[0];
    assert(document["@context"] === "https://schema.org", `${entry.relativePath}: JSON-LD context should be https://schema.org`);

    const graph = Array.isArray(document["@graph"]) ? document["@graph"] : [];
    assert(graph.length >= 4, `${entry.relativePath}: JSON-LD graph is too small`);
    const organization = graph.find((node) => node?.["@id"] === "https://shibamuscle.com/#organization" && hasType(node, "Organization"));
    assert(Boolean(organization), `${entry.relativePath}: Organization schema is missing`);
    assert(hasGraphNode(graph, "WebSite", "https://shibamuscle.com/#website"), `${entry.relativePath}: WebSite schema is missing`);

    if (organization) {
        assert(organization.name === "Shiba Muscle", `${entry.relativePath}: Organization name is incorrect`);
        assert(Boolean(organization.description), `${entry.relativePath}: Organization description is missing`);
        assert(organization.url === "https://shibamuscle.com", `${entry.relativePath}: Organization URL is incorrect`);
        assert(organization.email === "info@shibamuscle.com", `${entry.relativePath}: Organization support email is missing`);
        assert(organization.logo?.url === "https://shibamuscle.com/assets/app/shiba-mascot.png", `${entry.relativePath}: Organization logo is incorrect`);
        assert(organization.contactPoint?.["@type"] === "ContactPoint", `${entry.relativePath}: Organization contactPoint is missing`);
        assert(organization.contactPoint?.email === "info@shibamuscle.com", `${entry.relativePath}: Organization contactPoint email is missing`);
        assert(organization.contactPoint?.url === "https://shibamuscle.com/contact.html", `${entry.relativePath}: Organization contactPoint URL is missing`);
        ["ja", "en", "ko", "zh-Hant", "zh-Hans", "es", "fr", "de", "id"].forEach((language) => {
            assert((organization.contactPoint?.availableLanguage || []).includes(language), `${entry.relativePath}: Organization contactPoint language ${language} is missing`);
        });
    }

    const webPage = graph.find((node) => node?.["@id"] === `${canonicalUrl}#webpage` && hasType(node, "WebPage"));
    assert(Boolean(webPage), `${entry.relativePath}: WebPage schema is missing`);
    if (webPage) {
        assert(webPage.url === canonicalUrl, `${entry.relativePath}: WebPage schema URL does not match canonical`);
        assert(Boolean(webPage.name), `${entry.relativePath}: WebPage schema name is empty`);
        assert(Boolean(webPage.description), `${entry.relativePath}: WebPage schema description is empty`);
        assert(Boolean(webPage.inLanguage), `${entry.relativePath}: WebPage schema language is empty`);
        assert(isValidSitemapLastmod(webPage.dateModified), `${entry.relativePath}: WebPage schema dateModified is missing or invalid`);
        assert(webPage.isPartOf?.["@id"] === "https://shibamuscle.com/#website", `${entry.relativePath}: WebPage schema site link is missing`);
    }

    if (hasVisibleBreadcrumb) {
        const breadcrumb = graph.find((node) => node?.["@id"] === `${canonicalUrl}#breadcrumb` && hasType(node, "BreadcrumbList"));
        assert(Boolean(breadcrumb), `${entry.relativePath}: BreadcrumbList schema is missing`);
        if (breadcrumb) {
            assert((breadcrumb.itemListElement || []).length >= 2, `${entry.relativePath}: BreadcrumbList schema is incomplete`);
            assert(webPage?.breadcrumb?.["@id"] === breadcrumb["@id"], `${entry.relativePath}: WebPage schema does not reference BreadcrumbList`);
        }
    }

    if (isHomePage) {
        assert(!graph.some((node) => hasType(node, "MobileApplication") || hasType(node, "SoftwareApplication")), `${entry.relativePath}: app schema should wait until real offers and ratings are available`);
    }

    if (isExercisePage) {
        auditExerciseStructuredData(entry, graph, canonicalUrl);
    }
}

function auditExerciseStructuredData(entry, graph, canonicalUrl) {
    const exerciseMatch = exerciseFileIndex.byFile.get(entry.file);
    const measurementKind = exerciseMatch?.exercise?.metadata?.measurementKind || "weight";
    const measurementCopy = getMeasurementCopy(measurementKind, entry.locale);
    const exerciseTerm = graph.find((node) => node?.["@id"] === `${canonicalUrl}#exercise` && hasType(node, "DefinedTerm"));
    const article = graph.find((node) => node?.["@id"] === `${canonicalUrl}#article` && hasType(node, "Article"));
    const dataCatalogId = `${canonicalUrl}#exercise-data-catalog`;
    const dataCatalogUrl = `${canonicalUrl}#other-workouts`;
    const dataCatalog = graph.find((node) => node?.["@id"] === dataCatalogId && hasType(node, "DataCatalog"));
    const dataset = graph.find((node) => node?.["@id"] === `${canonicalUrl}#dataset` && hasType(node, "Dataset"));

    assert(Boolean(exerciseTerm), `${entry.relativePath}: exercise DefinedTerm schema is missing`);
    assert(Boolean(article), `${entry.relativePath}: exercise Article schema is missing`);
    assert(Boolean(dataCatalog), `${entry.relativePath}: exercise DataCatalog schema is missing`);
    assert(Boolean(dataset), `${entry.relativePath}: exercise Dataset schema is missing`);

    if (exerciseTerm) {
        assert(Boolean(exerciseTerm.name), `${entry.relativePath}: exercise DefinedTerm name is empty`);
        assert(Boolean(exerciseTerm.description), `${entry.relativePath}: exercise DefinedTerm description is empty`);
        assert(Boolean(exerciseTerm.termCode), `${entry.relativePath}: exercise DefinedTerm termCode is empty`);
    }

    if (article) {
        assert(Boolean(article.headline), `${entry.relativePath}: Article headline is empty`);
        assert(Boolean(article.description), `${entry.relativePath}: Article description is empty`);
        assert(Array.isArray(article.image) && article.image.length >= 1, `${entry.relativePath}: Article image list is missing`);
        assert(article.mainEntityOfPage?.["@id"] === `${canonicalUrl}#webpage`, `${entry.relativePath}: Article mainEntityOfPage is incorrect`);
        assert(isValidSitemapLastmod(article.datePublished), `${entry.relativePath}: Article datePublished is missing or invalid`);
        assert(isValidSitemapLastmod(article.dateModified), `${entry.relativePath}: Article dateModified is missing or invalid`);
        assert(isChronologicalDateRange(article.datePublished, article.dateModified), `${entry.relativePath}: Article datePublished should not be newer than dateModified`);
        assert(article.author?.["@id"] === "https://shibamuscle.com/#organization", `${entry.relativePath}: Article author organization is missing`);
        assert(article.publisher?.["@id"] === "https://shibamuscle.com/#organization", `${entry.relativePath}: Article publisher organization is missing`);
        assert(article.isAccessibleForFree === true, `${entry.relativePath}: Article should be marked accessible for free`);
    }

    if (dataCatalog) {
        assert(Boolean(dataCatalog.name), `${entry.relativePath}: DataCatalog name is empty`);
        assert(Boolean(dataCatalog.description) && dataCatalog.description.length >= 50, `${entry.relativePath}: DataCatalog description is too short`);
        assert(dataCatalog.url === dataCatalogUrl, `${entry.relativePath}: DataCatalog URL does not point to the exercise catalog section`);
        assert(dataCatalog.inLanguage === getLocaleConfig(entry.locale).hreflang, `${entry.relativePath}: DataCatalog language is incorrect`);
        assert(dataCatalog.publisher?.["@id"] === "https://shibamuscle.com/#organization", `${entry.relativePath}: DataCatalog publisher organization is missing`);
    }

    if (dataset) {
        assert(Boolean(dataset.name), `${entry.relativePath}: Dataset name is empty`);
        assert(dataset.identifier === `${canonicalUrl}#dataset`, `${entry.relativePath}: Dataset identifier should match the canonical dataset node`);
        assert(Boolean(dataset.description) && dataset.description.length >= 50, `${entry.relativePath}: Dataset description is too short`);
        assert(dataset.url === canonicalUrl, `${entry.relativePath}: Dataset URL does not match canonical`);
        assert(isValidSitemapLastmod(dataset.dateModified), `${entry.relativePath}: Dataset dateModified is missing or invalid`);
        assert(dataset.creator?.["@id"] === "https://shibamuscle.com/#organization", `${entry.relativePath}: Dataset creator organization is missing`);
        assert(dataset.publisher?.["@id"] === "https://shibamuscle.com/#organization", `${entry.relativePath}: Dataset publisher organization is missing`);
        assert(dataset.includedInDataCatalog?.["@id"] === dataCatalogId, `${entry.relativePath}: Dataset catalog link is missing or incorrect`);
        assert(dataset.isAccessibleForFree === true, `${entry.relativePath}: Dataset should be marked accessible for free`);
        assert(Array.isArray(dataset.variableMeasured) && dataset.variableMeasured.length >= 3, `${entry.relativePath}: Dataset measured variables are incomplete`);
        assert(dataset.variableMeasured?.[2] === measurementCopy.detailLabel, `${entry.relativePath}: Dataset measured variable label is not localized`);
        assert(dataset.measurementTechnique === getExpectedDatasetMeasurementTechnique(measurementKind, entry.locale), `${entry.relativePath}: Dataset measurement technique is not localized`);
    }
}

function getExpectedDatasetMeasurementTechnique(measurementKind, locale) {
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

function extractJsonLdScripts(entry, html) {
    return Array.from(html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)).map((match) => {
        try {
            return JSON.parse(match[1]);
        } catch (error) {
            assert(false, `${entry.relativePath}: JSON-LD is invalid JSON (${error.message})`);
            return {};
        }
    });
}

function hasGraphNode(graph, type, id) {
    return graph.some((node) => node?.["@id"] === id && hasType(node, type));
}

function hasType(node, type) {
    const nodeType = node?.["@type"];
    return Array.isArray(nodeType) ? nodeType.includes(type) : nodeType === type;
}

function auditExerciseUnitDisplay(entry, html) {
    const unit = entry.file.startsWith("lb_") ? "lb" : entry.file.startsWith("kg_") ? "kg" : null;
    if (!unit) {
        return;
    }

    const averageSummary = extractFirstMatch(html, /<section class="container exercise-average-summary"[\s\S]*?<\/section>/i);
    const averageTable = extractFirstMatch(html, /<table class="average-section-table">[\s\S]*?<\/table>/i);
    const recordWeights = Array.from(html.matchAll(/<p class="record-weight">([\s\S]*?)<\/p>/gi)).map((match) => match[1]).join("\n");
    const oppositeUnit = unit === "kg" ? "lb" : "kg";

    [
        ["average summary", averageSummary],
        ["average table", averageTable],
        ["record weights", recordWeights]
    ].forEach(([label, fragment]) => {
        assert(!hasOppositeWeightUnit(fragment, unit), `${entry.relativePath}: ${label} contains ${oppositeUnit} on the ${unit} page`);
    });
}

function extractFirstMatch(text, pattern) {
    return text.match(pattern)?.[0] || "";
}

function extractFirstGroup(text, pattern) {
    return text.match(pattern)?.[1]?.trim() || "";
}

function hasOppositeWeightUnit(fragment, unit) {
    if (unit === "kg") {
        return /\b(?:lb|lbs|pounds?)\b/i.test(fragment);
    }

    return /\bkg\b/i.test(fragment);
}

function auditNoCategorySubNav(entry, html) {
    const subNavMatch = html.match(/<div class="sub-nav">[\s\S]*?<\/div>\s*<\/header>/i);
    if (!subNavMatch) {
        return;
    }

    const hasCategoryLink = CATEGORY_SECTION_IDS.some((sectionId) => subNavMatch[0].includes(`#${sectionId}`));
    assert(!hasCategoryLink, `${entry.relativePath}: category sub-nav should be hidden when other workouts are absent`);
}

function localizeStaticPageForAudit(page, locale) {
    if (page.englishOnly === true) {
        const { locales, ...basePage } = page;
        return basePage;
    }

    return localizeStaticPage(page, locale);
}

function listHtmlEntries() {
    const entries = [];

    getGeneratedLocales().forEach((locale) => {
        const dir = locale.outputDir ? join(ROOT, locale.outputDir) : ROOT;
        if (!existsSync(dir)) {
            return;
        }

        readdirSync(dir)
            .filter((file) => file.endsWith(".html"))
            .sort((left, right) => left.localeCompare(right))
            .forEach((file) => {
                entries.push({
                    file,
                    locale: locale.code,
                    relativePath: locale.outputDir ? `${locale.outputDir}/${file}` : file,
                    path: join(dir, file)
                });
            });
    });

    return entries;
}

function auditKoreanHtml(entry, html) {
    const normalized = stripIntentionalLanguageSwitchText(html)
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "");

    JAPANESE_LEFTOVER_PATTERNS.forEach((pattern) => {
        assert(!pattern.test(normalized), `${entry.relativePath}: Japanese text remains in Korean output`);
    });

    assert(!/中文/.test(normalized), `${entry.relativePath}: Chinese language text remains outside the language switch`);
}

function auditSpanishHtml(entry, html) {
    const normalized = stripIntentionalLanguageSwitchText(html)
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "");

    JAPANESE_LEFTOVER_PATTERNS.forEach((pattern) => {
        assert(!pattern.test(normalized), `${entry.relativePath}: Japanese text remains in Spanish output`);
    });

    assert(!/[\u3040-\u30ff]/.test(normalized), `${entry.relativePath}: Japanese kana remains in Spanish output`);
}

function auditIndonesianHtml(entry, html) {
    const normalized = stripIntentionalLanguageSwitchText(html)
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "");

    JAPANESE_LEFTOVER_PATTERNS.forEach((pattern) => {
        assert(!pattern.test(normalized), `${entry.relativePath}: Japanese text remains in Indonesian output`);
    });

    assert(!/[\u3040-\u30ff]/.test(normalized), `${entry.relativePath}: Japanese kana remains in Indonesian output`);
}

function auditEnglishHtml(entry, html) {
    const normalized = stripIntentionalLanguageSwitchText(html)
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "");

    JAPANESE_LEFTOVER_PATTERNS.forEach((pattern) => {
        assert(!pattern.test(normalized), `${entry.relativePath}: Japanese text remains in English output`);
    });

    assert(!/[\u3040-\u30ff]/.test(normalized), `${entry.relativePath}: Japanese kana remains in English output`);
}

function auditJapaneseStaticPageHtml(entry, html, isStaticPage) {
    if (!isStaticPage) {
        return;
    }

    const title = extractFirstGroup(html, /<title>([\s\S]*?)<\/title>/i);
    const description = extractFirstGroup(html, /<meta name="description" content="([^"]+)">/i);

    assert(html.includes('<html lang="ja"'), `${entry.relativePath}: Japanese static page should use html lang ja`);
    assert(hasJapaneseText(title), `${entry.relativePath}: Japanese static page title should be localized`);
    assert(hasJapaneseText(description), `${entry.relativePath}: Japanese static page description should be localized`);
    assert(!html.includes("Plan workouts, log sets, and review progress with Shiba."), `${entry.relativePath}: English homepage description remains on Japanese root`);
    assert(!html.includes("Plan. Log. Improve."), `${entry.relativePath}: English homepage hero copy remains on Japanese root`);
}

function hasJapaneseText(text) {
    return /[\u3040-\u30ff\u4e00-\u9fff]/.test(text || "");
}

function auditSectionDrift(entry, localizedHtml) {
    const jaPath = join(ROOT, entry.file);
    if (!existsSync(jaPath)) {
        return;
    }

    const jaHtml = readFileSync(jaPath, "utf8");
    const jaSignature = buildStructureSignature(jaHtml);
    const localizedSignature = buildStructureSignature(localizedHtml);

    assert(JSON.stringify(jaSignature) === JSON.stringify(localizedSignature), `${entry.relativePath}: section/table structure drifted from Japanese canonical page`);
}

function buildStructureSignature(html) {
    return {
        sectionIds: Array.from(html.matchAll(/<h[23]\s+id="([^"]+)"\s+class="section-title"/g)).map((match) => match[1]),
        tables: count(html, /<table\b/g),
        cards: count(html, /class="exercise-card"/g),
        averageTables: count(html, /class="average-section-table"/g),
        standardsGroups: count(html, /data-tab-group="Standards Exercise"/g),
        tabs: count(html, /<div class="tab/g)
    };
}

function auditInternalLinks(entry, html) {
    const links = Array.from(html.matchAll(/<a\b[^>]*href="([^"]+)"/g)).map((match) => match[1]);

    links.forEach((href) => {
        if (shouldSkipHref(href)) {
            return;
        }

        const resolved = resolveInternalHref(entry.relativePath, href);
        if (!resolved.endsWith(".html")) {
            return;
        }

        assert(availableHtml.has(resolved), `${entry.relativePath}: broken internal link to ${href}`);
    });
}

function auditLocalAssetReferences(entry, html) {
    const references = Array.from(html.matchAll(/\b(?:href|src)="([^"]+)"/g)).map((match) => match[1]);
    references.forEach((reference) => {
        const resolved = resolveLocalCrawlPath(entry.relativePath, reference);
        if (!resolved || resolved.endsWith(".html") || !isAuditableLocalAsset(resolved)) {
            return;
        }

        assertLocalFileExists(entry.relativePath, resolved, reference);
    });
}

function auditNoLinksToEnglishOnlyDuplicates(entry, html, isIndexablePage) {
    if (!isIndexablePage) {
        return;
    }

    const links = Array.from(html.matchAll(/<a\b[^>]*href="([^"]+)"/g)).map((match) => match[1]);
    links.forEach((href) => {
        if (shouldSkipHref(href)) {
            return;
        }

        const resolved = resolveInternalHref(entry.relativePath, href);
        assert(!englishOnlyDuplicatePaths.has(resolved), `${entry.relativePath}: indexable page links to noindex English-only duplicate ${href}`);
    });
}

function shouldSkipHref(href) {
    return !href
        || href.startsWith("#")
        || href.startsWith("mailto:")
        || href.startsWith("tel:")
        || href.startsWith("javascript:")
        || /^https?:\/\//i.test(href);
}

function resolveLocalCrawlPath(from, value) {
    if (!value || value.startsWith("#") || value.startsWith("//")) {
        return null;
    }

    let pathname = value.split("#")[0].split("?")[0];
    if (!pathname) {
        return null;
    }

    if (/^https?:\/\//i.test(pathname)) {
        let parsed;
        try {
            parsed = new URL(pathname);
        } catch {
            return null;
        }

        if (parsed.origin !== SITE_ORIGIN) {
            return null;
        }
        pathname = parsed.pathname;
    } else if (/^[a-z][a-z0-9+.-]*:/i.test(pathname)) {
        return null;
    }

    if (pathname === "/") {
        return "index.html";
    }

    if (pathname.startsWith("/")) {
        return posix.normalize(pathname.slice(1));
    }

    return resolveInternalHref(from, pathname);
}

function resolveInternalHref(from, href) {
    const withoutHash = href.split("#")[0];
    const baseDir = posix.dirname(from);
    return posix.normalize(posix.join(baseDir === "." ? "" : baseDir, withoutHash));
}

function isAuditableLocalAsset(resolved) {
    return /\.(?:css|js|png|jpe?g|webp|svg|ico|json|xml|webmanifest|txt)$/i.test(resolved);
}

function assertLocalFileExists(owner, resolved, original) {
    if (!localFileExistsCache.has(resolved)) {
        localFileExistsCache.set(resolved, existsSync(join(ROOT, resolved)));
    }

    assert(localFileExistsCache.get(resolved), `${owner}: local crawl reference is missing ${original}`);
}

function count(text, pattern) {
    return (text.match(pattern) || []).length;
}

function countCharacters(text) {
    return Array.from(text || "").length;
}

function assert(condition, message) {
    if (!condition) {
        errors.push(message);
    }
}

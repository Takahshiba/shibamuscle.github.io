#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, posix } from "node:path";

import {
    JAPANESE_LEFTOVER_PATTERNS,
    absoluteUrlForFile,
    getGeneratedLocales,
    getLocaleConfig,
    localizeStaticPage,
    stripIntentionalLanguageSwitchText
} from "./localization.mjs";
import { loadPages } from "./source-data.mjs";

const ROOT = process.cwd();
const ANALYTICS_ID = "G-D9K58THBFM";
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
const staticPageByFile = new Map(loadPages().map((page) => [page.file, page]));
const errors = [];

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
    const localeConfig = getLocaleConfig(entry.locale);
    const expectedHtmlLang = localizedStaticPage?.htmlLang || localeConfig.hreflang;
    const canonicalFile = isSecondaryUnitPage ? entry.file.replace(/^lb_/, "kg_") : entry.file;
    const canonicalUrl = absoluteUrlForFile(canonicalFile, entry.locale);
    const pageUrl = absoluteUrlForFile(entry.file, entry.locale);

    assert(!/https:\/\/(?:ko|zh-hant|zh-hans|es|fr|de|id|en)\.shibamuscle\.com/i.test(html), `${entry.relativePath}: old locale subdomain link remains`);
    assert(!html.includes("precaonnect"), `${entry.relativePath}: precaonnect typo is still present`);
    assert(!html.includes("G-ZPM6B2KLSV"), `${entry.relativePath}: legacy GA id is still present`);
    assert(html.includes(`gtag/js?id=${ANALYTICS_ID}`), `${entry.relativePath}: current GA script is missing`);
    assert(html.includes(`<html lang="${expectedHtmlLang}"`), `${entry.relativePath}: html lang is incorrect`);
    const expectedAlternates = isToolPage || isSecondaryUnitPage ? 0 : getGeneratedLocales().length + 1;
    assert((html.match(/<link rel="alternate" hreflang="/g) || []).length === expectedAlternates, `${entry.relativePath}: hreflang set is incomplete`);
    assert(html.includes(`<link rel="canonical" href="${canonicalUrl}">`), `${entry.relativePath}: canonical is missing or malformed`);
    assert(/<title>[^<]+<\/title>/.test(html), `${entry.relativePath}: title is missing`);
    assert(/<meta name="description" content="[^"]+">/.test(html), `${entry.relativePath}: meta description is missing`);
    assert(/<h1[\s>]/i.test(html) || isToolPage, `${entry.relativePath}: H1 is missing`);
    if (!isToolPage && !isSecondaryUnitPage) {
        assert(sitemapUrls.has(canonicalUrl), `${entry.relativePath}: sitemap is missing ${canonicalUrl}`);
    } else if (isSecondaryUnitPage) {
        assert(!sitemapUrls.has(pageUrl), `${entry.relativePath}: secondary lb page should not be in sitemap`);
        assert(html.includes('<meta name="robots" content="noindex,follow,noarchive">'), `${entry.relativePath}: secondary lb page should be noindex`);
        assert(!html.includes("pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"), `${entry.relativePath}: secondary lb page should not load AdSense script`);
        assert(!html.includes("ins class=\"adsbygoogle\""), `${entry.relativePath}: secondary lb page should not render ad slots`);
    } else {
        assert(!sitemapUrls.has(canonicalUrl), `${entry.relativePath}: noindex tool page should not be in sitemap`);
    }

    if (!isToolPage && !isSecondaryUnitPage) getGeneratedLocales().forEach((locale) => {
        assert(html.includes(`<link rel="alternate" hreflang="${locale.hreflang}" href="${absoluteUrlForFile(canonicalFile, locale.code)}">`), `${entry.relativePath}: ${locale.code} hreflang target is incorrect`);
    });
    if (!isToolPage && !isSecondaryUnitPage) {
        assert(html.includes(`<link rel="alternate" hreflang="x-default" href="${absoluteUrlForFile(canonicalFile, "ja")}">`), `${entry.relativePath}: x-default hreflang target is incorrect`);
        if (!isAppPage) {
            getGeneratedLocales().forEach((locale) => {
                assert(html.includes(`href="${absoluteUrlForFile(canonicalFile, locale.code)}" data-lang="${locale.code}"`), `${entry.relativePath}: footer language link for ${locale.code} is incorrect`);
            });
        }
    }

    auditInternalLinks(entry, html);

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

    if (entry.locale !== "ja") {
        auditSectionDrift(entry, html);
    }

    if (isExercisePage) {
        assert(/<main class="page-main"/.test(html), `${entry.relativePath}: static main wrapper is missing`);
        assert(/<nav class="breadcrumb" aria-label="/.test(html), `${entry.relativePath}: static breadcrumb is missing`);
        assert(html.includes('id="other-workouts"'), `${entry.relativePath}: other workouts section is missing`);
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

function shouldSkipHref(href) {
    return !href
        || href.startsWith("#")
        || href.startsWith("mailto:")
        || href.startsWith("tel:")
        || href.startsWith("javascript:")
        || /^https?:\/\//i.test(href);
}

function resolveInternalHref(from, href) {
    const withoutHash = href.split("#")[0];
    const baseDir = posix.dirname(from);
    return posix.normalize(posix.join(baseDir === "." ? "" : baseDir, withoutHash));
}

function count(text, pattern) {
    return (text.match(pattern) || []).length;
}

function assert(condition, message) {
    if (!condition) {
        errors.push(message);
    }
}

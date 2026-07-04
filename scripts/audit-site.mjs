#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, posix } from "node:path";

import {
    JAPANESE_LEFTOVER_PATTERNS,
    absoluteUrlForFile,
    assetHref,
    getGeneratedLocales,
    getLocaleConfig,
    getMeasurementCopy,
    getOgLocale,
    getUiText,
    localizeStaticPage,
    stripIntentionalLanguageSwitchText
} from "./localization.mjs";
import { buildExerciseFileIndex, loadExercises, loadPages } from "./source-data.mjs";

const ROOT = process.cwd();
const ANALYTICS_ID = "G-D9K58THBFM";
const SITE_ORIGIN = "https://shibamuscle.com";
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/assets/app/shiba-mascot.png`;
const MANIFEST_DESCRIPTION = "Shibaは筋トレの計画、セット記録、進捗分析、種目選びを一つの流れで管理できるiPhone向けワークアウトアプリです。";
const THEME_COLOR = "#ff6a00";
const BACKGROUND_COLOR = "#030303";
const CATEGORY_SECTION_IDS = [
    "whole-body-section",
    "chest-section",
    "back-section",
    "shoulder-section",
    "arm-section",
    "leg-section",
    "core-section"
];
const INDEXABLE_ROBOTS = "index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1";
const PUBLIC_DATE_FUTURE_TOLERANCE_MS = 5 * 60 * 1000;
const MAX_REPORTED_ERRORS = 200;
const htmlEntries = listHtmlEntries();
const availableHtml = new Set(htmlEntries.map((entry) => entry.relativePath));
const sitemap = readFileSync(join(ROOT, "sitemap.xml"), "utf8");
const sitemapUrls = new Set(Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)).map((match) => match[1]));
const sitemapLastmods = Array.from(sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)).map((match) => match[1]);
const sitemapUrlBlocks = Array.from(sitemap.matchAll(/<url>\s*<loc>([^<]+)<\/loc>[\s\S]*?<\/url>/g));
const sitemapBlocksByUrl = new Map(sitemapUrlBlocks.map((match) => [match[1], match[0]]));
const sitemapLastmodByUrl = new Map(sitemapUrlBlocks.map((match) => {
    return [match[1], match[0].match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] || ""];
}));
const sitemapAlternateLinkCount = (sitemap.match(/<xhtml:link\b/g) || []).length;
const staticPageByFile = new Map(loadPages().map((page) => [page.file, page]));
const exerciseFileIndex = buildExerciseFileIndex(loadExercises());
const localFileExistsCache = new Map();
const headCache = new Map();
const htmlIdCache = new Map();
const englishOnlySitemapUrls = new Set(Array.from(staticPageByFile.values())
    .filter((page) => page.englishOnly === true)
    .map((page) => absoluteUrlForFile(page.file, "ja")));
const englishOnlyDuplicatePaths = new Set(Array.from(staticPageByFile.values())
    .filter((page) => page.englishOnly === true)
    .flatMap((page) => getGeneratedLocales()
        .filter((locale) => locale.code !== "ja")
        .map((locale) => `${locale.outputDir}/${page.file}`)));
const noindexHtmlTargets = new Set(htmlEntries
    .filter(isNoindexHtmlEntry)
    .map((entry) => entry.relativePath));
const expectedSitemapAlternateLinkCount = Array.from(sitemapUrls)
    .filter((url) => !englishOnlySitemapUrls.has(url)).length * (getGeneratedLocales().length + 1);
const indexableMetadata = [];
const errors = [];
let suppressedErrorCount = 0;

assert(!/https:\/\/(?:ko|zh-hant|zh-hans|es|fr|de|id|en)\.shibamuscle\.com/i.test(sitemap), "sitemap.xml: old locale subdomain URL remains");
assert(sitemap.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"'), "sitemap.xml: xhtml namespace for hreflang alternates is missing");
assert(sitemap.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"'), "sitemap.xml: image namespace is missing");
assert(sitemapUrlBlocks.length === sitemapUrls.size, "sitemap.xml: duplicate or malformed url entries are present");
auditSitemapProtocolLimits();
auditSitemapLocTargets();
auditSitemapIndexableCoverage();
assert(sitemapLastmods.length === sitemapUrls.size, "sitemap.xml: every URL should have one lastmod");
assert(new Set(sitemapLastmods).size > 1, "sitemap.xml: lastmod values should reflect source changes, not one build timestamp");
sitemapLastmods.forEach((lastmod) => {
    assert(isValidSitemapLastmod(lastmod), `sitemap.xml: invalid lastmod value ${lastmod}`);
    assert(isNotFuturePublicDate(lastmod), `sitemap.xml: future lastmod value ${lastmod}`);
});
assert(sitemapAlternateLinkCount === expectedSitemapAlternateLinkCount, "sitemap.xml: hreflang alternate link count is incomplete");
auditRobotsTxt();
auditAssetStylesheetFiles();
auditWebAppMetadataFiles();
auditStaticPageSourceLocalization();
auditOgSvgAssetReferences();
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
    const isNoindexStaticPage = sourceStaticPage?.noindex === true;
    const isIndexablePage = !isToolPage && !isSecondaryUnitPage && !isEnglishOnlyDuplicate && !isNoindexStaticPage;
    const localeConfig = getLocaleConfig(entry.locale);
    const expectedHtmlLang = localizedStaticPage?.htmlLang || localeConfig.hreflang;
    const expectedHtmlDir = localeConfig.dir || "ltr";
    const canonicalFile = isSecondaryUnitPage ? entry.file.replace(/^lb_/, "kg_") : entry.file;
    const canonicalUrl = absoluteUrlForFile(canonicalFile, isEnglishOnlyPage ? "ja" : entry.locale);
    const pageUrl = absoluteUrlForFile(entry.file, entry.locale);

    assert(/^<!DOCTYPE html>/i.test(html), `${entry.relativePath}: HTML5 doctype is missing`);
    assert(!/https:\/\/(?:ko|zh-hant|zh-hans|es|fr|de|id|en)\.shibamuscle\.com/i.test(localeConfig.origin), `${entry.locale}: old locale subdomain origin remains`);
    assert(!/https:\/\/(?:ko|zh-hant|zh-hans|es|fr|de|id|en)\.shibamuscle\.com/i.test(html), `${entry.relativePath}: old locale subdomain link remains`);
    assert(!html.includes("precaonnect"), `${entry.relativePath}: precaonnect typo is still present`);
    assert(!html.includes("G-ZPM6B2KLSV"), `${entry.relativePath}: legacy GA id is still present`);
    assert(html.includes(`gtag/js?id=${ANALYTICS_ID}`), `${entry.relativePath}: current GA script is missing`);
    assert(html.includes(`<html lang="${expectedHtmlLang}"`), `${entry.relativePath}: html lang is incorrect`);
    assert(html.includes(`<html lang="${expectedHtmlLang}" dir="${expectedHtmlDir}">`), `${entry.relativePath}: html dir is incorrect`);
    auditHtmlAppIconMetadata(entry, html);
    auditSingletonHeadMetadata(entry, html);
    const expectedAlternates = isToolPage || isSecondaryUnitPage || isEnglishOnlyPage || isNoindexStaticPage ? 0 : getGeneratedLocales().length + 1;
    assert((html.match(/<link rel="alternate" hreflang="/g) || []).length === expectedAlternates, `${entry.relativePath}: hreflang set is incomplete`);
    assert(html.includes(`<link rel="canonical" href="${canonicalUrl}">`), `${entry.relativePath}: canonical is missing or malformed`);
    auditRobotsMeta(entry, html, {
        isIndexablePage,
        isToolPage,
        isSecondaryUnitPage,
        isEnglishOnlyDuplicate,
        isNoindexStaticPage
    });
    assert(/<title>[^<]+<\/title>/.test(html), `${entry.relativePath}: title is missing`);
    assert(/<meta name="description" content="[^"]+">/.test(html), `${entry.relativePath}: meta description is missing`);
    auditSocialMetadataConsistency(entry, html, canonicalUrl);
    if (isAppHomePage) {
        auditAppHomeDescription(entry, html);
    }
    if (isAppPage) {
        auditAppTrustNavigation(entry, html, expectedHtmlLang);
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
    auditImagePreloadHints(entry, html, {
        isIndexablePage,
        isHomePage,
        isExercisePage,
        sourceStaticPage
    });
    auditOpenGraphUpdatedTime(entry, html, isIndexablePage);
    auditSitemapLastmodConsistency(entry, html, canonicalUrl, isIndexablePage);
    auditArticleOpenGraphDates(entry, html, isIndexablePage);
    auditNoFutureMetaDates(entry, html);
    auditHeadingStructure(entry, html, isIndexablePage, isToolPage);
    if (isEnglishOnlyDuplicate) {
        assert(!sitemapUrls.has(pageUrl), `${entry.relativePath}: duplicate English-only page should not be in sitemap`);
        assert(html.includes('<meta name="robots" content="noindex,follow,noarchive">'), `${entry.relativePath}: duplicate English-only page should be noindex`);
    } else if (isNoindexStaticPage) {
        assert(!sitemapUrls.has(pageUrl), `${entry.relativePath}: noindex static page should not be in sitemap`);
        assert(html.includes('<meta name="robots" content="noindex,follow,noarchive">'), `${entry.relativePath}: noindex static page robots meta is incorrect`);
    } else if (!isToolPage && !isSecondaryUnitPage) {
        assert(sitemapUrls.has(canonicalUrl), `${entry.relativePath}: sitemap is missing ${canonicalUrl}`);
        if (isEnglishOnlyPage) {
            auditNoSitemapAlternates(entry, canonicalUrl);
        } else {
            auditSitemapAlternates(entry, canonicalFile, canonicalUrl);
            auditHreflangReciprocity(entry, canonicalFile, canonicalUrl);
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
        isStaticContentPage: sourceStaticPage?.kind === "content",
        expectedWebPageTypes: getExpectedWebPageTypes(entry, sourceStaticPage, isExercisePage),
        expectedLanguage: expectedHtmlLang,
        hasVisibleBreadcrumb: /<nav class="breadcrumb" aria-label="/.test(html)
    });

    if (!isToolPage && !isSecondaryUnitPage && !isEnglishOnlyPage && !isNoindexStaticPage) getGeneratedLocales().forEach((locale) => {
        assert(html.includes(`<link rel="alternate" hreflang="${locale.hreflang}" href="${absoluteUrlForFile(canonicalFile, locale.code)}">`), `${entry.relativePath}: ${locale.code} hreflang target is incorrect`);
    });
    if (!isToolPage && !isSecondaryUnitPage && !isEnglishOnlyPage && !isNoindexStaticPage) {
        assert(html.includes(`<link rel="alternate" hreflang="x-default" href="${absoluteUrlForFile(canonicalFile, "ja")}">`), `${entry.relativePath}: x-default hreflang target is incorrect`);
        auditOpenGraphLocaleAlternates(entry, html, expectedHtmlLang);
        if (!isAppPage) {
            getGeneratedLocales().forEach((locale) => {
                assert(html.includes(`href="${absoluteUrlForFile(canonicalFile, locale.code)}" data-lang="${locale.code}"`), `${entry.relativePath}: footer language link for ${locale.code} is incorrect`);
            });
        }
    }

    auditInternalLinks(entry, html, isIndexablePage);
    auditInternalFragmentLinks(entry, html);
    auditCanonicalHomeLinks(entry, html);
    auditTargetBlankLinks(entry, html);
    auditLocalAssetReferences(entry, html);
    auditImageAltText(entry, html);
    auditImageDimensions(entry, html);
    auditImageFetchPriority(entry, html);
    auditImageDecoding(entry, html);
    auditDuplicateLinkedImageAlt(entry, html);
    auditNoLinksToEnglishOnlyDuplicates(entry, html, isIndexablePage);

    if (entry.locale === "ko") {
        auditKoreanHtml(entry, html);
    }

    if (entry.locale === "es") {
        auditSpanishHtml(entry, html);
    }

    if (entry.locale === "fr") {
        auditFrenchHtml(entry, html);
    }

    if (entry.locale === "de") {
        auditGermanHtml(entry, html);
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
        auditExerciseTitleLocalization(entry, html);
        auditRecordImageLoading(entry, html);
        auditExerciseCategoryLinks(entry, html);
        auditExerciseUnitDisplay(entry, html);
        assert(!/<h1 class="section-title"/.test(html), `${entry.relativePath}: section heading is still h1`);
        assert(html.includes("/assets/og/exercises/"), `${entry.relativePath}: dedicated exercise OG image is missing`);
        if (isSecondaryUnitPage) {
            auditNoExerciseArticleOpenGraph(entry, html);
        } else {
            auditExerciseArticleOpenGraph(entry, html);
        }

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
auditIndexableInternalReachability();

if (errors.length) {
    console.error("Site audit failed:\n");
    errors.forEach((error) => console.error(`- ${error}`));
    if (suppressedErrorCount) {
        console.error(`- ... ${suppressedErrorCount} additional errors omitted`);
    }
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
    const sitemapLines = Array.from(robots.matchAll(/^Sitemap:\s*(\S+)\s*$/gmi)).map((match) => match[1]);
    assert(sitemapLines.length === 1 && sitemapLines[0] === `${SITE_ORIGIN}/sitemap.xml`, "robots.txt: canonical sitemap URL is missing or duplicated");
    Array.from(robots.matchAll(/^Disallow:[^\S\r\n]*(\S.*)$/gmi)).forEach((match) => {
        assert(false, `robots.txt: unexpected disallow rule ${match[1]}`);
    });
    assert(!/Disallow:\s*\/(?:assets\/|styles\.css|app\.js|sitemap\.xml)/i.test(robots), "robots.txt: crawl-critical assets or sitemap should not be disallowed");
}

function auditAssetStylesheetFiles() {
    const staleAssetStylesheetPath = join(ROOT, "assets/styles.css");
    if (!existsSync(staleAssetStylesheetPath)) {
        return;
    }

    const content = readFileSync(staleAssetStylesheetPath, "utf8").trimStart();
    assert(!/^<!doctype html/i.test(content) && !/^<html\b/i.test(content), "assets/styles.css: stale HTML document should not be served as CSS");
}

function auditWebAppMetadataFiles() {
    const manifestPaths = ["assets/manifest.json", "assets/site.webmanifest", "site.webmanifest"];
    const manifests = manifestPaths.map((relativePath) => [relativePath, readManifestJson(relativePath)]);
    const referenceManifest = JSON.stringify(manifests[0][1]);

    manifests.forEach(([relativePath, manifest]) => {
        assert(JSON.stringify(manifest) === referenceManifest, `${relativePath}: web app manifest should match assets/manifest.json`);
        assert(manifest.name === "Shiba", `${relativePath}: manifest name should match the current app brand`);
        assert(manifest.short_name === "Shiba", `${relativePath}: manifest short_name should match the current app brand`);
        assert(manifest.description === MANIFEST_DESCRIPTION, `${relativePath}: manifest description should match the current homepage positioning`);
        assert(!String(manifest.description || "").includes("ワークアウトデータベース"), `${relativePath}: legacy database-only manifest description remains`);
        assert(manifest.id === "/", `${relativePath}: manifest id should be canonical root`);
        assert(manifest.start_url === "/", `${relativePath}: manifest start_url should be canonical root`);
        assert(manifest.scope === "/", `${relativePath}: manifest scope should be canonical root`);
        assert(manifest.lang === "ja", `${relativePath}: manifest lang should be ja`);
        assert(manifest.dir === "ltr", `${relativePath}: manifest dir should be ltr`);
        assert(manifest.theme_color === THEME_COLOR, `${relativePath}: manifest theme_color is incorrect`);
        assert(manifest.background_color === BACKGROUND_COLOR, `${relativePath}: manifest background_color is incorrect`);
        assert(manifest.display === "standalone", `${relativePath}: manifest display is incorrect`);
        assert(manifest.orientation === "any", `${relativePath}: manifest orientation is incorrect`);
        assert(Array.isArray(manifest.icons) && manifest.icons.length >= 2, `${relativePath}: manifest icons are missing`);

        (manifest.icons || []).forEach((icon) => {
            assert(/^\/assets\/android-chrome-\d+x\d+\.png$/.test(icon.src || ""), `${relativePath}: manifest icon src is not a canonical asset path`);
            assert(/^\d+x\d+$/.test(icon.sizes || ""), `${relativePath}: manifest icon size is invalid`);
            assert(icon.type === "image/png", `${relativePath}: manifest icon type should be image/png`);
            assert(icon.purpose === "any", `${relativePath}: manifest icon purpose should be any`);
            const resolved = resolveLocalCrawlPath(relativePath, icon.src);
            assert(Boolean(resolved), `${relativePath}: manifest icon cannot be resolved ${icon.src}`);
            if (resolved) {
                assertLocalFileExists(relativePath, resolved, icon.src);
            }
        });
    });

    ["browserconfig.xml", "assets/browserconfig.xml"].forEach((relativePath) => {
        assert(existsSync(join(ROOT, relativePath)), `${relativePath}: browserconfig is missing`);
        if (!existsSync(join(ROOT, relativePath))) {
            return;
        }

        const xml = readFileSync(join(ROOT, relativePath), "utf8");
        assert(!xml.includes("/mstile-"), `${relativePath}: browserconfig references legacy missing mstile assets`);
        [
            "/assets/site-tile-70x70.png",
            "/assets/site-tile-150x150.png",
            "/assets/site-tile-310x150.png",
            "/assets/site-tile-310x310.png"
        ].forEach((asset) => {
            assert(xml.includes(asset), `${relativePath}: browserconfig is missing ${asset}`);
            assertLocalFileExists(relativePath, resolveLocalCrawlPath(relativePath, asset), asset);
        });
        assert(xml.includes(`<TileColor>${THEME_COLOR}</TileColor>`), `${relativePath}: browserconfig TileColor is incorrect`);
    });
}

function auditStaticPageSourceLocalization() {
    const generatedLocales = getGeneratedLocales().filter((locale) => locale.code !== "ja");

    staticPageByFile.forEach((page) => {
        if (page.englishOnly === true) {
            return;
        }
        const sourcePath = `src/pages/${page.file === "index.html" ? "home.json" : page.file.replace(/\.html$/, ".json")}`;

        generatedLocales.forEach((locale) => {
            const localizedPage = page.locales?.[locale.code];
            assert(Boolean(localizedPage), `${sourcePath}: missing ${locale.code} localization`);
            if (!localizedPage) {
                return;
            }

            ["title", "description", "heading"].forEach((field) => {
                assert(Boolean(String(localizedPage[field] || "").trim()), `${sourcePath}: missing ${locale.code} ${field}`);
            });
        });
    });
}

function auditOgSvgAssetReferences() {
    ["assets/og/exercises", "assets/og/discovery"].forEach((relativeDir) => {
        const dir = join(ROOT, relativeDir);
        if (!existsSync(dir)) {
            return;
        }

        readdirSync(dir)
            .filter((file) => file.endsWith(".svg"))
            .forEach((file) => {
                const relativePath = `${relativeDir}/${file}`;
                const svg = readFileSync(join(ROOT, relativePath), "utf8");

                Array.from(svg.matchAll(/<image\b[^>]*\shref="([^"]+)"/gi)).forEach((match) => {
                    const href = match[1];
                    assert(/^https:\/\/shibamuscle\.com\/assets\//.test(href), `${relativePath}: OG SVG image href should be an absolute HTTPS asset URL`);
                    const resolved = resolveLocalCrawlPath(relativePath, href);
                    assert(Boolean(resolved), `${relativePath}: OG SVG image href cannot be resolved ${href}`);
                    if (resolved) {
                        assertLocalFileExists(relativePath, resolved, href);
                    }
                });
            });
    });
}

function readManifestJson(relativePath) {
    assert(existsSync(join(ROOT, relativePath)), `${relativePath}: web app manifest is missing`);
    if (!existsSync(join(ROOT, relativePath))) {
        return {};
    }

    try {
        return JSON.parse(readFileSync(join(ROOT, relativePath), "utf8"));
    } catch (error) {
        assert(false, `${relativePath}: web app manifest is invalid JSON (${error.message})`);
        return {};
    }
}

function auditHtmlAppIconMetadata(entry, html) {
    assert(html.includes(`<meta name="msapplication-TileColor" content="${THEME_COLOR}">`), `${entry.relativePath}: msapplication TileColor should match the app theme`);
    assert(/<meta name="msapplication-config" content="[^"]*assets\/browserconfig\.xml\?v=shiba-20260704">/.test(html), `${entry.relativePath}: msapplication browserconfig reference is missing`);
    assert(/<link rel="manifest" href="[^"]*assets\/manifest\.json\?v=shiba-20260704">/.test(html), `${entry.relativePath}: web app manifest reference is missing`);
}

function auditSitemapProtocolLimits() {
    assert(sitemapUrls.size <= 50000, "sitemap.xml: sitemap should not contain more than 50,000 URLs");
    assert(Buffer.byteLength(sitemap, "utf8") <= 50 * 1024 * 1024, "sitemap.xml: sitemap should not exceed 50MB uncompressed");
}

function auditSitemapLocTargets() {
    sitemapUrls.forEach((url) => {
        const relativePath = resolveSitemapUrlPath(url);
        assert(Boolean(relativePath), `sitemap.xml: invalid or non-canonical URL ${url}`);
        if (!relativePath) {
            return;
        }

        assert(availableHtml.has(relativePath), `sitemap.xml: URL does not map to generated HTML (${url})`);
        assert(!relativePath.endsWith("Shift2ics.html"), `sitemap.xml: noindex tool page should not be listed (${url})`);
        assert(!/(^|\/)lb_[^/]+\.html$/.test(relativePath), `sitemap.xml: secondary lb page should not be listed (${url})`);
    });
}

function auditSitemapIndexableCoverage() {
    const expectedUrls = new Set(htmlEntries
        .filter((entry) => !isNoindexHtmlEntry(entry))
        .map((entry) => {
            const staticPage = staticPageByFile.get(entry.file);
            const locale = staticPage?.englishOnly === true ? "ja" : entry.locale;

            return absoluteUrlForFile(entry.file, locale);
        }));

    assert(sitemapUrls.size === expectedUrls.size, `sitemap.xml: expected ${expectedUrls.size} indexable URLs, found ${sitemapUrls.size}`);
    expectedUrls.forEach((url) => {
        assert(sitemapUrls.has(url), `sitemap.xml: missing indexable URL ${url}`);
    });
    sitemapUrls.forEach((url) => {
        assert(expectedUrls.has(url), `sitemap.xml: URL should not be listed because it is not indexable ${url}`);
    });
}

function resolveSitemapUrlPath(url) {
    try {
        const parsed = new URL(url);
        if (parsed.origin !== SITE_ORIGIN || parsed.search || parsed.hash) {
            return "";
        }

        const pathname = decodeURIComponent(parsed.pathname);
        if (pathname === "/") {
            return "index.html";
        }
        if (/\/$/.test(pathname)) {
            return `${pathname.replace(/^\//, "")}index.html`;
        }
        if (!/\.html$/.test(pathname)) {
            return "";
        }

        return pathname.replace(/^\//, "");
    } catch {
        return "";
    }
}

function readHeadByRelativePath(relativePath) {
    if (!headCache.has(relativePath)) {
        const buffer = readFileSync(join(ROOT, relativePath));
        const headEnd = buffer.indexOf("</head>");
        const headBuffer = headEnd === -1 ? buffer : buffer.subarray(0, headEnd);
        headCache.set(relativePath, headBuffer.toString("utf8"));
    }

    return headCache.get(relativePath);
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
        if (/\blink-icon\b/.test(tag)) {
            assert(altMatch?.[1] === "", `${entry.relativePath}: decorative footer link icon alt should be empty`);
            assert(/\saria-hidden="true"/i.test(tag), `${entry.relativePath}: decorative footer link icon should be aria-hidden`);
        }
        if (/\bflag-icon\b/.test(tag) && altMatch) {
            assert(!bareFlagAlts.has(altMatch[1].trim()), `${entry.relativePath}: flag image alt should describe the flag, not just "${altMatch[1]}"`);
            if (/countryflags\.com/i.test(tag)) {
                assert(isDescriptiveFlagAlt(altMatch[1]), `${entry.relativePath}: external country flag image alt should describe the flag`);
            }
        }
    });
}

function auditImageDimensions(entry, html) {
    Array.from(html.matchAll(/<img\b[^>]*>/gi)).forEach((match) => {
        const tag = match[0];
        const width = tag.match(/\swidth="([^"]+)"/i)?.[1] || "";
        const height = tag.match(/\sheight="([^"]+)"/i)?.[1] || "";

        assert(isPositiveIntegerString(width), `${entry.relativePath}: image width attribute is missing or invalid`);
        assert(isPositiveIntegerString(height), `${entry.relativePath}: image height attribute is missing or invalid`);
    });
}

function auditImageFetchPriority(entry, html) {
    Array.from(html.matchAll(/<img\b[^>]*>/gi)).forEach((match) => {
        const tag = match[0];
        if (/\sloading="lazy"/i.test(tag)) {
            assert(/\sfetchpriority="low"/i.test(tag), `${entry.relativePath}: lazy image should use fetchpriority=low`);
            assert(!/\sfetchpriority="high"/i.test(tag), `${entry.relativePath}: lazy image should not use fetchpriority=high`);
        }

        if (/\sfetchpriority="high"/i.test(tag)) {
            assert(!/\sloading="lazy"/i.test(tag), `${entry.relativePath}: high-priority image should not be lazy-loaded`);
        }
    });
}

function auditImageDecoding(entry, html) {
    Array.from(html.matchAll(/<img\b[^>]*>/gi)).forEach((match) => {
        const tag = match[0];
        if (/\sloading="lazy"/i.test(tag)) {
            assert(/\sdecoding="async"/i.test(tag), `${entry.relativePath}: lazy image should use decoding=async`);
        }
    });
}

function auditDuplicateLinkedImageAlt(entry, html) {
    Array.from(html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)).forEach((match) => {
        const anchor = match[0];
        const imageAlts = Array.from(anchor.matchAll(/<img\b[^>]*\salt="([^"]*)"[^>]*>/gi))
            .map((altMatch) => normalizeAuditText(altMatch[1]))
            .filter(Boolean);
        if (!imageAlts.length) {
            return;
        }

        const visibleText = normalizeAuditText(anchor.replace(/<img\b[^>]*>/gi, " ").replace(/<[^>]+>/g, " "));
        imageAlts.forEach((alt) => {
            assert(alt !== visibleText, `${entry.relativePath}: linked image alt duplicates adjacent link text (${alt})`);
        });
    });
}

function normalizeAuditText(value) {
    return decodeAuditHtml(String(value || ""))
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

function decodeAuditHtml(value) {
    return String(value || "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, "\"")
        .replace(/&#39;/g, "'");
}

function auditImagePreloadHints(entry, html, { isIndexablePage, isHomePage, isExercisePage, sourceStaticPage }) {
    const preloadTags = Array.from(html.matchAll(/<link\b(?=[^>]*\brel="preload")(?=[^>]*\bas="image")[^>]*>/gi)).map((match) => match[0]);

    if (!isIndexablePage) {
        assert(preloadTags.length === 0, `${entry.relativePath}: noindex page should not preload LCP images`);
        return;
    }

    const expectedHref = getExpectedLcpImageHref(entry, { isHomePage, isExercisePage, sourceStaticPage });
    if (!expectedHref) {
        assert(preloadTags.length === 0, `${entry.relativePath}: page should not preload non-LCP images`);
        return;
    }

    assert(preloadTags.length === 1, `${entry.relativePath}: expected exactly one LCP image preload`);
    const preloadTag = preloadTags[0] || "";
    assert(preloadTag.includes(`href="${expectedHref}"`), `${entry.relativePath}: LCP image preload href is incorrect`);
    assert(/\bfetchpriority="high"/i.test(preloadTag), `${entry.relativePath}: LCP image preload should use fetchpriority=high`);
    assert(hasHighPriorityImage(html, expectedHref), `${entry.relativePath}: preloaded LCP image should match a high-priority img tag`);
}

function getExpectedLcpImageHref(entry, { isHomePage, isExercisePage, sourceStaticPage }) {
    if (isHomePage) {
        return assetHref(sourceStaticPage?.appImages?.today || "app/today-screen-current.png", entry.locale);
    }

    if (isExercisePage && entry.file.startsWith("kg_")) {
        const exercise = exerciseFileIndex.byFile.get(entry.file)?.exercise;
        return exercise?.image?.src ? assetHref(exercise.image.src, entry.locale) : "";
    }

    return "";
}

function hasHighPriorityImage(html, expectedHref) {
    return Array.from(html.matchAll(/<img\b[^>]*>/gi)).some((match) => {
        const tag = match[0];
        return tag.includes(`src="${expectedHref}"`) && /\bfetchpriority="high"/i.test(tag);
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
        assert(descriptionLength >= 45 && descriptionLength <= 180, `${page.path}: description length should stay between 45 and 180 characters`);
        assert(page.title !== page.description, `${page.path}: title and description should not be identical`);
    });
}

function auditIndexableInternalReachability() {
    const indexablePages = htmlEntries
        .filter((entry) => !isNoindexHtmlEntry(entry))
        .map((entry) => {
            const html = readFileSync(entry.path, "utf8");
            const canonicalUrl = extractFirstGroup(html, /<link rel="canonical" href="([^"]+)">/i);
            return {
                ...entry,
                canonicalPath: resolveLocalCrawlPath(entry.relativePath, canonicalUrl)
            };
        })
        .filter((entry) => entry.canonicalPath);
    const indexablePaths = new Set(indexablePages.map((entry) => entry.canonicalPath));
    const incomingLinks = new Map(Array.from(indexablePaths, (entryPath) => [entryPath, new Set()]));

    indexablePages.forEach((entry) => {
        const html = readFileSync(entry.path, "utf8");
        let match;
        const anchorPattern = /<a\b[^>]*>/gi;

        while ((match = anchorPattern.exec(html))) {
            const tag = match[0];
            if (hasHtmlRelToken(tag, "nofollow")) {
                continue;
            }

            const target = resolveLocalCrawlPath(entry.relativePath, extractHtmlAttribute(tag, "href"));
            if (!target || !indexablePaths.has(target) || target === entry.canonicalPath) {
                continue;
            }

            incomingLinks.get(target)?.add(entry.canonicalPath);
        }
    });

    incomingLinks.forEach((sources, targetPath) => {
        if (targetPath === "index.html") {
            return;
        }

        assert(sources.size >= 3, `${targetPath}: indexable page should have at least 3 followed internal inlinks, found ${sources.size}`);
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

function auditAppTrustNavigation(entry, html, expectedLanguage) {
    const homeHref = buildExpectedLocalizedStaticHref("index.html", entry.locale, expectedLanguage);
    const aboutHref = buildExpectedLocalizedStaticHref("about.html", entry.locale, expectedLanguage);
    const methodologyHref = buildExpectedLocalizedStaticHref("methodology.html", entry.locale, expectedLanguage);
    const contactHref = buildExpectedLocalizedStaticHref("contact.html", entry.locale, expectedLanguage);

    [
        [homeHref, "Home"],
        [`${homeHref}#analytics`, "Features"],
        [aboutHref, "About"],
        [methodologyHref, "Methodology"],
        [contactHref, "Contact"]
    ].forEach(([href, label]) => {
        assert(html.includes(`href="${href}"`), `${entry.relativePath}: app navigation should link to ${label}`);
    });
}

function buildExpectedLocalizedStaticHref(file, locale = "ja", language = getLocaleConfig(locale).hreflang) {
    const targetLocale = getNavigationLocaleForLanguage(locale, language);
    if (file === "index.html") {
        return absoluteUrlForFile(file, targetLocale);
    }

    if (targetLocale === locale) {
        return file;
    }

    return locale === "ja" ? `${targetLocale}/${file}` : `../${targetLocale}/${file}`;
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
        const targetUrl = absoluteUrlForFile(canonicalFile, locale.code);
        const expected = buildExpectedSitemapAlternateLink(locale.hreflang, targetUrl);
        assert(block.includes(expected), `${entry.relativePath}: sitemap ${locale.code} hreflang target is incorrect`);
        auditSitemapAlternateTarget(entry, targetUrl);
    });

    const defaultUrl = absoluteUrlForFile(canonicalFile, "ja");
    const expectedDefault = buildExpectedSitemapAlternateLink("x-default", defaultUrl);
    assert(block.includes(expectedDefault), `${entry.relativePath}: sitemap x-default hreflang target is incorrect`);
    auditSitemapAlternateTarget(entry, defaultUrl);
}

function auditSitemapAlternateTarget(entry, targetUrl) {
    const targetPath = resolveSitemapUrlPath(targetUrl);
    assert(Boolean(targetPath), `${entry.relativePath}: sitemap hreflang target URL is invalid (${targetUrl})`);
    if (!targetPath) {
        return;
    }

    assert(availableHtml.has(targetPath), `${entry.relativePath}: sitemap hreflang target is not generated (${targetUrl})`);
    const targetHead = readHeadByRelativePath(targetPath);
    assert(targetHead.includes(`<link rel="canonical" href="${targetUrl}">`), `${entry.relativePath}: sitemap hreflang target ${targetPath} does not canonicalize to itself`);
}

function auditHreflangReciprocity(entry, canonicalFile, canonicalUrl) {
    const sourceHreflang = getLocaleConfig(entry.locale).hreflang;

    getGeneratedLocales().forEach((targetLocale) => {
        const targetUrl = absoluteUrlForFile(canonicalFile, targetLocale.code);
        const targetPath = resolveSitemapUrlPath(targetUrl);
        assert(Boolean(targetPath), `${entry.relativePath}: hreflang target URL is invalid (${targetUrl})`);
        if (!targetPath) {
            return;
        }

        assert(availableHtml.has(targetPath), `${entry.relativePath}: hreflang target is not generated (${targetUrl})`);
        const targetHead = readHeadByRelativePath(targetPath);
        assert(targetHead.includes(`<link rel="canonical" href="${targetUrl}">`), `${entry.relativePath}: hreflang target ${targetPath} does not canonicalize to itself`);
        assert(targetHead.includes(`<link rel="alternate" hreflang="${sourceHreflang}" href="${canonicalUrl}">`), `${entry.relativePath}: hreflang target ${targetPath} does not link back to ${canonicalUrl}`);
        assert(targetHead.includes(`<link rel="alternate" hreflang="x-default" href="${absoluteUrlForFile(canonicalFile, "ja")}">`), `${entry.relativePath}: hreflang target ${targetPath} has incorrect x-default`);
    });
}

function auditOpenGraphLocaleAlternates(entry, html, expectedHtmlLang) {
    const expectedPrimary = getExpectedOpenGraphLocale(entry, expectedHtmlLang);
    const actualPrimary = extractFirstGroup(html, /<meta property="og:locale" content="([^"]+)">/i);
    const actualAlternates = Array.from(html.matchAll(/<meta property="og:locale:alternate" content="([^"]+)">/gi)).map((match) => match[1]);
    const expectedAlternates = getGeneratedLocales()
        .map((locale) => getOgLocale(locale.code))
        .filter((locale) => locale !== expectedPrimary);

    assert(actualPrimary === expectedPrimary, `${entry.relativePath}: og:locale should be ${expectedPrimary}`);
    assert(actualAlternates.length === expectedAlternates.length, `${entry.relativePath}: og:locale:alternate set is incomplete`);
    assert(new Set(actualAlternates).size === actualAlternates.length, `${entry.relativePath}: og:locale:alternate values should be unique`);
    expectedAlternates.forEach((locale) => {
        assert(actualAlternates.includes(locale), `${entry.relativePath}: og:locale:alternate is missing ${locale}`);
    });
    actualAlternates.forEach((locale) => {
        assert(expectedAlternates.includes(locale), `${entry.relativePath}: unexpected og:locale:alternate ${locale}`);
    });
}

function getExpectedOpenGraphLocale(entry, expectedHtmlLang) {
    const matchingLocale = getGeneratedLocales().find((locale) => {
        return locale.hreflang.toLowerCase() === String(expectedHtmlLang || "").toLowerCase();
    });
    if (matchingLocale) {
        return getOgLocale(matchingLocale.code);
    }
    if (String(expectedHtmlLang || "").toLowerCase().startsWith("en")) {
        return "en_US";
    }

    return getOgLocale(entry.locale);
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
        addExpectedSitemapImageUrl(urls, staticPage.ogImage || DEFAULT_OG_IMAGE);
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

function isNotFuturePublicDate(value) {
    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp) && timestamp <= Date.now() + PUBLIC_DATE_FUTURE_TOLERANCE_MS;
}

function isChronologicalDateRange(start, end) {
    const startTimestamp = Date.parse(start);
    const endTimestamp = Date.parse(end);

    return Number.isFinite(startTimestamp) && Number.isFinite(endTimestamp) && startTimestamp <= endTimestamp;
}

function auditNoFutureMetaDates(entry, html) {
    Array.from(html.matchAll(/<meta property="(og:updated_time|article:published_time|article:modified_time)" content="([^"]+)">/gi)).forEach((match) => {
        assert(isNotFuturePublicDate(match[2]), `${entry.relativePath}: ${match[1]} should not be in the future`);
    });
}

function auditNoFutureStructuredDataDates(entry, graph) {
    graph.forEach((node) => {
        ["datePublished", "dateModified"].forEach((field) => {
            if (node?.[field]) {
                assert(isNotFuturePublicDate(node[field]), `${entry.relativePath}: ${node["@id"] || node["@type"] || "JSON-LD"} ${field} should not be in the future`);
            }
        });
    });
}

function auditRobotsMeta(entry, html, { isIndexablePage, isToolPage, isSecondaryUnitPage, isEnglishOnlyDuplicate, isNoindexStaticPage }) {
    const robots = extractFirstGroup(html, /<meta name="robots" content="([^"]+)">/i);

    if (isIndexablePage) {
        assert(robots === INDEXABLE_ROBOTS, `${entry.relativePath}: indexable page robots meta should allow full snippets and previews`);
        return;
    }

    if (isToolPage) {
        assert(robots === "noindex,nofollow,noarchive", `${entry.relativePath}: noindex tool page robots meta is incorrect`);
        return;
    }

    if (isSecondaryUnitPage || isEnglishOnlyDuplicate || isNoindexStaticPage) {
        assert(robots === "noindex,follow,noarchive", `${entry.relativePath}: duplicate/noindex page robots meta is incorrect`);
    }
}

function auditSingletonHeadMetadata(entry, html) {
    const head = extractHeadMarkup(html);
    const requiredSingletons = [
        ["charset", /<meta\b(?=[^>]*\bcharset=)[^>]*>/gi],
        ["viewport", /<meta\b(?=[^>]*\bname="viewport")[^>]*>/gi],
        ["title", /<title\b[\s\S]*?<\/title>/gi],
        ["meta description", /<meta\b(?=[^>]*\bname="description")[^>]*>/gi],
        ["robots meta", /<meta\b(?=[^>]*\bname="robots")[^>]*>/gi],
        ["theme-color meta", /<meta\b(?=[^>]*\bname="theme-color")[^>]*>/gi],
        ["canonical link", /<link\b(?=[^>]*\brel="canonical")[^>]*>/gi],
        ["og:type", /<meta\b(?=[^>]*\bproperty="og:type")[^>]*>/gi],
        ["og:site_name", /<meta\b(?=[^>]*\bproperty="og:site_name")[^>]*>/gi],
        ["og:locale", /<meta\b(?=[^>]*\bproperty="og:locale")[^>]*>/gi],
        ["og:title", /<meta\b(?=[^>]*\bproperty="og:title")[^>]*>/gi],
        ["og:description", /<meta\b(?=[^>]*\bproperty="og:description")[^>]*>/gi],
        ["og:url", /<meta\b(?=[^>]*\bproperty="og:url")[^>]*>/gi],
        ["og:image", /<meta\b(?=[^>]*\bproperty="og:image")[^>]*>/gi],
        ["og:image:secure_url", /<meta\b(?=[^>]*\bproperty="og:image:secure_url")[^>]*>/gi],
        ["og:image:type", /<meta\b(?=[^>]*\bproperty="og:image:type")[^>]*>/gi],
        ["og:image:width", /<meta\b(?=[^>]*\bproperty="og:image:width")[^>]*>/gi],
        ["og:image:height", /<meta\b(?=[^>]*\bproperty="og:image:height")[^>]*>/gi],
        ["og:image:alt", /<meta\b(?=[^>]*\bproperty="og:image:alt")[^>]*>/gi],
        ["twitter:card", /<meta\b(?=[^>]*\bname="twitter:card")[^>]*>/gi],
        ["twitter:title", /<meta\b(?=[^>]*\bname="twitter:title")[^>]*>/gi],
        ["twitter:description", /<meta\b(?=[^>]*\bname="twitter:description")[^>]*>/gi],
        ["twitter:image", /<meta\b(?=[^>]*\bname="twitter:image")[^>]*>/gi],
        ["twitter:image:alt", /<meta\b(?=[^>]*\bname="twitter:image:alt")[^>]*>/gi]
    ];
    const optionalSingletons = [
        ["og:updated_time", /<meta\b(?=[^>]*\bproperty="og:updated_time")[^>]*>/gi],
        ["article:published_time", /<meta\b(?=[^>]*\bproperty="article:published_time")[^>]*>/gi],
        ["article:modified_time", /<meta\b(?=[^>]*\bproperty="article:modified_time")[^>]*>/gi],
        ["article:section", /<meta\b(?=[^>]*\bproperty="article:section")[^>]*>/gi]
    ];

    requiredSingletons.forEach(([label, pattern]) => {
        const count = countMatches(head, pattern);
        assert(count === 1, `${entry.relativePath}: expected exactly one ${label} tag, found ${count}`);
    });
    optionalSingletons.forEach(([label, pattern]) => {
        const count = countMatches(head, pattern);
        assert(count <= 1, `${entry.relativePath}: expected at most one ${label} tag, found ${count}`);
    });

    const charset = extractFirstGroup(head, /<meta\b[^>]*\bcharset=(?:"([^"]+)"|'([^']+)'|([^\s/>]+))/i);
    const viewportTag = head.match(/<meta\b(?=[^>]*\bname="viewport")[^>]*>/i)?.[0] || "";
    const viewport = extractHtmlAttribute(viewportTag, "content");

    assert(charset.toLowerCase() === "utf-8", `${entry.relativePath}: charset should be UTF-8`);
    assert(/^width=device-width,\s*initial-scale=1(?:\.0)?$/.test(viewport), `${entry.relativePath}: viewport should use width=device-width, initial-scale=1.0`);
}

function auditSocialMetadataConsistency(entry, html, canonicalUrl) {
    const title = decodeAuditHtml(extractFirstGroup(html, /<title>([\s\S]*?)<\/title>/i));
    const description = decodeAuditHtml(extractFirstGroup(html, /<meta name="description" content="([^"]+)">/i));
    const canonical = extractFirstGroup(html, /<link rel="canonical" href="([^"]+)">/i);
    const ogTitle = decodeAuditHtml(extractFirstGroup(html, /<meta property="og:title" content="([^"]+)">/i));
    const ogDescription = decodeAuditHtml(extractFirstGroup(html, /<meta property="og:description" content="([^"]+)">/i));
    const ogUrl = extractFirstGroup(html, /<meta property="og:url" content="([^"]+)">/i);
    const twitterTitle = decodeAuditHtml(extractFirstGroup(html, /<meta name="twitter:title" content="([^"]+)">/i));
    const twitterDescription = decodeAuditHtml(extractFirstGroup(html, /<meta name="twitter:description" content="([^"]+)">/i));
    const ogSiteName = extractFirstGroup(html, /<meta property="og:site_name" content="([^"]+)">/i);
    const ogType = extractFirstGroup(html, /<meta property="og:type" content="([^"]+)">/i);
    const twitterCard = extractFirstGroup(html, /<meta name="twitter:card" content="([^"]+)">/i);

    assert(canonical === canonicalUrl, `${entry.relativePath}: canonical URL should match the resolved canonical URL`);
    assert(ogUrl === canonical, `${entry.relativePath}: og:url should match canonical URL`);
    assert(ogTitle === title, `${entry.relativePath}: og:title should match the document title`);
    assert(twitterTitle === title, `${entry.relativePath}: twitter:title should match the document title`);
    assert(ogDescription === description, `${entry.relativePath}: og:description should match meta description`);
    assert(twitterDescription === description, `${entry.relativePath}: twitter:description should match meta description`);
    assert(ogSiteName === "Shiba Muscle", `${entry.relativePath}: og:site_name should be Shiba Muscle`);
    assert(["website", "article"].includes(ogType), `${entry.relativePath}: og:type should be website or article`);
    assert(["summary", "summary_large_image"].includes(twitterCard), `${entry.relativePath}: twitter:card is unsupported`);
}

function extractHeadMarkup(html) {
    return html.match(/<head\b[^>]*>[\s\S]*?<\/head>/i)?.[0] || html;
}

function countMatches(text, pattern) {
    return (text.match(pattern) || []).length;
}

function assertSocialImageMetadata(entry, html, isToolPage) {
    if (isToolPage) {
        return;
    }

    const ogImage = extractFirstGroup(html, /<meta property="og:image" content="([^"]+)">/i);
    const ogSecureImage = extractFirstGroup(html, /<meta property="og:image:secure_url" content="([^"]+)">/i);
    const twitterImage = extractFirstGroup(html, /<meta name="twitter:image" content="([^"]+)">/i);
    const ogImageAlt = extractFirstGroup(html, /<meta property="og:image:alt" content="([^"]+)">/i);
    const twitterImageAlt = extractFirstGroup(html, /<meta name="twitter:image:alt" content="([^"]+)">/i);
    const twitterCard = extractFirstGroup(html, /<meta name="twitter:card" content="([^"]+)">/i);
    const imageType = extractFirstGroup(html, /<meta property="og:image:type" content="([^"]+)">/i);
    const imageWidth = extractFirstGroup(html, /<meta property="og:image:width" content="([^"]+)">/i);
    const imageHeight = extractFirstGroup(html, /<meta property="og:image:height" content="([^"]+)">/i);
    const imageWidthNumber = Number.parseInt(imageWidth, 10);
    const imageHeightNumber = Number.parseInt(imageHeight, 10);

    assert(/^https:\/\/shibamuscle\.com\/assets\//.test(ogImage), `${entry.relativePath}: og:image should be an absolute HTTPS asset URL`);
    assert(ogSecureImage === ogImage, `${entry.relativePath}: og:image:secure_url should match og:image`);
    assert(twitterImage === ogImage, `${entry.relativePath}: twitter:image should match og:image`);
    assert(/^image\/(?:svg\+xml|png|jpe?g|webp)$/.test(imageType), `${entry.relativePath}: og:image:type is missing or invalid`);
    assert(isPositiveIntegerString(imageWidth), `${entry.relativePath}: og:image:width is missing or invalid`);
    assert(isPositiveIntegerString(imageHeight), `${entry.relativePath}: og:image:height is missing or invalid`);
    if (twitterCard === "summary_large_image") {
        const ratio = imageWidthNumber / imageHeightNumber;
        assert(imageWidthNumber >= 600 && imageHeightNumber >= 315, `${entry.relativePath}: summary_large_image should use an image at least 600x315`);
        assert(ratio >= 1.7 && ratio <= 2.1, `${entry.relativePath}: summary_large_image should use a landscape image close to 1.91:1`);
    }
    assert(Boolean(ogImageAlt), `${entry.relativePath}: og:image:alt is missing`);
    assert(Boolean(twitterImageAlt), `${entry.relativePath}: twitter:image:alt is missing`);
    if (ogImage.endsWith("/assets/app/shiba-social-card.png")) {
        assert(!/\bToday\b/i.test(ogImageAlt), `${entry.relativePath}: app social card alt should describe the composite preview, not only Today`);
        assert(!/\bToday\b/i.test(twitterImageAlt), `${entry.relativePath}: app social card Twitter alt should describe the composite preview, not only Today`);
    }

    const resolved = resolveLocalCrawlPath(entry.relativePath, ogImage);
    if (resolved) {
        assertLocalFileExists(entry.relativePath, resolved, ogImage);
    }
}

function auditOpenGraphUpdatedTime(entry, html, isIndexable) {
    const updatedTime = extractFirstGroup(html, /<meta property="og:updated_time" content="([^"]+)">/i);

    if (!isIndexable) {
        assert(!updatedTime, `${entry.relativePath}: noindex page should not emit og:updated_time`);
        return;
    }

    assert(isValidSitemapLastmod(updatedTime), `${entry.relativePath}: og:updated_time is missing or invalid`);
}

function auditSitemapLastmodConsistency(entry, html, canonicalUrl, isIndexable) {
    if (!isIndexable) {
        return;
    }

    const sitemapLastmod = sitemapLastmodByUrl.get(canonicalUrl);
    const updatedTime = extractFirstGroup(html, /<meta property="og:updated_time" content="([^"]+)">/i);

    assert(Boolean(sitemapLastmod), `${entry.relativePath}: sitemap lastmod is missing for canonical URL`);
    assert(sitemapLastmod === updatedTime, `${entry.relativePath}: sitemap lastmod should match og:updated_time`);
}

function auditHeadingStructure(entry, html, isIndexable, isToolPage) {
    if (isToolPage) {
        return;
    }

    const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
    const h2Count = (html.match(/<h2[\s>]/gi) || []).length;

    assert(h1Count === 1, `${entry.relativePath}: expected exactly one H1`);
    if (isIndexable) {
        assert(h2Count >= 1, `${entry.relativePath}: indexable page should include at least one H2 section`);
    }
}

function auditArticleOpenGraphDates(entry, html, isIndexable) {
    if (!/<meta property="og:type" content="article">/i.test(html)) {
        return;
    }

    const publishedTime = extractFirstGroup(html, /<meta property="article:published_time" content="([^"]+)">/i);
    const modifiedTime = extractFirstGroup(html, /<meta property="article:modified_time" content="([^"]+)">/i);
    const section = extractFirstGroup(html, /<meta property="article:section" content="([^"]+)">/i);

    if (!isIndexable) {
        [
            "article:published_time",
            "article:modified_time",
            "article:section",
            "article:tag"
        ].forEach((property) => {
            assert(!html.includes(`property="${property}"`), `${entry.relativePath}: noindex article page should not emit ${property}`);
        });
        return;
    }

    const updatedTime = extractFirstGroup(html, /<meta property="og:updated_time" content="([^"]+)">/i);
    assert(isValidSitemapLastmod(publishedTime), `${entry.relativePath}: article:published_time is missing or invalid`);
    assert(isValidSitemapLastmod(modifiedTime), `${entry.relativePath}: article:modified_time is missing or invalid`);
    assert(isChronologicalDateRange(publishedTime, modifiedTime), `${entry.relativePath}: article published time should not be newer than modified time`);
    assert(modifiedTime === updatedTime, `${entry.relativePath}: article:modified_time should match og:updated_time`);
    assert(Boolean(section), `${entry.relativePath}: article:section is missing`);
}

function auditExerciseArticleOpenGraph(entry, html) {
    const publishedTime = extractFirstGroup(html, /<meta property="article:published_time" content="([^"]+)">/i);
    const modifiedTime = extractFirstGroup(html, /<meta property="article:modified_time" content="([^"]+)">/i);
    const section = extractFirstGroup(html, /<meta property="article:section" content="([^"]+)">/i);
    const tags = Array.from(html.matchAll(/<meta property="article:tag" content="([^"]+)">/gi)).map((match) => match[1].trim()).filter(Boolean);

    assert(isValidSitemapLastmod(publishedTime), `${entry.relativePath}: article:published_time is missing or invalid`);
    assert(isValidSitemapLastmod(modifiedTime), `${entry.relativePath}: article:modified_time is missing or invalid`);
    assert(isChronologicalDateRange(publishedTime, modifiedTime), `${entry.relativePath}: article published time should not be newer than modified time`);
    assert(Boolean(section), `${entry.relativePath}: article:section is missing`);
    assert(tags.length >= 1, `${entry.relativePath}: article:tag is missing`);
    assert(new Set(tags).size === tags.length, `${entry.relativePath}: article:tag values should be unique`);
}

function auditNoExerciseArticleOpenGraph(entry, html) {
    [
        "article:published_time",
        "article:modified_time",
        "article:section",
        "article:tag"
    ].forEach((property) => {
        assert(!html.includes(`property="${property}"`), `${entry.relativePath}: noindex exercise page should not emit ${property}`);
    });
}

function auditStructuredData(entry, html, { canonicalUrl, isIndexable, isHomePage, isExercisePage, isStaticContentPage, expectedWebPageTypes = ["WebPage"], expectedLanguage, hasVisibleBreadcrumb }) {
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
    const documentTitle = decodeAuditHtml(extractFirstGroup(html, /<title>([\s\S]*?)<\/title>/i));
    const metaDescription = decodeAuditHtml(extractFirstGroup(html, /<meta name="description" content="([^"]+)">/i));
    assert(graph.length >= 4, `${entry.relativePath}: JSON-LD graph is too small`);
    auditNoFutureStructuredDataDates(entry, graph);
    const organization = graph.find((node) => node?.["@id"] === "https://shibamuscle.com/#organization" && hasType(node, "Organization"));
    const website = graph.find((node) => node?.["@id"] === "https://shibamuscle.com/#website" && hasType(node, "WebSite"));
    assert(Boolean(organization), `${entry.relativePath}: Organization schema is missing`);
    assert(Boolean(website), `${entry.relativePath}: WebSite schema is missing`);

    if (organization) {
        assert(organization.name === "Shiba Muscle", `${entry.relativePath}: Organization name is incorrect`);
        assert(Boolean(organization.description), `${entry.relativePath}: Organization description is missing`);
        assert(organization.url === "https://shibamuscle.com", `${entry.relativePath}: Organization URL is incorrect`);
        assert(organization.email === "info@shibamuscle.com", `${entry.relativePath}: Organization support email is missing`);
        assert(organization.publishingPrinciples === "https://shibamuscle.com/methodology.html", `${entry.relativePath}: Organization publishingPrinciples URL is incorrect`);
        assert(organization.logo?.url === "https://shibamuscle.com/assets/app/shiba-mascot.png", `${entry.relativePath}: Organization logo is incorrect`);
        assert(organization.contactPoint?.["@type"] === "ContactPoint", `${entry.relativePath}: Organization contactPoint is missing`);
        assert(organization.contactPoint?.email === "info@shibamuscle.com", `${entry.relativePath}: Organization contactPoint email is missing`);
        assert(organization.contactPoint?.url === "https://shibamuscle.com/contact.html", `${entry.relativePath}: Organization contactPoint URL is missing`);
        ["ja", "en", "ko", "zh-Hant", "zh-Hans", "es", "fr", "de", "id"].forEach((language) => {
            assert((organization.contactPoint?.availableLanguage || []).includes(language), `${entry.relativePath}: Organization contactPoint language ${language} is missing`);
        });
    }

    if (website) {
        auditWebSiteStructuredData(entry, website, expectedLanguage);
    }

    const webPage = graph.find((node) => node?.["@id"] === `${canonicalUrl}#webpage` && hasType(node, "WebPage"));
    assert(Boolean(webPage), `${entry.relativePath}: WebPage schema is missing`);
    if (webPage) {
        const openGraphUpdatedTime = extractFirstGroup(html, /<meta property="og:updated_time" content="([^"]+)">/i);
        expectedWebPageTypes.forEach((type) => {
            assert(hasType(webPage, type), `${entry.relativePath}: WebPage schema type ${type} is missing`);
        });
        assert(webPage.url === canonicalUrl, `${entry.relativePath}: WebPage schema URL does not match canonical`);
        assert(Boolean(webPage.name), `${entry.relativePath}: WebPage schema name is empty`);
        assert(Boolean(webPage.description), `${entry.relativePath}: WebPage schema description is empty`);
        assert(webPage.name === documentTitle, `${entry.relativePath}: WebPage schema name should match the document title`);
        assert(webPage.description === metaDescription, `${entry.relativePath}: WebPage schema description should match meta description`);
        assert(Boolean(webPage.inLanguage), `${entry.relativePath}: WebPage schema language is empty`);
        assert(isValidSitemapLastmod(webPage.datePublished), `${entry.relativePath}: WebPage schema datePublished is missing or invalid`);
        assert(isValidSitemapLastmod(webPage.dateModified), `${entry.relativePath}: WebPage schema dateModified is missing or invalid`);
        assert(isChronologicalDateRange(webPage.datePublished, webPage.dateModified), `${entry.relativePath}: WebPage schema datePublished should not be newer than dateModified`);
        assert(openGraphUpdatedTime === webPage.dateModified, `${entry.relativePath}: og:updated_time should match WebPage schema dateModified`);
        assert(webPage.isPartOf?.["@id"] === "https://shibamuscle.com/#website", `${entry.relativePath}: WebPage schema site link is missing`);
    }

    auditStructuredDataImages(entry, graph);

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
        auditHomeStructuredData(entry, graph, canonicalUrl, webPage);
    }

    if (isExercisePage) {
        auditExerciseStructuredData(entry, graph, canonicalUrl, webPage, { documentTitle, metaDescription });
    }

    if (isStaticContentPage) {
        auditStaticContentStructuredData(entry, graph, canonicalUrl, webPage, expectedLanguage, { documentTitle, metaDescription });
    }
}

function auditHomeStructuredData(entry, graph, canonicalUrl, webPage) {
    const itemListId = `${canonicalUrl}#exercise-preview-list`;
    const itemList = graph.find((node) => node?.["@id"] === itemListId && hasType(node, "ItemList"));
    const expectedSlugs = ["bench-press", "squat", "deadlift", "lat-pulldown"];

    assert(Boolean(itemList), `${entry.relativePath}: homepage ItemList schema is missing`);
    if (!itemList) {
        return;
    }

    assert(itemList.url === `${canonicalUrl}#library`, `${entry.relativePath}: homepage ItemList URL is incorrect`);
    assert(itemList.inLanguage === getLocaleConfig(entry.locale).hreflang, `${entry.relativePath}: homepage ItemList language is incorrect`);
    assert(itemList.numberOfItems === expectedSlugs.length, `${entry.relativePath}: homepage ItemList numberOfItems is incorrect`);
    assert(itemList.itemListOrder === "https://schema.org/ItemListOrderAscending", `${entry.relativePath}: homepage ItemList order is incorrect`);
    assert(itemList.publisher?.["@id"] === "https://shibamuscle.com/#organization", `${entry.relativePath}: homepage ItemList publisher organization is missing`);
    assert(itemList.publishingPrinciples === absoluteUrlForFile("methodology.html", entry.locale), `${entry.relativePath}: homepage ItemList publishingPrinciples URL is incorrect`);
    assert(referencesStructuredDataNode(webPage?.mainEntity, itemListId), `${entry.relativePath}: WebPage mainEntity should reference homepage ItemList`);
    assert(Array.isArray(itemList.itemListElement) && itemList.itemListElement.length === expectedSlugs.length, `${entry.relativePath}: homepage ItemList entries are incomplete`);

    (itemList.itemListElement || []).forEach((item, index) => {
        const expectedUrl = absoluteUrlForFile(`kg_${expectedSlugs[index]}.html`, entry.locale);

        assert(item?.["@type"] === "ListItem", `${entry.relativePath}: homepage ItemList entry ${index + 1} should be a ListItem`);
        assert(item.position === index + 1, `${entry.relativePath}: homepage ItemList entry ${index + 1} position is incorrect`);
        assert(item.url === expectedUrl, `${entry.relativePath}: homepage ItemList entry ${index + 1} URL is incorrect`);
        assert(item.item?.["@type"] === "WebPage", `${entry.relativePath}: homepage ItemList entry ${index + 1} item should be a WebPage`);
        assert(item.item?.["@id"] === `${expectedUrl}#webpage`, `${entry.relativePath}: homepage ItemList entry ${index + 1} item id is incorrect`);
        assert(item.item?.url === expectedUrl, `${entry.relativePath}: homepage ItemList entry ${index + 1} item URL is incorrect`);
        assert(Boolean(item.item?.name), `${entry.relativePath}: homepage ItemList entry ${index + 1} item name is missing`);
        assert(/^https:\/\/shibamuscle\.com\/assets\//.test(item.item?.image || ""), `${entry.relativePath}: homepage ItemList entry ${index + 1} image URL is incorrect`);
        const resolvedImage = resolveLocalCrawlPath(entry.relativePath, item.item?.image || "");
        assert(Boolean(resolvedImage), `${entry.relativePath}: homepage ItemList entry ${index + 1} image URL cannot be resolved`);
        if (resolvedImage) {
            assertLocalFileExists(entry.relativePath, resolvedImage, item.item.image);
        }
    });
}

function auditWebSiteStructuredData(entry, website, expectedLanguage) {
    const navigationLocale = getNavigationLocaleForLanguage(entry.locale, expectedLanguage);
    const expectedNavigation = [
        ["index.html", getUiText(navigationLocale, "home")],
        ["about.html", getUiText(navigationLocale, "about")],
        ["methodology.html", getUiText(navigationLocale, "methodology")],
        ["contact.html", getUiText(navigationLocale, "contact")],
        ["privacy-policy.html", getUiText(navigationLocale, "privacy")]
    ];
    const hasPart = Array.isArray(website.hasPart) ? website.hasPart : [];

    assert(website.url === "https://shibamuscle.com/", `${entry.relativePath}: WebSite URL is incorrect`);
    assert(website.inLanguage === expectedLanguage, `${entry.relativePath}: WebSite language is incorrect`);
    assert(website.publisher?.["@id"] === "https://shibamuscle.com/#organization", `${entry.relativePath}: WebSite publisher organization is missing`);
    assert(hasPart.length === expectedNavigation.length, `${entry.relativePath}: WebSite navigation schema is incomplete`);

    expectedNavigation.forEach(([file, label]) => {
        const expectedUrl = absoluteUrlForFile(file, navigationLocale);
        const item = hasPart.find((node) => hasType(node, "SiteNavigationElement") && node.url === expectedUrl);

        assert(Boolean(item), `${entry.relativePath}: WebSite navigation schema is missing ${expectedUrl}`);
        if (item) {
            assert(item.name === label, `${entry.relativePath}: WebSite navigation label for ${expectedUrl} is incorrect`);
        }
    });
}

function getNavigationLocaleForLanguage(locale = "ja", language = "") {
    const normalizedLanguage = String(language || "").toLowerCase();
    return normalizedLanguage === "en" || normalizedLanguage.startsWith("en-") ? "en" : locale;
}

function auditStructuredDataImages(entry, graph) {
    graph.forEach((node) => {
        collectStructuredDataImageUrls([
            node.image,
            node.primaryImageOfPage,
            hasType(node, "ImageObject") ? node.url : null
        ]).forEach((url) => {
            assert(/^https:\/\/shibamuscle\.com\/assets\//.test(url), `${entry.relativePath}: ${node["@id"] || node["@type"]} schema image should be an absolute HTTPS asset URL`);
            const resolved = resolveLocalCrawlPath(entry.relativePath, url);
            assert(Boolean(resolved), `${entry.relativePath}: ${node["@id"] || node["@type"]} schema image URL cannot be resolved (${url})`);
            if (resolved) {
                assertLocalFileExists(entry.relativePath, resolved, url);
            }
        });
    });
}

function collectStructuredDataImageUrls(value) {
    if (!value) {
        return [];
    }

    if (typeof value === "string") {
        return [value];
    }

    if (Array.isArray(value)) {
        return value.flatMap((item) => collectStructuredDataImageUrls(item));
    }

    if (typeof value === "object") {
        if (typeof value.url === "string") {
            return [value.url];
        }
        if (typeof value["@id"] === "string" && Object.keys(value).length === 1) {
            return [];
        }
    }

    return [];
}

function getExpectedWebPageTypes(entry, sourceStaticPage, isExercisePage) {
    const types = ["WebPage"];
    if (isExercisePage && entry.file.startsWith("kg_")) {
        types.push("ItemPage");
    }
    if (sourceStaticPage?.kind === "home") {
        types.push("CollectionPage");
    }

    const staticTypes = {
        "about.html": "AboutPage",
        "contact.html": "ContactPage"
    };
    const staticType = sourceStaticPage ? staticTypes[sourceStaticPage.file] : null;
    if (staticType) {
        types.push(staticType);
    }

    return types;
}

function auditStaticContentStructuredData(entry, graph, canonicalUrl, webPage, expectedLanguage, { documentTitle, metaDescription }) {
    const article = graph.find((node) => node?.["@id"] === `${canonicalUrl}#article` && hasType(node, "Article"));
    const publishingPrinciplesUrl = getExpectedPublishingPrinciplesUrl(entry, expectedLanguage);

    assert(Boolean(article), `${entry.relativePath}: static content Article schema is missing`);
    if (!article) {
        return;
    }

    assert(Boolean(article.headline), `${entry.relativePath}: static Article headline is empty`);
    assert(Boolean(article.name), `${entry.relativePath}: static Article name is empty`);
    assert(Boolean(article.description) && article.description.length >= 45, `${entry.relativePath}: static Article description is too short`);
    assert(documentTitle.includes(article.headline), `${entry.relativePath}: static Article headline should be represented in the document title`);
    assert(article.description === metaDescription, `${entry.relativePath}: static Article description should match meta description`);
    assert(article.url === canonicalUrl, `${entry.relativePath}: static Article URL does not match canonical`);
    assert(article.inLanguage === expectedLanguage, `${entry.relativePath}: static Article language is incorrect`);
    assert(isValidSitemapLastmod(article.datePublished), `${entry.relativePath}: static Article datePublished is missing or invalid`);
    assert(isValidSitemapLastmod(article.dateModified), `${entry.relativePath}: static Article dateModified is missing or invalid`);
    assert(isChronologicalDateRange(article.datePublished, article.dateModified), `${entry.relativePath}: static Article datePublished should not be newer than dateModified`);
    assert(Array.isArray(article.image) && article.image.length >= 1, `${entry.relativePath}: static Article image list is missing`);
    assert(article.mainEntityOfPage?.["@id"] === `${canonicalUrl}#webpage`, `${entry.relativePath}: static Article mainEntityOfPage is incorrect`);
    assert(Boolean(article.articleSection), `${entry.relativePath}: static Article section is missing`);
    assert(Boolean(article.keywords) && article.keywords.length >= 10, `${entry.relativePath}: static Article keywords are missing or too short`);
    assert(article.author?.["@id"] === "https://shibamuscle.com/#organization", `${entry.relativePath}: static Article author organization is missing`);
    assert(article.publisher?.["@id"] === "https://shibamuscle.com/#organization", `${entry.relativePath}: static Article publisher organization is missing`);
    assert(article.publishingPrinciples === publishingPrinciplesUrl, `${entry.relativePath}: static Article publishingPrinciples URL is incorrect`);
    assert(article.isAccessibleForFree === true, `${entry.relativePath}: static Article should be marked accessible for free`);
    assert(referencesStructuredDataNode(webPage?.mainEntity, `${canonicalUrl}#article`), `${entry.relativePath}: WebPage mainEntity should reference static Article`);
}

function auditExerciseStructuredData(entry, graph, canonicalUrl, webPage, { documentTitle, metaDescription }) {
    const exerciseMatch = exerciseFileIndex.byFile.get(entry.file);
    const measurementKind = exerciseMatch?.exercise?.metadata?.measurementKind || "weight";
    const measurementCopy = getMeasurementCopy(measurementKind, entry.locale);
    const exerciseTerm = graph.find((node) => node?.["@id"] === `${canonicalUrl}#exercise` && hasType(node, "DefinedTerm"));
    const article = graph.find((node) => node?.["@id"] === `${canonicalUrl}#article` && hasType(node, "Article"));
    const dataCatalogId = `${canonicalUrl}#exercise-data-catalog`;
    const dataCatalogUrl = `${canonicalUrl}#other-workouts`;
    const dataCatalog = graph.find((node) => node?.["@id"] === dataCatalogId && hasType(node, "DataCatalog"));
    const dataset = graph.find((node) => node?.["@id"] === `${canonicalUrl}#dataset` && hasType(node, "Dataset"));
    const publishingPrinciplesUrl = absoluteUrlForFile("methodology.html", entry.locale);

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
        assert(documentTitle.includes(article.headline), `${entry.relativePath}: Article headline should be represented in the document title`);
        assert(article.description === metaDescription, `${entry.relativePath}: Article description should match meta description`);
        assert(article.url === canonicalUrl, `${entry.relativePath}: Article URL does not match canonical`);
        assert(article.inLanguage === getLocaleConfig(entry.locale).hreflang, `${entry.relativePath}: Article language is incorrect`);
        assert(Array.isArray(article.image) && article.image.length >= 1, `${entry.relativePath}: Article image list is missing`);
        assert(article.mainEntityOfPage?.["@id"] === `${canonicalUrl}#webpage`, `${entry.relativePath}: Article mainEntityOfPage is incorrect`);
        assert(isValidSitemapLastmod(article.datePublished), `${entry.relativePath}: Article datePublished is missing or invalid`);
        assert(isValidSitemapLastmod(article.dateModified), `${entry.relativePath}: Article dateModified is missing or invalid`);
        assert(isChronologicalDateRange(article.datePublished, article.dateModified), `${entry.relativePath}: Article datePublished should not be newer than dateModified`);
        assert(Boolean(article.articleSection), `${entry.relativePath}: Article section is missing`);
        assert(Boolean(article.keywords) && article.keywords.length >= 10, `${entry.relativePath}: Article keywords are missing or too short`);
        assert(article.about?.["@id"] === `${canonicalUrl}#exercise`, `${entry.relativePath}: Article about link should reference the exercise node`);
        assert(Array.isArray(article.mentions) && article.mentions.length >= 1, `${entry.relativePath}: Article muscle mentions are missing`);
        assert(article.author?.["@id"] === "https://shibamuscle.com/#organization", `${entry.relativePath}: Article author organization is missing`);
        assert(article.publisher?.["@id"] === "https://shibamuscle.com/#organization", `${entry.relativePath}: Article publisher organization is missing`);
        assert(article.publishingPrinciples === publishingPrinciplesUrl, `${entry.relativePath}: Article publishingPrinciples URL is incorrect`);
        assert(article.isAccessibleForFree === true, `${entry.relativePath}: Article should be marked accessible for free`);
    }

    if (dataCatalog) {
        assert(Boolean(dataCatalog.name), `${entry.relativePath}: DataCatalog name is empty`);
        assert(Boolean(dataCatalog.description) && dataCatalog.description.length >= 50, `${entry.relativePath}: DataCatalog description is too short`);
        assert(dataCatalog.url === dataCatalogUrl, `${entry.relativePath}: DataCatalog URL does not point to the exercise catalog section`);
        assert(dataCatalog.inLanguage === getLocaleConfig(entry.locale).hreflang, `${entry.relativePath}: DataCatalog language is incorrect`);
        assert(dataCatalog.publisher?.["@id"] === "https://shibamuscle.com/#organization", `${entry.relativePath}: DataCatalog publisher organization is missing`);
        assert(dataCatalog.dataset?.["@id"] === `${canonicalUrl}#dataset`, `${entry.relativePath}: DataCatalog should reference the page Dataset`);
        assert(dataCatalog.publishingPrinciples === publishingPrinciplesUrl, `${entry.relativePath}: DataCatalog publishingPrinciples URL is incorrect`);
    }

    if (dataset) {
        assert(Boolean(dataset.name), `${entry.relativePath}: Dataset name is empty`);
        assert(dataset.identifier === `${canonicalUrl}#dataset`, `${entry.relativePath}: Dataset identifier should match the canonical dataset node`);
        assert(Boolean(dataset.description) && dataset.description.length >= 50, `${entry.relativePath}: Dataset description is too short`);
        assert(dataset.url === canonicalUrl, `${entry.relativePath}: Dataset URL does not match canonical`);
        assert(dataset.inLanguage === getLocaleConfig(entry.locale).hreflang, `${entry.relativePath}: Dataset language is incorrect`);
        assert(isValidSitemapLastmod(dataset.datePublished), `${entry.relativePath}: Dataset datePublished is missing or invalid`);
        assert(isValidSitemapLastmod(dataset.dateModified), `${entry.relativePath}: Dataset dateModified is missing or invalid`);
        assert(isChronologicalDateRange(dataset.datePublished, dataset.dateModified), `${entry.relativePath}: Dataset datePublished should not be newer than dateModified`);
        assert(Boolean(dataset.image), `${entry.relativePath}: Dataset image is missing`);
        assert(Array.isArray(dataset.keywords) && dataset.keywords.length >= 1, `${entry.relativePath}: Dataset keywords are missing`);
        assert(dataset.about?.["@id"] === `${canonicalUrl}#exercise`, `${entry.relativePath}: Dataset about link should reference the exercise node`);
        assert(dataset.creator?.["@id"] === "https://shibamuscle.com/#organization", `${entry.relativePath}: Dataset creator organization is missing`);
        assert(dataset.publisher?.["@id"] === "https://shibamuscle.com/#organization", `${entry.relativePath}: Dataset publisher organization is missing`);
        assert(dataset.publishingPrinciples === publishingPrinciplesUrl, `${entry.relativePath}: Dataset publishingPrinciples URL is incorrect`);
        assert(dataset.includedInDataCatalog?.["@id"] === dataCatalogId, `${entry.relativePath}: Dataset catalog link is missing or incorrect`);
        assert(dataset.isAccessibleForFree === true, `${entry.relativePath}: Dataset should be marked accessible for free`);
        assert(Array.isArray(dataset.variableMeasured) && dataset.variableMeasured.length >= 3, `${entry.relativePath}: Dataset measured variables are incomplete`);
        assert(dataset.variableMeasured?.[2] === measurementCopy.detailLabel, `${entry.relativePath}: Dataset measured variable label is not localized`);
        assert(dataset.measurementTechnique === getExpectedDatasetMeasurementTechnique(measurementKind, entry.locale), `${entry.relativePath}: Dataset measurement technique is not localized`);
    }

    if (webPage) {
        [
            `${canonicalUrl}#article`,
            `${canonicalUrl}#dataset`,
            `${canonicalUrl}#exercise`
        ].forEach((id) => {
            assert(referencesStructuredDataNode(webPage.mainEntity, id), `${entry.relativePath}: WebPage mainEntity should reference ${id}`);
        });
    }
}

function getExpectedPublishingPrinciplesUrl(entry, expectedLanguage) {
    const locale = expectedLanguage === "en" ? "en" : entry.locale;

    return absoluteUrlForFile("methodology.html", locale);
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

function referencesStructuredDataNode(value, id) {
    if (!value) {
        return false;
    }

    return (Array.isArray(value) ? value : [value]).some((item) => item?.["@id"] === id);
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

function auditExerciseTitleLocalization(entry, html) {
    const exerciseMatch = exerciseFileIndex.byFile.get(entry.file);
    const japaneseName = exerciseMatch?.exercise?.names?.ja || "";
    const title = decodeAuditHtml(extractFirstGroup(html, /<title>([\s\S]*?)<\/title>/i));
    const h1 = decodeAuditHtml(htmlToText(extractFirstGroup(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i)));

    assert(Boolean(title), `${entry.relativePath}: exercise title should not be empty`);
    assert(Boolean(h1), `${entry.relativePath}: exercise H1 should not be empty`);
    assert(title.includes("Shiba Muscle"), `${entry.relativePath}: exercise title should include the site name`);
    assert(title !== h1, `${entry.relativePath}: exercise title should be more specific than the H1`);

    if (entry.locale === "ja") {
        return;
    }

    assert(!/[\u3040-\u30ff]/.test(title), `${entry.relativePath}: exercise title contains Japanese kana`);
    assert(!/[\u3040-\u30ff]/.test(h1), `${entry.relativePath}: exercise H1 contains Japanese kana`);
    if (/[\u3040-\u30ff]/.test(japaneseName)) {
        assert(!title.includes(japaneseName), `${entry.relativePath}: exercise title uses Japanese fallback name ${japaneseName}`);
        assert(!h1.includes(japaneseName), `${entry.relativePath}: exercise H1 uses Japanese fallback name ${japaneseName}`);
    }
}

function extractFirstMatch(text, pattern) {
    return text.match(pattern)?.[0] || "";
}

function extractFirstGroup(text, pattern) {
    return text.match(pattern)?.[1]?.trim() || "";
}

function extractHtmlAttribute(tag, name) {
    const match = tag.match(new RegExp(`\\s${name}=(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));

    return match?.[1] || match?.[2] || match?.[3] || "";
}

function htmlToText(value) {
    return String(value || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
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

function auditFrenchHtml(entry, html) {
    auditLatinLocalizedHtml(entry, html, "French");
}

function auditGermanHtml(entry, html) {
    auditLatinLocalizedHtml(entry, html, "German");
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

function auditLatinLocalizedHtml(entry, html, languageName) {
    const normalized = stripIntentionalLanguageSwitchText(html)
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "");

    JAPANESE_LEFTOVER_PATTERNS.forEach((pattern) => {
        assert(!pattern.test(normalized), `${entry.relativePath}: Japanese text remains in ${languageName} output`);
    });

    assert(!/[\u3040-\u30ff]/.test(normalized), `${entry.relativePath}: Japanese kana remains in ${languageName} output`);
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
        cards: count(html, /class="[^"]*\bexercise-card\b[^"]*"/g),
        averageTables: count(html, /class="average-section-table"/g),
        standardsGroups: count(html, /data-tab-group="Standards Exercise"/g),
        tabs: count(html, /<div class="tab/g)
    };
}

function auditInternalLinks(entry, html, isIndexablePage) {
    Array.from(html.matchAll(/<a\b[^>]*>/gi)).forEach((match) => {
        const tag = match[0];
        const href = extractHtmlAttribute(tag, "href");
        const resolved = resolveLocalCrawlPath(entry.relativePath, href);
        if (!resolved?.endsWith(".html")) {
            return;
        }

        assert(availableHtml.has(resolved), `${entry.relativePath}: broken internal link to ${href}`);

        if (isIndexablePage && noindexHtmlTargets.has(resolved)) {
            assert(hasHtmlRelToken(tag, "nofollow"), `${entry.relativePath}: indexable page should not follow noindex page ${href}`);
        }
    });
}

function auditInternalFragmentLinks(entry, html) {
    let match;
    const anchorPattern = /<a\b[^>]*>/gi;

    while ((match = anchorPattern.exec(html))) {
        const href = extractHtmlAttribute(match[0], "href");
        const fragmentId = extractHrefFragmentId(href);
        if (!fragmentId) {
            continue;
        }

        const targetPath = resolveLocalFragmentTargetPath(entry.relativePath, href);
        if (!targetPath) {
            continue;
        }

        assert(availableHtml.has(targetPath), `${entry.relativePath}: broken internal fragment link to ${href}`);
        if (!availableHtml.has(targetPath)) {
            continue;
        }

        if (targetPath === entry.relativePath) {
            assert(hasHtmlId(html, fragmentId), `${entry.relativePath}: internal fragment link target is missing ${href}`);
            continue;
        }

        assert(readHtmlIdsByRelativePath(targetPath).has(fragmentId), `${entry.relativePath}: internal fragment link target is missing ${href}`);
    }
}

function extractHrefFragmentId(href) {
    if (!href || !href.includes("#")) {
        return "";
    }

    const fragment = href.slice(href.indexOf("#") + 1);
    if (!fragment) {
        return "";
    }

    try {
        return decodeURIComponent(fragment);
    } catch {
        return fragment;
    }
}

function resolveLocalFragmentTargetPath(from, href) {
    if (!href || !href.includes("#")) {
        return "";
    }

    const withoutFragment = href.slice(0, href.indexOf("#"));
    if (!withoutFragment) {
        return from;
    }

    return resolveLocalCrawlPath(from, href) || "";
}

function readHtmlIdsByRelativePath(relativePath) {
    if (!htmlIdCache.has(relativePath)) {
        htmlIdCache.set(relativePath, collectHtmlIds(readFileSync(join(ROOT, relativePath), "utf8")));
    }

    return htmlIdCache.get(relativePath);
}

function hasHtmlId(html, id) {
    return html.includes(`id="${id}"`);
}

function collectHtmlIds(html) {
    const ids = new Set();
    let match;
    const idPattern = /\sid="([^"]+)"/gi;

    while ((match = idPattern.exec(html))) {
        ids.add(match[1]);
    }

    return ids;
}

function auditCanonicalHomeLinks(entry, html) {
    Array.from(html.matchAll(/<a\b[^>]*href="([^"]+)"/gi)).forEach((match) => {
        const href = match[1];
        assert(!/(^|\/)index\.html(?:#|$)/.test(href), `${entry.relativePath}: home link should use the canonical directory URL, not ${href}`);
    });
}

function auditTargetBlankLinks(entry, html) {
    Array.from(html.matchAll(/<a\b(?=[^>]*\btarget=(?:"_blank"|'_blank'|_blank))[^>]*>/gi)).forEach((match) => {
        const relTokens = new Set(extractHtmlAttribute(match[0], "rel").split(/\s+/).filter(Boolean).map((token) => token.toLowerCase()));

        assert(relTokens.has("noopener"), `${entry.relativePath}: target="_blank" link should include rel="noopener"`);
        assert(relTokens.has("noreferrer"), `${entry.relativePath}: target="_blank" link should include rel="noreferrer"`);
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

function isNoindexHtmlEntry(entry) {
    const staticPage = staticPageByFile.get(entry.file);

    return entry.file === "Shift2ics.html"
        || entry.file.startsWith("lb_")
        || staticPage?.noindex === true
        || (staticPage?.englishOnly === true && entry.locale !== "ja");
}

function hasHtmlRelToken(tag, token) {
    return extractHtmlAttribute(tag, "rel")
        .split(/\s+/)
        .filter(Boolean)
        .some((value) => value.toLowerCase() === token.toLowerCase());
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
        return normalizeCrawlPath(pathname.slice(1));
    }

    return resolveInternalHref(from, pathname);
}

function resolveInternalHref(from, href) {
    const withoutHash = href.split("#")[0];
    const baseDir = posix.dirname(from);
    return normalizeCrawlPath(posix.join(baseDir === "." ? "" : baseDir, withoutHash));
}

function normalizeCrawlPath(pathname) {
    const normalized = posix.normalize(pathname);
    if (!normalized || normalized === ".") {
        return "index.html";
    }

    return normalized.endsWith("/") ? `${normalized}index.html` : normalized;
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

function isPositiveIntegerString(value) {
    return /^[1-9]\d*$/.test(value || "");
}

function assert(condition, message) {
    if (!condition) {
        if (errors.length < MAX_REPORTED_ERRORS) {
            errors.push(message);
        } else {
            suppressedErrorCount += 1;
        }
    }
}

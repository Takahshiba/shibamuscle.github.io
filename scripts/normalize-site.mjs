#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { findSectionTaxonomy } from "./exercise-metadata.mjs";
import {
    absoluteUrlForFile,
    assetHref,
    buildAlternateUrls,
    buildExerciseSeo,
    buildExerciseSeoDescription,
    getCategoryLabel,
    getExerciseName,
    getGeneratedLocales,
    getLocaleConfig,
    getOgLocale,
    getRelatedTags,
    getUiText,
    languageAlternates,
    localizeStaticPage
} from "./localization.mjs";
import {
    CATALOG_PATH,
    DISCOVERY_PATH,
    EXERCISE_SRC_ROOT,
    PAGES_ROOT,
    buildExerciseFileIndex,
    getSourceCreatedIso,
    getSourceLastmodIso,
    loadDiscovery,
    loadExercises,
    loadPages,
    loadTaxonomy
} from "./source-data.mjs";

const ROOT = process.cwd();
const SITE_ORIGIN = "https://shibamuscle.com";
const ANALYTICS_ID = "G-D9K58THBFM";
const SITE_THEME_COLOR = "#148a6a";
const APP_THEME_COLOR = "#ff6a00";
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/assets/app/shiba-mascot.png`;
const INDEXABLE_ROBOTS = "index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1";
const ICON_ASSET_VERSION = "shiba-20260704";
const MANIFEST_DESCRIPTION = "Shibaは筋トレの計画、セット記録、進捗分析、種目選びを一つの流れで管理できるiPhone向けワークアウトアプリです。";
const WEB_APP_BACKGROUND_COLOR = "#030303";
const ANDROID_ICON_SIZES = [36, 48, 72, 96, 128, 144, 152, 192, 256, 384, 512];
const imageMetadataCache = new Map();
const ANALYTICS_BLOCK = `
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_ID}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${ANALYTICS_ID}');
    </script>
`;

const taxonomy = loadTaxonomy();
const exercises = loadExercises();
const discovery = loadDiscovery();
const staticPages = loadPages();
const exerciseFileIndex = buildExerciseFileIndex(exercises);
const discoveryFileIndex = new Map(discovery.pages.map((page) => [page.file, page]));
const staticPageIndex = new Map(staticPages.map((page) => [page.file, page]));
const allHtmlEntries = listHtmlEntries();
const htmlEntries = selectHtmlEntries(allHtmlEntries);
const sitemapOnly = process.env.SHIBA_NORMALIZE_SITEMAP_ONLY === "1";
const skipSitemap = process.env.SHIBA_NORMALIZE_SKIP_SITEMAP === "1";

let changedFiles = 0;

if (!sitemapOnly) {
    for (const entry of htmlEntries) {
        const original = readFileSync(entry.path, "utf8").replace(/\r\n/g, "\n");
        const normalized = normalizeHtml(entry, original);

        if (normalized !== original) {
            writeFileSync(entry.path, normalized);
            changedFiles += 1;
        }
    }
}

if (!skipSitemap) {
    writeFileSync(join(ROOT, "sitemap.xml"), buildSitemap(allHtmlEntries));
    writeManifestFiles();
}

console.log(skipSitemap
    ? `Normalized ${changedFiles} HTML files and skipped sitemap.xml.`
    : `Normalized ${changedFiles} HTML files and regenerated sitemap.xml.`);

function selectHtmlEntries(entries) {
    const filter = process.env.SHIBA_NORMALIZE_FILE_FILTER;
    if (!filter) {
        return entries;
    }

    const allowed = new Set(filter.split(",").map((item) => item.trim()).filter(Boolean));
    return entries.filter((entry) => allowed.has(entry.file) || allowed.has(entry.relativePath));
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

function normalizeHtml(entry, html) {
    const context = buildPageContext(entry, html);
    const localeConfig = getLocaleConfig(entry.locale);

    let next = html;

    next = next.replace(/<html\b[^>]*>/i, `<html lang="${escapeAttribute(localeConfig.hreflang)}" dir="${escapeAttribute(localeConfig.dir || "ltr")}">`);
    next = next.replace(/precaonnect/g, "preconnect");
    next = next.replace(/alt="logo"/g, 'alt="Shiba Muscle"');
    next = next.replace(/>ShibaMuscle</g, ">Shiba Muscle<");

    next = stripGoogleTagBlock(next);
    next = stripSeoHeadTags(next);
    next = replaceTitle(next, context.title);
    next = ensureHeadClose(next);
    next = ensureMainWrapper(next);
    next = normalizeFooterLanguageLinks(next, context);

    if (!context.isToolPage) {
        next = ensureFontBlock(next, entry.locale);
    } else {
        next = ensureStandaloneIconMetadata(next, entry.locale);
    }

    next = next.replace("</head>", `${buildSeoBlock(context)}${ANALYTICS_BLOCK}\n</head>`);
    next = removeBodyAdsenseScripts(next);

    if (context.isExercisePage) {
        next = normalizeExerciseMarkup(next);
        next = ensureBreadcrumb(next, [
            { label: context.homeLabel, href: "index.html" },
            { label: context.pageLabel }
        ], entry.locale);
    } else if (!context.isHomePage && !context.isToolPage) {
        next = ensureBreadcrumb(next, [
            { label: context.homeLabel, href: "index.html" },
            { label: context.pageLabel }
        ], entry.locale);
    }

    return `${next.trim()}\n`;
}

function buildPageContext(entry, html) {
    const { file, locale } = entry;
    const canonicalUrl = absoluteUrlForFile(file, locale);
    const alternates = buildAlternateUrls(file);
    const discoveryPage = discoveryFileIndex.get(file);
    const staticPage = staticPageIndex.get(file);
    const exerciseMatch = exerciseFileIndex.byFile.get(file);
    const homeLabel = getUiText(locale, "home");
    const canonicalFile = file.startsWith("lb_") ? file.replace(/^lb_/, "kg_") : file;
    const resolvedCanonicalUrl = absoluteUrlForFile(canonicalFile, locale);
    const dateModified = buildSitemapLastmod(entry);

    if (file === "index.html") {
        const page = localizeStaticPage(staticPageIndex.get("index.html"), locale);
        return {
            title: page?.title || (locale === "ko" ? "Shiba Muscle | 운동 데이터베이스" : "Shiba Muscle | ワークアウトデータベース"),
            pageLabel: page?.heading || (locale === "ko" ? "운동 데이터베이스" : "ワークアウトデータベース"),
            homeLabel,
            description: page?.description || "",
            canonicalUrl,
            ogImage: page?.ogImage || DEFAULT_OG_IMAGE,
            preloadImages: [assetHref(page?.appImages?.today || "app/today-screen-current.png", locale)],
            type: "website",
            twitterCard: "summary_large_image",
            dateModified,
            alternates,
            locale,
            isExercisePage: false,
            isToolPage: false,
            isHomePage: true,
            isAppPage: true
        };
    }

    if (file === "Shift2ics.html") {
        return {
            title: "シフト表PDFをICSに変換 | Shiba Muscle",
            pageLabel: "シフト表PDFをICSに変換",
            homeLabel,
            description: "シフト表のPDFから勤務日を抽出し、iPhoneカレンダーで使えるICSファイルを生成できるツールです。",
            canonicalUrl,
            ogImage: DEFAULT_OG_IMAGE,
            type: "website",
            twitterCard: "summary",
            dateModified,
            alternates,
            locale,
            robots: "noindex,nofollow,noarchive",
            standalone: true,
            isExercisePage: false,
            isToolPage: true,
            isHomePage: false
        };
    }

    if (discoveryPage) {
        return {
            title: discoveryPage.title,
            pageLabel: discoveryPage.heading,
            homeLabel,
            description: discoveryPage.description,
            canonicalUrl,
            ogImage: `${SITE_ORIGIN}/assets/og/discovery/${discoveryPage.slug}.svg`,
            type: "article",
            twitterCard: "summary_large_image",
            dateModified,
            articlePublishedTime: getSourceCreatedIso(DISCOVERY_PATH),
            articleModifiedTime: dateModified,
            articleSection: discoveryPage.heading,
            alternates,
            locale,
            isExercisePage: false,
            isToolPage: false,
            isHomePage: false
        };
    }

    if (staticPage) {
        const page = localizeStaticPage(staticPage, locale);
        const englishOnly = staticPage.englishOnly === true;
        const explicitNoindex = staticPage.noindex === true;
        const isIndexablePage = !(englishOnly && locale !== "ja") && !explicitNoindex;
        return {
            title: page.title,
            pageLabel: page.heading,
            homeLabel,
            description: page.description || decodeHtml(stripTags(extractFirst(html, /<p>([\s\S]*?)<\/p>/i))),
            canonicalUrl: englishOnly ? absoluteUrlForFile(file, "ja") : canonicalUrl,
            ogImage: page.ogImage || DEFAULT_OG_IMAGE,
            ogLocale: page.htmlLang === "en" ? "en_US" : undefined,
            type: "article",
            twitterCard: "summary",
            dateModified,
            articlePublishedTime: isIndexablePage ? getStaticPageDatePublished(file) : null,
            articleModifiedTime: isIndexablePage ? dateModified : null,
            articleSection: isIndexablePage ? page.heading : null,
            alternates,
            locale,
            robots: isIndexablePage ? undefined : "noindex,follow,noarchive",
            standalone: englishOnly || explicitNoindex,
            isExercisePage: false,
            isToolPage: false,
            isHomePage: false,
            isAppPage: staticPage.appShell === true
        };
    }

    if (exerciseMatch) {
        const { exercise, unit } = exerciseMatch;
        const measurementKind = exercise.metadata?.measurementKind || "weight";
        const section = findSectionTaxonomy(taxonomy, exercise.categoryId);
        const seo = buildExerciseSeo(exercise, measurementKind, unit, locale);
        const isIndexableUnit = unit === "kg";
        const categoryLabel = getCategoryLabel(section || exercise.categoryId, locale);

        return {
            title: seo.title,
            pageLabel: getExerciseName(exercise, locale),
            homeLabel,
            description: buildExerciseSeoDescription(exercise, section, measurementKind, unit, locale),
            canonicalUrl: resolvedCanonicalUrl,
            ogImage: `${SITE_ORIGIN}/assets/og/exercises/${exercise.slug}.svg`,
            preloadImages: isIndexableUnit ? [assetHref(exercise.image?.src || "", locale)] : [],
            type: "article",
            twitterCard: "summary_large_image",
            dateModified,
            articlePublishedTime: isIndexableUnit ? getSourceCreatedIso(join(EXERCISE_SRC_ROOT, `${exercise.slug}.json`)) : null,
            articleModifiedTime: isIndexableUnit ? getSourceLastmodIso([
                join(EXERCISE_SRC_ROOT, `${exercise.slug}.json`),
                CATALOG_PATH
            ]) : null,
            articleSection: isIndexableUnit ? categoryLabel : null,
            articleTags: isIndexableUnit ? getRelatedTags(exercise, exercise.categoryId, locale) : [],
            alternates: buildAlternateUrls(canonicalFile),
            robots: isIndexableUnit ? INDEXABLE_ROBOTS : "noindex,follow,noarchive",
            standalone: !isIndexableUnit,
            locale,
            isExercisePage: true,
            isToolPage: false,
            isHomePage: false
        };
    }

    const h1 = decodeHtml(stripTags(extractFirst(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i)));
    return {
        title: h1 ? `${h1} | Shiba Muscle` : "Shiba Muscle",
        pageLabel: h1 || (locale === "ko" ? "페이지" : "ページ"),
        homeLabel,
        description: decodeHtml(stripTags(extractFirst(html, /<p>([\s\S]*?)<\/p>/i))) || (locale === "ko" ? "Shiba Muscle 페이지입니다." : locale === "es" ? "Página de Shiba Muscle." : "Shiba Muscleのページです。"),
        canonicalUrl,
        ogImage: DEFAULT_OG_IMAGE,
        type: "article",
        twitterCard: "summary",
        dateModified,
        alternates,
        locale,
        isExercisePage: false,
        isToolPage: false,
        isHomePage: false
    };
}

function stripGoogleTagBlock(html) {
    return html.replace(/\s*<!-- Google tag \(gtag\.js\) -->\s*<script async src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=[^"]+">[\s\S]*?<\/script>\s*<script>[\s\S]*?<\/script>\s*/i, "\n");
}

function stripSeoHeadTags(html) {
    return html
        .replace(/\n\s*<meta name="description"[^>]*>/gi, "")
        .replace(/\n\s*<meta name="robots"[^>]*>/gi, "")
        .replace(/\n\s*<meta name="theme-color"[^>]*>/gi, "")
        .replace(/\n\s*<link rel="canonical"[^>]*>/gi, "")
        .replace(/\n\s*<link rel="preload" as="image"[^>]*>/gi, "")
        .replace(/\n\s*<link rel="alternate" hreflang="[^"]+"[^>]*>/gi, "")
        .replace(/\n\s*<meta property="og:[^"]+"[^>]*>/gi, "")
        .replace(/\n\s*<meta name="twitter:[^"]+"[^>]*>/gi, "");
}

function replaceTitle(html, title) {
    if (/<title>[\s\S]*?<\/title>/i.test(html)) {
        return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
    }

    return html.replace("</head>", `    <title>${escapeHtml(title)}</title>\n</head>`);
}

function ensureHeadClose(html) {
    if (html.includes("</head>")) {
        return html;
    }

    return html.replace(/<body\b/i, "</head>\n<body");
}

function ensureFontBlock(html, locale) {
    const family = locale === "ko" ? "Noto+Sans+KR" : locale === "ja" ? "Noto+Sans+JP" : "Noto+Sans";
    const fontBlock = `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=${family}:wght@100..900&display=swap" rel="stylesheet">
`;
    const stripped = html
        .replace(/\s*<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\s*<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>\s*<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Noto\+Sans\+(?:JP|KR):wght@100\.\.900&display=swap" rel="stylesheet">\s*/gi, "\n")
        .replace(/\s*<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\s*<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>\s*<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Noto\+Sans:wght@100\.\.900&display=swap" rel="stylesheet">\s*/gi, "\n")
        .replace(/\s*<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\s*<link rel="precaonnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>\s*<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Noto\+Sans\+(?:JP|KR):wght@100\.\.900&display=swap" rel="stylesheet">\s*/gi, "\n")
        .replace(/\s*<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\s*<link rel="precaonnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>\s*<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Noto\+Sans:wght@100\.\.900&display=swap" rel="stylesheet">\s*/gi, "\n");

    if (stripped.includes("<!-- Favicon -->")) {
        return stripped.replace("<!-- Favicon -->", `${fontBlock}\n    <!-- Favicon -->`);
    }

    return stripped.replace("</head>", `${fontBlock}\n</head>`);
}

function ensureStandaloneIconMetadata(html, locale) {
    const iconBlock = `
    <!-- Favicon -->
    <meta name="msapplication-TileColor" content="${APP_THEME_COLOR}">
    <meta name="msapplication-config" content="${iconAssetHref("browserconfig.xml", locale)}">
    <link rel="shortcut icon" type="image/vnd.microsoft.icon" href="${iconAssetHref("favicon.ico", locale)}">
    <link rel="icon" type="image/vnd.microsoft.icon" href="${iconAssetHref("favicon.ico", locale)}">
    <link rel="manifest" href="${iconAssetHref("manifest.json", locale)}">
`;
    const stripped = html
        .replace(/\s*<!-- Favicon -->\s*/gi, "\n")
        .replace(/\n\s*<meta name="msapplication-TileColor"[^>]*>/gi, "")
        .replace(/\n\s*<meta name="msapplication-config"[^>]*>/gi, "")
        .replace(/\n\s*<link rel="shortcut icon"[^>]*>/gi, "")
        .replace(/\n\s*<link rel="icon"[^>]*>/gi, "")
        .replace(/\n\s*<link rel="manifest"[^>]*>/gi, "");

    return stripped.replace("</head>", `${iconBlock}\n</head>`);
}

function iconAssetHref(file, locale = "ja") {
    return assetHref(`${file}?v=${ICON_ASSET_VERSION}`, locale);
}

function buildSeoBlock(context) {
    const alternates = context.alternates;
    const alternateLinks = context.standalone ? "" : getGeneratedLocales().map((locale) => {
        return `    <link rel="alternate" hreflang="${locale.hreflang}" href="${alternates[locale.code]}">`;
    }).join("\n");
    const xDefaultLink = context.standalone ? "" : `\n    <link rel="alternate" hreflang="x-default" href="${alternates.ja}">`;
    const robots = context.robots || INDEXABLE_ROBOTS;
    const ogImageAlt = context.ogImageAlt || context.pageLabel || context.title;
    const ogImageMetadataBlock = renderOpenGraphImageMetadata(getOpenGraphImageMetadata(context.ogImage));
    const updatedTimeBlock = renderOpenGraphUpdatedTime(context.dateModified, robots);
    const imagePreloadBlock = renderImagePreloadLinks(context.preloadImages || [], robots);
    const articleMetadataBlock = renderArticleMetadata(context);
    const resolvedOgLocale = context.ogLocale || getOgLocale(context.locale);
    const ogLocaleAlternates = context.standalone ? "" : getGeneratedLocales()
        .filter((locale) => getOgLocale(locale.code) !== resolvedOgLocale)
        .map((locale) => `    <meta property="og:locale:alternate" content="${escapeAttribute(getOgLocale(locale.code))}">`)
        .join("\n");
    const ogLocaleAlternateBlock = ogLocaleAlternates ? `\n${ogLocaleAlternates}` : "";

    return `
    <meta name="description" content="${escapeAttribute(context.description)}">
    <meta name="robots" content="${escapeAttribute(robots)}">
    <meta name="theme-color" content="${context.isAppPage || context.isExercisePage ? APP_THEME_COLOR : SITE_THEME_COLOR}">
    <link rel="canonical" href="${context.canonicalUrl}">
${imagePreloadBlock}
${alternateLinks}${xDefaultLink}
    <meta property="og:type" content="${context.type}">
${updatedTimeBlock}
${articleMetadataBlock}
    <meta property="og:site_name" content="Shiba Muscle">
    <meta property="og:locale" content="${escapeAttribute(resolvedOgLocale)}">${ogLocaleAlternateBlock}
    <meta property="og:title" content="${escapeAttribute(context.title)}">
    <meta property="og:description" content="${escapeAttribute(context.description)}">
    <meta property="og:url" content="${context.canonicalUrl}">
    <meta property="og:image" content="${context.ogImage}">
    <meta property="og:image:secure_url" content="${context.ogImage}">
${ogImageMetadataBlock}
    <meta property="og:image:alt" content="${escapeAttribute(ogImageAlt)}">
    <meta name="twitter:card" content="${context.twitterCard}">
    <meta name="twitter:title" content="${escapeAttribute(context.title)}">
    <meta name="twitter:description" content="${escapeAttribute(context.description)}">
    <meta name="twitter:image" content="${context.ogImage}">
    <meta name="twitter:image:alt" content="${escapeAttribute(ogImageAlt)}">
`;
}

function renderImagePreloadLinks(images, robots = "") {
    if (/noindex/i.test(robots)) {
        return "";
    }

    return normalizeStringList(images).slice(0, 2).map((href) => {
        return `    <link rel="preload" as="image" href="${escapeAttribute(href)}" fetchpriority="high">`;
    }).join("\n");
}

function renderOpenGraphUpdatedTime(dateModified, robots = "") {
    if (!dateModified || /noindex/i.test(robots)) {
        return "";
    }

    return `    <meta property="og:updated_time" content="${escapeAttribute(dateModified)}">`;
}

function renderArticleMetadata(context) {
    if (context.type !== "article" || /noindex/i.test(context.robots || "")) {
        return "";
    }

    const tags = [];
    if (context.articlePublishedTime) {
        tags.push(["article:published_time", context.articlePublishedTime]);
    }
    if (context.articleModifiedTime) {
        tags.push(["article:modified_time", context.articleModifiedTime]);
    }
    if (context.articleSection) {
        tags.push(["article:section", context.articleSection]);
    }

    normalizeStringList(context.articleTags).slice(0, 12).forEach((tag) => {
        tags.push(["article:tag", tag]);
    });

    return tags.map(([property, content]) => {
        return `    <meta property="${property}" content="${escapeAttribute(content)}">`;
    }).join("\n");
}

function normalizeStringList(value) {
    const values = Array.isArray(value) ? value : [value];
    const seen = new Set();

    return values.map((item) => String(item || "").trim())
        .filter(Boolean)
        .filter((item) => {
            if (seen.has(item)) {
                return false;
            }
            seen.add(item);
            return true;
        });
}

function renderOpenGraphImageMetadata(metadata) {
    if (!metadata?.width || !metadata?.height || !metadata?.type) {
        return "";
    }

    return `    <meta property="og:image:type" content="${escapeAttribute(metadata.type)}">
    <meta property="og:image:width" content="${escapeAttribute(metadata.width)}">
    <meta property="og:image:height" content="${escapeAttribute(metadata.height)}">`;
}

function getOpenGraphImageMetadata(url) {
    return getImageMetadata(url);
}

function getImageMetadata(url) {
    const cacheKey = String(url || "");
    if (imageMetadataCache.has(cacheKey)) {
        return imageMetadataCache.get(cacheKey);
    }

    const pathname = getLocalAssetPathname(url);
    const type = getImageMimeType(pathname || url);
    const filePath = pathname ? join(ROOT, pathname.replace(/^\//, "")) : null;
    const dimensions = filePath && existsSync(filePath) ? readImageDimensions(filePath) : {};

    const metadata = {
        ...(type ? { type } : {}),
        ...dimensions
    };
    imageMetadataCache.set(cacheKey, metadata);

    return metadata;
}

function getLocalAssetPathname(url) {
    if (!url) {
        return null;
    }

    try {
        const parsed = new URL(url);
        return parsed.origin === SITE_ORIGIN ? parsed.pathname : null;
    } catch {
        const pathname = String(url).split("?")[0].replace(/^(\.\.\/|\.\/)+/, "");
        return pathname.startsWith("assets/") ? `/${pathname}` : null;
    }
}

function getImageMimeType(value) {
    const pathname = String(value || "").split("?")[0].toLowerCase();
    if (pathname.endsWith(".svg")) return "image/svg+xml";
    if (pathname.endsWith(".png")) return "image/png";
    if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) return "image/jpeg";
    if (pathname.endsWith(".webp")) return "image/webp";
    return "";
}

function readImageDimensions(filePath) {
    if (filePath.endsWith(".svg")) {
        return readSvgDimensions(filePath);
    }

    if (filePath.endsWith(".png")) {
        return readPngDimensions(filePath);
    }

    if (filePath.endsWith(".webp")) {
        return readWebpDimensions(filePath);
    }

    if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) {
        return readJpegDimensions(filePath);
    }

    return {};
}

function readSvgDimensions(filePath) {
    const svg = readFileSync(filePath, "utf8");
    const rootTag = svg.match(/<svg\b[^>]*>/i)?.[0] || "";
    const width = parseSvgLength(rootTag.match(/\bwidth="([^"]+)"/i)?.[1]);
    const height = parseSvgLength(rootTag.match(/\bheight="([^"]+)"/i)?.[1]);
    if (width && height) {
        return { width, height };
    }

    const viewBox = rootTag.match(/\bviewBox="([^"]+)"/i)?.[1]?.trim().split(/\s+/).map(Number);
    if (viewBox?.length === 4 && Number.isFinite(viewBox[2]) && Number.isFinite(viewBox[3])) {
        return {
            width: String(Math.round(viewBox[2])),
            height: String(Math.round(viewBox[3]))
        };
    }

    return {};
}

function parseSvgLength(value) {
    const number = Number.parseFloat(value || "");
    return Number.isFinite(number) && number > 0 ? String(Math.round(number)) : "";
}

function readPngDimensions(filePath) {
    const buffer = readFileSync(filePath);
    if (buffer.length < 24 || buffer.toString("ascii", 1, 4) !== "PNG") {
        return {};
    }

    return {
        width: String(buffer.readUInt32BE(16)),
        height: String(buffer.readUInt32BE(20))
    };
}

function readWebpDimensions(filePath) {
    const buffer = readFileSync(filePath);
    if (buffer.length < 30 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") {
        return {};
    }

    const chunkType = buffer.toString("ascii", 12, 16);
    const payloadOffset = 20;
    if (chunkType === "VP8X" && buffer.length >= payloadOffset + 10) {
        return {
            width: String(1 + buffer.readUIntLE(payloadOffset + 4, 3)),
            height: String(1 + buffer.readUIntLE(payloadOffset + 7, 3))
        };
    }

    if (chunkType === "VP8L" && buffer.length >= payloadOffset + 5 && buffer[payloadOffset] === 0x2f) {
        const b1 = buffer[payloadOffset + 1];
        const b2 = buffer[payloadOffset + 2];
        const b3 = buffer[payloadOffset + 3];
        const b4 = buffer[payloadOffset + 4];
        return {
            width: String(1 + (((b2 & 0x3f) << 8) | b1)),
            height: String(1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6)))
        };
    }

    if (chunkType === "VP8 " && buffer.length >= payloadOffset + 10 && buffer[payloadOffset + 3] === 0x9d && buffer[payloadOffset + 4] === 0x01 && buffer[payloadOffset + 5] === 0x2a) {
        return {
            width: String(buffer.readUInt16LE(payloadOffset + 6) & 0x3fff),
            height: String(buffer.readUInt16LE(payloadOffset + 8) & 0x3fff)
        };
    }

    return {};
}

function readJpegDimensions(filePath) {
    const buffer = readFileSync(filePath);
    if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
        return {};
    }

    let offset = 2;
    while (offset + 3 < buffer.length) {
        if (buffer[offset] !== 0xff) {
            offset += 1;
            continue;
        }

        const marker = buffer[offset + 1];
        if (marker === 0xd9 || marker === 0xda) {
            break;
        }

        const length = buffer.readUInt16BE(offset + 2);
        if (isJpegStartOfFrameMarker(marker) && offset + 8 < buffer.length) {
            return {
                height: String(buffer.readUInt16BE(offset + 5)),
                width: String(buffer.readUInt16BE(offset + 7))
            };
        }

        offset += 2 + length;
    }

    return {};
}

function isJpegStartOfFrameMarker(marker) {
    return (marker >= 0xc0 && marker <= 0xc3)
        || (marker >= 0xc5 && marker <= 0xc7)
        || (marker >= 0xc9 && marker <= 0xcb)
        || (marker >= 0xcd && marker <= 0xcf);
}

function getStaticPageDatePublished(file) {
    const sourceFile = file === "index.html" ? "home.json" : file.replace(/\.html$/, ".json");

    return getSourceCreatedIso(join(PAGES_ROOT, sourceFile));
}

function removeBodyAdsenseScripts(html) {
    const bodyIndex = html.search(/<body\b/i);
    if (bodyIndex === -1) {
        return html;
    }

    const head = html.slice(0, bodyIndex);
    const body = html.slice(bodyIndex)
        .replace(/\s*<script async src="https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-2819086765117537"\s*crossorigin="anonymous"><\/script>/gi, "");

    return head + body;
}

function normalizeExerciseMarkup(html) {
    return html
        .replace(/<h1 class="section-title"([^>]*)>([\s\S]*?)<\/h1>/g, '<h2 class="section-title"$1>$2</h2>');
}

function ensureMainWrapper(html) {
    if (/<main class="page-main"/i.test(html)) {
        return html;
    }

    const firstContainerMatch = html.match(/\n\s*<div class="container">/i);
    const footerMatch = html.match(/\n\s*<footer\b/i);

    if (!firstContainerMatch || !footerMatch || firstContainerMatch.index >= footerMatch.index) {
        return html;
    }

    const before = html.slice(0, firstContainerMatch.index);
    const mainContent = html.slice(firstContainerMatch.index, footerMatch.index).trim();
    const after = html.slice(footerMatch.index);

    return `${before}\n    <main class="page-main">\n${mainContent}\n    </main>\n${after}`;
}

function ensureBreadcrumb(html, items, locale) {
    if (/<nav class="breadcrumb"/i.test(html)) {
        return html;
    }

    const breadcrumb = buildBreadcrumbMarkup(items, locale);

    if (/<main class="page-main">/i.test(html)) {
        return html.replace(/<main class="page-main">/i, `<main class="page-main">\n${breadcrumb}`);
    }

    return html.replace(/<body\b[^>]*>/i, (match) => `${match}\n${breadcrumb}`);
}

function buildBreadcrumbMarkup(items, locale) {
    const ariaLabel = getUiText(locale, "breadcrumb");
    const content = items.map((item, index) => {
        const label = escapeHtml(item.label);
        const separator = index < items.length - 1 ? '<span class="breadcrumb-separator">/</span>' : "";
        if (item.href) {
            return `                <a href="${escapeAttribute(item.href)}">${label}</a>${separator}`;
        }

        return `                <span>${label}</span>${separator}`;
    }).join("\n");

    return `    <div class="container breadcrumb-container">\n        <nav class="breadcrumb" aria-label="${escapeAttribute(ariaLabel)}">\n${content}\n        </nav>\n    </div>\n`;
}

function normalizeFooterLanguageLinks(html, context) {
    let next = html;
    const alternates = languageAlternates(context.isHomePage ? "index.html" : context.canonicalUrl.endsWith("/") ? "index.html" : context.canonicalUrl.split("/").pop());

    alternates.forEach((item) => {
        const pattern = new RegExp(`<a href="[^"]*" data-lang="${item.code}">[^<]*<\\/a>`, "g");
        next = next.replace(pattern, `<a href="${item.href}" data-lang="${item.code}">${item.displayName}</a>`);
    });

    return next
        .replace(/>ShibaMuscle</g, ">Shiba Muscle<")
        .replace(/©ShibaMuscle,\s*2023 All rights reserved\./g, "© Shiba Muscle");
}

function buildSitemap(entries) {
    const urls = [...new Map(entries
        .filter(isSitemapEntry)
        .map((entry) => [absoluteUrlForFile(entry.file, entry.locale), entry])).entries()]
        .map(([url, entry]) => ({
            url,
            lastmod: buildSitemapLastmod(entry),
            alternateLinks: isEnglishOnlyStaticPage(entry.file) ? "" : buildSitemapAlternateLinks(entry.file),
            imageLinks: buildSitemapImageLinks(entry.file)
        }))
        .sort((left, right) => left.url.localeCompare(right.url));
    const xmlEntries = urls.map(({ url, lastmod, alternateLinks, imageLinks }) => {
        const alternateBlock = alternateLinks ? `\n${alternateLinks}` : "";
        const imageBlock = imageLinks ? `\n${imageLinks}` : "";
        return `  <url>\n    <loc>${escapeHtml(url)}</loc>\n    <lastmod>${escapeHtml(lastmod)}</lastmod>${alternateBlock}${imageBlock}\n  </url>`;
    }).join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${xmlEntries}\n</urlset>\n`;
}

function buildSitemapLastmod(entry) {
    return getSourceLastmodIso(getSitemapSourceFiles(entry.file));
}

function getSitemapSourceFiles(file) {
    const staticPage = staticPageIndex.get(file);
    if (staticPage) {
        const pageSourceFile = file === "index.html" ? "home.json" : file.replace(/\.html$/, ".json");
        const sourceFiles = [join(PAGES_ROOT, pageSourceFile)];
        if (file === "index.html") {
            sourceFiles.push(CATALOG_PATH);
        }
        return sourceFiles.filter((filePath) => existsSync(filePath));
    }

    const exerciseMatch = exerciseFileIndex.byFile.get(file);
    if (exerciseMatch) {
        return [
            join(EXERCISE_SRC_ROOT, `${exerciseMatch.exercise.slug}.json`),
            CATALOG_PATH
        ].filter((filePath) => existsSync(filePath));
    }

    if (discoveryFileIndex.has(file)) {
        return [DISCOVERY_PATH].filter((filePath) => existsSync(filePath));
    }

    const fallbackPath = join(ROOT, file);
    return existsSync(fallbackPath) ? [fallbackPath] : [];
}

function isSitemapEntry(entry) {
    return entry.file !== "Shift2ics.html"
        && !entry.file.startsWith("lb_")
        && !isNoindexStaticPage(entry.file)
        && !(isEnglishOnlyStaticPage(entry.file) && entry.locale !== "ja");
}

function isNoindexStaticPage(file) {
    return staticPageIndex.get(file)?.noindex === true;
}

function isEnglishOnlyStaticPage(file) {
    return staticPageIndex.get(file)?.englishOnly === true;
}

function buildSitemapAlternateLinks(file) {
    const localeLinks = getGeneratedLocales().map((locale) => {
        return buildSitemapAlternateLink(locale.hreflang, absoluteUrlForFile(file, locale.code));
    });
    const fallbackLink = buildSitemapAlternateLink("x-default", absoluteUrlForFile(file, "ja"));

    return [...localeLinks, fallbackLink].join("\n");
}

function buildSitemapAlternateLink(hreflang, href) {
    return `    <xhtml:link rel="alternate" hreflang="${escapeAttribute(hreflang)}" href="${escapeAttribute(href)}" />`;
}

function buildSitemapImageLinks(file) {
    return getSitemapImageUrls(file)
        .map((url) => `    <image:image>\n      <image:loc>${escapeHtml(url)}</image:loc>\n    </image:image>`)
        .join("\n");
}

function getSitemapImageUrls(file) {
    const urls = new Set();
    const staticPage = staticPageIndex.get(file);
    if (staticPage) {
        addSitemapImageUrl(urls, staticPage.ogImage || DEFAULT_OG_IMAGE);
        if (file === "index.html" && staticPage.appImages) {
            Object.values(staticPage.appImages).forEach((image) => addSitemapImageUrl(urls, image));
        }
        return Array.from(urls);
    }

    const exerciseMatch = exerciseFileIndex.byFile.get(file);
    if (exerciseMatch?.unit === "kg") {
        addSitemapImageUrl(urls, exerciseMatch.exercise.image?.src);
        return Array.from(urls);
    }

    const discoveryPage = discoveryFileIndex.get(file);
    if (discoveryPage) {
        addSitemapImageUrl(urls, `${SITE_ORIGIN}/assets/og/discovery/${discoveryPage.slug}.svg`);
    }

    return Array.from(urls);
}

function addSitemapImageUrl(urls, image) {
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

function buildWebAppManifest() {
    return {
        name: "Shiba",
        short_name: "Shiba",
        description: MANIFEST_DESCRIPTION,
        id: "/",
        start_url: "/",
        scope: "/",
        lang: "ja",
        dir: "ltr",
        theme_color: APP_THEME_COLOR,
        background_color: WEB_APP_BACKGROUND_COLOR,
        display: "standalone",
        orientation: "any",
        icons: ANDROID_ICON_SIZES.map((size) => ({
            src: `/assets/android-chrome-${size}x${size}.png`,
            sizes: `${size}x${size}`,
            type: "image/png",
            purpose: "any"
        }))
    };
}

function buildBrowserConfigXml() {
    return `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
    <msapplication>
        <tile>
            <square70x70logo src="/assets/site-tile-70x70.png"/>
            <square150x150logo src="/assets/site-tile-150x150.png"/>
            <wide310x150logo src="/assets/site-tile-310x150.png"/>
            <square310x310logo src="/assets/site-tile-310x310.png"/>
            <TileColor>${APP_THEME_COLOR}</TileColor>
        </tile>
    </msapplication>
</browserconfig>
`;
}

function writeManifestFiles() {
    const manifest = buildWebAppManifest();
    const manifestJson = `${JSON.stringify(manifest, null, 4)}\n`;
    const browserConfig = buildBrowserConfigXml();

    writeFileSync(join(ROOT, "site.webmanifest"), manifestJson);
    writeFileSync(join(ROOT, "assets", "site.webmanifest"), manifestJson);
    writeFileSync(join(ROOT, "assets", "manifest.json"), manifestJson);
    writeFileSync(join(ROOT, "browserconfig.xml"), browserConfig);
    writeFileSync(join(ROOT, "assets", "browserconfig.xml"), browserConfig);
}

function extractFirst(text, pattern) {
    const match = text.match(pattern);
    return match?.[1]?.trim() || "";
}

function stripTags(text) {
    return String(text || "")
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function decodeHtml(text) {
    return String(text || "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function escapeAttribute(value) {
    return escapeHtml(value)
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

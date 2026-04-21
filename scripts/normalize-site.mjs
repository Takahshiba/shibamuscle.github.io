#!/usr/bin/env node

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { buildExerciseSeo, findSectionTaxonomy } from "./exercise-metadata.mjs";
import { buildExerciseFileIndex, loadDiscovery, loadExercises, loadPages, loadTaxonomy } from "./source-data.mjs";

const ROOT = process.cwd();
const SITE_ORIGIN = "https://shibamuscle.com";
const LOCALE_ORIGINS = {
    ja: SITE_ORIGIN,
    en: "https://en.shibamuscle.com",
    zh: "https://cn.shibamuscle.com",
    ko: "https://ko.shibamuscle.com"
};
const ANALYTICS_ID = "G-D9K58THBFM";
const FONT_BLOCK = `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100..900&display=swap" rel="stylesheet">
`;
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

const htmlFiles = readdirSync(ROOT)
    .filter((file) => file.endsWith(".html"))
    .sort((left, right) => left.localeCompare(right));

let changedFiles = 0;

for (const file of htmlFiles) {
    const filePath = join(ROOT, file);
    const original = readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
    const normalized = normalizeHtml(file, original);

    if (normalized !== original) {
        writeFileSync(filePath, normalized);
        changedFiles += 1;
    }
}

writeFileSync(join(ROOT, "sitemap.xml"), buildSitemap(htmlFiles));
writeManifestFiles();

console.log(`Normalized ${changedFiles} HTML files and regenerated sitemap.xml.`);

function normalizeHtml(file, html) {
    const context = buildPageContext(file, html);

    let next = html;

    next = next.replace(/<html lang="[^"]*">/i, '<html lang="ja">');
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
        next = ensureFontBlock(next);
    }

    next = next.replace("</head>", `${buildSeoBlock(context)}${ANALYTICS_BLOCK}\n</head>`);
    next = removeBodyAdsenseScripts(next);

    if (context.isExercisePage) {
        next = normalizeExerciseMarkup(next);
        next = ensureBreadcrumb(next, [
            { label: "Home", href: "index.html" },
            { label: context.pageLabel }
        ]);
    } else if (!context.isHomePage && !context.isToolPage) {
        next = ensureBreadcrumb(next, [
            { label: "Home", href: "index.html" },
            { label: context.pageLabel }
        ]);
    }

    return `${next.trim()}\n`;
}

function buildPageContext(file, html) {
    const canonicalPath = file === "index.html" ? "/" : `/${file}`;
    const canonicalUrl = `${SITE_ORIGIN}${canonicalPath}`;
    const discoveryPage = discoveryFileIndex.get(file);
    const staticPage = staticPageIndex.get(file);
    const exerciseMatch = exerciseFileIndex.byFile.get(file);

    if (file === "index.html") {
        const page = staticPageIndex.get("index.html");
        return {
            title: page?.title || "Shiba Muscle | ワークアウトデータベース",
            pageLabel: "ワークアウトデータベース",
            description: page?.description || "部位別・種目別に平均重量、基準重量、鍛えられる筋肉を探せるShiba Muscleのトレーニングデータベースです。kgとlbの切り替えにも対応しています。",
            canonicalUrl,
            ogImage: `${SITE_ORIGIN}/assets/dumbbell-logo.png`,
            type: "website",
            twitterCard: "summary_large_image",
            alternates: buildAlternateUrls(canonicalPath),
            isExercisePage: false,
            isToolPage: false,
            isHomePage: true
        };
    }

    if (file === "Shift2ics.html") {
        return {
            title: "シフト表PDFをICSに変換 | Shiba Muscle",
            pageLabel: "シフト表PDFをICSに変換",
            description: "シフト表のPDFから勤務日を抽出し、iPhoneカレンダーで使えるICSファイルを生成できるツールです。",
            canonicalUrl,
            ogImage: `${SITE_ORIGIN}/assets/dumbbell-logo.png`,
            type: "website",
            twitterCard: "summary",
            alternates: buildAlternateUrls(canonicalPath),
            isExercisePage: false,
            isToolPage: true,
            isHomePage: false
        };
    }

    if (discoveryPage) {
        return {
            title: discoveryPage.title,
            pageLabel: discoveryPage.heading,
            description: discoveryPage.description,
            canonicalUrl,
            ogImage: `${SITE_ORIGIN}/assets/og/discovery/${discoveryPage.slug}.svg`,
            type: "article",
            twitterCard: "summary_large_image",
            alternates: buildAlternateUrls(canonicalPath),
            isExercisePage: false,
            isToolPage: false,
            isHomePage: false
        };
    }

    if (staticPage) {
        return {
            title: staticPage.title,
            pageLabel: staticPage.heading,
            description: staticPage.description || decodeHtml(stripTags(extractFirst(html, /<p>([\s\S]*?)<\/p>/i))),
            canonicalUrl,
            ogImage: `${SITE_ORIGIN}/assets/dumbbell-logo.png`,
            type: "article",
            twitterCard: "summary",
            alternates: buildAlternateUrls(canonicalPath),
            isExercisePage: false,
            isToolPage: false,
            isHomePage: false
        };
    }

    if (exerciseMatch) {
        const { exercise, unit } = exerciseMatch;
        const measurementKind = exercise.metadata?.measurementKind || "weight";
        const seo = buildExerciseSeo(exercise, measurementKind, unit);
        const primaryMuscles = exercise.metadata?.primaryMuscles?.ja || extractPrimaryMuscles(html);
        const section = findSectionTaxonomy(taxonomy, exercise.categoryId);
        const metricSummary = measurementKind === "reps"
            ? "関連種目もあわせて確認できます。"
            : "体重別・年齢別の基準表と関連種目もあわせて確認できます。";
        const muscleDescription = primaryMuscles.length
            ? `主働筋は${primaryMuscles.join("・")}。`
            : "";
        const sectionDescription = section?.label?.ja ? `${section.label.ja}の代表種目です。` : "";

        return {
            title: seo.title,
            pageLabel: exercise.names.ja,
            description: `${seo.descriptionPrefix}${sectionDescription}${muscleDescription}${metricSummary}`,
            canonicalUrl,
            ogImage: `${SITE_ORIGIN}/assets/og/exercises/${exercise.slug}.svg`,
            type: "article",
            twitterCard: "summary_large_image",
            alternates: buildAlternateUrls(canonicalPath),
            isExercisePage: true,
            isToolPage: false,
            isHomePage: false
        };
    }

    const h1 = decodeHtml(stripTags(extractFirst(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i)));
    return {
        title: h1 ? `${h1} | Shiba Muscle` : "Shiba Muscle",
        pageLabel: h1 || "ページ",
        description: decodeHtml(stripTags(extractFirst(html, /<p>([\s\S]*?)<\/p>/i))) || "Shiba Muscleのページです。",
        canonicalUrl,
        ogImage: `${SITE_ORIGIN}/assets/dumbbell-logo.png`,
        type: "article",
        twitterCard: "summary",
        alternates: buildAlternateUrls(canonicalPath),
        isExercisePage: false,
        isToolPage: false,
        isHomePage: false
    };
}

function buildAlternateUrls(pathname) {
    return Object.fromEntries(Object.entries(LOCALE_ORIGINS).map(([locale, origin]) => {
        const suffix = pathname === "/" ? "/" : pathname;
        return [locale, `${origin}${suffix}`];
    }));
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

function ensureFontBlock(html) {
    const stripped = html
        .replace(/\s*<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\s*<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>\s*<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Noto\+Sans\+JP:wght@100\.\.900&display=swap" rel="stylesheet">\s*/gi, "\n")
        .replace(/\s*<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\s*<link rel="precaonnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>\s*<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Noto\+Sans\+JP:wght@100\.\.900&display=swap" rel="stylesheet">\s*/gi, "\n");

    if (stripped.includes("<!-- Favicon -->")) {
        return stripped.replace("<!-- Favicon -->", `${FONT_BLOCK}\n    <!-- Favicon -->`);
    }

    return stripped.replace("</head>", `${FONT_BLOCK}\n</head>`);
}

function buildSeoBlock(context) {
    return `
    <meta name="description" content="${escapeAttribute(context.description)}">
    <meta name="robots" content="index,follow,max-image-preview:large">
    <meta name="theme-color" content="#148a6a">
    <link rel="canonical" href="${context.canonicalUrl}">
    <link rel="alternate" hreflang="ja" href="${context.alternates.ja}">
    <link rel="alternate" hreflang="en" href="${context.alternates.en}">
    <link rel="alternate" hreflang="zh" href="${context.alternates.zh}">
    <link rel="alternate" hreflang="ko" href="${context.alternates.ko}">
    <link rel="alternate" hreflang="x-default" href="${context.alternates.ja}">
    <meta property="og:type" content="${context.type}">
    <meta property="og:site_name" content="Shiba Muscle">
    <meta property="og:locale" content="ja_JP">
    <meta property="og:title" content="${escapeAttribute(context.title)}">
    <meta property="og:description" content="${escapeAttribute(context.description)}">
    <meta property="og:url" content="${context.canonicalUrl}">
    <meta property="og:image" content="${context.ogImage}">
    <meta name="twitter:card" content="${context.twitterCard}">
    <meta name="twitter:title" content="${escapeAttribute(context.title)}">
    <meta name="twitter:description" content="${escapeAttribute(context.description)}">
    <meta name="twitter:image" content="${context.ogImage}">
`;
}

function removeBodyAdsenseScripts(html) {
    const bodyIndex = html.search(/<body\b/i);
    if (bodyIndex === -1) {
        return html;
    }

    const head = html.slice(0, bodyIndex);
    const body = html.slice(bodyIndex)
        .replace(/\s*<script async src="https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-2819086765117537"\s*crossorigin="anonymous"><\/script>/gi, "")
        .replace(/\s*<script>\s*\(adsbygoogle = window\.adsbygoogle \|\| \[\]\)\.push\(\{\}\);\s*<\/script>/gi, "");

    return head + body;
}

function normalizeExerciseMarkup(html) {
    return html
        .replace(/href="#whole-body-section"/g, 'href="index.html#whole-body-section"')
        .replace(/href="#chest-section"/g, 'href="index.html#chest-section"')
        .replace(/href="#back-section"/g, 'href="index.html#back-section"')
        .replace(/href="#shoulder-section"/g, 'href="index.html#shoulder-section"')
        .replace(/href="#arm-section"/g, 'href="index.html#arm-section"')
        .replace(/href="#leg-section"/g, 'href="index.html#leg-section"')
        .replace(/href="#core-section"/g, 'href="index.html#core-section"')
        .replace(/<h1 class="section-title"([^>]*)>([\s\S]*?)<\/h1>/g, '<h2 class="section-title"$1>$2</h2>');
}

function ensureMainWrapper(html) {
    if (/<main class="page-main">/i.test(html)) {
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

function ensureBreadcrumb(html, items) {
    if (/<nav class="breadcrumb"/i.test(html)) {
        return html;
    }

    const breadcrumb = buildBreadcrumbMarkup(items);

    if (/<main class="page-main">/i.test(html)) {
        return html.replace(/<main class="page-main">/i, `<main class="page-main">\n${breadcrumb}`);
    }

    return html.replace(/<body\b[^>]*>/i, (match) => `${match}\n${breadcrumb}`);
}

function buildBreadcrumbMarkup(items) {
    const content = items.map((item, index) => {
        const label = escapeHtml(item.label);
        const separator = index < items.length - 1 ? '<span class="breadcrumb-separator">/</span>' : "";
        if (item.href) {
            return `                <a href="${escapeAttribute(item.href)}">${label}</a>${separator}`;
        }
        return `                <span>${label}</span>${separator}`;
    }).join("\n");

    return `    <div class="container breadcrumb-container">\n        <nav class="breadcrumb" aria-label="Breadcrumb">\n${content}\n        </nav>\n    </div>\n`;
}

function normalizeFooterLanguageLinks(html, context) {
    let next = html;
    const replacements = [
        { lang: "en", label: "English", href: context.alternates.en, domainPattern: "https:\\/\\/en\\.shibamuscle\\.com(?:\\/[^\"\\s>]*)?" },
        { lang: "ja", label: "日本語", href: context.alternates.ja, domainPattern: "https:\\/\\/shibamuscle\\.com(?:\\/[^\"\\s>]*)?" },
        { lang: "zh", label: "中文", href: context.alternates.zh, domainPattern: "https:\\/\\/cn\\.shibamuscle\\.com(?:\\/[^\"\\s>]*)?" },
        { lang: "ko", label: "한국어", href: context.alternates.ko, domainPattern: "https:\\/\\/ko\\.shibamuscle\\.com(?:\\/[^\"\\s>]*)?" }
    ];

    replacements.forEach((item) => {
        const pattern = new RegExp(`<a href="${item.domainPattern}" data-lang="${item.lang}">${item.label}<\/a>`, "g");
        next = next.replace(pattern, `<a href="${item.href}" data-lang="${item.lang}">${item.label}</a>`);
    });

    return next
        .replace(/>ShibaMuscle</g, ">Shiba Muscle<")
        .replace(/©ShibaMuscle,\s*2023 All rights reserved\./g, "© Shiba Muscle");
}

function extractPrimaryMuscles(html) {
    const primaryCell = extractFirst(html, /<th>\s*主働筋\s*<\/th>\s*<td>([\s\S]*?)<\/td>/i);
    return decodeHtml(stripTags(primaryCell))
        .split(/\s*,\s*/)
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 3);
}

function extractFeaturedMuscles(html) {
    const tableBody = extractFirst(html, /<table class="muscle-activated-table">[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/i);
    const rowMatches = Array.from(tableBody.matchAll(/<tr>[\s\S]*?<td>([\s\S]*?)<\/td>[\s\S]*?<\/tr>/gi));

    return rowMatches
        .flatMap((match) => decodeHtml(stripTags(match[1]))
            .split(/\s*,\s*/)
            .map((item) => item.trim())
            .filter(Boolean))
        .slice(0, 3);
}

function buildSitemap(files) {
    const urls = ["/", ...files.map((file) => `/${file}`)];
    const lastmod = new Date().toISOString();
    const xmlEntries = urls.map((path) => {
        const normalizedPath = path === "/" ? "" : path;
        return `  <url>\n    <loc>${SITE_ORIGIN}${normalizedPath || "/"}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
    }).join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xmlEntries}\n</urlset>\n`;
}

function writeManifestFiles() {
    const sharedManifest = {
        name: "Shiba Muscle",
        short_name: "Shiba Muscle",
        description: "平均重量、基準重量、鍛えられる筋肉を探せるワークアウトデータベース。",
        start_url: "/",
        scope: "/",
        theme_color: "#148a6a",
        background_color: "#fbfcfa",
        display: "standalone"
    };

    const siteManifest = {
        ...sharedManifest,
        icons: [
            {
                src: "/assets/android-chrome-192x192.png",
                sizes: "192x192",
                type: "image/png"
            },
            {
                src: "/assets/android-chrome-512x512.png",
                sizes: "512x512",
                type: "image/png"
            }
        ]
    };

    const legacyManifest = {
        ...sharedManifest,
        orientation: "any",
        icons: [
            { src: "/assets/android-chrome-36x36.png", sizes: "36x36", type: "image/png" },
            { src: "/assets/android-chrome-48x48.png", sizes: "48x48", type: "image/png" },
            { src: "/assets/android-chrome-72x72.png", sizes: "72x72", type: "image/png" },
            { src: "/assets/android-chrome-96x96.png", sizes: "96x96", type: "image/png" },
            { src: "/assets/android-chrome-128x128.png", sizes: "128x128", type: "image/png" },
            { src: "/assets/android-chrome-144x144.png", sizes: "144x144", type: "image/png" },
            { src: "/assets/android-chrome-152x152.png", sizes: "152x152", type: "image/png" },
            { src: "/assets/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
            { src: "/assets/android-chrome-256x256.png", sizes: "256x256", type: "image/png" },
            { src: "/assets/android-chrome-384x384.png", sizes: "384x384", type: "image/png" },
            { src: "/assets/android-chrome-512x512.png", sizes: "512x512", type: "image/png" }
        ]
    };

    writeFileSync(join(ROOT, "site.webmanifest"), `${JSON.stringify(siteManifest, null, 4)}\n`);
    writeFileSync(join(ROOT, "assets", "site.webmanifest"), `${JSON.stringify(siteManifest, null, 4)}\n`);
    writeFileSync(join(ROOT, "assets", "manifest.json"), `${JSON.stringify(legacyManifest, null, 4)}\n`);
}

function extractFirst(text, pattern) {
    const match = text.match(pattern);
    return match?.[1]?.trim() || "";
}

function resolveAbsoluteUrl(path) {
    if (!path) {
        return "";
    }

    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    const normalized = path.replace(/^\.\//, "/");
    return `${SITE_ORIGIN}${normalized.startsWith("/") ? normalized : `/${normalized}`}`;
}

function stripTags(text) {
    return text
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function decodeHtml(text) {
    return text
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

import {
    absoluteUrlForFile,
    assetHref,
    buildAlternateUrls,
    buildLocalizedCard,
    cleanSectionLabel,
    getCategoryLabel,
    getCategoryNavItems,
    getGeneratedLocales,
    getLocaleConfig,
    getOgLocale,
    getUiText,
    languageAlternates,
    stylesheetHref
} from "./localization.mjs";

const ADSENSE_CLIENT_ID = "ca-pub-2819086765117537";
const ADSENSE_SCRIPT_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;
const ANALYTICS_ID = "G-D9K58THBFM";
const SITE_ORIGIN = "https://shibamuscle.com";
const SITE_NAME = "Shiba Muscle";
const SITE_DESCRIPTION = "Shiba Muscle provides localized strength training standards and the Shiba workout planning and logging app.";
const SUPPORT_EMAIL = "info@shibamuscle.com";
const THEME_COLOR = "#148a6a";
const APP_THEME_COLOR = "#ff6a00";
const SITE_STYLESHEET = "styles.css?v=workout-cards-20260704";
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/assets/app/shiba-mascot.png`;
const ICON_ASSET_VERSION = "shiba-20260704";

function buildFontBlock(locale = "ja") {
    const family = locale === "ko"
        ? "Noto+Sans+KR"
        : locale === "zh-hant"
            ? "Noto+Sans+TC"
            : locale === "zh-hans"
                ? "Noto+Sans+SC"
                : locale === "ja"
                    ? "Noto+Sans+JP"
                    : "Noto+Sans";
    return `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=${family}:wght@100..900&display=swap" rel="stylesheet">
`;
}

function buildFaviconBlock(locale = "ja") {
    return `
    <!-- Favicon -->
    <meta name="msapplication-square70x70logo" content="${iconAssetHref("site-tile-70x70.png", locale)}">
    <meta name="msapplication-square150x150logo" content="${iconAssetHref("site-tile-150x150.png", locale)}">
    <meta name="msapplication-wide310x150logo" content="${iconAssetHref("site-tile-310x150.png", locale)}">
    <meta name="msapplication-square310x310logo" content="${iconAssetHref("site-tile-310x310.png", locale)}">
    <meta name="msapplication-TileColor" content="#0078d7">
    <link rel="shortcut icon" type="image/vnd.microsoft.icon" href="${iconAssetHref("favicon.ico", locale)}">
    <link rel="icon" type="image/vnd.microsoft.icon" href="${iconAssetHref("favicon.ico", locale)}">
    <link rel="apple-touch-icon" sizes="57x57" href="${iconAssetHref("apple-touch-icon-57x57.png", locale)}">
    <link rel="apple-touch-icon" sizes="60x60" href="${iconAssetHref("apple-touch-icon-60x60.png", locale)}">
    <link rel="apple-touch-icon" sizes="72x72" href="${iconAssetHref("apple-touch-icon-72x72.png", locale)}">
    <link rel="apple-touch-icon" sizes="76x76" href="${iconAssetHref("apple-touch-icon-76x76.png", locale)}">
    <link rel="apple-touch-icon" sizes="114x114" href="${iconAssetHref("apple-touch-icon-114x114.png", locale)}">
    <link rel="apple-touch-icon" sizes="120x120" href="${iconAssetHref("apple-touch-icon-120x120.png", locale)}">
    <link rel="apple-touch-icon" sizes="144x144" href="${iconAssetHref("apple-touch-icon-144x144.png", locale)}">
    <link rel="apple-touch-icon" sizes="152x152" href="${iconAssetHref("apple-touch-icon-152x152.png", locale)}">
    <link rel="apple-touch-icon" sizes="180x180" href="${iconAssetHref("apple-touch-icon-180x180.png", locale)}">
    <link rel="icon" type="image/png" sizes="36x36" href="${iconAssetHref("android-chrome-36x36.png", locale)}">
    <link rel="icon" type="image/png" sizes="48x48" href="${iconAssetHref("android-chrome-48x48.png", locale)}">
    <link rel="icon" type="image/png" sizes="72x72" href="${iconAssetHref("android-chrome-72x72.png", locale)}">
    <link rel="icon" type="image/png" sizes="96x96" href="${iconAssetHref("android-chrome-96x96.png", locale)}">
    <link rel="icon" type="image/png" sizes="128x128" href="${iconAssetHref("android-chrome-128x128.png", locale)}">
    <link rel="icon" type="image/png" sizes="144x144" href="${iconAssetHref("android-chrome-144x144.png", locale)}">
    <link rel="icon" type="image/png" sizes="152x152" href="${iconAssetHref("android-chrome-152x152.png", locale)}">
    <link rel="icon" type="image/png" sizes="192x192" href="${iconAssetHref("android-chrome-192x192.png", locale)}">
    <link rel="icon" type="image/png" sizes="256x256" href="${iconAssetHref("android-chrome-256x256.png", locale)}">
    <link rel="icon" type="image/png" sizes="384x384" href="${iconAssetHref("android-chrome-384x384.png", locale)}">
    <link rel="icon" type="image/png" sizes="512x512" href="${iconAssetHref("android-chrome-512x512.png", locale)}">
    <link rel="icon" type="image/png" sizes="36x36" href="${iconAssetHref("icon-36x36.png", locale)}">
    <link rel="icon" type="image/png" sizes="48x48" href="${iconAssetHref("icon-48x48.png", locale)}">
    <link rel="icon" type="image/png" sizes="72x72" href="${iconAssetHref("icon-72x72.png", locale)}">
    <link rel="icon" type="image/png" sizes="96x96" href="${iconAssetHref("icon-96x96.png", locale)}">
    <link rel="icon" type="image/png" sizes="128x128" href="${iconAssetHref("icon-128x128.png", locale)}">
    <link rel="icon" type="image/png" sizes="144x144" href="${iconAssetHref("icon-144x144.png", locale)}">
    <link rel="icon" type="image/png" sizes="152x152" href="${iconAssetHref("icon-152x152.png", locale)}">
    <link rel="icon" type="image/png" sizes="160x160" href="${iconAssetHref("icon-160x160.png", locale)}">
    <link rel="icon" type="image/png" sizes="192x192" href="${iconAssetHref("icon-192x192.png", locale)}">
    <link rel="icon" type="image/png" sizes="196x196" href="${iconAssetHref("icon-196x196.png", locale)}">
    <link rel="icon" type="image/png" sizes="256x256" href="${iconAssetHref("icon-256x256.png", locale)}">
    <link rel="icon" type="image/png" sizes="384x384" href="${iconAssetHref("icon-384x384.png", locale)}">
    <link rel="icon" type="image/png" sizes="512x512" href="${iconAssetHref("icon-512x512.png", locale)}">
    <link rel="icon" type="image/png" sizes="16x16" href="${iconAssetHref("icon-16x16.png", locale)}">
    <link rel="icon" type="image/png" sizes="24x24" href="${iconAssetHref("icon-24x24.png", locale)}">
    <link rel="icon" type="image/png" sizes="32x32" href="${iconAssetHref("icon-32x32.png", locale)}">
    <link rel="manifest" href="${iconAssetHref("manifest.json", locale)}">
`;
}

function iconAssetHref(file, locale = "ja") {
    return assetHref(`${file}?v=${ICON_ASSET_VERSION}`, locale);
}

export {
    ADSENSE_CLIENT_ID,
    cleanSectionLabel,
    escapeAttribute,
    escapeHtml,
    normalizeText,
    renderDiscoveryGrid,
    renderAdSlot,
    renderBreadcrumb,
    renderCardGrid,
    renderDocument,
    renderExerciseLibrary,
    renderStaticFooter,
    renderStaticHeader
};

function renderDocument({ title, stylesheets = ["styles.css"], body, generatedComment, locale = "ja", seo = null, ads = true, enableAds = ads, bodyClass = "", htmlLang = null, fontLocale = null }) {
    const localeConfig = getLocaleConfig(locale);
    const comment = generatedComment ? `${generatedComment}\n` : "";
    const stylesheetLinks = stylesheets.map((href) => `    <link rel="stylesheet" href="${escapeAttribute(stylesheetHref(resolveStylesheetHref(href), locale))}">`).join("\n");
    const documentLang = htmlLang || localeConfig.hreflang;
    const seoBlock = seo ? buildSeoBlock({ ...seo, title, locale, documentLang }) : "";
    const adsenseScript = enableAds ? `
    <script async src="${ADSENSE_SCRIPT_SRC}"
     crossorigin="anonymous"></script>
` : "";
    const bodyClassAttribute = bodyClass ? ` class="${escapeAttribute(bodyClass)}"` : "";

    return `<!DOCTYPE html>
${comment}<html lang="${escapeAttribute(documentLang)}" dir="${escapeAttribute(localeConfig.dir || "ltr")}">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
${adsenseScript}
${buildFontBlock(fontLocale || locale)}
${buildFaviconBlock(locale)}
${stylesheetLinks}
${seoBlock}
</head>
<body${bodyClassAttribute}>
${body}
</body>

</html>
`;
}

function resolveStylesheetHref(href) {
    return href === "styles.css" || href.startsWith("styles.css?")
        ? SITE_STYLESHEET
        : href;
}

function buildSeoBlock({ file, title, description = "", locale = "ja", documentLang = null, ogImage, ogImageAlt, ogLocale, type = "article", twitterCard = "summary", canonicalFile = file, canonicalLocale = locale, includeAlternates = true, robots = "index,follow,max-image-preview:large", themeColor = THEME_COLOR, breadcrumbs = [], structuredData = [], dateModified = null }) {
    if (!file) {
        return "";
    }

    const alternates = includeAlternates ? buildAlternateUrls(canonicalFile) : null;
    const alternateLinks = includeAlternates ? getGeneratedLocales().map((localeConfig) => {
        return `    <link rel="alternate" hreflang="${escapeAttribute(localeConfig.hreflang)}" href="${escapeAttribute(alternates[localeConfig.code])}">`;
    }).join("\n") : "";
    const xDefaultLink = includeAlternates ? `\n    <link rel="alternate" hreflang="x-default" href="${escapeAttribute(alternates.ja)}">` : "";
    const canonicalUrl = absoluteUrlForFile(canonicalFile, canonicalLocale);
    const resolvedOgImage = ogImage || DEFAULT_OG_IMAGE;
    const resolvedOgImageAlt = ogImageAlt || title;
    const resolvedOgLocale = ogLocale || getOgLocale(locale);
    const ogLocaleAlternates = includeAlternates ? getGeneratedLocales()
        .filter((localeConfig) => localeConfig.code !== locale)
        .map((localeConfig) => `    <meta property="og:locale:alternate" content="${escapeAttribute(getOgLocale(localeConfig.code))}">`)
        .join("\n") : "";
    const structuredDataBlock = buildStructuredDataBlock({
        canonicalUrl,
        title,
        description,
        locale,
        documentLang,
        imageUrl: resolvedOgImage,
        imageAlt: resolvedOgImageAlt,
        breadcrumbs,
        structuredData,
        robots,
        dateModified
    });

    return `
    <meta name="description" content="${escapeAttribute(description)}">
    <meta name="robots" content="${escapeAttribute(robots)}">
    <meta name="theme-color" content="${escapeAttribute(themeColor)}">
    <link rel="canonical" href="${escapeAttribute(canonicalUrl)}">
${alternateLinks}${xDefaultLink}
    <meta property="og:type" content="${escapeAttribute(type)}">
    <meta property="og:site_name" content="${SITE_NAME}">
    <meta property="og:locale" content="${escapeAttribute(resolvedOgLocale)}">
${ogLocaleAlternates}
    <meta property="og:title" content="${escapeAttribute(title)}">
    <meta property="og:description" content="${escapeAttribute(description)}">
    <meta property="og:url" content="${escapeAttribute(canonicalUrl)}">
    <meta property="og:image" content="${escapeAttribute(resolvedOgImage)}">
    <meta property="og:image:alt" content="${escapeAttribute(resolvedOgImageAlt)}">
    <meta name="twitter:card" content="${escapeAttribute(twitterCard)}">
    <meta name="twitter:title" content="${escapeAttribute(title)}">
    <meta name="twitter:description" content="${escapeAttribute(description)}">
    <meta name="twitter:image" content="${escapeAttribute(resolvedOgImage)}">
    <meta name="twitter:image:alt" content="${escapeAttribute(resolvedOgImageAlt)}">
${structuredDataBlock}
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_ID}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${ANALYTICS_ID}');
    </script>
`;
}

function buildStructuredDataBlock({ canonicalUrl, title, description, locale, documentLang, imageUrl, imageAlt, breadcrumbs = [], structuredData = [], robots = "", dateModified = null }) {
    if (/noindex/i.test(robots)) {
        return "";
    }

    const language = documentLang || getLocaleConfig(locale).hreflang;
    const organizationId = `${SITE_ORIGIN}/#organization`;
    const websiteId = `${SITE_ORIGIN}/#website`;
    const webpageId = `${canonicalUrl}#webpage`;
    const primaryImageId = `${canonicalUrl}#primaryimage`;
    const graph = [
        {
            "@type": "Organization",
            "@id": organizationId,
            name: SITE_NAME,
            alternateName: "Shiba",
            description: SITE_DESCRIPTION,
            url: SITE_ORIGIN,
            email: SUPPORT_EMAIL,
            logo: {
                "@type": "ImageObject",
                url: DEFAULT_OG_IMAGE,
                width: 520,
                height: 520
            },
            contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer support",
                email: SUPPORT_EMAIL,
                url: `${SITE_ORIGIN}/contact.html`,
                availableLanguage: ["ja", "en", "ko", "zh-Hant", "zh-Hans", "es", "fr", "de", "id"]
            }
        },
        {
            "@type": "WebSite",
            "@id": websiteId,
            url: `${SITE_ORIGIN}/`,
            name: SITE_NAME,
            inLanguage: language,
            publisher: { "@id": organizationId }
        },
        {
            "@type": "ImageObject",
            "@id": primaryImageId,
            url: imageUrl,
            caption: imageAlt
        },
        {
            "@type": "WebPage",
            "@id": webpageId,
            url: canonicalUrl,
            name: title,
            description,
            inLanguage: language,
            ...(dateModified ? { dateModified } : {}),
            isPartOf: { "@id": websiteId },
            publisher: { "@id": organizationId },
            primaryImageOfPage: { "@id": primaryImageId },
            image: { "@id": primaryImageId }
        }
    ];

    const breadcrumbSchema = buildBreadcrumbStructuredData(breadcrumbs, canonicalUrl, locale);
    if (breadcrumbSchema) {
        graph.push(breadcrumbSchema);
        graph.find((item) => item["@id"] === webpageId).breadcrumb = { "@id": breadcrumbSchema["@id"] };
    }

    graph.push(...normalizeStructuredData(structuredData));

    return `    <script type="application/ld+json">${serializeJsonLd({
        "@context": "https://schema.org",
        "@graph": graph
    })}</script>`;
}

function buildBreadcrumbStructuredData(items, canonicalUrl, locale) {
    const cleanItems = (items || []).filter((item) => item?.label);
    if (cleanItems.length < 2) {
        return null;
    }

    return {
        "@type": "BreadcrumbList",
        "@id": `${canonicalUrl}#breadcrumb`,
        itemListElement: cleanItems.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.label,
            item: item.href ? resolveStructuredDataHref(item.href, canonicalUrl, locale) : canonicalUrl
        }))
    };
}

function resolveStructuredDataHref(href, canonicalUrl, locale) {
    if (/^https?:\/\//i.test(href)) {
        return href;
    }

    if (href.startsWith("#")) {
        return `${canonicalUrl}${href}`;
    }

    const [file, hash = ""] = href.split("#");
    const resolved = absoluteUrlForFile(file || "index.html", locale);
    return hash ? `${resolved}#${hash}` : resolved;
}

function normalizeStructuredData(value) {
    if (!value) {
        return [];
    }

    return Array.isArray(value) ? value.filter(Boolean) : [value];
}

function serializeJsonLd(value) {
    return JSON.stringify(value)
        .replace(/</g, "\\u003c")
        .replace(/>/g, "\\u003e")
        .replace(/&/g, "\\u0026")
        .replace(/\u2028/g, "\\u2028")
        .replace(/\u2029/g, "\\u2029");
}

function renderStaticHeader({ pageType = "content", unitSwitchHtml = "", locale = "ja", textLocale = locale, showCategoryNav = pageType === "exercise" } = {}) {
    if (pageType === "home") {
        return renderAppHeader(locale, textLocale);
    }

    const categoryNav = showCategoryNav ? renderLegacyCategoryNav(pageType, locale) : "";
    const subNavHtml = categoryNav ? `

        <div class="sub-nav">
${categoryNav}
        </div>` : "";

    return `    <header>
        <nav>
            <div class="header-logo">
                <a href="index.html" class="header-link">
                    <img src="${assetHref("app/shiba-mascot.png", locale)}" alt="Shiba Muscle" class="header-dumbbell-logo">
                    <span class="header-text">Shiba Muscle</span>
                </a>
            </div>
${unitSwitchHtml ? `            ${unitSwitchHtml}\n` : ""}        </nav>${subNavHtml}
    </header>`;
}

function renderAppHeader(locale = "ja", textLocale = locale) {
    const ctaLabel = getAppHeaderText(textLocale, "comingSoon");
    const navItems = [
        ["#today", getAppHeaderText(textLocale, "today")],
        ["#analytics", getAppHeaderText(textLocale, "analytics")],
        ["#library", getAppHeaderText(textLocale, "library")]
    ];

    return `    <header class="site-header app-local-header">
        <nav class="site-topbar app-local-topbar" aria-label="Shiba">
            <a href="index.html" class="app-local-brand">
                <img src="${assetHref("app/shiba-mascot.png", locale)}" alt="Shiba" class="app-local-brand-icon">
                <span>Shiba</span>
            </a>
            <div class="app-local-nav">
${navItems.map(([href, label]) => `                <a href="${escapeAttribute(href)}" class="app-local-nav-link">${escapeHtml(label)}</a>`).join("\n")}
                <a href="#app-store" class="app-local-cta" aria-disabled="true">${escapeHtml(ctaLabel)}</a>
            </div>
        </nav>
    </header>`;
}

function getAppHeaderText(locale, key) {
    const text = {
        ja: { today: "今日", analytics: "分析", library: "種目", comingSoon: "App Store準備中" },
        ko: { today: "Today", analytics: "Analytics", library: "Library", comingSoon: "출시 예정" },
        "zh-hant": { today: "Today", analytics: "Analytics", library: "Library", comingSoon: "即將推出" },
        "zh-hans": { today: "Today", analytics: "Analytics", library: "Library", comingSoon: "即将推出" },
        es: { today: "Today", analytics: "Analytics", library: "Library", comingSoon: "Próximamente" },
        fr: { today: "Today", analytics: "Analytics", library: "Library", comingSoon: "Bientôt" },
        de: { today: "Today", analytics: "Analytics", library: "Library", comingSoon: "Demnächst" },
        id: { today: "Today", analytics: "Analytics", library: "Library", comingSoon: "Segera hadir" },
        en: { today: "Today", analytics: "Analytics", library: "Library", comingSoon: "Coming Soon" }
    };

    return text[locale]?.[key] || text.ja[key] || key;
}

function renderLegacyCategoryNav(pageType, locale = "ja") {
    const categoryLinks = getCategoryNavItems(locale);
    return categoryLinks.map((item, index) => {
        const href = categoryNavHref(item.id, pageType);
        const divider = index < categoryLinks.length - 1 ? '\n            <div class="divider">|</div>' : "";
        return `            <a href="${href}">
                <img src="${item.icon}" alt="${item.alt}" class="exercise-icon"> ${item.label}
            </a>${divider}`;
    }).join("\n");
}

function categoryNavHref(sectionId, pageType) {
    if (pageType === "home" || pageType === "exercise") {
        return `#${sectionId}`;
    }

    return `index.html#${sectionId}`;
}

function renderStaticFooter(file, locale = "ja") {
    const alternates = languageAlternates(file);
    const flagAlt = {
        en: locale === "ko" ? "영국 국기" : locale === "zh-hant" ? "英國國旗" : locale === "zh-hans" ? "英国国旗" : locale === "es" ? "Bandera del Reino Unido" : locale === "fr" ? "Drapeau du Royaume-Uni" : locale === "de" ? "Flagge des Vereinigten Königreichs" : locale === "id" ? "Bendera Britania Raya" : "UK flag",
        ja: locale === "ko" ? "일본 국기" : locale === "zh-hant" ? "日本國旗" : locale === "zh-hans" ? "日本国旗" : locale === "es" ? "Bandera de Japón" : locale === "fr" ? "Drapeau du Japon" : locale === "de" ? "Flagge Japans" : locale === "id" ? "Bendera Jepang" : "Japanese flag",
        "zh-hant": locale === "ko" ? "번체 중국어" : locale === "zh-hant" ? "繁體中文" : locale === "zh-hans" ? "繁体中文" : locale === "es" ? "Chino tradicional" : locale === "id" ? "Bahasa Tionghoa tradisional" : "Traditional Chinese",
        "zh-hans": locale === "ko" ? "간체 중국어" : locale === "zh-hant" ? "簡體中文" : locale === "zh-hans" ? "简体中文" : locale === "es" ? "Chino simplificado" : locale === "id" ? "Bahasa Tionghoa sederhana" : "Simplified Chinese",
        ko: locale === "ko" ? "한국 국기" : locale === "zh-hant" ? "韓國國旗" : locale === "zh-hans" ? "韩国国旗" : locale === "es" ? "Bandera de Corea" : locale === "fr" ? "Drapeau de la Corée" : locale === "de" ? "Flagge Koreas" : locale === "id" ? "Bendera Korea" : "Korean flag",
        es: locale === "ko" ? "스페인 국기" : locale === "zh-hant" ? "西班牙國旗" : locale === "zh-hans" ? "西班牙国旗" : locale === "es" ? "Bandera de España" : locale === "fr" ? "Drapeau de l'Espagne" : locale === "de" ? "Flagge Spaniens" : locale === "id" ? "Bendera Spanyol" : "Spanish flag",
        zh: locale === "ko" ? "중국 국기" : locale === "zh-hant" ? "中國國旗" : locale === "zh-hans" ? "中国国旗" : locale === "es" ? "Bandera de China" : locale === "fr" ? "Drapeau de la Chine" : locale === "de" ? "Flagge Chinas" : locale === "id" ? "Bendera Tiongkok" : "Chinese flag",
        fr: locale === "ko" ? "프랑스 국기" : locale === "es" ? "Bandera de Francia" : locale === "fr" ? "Drapeau de la France" : locale === "de" ? "Flagge Frankreichs" : locale === "id" ? "Bendera Prancis" : "French flag",
        de: locale === "ko" ? "독일 국기" : locale === "es" ? "Bandera de Alemania" : locale === "fr" ? "Drapeau de l'Allemagne" : locale === "de" ? "Flagge Deutschlands" : locale === "id" ? "Bendera Jerman" : "German flag",
        id: locale === "id" ? "Bendera Indonesia" : locale === "fr" ? "Drapeau de l'Indonésie" : locale === "de" ? "Flagge Indonesiens" : "Indonesian flag"
    };
    const flagIcon = {
        en: "uk-flag.webp",
        ja: "japan-flag.webp",
        "zh-hant": "china-flag.webp",
        "zh-hans": "china-flag.webp",
        ko: "korea-flag.webp",
        es: "spain-flag.svg",
        fr: "france-flag.svg",
        de: "germany-flag.svg",
        id: "indonesia-flag.svg"
    };

    return `
    <footer>
        <div class="footer-container">
            <div class="footer-section links">
                <h4>${escapeHtml(getUiText(locale, "links"))}</h4>
                <ul>
                    <li><img src="${assetHref("app/shiba-mascot.png", locale)}" alt="${escapeAttribute(getUiText(locale, "contact"))}" class="link-icon">
                        <a href="contact.html">${escapeHtml(getUiText(locale, "contact"))}</a>
                    </li>
                    <li><img src="${assetHref("app/shiba-mascot.png", locale)}" alt="${escapeAttribute(getUiText(locale, "about"))}" class="link-icon">
                        <a href="about.html">${escapeHtml(getUiText(locale, "about"))}</a>
                    </li>
                    <li><img src="${assetHref("app/shiba-mascot.png", locale)}" alt="${escapeAttribute(getUiText(locale, "methodology"))}" class="link-icon">
                        <a href="methodology.html">${escapeHtml(getUiText(locale, "methodology"))}</a>
                    </li>
                    <li><img src="${assetHref("app/shiba-mascot.png", locale)}" alt="${escapeAttribute(getUiText(locale, "privacy"))}" class="link-icon">
                        <a href="privacy-policy.html">${escapeHtml(getUiText(locale, "privacy"))}</a>
                    </li>
                </ul>
            </div>
            <div class="footer-section languages">
                <h4>${escapeHtml(getUiText(locale, "language"))}</h4>
                <ul>
${alternates.map((item) => {
                    const icon = flagIcon[item.code] || "app/shiba-mascot.png";
                    const alt = flagAlt[item.code] || item.displayName;
                    return `                    <li><img src="${assetHref(icon, locale)}" alt="${escapeAttribute(alt)}" class="flag-icon"> <a href="${escapeAttribute(item.href)}" data-lang="${escapeAttribute(item.code)}">${escapeHtml(item.displayName)}</a></li>`;
                }).join("\n")}
                </ul>
            </div>
        </div>
        <hr class="footer-divider">
        <div class="footer-bottom">
            <p>© Shiba Muscle</p>
        </div>
    </footer>`;
}

function renderBreadcrumb(items, locale = "ja") {
    const renderedItems = items.map((item) => {
        if (item.href) {
            return `<a href="${escapeAttribute(item.href)}">${escapeHtml(item.label)}</a>`;
        }

        return `<span>${escapeHtml(item.label)}</span>`;
    }).join('<span class="breadcrumb-separator">/</span>\n            ');

    return `
    <div class="container breadcrumb-container">
        <nav class="breadcrumb" aria-label="${escapeAttribute(getUiText(locale, "breadcrumb"))}">
            ${renderedItems}
        </nav>
    </div>`;
}

function renderExerciseLibrary(catalogData, { unit = "kg", titleTag = "h2", titleText = "", titleId = "other-workouts", locale = "ja", containerClass = "container", introText = "" } = {}) {
    const heading = titleText || getUiText(locale, "moreWorkouts");
    const introBlock = introText ? `        <p class="section-intro">${escapeHtml(introText)}</p>\n\n` : "";
    return `
    <div class="${escapeAttribute(containerClass)}">
        <${titleTag} class="section-title" id="${escapeAttribute(titleId)}">${escapeHtml(heading)}</${titleTag}>
${introBlock}
${catalogData.sections.map((section) => {
        const localizedTitle = locale === "ja" ? section.titles.ja : getCategoryLabel(section, locale);
        return `        <h2 id="${escapeAttribute(section.id)}" class="section-title">${escapeHtml(localizedTitle)}</h2>
        <div class="exercise-cards-container">
${section.cards.map((card) => renderCard(card, unit, locale, section)).join("\n")}
        </div>`;
    }).join("\n")}
    </div>`;
}

function renderCardGrid(cards, { unit = "kg", className = "exercise-cards-container exercise-cards-container--feature", locale = "ja" } = {}) {
    return `
        <div class="${escapeAttribute(className)}">
${cards.map((card) => renderCard(card, unit, locale)).join("\n")}
        </div>`;
}

function renderCard(card, unit, locale = "ja", section = {}) {
    const localizedCard = buildLocalizedCard(card, section, locale);
    const tags = (localizedCard.tags?.[locale] || localizedCard.tags?.ja || []).join(" | ");
    const aliases = (localizedCard.aliases?.[locale] || localizedCard.aliases?.ja || []).join(" | ");
    const primaryMuscles = (localizedCard.primaryMuscles?.[locale] || localizedCard.primaryMuscles?.ja || []).join(" | ");
    const description = localizedCard.description?.[locale] || localizedCard.description?.ja || "";
    const measurementKind = card.measurementKind || "";
    const name = localizedCard.names?.[locale] || localizedCard.names?.ja || "";
    const category = localizedCard.categories?.[locale] || localizedCard.categories?.ja || "";

    return `            <a class="card-link" href="${escapeAttribute(`${unit}_${card.slug}.html`)}">
                <div class="exercise-card"
                    data-card-slug="${escapeAttribute(card.slug)}"
                    data-measurement-kind="${escapeAttribute(measurementKind)}"
                    data-description="${escapeAttribute(description)}"
                    data-primary-muscles="${escapeAttribute(primaryMuscles)}"
                    data-tags="${escapeAttribute(tags)}"
                    data-aliases="${escapeAttribute(aliases)}">
                    <img src="${escapeAttribute(localizeImageHref(card.image, locale))}" alt="${escapeAttribute(name || card.imageAlt)}" loading="lazy">
                    <div class="exercise-details">
                        <div class="name">${escapeHtml(name)}</div>
                        <div class="category">${escapeHtml(category)}</div>
                    </div>
                </div>
            </a>`;
}

function renderDiscoveryGrid(section, pages, locale = "ja") {
    return `
    <section class="container section-band discovery-band" id="${escapeAttribute(section.id)}">
        <div class="section-heading">
            <p class="eyebrow">${escapeHtml(section.eyebrow || "Guide")}</p>
            <h2>${escapeHtml(section.title)}</h2>
            <p>${escapeHtml(section.copy || "")}</p>
        </div>
        <div class="discovery-grid">
${pages.map((page) => {
        return `            <a class="discovery-card" href="${escapeAttribute(page.file)}">
                <span class="discovery-type">${escapeHtml(locale === "zh-hant" ? (page.type === "comparison" ? "比較" : "目標") : locale === "zh-hans" ? (page.type === "comparison" ? "比较" : "目标") : locale === "de" ? (page.type === "comparison" ? "Vergleich" : "Ziel") : locale === "fr" ? (page.type === "comparison" ? "Comparatif" : "Objectif") : locale === "id" ? (page.type === "comparison" ? "Perbandingan" : "Tujuan") : locale === "es" ? (page.type === "comparison" ? "Comparativa" : "Objetivo") : page.type === "comparison" ? "Comparison" : "Intent")}</span>
                <h3>${escapeHtml(page.heading)}</h3>
                <p>${escapeHtml((page.intro || [])[0] || page.description || "")}</p>
                <span class="discovery-link">${locale === "ko" ? "페이지 보기" : locale === "zh-hant" ? "查看頁面" : locale === "zh-hans" ? "查看页面" : locale === "es" ? "Ver página" : locale === "fr" ? "Voir la page" : locale === "de" ? "Seite ansehen" : locale === "id" ? "Lihat halaman" : locale === "en" ? "View page" : "ページを見る"}</span>
            </a>`;
    }).join("\n")}
        </div>
    </section>`;
}

function renderAdSlot(placement = "") {
    const placementAttribute = placement ? ` data-ad-placement-key="${escapeAttribute(placement)}"` : "";

    return `
    <div class="container ad-slot-container"${placementAttribute}>
        <!-- shiba-horizontal -->
        <ins class="adsbygoogle"
             style="display:block"
             data-ad-client="${ADSENSE_CLIENT_ID}"
             data-ad-slot="3763544828"
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
        <script>
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        </script>
    </div>`;
}

function normalizeText(text) {
    return (text || "").replace(/\s+/g, " ").trim();
}

function localizeImageHref(href, locale = "ja") {
    if (!href || /^https?:\/\//i.test(href)) {
        return href || "";
    }

    if (href.startsWith("./assets/")) {
        return assetHref(href, locale);
    }

    return href;
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function escapeAttribute(value) {
    return escapeHtml(value || "");
}

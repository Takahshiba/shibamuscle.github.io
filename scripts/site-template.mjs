import {
    assetHref,
    buildLocalizedCard,
    cleanSectionLabel,
    getCategoryLabel,
    getCategoryNavItems,
    getLocaleConfig,
    getUiText,
    languageAlternates,
    stylesheetHref
} from "./localization.mjs";

const ADSENSE_CLIENT_ID = "ca-pub-2819086765117537";
const ADSENSE_SCRIPT_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;

function buildFontBlock(locale = "ja") {
    const family = locale === "ko" ? "Noto+Sans+KR" : "Noto+Sans+JP";
    return `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=${family}:wght@100..900&display=swap" rel="stylesheet">
`;
}

function buildFaviconBlock(locale = "ja") {
    return `
    <!-- Favicon -->
    <meta name="msapplication-square70x70logo" content="${assetHref("site-tile-70x70.png", locale)}">
    <meta name="msapplication-square150x150logo" content="${assetHref("site-tile-150x150.png", locale)}">
    <meta name="msapplication-wide310x150logo" content="${assetHref("site-tile-310x150.png", locale)}">
    <meta name="msapplication-square310x310logo" content="${assetHref("site-tile-310x310.png", locale)}">
    <meta name="msapplication-TileColor" content="#0078d7">
    <link rel="shortcut icon" type="image/vnd.microsoft.icon" href="${assetHref("favicon.ico", locale)}">
    <link rel="icon" type="image/vnd.microsoft.icon" href="${assetHref("favicon.ico", locale)}">
    <link rel="apple-touch-icon" sizes="57x57" href="${assetHref("apple-touch-icon-57x57.png", locale)}">
    <link rel="apple-touch-icon" sizes="60x60" href="${assetHref("apple-touch-icon-60x60.png", locale)}">
    <link rel="apple-touch-icon" sizes="72x72" href="${assetHref("apple-touch-icon-72x72.png", locale)}">
    <link rel="apple-touch-icon" sizes="76x76" href="${assetHref("apple-touch-icon-76x76.png", locale)}">
    <link rel="apple-touch-icon" sizes="114x114" href="${assetHref("apple-touch-icon-114x114.png", locale)}">
    <link rel="apple-touch-icon" sizes="120x120" href="${assetHref("apple-touch-icon-120x120.png", locale)}">
    <link rel="apple-touch-icon" sizes="144x144" href="${assetHref("apple-touch-icon-144x144.png", locale)}">
    <link rel="apple-touch-icon" sizes="152x152" href="${assetHref("apple-touch-icon-152x152.png", locale)}">
    <link rel="apple-touch-icon" sizes="180x180" href="${assetHref("apple-touch-icon-180x180.png", locale)}">
    <link rel="icon" type="image/png" sizes="36x36" href="${assetHref("android-chrome-36x36.png", locale)}">
    <link rel="icon" type="image/png" sizes="48x48" href="${assetHref("android-chrome-48x48.png", locale)}">
    <link rel="icon" type="image/png" sizes="72x72" href="${assetHref("android-chrome-72x72.png", locale)}">
    <link rel="icon" type="image/png" sizes="96x96" href="${assetHref("android-chrome-96x96.png", locale)}">
    <link rel="icon" type="image/png" sizes="128x128" href="${assetHref("android-chrome-128x128.png", locale)}">
    <link rel="icon" type="image/png" sizes="144x144" href="${assetHref("android-chrome-144x144.png", locale)}">
    <link rel="icon" type="image/png" sizes="152x152" href="${assetHref("android-chrome-152x152.png", locale)}">
    <link rel="icon" type="image/png" sizes="192x192" href="${assetHref("android-chrome-192x192.png", locale)}">
    <link rel="icon" type="image/png" sizes="256x256" href="${assetHref("android-chrome-256x256.png", locale)}">
    <link rel="icon" type="image/png" sizes="384x384" href="${assetHref("android-chrome-384x384.png", locale)}">
    <link rel="icon" type="image/png" sizes="512x512" href="${assetHref("android-chrome-512x512.png", locale)}">
    <link rel="icon" type="image/png" sizes="36x36" href="${assetHref("icon-36x36.png", locale)}">
    <link rel="icon" type="image/png" sizes="48x48" href="${assetHref("icon-48x48.png", locale)}">
    <link rel="icon" type="image/png" sizes="72x72" href="${assetHref("icon-72x72.png", locale)}">
    <link rel="icon" type="image/png" sizes="96x96" href="${assetHref("icon-96x96.png", locale)}">
    <link rel="icon" type="image/png" sizes="128x128" href="${assetHref("icon-128x128.png", locale)}">
    <link rel="icon" type="image/png" sizes="144x144" href="${assetHref("icon-144x144.png", locale)}">
    <link rel="icon" type="image/png" sizes="152x152" href="${assetHref("icon-152x152.png", locale)}">
    <link rel="icon" type="image/png" sizes="160x160" href="${assetHref("icon-160x160.png", locale)}">
    <link rel="icon" type="image/png" sizes="192x192" href="${assetHref("icon-192x192.png", locale)}">
    <link rel="icon" type="image/png" sizes="196x196" href="${assetHref("icon-196x196.png", locale)}">
    <link rel="icon" type="image/png" sizes="256x256" href="${assetHref("icon-256x256.png", locale)}">
    <link rel="icon" type="image/png" sizes="384x384" href="${assetHref("icon-384x384.png", locale)}">
    <link rel="icon" type="image/png" sizes="512x512" href="${assetHref("icon-512x512.png", locale)}">
    <link rel="icon" type="image/png" sizes="16x16" href="${assetHref("icon-16x16.png", locale)}">
    <link rel="icon" type="image/png" sizes="24x24" href="${assetHref("icon-24x24.png", locale)}">
    <link rel="icon" type="image/png" sizes="32x32" href="${assetHref("icon-32x32.png", locale)}">
    <link rel="manifest" href="${assetHref("manifest.json", locale)}">
`;
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

function renderDocument({ title, stylesheets = ["styles.css"], body, generatedComment, locale = "ja" }) {
    const localeConfig = getLocaleConfig(locale);
    const comment = generatedComment ? `${generatedComment}\n` : "";
    const stylesheetLinks = stylesheets.map((href) => `    <link rel="stylesheet" href="${escapeAttribute(stylesheetHref(href, locale))}">`).join("\n");

    return `<!DOCTYPE html>
${comment}<html lang="${escapeAttribute(localeConfig.hreflang)}" dir="${escapeAttribute(localeConfig.dir || "ltr")}">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>

    <script async src="${ADSENSE_SCRIPT_SRC}"
     crossorigin="anonymous"></script>
${buildFontBlock(locale)}
${buildFaviconBlock(locale)}
${stylesheetLinks}
</head>
<body>
${body}
</body>

</html>
`;
}

function renderStaticHeader({ pageType = "content", unitSwitchHtml = "", locale = "ja" } = {}) {
    const categoryNav = renderLegacyCategoryNav(pageType, locale);

    return `    <header>
        <nav>
            <div class="header-logo">
                <a href="index.html" class="header-link">
                    <img src="${assetHref("dumbbell-logo.png", locale)}" alt="Shiba Muscle" class="header-dumbbell-logo">
                    <span class="header-text">Shiba Muscle</span>
                </a>
            </div>
${unitSwitchHtml ? `            ${unitSwitchHtml}\n` : ""}        </nav>

        <div class="sub-nav">
${categoryNav}
        </div>
    </header>`;
}

function renderLegacyCategoryNav(pageType, locale = "ja") {
    const categoryLinks = getCategoryNavItems(locale);
    return categoryLinks.map((item, index) => {
        const href = pageType === "home" ? `#${item.id}` : `index.html#${item.id}`;
        const divider = index < categoryLinks.length - 1 ? '\n            <div class="divider">|</div>' : "";
        return `            <a href="${href}">
                <img src="${item.icon}" alt="${item.alt}" class="exercise-icon"> ${item.label}
            </a>${divider}`;
    }).join("\n");
}

function renderStaticFooter(file, locale = "ja") {
    const alternates = languageAlternates(file);
    const flagAlt = {
        en: locale === "ko" ? "영국 국기" : "UK",
        ja: locale === "ko" ? "일본 국기" : "Japan",
        zh: locale === "ko" ? "중국 국기" : "China",
        ko: locale === "ko" ? "한국 국기" : "Korea"
    };
    const flagIcon = {
        en: "uk-flag.webp",
        ja: "japan-flag.webp",
        zh: "china-flag.webp",
        ko: "korea-flag.webp"
    };

    return `
    <footer>
        <div class="footer-container">
            <div class="footer-section links">
                <h4>${escapeHtml(getUiText(locale, "links"))}</h4>
                <ul>
                    <li><img src="${assetHref("contact-icon.webp", locale)}" alt="${escapeAttribute(getUiText(locale, "contact"))}" class="link-icon">
                        <a href="contact.html">${escapeHtml(getUiText(locale, "contact"))}</a>
                    </li>
                    <li><img src="${assetHref("privacy-policy-icon.webp", locale)}" alt="${escapeAttribute(getUiText(locale, "privacy"))}" class="link-icon">
                        <a href="privacy-policy.html">${escapeHtml(getUiText(locale, "privacy"))}</a>
                    </li>
                </ul>
            </div>
            <div class="footer-section languages">
                <h4>${escapeHtml(getUiText(locale, "language"))}</h4>
                <ul>
${alternates.map((item) => `                    <li><img src="${assetHref(flagIcon[item.code], locale)}" alt="${escapeAttribute(flagAlt[item.code])}" class="flag-icon"> <a href="${escapeAttribute(item.href)}" data-lang="${escapeAttribute(item.code)}">${escapeHtml(item.displayName)}</a></li>`).join("\n")}
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

function renderExerciseLibrary(catalogData, { unit = "kg", titleTag = "h2", titleText = "", titleId = "other-workouts", locale = "ja" } = {}) {
    const heading = titleText || getUiText(locale, "moreWorkouts");
    return `
    <div class="container">
        <${titleTag} class="section-title" id="${escapeAttribute(titleId)}">${escapeHtml(heading)}</${titleTag}>

        <div class="search-bar-container">
            <input type="text" id="search-bar" placeholder="🔍" aria-label="${escapeAttribute(getUiText(locale, "searchExercises"))}" onkeyup="filterExercises()">
        </div>

${catalogData.sections.map((section) => {
        const localizedTitle = locale === "ko" ? getCategoryLabel(section, locale) : section.titles.ja;
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
    const searchTerms = (localizedCard.searchTerms?.[locale] || localizedCard.searchTerms?.ja || []).join(" | ");
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
                    data-aliases="${escapeAttribute(aliases)}"
                    data-search-terms="${escapeAttribute(searchTerms)}">
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
                <span class="discovery-type">${escapeHtml(page.type === "comparison" ? "Comparison" : "Intent")}</span>
                <h3>${escapeHtml(page.heading)}</h3>
                <p>${escapeHtml((page.intro || [])[0] || page.description || "")}</p>
                <span class="discovery-link">${locale === "ko" ? "페이지 보기" : "ページを見る"}</span>
            </a>`;
    }).join("\n")}
        </div>
    </section>`;
}

function renderAdSlot() {
    return `
    <div class="container">
        <!-- shiba-horizontal -->
        <ins class="adsbygoogle"
             style="display:block"
             data-ad-client="${ADSENSE_CLIENT_ID}"
             data-ad-slot="4208884570"
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
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

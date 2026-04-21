const ADSENSE_CLIENT_ID = "ca-pub-2819086765117537";
const ADSENSE_SCRIPT_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;

const CATEGORY_LINKS = [
    { id: "whole-body-section", label: "全身", icon: "./assets/power-clean-white-icon.webp", alt: "全身" },
    { id: "chest-section", label: "胸", icon: "./assets/bench-press-white-icon.webp", alt: "胸" },
    { id: "back-section", label: "背中", icon: "./assets/deadlift-white-icon.webp", alt: "背中" },
    { id: "shoulder-section", label: "肩", icon: "./assets/shoulder-press-white-icon.webp", alt: "Shoulder" },
    { id: "arm-section", label: "腕", icon: "./assets/hammer-curl-white-icon.webp", alt: "Arm" },
    { id: "leg-section", label: "脚", icon: "./assets/squat-white-icon.webp", alt: "Leg" },
    { id: "core-section", label: "体幹", icon: "./assets/sit-ups-white-icon.webp", alt: "Core" }
];

const FONT_BLOCK = `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100..900&display=swap" rel="stylesheet">
`;

const FAVICON_BLOCK = `
    <!-- Favicon -->
    <meta name="msapplication-square70x70logo" content="./assets/site-tile-70x70.png">
    <meta name="msapplication-square150x150logo" content="./assets/site-tile-150x150.png">
    <meta name="msapplication-wide310x150logo" content="./assets/site-tile-310x150.png">
    <meta name="msapplication-square310x310logo" content="./assets/site-tile-310x310.png">
    <meta name="msapplication-TileColor" content="#0078d7">
    <link rel="shortcut icon" type="image/vnd.microsoft.icon" href="./assets/favicon.ico">
    <link rel="icon" type="image/vnd.microsoft.icon" href="./assets/favicon.ico">
    <link rel="apple-touch-icon" sizes="57x57" href="./assets/apple-touch-icon-57x57.png">
    <link rel="apple-touch-icon" sizes="60x60" href="./assets/apple-touch-icon-60x60.png">
    <link rel="apple-touch-icon" sizes="72x72" href="./assets/apple-touch-icon-72x72.png">
    <link rel="apple-touch-icon" sizes="76x76" href="./assets/apple-touch-icon-76x76.png">
    <link rel="apple-touch-icon" sizes="114x114" href="./assets/apple-touch-icon-114x114.png">
    <link rel="apple-touch-icon" sizes="120x120" href="./assets/apple-touch-icon-120x120.png">
    <link rel="apple-touch-icon" sizes="144x144" href="./assets/apple-touch-icon-144x144.png">
    <link rel="apple-touch-icon" sizes="152x152" href="./assets/apple-touch-icon-152x152.png">
    <link rel="apple-touch-icon" sizes="180x180" href="./assets/apple-touch-icon-180x180.png">
    <link rel="icon" type="image/png" sizes="36x36" href="./assets/android-chrome-36x36.png">
    <link rel="icon" type="image/png" sizes="48x48" href="./assets/android-chrome-48x48.png">
    <link rel="icon" type="image/png" sizes="72x72" href="./assets/android-chrome-72x72.png">
    <link rel="icon" type="image/png" sizes="96x96" href="./assets/android-chrome-96x96.png">
    <link rel="icon" type="image/png" sizes="128x128" href="./assets/android-chrome-128x128.png">
    <link rel="icon" type="image/png" sizes="144x144" href="./assets/android-chrome-144x144.png">
    <link rel="icon" type="image/png" sizes="152x152" href="./assets/android-chrome-152x152.png">
    <link rel="icon" type="image/png" sizes="192x192" href="./assets/android-chrome-192x192.png">
    <link rel="icon" type="image/png" sizes="256x256" href="./assets/android-chrome-256x256.png">
    <link rel="icon" type="image/png" sizes="384x384" href="./assets/android-chrome-384x384.png">
    <link rel="icon" type="image/png" sizes="512x512" href="./assets/android-chrome-512x512.png">
    <link rel="icon" type="image/png" sizes="36x36" href="./assets/icon-36x36.png">
    <link rel="icon" type="image/png" sizes="48x48" href="./assets/icon-48x48.png">
    <link rel="icon" type="image/png" sizes="72x72" href="./assets/icon-72x72.png">
    <link rel="icon" type="image/png" sizes="96x96" href="./assets/icon-96x96.png">
    <link rel="icon" type="image/png" sizes="128x128" href="./assets/icon-128x128.png">
    <link rel="icon" type="image/png" sizes="144x144" href="./assets/icon-144x144.png">
    <link rel="icon" type="image/png" sizes="152x152" href="./assets/icon-152x152.png">
    <link rel="icon" type="image/png" sizes="160x160" href="./assets/icon-160x160.png">
    <link rel="icon" type="image/png" sizes="192x192" href="./assets/icon-192x192.png">
    <link rel="icon" type="image/png" sizes="196x196" href="./assets/icon-196x196.png">
    <link rel="icon" type="image/png" sizes="256x256" href="./assets/icon-256x256.png">
    <link rel="icon" type="image/png" sizes="384x384" href="./assets/icon-384x384.png">
    <link rel="icon" type="image/png" sizes="512x512" href="./assets/icon-512x512.png">
    <link rel="icon" type="image/png" sizes="16x16" href="./assets/icon-16x16.png">
    <link rel="icon" type="image/png" sizes="24x24" href="./assets/icon-24x24.png">
    <link rel="icon" type="image/png" sizes="32x32" href="./assets/icon-32x32.png">
    <link rel="manifest" href="./assets/manifest.json">
`;

export {
    ADSENSE_CLIENT_ID,
    CATEGORY_LINKS,
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

function renderDocument({ title, stylesheets = ["styles.css"], body, generatedComment }) {
    const comment = generatedComment ? `${generatedComment}\n` : "";
    const stylesheetLinks = stylesheets.map((href) => `    <link rel="stylesheet" href="${escapeAttribute(href)}">`).join("\n");

    return `<!DOCTYPE html>
${comment}<html lang="ja">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>

    <script async src="${ADSENSE_SCRIPT_SRC}"
     crossorigin="anonymous"></script>
${FONT_BLOCK}
${FAVICON_BLOCK}
${stylesheetLinks}
</head>
<body>
${body}
</body>

</html>
`;
}

function renderStaticHeader({ pageType = "content", unitSwitchHtml = "" } = {}) {
    const categoryNav = renderLegacyCategoryNav(pageType);

    return `    <header>
        <nav>
            <div class="header-logo">
                <a href="index.html" class="header-link">
                    <img src="./assets/dumbbell-logo.png" alt="Shiba Muscle" class="header-dumbbell-logo">
                    <span class="header-text">Shiba Muscle</span>
                </a>
            </div>
${unitSwitchHtml ? `            ${unitSwitchHtml}\n` : ""}        </nav>

        <div class="sub-nav">
${categoryNav}
        </div>
    </header>`;
}

function renderLegacyCategoryNav(pageType) {
    return CATEGORY_LINKS.map((item, index) => {
        const href = pageType === "home" ? `#${item.id}` : `index.html#${item.id}`;
        const divider = index < CATEGORY_LINKS.length - 1 ? '\n            <div class="divider">|</div>' : "";
        return `            <a href="${href}">
                <img src="${item.icon}" alt="${item.alt}" class="exercise-icon"> ${item.label}
            </a>${divider}`;
    }).join("\n");
}

function renderStaticFooter(file) {
    const path = file === "index.html" ? "/" : `/${file}`;

    return `
    <footer>
        <div class="footer-container">
            <div class="footer-section links">
                <h4>リンク</h4>
                <ul>
                    <li><img src="./assets/contact-icon.webp" alt="Contact" class="link-icon">
                        <a href="contact.html">お問い合わせ</a>
                    </li>
                    <li><img src="./assets/privacy-policy-icon.webp" alt="Privacy Policy" class="link-icon">
                        <a href="privacy-policy.html">プライバシーポリシー</a>
                    </li>
                </ul>
            </div>
            <div class="footer-section languages">
                <h4>言語</h4>
                <ul>
                    <li><img src="./assets/uk-flag.webp" alt="UK" class="flag-icon"> <a href="https://en.shibamuscle.com${path}" data-lang="en">English</a></li>
                    <li><img src="./assets/japan-flag.webp" alt="Japan" class="flag-icon"> <a href="https://shibamuscle.com${path}" data-lang="ja">日本語</a></li>
                    <li><img src="./assets/china-flag.webp" alt="China" class="flag-icon"> <a href="https://cn.shibamuscle.com${path}" data-lang="zh">中文</a></li>
                    <li><img src="./assets/korea-flag.webp" alt="Korea" class="flag-icon"> <a href="https://ko.shibamuscle.com${path}" data-lang="ko">한국어</a></li>
                </ul>
            </div>
        </div>
        <hr class="footer-divider">
        <div class="footer-bottom">
            <p>© Shiba Muscle</p>
        </div>
    </footer>`;
}

function renderBreadcrumb(items) {
    const renderedItems = items.map((item) => {
        if (item.href) {
            return `<a href="${escapeAttribute(item.href)}">${escapeHtml(item.label)}</a>`;
        }

        return `<span>${escapeHtml(item.label)}</span>`;
    }).join('<span class="breadcrumb-separator">/</span>\n            ');

    return `
    <div class="container breadcrumb-container">
        <nav class="breadcrumb" aria-label="Breadcrumb">
            ${renderedItems}
        </nav>
    </div>`;
}

function renderExerciseLibrary(catalogData, { unit = "kg", titleTag = "h2", titleText = "その他のワークアウト", titleId = "other-workouts" } = {}) {
    return `
    <div class="container">
        <${titleTag} class="section-title" id="${escapeAttribute(titleId)}">${escapeHtml(titleText)}</${titleTag}>

        <div class="search-bar-container">
            <input type="text" id="search-bar" placeholder="🔍" onkeyup="filterExercises()">
        </div>

${catalogData.sections.map((section) => {
        return `        <h2 id="${escapeAttribute(section.id)}" class="section-title">${escapeHtml(section.titles.ja)}</h2>
        <div class="exercise-cards-container">
${section.cards.map((card) => renderCard(card, unit)).join("\n")}
        </div>`;
    }).join("\n")}
    </div>`;
}

function renderCardGrid(cards, { unit = "kg", className = "exercise-cards-container exercise-cards-container--feature" } = {}) {
    return `
        <div class="${escapeAttribute(className)}">
${cards.map((card) => renderCard(card, unit)).join("\n")}
        </div>`;
}

function renderCard(card, unit) {
    const searchTerms = (card.searchTerms?.ja || []).join(" | ");
    const tags = (card.tags?.ja || []).join(" | ");
    const aliases = (card.aliases?.ja || []).join(" | ");
    const primaryMuscles = (card.primaryMuscles?.ja || []).join(" | ");
    const description = card.description?.ja || "";
    const measurementKind = card.measurementKind || "";

    return `            <a class="card-link" href="${escapeAttribute(`${unit}_${card.slug}.html`)}">
                <div class="exercise-card"
                    data-card-slug="${escapeAttribute(card.slug)}"
                    data-measurement-kind="${escapeAttribute(measurementKind)}"
                    data-description="${escapeAttribute(description)}"
                    data-primary-muscles="${escapeAttribute(primaryMuscles)}"
                    data-tags="${escapeAttribute(tags)}"
                    data-aliases="${escapeAttribute(aliases)}"
                    data-search-terms="${escapeAttribute(searchTerms)}">
                    <img src="${escapeAttribute(card.image)}" alt="${escapeAttribute(card.imageAlt)}" loading="lazy">
                    <div class="exercise-details">
                        <div class="name">${escapeHtml(card.names.ja)}</div>
                        <div class="category">${escapeHtml(card.categories.ja)}</div>
                    </div>
                </div>
            </a>`;
}

function renderDiscoveryGrid(section, pages) {
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
                <span class="discovery-link">ページを見る</span>
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

function cleanSectionLabel(text) {
    return normalizeText(text).replace("トレーニング", "").replace("トレ", "");
}

function normalizeText(text) {
    return (text || "").replace(/\s+/g, " ").trim();
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

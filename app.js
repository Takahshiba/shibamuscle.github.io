const ADSENSE_CLIENT_ID = "ca-pub-2819086765117537";
const ADSENSE_SCRIPT_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;

const CATEGORY_LINKS = [
    { id: "whole-body-section", label: "全身", icon: "./assets/power-clean-white-icon.webp", description: "デッドリフト、クリーン、スナッチなど全身連動の基準ページ" },
    { id: "chest-section", label: "胸", icon: "./assets/bench-press-white-icon.webp", description: "プレス系の平均重量と押す種目の比較" },
    { id: "back-section", label: "背中", icon: "./assets/deadlift-white-icon.webp", description: "ローイング、プル系、ヒンジ系の比較" },
    { id: "shoulder-section", label: "肩", icon: "./assets/shoulder-press-white-icon.webp", description: "プレス、レイズ、安定性の種目一覧" },
    { id: "arm-section", label: "腕", icon: "./assets/hammer-curl-white-icon.webp", description: "カール、トライセプス、前腕の種目" },
    { id: "leg-section", label: "脚", icon: "./assets/squat-white-icon.webp", description: "スクワット、ランジ、ヒップ主導の種目" },
    { id: "core-section", label: "体幹", icon: "./assets/sit-ups-white-icon.webp", description: "腹筋、回旋、体幹安定の種目" }
];

const HOME_FEATURES = {
    popular: ["deadlift", "bench-press", "squat", "pull-ups", "chin-ups", "hip-thrust"],
    big3: ["deadlift", "bench-press", "squat"],
    beginner: ["bodyweight-squat", "push-ups", "lat-pulldown", "glute-bridge", "dumbbell-row", "bench-dips"]
};

const HOME_ENTRY_ROUTES = [
    {
        id: "popular",
        label: "定番",
        eyebrow: "Popular",
        title: "よく見られる種目",
        copy: "比較されやすい定番ページから見始めたいときの入口です。",
        slugs: HOME_FEATURES.popular
    },
    {
        id: "big3",
        label: "Big 3",
        eyebrow: "Big 3",
        title: "Big 3 基準ページ",
        copy: "重量比較の入口として使いやすい3種目を先にまとめています。",
        slugs: HOME_FEATURES.big3
    },
    {
        id: "beginner",
        label: "初心者",
        eyebrow: "Starter Paths",
        title: "初心者の入口",
        copy: "まずは扱いやすい種目から見比べたいときのスタート地点です。",
        slugs: HOME_FEATURES.beginner
    }
];

const LIBRARY_INITIAL_CARD_LIMIT = 8;

let activeLibraryController = null;

normalizeAdSenseMarkup();
ensureAdSenseScript();

document.addEventListener("DOMContentLoaded", () => {
    const pageType = detectPageType();
    document.body.dataset.pageType = pageType;

    rebuildSharedChrome(pageType);

    const main = ensureMainShell();
    let libraryContext = null;

    if (pageType === "home") {
        libraryContext = enhanceHomePage(main);
    } else if (pageType === "exercise") {
        libraryContext = enhanceExercisePage(main);
    } else {
        enhanceContentPage(main);
    }

    initStandardsTabs();
    initHeaderActions();

    if (libraryContext) {
        initLibrarySearch(libraryContext);
    }
});

window.filterExercises = function () {
    if (activeLibraryController) {
        activeLibraryController.apply();
    }
};

window.toggleMenu = function () {
    document.body.classList.toggle("nav-open");
    syncMenuState();
};

function ensureAdSenseScript() {
    if (!document.head) {
        return;
    }

    const adScripts = Array.from(document.querySelectorAll('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]'));
    const hasCurrentScript = adScripts.some((script) => script.src === ADSENSE_SCRIPT_SRC);

    adScripts.forEach((script) => {
        if (script.src !== ADSENSE_SCRIPT_SRC) {
            script.remove();
        }
    });

    if (hasCurrentScript) {
        return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = ADSENSE_SCRIPT_SRC;
    script.crossOrigin = "anonymous";
    document.head.append(script);
}

function normalizeAdSenseMarkup() {
    const placeholders = Array.from(document.querySelectorAll("ins.adsbygoogle"));
    placeholders.forEach((placeholder) => {
        placeholder.setAttribute("data-ad-client", ADSENSE_CLIENT_ID);
    });
}

function detectPageType() {
    const path = currentPath();

    if (path === "index.html" || path === "") {
        return "home";
    }

    if (document.querySelector(".main-image-title")) {
        return "exercise";
    }

    return "content";
}

function rebuildSharedChrome(pageType) {
    const existingHeader = document.querySelector("header");
    const unitSwitch = existingHeader?.querySelector(".toggle-buttons")?.outerHTML || "";
    const footer = document.querySelector("footer");

    existingHeader?.remove();
    footer?.remove();
    document.querySelector(".top-divider")?.remove();

    document.body.prepend(buildHeader(pageType, unitSwitch));
    document.body.append(buildFooter());
}

function buildHeader(pageType, unitSwitch) {
    const categoryLinks = CATEGORY_LINKS.map((item) => {
        const href = pageType === "home" ? `#${item.id}` : `index.html#${item.id}`;
        return `
            <a href="${href}" class="category-nav-link">
                <span class="category-nav-icon" aria-hidden="true">
                    <img src="${item.icon}" alt="">
                </span>
                <span class="category-nav-label">${item.label}</span>
            </a>
        `;
    }).join("");

    return htmlToElement(`
        <header class="site-header">
            <nav class="site-topbar">
                <div class="header-brand">
                    <a href="index.html" class="header-link">
                        <img src="./assets/dumbbell-logo.png" alt="Shiba Muscle" class="header-dumbbell-logo">
                        <span class="header-text">Shiba Muscle</span>
                    </a>
                </div>
                ${(unitSwitch || pageType === "exercise") ? `
                    <div class="header-actions">
                        ${unitSwitch}
                        ${pageType === "exercise" ? '<button type="button" class="header-search-button" data-action="jump-to-search">種目検索</button>' : ""}
                    </div>
                ` : ""}
            </nav>
            <div class="sub-nav" id="global-category-nav">
                ${categoryLinks}
            </div>
        </header>
    `);
}

function buildFooter() {
    const categoryLinks = CATEGORY_LINKS.map((item) => {
        return `
            <a href="index.html#${item.id}" class="footer-category-link">
                <span class="category-nav-icon" aria-hidden="true">
                    <img src="${item.icon}" alt="">
                </span>
                <span class="category-nav-label">${item.label}</span>
            </a>
        `;
    }).join("");

    return htmlToElement(`
        <footer class="site-footer">
            <div class="footer-grid">
                <div class="footer-column">
                    <div class="footer-brand">
                        <img src="./assets/dumbbell-logo.png" alt="Shiba Muscle" class="footer-brand-logo">
                        <h4>Shiba Muscle</h4>
                    </div>
                </div>
                <div class="footer-column">
                    <h4>カテゴリ</h4>
                    <div class="footer-link-list footer-link-list--categories">${categoryLinks}</div>
                </div>
                <div class="footer-column">
                    <h4>サポート</h4>
                    <div class="footer-link-list footer-link-list--support">
                        <a href="contact.html">お問い合わせ</a>
                        <a href="privacy-policy.html">プライバシーポリシー</a>
                    </div>
                </div>
            </div>
            <div class="footer-meta">
                <div class="footer-languages">
                    <a href="https://en.shibamuscle.com/" data-lang="en">English</a>
                    <a href="https://shibamuscle.com/" data-lang="ja">日本語</a>
                    <a href="https://cn.shibamuscle.com/" data-lang="zh">中文</a>
                    <a href="https://ko.shibamuscle.com/" data-lang="ko">한국어</a>
                </div>
                <p>© Shiba Muscle</p>
            </div>
        </footer>
    `);
}

function ensureMainShell() {
    const existingMain = document.querySelector("main.page-main");
    if (existingMain) {
        return existingMain;
    }

    const main = document.createElement("main");
    main.className = "page-main";

    const footer = document.querySelector("footer");
    if (footer) {
        document.body.insertBefore(main, footer);
    } else {
        document.body.append(main);
    }

    const movableNodes = Array.from(document.body.children).filter((child) => {
        return child.classList && child.classList.contains("container");
    });

    movableNodes.forEach((node) => main.append(node));
    return main;
}

function enhanceHomePage(main) {
    document.body.classList.add("home-page");

    const libraryContainer = Array.from(main.children).find((child) => child.classList.contains("container"));
    if (!libraryContainer) {
        return null;
    }

    const titleHeading = replaceHeadingTag(libraryContainer.querySelector(".section-title"), "h2");
    const searchWrapper = libraryContainer.querySelector(".search-bar-container");
    const libraryData = collectLibrarySections(libraryContainer);
    const allCards = libraryData.allCards;

    const hero = htmlToElement(`
        <section class="container home-hero" id="database-top">
            <div class="home-hero-copy">
                <p class="eyebrow">Workout Data Platform</p>
                <h1>ワークアウトデータを最短で探す</h1>
                <p class="hero-description">
                    平均重量、基準表、関連種目をすばやく横断できるフィットネスデータベース。
                </p>
                <div class="hero-stat-grid">
                    <div class="summary-card">
                        <span class="metric-label">掲載カテゴリ</span>
                        <strong class="metric-value">${libraryData.sections.length}</strong>
                        <span class="metric-subvalue">主要部位</span>
                    </div>
                    <div class="summary-card">
                        <span class="metric-label">掲載種目</span>
                        <strong class="metric-value">${allCards.length}</strong>
                        <span class="metric-subvalue">カテゴリ閲覧</span>
                    </div>
                    <div class="summary-card">
                        <span class="metric-label">表示単位</span>
                        <strong class="metric-value">kg / lb</strong>
                        <span class="metric-subvalue">全ページ切替</span>
                    </div>
                </div>
            </div>
        </section>
    `);

    searchWrapper?.remove();

    const homeEntryRoutes = buildHomeEntryRoutes(allCards);
    const quickStartSection = buildQuickStartSection(homeEntryRoutes);
    const postQuickStartAd = buildStandaloneAdBlock(null, "おすすめ入口のあと");

    const categoryOverview = htmlToElement(`
        <section class="container section-band">
            <div class="section-heading">
                <p class="eyebrow">Categories</p>
                <h2>カテゴリから探す</h2>
                <p>部位ごとに基準ページをまとめて見渡せる入口です。</p>
            </div>
            <div class="category-overview-grid">
                ${libraryData.sections.map((section) => {
                    const description = CATEGORY_LINKS.find((item) => item.id === section.id)?.description || "関連種目をまとめて確認";
                    return `
                        <a class="category-tile" href="#${section.id}">
                            <span class="category-tile-name">${cleanSectionLabel(section.title)}</span>
                            <span class="category-tile-count">${section.cards.length}種目</span>
                            <span class="category-tile-copy">${description}</span>
                        </a>
                    `;
                }).join("")}
            </div>
        </section>
    `);

    main.prepend(hero);
    hero.after(quickStartSection, postQuickStartAd, categoryOverview);
    initQuickStartSection(quickStartSection, homeEntryRoutes);

    titleHeading.textContent = "エクササイズデータベース";
    titleHeading.id = "database";
    titleHeading.classList.add("section-title--database");

    const homeIntro = htmlToElement(`
        <p class="section-intro">
            部位別の一覧からそのまま各種目ページへ移動できます。
        </p>
    `);
    titleHeading.after(homeIntro);

    libraryData.sections.forEach((section) => {
        section.heading = replaceHeadingTag(section.heading, "h3");
    });

    return decorateLibraryExplorer({
        root: libraryContainer,
        sections: libraryData.sections,
        allCards
    });
}

function enhanceExercisePage(main) {
    document.body.classList.add("exercise-page");

    const containers = Array.from(main.children).filter((child) => child.classList.contains("container"));
    const heroContainer = containers.find((container) => container.querySelector(".main-image-title"));
    const muscleContainer = containers.find((container) => container.querySelector(".muscle-activated-table"));
    const averageContainer = containers.find((container) => container.querySelector(".average-section-table"));
    const standardsContainer = containers.find((container) => container.querySelector('.tabs-container.block[data-tab-group="Standards Exercise"]'));
    const recordContainer = containers.find((container) => containsSectionHeading(container, "世界記録"));
    const aboutContainer = containers.find((container) => container.querySelector("#about-table"));
    const calorieContainer = containers.find((container) => containsSectionHeading(container, "消費カロリー"));
    const libraryContainer = containers.find((container) => container.querySelector("#other-workouts"));
    const adContainers = containers.filter((container) => container.querySelector(".adsbygoogle"));

    if (!heroContainer || !muscleContainer || !averageContainer || !standardsContainer || !libraryContainer) {
        return null;
    }

    const libraryData = collectLibrarySections(libraryContainer);
    const allCards = libraryData.allCards;
    const currentCard = findCurrentCard(allCards);
    const muscles = extractMuscleGroups(muscleContainer.querySelector(".muscle-activated-table"));
    const heroTitle = normalizeText(heroContainer.querySelector("h1")?.textContent || "");
    const heroImage = heroContainer.querySelector("img");
    const sectionLabel = cleanSectionLabel(currentCard?.sectionTitle || "全身トレーニング");
    const sameSectionCards = libraryData.sections.find((section) => section.id === currentCard?.sectionId)?.cards.filter((card) => card.slug !== currentCard?.slug) || [];

    const breadcrumb = buildBreadcrumb([
        { label: "Home", href: "index.html" },
        { label: sectionLabel, href: currentCard?.sectionId ? `index.html#${currentCard.sectionId}` : "index.html#whole-body-section" },
        { label: heroTitle }
    ]);

    const primaryMuscles = muscles.find((item) => item.label.includes("主働"))?.items || [];

    heroContainer.classList.add("hero-band");
    heroContainer.innerHTML = `
        <div class="exercise-hero">
            <div class="exercise-hero-copy">
                <p class="eyebrow">Exercise Database</p>
                <h1>${escapeHtml(heroTitle)}</h1>
                <div class="muscle-chip-row">
                    ${primaryMuscles.map((muscle) => `<span class="muscle-chip">${escapeHtml(muscle)}</span>`).join("")}
                </div>
            </div>
            <div class="exercise-hero-media">
                <img src="${escapeAttribute(heroImage?.getAttribute("src") || "")}" alt="${escapeAttribute(heroImage?.getAttribute("alt") || heroTitle)}" class="workout-main-image">
            </div>
        </div>
    `;

    muscleContainer.id = "muscle-groups";
    muscleContainer.classList.add("section-band");
    muscleContainer.innerHTML = `
        <div class="section-heading">
            <p class="eyebrow">Muscles</p>
            <h2>鍛えられる筋肉</h2>
            <p>主働筋、副働筋、安定筋を分けて確認できます。</p>
        </div>
        <div class="muscle-grid">
            ${muscles.map((group) => {
                return `
                    <article class="muscle-card">
                        <span class="metric-label">${escapeHtml(group.label)}</span>
                        <h3>${escapeHtml(group.items.join(" / "))}</h3>
                    </article>
                `;
            }).join("")}
        </div>
    `;

    decorateDataContainer(averageContainer, "average-data", "Average", "平均重量", "レベル別の1RM目安を先に確認できます。");
    decorateTableShell(averageContainer.querySelector(".average-section-table"));

    decorateDataContainer(standardsContainer, "standards-data", "Standards", "基準重量", "男女と比較軸を切り替えながら基準を確認できます。");
    standardsContainer.querySelectorAll(".table").forEach((table) => decorateTableShell(table, true));
    standardsContainer.querySelectorAll(".tab .section-box").forEach((box) => box.classList.add("table-panel"));

    if (aboutContainer) {
        decorateDataContainer(aboutContainer, "table-guide", "Notes", "基準表の見方", "各レベルの分布とトレーニング継続期間の目安です。");
        decorateTableShell(aboutContainer.querySelector("table"));
    }

    if (recordContainer) {
        recordContainer.classList.add("section-band", "supplementary-band");
        const heading = recordContainer.querySelector(".section-title") || recordContainer.querySelector("h2");
        replaceHeadingTag(heading, "h2");
        const sectionHeading = recordContainer.querySelector("h2");
        if (sectionHeading) {
            sectionHeading.textContent = "世界記録";
        }
    }

    calorieContainer?.remove();

    const relatedContainer = buildRelatedSection(sectionLabel, sameSectionCards);

    const libraryTitle = replaceHeadingTag(libraryContainer.querySelector("#other-workouts"), "h2");
    const searchInput = libraryData.searchInput;

    libraryContainer.classList.add("section-band", "library-band");
    libraryTitle.textContent = "種目ライブラリ";
    libraryTitle.id = "exercise-library";
    libraryTitle.classList.add("section-title--database");

    const existingIntro = libraryContainer.querySelector(".section-intro");
    const libraryIntro = existingIntro || htmlToElement(`
        <p class="section-intro">
            部位別の一覧から他の種目も探せます。
        </p>
    `);

    if (!existingIntro) {
        libraryTitle.after(libraryIntro);
    } else {
        libraryIntro.textContent = "部位別の一覧から他の種目も探せます。";
    }

    if (searchInput) {
        searchInput.id = "database-search";
        searchInput.placeholder = "種目名・部位・器具で検索";
        searchInput.setAttribute("aria-label", "種目ライブラリ検索");
    }

    libraryData.sections.forEach((section) => {
        section.heading = replaceHeadingTag(section.heading, "h3");
    });

    const libraryContext = decorateLibraryExplorer({
        root: libraryContainer,
        searchInput,
        sections: libraryData.sections,
        allCards
    });

    const postStandardsAd = buildStandaloneAdBlock(adContainers[0], "基準表のあと");
    const postRelatedAd = buildStandaloneAdBlock(adContainers[1], "関連種目のあと");
    const preFooterAd = buildStandaloneAdBlock(adContainers[2], "フッター直前");
    const anchorAdPlaceholder = buildAnchorAdPlaceholder();

    adContainers.slice(3).forEach((container) => container.remove());

    const orderedNodes = [
        breadcrumb,
        heroContainer,
        muscleContainer,
        averageContainer,
        recordContainer,
        standardsContainer,
        aboutContainer,
        postStandardsAd,
        relatedContainer,
        postRelatedAd,
        libraryContainer,
        preFooterAd
    ].filter(Boolean);

    orderedNodes.forEach((node) => main.append(node));
    if (anchorAdPlaceholder) {
        document.body.append(anchorAdPlaceholder);
    }

    return libraryContext;
}

function enhanceContentPage(main) {
    document.body.classList.add("content-page");

    const firstContainer = Array.from(main.children).find((child) => child.classList.contains("container"));
    if (!firstContainer) {
        return;
    }

    const heading = firstContainer.querySelector("h1");
    const breadcrumb = buildBreadcrumb([
        { label: "Home", href: "index.html" },
        { label: normalizeText(heading?.textContent || "ページ") }
    ]);

    main.prepend(breadcrumb);
}

function buildHomeEntryRoutes(allCards) {
    return HOME_ENTRY_ROUTES.map((route) => {
        return {
            ...route,
            cards: pickCardsBySlugs(allCards, route.slugs)
        };
    }).filter((route) => route.cards.length);
}

function buildQuickStartSection(routes) {
    const defaultRoute = routes[0];
    if (!defaultRoute) {
        return htmlToElement(`
            <section class="container section-band quick-start-band" id="quick-start"></section>
        `);
    }

    return htmlToElement(`
        <section class="container section-band quick-start-band" id="quick-start">
            <div class="section-heading">
                <p class="eyebrow">Quick Start</p>
                <h2>おすすめの入口</h2>
                <p>迷ったらまずここから。目的別に最初の数ページへすばやく入れます。</p>
            </div>
            <div class="quick-start-switcher" aria-label="おすすめの入口">
                ${routes.map((route, index) => {
                    return `
                        <button type="button" class="quick-start-option${index === 0 ? " is-active" : ""}" data-route-id="${route.id}" aria-pressed="${index === 0 ? "true" : "false"}">
                            <span class="quick-start-option-label">${escapeHtml(route.label)}</span>
                            <strong class="quick-start-option-title">${escapeHtml(route.title)}</strong>
                            <span class="quick-start-option-meta">${route.cards.length}ページ</span>
                        </button>
                    `;
                }).join("")}
            </div>
            <div class="quick-start-copy" data-quick-start-copy>
                <p class="eyebrow">${escapeHtml(defaultRoute.eyebrow)}</p>
                <h3>${escapeHtml(defaultRoute.title)}</h3>
                <p>${escapeHtml(defaultRoute.copy)}</p>
            </div>
            <div class="quick-start-results" data-quick-start-results>
                ${renderExerciseCardGrid(defaultRoute.cards, "exercise-cards-container exercise-cards-container--feature")}
            </div>
        </section>
    `);
}

function initQuickStartSection(section, routes) {
    if (!section || !routes.length) {
        return;
    }

    const copyNode = section.querySelector("[data-quick-start-copy]");
    const resultsNode = section.querySelector("[data-quick-start-results]");
    const buttons = Array.from(section.querySelectorAll(".quick-start-option"));

    function render(routeId) {
        const activeRoute = routes.find((route) => route.id === routeId) || routes[0];

        buttons.forEach((button) => {
            const isActive = button.dataset.routeId === activeRoute.id;
            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-pressed", isActive ? "true" : "false");
        });

        if (copyNode) {
            copyNode.innerHTML = `
                <p class="eyebrow">${escapeHtml(activeRoute.eyebrow)}</p>
                <h3>${escapeHtml(activeRoute.title)}</h3>
                <p>${escapeHtml(activeRoute.copy)}</p>
            `;
        }

        if (resultsNode) {
            resultsNode.innerHTML = renderExerciseCardGrid(activeRoute.cards, "exercise-cards-container exercise-cards-container--feature");
        }
    }

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            render(button.dataset.routeId || routes[0].id);
        });
    });
}

function buildCardBand(eyebrow, title, copy, cards, id = "") {
    return htmlToElement(`
        <section class="container section-band"${id ? ` id="${id}"` : ""}>
            <div class="section-heading">
                <p class="eyebrow">${escapeHtml(eyebrow)}</p>
                <h2>${escapeHtml(title)}</h2>
                <p>${escapeHtml(copy)}</p>
            </div>
            ${renderExerciseCardGrid(cards, "exercise-cards-container exercise-cards-container--feature")}
        </section>
    `);
}

function buildBreadcrumb(items) {
    return htmlToElement(`
        <div class="container breadcrumb-container">
            <nav class="breadcrumb" aria-label="Breadcrumb">
                ${items.map((item, index) => {
                    const label = escapeHtml(item.label);
                    const separator = index < items.length - 1 ? '<span class="breadcrumb-separator">/</span>' : "";
                    if (item.href) {
                        return `<a href="${item.href}">${label}</a>${separator}`;
                    }
                    return `<span>${label}</span>${separator}`;
                }).join("")}
            </nav>
        </div>
    `);
}

function decorateDataContainer(container, id, eyebrow, title, copy) {
    if (!container) {
        return;
    }

    container.id = id;
    container.classList.add("section-band");

    const heading = container.querySelector(".section-title") || container.querySelector("h1") || container.querySelector("h2");
    const normalizedHeading = replaceHeadingTag(heading, "h2");
    normalizedHeading.textContent = title;

    const intro = htmlToElement(`
        <div class="section-heading">
            <p class="eyebrow">${escapeHtml(eyebrow)}</p>
            <h2>${escapeHtml(title)}</h2>
            <p>${escapeHtml(copy)}</p>
        </div>
    `);

    normalizedHeading.replaceWith(intro);
}

function decorateTableShell(table, center = false) {
    if (!table) {
        return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "table-shell";

    if (center) {
        table.classList.add("table--center");
    }

    table.parentNode.insertBefore(wrapper, table);
    wrapper.append(table);
}

function buildStandaloneAdBlock(container, placementLabel) {
    const block = document.createElement("section");
    block.className = "container standalone-ad-band";
    block.dataset.adPlacement = placementLabel;
    block.innerHTML = `
        <div class="ad-placeholder ad-placeholder--standalone">
            <span class="ad-placeholder-label">広告スペース</span>
            <span class="ad-placeholder-note">${escapeHtml(placementLabel)}</span>
        </div>
    `;

    if (container) {
        container.remove();
    }
    return block;
}

function buildAnchorAdPlaceholder() {
    return htmlToElement(`
        <div class="adsense-anchor-slot is-active" aria-hidden="true">
            <div class="ad-placeholder ad-placeholder--anchor">
                <span class="ad-placeholder-label">広告スペース</span>
                <span class="ad-placeholder-note">下部アンカー広告</span>
            </div>
        </div>
    `);
}

function decorateLibraryExplorer({ root, searchInput, sections, allCards, explorerTitle = "", explorerCopy = "" }) {
    root.classList.add("section-band", "library-band");

    sections.forEach((section) => {
        section.heading.id = section.heading.id || section.id;
        section.cardsContainer.classList.add("exercise-cards-container--library");
        section.isExpanded = false;

        if (section.cards.length > LIBRARY_INITIAL_CARD_LIMIT) {
            const toggleRow = htmlToElement(`
                <div class="library-more-row" hidden>
                    <button type="button" class="library-more-button" data-section-toggle="${section.id}"></button>
                </div>
            `);

            section.cardsContainer.after(toggleRow);
            section.toggleRow = toggleRow;
            section.toggleButton = toggleRow.querySelector(".library-more-button");
        }
    });

    const firstSection = sections[0]?.heading;
    const searchWrapper = searchInput?.closest(".search-bar-container");
    const searchAnchor = searchWrapper && root.contains(searchWrapper) ? searchWrapper : null;
    const anchor = searchAnchor || firstSection;

    const toolbar = htmlToElement(`
        <div class="library-toolbar">
            ${explorerTitle ? `<div class="library-copy"><h3>${escapeHtml(explorerTitle)}</h3><p>${escapeHtml(explorerCopy)}</p></div>` : ""}
            <div class="category-chip-row" aria-label="部位で絞り込み">
                <button type="button" class="category-chip is-active" data-section-filter="all" aria-pressed="true">すべて</button>
                ${sections.map((section) => {
                    return `<button type="button" class="category-chip" data-section-filter="${section.id}" aria-pressed="false">${escapeHtml(cleanSectionLabel(section.title))}</button>`;
                }).join("")}
            </div>
            <p class="results-status" aria-live="polite"></p>
        </div>
    `);

    if (anchor) {
        anchor.parentNode.insertBefore(toolbar, anchor);
    } else {
        root.append(toolbar);
    }

    return {
        input: searchInput,
        sections,
        allCards,
        resultsNode: toolbar.querySelector(".results-status"),
        sectionFilterButtons: Array.from(toolbar.querySelectorAll("[data-section-filter]"))
    };
}

function initLibrarySearch(context) {
    if (!context) {
        return;
    }

    let activeSectionFilter = "all";

    activeLibraryController = {
        apply: applyFilter
    };

    context.input?.addEventListener("input", applyFilter);
    context.sectionFilterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            activeSectionFilter = button.dataset.sectionFilter || "all";
            applyFilter();
        });
    });
    context.sections.forEach((section) => {
        section.toggleButton?.addEventListener("click", () => {
            section.isExpanded = !section.isExpanded;
            applyFilter();
        });
    });

    applyFilter();

    function applyFilter() {
        const query = normalizeText(context.input?.value || "").toLowerCase();
        const hasActiveCriteria = Boolean(query || activeSectionFilter !== "all");
        let visibleCount = 0;

        context.sectionFilterButtons.forEach((button) => {
            const isActive = (button.dataset.sectionFilter || "all") === activeSectionFilter;
            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-pressed", isActive ? "true" : "false");
        });

        context.sections.forEach((section) => {
            const matchesSection = activeSectionFilter === "all" || section.id === activeSectionFilter;
            const matchingCards = section.cards.filter((card) => {
                const haystack = buildCardSearchText(card, section);
                const matchesQuery = !query || haystack.includes(query);
                return matchesSection && matchesQuery;
            });
            const visibleCards = hasActiveCriteria || section.isExpanded
                ? matchingCards
                : matchingCards.slice(0, LIBRARY_INITIAL_CARD_LIMIT);
            const visibleSet = new Set(visibleCards);
            const sectionMatches = matchingCards.length;

            section.cards.forEach((card) => {
                card.anchor.style.display = visibleSet.has(card) ? "" : "none";
            });

            section.heading.style.display = sectionMatches ? "" : "none";
            section.cardsContainer.style.display = sectionMatches ? "" : "none";
            if (section.toggleRow) {
                const hasMoreVisibleResults = sectionMatches > visibleCards.length;
                const shouldShowToggle = sectionMatches > 0 && !hasActiveCriteria && hasMoreVisibleResults;
                section.toggleRow.hidden = !shouldShowToggle;
                section.toggleRow.style.display = shouldShowToggle ? "" : "none";
                if (section.toggleButton) {
                    section.toggleButton.textContent = section.isExpanded
                        ? "表示を減らす"
                        : `もっと見る (${sectionMatches - visibleCards.length}件)`;
                }
            }
            visibleCount += sectionMatches;
        });

        if (context.resultsNode) {
            if (!hasActiveCriteria) {
                context.resultsNode.textContent = `${context.allCards.length}種目を掲載`;
            } else if (activeSectionFilter !== "all" && !query) {
                const activeSection = context.sections.find((section) => section.id === activeSectionFilter);
                context.resultsNode.textContent = `${cleanSectionLabel(activeSection?.title || "")}で${visibleCount}件ヒット`;
            } else {
                context.resultsNode.textContent = `${visibleCount}件ヒット`;
            }
        }
    }
}

function buildRelatedSection(sectionLabel, cards) {
    const container = htmlToElement(`
        <section class="container section-band">
            <h2 id="related-exercises" class="section-title section-title--database">関連種目</h2>
            <p class="section-intro">同じ部位の種目だけに絞って並べています。</p>
        </section>
    `);

    container.append(buildSameSectionRelatedMarkup(sectionLabel, cards));
    return container;
}

function buildSameSectionRelatedMarkup(sectionLabel, cards) {
    if (!cards.length) {
        return htmlToElement(`
            <div class="related-cluster-grid">
                <section class="related-cluster">
                    <div class="related-cluster-copy">
                        <h3>${escapeHtml(sectionLabel)}の関連種目</h3>
                        <p>現在表示できる同部位の関連種目はありません。</p>
                    </div>
                </section>
            </div>
        `);
    }

    return htmlToElement(`
        <div class="related-cluster-grid">
            <section class="related-cluster">
                <div class="related-cluster-copy">
                    <h3>${escapeHtml(sectionLabel)}の関連種目</h3>
                    <p>同じ部位の種目だけを並べています。</p>
                </div>
                ${renderExerciseCardGrid(cards.slice(0, 12), "exercise-cards-container exercise-cards-container--compact")}
            </section>
        </div>
    `);
}

function initStandardsTabs() {
    const standardsGroups = document.querySelectorAll('.tabs-container.block[data-tab-group="Standards Exercise"]');

    standardsGroups.forEach((group) => {
        const imageTabs = Array.from(group.querySelectorAll(".image-group li"));
        const categoryTabs = Array.from(group.querySelectorAll(".category-group li"));
        const panels = Array.from(group.querySelectorAll(".tab"));

        if (!imageTabs.length || !categoryTabs.length || !panels.length) {
            return;
        }

        const activate = () => {
            const activeImage = group.querySelector(".image-group li.is-active")?.dataset.tab || imageTabs[0].dataset.tab;
            const activeCategory = group.querySelector(".category-group li.is-active")?.dataset.tab || categoryTabs[0].dataset.tab;
            const activePanelId = `${activeImage}-${activeCategory}`;

            panels.forEach((panel) => {
                panel.classList.toggle("is-active", panel.id === activePanelId);
            });
        };

        bindTabSet(imageTabs, activate);
        bindTabSet(categoryTabs, activate);
        activate();
    });
}

function initHeaderActions() {
    const searchButtons = document.querySelectorAll('[data-action="jump-to-search"]');
    const menuButton = document.querySelector('[data-action="toggle-menu"]');

    searchButtons.forEach((button) => {
        button.addEventListener("click", jumpToSearch);
    });

    menuButton?.addEventListener("click", () => {
        window.toggleMenu();
    });

    document.querySelectorAll(".sub-nav a, .header-links a").forEach((link) => {
        link.addEventListener("click", () => {
            document.body.classList.remove("nav-open");
            syncMenuState();
        });
    });
}

function jumpToSearch() {
    const searchInput = document.getElementById("database-search");

    if (searchInput) {
        searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
        window.setTimeout(() => searchInput.focus(), 250);
        return;
    }

    const target = document.getElementById("exercise-library") || document.getElementById("related-exercises");

    if (!target) {
        window.location.href = "index.html#database";
        return;
    }

    target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function syncMenuState() {
    const button = document.querySelector(".header-menu-button");
    if (!button) {
        return;
    }

    button.setAttribute("aria-expanded", document.body.classList.contains("nav-open") ? "true" : "false");
}

function bindTabSet(tabs, onChange) {
    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            tabs.forEach((item) => item.classList.remove("is-active"));
            tab.classList.add("is-active");
            onChange();
        });
    });
}

function collectLibrarySections(container) {
    const searchInput = container.querySelector(".search-bar-container input");
    const headings = Array.from(container.querySelectorAll(":scope > h2.section-title"));
    const sections = headings.map((heading) => {
        const cardsContainer = heading.nextElementSibling;
        const cards = extractCards(cardsContainer, heading);
        return {
            id: heading.id || slugify(cleanSectionLabel(heading.textContent)),
            title: normalizeText(heading.textContent),
            heading,
            cardsContainer,
            cards
        };
    }).filter((section) => section.cardsContainer && section.cards.length);

    return {
        searchInput,
        sections,
        allCards: sections.flatMap((section) => section.cards)
    };
}

function extractCards(container, heading) {
    if (!container) {
        return [];
    }

    return Array.from(container.querySelectorAll(":scope > a.card-link")).map((anchor) => {
        const name = normalizeText(anchor.querySelector(".name")?.textContent || "");
        const category = normalizeText(anchor.querySelector(".category")?.textContent || "");
        const image = anchor.querySelector("img")?.getAttribute("src") || "";
        return {
            anchor,
            href: anchor.getAttribute("href") || "",
            slug: slugFromHref(anchor.getAttribute("href") || ""),
            name,
            category,
            image,
            sectionId: heading.id || "",
            sectionTitle: normalizeText(heading.textContent)
        };
    });
}

function findCurrentCard(allCards) {
    const slug = slugFromHref(currentPath());
    return allCards.find((card) => card.slug === slug) || allCards[0] || null;
}

function extractMuscleGroups(table) {
    if (!table) {
        return [];
    }

    return Array.from(table.querySelectorAll("tbody tr")).map((row) => {
        const label = normalizeText(row.querySelector("th")?.textContent || "");
        const items = splitList(row.querySelector("td")?.textContent || "");
        return { label, items };
    }).filter((group) => group.label);
}

function pickCardsBySlugs(allCards, slugs) {
    return slugs.map((keyword) => {
        return allCards.find((card) => card.slug.includes(keyword));
    }).filter(Boolean);
}

function buildCardSearchText(card, section) {
    const slugText = card.slug.replace(/-/g, " ");
    return `${card.name} ${card.category} ${section.title} ${slugText}`.toLowerCase();
}

function renderExerciseCardGrid(cards, className = "exercise-cards-container") {
    return `
        <div class="${className}">
            ${cards.map((card) => renderExerciseCard(card)).join("")}
        </div>
    `;
}

function renderExerciseCard(card) {
    return `
        <a class="card-link" href="${escapeAttribute(card.href)}">
            <article class="exercise-card">
                <img src="${escapeAttribute(card.image)}" alt="${escapeAttribute(card.name)}" loading="lazy">
                <div class="exercise-details">
                    <div class="name">${escapeHtml(card.name)}</div>
                    <div class="category">${escapeHtml(card.category || cleanSectionLabel(card.sectionTitle))}</div>
                </div>
            </article>
        </a>
    `;
}

function replaceHeadingTag(heading, nextTag) {
    if (!heading) {
        return null;
    }

    if (heading.tagName.toLowerCase() === nextTag.toLowerCase()) {
        return heading;
    }

    const replacement = document.createElement(nextTag);
    replacement.className = heading.className;
    replacement.innerHTML = heading.innerHTML;

    Array.from(heading.attributes).forEach((attribute) => {
        replacement.setAttribute(attribute.name, attribute.value);
    });

    heading.replaceWith(replacement);
    return replacement;
}

function currentPath() {
    return window.location.pathname.split("/").pop() || "index.html";
}

function getUnitPrefix() {
    return currentPath().startsWith("lb_") ? "lb" : "kg";
}

function exerciseHref(slug) {
    return `${getUnitPrefix()}_${slug}.html`;
}

function slugFromHref(href) {
    return href.split("/").pop().replace(".html", "");
}

function cleanSectionLabel(text) {
    return normalizeText(text).replace("トレーニング", "").replace("トレ", "");
}

function splitList(text) {
    return normalizeText(text).split(/[、,]/).map((item) => item.trim()).filter(Boolean);
}

function normalizeText(text) {
    return (text || "").replace(/\s+/g, " ").trim();
}

function containsSectionHeading(container, keyword) {
    return Array.from(container.querySelectorAll(".section-title, h1, h2")).some((heading) => normalizeText(heading.textContent).includes(keyword));
}

function slugify(text) {
    return text.toLowerCase().replace(/\s+/g, "-");
}

function htmlToElement(markup) {
    const template = document.createElement("template");
    template.innerHTML = markup.trim();
    return template.content.firstElementChild;
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

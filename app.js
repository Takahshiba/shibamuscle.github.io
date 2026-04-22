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
        label: "定番比較",
        eyebrow: "Quick Compare",
        title: "定番の比較スタート",
        copy: "比較されやすい定番種目から、最短でデータを見比べるための入口です。",
        slugs: HOME_FEATURES.popular
    },
    {
        id: "big3",
        label: "Big 3",
        eyebrow: "Performance Baselines",
        title: "Big 3 ベースライン",
        copy: "重量比較の基準として見られやすい3種目を先にまとめています。",
        slugs: HOME_FEATURES.big3
    },
    {
        id: "beginner",
        label: "導入向け",
        eyebrow: "Starter Paths",
        title: "始めやすい比較ルート",
        copy: "まずは扱いやすい種目から見比べたいときのスタート地点です。",
        slugs: HOME_FEATURES.beginner
    }
];

const LIBRARY_INITIAL_CARD_LIMIT = 8;

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
        libraryContext = enhanceContentPage(main);
    }

    initStandardsTabs();
    initHeaderActions();

    if (pageType === "home") {
        initHomeDashboardInteractions();
    }

    window.requestAnimationFrame(() => {
        initializeAds();
    });
});

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

    const languageLinks = [
        { href: localizedDomainHref("https://en.shibamuscle.com"), label: "English", lang: "en" },
        { href: localizedDomainHref("https://shibamuscle.com"), label: "日本語", lang: "ja" },
        { href: localizedDomainHref("https://cn.shibamuscle.com"), label: "中文", lang: "zh" },
        { href: localizedDomainHref("https://ko.shibamuscle.com"), label: "한국어", lang: "ko" }
    ].map((item) => `<a href="${item.href}" data-lang="${item.lang}">${item.label}</a>`).join("");

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
                <div class="footer-languages">${languageLinks}</div>
                <p>© Shiba Muscle</p>
            </div>
        </footer>
    `);
}

function ensureMainShell() {
    const existingMains = Array.from(document.querySelectorAll("main.page-main"));
    if (existingMains.length) {
        const primaryMain = existingMains[0];

        existingMains.slice(1).forEach((extraMain) => {
            Array.from(extraMain.children).forEach((child) => primaryMain.append(child));
            extraMain.remove();
        });

        const nestedMains = Array.from(primaryMain.querySelectorAll("main.page-main"));
        nestedMains.forEach((nestedMain) => {
            Array.from(nestedMain.children).forEach((child) => primaryMain.append(child));
            nestedMain.remove();
        });

        return primaryMain;
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

    const containers = Array.from(main.children).filter((child) => child.classList.contains("container"));
    const libraryContainer = containers.find((child) => child.querySelector("#other-workouts")) || containers[0];
    const adContainers = containers.filter((container) => container.querySelector("ins.adsbygoogle"));
    if (!libraryContainer) {
        return null;
    }

    const titleHeading = replaceHeadingTag(libraryContainer.querySelector(".section-title"), "h2");
    const libraryData = collectLibrarySections(libraryContainer);
    const allCards = libraryData.allCards;
    const homeEntryRoutes = buildHomeEntryRoutes(allCards);
    const popularPreviewCards = homeEntryRoutes[0]?.cards.slice(0, 4) || allCards.slice(0, 4);

    const hero = htmlToElement(`
        <section class="container home-hero" id="database-top">
            <div class="home-hero-layout">
                <div class="home-hero-copy">
                    <p class="eyebrow">Performance Dashboard</p>
                    <h1>ワークアウトデータを、最短で比較する</h1>
                    <p class="hero-description">
                        平均重量、基準重量、対象筋群を、種目ごとにすばやく横断できるフィットネスデータベース。
                    </p>
                    <div class="hero-chip-row" aria-label="クイックアクション">
                        <button type="button" class="hero-action-chip" data-dashboard-route="popular">定番比較</button>
                        <button type="button" class="hero-action-chip" data-dashboard-route="big3">BIG3</button>
                        <button type="button" class="hero-action-chip" data-dashboard-route="beginner">導入向け</button>
                        <a href="#chest-section" class="hero-action-chip">胸</a>
                        <a href="#back-section" class="hero-action-chip">背中</a>
                        <a href="#leg-section" class="hero-action-chip">脚</a>
                    </div>
                    <div class="hero-stat-grid">
                        <div class="summary-card">
                            <span class="metric-label">掲載カテゴリ</span>
                            <strong class="metric-value">${libraryData.sections.length}</strong>
                            <span class="metric-subvalue">主要部位ダッシュボード</span>
                        </div>
                        <div class="summary-card">
                            <span class="metric-label">掲載種目</span>
                            <strong class="metric-value">${allCards.length}</strong>
                            <span class="metric-subvalue">横断比較できる種目数</span>
                        </div>
                        <div class="summary-card">
                            <span class="metric-label">比較モード</span>
                            <strong class="metric-value">kg / lb</strong>
                            <span class="metric-subvalue">全ページで単位切替</span>
                        </div>
                    </div>
                </div>
                <aside class="dashboard-preview">
                    <div class="dashboard-panel">
                        <div class="dashboard-panel-heading">
                            <p class="eyebrow">Snapshot</p>
                            <h2>比較ダッシュボード</h2>
                        </div>
                        <div class="dashboard-panel-grid">
                            <article class="dashboard-mini-card">
                                <span class="metric-label">平均重量</span>
                                <strong class="metric-value">1RM</strong>
                                <span class="metric-subvalue">レベル別の目安を確認</span>
                            </article>
                            <article class="dashboard-mini-card">
                                <span class="metric-label">基準重量</span>
                                <strong class="metric-value">体重 / 年齢</strong>
                                <span class="metric-subvalue">切替タブで詳細比較</span>
                            </article>
                            <article class="dashboard-mini-card">
                                <span class="metric-label">筋群</span>
                                <strong class="metric-value">主働筋</strong>
                                <span class="metric-subvalue">種目ごとの効き方を把握</span>
                            </article>
                            <article class="dashboard-mini-card">
                                <span class="metric-label">比較導線</span>
                                <strong class="metric-value">関連種目</strong>
                                <span class="metric-subvalue">同カテゴリを続けて閲覧</span>
                            </article>
                        </div>
                        <div class="dashboard-spotlight-list">
                            <div class="dashboard-spotlight-heading">
                                <span class="metric-label">今すぐ見比べる</span>
                            </div>
                            ${popularPreviewCards.map((card) => {
                                return `
                                    <a class="dashboard-spotlight-link" href="${escapeAttribute(card.href)}">
                                        <img src="${escapeAttribute(card.image)}" alt="${escapeAttribute(card.name)}" loading="lazy">
                                        <span>
                                            <strong>${escapeHtml(card.name)}</strong>
                                            <small>${escapeHtml(card.category || cleanSectionLabel(card.sectionTitle))}</small>
                                        </span>
                                    </a>
                                `;
                            }).join("")}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    `);

    const quickStartSection = buildQuickStartSection(homeEntryRoutes);
    const postQuickStartAd = prepareAdContainer(adContainers[0], "おすすめ入口のあと");

    const categoryOverview = htmlToElement(`
        <section class="container section-band">
            <div class="section-heading">
                <p class="eyebrow">Category Dashboard</p>
                <h2>部位別ダッシュボード</h2>
                <p>部位ごとの件数、代表種目、比較の切り口をまとめて見渡せる入口です。</p>
            </div>
            <div class="category-overview-grid">
                ${libraryData.sections.map((section) => {
                    const categoryMeta = CATEGORY_LINKS.find((item) => item.id === section.id);
                    const description = categoryMeta?.description || "関連種目をまとめて確認";
                    const sampleNames = section.cards.slice(0, 3).map((card) => card.name).join(" / ");
                    return `
                        <a class="category-tile" href="#${section.id}">
                            <div class="category-tile-header">
                                <span class="category-tile-icon" aria-hidden="true">
                                    <img src="${escapeAttribute(categoryMeta?.icon || "./assets/dumbbell-logo.png")}" alt="">
                                </span>
                                <span class="category-tile-count">${section.cards.length}種目</span>
                            </div>
                            <span class="category-tile-name">${cleanSectionLabel(section.title)}</span>
                            <span class="category-tile-copy">${description}</span>
                            <span class="category-tile-samples">${escapeHtml(sampleNames)}</span>
                        </a>
                    `;
                }).join("")}
            </div>
        </section>
    `);

    main.prepend(hero);
    hero.after(...[quickStartSection, postQuickStartAd, categoryOverview].filter(Boolean));
    initQuickStartSection(quickStartSection, homeEntryRoutes);

    titleHeading.textContent = "全種目ライブラリ";
    titleHeading.id = "database";
    titleHeading.classList.add("section-title--database");

    const homeIntro = htmlToElement(`
        <p class="section-intro">
            部位別のまとまりから、必要な比較ページへそのまま移動できます。
        </p>
    `);
    titleHeading.after(homeIntro);

    libraryData.sections.forEach((section) => {
        section.heading = replaceHeadingTag(section.heading, "h3");
    });

    return decorateLibraryExplorer({
        root: libraryContainer,
        sections: libraryData.sections,
        allCards,
        explorerTitle: "Performance Library",
        explorerCopy: "部位別に、全種目の比較ページを横断できます。"
    });
}

function enhanceExercisePage(main) {
    document.body.classList.add("exercise-page");
    removeStaticBreadcrumbs(main);

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
    const measurementKind = main.dataset.measurementKind || currentCard?.measurementKind || "weight";
    const averageLabel = main.dataset.averageLabel || (measurementKind === "reps" ? "平均レップ数" : "平均重量");
    const standardsLabel = main.dataset.standardsLabel || (measurementKind === "reps" ? "基準レップ数" : "基準重量");
    const sectionId = main.dataset.categoryId || currentCard?.sectionId || "whole-body-section";
    const sectionLabel = main.dataset.categoryLabel || cleanSectionLabel(currentCard?.sectionTitle || "全身");
    const summaryText = main.dataset.summary || currentCard?.description || "";
    const relatedTags = splitPipeList(main.dataset.relatedTags || "");
    const currentSlug = main.dataset.exerciseSlug || currentCard?.slug || "";
    const sameSectionCards = libraryData.sections.find((section) => section.id === sectionId)?.cards.filter((card) => card.slug !== currentSlug) || [];

    const breadcrumb = buildBreadcrumb([
        { label: "Home", href: "index.html" },
        { label: sectionLabel, href: `index.html#${sectionId}` },
        { label: heroTitle }
    ]);

    const primaryMuscles = muscles.find((item) => item.label.includes("主働"))?.items || [];
    const averageHighlights = extractAverageHighlights(averageContainer.querySelector(".average-section-table"));
    const performanceSnapshot = buildExercisePerformanceSnapshot({
        averageHighlights,
        primaryMuscles,
        sectionLabel,
        standardsLabel,
        measurementKind,
        sameSectionCount: sameSectionCards.length + 1
    });

    heroContainer.classList.add("hero-band");
    heroContainer.innerHTML = `
        <div class="exercise-hero">
            <div class="exercise-hero-copy">
                <p class="eyebrow">Performance Dashboard</p>
                <h1>${escapeHtml(heroTitle)}</h1>
                ${summaryText ? `<p class="hero-description">${escapeHtml(summaryText)}</p>` : ""}
                <div class="muscle-chip-row">
                    ${primaryMuscles.map((muscle) => `<span class="muscle-chip">${escapeHtml(muscle)}</span>`).join("")}
                    ${relatedTags.slice(0, 3).map((tag) => `<span class="muscle-chip">${escapeHtml(tag)}</span>`).join("")}
                </div>
                <div class="hero-glance-grid">
                    <article class="hero-glance-card">
                        <span class="metric-label">カテゴリ</span>
                        <strong>${escapeHtml(sectionLabel)}</strong>
                        <span class="metric-subvalue">${measurementKind === "reps" ? "回数ベースの比較ページ" : "重量ベースの比較ページ"}</span>
                    </article>
                    <article class="hero-glance-card">
                        <span class="metric-label">主働筋</span>
                        <strong>${escapeHtml(`${primaryMuscles.length || 0}筋群`)}</strong>
                        <span class="metric-subvalue">${escapeHtml(primaryMuscles.slice(0, 3).join(" / ") || "筋群データを掲載")}</span>
                    </article>
                    <article class="hero-glance-card">
                        <span class="metric-label">比較先</span>
                        <strong>${escapeHtml(`${sameSectionCards.length + 1}種目`)}</strong>
                        <span class="metric-subvalue">同カテゴリの関連比較あり</span>
                    </article>
                </div>
            </div>
            <div class="exercise-hero-media">
                <img src="${escapeAttribute(heroImage?.getAttribute("src") || "")}" alt="${escapeAttribute(heroImage?.getAttribute("alt") || heroTitle)}" class="workout-main-image">
                <p class="exercise-media-caption">${escapeHtml(standardsLabel)}と平均データを同じ流れで確認できます。</p>
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

    decorateDataContainer(
        averageContainer,
        "average-data",
        "Average",
        averageLabel,
        measurementKind === "reps" ? "レベル別の平均レップ数を先に確認できます。" : "レベル別の1RM目安を先に確認できます。"
    );
    decorateTableShell(averageContainer.querySelector(".average-section-table"));

    decorateDataContainer(
        standardsContainer,
        "standards-data",
        "Standards",
        standardsLabel,
        measurementKind === "reps" ? "体重別・年齢別のレップ数基準を切り替えながら確認できます。" : "男女と比較軸を切り替えながら基準を確認できます。"
    );
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

    libraryContainer.classList.add("section-band", "library-band");
    libraryTitle.textContent = "種目ライブラリ";
    libraryTitle.id = "exercise-library";
    libraryTitle.classList.add("section-title--database");

    const existingIntro = libraryContainer.querySelector(".section-intro");
    const libraryIntro = existingIntro || htmlToElement(`
        <p class="section-intro">
            同カテゴリや他部位の種目を見比べながら、次の比較先へ移動できます。
        </p>
    `);

    if (!existingIntro) {
        libraryTitle.after(libraryIntro);
    } else {
        libraryIntro.textContent = "同カテゴリや他部位の種目を見比べながら、次の比較先へ移動できます。";
    }

    libraryData.sections.forEach((section) => {
        section.heading = replaceHeadingTag(section.heading, "h3");
    });

    const libraryContext = decorateLibraryExplorer({
        root: libraryContainer,
        sections: libraryData.sections,
        allCards,
        explorerTitle: "Compare More Exercises",
        explorerCopy: "関連する種目ページへそのまま移動して、比較の流れを広げられます。"
    });

    const postStandardsAd = prepareAdContainer(adContainers[0], "基準表のあと");
    const postRelatedAd = prepareAdContainer(adContainers[1], "関連種目のあと");
    const preFooterAd = prepareAdContainer(adContainers[2], "フッター直前");

    adContainers.slice(3).forEach((container) => container.remove());

    const orderedNodes = [
        breadcrumb,
        heroContainer,
        performanceSnapshot,
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

    return libraryContext;
}

function enhanceContentPage(main) {
    document.body.classList.add("content-page");
    const firstContainer = Array.from(main.children).find((child) => child.classList.contains("container"));
    if (!firstContainer) {
        return null;
    }

    if (!main.querySelector(":scope > .breadcrumb-container")) {
        const heading = firstContainer.querySelector("h1");
        const breadcrumb = buildBreadcrumb([
            { label: "Home", href: "index.html" },
            { label: normalizeText(heading?.textContent || "ページ") }
        ]);

        main.prepend(breadcrumb);
    }

    const libraryContainer = Array.from(main.children).find((child) => child.classList.contains("container") && child.querySelector("#other-workouts"));
    if (!libraryContainer) {
        return null;
    }

    const libraryData = collectLibrarySections(libraryContainer);
    const libraryTitle = replaceHeadingTag(libraryContainer.querySelector("#other-workouts"), "h2");

    libraryContainer.classList.add("section-band", "library-band");
    libraryTitle.classList.add("section-title--database");
    libraryTitle.textContent = libraryTitle.textContent || "データベースから続けて探す";

    libraryData.sections.forEach((section) => {
        section.heading = replaceHeadingTag(section.heading, "h3");
    });

    return decorateLibraryExplorer({
        root: libraryContainer,
        sections: libraryData.sections,
        allCards: libraryData.allCards,
        explorerTitle: "種目ライブラリ",
        explorerCopy: "関連する種目ページへそのまま移動できます。"
    });
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
                <p class="eyebrow">Quick Compare</p>
                <h2>比較スタート</h2>
                <p>迷ったらまずここから。比較されやすいルートを最初にまとめています。</p>
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

function prepareAdContainer(container, placementLabel) {
    if (!container) {
        return null;
    }

    container.classList.add("standalone-ad-band");
    container.dataset.adPlacement = placementLabel;

    container.querySelectorAll("script").forEach((script) => script.remove());

    if (!container.querySelector(".ad-slot-label")) {
        container.prepend(htmlToElement(`
            <p class="ad-slot-label">
                <span>広告</span>
                <span>${escapeHtml(placementLabel)}</span>
            </p>
        `));
    }

    return container;
}

function initializeAds() {
    document.querySelectorAll("ins.adsbygoogle").forEach((slot) => {
        slot.setAttribute("data-ad-client", ADSENSE_CLIENT_ID);

        if (slot.dataset.adsbygoogleStatus) {
            return;
        }

        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (error) {
            // Ignore already-initialized or script-race errors.
        }
    });
}

function decorateLibraryExplorer({ root, sections, allCards, explorerTitle = "", explorerCopy = "" }) {
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
    const anchor = firstSection;

    const toolbar = htmlToElement(`
        <div class="library-toolbar">
            ${explorerTitle ? `<div class="library-copy"><h3>${escapeHtml(explorerTitle)}</h3><p>${escapeHtml(explorerCopy)}</p></div>` : ""}
            <p class="results-status" aria-live="polite">${allCards.length}種目を掲載</p>
        </div>
    `);

    if (anchor) {
        anchor.parentNode.insertBefore(toolbar, anchor);
    } else {
        root.append(toolbar);
    }

    sections.forEach((section) => {
        section.toggleButton?.addEventListener("click", () => {
            section.isExpanded = !section.isExpanded;
            applySectionVisibility(section);
        });
    });

    sections.forEach((section) => applySectionVisibility(section));

    return {
        sections,
        allCards,
        resultsNode: toolbar.querySelector(".results-status")
    };

    function applySectionVisibility(section) {
        const visibleCards = section.isExpanded
            ? section.cards
            : section.cards.slice(0, LIBRARY_INITIAL_CARD_LIMIT);
        const visibleSet = new Set(visibleCards);

        section.cards.forEach((card) => {
            card.anchor.style.display = visibleSet.has(card) ? "" : "none";
        });

        if (section.toggleRow) {
            const remainingCount = section.cards.length - visibleCards.length;
            const shouldShowToggle = remainingCount > 0 || section.isExpanded;
            section.toggleRow.hidden = !shouldShowToggle;
            section.toggleRow.style.display = shouldShowToggle ? "" : "none";
            if (section.toggleButton) {
                section.toggleButton.textContent = section.isExpanded
                    ? "表示を減らす"
                    : `もっと見る (${remainingCount}件)`;
            }
        }
    }
}

function buildRelatedSection(sectionLabel, cards) {
    const container = htmlToElement(`
        <section class="container section-band">
            <h2 id="related-exercises" class="section-title section-title--database">関連種目</h2>
            <p class="section-intro">同じカテゴリの種目を続けて見比べられるように並べています。</p>
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
    const menuButton = document.querySelector('[data-action="toggle-menu"]');

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

function syncMenuState() {
    const button = document.querySelector(".header-menu-button");
    if (!button) {
        return;
    }

    button.setAttribute("aria-expanded", document.body.classList.contains("nav-open") ? "true" : "false");
}

function removeStaticBreadcrumbs(main) {
    main.querySelectorAll(":scope > .breadcrumb-container").forEach((node) => node.remove());
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
        const card = anchor.querySelector(".exercise-card");
        return {
            anchor,
            href: anchor.getAttribute("href") || "",
            slug: slugFromHref(anchor.getAttribute("href") || ""),
            name,
            category,
            image,
            description: normalizeText(card?.dataset.description || ""),
            primaryMuscles: splitPipeList(card?.dataset.primaryMuscles || ""),
            tags: splitPipeList(card?.dataset.tags || ""),
            aliases: splitPipeList(card?.dataset.aliases || ""),
            searchTerms: splitPipeList(card?.dataset.searchTerms || ""),
            measurementKind: card?.dataset.measurementKind || "",
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

function renderExerciseCardGrid(cards, className = "exercise-cards-container") {
    return `
        <div class="${className}">
            ${cards.map((card) => renderExerciseCard(card)).join("")}
        </div>
    `;
}

function renderExerciseCard(card) {
    const badges = buildExerciseCardBadges(card);
    return `
        <a class="card-link" href="${escapeAttribute(card.href)}">
            <article class="exercise-card">
                <img src="${escapeAttribute(card.image)}" alt="${escapeAttribute(card.name)}" loading="lazy">
                <div class="exercise-details">
                    <div class="name">${escapeHtml(card.name)}</div>
                    <div class="category">${escapeHtml(card.category || cleanSectionLabel(card.sectionTitle))}</div>
                    ${badges.length ? `<div class="exercise-badges">${badges.map((badge) => `<span class="exercise-badge">${escapeHtml(badge)}</span>`).join("")}</div>` : ""}
                </div>
            </article>
        </a>
    `;
}

function buildExerciseCardBadges(card) {
    const badges = [];

    if ((card.tags || []).some((tag) => tag.toUpperCase() === "BIG3")) {
        badges.push("BIG3");
    }

    if (card.measurementKind === "reps") {
        badges.push("回数");
    } else if (card.measurementKind === "weight") {
        badges.push("重量");
    }

    if (card.primaryMuscles[0]) {
        badges.push(card.primaryMuscles[0]);
    }

    return badges.slice(0, 3);
}

function initHomeDashboardInteractions() {
    document.querySelectorAll("[data-dashboard-route]").forEach((button) => {
        button.addEventListener("click", () => {
            const routeId = button.dataset.dashboardRoute;
            const quickStartButton = document.querySelector(`.quick-start-option[data-route-id="${routeId}"]`);
            if (quickStartButton instanceof HTMLElement) {
                quickStartButton.click();
                document.getElementById("quick-start")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });
    });
}

function buildExercisePerformanceSnapshot({ averageHighlights, primaryMuscles, sectionLabel, standardsLabel, measurementKind, sameSectionCount }) {
    const baselineLine = averageHighlights.baseline;
    const intermediateLine = averageHighlights.intermediate;

    return htmlToElement(`
        <section class="container section-band performance-snapshot-band">
            <div class="section-heading">
                <p class="eyebrow">Snapshot</p>
                <h2>パフォーマンススナップショット</h2>
                <p>最初に押さえたい基準ラインと比較の切り口を、表より先にまとめています。</p>
            </div>
            <div class="performance-signal-grid">
                ${renderPerformanceSignalCard(
                    baselineLine?.label || "基礎ライン",
                    baselineLine?.primary || "掲載データあり",
                    baselineLine?.secondary || "平均データを掲載",
                    true
                )}
                ${renderPerformanceSignalCard(
                    intermediateLine?.label || "中級ライン",
                    intermediateLine?.primary || standardsLabel,
                    intermediateLine?.secondary || "比較データを掲載"
                )}
                ${renderPerformanceSignalCard(
                    "主働筋",
                    `${primaryMuscles.length || 0}筋群`,
                    primaryMuscles.slice(0, 3).join(" / ") || "主働筋データを掲載"
                )}
                ${renderPerformanceSignalCard(
                    "比較ビュー",
                    `${sameSectionCount}種目`,
                    `${sectionLabel} / ${measurementKind === "reps" ? "回数比較" : "重量比較"}`
                )}
            </div>
        </section>
    `);
}

function renderPerformanceSignalCard(label, value, copy, accent = false) {
    return `
        <article class="performance-signal-card${accent ? " performance-signal-card--accent" : ""}">
            <span class="metric-label">${escapeHtml(label)}</span>
            <strong class="signal-value">${escapeHtml(value)}</strong>
            <span class="signal-subvalue">${escapeHtml(copy)}</span>
        </article>
    `;
}

function extractAverageHighlights(table) {
    const rows = Array.from(table?.querySelectorAll("tbody tr") || []);
    if (!rows.length) {
        return {};
    }

    const parsedRows = rows.map((row) => {
        const cells = Array.from(row.children);
        return {
            label: normalizeText(cells[0]?.textContent || ""),
            primary: formatAverageMetric(cells[1]),
            secondary: formatSecondaryMetric(cells[2])
        };
    });

    return {
        baseline: parsedRows.find((row) => row.label.includes("基礎")) || parsedRows[0],
        intermediate: parsedRows.find((row) => row.label.includes("中級")) || parsedRows[Math.min(2, parsedRows.length - 1)]
    };
}

function formatAverageMetric(cell) {
    const value = normalizeText(cell?.innerText || cell?.textContent || "");
    return value ? `男性 ${value}` : "掲載データあり";
}

function formatSecondaryMetric(cell) {
    const value = normalizeText(cell?.innerText || cell?.textContent || "");
    return value ? `女性 ${value}` : "比較データを掲載";
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

function localizedDomainHref(baseUrl) {
    const path = currentPath();
    if (path === "index.html" || path === "") {
        return `${baseUrl}/`;
    }

    return `${baseUrl}/${path}`;
}

function getUnitPrefix() {
    return currentPath().startsWith("lb_") ? "lb" : "kg";
}

function exerciseHref(slug) {
    return `${getUnitPrefix()}_${slug}.html`;
}

function slugFromHref(href) {
    return href.split("/").pop().replace(".html", "").replace(/^(kg|lb)_/, "");
}

function cleanSectionLabel(text) {
    return normalizeText(text).replace("トレーニング", "").replace("トレ", "");
}

function splitList(text) {
    return normalizeText(text).split(/[、,]/).map((item) => item.trim()).filter(Boolean);
}

function splitPipeList(text) {
    return normalizeText(text).split("|").map((item) => item.trim()).filter(Boolean);
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

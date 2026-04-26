const ADSENSE_CLIENT_ID = "ca-pub-2819086765117537";
const ADSENSE_SCRIPT_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;

const CATEGORY_LINKS = [
    {
        id: "whole-body-section",
        key: "wholeBody",
        icon: "power-clean-white-icon.webp",
        labels: { ja: "全身", ko: "전신", "zh-hant": "全身", es: "Cuerpo completo", fr: "Corps entier", de: "Ganzkörper" },
        descriptions: {
            ja: "デッドリフト、クリーン、スナッチなど全身連動の基準ページ",
            ko: "데드리프트, 클린, 스내치처럼 전신을 함께 쓰는 운동의 기준 페이지",
            "zh-hant": "硬舉、翻站、抓舉等全身協調動作的標準頁面",
            es: "Ejercicios globales como peso muerto, clean y snatch",
            fr: "Exercices globaux comme soulevé de terre, clean et snatch",
            de: "Referenzseiten für Ganzkörperübungen wie Kreuzheben, Clean und Snatch"
        }
    },
    {
        id: "chest-section",
        key: "chest",
        icon: "bench-press-white-icon.webp",
        labels: { ja: "胸", ko: "가슴", "zh-hant": "胸部", es: "Pecho", fr: "Pectoraux", de: "Brust" },
        descriptions: {
            ja: "プレス系の平均重量と押す種目の比較",
            ko: "프레스 계열 평균 중량과 미는 운동 비교",
            "zh-hant": "推類動作的平均重量與訓練標準比較",
            es: "Pesos medios y comparativas de empuje",
            fr: "Charges moyennes et comparaisons des mouvements de poussée",
            de: "Durchschnittsgewichte und Vergleiche für Druckübungen"
        }
    },
    {
        id: "back-section",
        key: "back",
        icon: "deadlift-white-icon.webp",
        labels: { ja: "背中", ko: "등", "zh-hant": "背部", es: "Espalda", fr: "Dos", de: "Rücken" },
        descriptions: {
            ja: "ローイング、プル系、ヒンジ系の比較",
            ko: "로우, 풀, 힌지 계열 운동 비교",
            "zh-hant": "划船、下拉與髖鉸鏈類動作比較",
            es: "Remos, jalones y bisagras de cadera",
            fr: "Rowings, tirages et mouvements de charnière",
            de: "Rudern, Zugübungen und Hüftstreckbewegungen im Vergleich"
        }
    },
    {
        id: "shoulder-section",
        key: "shoulder",
        icon: "shoulder-press-white-icon.webp",
        labels: { ja: "肩", ko: "어깨", "zh-hant": "肩部", es: "Hombros", fr: "Épaules", de: "Schultern" },
        descriptions: {
            ja: "プレス、レイズ、安定性の種目一覧",
            ko: "프레스, 레이즈, 안정성 운동 목록",
            "zh-hant": "肩推、平舉與穩定性訓練動作列表",
            es: "Presses, elevaciones y estabilidad del hombro",
            fr: "Développés, élévations et stabilité des épaules",
            de: "Schulterdrücken, Seitheben und Stabilitätsübungen"
        }
    },
    {
        id: "arm-section",
        key: "arm",
        icon: "hammer-curl-white-icon.webp",
        labels: { ja: "腕", ko: "팔", "zh-hant": "手臂", es: "Brazos", fr: "Bras", de: "Arme" },
        descriptions: {
            ja: "カール、トライセプス、前腕の種目",
            ko: "컬, 삼두, 전완 운동",
            "zh-hant": "彎舉、三頭肌與前臂訓練動作",
            es: "Curls, tríceps y antebrazos",
            fr: "Curls, triceps et avant-bras",
            de: "Curls, Trizeps- und Unterarmübungen"
        }
    },
    {
        id: "leg-section",
        key: "leg",
        icon: "squat-white-icon.webp",
        labels: { ja: "脚", ko: "하체", "zh-hant": "腿部", es: "Piernas", fr: "Jambes", de: "Beine" },
        descriptions: {
            ja: "スクワット、ランジ、ヒップ主導の種目",
            ko: "스쿼트, 런지, 힙 중심 운동",
            "zh-hant": "深蹲、弓箭步與臀腿主導動作",
            es: "Sentadillas, zancadas y ejercicios dominantes de cadera",
            fr: "Squats, fentes et mouvements dominants hanche",
            de: "Kniebeugen, Ausfallschritte und hüftdominante Übungen"
        }
    },
    {
        id: "core-section",
        key: "core",
        icon: "sit-ups-white-icon.webp",
        labels: { ja: "体幹", ko: "코어", "zh-hant": "核心", es: "Core", fr: "Tronc", de: "Rumpf" },
        descriptions: {
            ja: "腹筋、回旋、体幹安定の種目",
            ko: "복근, 회전, 코어 안정화 운동",
            "zh-hant": "腹肌、旋轉與核心穩定訓練動作",
            es: "Abdominales, rotación y estabilidad del core",
            fr: "Abdominaux, rotation et stabilité du tronc",
            de: "Bauchübungen, Rotation und Rumpfstabilität"
        }
    }
];

const HOME_FEATURES = {
    popular: ["deadlift", "bench-press", "squat", "pull-ups", "chin-ups", "hip-thrust"],
    big3: ["deadlift", "bench-press", "squat"],
    beginner: ["bodyweight-squat", "push-ups", "lat-pulldown", "glute-bridge", "dumbbell-row", "bench-dips"]
};

const HOME_ENTRY_ROUTES = [
    {
        id: "popular",
        slugs: HOME_FEATURES.popular,
        locales: {
            ja: {
                label: "定番比較",
                eyebrow: "Quick Compare",
                title: "定番の比較スタート",
                copy: "比較されやすい定番種目から、最短でデータを見比べるための入口です。"
            },
            ko: {
                label: "대표 비교",
                eyebrow: "Quick Compare",
                title: "대표 운동 비교 시작",
                copy: "자주 비교되는 대표 운동부터 가장 빠르게 데이터를 확인할 수 있는 시작점입니다."
            },
            "zh-hant": {
                label: "熱門比較",
                eyebrow: "Quick Compare",
                title: "從熱門動作開始比較",
                copy: "從最常被比較的訓練動作快速進入資料頁，直接查看關鍵數據。"
            },
            "zh-hans": {
                label: "热门比较",
                eyebrow: "快速比较",
                title: "从热门动作开始比较",
                copy: "从最常被比较的训练动作快速进入数据页，直接查看关键数据。"
            },
            es: {
                label: "Comparativas clave",
                eyebrow: "Comparación rápida",
                title: "Empieza con los ejercicios más consultados",
                copy: "Un acceso directo a los ejercicios que más se comparan para revisar datos sin rodeos."
            },
            fr: {
                label: "Comparatifs clés",
                eyebrow: "Comparaison rapide",
                title: "Commence par les exercices les plus consultés",
                copy: "Un accès direct aux exercices souvent comparés pour vérifier les données sans détour."
            },
            de: {
                label: "Beliebte Vergleiche",
                eyebrow: "Schnellvergleich",
                title: "Mit häufig gesuchten Übungen starten",
                copy: "Ein direkter Einstieg zu den Übungen, die im Krafttraining am häufigsten verglichen werden."
            }
        }
    },
    {
        id: "big3",
        slugs: HOME_FEATURES.big3,
        locales: {
            ja: {
                label: "Big 3",
                eyebrow: "Performance Baselines",
                title: "Big 3 ベースライン",
                copy: "重量比較の基準として見られやすい3種目を先にまとめています。"
            },
            ko: {
                label: "Big 3",
                eyebrow: "Performance Baselines",
                title: "Big 3 기준",
                copy: "중량 비교의 기준으로 자주 보는 세 가지 운동을 먼저 모았습니다."
            },
            "zh-hant": {
                label: "Big 3",
                eyebrow: "Performance Baselines",
                title: "Big 3 基準",
                copy: "先整理最常作為力量比較基準的三個主要訓練動作。"
            },
            "zh-hans": {
                label: "Big 3",
                eyebrow: "表现基准",
                title: "Big 3 基准",
                copy: "先整理最常作为力量比较基准的三个主要训练动作。"
            },
            es: {
                label: "Big 3",
                eyebrow: "Referencias de fuerza",
                title: "Base del Big 3",
                copy: "Los tres levantamientos más usados como referencia para comparar fuerza."
            },
            fr: {
                label: "Big 3",
                eyebrow: "Repères de force",
                title: "Base du Big 3",
                copy: "Les trois mouvements les plus utilisés comme repères pour comparer la force."
            },
            de: {
                label: "Big 3",
                eyebrow: "Kraftstandards",
                title: "Big-3-Basis",
                copy: "Die drei klassischen Grundübungen als schnelle Orientierung für Kraftwerte."
            }
        }
    },
    {
        id: "beginner",
        slugs: HOME_FEATURES.beginner,
        locales: {
            ja: {
                label: "導入向け",
                eyebrow: "Starter Paths",
                title: "始めやすい比較ルート",
                copy: "まずは扱いやすい種目から見比べたいときのスタート地点です。"
            },
            ko: {
                label: "입문용",
                eyebrow: "Starter Paths",
                title: "시작하기 쉬운 비교 루트",
                copy: "먼저 다루기 쉬운 운동부터 비교하고 싶을 때의 출발점입니다."
            },
            "zh-hant": {
                label: "入門路線",
                eyebrow: "Starter Paths",
                title: "好上手的比較起點",
                copy: "想先從容易安排進訓練的動作開始比較時，可以從這裡進入。"
            },
            "zh-hans": {
                label: "入门路线",
                eyebrow: "入门路径",
                title: "好上手的比较起点",
                copy: "想先从容易安排进训练的动作开始比较时，可以从这里进入。"
            },
            es: {
                label: "Para empezar",
                eyebrow: "Rutas iniciales",
                title: "Comparativas fáciles para arrancar",
                copy: "Un punto de partida cuando quieres revisar ejercicios accesibles antes de profundizar."
            },
            fr: {
                label: "Pour commencer",
                eyebrow: "Parcours débutant",
                title: "Comparatifs faciles pour démarrer",
                copy: "Un point de départ pour explorer des exercices accessibles avant d'aller plus loin."
            },
            de: {
                label: "Einstieg",
                eyebrow: "Startpunkte",
                title: "Leichte Vergleiche für den Anfang",
                copy: "Ein guter Start, wenn du zuerst gut zugängliche Übungen vergleichen möchtest."
            }
        }
    }
];

const UI_TEXT = {
    ja: {
        ad: "広告",
        adAfterQuickStart: "おすすめ入口のあと",
        adBeforeFooter: "フッター直前",
        adAfterRelated: "関連種目のあと",
        adAfterStandards: "基準表のあと",
        average: "平均重量",
        averageEyebrow: "Average",
        averageReps: "平均レップ数",
        breadcrumb: "Breadcrumb",
        category: "カテゴリ",
        categoryDashboard: "部位別ダッシュボード",
        categoryDashboardCopy: "部位ごとの件数、代表種目、比較の切り口をまとめて見渡せる入口です。",
        categoryDashboardEyebrow: "Category Dashboard",
        compareDestination: "比較先",
        compareFlow: "比較導線",
        compareMode: "比較モード",
        contentLibraryCopy: "関連する種目ページへそのまま移動できます。",
        contentLibraryTitle: "種目ライブラリ",
        dataAvailable: "掲載データあり",
        databaseLibraryTitle: "全種目ライブラリ",
        databaseLibraryIntro: "部位別のまとまりから、必要な比較ページへそのまま移動できます。",
        detailByTabs: "切替タブで詳細比較",
        exerciseLibraryTitle: "種目ライブラリ",
        exercisesListed: (count) => `${count}種目を掲載`,
        female: "女性",
        home: "Home",
        homeHeroActionLabel: "クイックアクション",
        homeHeroDescription: "平均重量、基準重量、対象筋群を、種目ごとにすばやく横断できるフィットネスデータベース。",
        homeHeroTitle: "ワークアウトデータを、最短で比較する",
        languageEnglish: "English",
        languageJapanese: "日本語",
        languageKorean: "한국어",
        languageChinese: "繁體中文",
        languageSpanish: "Español",
        languageFrench: "Français",
        languageGerman: "Deutsch",
        levelAverageAvailable: "平均データを掲載",
        libraryExplorerCopy: "部位別に、全種目の比較ページを横断できます。",
        libraryExplorerTitle: "Performance Library",
        libraryMore: (count) => `もっと見る (${count}件)`,
        libraryLess: "表示を減らす",
        majorCategoryDashboard: "主要部位ダッシュボード",
        male: "男性",
        muscleGroups: "筋群",
        muscles: "筋群",
        musclesCopy: "主働筋、副働筋、安定筋を分けて確認できます。",
        musclesEyebrow: "Muscles",
        musclesHeading: "鍛えられる筋肉",
        page: "ページ",
        pages: (count) => `${count}ページ`,
        performanceDashboard: "Performance Dashboard",
        performanceLibraryCount: "掲載種目",
        performanceSnapshot: "パフォーマンススナップショット",
        performanceSnapshotCopy: "最初に押さえたい基準ラインと比較の切り口を、表より先にまとめています。",
        primaryMuscle: "主働筋",
        primaryMuscleFallback: "主働筋データを掲載",
        quickCompare: "Quick Compare",
        quickStart: "比較スタート",
        quickStartCopy: "迷ったらまずここから。比較されやすいルートを最初にまとめています。",
        quickStartLabel: "おすすめの入口",
        relatedExercises: "関連種目",
        relatedExercisesCopy: "同じカテゴリの種目を続けて見比べられるように並べています。",
        relatedExplorerCopy: "関連する種目ページへそのまま移動して、比較の流れを広げられます。",
        relatedExplorerTitle: "Compare More Exercises",
        relatedNone: "現在表示できる同部位の関連種目はありません。",
        relatedSameCategory: "同じ部位の種目だけを並べています。",
        reps: "回数",
        repsComparison: "回数比較",
        repsPage: "回数ベースの比較ページ",
        resultsAvailable: "比較データを掲載",
        snapshot: "Snapshot",
        snapshotDashboard: "比較ダッシュボード",
        standards: "基準重量",
        standardsEyebrow: "Standards",
        standardsReps: "基準レップ数",
        standardsWeightCopy: "男女と比較軸を切り替えながら基準を確認できます。",
        standardsRepsCopy: "体重別・年齢別のレップ数基準を切り替えながら確認できます。",
        support: "サポート",
        contact: "お問い合わせ",
        privacy: "プライバシーポリシー",
        tableGuide: "基準表の見方",
        tableGuideCopy: "各レベルの分布とトレーニング継続期間の目安です。",
        tableGuideEyebrow: "Notes",
        totalCategories: "掲載カテゴリ",
        totalExercisesCopy: "横断比較できる種目数",
        unitSwitchCopy: "全ページで単位切替",
        viewRelatedCategories: "同カテゴリの関連比較あり",
        weight: "重量",
        weightComparison: "重量比較",
        weightPage: "重量ベースの比較ページ",
        worldRecord: "世界記録"
    },
    ko: {
        ad: "광고",
        adAfterQuickStart: "추천 시작점 뒤",
        adBeforeFooter: "푸터 직전",
        adAfterRelated: "관련 운동 뒤",
        adAfterStandards: "기준표 뒤",
        average: "평균 중량",
        averageEyebrow: "Average",
        averageReps: "평균 반복 횟수",
        breadcrumb: "이동 경로",
        category: "카테고리",
        categoryDashboard: "부위별 대시보드",
        categoryDashboardCopy: "부위별 운동 수, 대표 운동, 비교 기준을 한눈에 볼 수 있는 시작점입니다.",
        categoryDashboardEyebrow: "Category Dashboard",
        compareDestination: "비교 대상",
        compareFlow: "비교 동선",
        compareMode: "비교 모드",
        contentLibraryCopy: "관련 운동 페이지로 바로 이동할 수 있습니다.",
        contentLibraryTitle: "운동 라이브러리",
        dataAvailable: "데이터 있음",
        databaseLibraryTitle: "전체 운동 라이브러리",
        databaseLibraryIntro: "부위별 묶음에서 필요한 비교 페이지로 바로 이동할 수 있습니다.",
        detailByTabs: "탭을 바꿔 상세 비교",
        exerciseLibraryTitle: "운동 라이브러리",
        exercisesListed: (count) => `운동 ${count}개 수록`,
        female: "여성",
        home: "홈",
        homeHeroActionLabel: "빠른 작업",
        homeHeroDescription: "평균 중량, 기준 중량, 대상 근육을 운동별로 빠르게 비교할 수 있는 피트니스 데이터베이스입니다.",
        homeHeroTitle: "운동 데이터를 빠르게 비교하기",
        languageEnglish: "English",
        languageJapanese: "日本語",
        languageKorean: "한국어",
        languageChinese: "繁體中文",
        languageSpanish: "Español",
        languageFrench: "Français",
        languageGerman: "Deutsch",
        levelAverageAvailable: "평균 데이터 수록",
        libraryExplorerCopy: "부위별로 모든 운동 비교 페이지를 둘러볼 수 있습니다.",
        libraryExplorerTitle: "Performance Library",
        libraryMore: (count) => `더 보기 (${count}개)`,
        libraryLess: "접기",
        majorCategoryDashboard: "주요 부위 대시보드",
        male: "남성",
        muscleGroups: "근육",
        muscles: "근육",
        musclesCopy: "주동근, 보조근, 안정근을 나누어 확인할 수 있습니다.",
        musclesEyebrow: "Muscles",
        musclesHeading: "자극되는 근육",
        page: "페이지",
        pages: (count) => `${count}페이지`,
        performanceDashboard: "Performance Dashboard",
        performanceLibraryCount: "수록 운동",
        performanceSnapshot: "퍼포먼스 스냅샷",
        performanceSnapshotCopy: "표를 보기 전에 먼저 확인할 기준선과 비교 포인트를 정리했습니다.",
        primaryMuscle: "주동근",
        primaryMuscleFallback: "주동근 데이터 수록",
        quickCompare: "Quick Compare",
        quickStart: "비교 시작",
        quickStartCopy: "어디서 시작할지 고민된다면 여기부터 보세요. 자주 비교되는 루트를 먼저 모았습니다.",
        quickStartLabel: "추천 시작점",
        relatedExercises: "관련 운동",
        relatedExercisesCopy: "같은 카테고리의 운동을 이어서 비교할 수 있도록 정리했습니다.",
        relatedExplorerCopy: "관련 운동 페이지로 바로 이동해 비교 흐름을 이어갈 수 있습니다.",
        relatedExplorerTitle: "Compare More Exercises",
        relatedNone: "현재 표시할 수 있는 같은 부위의 관련 운동이 없습니다.",
        relatedSameCategory: "같은 부위의 운동만 모았습니다.",
        reps: "반복",
        repsComparison: "반복 비교",
        repsPage: "반복 횟수 기준 비교 페이지",
        resultsAvailable: "비교 데이터 수록",
        snapshot: "Snapshot",
        snapshotDashboard: "비교 대시보드",
        standards: "기준 중량",
        standardsEyebrow: "Standards",
        standardsReps: "기준 반복 횟수",
        standardsWeightCopy: "성별과 비교 기준을 바꿔가며 기준을 확인할 수 있습니다.",
        standardsRepsCopy: "체중별, 나이별 반복 횟수 기준을 탭으로 전환해 확인할 수 있습니다.",
        support: "지원",
        contact: "문의하기",
        privacy: "개인정보 처리방침",
        tableGuide: "기준표 보는 법",
        tableGuideCopy: "각 레벨의 분포와 운동 지속 기간의 기준입니다.",
        tableGuideEyebrow: "Notes",
        totalCategories: "수록 카테고리",
        totalExercisesCopy: "비교 가능한 운동 수",
        unitSwitchCopy: "모든 페이지에서 단위 전환",
        viewRelatedCategories: "같은 카테고리 관련 비교 있음",
        weight: "중량",
        weightComparison: "중량 비교",
        weightPage: "중량 기준 비교 페이지",
        worldRecord: "세계 기록"
    },
    "zh-hant": {
        ad: "廣告",
        adAfterQuickStart: "推薦入口之後",
        adBeforeFooter: "頁尾之前",
        adAfterRelated: "相關動作之後",
        adAfterStandards: "標準表之後",
        average: "平均重量",
        averageEyebrow: "Average",
        averageReps: "平均次數",
        breadcrumb: "導覽路徑",
        category: "分類",
        categoryDashboard: "部位分類總覽",
        categoryDashboardCopy: "可快速查看各部位的動作數量、代表動作與比較方向。",
        categoryDashboardEyebrow: "Category Dashboard",
        compareDestination: "比較方向",
        compareFlow: "比較動線",
        compareMode: "比較模式",
        contentLibraryCopy: "可直接前往相關訓練動作頁面。",
        contentLibraryTitle: "動作資料庫",
        dataAvailable: "已有資料",
        databaseLibraryTitle: "全動作資料庫",
        databaseLibraryIntro: "從部位分類進入，直接前往需要的訓練比較頁面。",
        detailByTabs: "使用分頁切換詳細比較",
        exerciseLibraryTitle: "動作資料庫",
        exercisesListed: (count) => `收錄 ${count} 個動作`,
        female: "女性",
        home: "首頁",
        homeHeroActionLabel: "快速操作",
        homeHeroDescription: "可依訓練動作快速比較平均重量、力量標準與目標肌群的重量訓練資料庫。",
        homeHeroTitle: "更快比較訓練數據",
        languageEnglish: "English",
        languageJapanese: "日本語",
        languageKorean: "한국어",
        languageChinese: "繁體中文",
        languageSpanish: "Español",
        languageFrench: "Français",
        levelAverageAvailable: "收錄平均資料",
        libraryExplorerCopy: "依部位瀏覽所有訓練動作的比較頁面。",
        libraryExplorerTitle: "Performance Library",
        libraryMore: (count) => `查看更多 (${count})`,
        libraryLess: "收合",
        majorCategoryDashboard: "主要部位總覽",
        male: "男性",
        muscleGroups: "肌群",
        muscles: "肌群",
        musclesCopy: "可分別查看主動肌、輔助肌群與穩定肌群。",
        musclesEyebrow: "Muscles",
        musclesHeading: "目標肌群",
        page: "頁面",
        pages: (count) => `${count} 個頁面`,
        performanceDashboard: "Performance Dashboard",
        performanceLibraryCount: "收錄動作",
        performanceSnapshot: "表現摘要",
        performanceSnapshotCopy: "在查看表格前，先整理最重要的基準線與比較重點。",
        primaryMuscle: "主動肌",
        primaryMuscleFallback: "收錄主動肌資料",
        quickCompare: "Quick Compare",
        quickStart: "開始比較",
        quickStartCopy: "不知道從哪裡開始時，可以先看這些最常被比較的路線。",
        quickStartLabel: "推薦入口",
        relatedExercises: "相關動作",
        relatedExercisesCopy: "整理同分類動作，方便連續比較。",
        relatedExplorerCopy: "直接前往相關訓練動作頁面，延伸比較流程。",
        relatedExplorerTitle: "Compare More Exercises",
        relatedNone: "目前沒有可顯示的同部位相關動作。",
        relatedSameCategory: "僅列出同部位的訓練動作。",
        reps: "次數",
        repsComparison: "次數比較",
        repsPage: "次數基準比較頁",
        resultsAvailable: "收錄比較資料",
        snapshot: "Snapshot",
        snapshotDashboard: "比較總覽",
        standards: "力量標準",
        standardsEyebrow: "Standards",
        standardsReps: "標準次數",
        standardsWeightCopy: "可切換性別與比較軸查看標準。",
        standardsRepsCopy: "可切換體重別與年齡別分頁查看次數標準。",
        support: "支援",
        contact: "聯絡我們",
        privacy: "隱私權政策",
        tableGuide: "標準表說明",
        tableGuideCopy: "各等級的分布與訓練年資參考。",
        tableGuideEyebrow: "Notes",
        totalCategories: "收錄分類",
        totalExercisesCopy: "可橫向比較的動作數",
        unitSwitchCopy: "所有頁面支援單位切換",
        viewRelatedCategories: "同分類相關比較",
        weight: "重量",
        weightComparison: "重量比較",
        weightPage: "重量基準比較頁",
        worldRecord: "世界紀錄"
    },
    es: {
        ad: "Anuncio",
        adAfterQuickStart: "Después de accesos recomendados",
        adBeforeFooter: "Antes del pie",
        adAfterRelated: "Después de ejercicios relacionados",
        adAfterStandards: "Después de estándares",
        average: "Peso medio",
        averageEyebrow: "Promedio",
        averageReps: "Repeticiones medias",
        breadcrumb: "Ruta de navegación",
        category: "Categoría",
        categoryDashboard: "Panel por zonas",
        categoryDashboardCopy: "Una entrada para revisar cantidad de ejercicios, movimientos destacados y criterios de comparación por zona.",
        categoryDashboardEyebrow: "Panel por categoría",
        compareDestination: "Comparar con",
        compareFlow: "Flujo de comparación",
        compareMode: "Modo de comparación",
        contentLibraryCopy: "Puedes ir directamente a páginas de ejercicios relacionados.",
        contentLibraryTitle: "Biblioteca de ejercicios",
        dataAvailable: "Datos disponibles",
        databaseLibraryTitle: "Biblioteca completa de ejercicios",
        databaseLibraryIntro: "Entra por grupos musculares y pasa directamente a la página de comparación que necesitas.",
        detailByTabs: "Comparación detallada con pestañas",
        exerciseLibraryTitle: "Biblioteca de ejercicios",
        exercisesListed: (count) => `${count} ejercicios publicados`,
        female: "Mujeres",
        home: "Inicio",
        homeHeroActionLabel: "Acciones rápidas",
        homeHeroDescription: "Base de datos fitness para comparar rápidamente peso medio, estándares de fuerza y músculos trabajados por ejercicio.",
        homeHeroTitle: "Compara datos de entrenamiento en menos pasos",
        languageEnglish: "English",
        languageJapanese: "日本語",
        languageKorean: "한국어",
        languageChinese: "繁體中文",
        languageSpanish: "Español",
        languageFrench: "Français",
        languageGerman: "Deutsch",
        levelAverageAvailable: "Datos medios publicados",
        libraryExplorerCopy: "Explora páginas de comparación de todos los ejercicios por zona.",
        libraryExplorerTitle: "Biblioteca de rendimiento",
        libraryMore: (count) => `Ver más (${count})`,
        libraryLess: "Ver menos",
        majorCategoryDashboard: "Panel de zonas principales",
        male: "Hombres",
        muscleGroups: "Músculos",
        muscles: "Músculos",
        musclesCopy: "Revisa músculos principales, secundarios y estabilizadores por separado.",
        musclesEyebrow: "Músculos",
        musclesHeading: "Músculos trabajados",
        page: "Página",
        pages: (count) => `${count} páginas`,
        performanceDashboard: "Panel de rendimiento",
        performanceLibraryCount: "Ejercicios publicados",
        performanceSnapshot: "Resumen de rendimiento",
        performanceSnapshotCopy: "Las referencias y puntos de comparación clave aparecen antes de la tabla.",
        primaryMuscle: "Músculo principal",
        primaryMuscleFallback: "Datos de músculos principales publicados",
        quickCompare: "Comparación rápida",
        quickStart: "Empieza a comparar",
        quickStartCopy: "Si no sabes por dónde empezar, prueba estas rutas con ejercicios que se consultan a menudo.",
        quickStartLabel: "Accesos recomendados",
        relatedExercises: "Ejercicios relacionados",
        relatedExercisesCopy: "Organizados para seguir comparando ejercicios de la misma categoría.",
        relatedExplorerCopy: "Pasa directamente a ejercicios relacionados y amplía la comparación.",
        relatedExplorerTitle: "Comparar más ejercicios",
        relatedNone: "No hay ejercicios relacionados de la misma zona para mostrar ahora.",
        relatedSameCategory: "Solo ejercicios de la misma zona.",
        reps: "Reps",
        repsComparison: "Comparativa de repeticiones",
        repsPage: "Página basada en repeticiones",
        resultsAvailable: "Datos de comparación publicados",
        snapshot: "Resumen",
        snapshotDashboard: "Panel de comparación",
        standards: "Estándares de fuerza",
        standardsEyebrow: "Estándares",
        standardsReps: "Estándares de repeticiones",
        standardsWeightCopy: "Cambia entre sexo y criterio de comparación para revisar los estándares.",
        standardsRepsCopy: "Consulta estándares de repeticiones por peso corporal y edad mediante pestañas.",
        support: "Soporte",
        contact: "Contacto",
        privacy: "Política de privacidad",
        tableGuide: "Cómo leer la tabla",
        tableGuideCopy: "Referencia de distribución y tiempo de entrenamiento para cada nivel.",
        tableGuideEyebrow: "Notas",
        totalCategories: "Categorías publicadas",
        totalExercisesCopy: "Ejercicios comparables",
        unitSwitchCopy: "Cambio de unidades en todas las páginas",
        viewRelatedCategories: "Comparativas relacionadas de la misma categoría",
        weight: "Peso",
        weightComparison: "Comparativa de peso",
        weightPage: "Página basada en peso",
        worldRecord: "Récord mundial"
    },
    fr: {
        ad: "Annonce",
        adAfterQuickStart: "Après les accès recommandés",
        adBeforeFooter: "Avant le pied de page",
        adAfterRelated: "Après les exercices liés",
        adAfterStandards: "Après les standards",
        average: "Charge moyenne",
        averageEyebrow: "Moyenne",
        averageReps: "Répétitions moyennes",
        breadcrumb: "Fil d'Ariane",
        category: "Catégorie",
        categoryDashboard: "Tableau par groupes musculaires",
        categoryDashboardCopy: "Une entrée pour voir le nombre d'exercices, les mouvements clés et les angles de comparaison par zone.",
        categoryDashboardEyebrow: "Tableau des catégories",
        compareDestination: "Comparer avec",
        compareFlow: "Parcours de comparaison",
        compareMode: "Mode de comparaison",
        contentLibraryCopy: "Accède directement aux pages d'exercices liés.",
        contentLibraryTitle: "Bibliothèque d'exercices",
        dataAvailable: "Données disponibles",
        databaseLibraryTitle: "Bibliothèque complète d'exercices",
        databaseLibraryIntro: "Entre par groupe musculaire et rejoins directement la page de comparaison utile.",
        detailByTabs: "Comparaison détaillée par onglets",
        exerciseLibraryTitle: "Bibliothèque d'exercices",
        exercisesListed: (count) => `${count} exercices publiés`,
        female: "Femmes",
        home: "Accueil",
        homeHeroActionLabel: "Actions rapides",
        homeHeroDescription: "Base de données fitness pour comparer rapidement charge moyenne, standards de force et muscles ciblés par exercice.",
        homeHeroTitle: "Compare les données d'entraînement en moins d'étapes",
        languageEnglish: "English",
        languageJapanese: "日本語",
        languageKorean: "한국어",
        languageChinese: "中文",
        languageSpanish: "Español",
        languageFrench: "Français",
        languageGerman: "Deutsch",
        levelAverageAvailable: "Données moyennes disponibles",
        libraryExplorerCopy: "Parcours les pages de comparaison de tous les exercices par zone.",
        libraryExplorerTitle: "Bibliothèque de performance",
        libraryMore: (count) => `Voir plus (${count})`,
        libraryLess: "Voir moins",
        majorCategoryDashboard: "Tableau des zones principales",
        male: "Hommes",
        muscleGroups: "Muscles",
        muscles: "Muscles",
        musclesCopy: "Consulte les muscles principaux, secondaires et stabilisateurs séparément.",
        musclesEyebrow: "Muscles",
        musclesHeading: "Muscles ciblés",
        page: "Page",
        pages: (count) => `${count} pages`,
        performanceDashboard: "Tableau de performance",
        performanceLibraryCount: "Exercices publiés",
        performanceSnapshot: "Résumé de performance",
        performanceSnapshotCopy: "Les repères et points de comparaison clés apparaissent avant le tableau.",
        primaryMuscle: "Muscle principal",
        primaryMuscleFallback: "Données de muscles principaux disponibles",
        quickCompare: "Comparaison rapide",
        quickStart: "Commencer à comparer",
        quickStartCopy: "Si tu ne sais pas par où commencer, essaie ces parcours avec des exercices souvent consultés.",
        quickStartLabel: "Accès recommandés",
        relatedExercises: "Exercices liés",
        relatedExercisesCopy: "Organisés pour continuer à comparer des exercices de la même catégorie.",
        relatedExplorerCopy: "Passe directement aux exercices liés et élargis la comparaison.",
        relatedExplorerTitle: "Comparer plus d'exercices",
        relatedNone: "Aucun exercice lié de la même zone n'est disponible pour le moment.",
        relatedSameCategory: "Uniquement des exercices de la même zone.",
        reps: "Répétitions",
        repsComparison: "Comparatif de répétitions",
        repsPage: "Page basée sur les répétitions",
        resultsAvailable: "Données de comparaison disponibles",
        snapshot: "Résumé",
        snapshotDashboard: "Tableau de comparaison",
        standards: "Standards de force",
        standardsEyebrow: "Standards",
        standardsReps: "Standards de répétitions",
        standardsWeightCopy: "Change de sexe et de critère de comparaison pour consulter les standards.",
        standardsRepsCopy: "Consulte les standards de répétitions par poids de corps et âge avec les onglets.",
        support: "Support",
        contact: "Contact",
        privacy: "Politique de confidentialité",
        tableGuide: "Comment lire le tableau",
        tableGuideCopy: "Repères de répartition et de durée d'entraînement pour chaque niveau.",
        tableGuideEyebrow: "Notes",
        totalCategories: "Catégories publiées",
        totalExercisesCopy: "Exercices comparables",
        unitSwitchCopy: "Changement d'unité sur toutes les pages",
        viewRelatedCategories: "Comparatifs liés de la même catégorie",
        weight: "Charge",
        weightComparison: "Comparatif de charge",
        weightPage: "Page basée sur la charge",
        worldRecord: "Record du monde"
    },
    de: {
        ad: "Anzeige",
        adAfterQuickStart: "Nach den empfohlenen Einstiegen",
        adBeforeFooter: "Vor dem Footer",
        adAfterRelated: "Nach den verwandten Übungen",
        adAfterStandards: "Nach den Kraftstandards",
        average: "Durchschnittsgewicht",
        averageEyebrow: "Durchschnitt",
        averageReps: "Durchschnittliche Wiederholungen",
        breadcrumb: "Breadcrumb",
        category: "Kategorie",
        categoryDashboard: "Bereiche im Überblick",
        categoryDashboardCopy: "Ein Einstieg, um Übungsanzahl, wichtige Bewegungen und Vergleichswerte pro Muskelbereich schnell zu erfassen.",
        categoryDashboardEyebrow: "Kategorieübersicht",
        compareDestination: "Vergleichen mit",
        compareFlow: "Vergleichsfluss",
        compareMode: "Vergleichsmodus",
        contentLibraryCopy: "Du kannst direkt zu verwandten Übungsseiten springen.",
        contentLibraryTitle: "Übungsbibliothek",
        dataAvailable: "Daten verfügbar",
        databaseLibraryTitle: "Komplette Übungsbibliothek",
        databaseLibraryIntro: "Steige über Muskelgruppen ein und öffne direkt die passende Vergleichsseite.",
        detailByTabs: "Detailvergleich über Tabs",
        exerciseLibraryTitle: "Übungsbibliothek",
        exercisesListed: (count) => `${count} Übungen veröffentlicht`,
        female: "Frauen",
        home: "Startseite",
        homeHeroActionLabel: "Schnellaktionen",
        homeHeroDescription: "Fitness-Datenbank zum schnellen Vergleich von Durchschnittsgewicht, Kraftstandards und Zielmuskulatur pro Übung.",
        homeHeroTitle: "Trainingsdaten schneller vergleichen",
        languageEnglish: "English",
        languageJapanese: "日本語",
        languageKorean: "한국어",
        languageChinese: "繁體中文",
        languageSpanish: "Español",
        languageGerman: "Deutsch",
        levelAverageAvailable: "Durchschnittswerte veröffentlicht",
        libraryExplorerCopy: "Durchsuche Vergleichsseiten für alle Übungen nach Muskelbereich.",
        libraryExplorerTitle: "Leistungsbibliothek",
        libraryMore: (count) => `Mehr anzeigen (${count})`,
        libraryLess: "Weniger anzeigen",
        majorCategoryDashboard: "Hauptbereiche",
        male: "Männer",
        muscleGroups: "Muskeln",
        muscles: "Muskeln",
        musclesCopy: "Prüfe Hauptmuskeln, unterstützende Muskeln und Stabilisatoren getrennt.",
        musclesEyebrow: "Muskeln",
        musclesHeading: "Zielmuskulatur",
        page: "Seite",
        pages: (count) => `${count} Seiten`,
        performanceDashboard: "Leistungsübersicht",
        performanceLibraryCount: "Veröffentlichte Übungen",
        performanceSnapshot: "Leistungsüberblick",
        performanceSnapshotCopy: "Wichtige Referenzwerte und Vergleichspunkte stehen vor der Tabelle.",
        primaryMuscle: "Hauptmuskel",
        primaryMuscleFallback: "Daten zur Zielmuskulatur veröffentlicht",
        quickCompare: "Schnellvergleich",
        quickStart: "Vergleich starten",
        quickStartCopy: "Wenn du nicht weißt, wo du anfangen sollst, nutze diese häufig gesuchten Übungen als Einstieg.",
        quickStartLabel: "Empfohlene Einstiege",
        relatedExercises: "Verwandte Übungen",
        relatedExercisesCopy: "Sortiert, damit du Übungen aus derselben Kategorie weiter vergleichen kannst.",
        relatedExplorerCopy: "Springe direkt zu verwandten Übungen und erweitere den Vergleich.",
        relatedExplorerTitle: "Weitere Übungen vergleichen",
        relatedNone: "Derzeit gibt es keine verwandten Übungen aus demselben Bereich.",
        relatedSameCategory: "Nur Übungen aus demselben Bereich.",
        reps: "Wdh.",
        repsComparison: "Wiederholungsvergleich",
        repsPage: "Wiederholungsbasierte Vergleichsseite",
        resultsAvailable: "Vergleichsdaten veröffentlicht",
        snapshot: "Überblick",
        snapshotDashboard: "Vergleichsübersicht",
        standards: "Kraftstandards",
        standardsEyebrow: "Standards",
        standardsReps: "Wiederholungsstandards",
        standardsWeightCopy: "Wechsle Geschlecht und Vergleichskriterium, um die Standards zu prüfen.",
        standardsRepsCopy: "Prüfe Wiederholungsstandards nach Körpergewicht und Alter über Tabs.",
        support: "Support",
        contact: "Kontakt",
        privacy: "Datenschutzerklärung",
        tableGuide: "Tabelle richtig lesen",
        tableGuideCopy: "Referenz für Verteilung und Trainingsdauer je Level.",
        tableGuideEyebrow: "Hinweise",
        totalCategories: "Veröffentlichte Kategorien",
        totalExercisesCopy: "Vergleichbare Übungen",
        unitSwitchCopy: "Einheitenwechsel auf allen Seiten",
        viewRelatedCategories: "Verwandte Vergleiche derselben Kategorie",
        weight: "Gewicht",
        weightComparison: "Gewichtsvergleich",
        weightPage: "Gewichtsbasierte Vergleichsseite",
        worldRecord: "Weltrekord"
    }
};

UI_TEXT["zh-hans"] = {
    ad: "广告",
    adAfterQuickStart: "推荐入口之后",
    adBeforeFooter: "页脚之前",
    adAfterRelated: "相关动作之后",
    adAfterStandards: "标准表之后",
    average: "平均重量",
    averageEyebrow: "平均",
    averageReps: "平均次数",
    breadcrumb: "导航路径",
    category: "分类",
    categoryDashboard: "部位分类总览",
    categoryDashboardCopy: "快速查看各部位的动作数量、代表动作和比较方向。",
    categoryDashboardEyebrow: "分类总览",
    compareDestination: "比较方向",
    compareFlow: "比较路径",
    compareMode: "比较模式",
    contentLibraryCopy: "可直接前往相关训练动作页面。",
    contentLibraryTitle: "动作数据库",
    dataAvailable: "已有数据",
    databaseLibraryTitle: "全动作数据库",
    databaseLibraryIntro: "从部位分类进入，直接前往需要的训练比较页面。",
    detailByTabs: "用标签页切换详细比较",
    exerciseLibraryTitle: "动作数据库",
    exercisesListed: (count) => `收录 ${count} 个动作`,
    female: "女性",
    home: "首页",
    homeHeroActionLabel: "快速操作",
    homeHeroDescription: "按训练动作快速比较平均重量、力量标准和目标肌群的重量训练数据库。",
    homeHeroTitle: "更快比较训练数据",
    languageEnglish: "English",
    languageJapanese: "日本語",
    languageKorean: "한국어",
    languageChinese: "繁体中文",
    languageSimplifiedChinese: "简体中文",
    languageSpanish: "Español",
    languageFrench: "Français",
    levelAverageAvailable: "收录平均数据",
    libraryExplorerCopy: "按部位浏览所有训练动作的比较页面。",
    libraryExplorerTitle: "训练动作库",
    libraryMore: (count) => `查看更多 (${count})`,
    libraryLess: "收起",
    majorCategoryDashboard: "主要部位总览",
    male: "男性",
    muscleGroups: "肌群",
    muscles: "肌群",
    musclesCopy: "可分别查看主动肌、辅助肌群和稳定肌群。",
    musclesEyebrow: "肌群",
    musclesHeading: "目标肌群",
    page: "页面",
    pages: (count) => `${count} 个页面`,
    performanceDashboard: "表现总览",
    performanceLibraryCount: "收录动作",
    performanceSnapshot: "表现摘要",
    performanceSnapshotCopy: "查看表格前，先整理最重要的基准线和比较重点。",
    primaryMuscle: "主动肌",
    primaryMuscleFallback: "收录主动肌数据",
    quickCompare: "快速比较",
    quickStart: "开始比较",
    quickStartCopy: "不知道从哪里开始时，可以先看这些最常被比较的路线。",
    quickStartLabel: "推荐入口",
    relatedExercises: "相关动作",
    relatedExercisesCopy: "整理同分类动作，方便连续比较。",
    relatedExplorerCopy: "直接前往相关训练动作页面，延伸比较流程。",
    relatedExplorerTitle: "查看更多动作",
    relatedNone: "目前没有可显示的同部位相关动作。",
    relatedSameCategory: "仅列出同部位的训练动作。",
    reps: "次数",
    repsComparison: "次数比较",
    repsPage: "次数基准比较页",
    resultsAvailable: "收录比较数据",
    snapshot: "概览",
    snapshotDashboard: "比较总览",
    standards: "力量标准",
    standardsEyebrow: "标准",
    standardsReps: "标准次数",
    standardsWeightCopy: "可切换性别和比较维度查看标准。",
    standardsRepsCopy: "可切换按体重和按年龄的标签页查看次数标准。",
    support: "支持",
    contact: "联系我们",
    privacy: "隐私政策",
    tableGuide: "标准表说明",
    tableGuideCopy: "各等级的分布和训练年限参考。",
    tableGuideEyebrow: "说明",
    totalCategories: "收录分类",
    totalExercisesCopy: "可横向比较的动作数",
    unitSwitchCopy: "所有页面支持单位切换",
    viewRelatedCategories: "同分类相关比较",
    weight: "重量",
    weightComparison: "重量比较",
    weightPage: "重量基准比较页",
    worldRecord: "世界纪录"
};

UI_TEXT.ja.languageSimplifiedChinese = "简体中文";
UI_TEXT.ko.languageSimplifiedChinese = "간체 중국어";
UI_TEXT["zh-hant"].languageSimplifiedChinese = "簡體中文";
UI_TEXT.es.languageSimplifiedChinese = "Chino simplificado";
UI_TEXT.fr.languageSimplifiedChinese = "Chinois simplifié";
UI_TEXT.de.languageSimplifiedChinese = "Chinesisch (vereinfacht)";
UI_TEXT["zh-hans"].languageGerman = "Deutsch";

const LIBRARY_INITIAL_CARD_LIMIT = 8;

normalizeAdSenseMarkup();
ensureAdSenseScript();

document.addEventListener("DOMContentLoaded", () => {
    const pageType = detectPageType();
    const locale = detectLocale();
    document.body.dataset.pageType = pageType;
    document.body.dataset.locale = locale;

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

function t(key, ...args) {
    const locale = detectLocale();
    const value = UI_TEXT[locale]?.[key] ?? UI_TEXT.ja[key] ?? key;
    return typeof value === "function" ? value(...args) : value;
}

function localeText(values) {
    const locale = detectLocale();
    if (Object.prototype.hasOwnProperty.call(values, locale)) {
        return values[locale];
    }

    if (locale === "zh-hans" && Object.prototype.hasOwnProperty.call(values, "zh-hant")) {
        return simplifyChineseCopy(values["zh-hant"]);
    }

    return values.ja ?? "";
}

function getCategoryLinks() {
    const locale = detectLocale();
    return CATEGORY_LINKS.map((item) => ({
        id: item.id,
        key: item.key,
        icon: assetPath(item.icon),
        label: localizedRecordValue(item.labels, locale),
        description: localizedRecordValue(item.descriptions, locale)
    }));
}

function getHomeEntryRouteDefinitions() {
    const locale = detectLocale();
    return HOME_ENTRY_ROUTES.map((route) => ({
        id: route.id,
        slugs: route.slugs,
        ...localizedRecordValue(route.locales, locale)
    }));
}

function assetPath(file) {
    const normalized = String(file || "").replace(/^\.?\/?assets\//, "");
    return `${detectLocale() === "ja" ? "./assets" : "../assets"}/${normalized}`;
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
    const categoryLinks = getCategoryLinks().map((item) => {
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
                        <img src="${assetPath("dumbbell-logo.png")}" alt="Shiba Muscle" class="header-dumbbell-logo">
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
    const categoryLinks = getCategoryLinks().map((item) => {
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
        { href: localizedDomainHref("https://en.shibamuscle.com"), label: t("languageEnglish"), lang: "en" },
        { href: localizedDomainHref("https://shibamuscle.com"), label: t("languageJapanese"), lang: "ja" },
        { href: localizedDomainHref("https://shibamuscle.com/zh-hant"), label: t("languageChinese"), lang: "zh-hant" },
        { href: localizedDomainHref("https://shibamuscle.com/zh-hans"), label: t("languageSimplifiedChinese"), lang: "zh-hans" },
        { href: localizedDomainHref("https://shibamuscle.com/ko"), label: t("languageKorean"), lang: "ko" },
        { href: localizedDomainHref("https://shibamuscle.com/es"), label: t("languageSpanish"), lang: "es" },
        { href: localizedDomainHref("https://shibamuscle.com/fr"), label: t("languageFrench"), lang: "fr" },
        { href: localizedDomainHref("https://shibamuscle.com/de"), label: t("languageGerman"), lang: "de" }
    ].map((item) => `<a href="${item.href}" data-lang="${item.lang}">${item.label}</a>`).join("");

    return htmlToElement(`
        <footer class="site-footer">
            <div class="footer-grid">
                <div class="footer-column">
                    <div class="footer-brand">
                        <img src="${assetPath("dumbbell-logo.png")}" alt="Shiba Muscle" class="footer-brand-logo">
                        <h4>Shiba Muscle</h4>
                    </div>
                </div>
                <div class="footer-column">
                    <h4>${escapeHtml(t("category"))}</h4>
                    <div class="footer-link-list footer-link-list--categories">${categoryLinks}</div>
                </div>
                <div class="footer-column">
                    <h4>${escapeHtml(t("support"))}</h4>
                    <div class="footer-link-list footer-link-list--support">
                        <a href="contact.html">${escapeHtml(t("contact"))}</a>
                        <a href="privacy-policy.html">${escapeHtml(t("privacy"))}</a>
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
                    <p class="eyebrow">${escapeHtml(t("performanceDashboard"))}</p>
                    <h1>${escapeHtml(t("homeHeroTitle"))}</h1>
                    <p class="hero-description">
                        ${escapeHtml(t("homeHeroDescription"))}
                    </p>
                    <div class="hero-chip-row" aria-label="${escapeAttribute(t("homeHeroActionLabel"))}">
                        <button type="button" class="hero-action-chip" data-dashboard-route="popular">${escapeHtml(homeEntryRoutes.find((route) => route.id === "popular")?.label || "")}</button>
                        <button type="button" class="hero-action-chip" data-dashboard-route="big3">BIG3</button>
                        <button type="button" class="hero-action-chip" data-dashboard-route="beginner">${escapeHtml(homeEntryRoutes.find((route) => route.id === "beginner")?.label || "")}</button>
                        <a href="#chest-section" class="hero-action-chip">${escapeHtml(getCategoryLabel("chest"))}</a>
                        <a href="#back-section" class="hero-action-chip">${escapeHtml(getCategoryLabel("back"))}</a>
                        <a href="#leg-section" class="hero-action-chip">${escapeHtml(getCategoryLabel("leg"))}</a>
                    </div>
                    <div class="hero-stat-grid">
                        <div class="summary-card">
                            <span class="metric-label">${escapeHtml(t("totalCategories"))}</span>
                            <strong class="metric-value">${libraryData.sections.length}</strong>
                            <span class="metric-subvalue">${escapeHtml(t("majorCategoryDashboard"))}</span>
                        </div>
                        <div class="summary-card">
                            <span class="metric-label">${escapeHtml(t("performanceLibraryCount"))}</span>
                            <strong class="metric-value">${allCards.length}</strong>
                            <span class="metric-subvalue">${escapeHtml(t("totalExercisesCopy"))}</span>
                        </div>
                        <div class="summary-card">
                            <span class="metric-label">${escapeHtml(t("compareMode"))}</span>
                            <strong class="metric-value">kg / lb</strong>
                            <span class="metric-subvalue">${escapeHtml(t("unitSwitchCopy"))}</span>
                        </div>
                    </div>
                </div>
                <aside class="dashboard-preview">
                    <div class="dashboard-panel">
                        <div class="dashboard-panel-heading">
                            <p class="eyebrow">${escapeHtml(t("snapshot"))}</p>
                            <h2>${escapeHtml(t("snapshotDashboard"))}</h2>
                        </div>
                        <div class="dashboard-panel-grid">
                            <article class="dashboard-mini-card">
                                <span class="metric-label">${escapeHtml(t("average"))}</span>
                                <strong class="metric-value">1RM</strong>
                                <span class="metric-subvalue">${escapeHtml(t("levelAverageAvailable"))}</span>
                            </article>
                            <article class="dashboard-mini-card">
                                <span class="metric-label">${escapeHtml(t("standards"))}</span>
                                <strong class="metric-value">${escapeHtml(localeText({ ja: "体重 / 年齢", ko: "체중 / 나이", "zh-hant": "體重 / 年齡", "zh-hans": "体重 / 年龄", es: "Peso / edad", fr: "Poids / âge", de: "Körpergewicht / Alter" }))}</strong>
                                <span class="metric-subvalue">${escapeHtml(t("detailByTabs"))}</span>
                            </article>
                            <article class="dashboard-mini-card">
                                <span class="metric-label">${escapeHtml(t("muscleGroups"))}</span>
                                <strong class="metric-value">${escapeHtml(t("primaryMuscle"))}</strong>
                                <span class="metric-subvalue">${escapeHtml(localeText({ ja: "種目ごとの効き方を把握", ko: "운동별 자극 부위 확인", "zh-hant": "查看每個動作的刺激部位", "zh-hans": "查看每个动作的刺激部位", es: "Estímulo por ejercicio", fr: "Travail musculaire par exercice", de: "Zielmuskulatur je Übung prüfen" }))}</span>
                            </article>
                            <article class="dashboard-mini-card">
                                <span class="metric-label">${escapeHtml(t("compareFlow"))}</span>
                                <strong class="metric-value">${escapeHtml(t("relatedExercises"))}</strong>
                                <span class="metric-subvalue">${escapeHtml(localeText({ ja: "同カテゴリを続けて閲覧", ko: "같은 카테고리 이어보기", "zh-hant": "連續查看同分類動作", "zh-hans": "连续查看同分类动作", es: "Seguir en la misma categoría", fr: "Continuer dans la même catégorie", de: "In derselben Kategorie weitersehen" }))}</span>
                            </article>
                        </div>
                        <div class="dashboard-spotlight-list">
                            <div class="dashboard-spotlight-heading">
                                <span class="metric-label">${escapeHtml(localeText({ ja: "今すぐ見比べる", ko: "바로 비교하기", "zh-hant": "立即比較", "zh-hans": "立即比较", es: "Comparar ahora", fr: "Comparer maintenant", de: "Jetzt vergleichen" }))}</span>
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
    const postQuickStartAd = prepareAdContainer(adContainers[0], t("adAfterQuickStart"));

    const categoryOverview = htmlToElement(`
        <section class="container section-band">
            <div class="section-heading">
                <p class="eyebrow">${escapeHtml(t("categoryDashboardEyebrow"))}</p>
                <h2>${escapeHtml(t("categoryDashboard"))}</h2>
                <p>${escapeHtml(t("categoryDashboardCopy"))}</p>
            </div>
            <div class="category-overview-grid">
                ${libraryData.sections.map((section) => {
                    const categoryMeta = getCategoryLinks().find((item) => item.id === section.id);
                    const description = categoryMeta?.description || localeText({ ja: "関連種目をまとめて確認", ko: "관련 운동을 한 번에 확인", "zh-hant": "集中查看相關訓練動作", "zh-hans": "集中查看相关训练动作", es: "Revisar ejercicios relacionados", fr: "Voir les exercices liés", de: "Verwandte Übungen gesammelt prüfen" });
                    const sampleNames = section.cards.slice(0, 3).map((card) => card.name).join(" / ");
                    return `
                        <a class="category-tile" href="#${section.id}">
                            <div class="category-tile-header">
                                <span class="category-tile-icon" aria-hidden="true">
                                    <img src="${escapeAttribute(categoryMeta?.icon || assetPath("dumbbell-logo.png"))}" alt="">
                                </span>
                                <span class="category-tile-count">${escapeHtml(formatExerciseCount(section.cards.length))}</span>
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

    titleHeading.textContent = t("databaseLibraryTitle");
    titleHeading.id = "database";
    titleHeading.classList.add("section-title--database");

    const homeIntro = htmlToElement(`
        <p class="section-intro">
            ${escapeHtml(t("databaseLibraryIntro"))}
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
        explorerTitle: t("libraryExplorerTitle"),
        explorerCopy: t("libraryExplorerCopy")
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
    const recordContainer = containers.find((container) => containsSectionHeading(container, t("worldRecord")) || containsSectionHeading(container, "世界記録"));
    const aboutContainer = containers.find((container) => container.querySelector("#about-table"));
    const calorieContainer = containers.find((container) => containsSectionHeading(container, "消費カロリー") || containsSectionHeading(container, "칼로리"));
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
    const averageLabel = main.dataset.averageLabel || (measurementKind === "reps" ? t("averageReps") : t("average"));
    const standardsLabel = main.dataset.standardsLabel || (measurementKind === "reps" ? t("standardsReps") : t("standards"));
    const sectionId = main.dataset.categoryId || currentCard?.sectionId || "whole-body-section";
    const sectionLabel = main.dataset.categoryLabel || cleanSectionLabel(currentCard?.sectionTitle || getCategoryLabel("wholeBody"));
    const summaryText = main.dataset.summary || currentCard?.description || "";
    const relatedTags = splitPipeList(main.dataset.relatedTags || "");
    const currentSlug = main.dataset.exerciseSlug || currentCard?.slug || "";
    const sameSectionCards = libraryData.sections.find((section) => section.id === sectionId)?.cards.filter((card) => card.slug !== currentSlug) || [];

    const breadcrumb = buildBreadcrumb([
        { label: t("home"), href: "index.html" },
        { label: sectionLabel, href: `index.html#${sectionId}` },
        { label: heroTitle }
    ]);

    const primaryMuscles = getPrimaryMuscles(muscles, main);
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
                <p class="eyebrow">${escapeHtml(t("performanceDashboard"))}</p>
                <h1>${escapeHtml(heroTitle)}</h1>
                ${summaryText ? `<p class="hero-description">${escapeHtml(summaryText)}</p>` : ""}
                <div class="muscle-chip-row">
                    ${primaryMuscles.map((muscle) => `<span class="muscle-chip">${escapeHtml(muscle)}</span>`).join("")}
                    ${relatedTags.slice(0, 3).map((tag) => `<span class="muscle-chip">${escapeHtml(tag)}</span>`).join("")}
                </div>
                <div class="hero-glance-grid">
                    <article class="hero-glance-card">
                        <span class="metric-label">${escapeHtml(t("category"))}</span>
                        <strong>${escapeHtml(sectionLabel)}</strong>
                        <span class="metric-subvalue">${escapeHtml(measurementKind === "reps" ? t("repsPage") : t("weightPage"))}</span>
                    </article>
                    <article class="hero-glance-card">
                        <span class="metric-label">${escapeHtml(t("primaryMuscle"))}</span>
                        <strong>${escapeHtml(formatMuscleCount(primaryMuscles.length || 0))}</strong>
                        <span class="metric-subvalue">${escapeHtml(primaryMuscles.slice(0, 3).join(" / ") || t("primaryMuscleFallback"))}</span>
                    </article>
                    <article class="hero-glance-card">
                        <span class="metric-label">${escapeHtml(t("compareDestination"))}</span>
                        <strong>${escapeHtml(formatExerciseCount(sameSectionCards.length + 1))}</strong>
                        <span class="metric-subvalue">${escapeHtml(t("viewRelatedCategories"))}</span>
                    </article>
                </div>
            </div>
            <div class="exercise-hero-media">
                <img src="${escapeAttribute(heroImage?.getAttribute("src") || "")}" alt="${escapeAttribute(heroImage?.getAttribute("alt") || heroTitle)}" class="workout-main-image">
                <p class="exercise-media-caption">${escapeHtml(formatStandardsCaption(standardsLabel))}</p>
            </div>
        </div>
    `;

    muscleContainer.id = "muscle-groups";
    muscleContainer.classList.add("section-band");
    muscleContainer.innerHTML = `
        <div class="section-heading">
            <p class="eyebrow">${escapeHtml(t("musclesEyebrow"))}</p>
            <h2>${escapeHtml(t("musclesHeading"))}</h2>
            <p>${escapeHtml(t("musclesCopy"))}</p>
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
        t("averageEyebrow"),
        averageLabel,
        measurementKind === "reps"
            ? localeText({ ja: "レベル別の平均レップ数を先に確認できます。", ko: "레벨별 평균 반복 횟수를 먼저 확인할 수 있습니다.", "zh-hant": "可先查看各等級的平均次數。", "zh-hans": "可先查看各等级的平均次数。", es: "Consulta primero las repeticiones medias por nivel.", fr: "Consulte d'abord les répétitions moyennes par niveau.", de: "Prüfe zuerst die durchschnittlichen Wiederholungen je Level." })
            : localeText({ ja: "レベル別の1RM目安を先に確認できます。", ko: "레벨별 1RM 기준을 먼저 확인할 수 있습니다.", "zh-hant": "可先查看各等級的 1RM 參考。", "zh-hans": "可先查看各等级的 1RM 参考。", es: "Consulta primero la referencia de 1RM por nivel.", fr: "Consulte d'abord la référence 1RM par niveau.", de: "Prüfe zuerst die 1RM-Referenz je Level." })
    );
    decorateTableShell(averageContainer.querySelector(".average-section-table"));

    decorateDataContainer(
        standardsContainer,
        "standards-data",
        t("standardsEyebrow"),
        standardsLabel,
        measurementKind === "reps" ? t("standardsRepsCopy") : t("standardsWeightCopy")
    );
    standardsContainer.querySelectorAll(".table").forEach((table) => decorateTableShell(table, true));
    standardsContainer.querySelectorAll(".tab .section-box").forEach((box) => box.classList.add("table-panel"));

    if (aboutContainer) {
        decorateDataContainer(aboutContainer, "table-guide", t("tableGuideEyebrow"), t("tableGuide"), t("tableGuideCopy"));
        decorateTableShell(aboutContainer.querySelector("table"));
    }

    if (recordContainer) {
        recordContainer.classList.add("section-band", "supplementary-band");
        const heading = recordContainer.querySelector(".section-title") || recordContainer.querySelector("h2");
        replaceHeadingTag(heading, "h2");
        const sectionHeading = recordContainer.querySelector("h2");
        if (sectionHeading) {
            sectionHeading.textContent = t("worldRecord");
        }
    }

    calorieContainer?.remove();

    const relatedContainer = buildRelatedSection(sectionLabel, sameSectionCards);

    const libraryTitle = replaceHeadingTag(libraryContainer.querySelector("#other-workouts"), "h2");

    libraryContainer.classList.add("section-band", "library-band");
    libraryTitle.textContent = t("exerciseLibraryTitle");
    libraryTitle.id = "exercise-library";
    libraryTitle.classList.add("section-title--database");

    const existingIntro = libraryContainer.querySelector(".section-intro");
    const libraryIntro = existingIntro || htmlToElement(`
        <p class="section-intro">
            ${escapeHtml(localeText({
                ja: "同カテゴリや他部位の種目を見比べながら、次の比較先へ移動できます。",
                "zh-hant": "可比較同分類與其他部位的訓練動作，再前往下一個頁面。",
                "zh-hans": "可比较同分类与其他部位的训练动作，再前往下一个页面。",
                es: "Compara ejercicios de la misma categoría y de otras zonas antes de pasar a la siguiente página.",
                fr: "Compare des exercices de la même catégorie et d'autres zones avant de passer à la page suivante.",
                de: "Vergleiche Übungen aus derselben Kategorie und anderen Muskelbereichen, bevor du zur nächsten Vergleichsseite wechselst."
            }))}
        </p>
    `);

    if (!existingIntro) {
        libraryTitle.after(libraryIntro);
    } else {
        libraryIntro.textContent = localeText({
            ja: "同カテゴリや他部位の種目を見比べながら、次の比較先へ移動できます。",
            "zh-hant": "可比較同分類與其他部位的訓練動作，再前往下一個頁面。",
            "zh-hans": "可比较同分类与其他部位的训练动作，再前往下一个页面。",
            es: "Compara ejercicios de la misma categoría y de otras zonas antes de pasar a la siguiente página.",
            fr: "Compare des exercices de la même catégorie et d'autres zones avant de passer à la page suivante.",
            de: "Vergleiche Übungen aus derselben Kategorie und anderen Muskelbereichen, bevor du zur nächsten Vergleichsseite wechselst."
        });
    }

    libraryData.sections.forEach((section) => {
        section.heading = replaceHeadingTag(section.heading, "h3");
    });

    const libraryContext = decorateLibraryExplorer({
        root: libraryContainer,
        sections: libraryData.sections,
        allCards,
        explorerTitle: t("relatedExplorerTitle"),
        explorerCopy: t("relatedExplorerCopy")
    });

    const postStandardsAd = prepareAdContainer(adContainers[0], t("adAfterStandards"));
    const postRelatedAd = prepareAdContainer(adContainers[1], t("adAfterRelated"));
    const preFooterAd = prepareAdContainer(adContainers[2], t("adBeforeFooter"));

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
            { label: t("home"), href: "index.html" },
            { label: normalizeText(heading?.textContent || t("page")) }
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
    libraryTitle.textContent = libraryTitle.textContent || localeText({ ja: "データベースから続けて探す", ko: "데이터베이스에서 계속 찾기", "zh-hant": "從資料庫繼續探索", "zh-hans": "从数据库继续探索", es: "Seguir explorando la base de datos", fr: "Continuer dans la base de données", de: "In der Datenbank weiterstöbern" });

    libraryData.sections.forEach((section) => {
        section.heading = replaceHeadingTag(section.heading, "h3");
    });

    return decorateLibraryExplorer({
        root: libraryContainer,
        sections: libraryData.sections,
        allCards: libraryData.allCards,
        explorerTitle: t("contentLibraryTitle"),
        explorerCopy: t("contentLibraryCopy")
    });
}

function buildHomeEntryRoutes(allCards) {
    return getHomeEntryRouteDefinitions().map((route) => {
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
                <p class="eyebrow">${escapeHtml(t("quickCompare"))}</p>
                <h2>${escapeHtml(t("quickStart"))}</h2>
                <p>${escapeHtml(t("quickStartCopy"))}</p>
            </div>
            <div class="quick-start-switcher" aria-label="${escapeAttribute(t("quickStartLabel"))}">
                ${routes.map((route, index) => {
                    return `
                        <button type="button" class="quick-start-option${index === 0 ? " is-active" : ""}" data-route-id="${route.id}" aria-pressed="${index === 0 ? "true" : "false"}">
                            <span class="quick-start-option-label">${escapeHtml(route.label)}</span>
                            <strong class="quick-start-option-title">${escapeHtml(route.title)}</strong>
                            <span class="quick-start-option-meta">${escapeHtml(t("pages", route.cards.length))}</span>
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
            <nav class="breadcrumb" aria-label="${escapeAttribute(t("breadcrumb"))}">
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
                <span>${escapeHtml(t("ad"))}</span>
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
            <p class="results-status" aria-live="polite">${escapeHtml(t("exercisesListed", allCards.length))}</p>
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
                    ? t("libraryLess")
                    : t("libraryMore", remainingCount);
            }
        }
    }
}

function buildRelatedSection(sectionLabel, cards) {
    const container = htmlToElement(`
        <section class="container section-band">
            <h2 id="related-exercises" class="section-title section-title--database">${escapeHtml(t("relatedExercises"))}</h2>
            <p class="section-intro">${escapeHtml(t("relatedExercisesCopy"))}</p>
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
                        <h3>${escapeHtml(formatRelatedHeading(sectionLabel))}</h3>
                        <p>${escapeHtml(t("relatedNone"))}</p>
                    </div>
                </section>
            </div>
        `);
    }

    return htmlToElement(`
        <div class="related-cluster-grid">
            <section class="related-cluster">
                <div class="related-cluster-copy">
                    <h3>${escapeHtml(formatRelatedHeading(sectionLabel))}</h3>
                    <p>${escapeHtml(t("relatedSameCategory"))}</p>
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
        badges.push(t("reps"));
    } else if (card.measurementKind === "weight") {
        badges.push(t("weight"));
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
                <p class="eyebrow">${escapeHtml(t("snapshot"))}</p>
                <h2>${escapeHtml(t("performanceSnapshot"))}</h2>
                <p>${escapeHtml(t("performanceSnapshotCopy"))}</p>
            </div>
            <div class="performance-signal-grid">
                ${renderPerformanceSignalCard(
                    baselineLine?.label || localeText({ ja: "基礎ライン", ko: "입문 기준", "zh-hant": "初學者基準", "zh-hans": "初学者基准", es: "Referencia principiante", fr: "Repère débutant", de: "Anfänger-Referenz" }),
                    baselineLine?.primary || t("dataAvailable"),
                    baselineLine?.secondary || t("levelAverageAvailable"),
                    true
                )}
                ${renderPerformanceSignalCard(
                    intermediateLine?.label || localeText({ ja: "中級ライン", ko: "중급 기준", "zh-hant": "中級者基準", "zh-hans": "中级者基准", es: "Referencia intermedia", fr: "Repère intermédiaire", de: "Fortgeschrittenen-Referenz" }),
                    intermediateLine?.primary || standardsLabel,
                    intermediateLine?.secondary || t("resultsAvailable")
                )}
                ${renderPerformanceSignalCard(
                    t("primaryMuscle"),
                    formatMuscleCount(primaryMuscles.length || 0),
                    primaryMuscles.slice(0, 3).join(" / ") || t("primaryMuscleFallback")
                )}
                ${renderPerformanceSignalCard(
                    localeText({ ja: "比較ビュー", ko: "비교 보기", "zh-hant": "比較視圖", "zh-hans": "比较视图", es: "Vista comparativa", fr: "Vue comparative", de: "Vergleichsansicht" }),
                    formatExerciseCount(sameSectionCount),
                    `${sectionLabel} / ${measurementKind === "reps" ? t("repsComparison") : t("weightComparison")}`
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
        baseline: parsedRows.find((row) => row.label.includes("基礎") || row.label.includes("初學") || row.label.includes("입문") || row.label.includes("Principiante")) || parsedRows[0],
        intermediate: parsedRows.find((row) => row.label.includes("中級") || row.label.includes("중급") || row.label.includes("Intermedio")) || parsedRows[Math.min(2, parsedRows.length - 1)]
    };
}

function formatAverageMetric(cell) {
    const value = normalizeText(cell?.innerText || cell?.textContent || "");
    return value ? `${t("male")} ${value}` : t("dataAvailable");
}

function formatSecondaryMetric(cell) {
    const value = normalizeText(cell?.innerText || cell?.textContent || "");
    return value ? `${t("female")} ${value}` : t("resultsAvailable");
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

function getCategoryLabel(key) {
    return getCategoryLinks().find((item) => item.key === key || item.id === key)?.label || key;
}

function getPrimaryMuscles(muscles, main) {
    const fromDataset = splitPipeList(main?.dataset.primaryMuscles || "");
    if (fromDataset.length) {
        return fromDataset;
    }

    const primary = muscles.find((item) => {
        const label = item.label || "";
        const normalizedLabel = label.toLowerCase();
        return label.includes("主働")
            || label.includes("主動")
            || label.includes("主动")
            || label.includes("主要")
            || label.includes("주동")
            || normalizedLabel.includes("principal")
            || normalizedLabel.includes("haupt")
            || normalizedLabel.includes("ziel");
    });

    return primary?.items || muscles[0]?.items || [];
}

function formatExerciseCount(count) {
    return localeText({ ja: `${count}種目`, ko: `${count}개 운동`, "zh-hant": `${count} 個動作`, "zh-hans": `${count} 个动作`, es: `${count} ejercicios`, fr: `${count} exercices`, de: `${count} Übungen` });
}

function formatMuscleCount(count) {
    return localeText({ ja: `${count}筋群`, ko: `${count}개 근육`, "zh-hant": `${count} 個肌群`, "zh-hans": `${count} 个肌群`, es: `${count} músculos`, fr: `${count} muscles`, de: `${count} Muskeln` });
}

function formatStandardsCaption(standardsLabel) {
    if (detectLocale() === "ko") {
        return `${standardsLabel}과 평균 데이터를 같은 흐름에서 확인할 수 있습니다.`;
    }

    if (detectLocale() === "zh-hant") {
        return `可在同一流程中查看${standardsLabel}與平均資料。`;
    }

    if (detectLocale() === "zh-hans") {
        return `可在同一流程中查看${standardsLabel}与平均数据。`;
    }

    if (detectLocale() === "es") {
        return `Puedes revisar ${standardsLabel.toLowerCase()} y datos medios en el mismo flujo.`;
    }

    if (detectLocale() === "de") {
        return `Du kannst ${standardsLabel} und Durchschnittswerte im selben Ablauf prüfen.`;
    }

    if (detectLocale() === "fr") {
        return `Tu peux consulter ${standardsLabel.toLowerCase()} et les données moyennes dans le même parcours.`;
    }

    return `${standardsLabel}と平均データを同じ流れで確認できます。`;
}

function formatRelatedHeading(sectionLabel) {
    if (detectLocale() === "ko") {
        return `${sectionLabel} 관련 운동`;
    }

    if (detectLocale() === "zh-hant") {
        return `${sectionLabel}相關動作`;
    }

    if (detectLocale() === "zh-hans") {
        return `${sectionLabel}相关动作`;
    }

    if (detectLocale() === "es") {
        return `Ejercicios relacionados de ${sectionLabel.toLowerCase()}`;
    }

    if (detectLocale() === "de") {
        return `Verwandte Übungen für ${sectionLabel}`;
    }

    if (detectLocale() === "fr") {
        return `Exercices liés pour ${sectionLabel.toLowerCase()}`;
    }

    return `${sectionLabel}の関連種目`;
}

function currentPath() {
    return window.location.pathname.split("/").pop() || "index.html";
}

function detectLocale() {
    const lang = document.documentElement.lang || "";
    if (lang.toLowerCase().startsWith("zh-hans") || window.location.pathname.split("/").includes("zh-hans")) {
        return "zh-hans";
    }

    if (lang.toLowerCase().startsWith("zh-hant") || window.location.pathname.split("/").includes("zh-hant")) {
        return "zh-hant";
    }

    if (lang.toLowerCase().startsWith("de") || window.location.pathname.split("/").includes("de")) {
        return "de";
    }

    if (lang.toLowerCase().startsWith("fr") || window.location.pathname.split("/").includes("fr")) {
        return "fr";
    }

    if (lang.toLowerCase().startsWith("es") || window.location.pathname.split("/").includes("es")) {
        return "es";
    }

    if (lang.toLowerCase().startsWith("ko") || window.location.pathname.split("/").includes("ko")) {
        return "ko";
    }

    return "ja";
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
    const normalized = normalizeText(text);
    if (detectLocale() === "es") {
        return normalized.replace(/\s*ejercicios?/gi, "").trim();
    }

    if (detectLocale() === "zh-hant") {
        return normalized.replace(/\s*訓練/g, "").trim();
    }

    if (detectLocale() === "zh-hans") {
        return normalized.replace(/\s*训练/g, "").trim();
    }

    if (detectLocale() === "fr") {
        return normalized.replace(/\s*exercices?/gi, "").trim();
    }

    if (detectLocale() === "ko") {
        return normalized.replace(/\s*운동/g, "").trim();
    }

    return normalized.replace("トレーニング", "").replace("トレ", "");
}

function localizedRecordValue(values, locale) {
    if (Object.prototype.hasOwnProperty.call(values, locale)) {
        return values[locale];
    }

    if (locale === "zh-hans" && Object.prototype.hasOwnProperty.call(values, "zh-hant")) {
        return simplifyChineseCopy(values["zh-hant"]);
    }

    return values.ja ?? "";
}

function simplifyChineseCopy(value) {
    if (typeof value === "function") {
        return (...args) => simplifyChineseCopy(value(...args));
    }

    if (Array.isArray(value)) {
        return value.map((item) => simplifyChineseCopy(item));
    }

    if (value && typeof value === "object") {
        return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, simplifyChineseCopy(item)]));
    }

    if (typeof value !== "string") {
        return value;
    }

    return [
        ["查詢", "查询"],
        ["詢問", "咨询"],
        ["支援", "支持"],
        ["切換", "切换"],
        ["回覆", "回复"],
        ["身分", "身份"],
        ["刊載", "刊载"],
        ["資訊", "信息"],
        ["使用者", "用户"],
        ["個人化", "个性化"],
        ["電子郵件", "电子邮件"],
        ["伺服器", "服务器"],
        ["透過", "通过"],
        ["設定", "设置"],
        ["重量訓練資料庫", "力量训练数据库"],
        ["訓練動作", "训练动作"],
        ["硬舉", "硬拉"],
        ["抓舉", "抓举"],
        ["平舉", "平举"],
        ["彎舉", "弯举"],
        ["髖鉸鏈", "髋铰链"],
        ["協調", "协调"],
        ["主導", "主导"],
        ["旋轉", "旋转"],
        ["年齡", "年龄"],
        ["連續", "连续"],
        ["三頭肌", "三头肌"],
        ["推類", "推类"],
        ["弓箭步", "弓步"],
        ["資料庫", "数据库"],
        ["資料", "数据"],
        ["訓練", "训练"],
        ["標準", "标准"],
        ["比較", "比较"],
        ["動作", "动作"],
        ["體重", "体重"],
        ["體幹", "核心"],
        ["體", "体"],
        ["頁面", "页面"],
        ["首頁", "首页"],
        ["導覽路徑", "导航路径"],
        ["分類", "分类"],
        ["總覽", "总览"],
        ["數量", "数量"],
        ["數據", "数据"],
        ["數", "数"],
        ["目標", "目标"],
        ["肌群", "肌群"],
        ["主動肌", "主动肌"],
        ["輔助肌群", "辅助肌群"],
        ["穩定肌群", "稳定肌群"],
        ["相關", "相关"],
        ["紀錄", "纪录"],
        ["聯絡我們", "联系我们"],
        ["隱私權政策", "隐私政策"],
        ["隱私", "隐私"],
        ["說明", "说明"],
        ["等級", "等级"],
        ["年資", "年限"],
        ["個", "个"],
        ["廣", "广"],
        ["後", "后"],
        ["頁", "页"],
        ["與", "与"],
        ["錄", "录"],
        ["點", "点"],
        ["據", "据"],
        ["語", "语"],
        ["練", "练"],
        ["標", "标"],
        ["準", "准"],
        ["體", "体"],
        ["權", "权"],
        ["說", "说"],
        ["視", "视"],
        ["參", "参"],
        ["註", "注"],
        ["別", "别"],
        ["規", "规"],
        ["飛", "飞"],
        ["級", "级"],
        ["紀", "纪"],
        ["錄", "录"],
        ["資", "资"],
        ["詢", "询"],
        ["換", "换"],
        ["載", "载"],
        ["設", "设"],
        ["無", "无"],
        ["覆", "复"],
        ["類", "类"],
        ["齡", "龄"],
        ["連", "连"],
        ["舉", "举"],
        ["協", "协"],
        ["調", "调"],
        ["髖", "髋"],
        ["鉸", "铰"],
        ["鏈", "链"],
        ["導", "导"],
        ["轉", "转"],
        ["頭", "头"],
        ["彎", "弯"],
        ["臥", "卧"],
        ["鈴", "铃"],
        ["槓", "杠"],
        ["繩", "绳"],
        ["纜", "缆"],
        ["機", "机"],
        ["區", "区"],
        ["塊", "块"],
        ["學", "学"],
        ["從", "从"],
        ["啟", "启"],
        ["雙", "双"],
        ["單", "单"],
        ["過", "过"],
        ["側", "侧"],
        ["壓", "压"],
        ["輔", "辅"],
        ["穩", "稳"],
        ["聯", "联"],
        ["關", "关"],
        ["續", "续"],
        ["選", "选"],
        ["橫", "横"],
        ["開", "开"],
        ["臺", "台"]
    ].reduce((next, [from, to]) => next.replaceAll(from, to), value);
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

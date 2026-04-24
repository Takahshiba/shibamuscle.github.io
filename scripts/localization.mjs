import { join } from "node:path";

import { ROOT, loadLocales } from "./source-data.mjs";

const SITE_ORIGIN = "https://shibamuscle.com";

const UI_TEXT = {
    ja: {
        ad: "広告",
        arm: "腕",
        back: "背中",
        breadcrumb: "Breadcrumb",
        categories: "カテゴリ",
        chest: "胸",
        contact: "お問い合わせ",
        core: "体幹",
        data: "データ",
        female: "女性",
        home: "Home",
        language: "言語",
        leg: "脚",
        links: "リンク",
        male: "男性",
        moreWorkouts: "その他のワークアウト",
        muscles: "筋肉",
        privacy: "プライバシーポリシー",
        searchExercises: "ワークアウトを検索",
        shoulder: "肩",
        support: "サポート",
        wholeBody: "全身"
    },
    ko: {
        ad: "광고",
        arm: "팔",
        back: "등",
        breadcrumb: "이동 경로",
        categories: "카테고리",
        chest: "가슴",
        contact: "문의하기",
        core: "코어",
        data: "데이터",
        female: "여성",
        home: "홈",
        language: "언어",
        leg: "하체",
        links: "링크",
        male: "남성",
        moreWorkouts: "다른 운동",
        muscles: "근육",
        privacy: "개인정보 처리방침",
        searchExercises: "운동 검색",
        shoulder: "어깨",
        support: "지원",
        wholeBody: "전신"
    }
};

const CATEGORY_NAV = [
    {
        id: "whole-body-section",
        key: "wholeBody",
        icon: "power-clean-white-icon.webp",
        descriptions: {
            ja: "デッドリフト、クリーン、スナッチなど全身連動の基準ページ",
            ko: "데드리프트, 클린, 스내치처럼 전신을 함께 쓰는 운동의 기준 페이지"
        }
    },
    {
        id: "chest-section",
        key: "chest",
        icon: "bench-press-white-icon.webp",
        descriptions: {
            ja: "プレス系の平均重量と押す種目の比較",
            ko: "프레스 계열 평균 중량과 미는 운동 비교"
        }
    },
    {
        id: "back-section",
        key: "back",
        icon: "deadlift-white-icon.webp",
        descriptions: {
            ja: "ローイング、プル系、ヒンジ系の比較",
            ko: "로우, 풀, 힌지 계열 운동 비교"
        }
    },
    {
        id: "shoulder-section",
        key: "shoulder",
        icon: "shoulder-press-white-icon.webp",
        descriptions: {
            ja: "プレス、レイズ、安定性の種目一覧",
            ko: "프레스, 레이즈, 안정성 운동 목록"
        }
    },
    {
        id: "arm-section",
        key: "arm",
        icon: "hammer-curl-white-icon.webp",
        descriptions: {
            ja: "カール、トライセプス、前腕の種目",
            ko: "컬, 삼두, 전완 운동"
        }
    },
    {
        id: "leg-section",
        key: "leg",
        icon: "squat-white-icon.webp",
        descriptions: {
            ja: "スクワット、ランジ、ヒップ主導の種目",
            ko: "스쿼트, 런지, 힙 중심 운동"
        }
    },
    {
        id: "core-section",
        key: "core",
        icon: "sit-ups-white-icon.webp",
        descriptions: {
            ja: "腹筋、回旋、体幹安定の種目",
            ko: "복근, 회전, 코어 안정화 운동"
        }
    }
];

const CATEGORY_LABELS_KO = {
    "whole-body-section": "전신",
    "chest-section": "가슴",
    "back-section": "등",
    "shoulder-section": "어깨",
    "arm-section": "팔",
    "leg-section": "하체",
    "core-section": "코어"
};

const CATEGORY_ALIASES_KO = {
    "whole-body-section": ["전신 운동", "BIG3/전신"],
    "chest-section": ["가슴 운동", "대흉근"],
    "back-section": ["등 운동", "광배근"],
    "shoulder-section": ["어깨 운동", "삼각근"],
    "arm-section": ["팔 운동", "이두", "삼두"],
    "leg-section": ["하체 운동", "다리"],
    "core-section": ["코어 운동", "복근"]
};

const CATEGORY_DEFAULT_TAGS_KO = {
    "whole-body-section": ["전신", "전신 협응"],
    "chest-section": ["가슴", "프레스"],
    "back-section": ["등", "풀"],
    "shoulder-section": ["어깨", "프레스"],
    "arm-section": ["팔", "컬"],
    "leg-section": ["하체", "스쿼트"],
    "core-section": ["코어", "복근"]
};

const MUSCLE_GROUPS_KO = {
    "グリップ": "그립",
    "主働筋": "주동근",
    "主動筋": "주동근",
    "副働筋": "보조근",
    "副動筋": "보조근",
    "安定筋": "안정근"
};

const MUSCLES_KO = {
    "なし": "없음",
    "ハムストリングス": "햄스트링",
    "三角筋": "삼각근",
    "上腕三頭筋": "상완삼두근",
    "上腕二頭筋": "상완이두근",
    "下腿三頭筋": "종아리근",
    "僧帽筋": "승모근",
    "内転筋群": "내전근군",
    "前脛骨筋": "전경골근",
    "前腕伸筋群": "전완 신전근군",
    "前腕屈筋群": "전완 굴곡근군",
    "外腹斜筋": "외복사근",
    "大円筋": "대원근",
    "大胸筋": "대흉근",
    "大胸筋上部": "상부 대흉근",
    "大胸筋下部": "하부 대흉근",
    "大腿四頭筋": "대퇴사두근",
    "大臀筋": "대둔근",
    "広背筋": "광배근",
    "棘上筋": "극상근",
    "棘下筋": "극하근",
    "胸鎖乳突筋": "흉쇄유돌근",
    "脊柱起立筋": "척추기립근",
    "腹直筋": "복직근"
};

const EQUIPMENT_TAGS_KO = {
    BIG3: "BIG3",
    "ケーブル": "케이블",
    "スミスマシン": "스미스머신",
    "ダンベル": "덤벨",
    "バーベル": "바벨",
    "マシン": "머신",
    "自重": "맨몸"
};

const EXACT_EXERCISE_NAMES_KO = {
    "ab-wheel-roller": "AB 휠 롤아웃",
    "arnold-press": "아놀드 프레스",
    "back-extension": "백 익스텐션",
    "bench-dips": "벤치 딥스",
    "bench-pin-press": "벤치 핀 프레스",
    "bench-press": "벤치프레스",
    "bench-pull": "벤치 풀",
    "bent-arm-barbell-pullover": "벤트암 바벨 풀오버",
    "bent-over-row": "벤트오버 로우",
    "bicycle-crunches": "바이시클 크런치",
    "bodyweight-calf-raise": "맨몸 카프 레이즈",
    "bodyweight-squat": "맨몸 스쿼트",
    "box-squat": "박스 스쿼트",
    "bulgarian-split-squat": "불가리안 스플릿 스쿼트",
    "burpees": "버피",
    "cable-woodchopper": "케이블 우드초퍼",
    "cheat-curl": "치팅 컬",
    "chest-press": "체스트 프레스",
    "chest-supported-dumbbell-row": "체스트 서포티드 덤벨 로우",
    "chin-ups": "친업",
    "clap-pull-up": "클랩 풀업",
    "clean": "클린",
    "clean-and-jerk": "클린 앤 저크",
    "clean-and-press": "클린 앤 프레스",
    "clean-high-pull": "클린 하이 풀",
    "clean-pull": "클린 풀",
    "crunches": "크런치",
    "deadlift": "데드리프트",
    "decline-crunches": "디클라인 크런치",
    "decline-sit-ups": "디클라인 싯업",
    "diamond-push-ups": "다이아몬드 푸시업",
    "dips": "딥스",
    "donkey-calf-raise": "동키 카프 레이즈",
    "ez-bar-curl": "EZ바 컬",
    "face-pull": "페이스 풀",
    "floor-press": "플로어 프레스",
    "flutter-kicks": "플러터 킥",
    "front-squat": "프론트 스쿼트",
    "glute-bridge": "글루트 브리지",
    "glute-ham-raise": "글루트 햄 레이즈",
    "glute-kickback": "글루트 킥백",
    "goblet-squat": "고블릿 스쿼트",
    "good-morning": "굿모닝",
    "hack-squat": "핵 스쿼트",
    "hammer-curl": "해머 컬",
    "handstand-push-ups": "핸드스탠드 푸시업",
    "hang-clean": "행 클린",
    "hang-power-clean": "행 파워 클린",
    "hang-snatch": "행 스내치",
    "hanging-knee-raise": "행잉 니 레이즈",
    "hanging-leg-raise": "행잉 레그 레이즈",
    "hex-bar-deadlift": "헥스바 데드리프트",
    "hex-bar-shrug": "헥스바 슈러그",
    "high-pulley-crunches": "하이 풀리 크런치",
    "hip-abduction": "힙 어브덕션",
    "hip-adduction": "힙 어덕션",
    "hip-extension": "힙 익스텐션",
    "hip-thrust": "힙 쓰러스트",
    "horizontal-leg-press": "호리존탈 레그프레스",
    "inverted-row": "인버티드 로우",
    "jefferson-deadlift": "제퍼슨 데드리프트",
    "jefferson-squat": "제퍼슨 스쿼트",
    "jm-press": "JM 프레스",
    "jumping-jack": "점핑 잭",
    "lat-pulldown": "랫풀다운",
    "leg-extension": "레그 익스텐션",
    "log-press": "로그 프레스",
    "lunge": "런지",
    "meadows-row": "메도우스 로우",
    "military-press": "밀리터리 프레스",
    "mountain-climbers": "마운틴 클라이머",
    "muscle-snatch": "머슬 스내치",
    "muscle-ups": "머슬업",
    "neck-curl": "넥 컬",
    "neck-extension": "넥 익스텐션",
    "neutral-grip-pull-ups": "뉴트럴 그립 풀업",
    "nordic-hamstring-curl": "노르딕 햄스트링 컬",
    "overhead-squat": "오버헤드 스쿼트",
    "pendlay-row": "펜들레이 로우",
    "pike-push-ups": "파이크 푸시업",
    "pistol-squat": "피스톨 스쿼트",
    "power-clean": "파워 클린",
    "power-snatch": "파워 스내치",
    "preacher-curl": "프리처 컬",
    "pull-ups": "풀업",
    "push-jerk": "푸시 저크",
    "push-press": "푸시 프레스",
    "push-ups": "푸시업",
    "rack-pull": "랙 풀",
    "renegade-row": "레니게이드 로우",
    "reverse-crunches": "리버스 크런치",
    "reverse-hyperextension": "리버스 하이퍼익스텐션",
    "ring-dips": "링 딥스",
    "ring-muscle-ups": "링 머슬업",
    "romanchair-side-bend": "로만체어 사이드 밴드",
    "romanian-deadlift": "루마니안 데드리프트",
    "russian-twist": "러시안 트위스트",
    "safety-bar-squat": "세이프티바 스쿼트",
    "scissor-kicks": "시저 킥",
    "seated-dips-machine": "시티드 딥스 머신",
    "shoulder-pin-press": "숄더 핀 프레스",
    "shoulder-press": "숄더 프레스",
    "side-crunches": "사이드 크런치",
    "side-leg-raise": "사이드 레그 레이즈",
    "side-lunge": "사이드 런지",
    "single-leg-deadlift": "싱글레그 데드리프트",
    "sissy-squat": "시시 스쿼트",
    "sit-ups": "싯업",
    "sled-leg-press": "슬레드 레그프레스",
    "sled-press-calf-raise": "슬레드 프레스 카프 레이즈",
    "snatch": "스내치",
    "snatch-deadlift": "스내치 데드리프트",
    "snatch-pull": "스내치 풀",
    "spider-curl": "스파이더 컬",
    "split-jerk": "스플릿 저크",
    "split-squat": "스플릿 스쿼트",
    "spoto-press": "스포토 프레스",
    "squat": "스쿼트",
    "squat-jump": "스쿼트 점프",
    "squat-thrust": "스쿼트 쓰러스트",
    "standing-cable-crunches": "스탠딩 케이블 크런치",
    "stiff-leg-deadlift": "스티프레그 데드리프트",
    "strict-curl": "스트릭트 컬",
    "sumo-deadlift": "스모 데드리프트",
    "sumo-squat": "스모 스쿼트",
    "superman": "슈퍼맨",
    "t-bar-row": "티바 로우",
    "tate-press": "테이트 프레스",
    "thruster": "쓰러스터",
    "toes-to-bar": "토즈 투 바",
    "upright-row": "업라이트 로우",
    "vertical-leg-press": "버티컬 레그프레스",
    "viking-press": "바이킹 프레스",
    "walking-lunge": "워킹 런지",
    "wall-ball": "월볼",
    "wrist-curl": "리스트 컬",
    "yates-row": "예이츠 로우",
    "z-press": "Z 프레스",
    "zercher-deadlift": "저처 데드리프트",
    "zercher-squat": "저처 스쿼트",
    "zottman-curl": "조트맨 컬"
};

const PHRASE_NAME_PARTS_KO = {
    "barbell": "바벨",
    "behind-the-back": "비하인드 백",
    "behind-the-neck": "비하인드 넥",
    "belt": "벨트",
    "bent-over": "벤트오버",
    "cable": "케이블",
    "calf-raise": "카프 레이즈",
    "close-grip": "클로즈그립",
    "concentration": "컨센트레이션",
    "decline": "디클라인",
    "deficit": "데피싯",
    "dumbbell": "덤벨",
    "external-rotation": "외회전",
    "floor": "플로어",
    "front": "프론트",
    "half": "하프",
    "hammer": "해머",
    "high-pulley": "하이 풀리",
    "incline": "인클라인",
    "landmine": "랜드마인",
    "lateral": "레터럴",
    "lying": "라잉",
    "machine": "머신",
    "one-arm": "원암",
    "overhead": "오버헤드",
    "paused": "포즈",
    "pin": "핀",
    "reverse": "리버스",
    "reverse-grip": "리버스 그립",
    "seated": "시티드",
    "single-leg": "싱글레그",
    "smith-machine": "스미스머신",
    "standing": "스탠딩",
    "straight-arm": "스트레이트 암",
    "tricep-rope": "트라이셉스 로프",
    "crunches": "크런치",
    "pull-ups": "풀업",
    "push-ups": "푸시업",
    "sit-ups": "싯업",
    "wide-grip": "와이드그립"
};

const TOKEN_NAME_PARTS_KO = {
    abduction: "어브덕션",
    adduction: "어덕션",
    archer: "아처",
    back: "백",
    bar: "바",
    bench: "벤치",
    bicep: "바이셉스",
    calf: "카프",
    curl: "컬",
    deadlift: "데드리프트",
    extension: "익스텐션",
    fly: "플라이",
    hamstring: "햄스트링",
    high: "하이",
    kickback: "킥백",
    lateral: "레터럴",
    leg: "레그",
    press: "프레스",
    pulldown: "풀다운",
    pull: "풀",
    pullover: "풀오버",
    raise: "레이즈",
    row: "로우",
    shrug: "슈러그",
    squat: "스쿼트",
    tricep: "트라이셉스",
    y: "Y"
};

const JAPANESE_TO_KOREAN_TEXT = [
    ["その他のワークアウト", "다른 운동"],
    ["ワークアウトデータベース", "운동 데이터베이스"],
    ["鍛えられる筋肉", "자극되는 근육"],
    ["テーブルの見方", "기준표 보는 법"],
    ["世界記録", "세계 기록"],
    ["公式記録", "공식 기록"],
    ["プライバシーポリシー", "개인정보 처리방침"],
    ["お問い合わせ", "문의하기"],
    ["リンク", "링크"],
    ["言語", "언어"],
    ["男性・体重別", "남성 체중별"],
    ["女性・体重別", "여성 체중별"],
    ["男性・年齢別", "남성 나이별"],
    ["女性・年齢別", "여성 나이별"],
    ["平均レップ数", "평균 반복 횟수"],
    ["基準レップ数", "기준 반복 횟수"],
    ["平均重量", "평균 중량"],
    ["基準重量", "기준 중량"],
    ["レップ数", "반복 횟수"],
    ["体重別", "체중별"],
    ["年齢別", "나이별"],
    ["レベル", "레벨"],
    ["グループ", "그룹"],
    ["データ", "데이터"],
    ["説明", "설명"],
    ["分布", "분포"],
    ["体重", "체중"],
    ["年齢", "나이"],
    ["男性", "남성"],
    ["女性", "여성"],
    ["筋肉", "근육"],
    ["重量", "중량"],
    ["基礎", "입문"],
    ["初級", "초급"],
    ["中級", "중급"],
    ["上級", "상급"],
    ["プロ", "엘리트"],
    ["上位", "상위"],
    ["下位", "하위"],
    ["正しいフォームを身につけ、1か月以上継続してトレーニングに励む。", "올바른 자세를 익히고 1개월 이상 꾸준히 운동하는 단계입니다."],
    ["6か月以上継続的にトレーニングに励む。", "6개월 이상 꾸준히 운동한 단계입니다."],
    ["２年以上継続的にトレーニングに励む。", "2년 이상 꾸준히 운동한 단계입니다."],
    ["5年以上継続的にトレーニングに励む。", "5년 이상 꾸준히 운동한 단계입니다."],
    ["5年以上当該メニューを専門にトレーニング。", "해당 운동을 5년 이상 전문적으로 훈련한 단계입니다."],
    ["注：", "참고: "]
].sort((left, right) => right[0].length - left[0].length);

const JAPANESE_LEFTOVER_PATTERNS = [
    /[\u3040-\u30ff]/,
    /平均重量|基準重量|平均レップ数|基準レップ数|鍛えられる筋肉|主働筋|主動筋|副働筋|副動筋|安定筋|体重別|年齢別|男性|女性|基礎|初級|中級|上級|世界記録|種目|その他のワークアウト|お問い合わせ|プライバシーポリシー|カテゴリ|サポート|広告|もっと見る/
];

export {
    CATEGORY_NAV,
    JAPANESE_LEFTOVER_PATTERNS,
    SITE_ORIGIN,
    absoluteUrlForFile,
    assetHref,
    assetPrefix,
    buildAlternateUrls,
    buildExerciseDescription,
    buildExerciseSeo,
    buildExerciseSeoDescription,
    buildExerciseSummary,
    buildLocalizedCard,
    buildOutputPath,
    buildStaticFileEntries,
    cleanSectionLabel,
    getCategoryDescription,
    getCategoryLabel,
    getCategoryNavItems,
    getExerciseName,
    getGeneratedLocales,
    getLocaleConfig,
    getLocaleConfigs,
    getLocalizedMuscleGroups,
    getMeasurementCopy,
    getMuscleGroupLabel,
    getMuscleName,
    getOgLocale,
    getRelatedTags,
    getSearchTerms,
    getUiText,
    isGeneratedLocale,
    languageAlternates,
    localizeExerciseHtml,
    localizeHtmlAssetPaths,
    localizeStaticPage,
    pageHref,
    stripIntentionalLanguageSwitchText,
    stylesheetHref
};

function getLocaleConfigs() {
    return loadLocales().locales;
}

function getGeneratedLocales() {
    return getLocaleConfigs().filter((locale) => locale.generated);
}

function getLocaleConfig(localeCode = "ja") {
    const locales = getLocaleConfigs();
    return locales.find((locale) => locale.code === localeCode) || locales.find((locale) => locale.code === "ja");
}

function isGeneratedLocale(localeCode) {
    return Boolean(getLocaleConfig(localeCode)?.generated);
}

function getOgLocale(localeCode) {
    return getLocaleConfig(localeCode)?.ogLocale || "ja_JP";
}

function buildOutputPath(file, localeCode = "ja") {
    const locale = getLocaleConfig(localeCode);
    return locale.outputDir ? join(ROOT, locale.outputDir, file) : join(ROOT, file);
}

function buildStaticFileEntries(files, localeCodes = getGeneratedLocales().map((locale) => locale.code)) {
    return localeCodes.flatMap((localeCode) => {
        return files.map((file) => ({
            file,
            locale: localeCode,
            relativePath: localeCode === "ja" ? file : `${getLocaleConfig(localeCode).outputDir}/${file}`,
            path: buildOutputPath(file, localeCode)
        }));
    });
}

function assetPrefix(localeCode = "ja") {
    return getLocaleConfig(localeCode).outputDir ? ".." : ".";
}

function assetHref(file, localeCode = "ja") {
    const prefix = assetPrefix(localeCode);
    const normalized = file.replace(/^\.?\/?assets\//, "");
    return `${prefix}/assets/${normalized}`;
}

function stylesheetHref(file, localeCode = "ja") {
    if (/^https?:\/\//.test(file)) {
        return file;
    }

    return getLocaleConfig(localeCode).outputDir ? `../${file}` : file;
}

function pageHref(file) {
    return file;
}

function absoluteUrlForFile(file, localeCode = "ja") {
    const locale = getLocaleConfig(localeCode);
    const route = file === "index.html" ? locale.routePrefix : joinRoute(locale.routePrefix, file);
    return `${locale.origin}${route}`;
}

function buildAlternateUrls(file) {
    return Object.fromEntries(getLocaleConfigs().map((locale) => {
        return [locale.code, absoluteUrlForFile(file, locale.code)];
    }));
}

function languageAlternates(file) {
    return getLocaleConfigs().map((locale) => ({
        ...locale,
        href: absoluteUrlForFile(file, locale.code)
    }));
}

function localizeStaticPage(page, localeCode = "ja") {
    const { locales, ...basePage } = page;
    if (localeCode === "ja") {
        return basePage;
    }

    return {
        ...basePage,
        ...(locales?.[localeCode] || {}),
        file: basePage.file,
        kind: basePage.kind,
        stylesheets: basePage.stylesheets
    };
}

function getUiText(localeCode, key) {
    return UI_TEXT[localeCode]?.[key] || UI_TEXT.ja[key] || key;
}

function getCategoryNavItems(localeCode = "ja") {
    return CATEGORY_NAV.map((item) => ({
        id: item.id,
        label: getUiText(localeCode, item.key),
        icon: assetHref(item.icon, localeCode),
        alt: getUiText(localeCode, item.key),
        description: item.descriptions[localeCode] || item.descriptions.ja
    }));
}

function getCategoryLabel(sectionOrId, localeCode = "ja") {
    if (typeof sectionOrId === "string") {
        return localeCode === "ko" ? CATEGORY_LABELS_KO[sectionOrId] || sectionOrId : sectionOrId;
    }

    if (!sectionOrId) {
        return localeCode === "ko" ? "전신" : "全身";
    }

    if (localeCode === "ko") {
        return sectionOrId.label?.ko || sectionOrId.titles?.ko || CATEGORY_LABELS_KO[sectionOrId.id] || sectionOrId.label?.ja || sectionOrId.titles?.ja || "";
    }

    return sectionOrId.label?.ja || sectionOrId.titles?.ja || sectionOrId.title || "";
}

function getCategoryDescription(sectionOrId, localeCode = "ja") {
    const id = typeof sectionOrId === "string" ? sectionOrId : sectionOrId?.id;
    const navItem = CATEGORY_NAV.find((item) => item.id === id);
    return navItem?.descriptions[localeCode] || navItem?.descriptions.ja || "";
}

function getMeasurementCopy(kind = "weight", localeCode = "ja") {
    if (localeCode === "ko") {
        if (kind === "reps") {
            return {
                averageLabel: "평균 반복 횟수",
                standardsLabel: "기준 반복 횟수",
                detailLabel: "반복 횟수",
                pageTerm: "반복 횟수",
                note: "표의 수치는 한 세트에서 수행할 수 있는 반복 횟수의 기준입니다."
            };
        }

        return {
            averageLabel: "평균 중량",
            standardsLabel: "기준 중량",
            detailLabel: "1RM",
            pageTerm: "중량",
            note: "표의 수치는 1RM 기준 추정치입니다."
        };
    }

    if (kind === "reps") {
        return {
            averageLabel: "平均レップ数",
            standardsLabel: "基準レップ数",
            detailLabel: "レップ数",
            pageTerm: "レップ数",
            note: "表中の数値は1セットで行えるレップ数の目安です。"
        };
    }

    return {
        averageLabel: "平均重量",
        standardsLabel: "基準重量",
        detailLabel: "1RM",
        pageTerm: "重量",
        note: "表中の数値は1RMの目安です。"
    };
}

function getExerciseName(exerciseOrCard, localeCode = "ja") {
    if (localeCode === "ko") {
        const slug = exerciseOrCard.slug || "";
        return exerciseOrCard.names?.ko || EXACT_EXERCISE_NAMES_KO[slug] || inferKoreanExerciseName(slug);
    }

    return exerciseOrCard.names?.ja || exerciseOrCard.name || exerciseOrCard.slug || "";
}

function getMuscleGroupLabel(label, localeCode = "ja") {
    return localeCode === "ko" ? MUSCLE_GROUPS_KO[label] || label : label;
}

function getMuscleName(name, localeCode = "ja") {
    return localeCode === "ko" ? MUSCLES_KO[name] || name : name;
}

function getLocalizedMuscleGroups(exercise, localeCode = "ja") {
    return (exercise.muscles || []).map((group) => ({
        label: getMuscleGroupLabel(group.label, localeCode),
        items: (group.items || []).map((item) => getMuscleName(item, localeCode))
    }));
}

function hasKoreanFinalConsonant(text) {
    const match = String(text || "").match(/[가-힣](?=[^가-힣]*$)/);
    if (!match) return false;
    return (match[0].charCodeAt(0) - 0xac00) % 28 !== 0;
}

function topicParticle(text) {
    return hasKoreanFinalConsonant(text) ? "은" : "는";
}

function objectParticle(text) {
    return hasKoreanFinalConsonant(text) ? "을" : "를";
}

function andParticle(text) {
    return hasKoreanFinalConsonant(text) ? "과" : "와";
}

function formatKoreanMeasurementPair(copy) {
    return `${copy.averageLabel}${andParticle(copy.averageLabel)} ${copy.standardsLabel}${objectParticle(copy.standardsLabel)}`;
}

function buildExerciseSummary(exercise, section, measurementKind, localeCode = "ja") {
    if (localeCode !== "ko") {
        return exercise.metadata?.summary?.ja || "";
    }

    const name = getExerciseName(exercise, localeCode);
    const category = getCategoryLabel(section || exercise.categoryId, localeCode);
    const muscles = getLocalizedMuscleGroups(exercise, localeCode)[0]?.items?.slice(0, 3).join(", ") || "주요 근육";

    if (measurementKind === "reps") {
        return `${name}${topicParticle(name)} ${category} 운동 중에서도 ${muscles}을 중심으로 단련하는 운동입니다. 평균 반복 횟수와 기준 반복 횟수를 한 페이지에서 확인할 수 있습니다.`;
    }

    return `${name}의 평균 중량과 기준 중량을 ${category} 대표 운동 기준으로 확인할 수 있습니다. 주동근은 ${muscles}입니다.`;
}

function buildExerciseDescription(exercise, section, measurementKind, localeCode = "ja") {
    if (localeCode !== "ko") {
        return exercise.metadata?.description?.ja || "";
    }

    const name = getExerciseName(exercise, localeCode);
    const category = getCategoryLabel(section || exercise.categoryId, localeCode);
    const muscles = getLocalizedMuscleGroups(exercise, localeCode)[0]?.items?.slice(0, 3).join(", ") || "주요 근육";

    if (measurementKind === "reps") {
        return `${name}${topicParticle(name)} ${category}에서 활용하기 좋은 맨몸 또는 저부하 계열 운동입니다. ${muscles}을 중심으로 자극하면서 평균 반복 횟수와 기준 반복 횟수를 비교할 수 있습니다.`;
    }

    return `${name}${topicParticle(name)} ${category}의 대표 운동입니다. ${muscles}을 주동근으로 사용하며 평균 중량, 기준 중량, 관련 운동을 함께 비교할 수 있습니다.`;
}

function buildExerciseSeo(exercise, measurementKind, unit, localeCode = "ja") {
    if (localeCode !== "ko") {
        const copy = getMeasurementCopy(measurementKind, "ja");
        const unitLabel = unit === "lb" ? "lb表" : "kg表";
        return {
            title: `${exercise.names.ja}の${copy.averageLabel}・${copy.standardsLabel} | Shiba Muscle`,
            descriptionPrefix: `${exercise.names.ja}の${copy.averageLabel}と${copy.standardsLabel}を${unitLabel}で確認できるページです。`
        };
    }

    const copy = getMeasurementCopy(measurementKind, "ko");
    const name = getExerciseName(exercise, "ko");
    const unitLabel = unit === "lb" ? "lb 기준표" : "kg 기준표";

    return {
        title: `${name} ${copy.averageLabel} / ${copy.standardsLabel} | Shiba Muscle`,
        descriptionPrefix: `${name}의 ${formatKoreanMeasurementPair(copy)} ${unitLabel}로 확인하는 페이지입니다.`
    };
}

function buildExerciseSeoDescription(exercise, section, measurementKind, unit, localeCode = "ja") {
    if (localeCode !== "ko") {
        const seo = buildExerciseSeo(exercise, measurementKind, unit, "ja");
        const primaryMuscles = exercise.metadata?.primaryMuscles?.ja || [];
        const metricSummary = measurementKind === "reps"
            ? "関連種目もあわせて確認できます。"
            : "体重別・年齢別の基準表と関連種目もあわせて確認できます。";
        const muscleDescription = primaryMuscles.length ? `主働筋は${primaryMuscles.join("・")}。` : "";
        const sectionDescription = section?.label?.ja || section?.titles?.ja ? `${section.label?.ja || section.titles?.ja}の代表種目です。` : "";
        return `${seo.descriptionPrefix}${sectionDescription}${muscleDescription}${metricSummary}`;
    }

    const seo = buildExerciseSeo(exercise, measurementKind, unit, "ko");
    const category = getCategoryLabel(section || exercise.categoryId, "ko");
    const primaryMuscles = getLocalizedMuscleGroups(exercise, "ko")[0]?.items || [];
    const metricSummary = measurementKind === "reps"
        ? "관련 운동도 함께 확인할 수 있습니다."
        : "체중별, 나이별 기준표와 관련 운동도 함께 확인할 수 있습니다.";
    const muscleDescription = primaryMuscles.length ? `주동근은 ${primaryMuscles.join(", ")}입니다. ` : "";
    return `${seo.descriptionPrefix} ${category} 대표 운동 기준이며, ${muscleDescription}${metricSummary}`;
}

function buildLocalizedCard(card, section, localeCode = "ja") {
    if (localeCode !== "ko") {
        return card;
    }

    const exerciseLike = { slug: card.slug, names: card.names };
    const measurementKind = card.measurementKind || "weight";
    const primaryMuscles = (card.primaryMuscles?.ja || []).map((item) => getMuscleName(item, localeCode));

    return {
        ...card,
        names: {
            ...(card.names || {}),
            ko: getExerciseName(exerciseLike, localeCode)
        },
        categories: {
            ...(card.categories || {}),
            ko: formatCardCategory(section.id, card.slug, measurementKind, getRelatedTagsFromCard(card, section.id, localeCode))
        },
        description: {
            ...(card.description || {}),
            ko: buildCardDescription(card, section, localeCode)
        },
        primaryMuscles: {
            ...(card.primaryMuscles || {}),
            ko: primaryMuscles
        },
        tags: {
            ...(card.tags || {}),
            ko: getRelatedTagsFromCard(card, section.id, localeCode)
        },
        aliases: {
            ...(card.aliases || {}),
            ko: CATEGORY_ALIASES_KO[section.id] || []
        },
        searchTerms: {
            ...(card.searchTerms || {}),
            ko: getSearchTerms({ slug: card.slug, names: card.names, metadata: { measurementKind, primaryMuscles: { ko: primaryMuscles } } }, section.id, localeCode)
        }
    };
}

function getRelatedTags(exercise, sectionId, localeCode = "ja") {
    if (localeCode !== "ko") {
        return exercise.metadata?.relatedTags?.ja || [];
    }

    const measurementKind = exercise.metadata?.measurementKind || "weight";
    const primaryMuscles = getLocalizedMuscleGroups(exercise, localeCode)[0]?.items || [];
    return uniqueList([
        getCategoryLabel(sectionId, localeCode),
        ...(CATEGORY_ALIASES_KO[sectionId] || []),
        ...primaryMuscles,
        ...inferEquipmentTagsKo(exercise.slug),
        ...(CATEGORY_DEFAULT_TAGS_KO[sectionId] || []),
        getMeasurementCopy(measurementKind, localeCode).pageTerm,
        ...(isBig3(exercise.slug) ? ["BIG3"] : [])
    ]);
}

function getSearchTerms(exercise, sectionId, localeCode = "ja") {
    if (localeCode !== "ko") {
        return exercise.metadata?.searchTerms?.ja || [];
    }

    return uniqueList([
        getExerciseName(exercise, localeCode),
        exercise.slug,
        ...exercise.slug.split("-"),
        ...getRelatedTags(exercise, sectionId, localeCode)
    ]);
}

function localizeExerciseHtml(html, { exercise, unit, locale = "ja", block = "" } = {}) {
    let next = localizeHtmlAssetPaths(html || "", locale);
    if (locale !== "ko") {
        return next;
    }

    const measurementKind = exercise.metadata?.measurementKind || "weight";
    const copy = getMeasurementCopy(measurementKind, locale);
    const name = getExerciseName(exercise, locale);
    const suffix = measurementKind === "weight" ? " [1RM]" : "";

    next = next.replaceAll(exercise.names?.ja || "", name);

    if (block === "average") {
        next = next.replace(/<h2 class="section-title">[\s\S]*?<\/h2>/i, `<h2 class="section-title">
            ${escapeHtml(name)} ${escapeHtml(copy.averageLabel)}${suffix}
        </h2>`);
        next = next.replace(/<p class="average-section-note">[\s\S]*?<\/p>/i, `<p class="average-section-note">${escapeHtml(buildAverageNote(measurementKind))}
        </p>`);
    }

    if (block === "standards") {
        const unitLabel = measurementKind === "weight" ? `(${unit})` : "";
        const detailLabel = measurementKind === "weight" ? "1RM" : "반복 횟수";
        next = next.replace(/<h2 class="section-title">[\s\S]*?<\/h2>/i, `<h2 class="section-title">${escapeHtml(name)} ${escapeHtml(copy.standardsLabel)}${unitLabel}</h2>`);
        next = next.replace(/男性・体重別\((kg|lb)\)データ \[[^\]]+\]/g, `남성 체중별(${unit}) 데이터 [${detailLabel}]`);
        next = next.replace(/女性・体重別\((kg|lb)\)データ \[[^\]]+\]/g, `여성 체중별(${unit}) 데이터 [${detailLabel}]`);
        next = next.replace(/男性・年齢別データ \[[^\]]+\]/g, `남성 나이별 데이터 [${detailLabel}]`);
        next = next.replace(/女性・年齢別データ \[[^\]]+\]/g, `여성 나이별 데이터 [${detailLabel}]`);
        next = next.replace(/<p class="average-section-note">[\s\S]*?<\/p>/i, `<p class="average-section-note">${escapeHtml(buildStandardsNote(exercise, unit, measurementKind))}</p>`);
    }

    next = replaceJapaneseText(next);
    next = next
        .replace(/alt="male"/g, 'alt="남성"')
        .replace(/alt="female"/g, 'alt="여성"')
        .replace(/alt="Male"/g, 'alt="남성"')
        .replace(/alt="Female"/g, 'alt="여성"')
        .replace(/alt="Official Record"/g, 'alt="공식 기록"')
        .replace(/Last Updated:/g, "업데이트:");

    return next;
}

function localizeHtmlAssetPaths(html, localeCode = "ja") {
    const prefix = assetPrefix(localeCode);
    return String(html || "")
        .replace(/(src|href)="\.\/assets\//g, `$1="${prefix}/assets/`)
        .replace(/url\(\.\/assets\//g, `url(${prefix}/assets/`);
}

function stripIntentionalLanguageSwitchText(html) {
    return String(html || "")
        .replace(/<a\b[^>]*data-lang="[^"]+"[^>]*>[\s\S]*?<\/a>/gi, "")
        .replace(/<link rel="alternate"[^>]*>/gi, "");
}

function cleanSectionLabel(text, localeCode = "ja") {
    if (localeCode === "ko") {
        return String(text || "").replace(/\s*운동/g, "").trim();
    }

    return String(text || "").replace("トレーニング", "").replace("トレ", "").trim();
}

function joinRoute(prefix, file) {
    const normalizedPrefix = prefix.endsWith("/") ? prefix : `${prefix}/`;
    return `${normalizedPrefix}${file}`;
}

function inferKoreanExerciseName(slug) {
    const tokens = slug.split("-");
    const parts = [];
    let index = 0;

    while (index < tokens.length) {
        let matched = false;
        for (let size = Math.min(4, tokens.length - index); size > 0; size -= 1) {
            const phrase = tokens.slice(index, index + size).join("-");
            const value = PHRASE_NAME_PARTS_KO[phrase] || TOKEN_NAME_PARTS_KO[phrase];
            if (value) {
                parts.push(value);
                index += size;
                matched = true;
                break;
            }
        }

        if (!matched) {
            const token = tokens[index];
            parts.push(TOKEN_NAME_PARTS_KO[token] || toTitleCase(token));
            index += 1;
        }
    }

    return parts.join(" ")
        .replace(/벤치 프레스/g, "벤치프레스")
        .replace(/레그 프레스/g, "레그프레스")
        .replace(/푸시 업/g, "푸시업")
        .replace(/풀 업/g, "풀업")
        .replace(/\s+/g, " ")
        .trim();
}

function formatCardCategory(sectionId, slug, measurementKind, tags) {
    const sectionLabel = getCategoryLabel(sectionId, "ko");
    if (isBig3(slug)) {
        return `${sectionLabel} / BIG3`;
    }

    const equipmentTag = tags.find((tag) => ["덤벨", "바벨", "머신", "케이블", "스미스머신", "맨몸"].includes(tag));
    if (measurementKind === "reps" && tags.includes("맨몸")) {
        return `${sectionLabel} / 맨몸`;
    }

    return equipmentTag ? `${sectionLabel} / ${equipmentTag}` : sectionLabel;
}

function buildCardDescription(card, section, localeCode) {
    const name = getExerciseName({ slug: card.slug, names: card.names }, localeCode);
    const sectionLabel = getCategoryLabel(section, localeCode);
    const primaryMuscles = (card.primaryMuscles?.ja || []).map((item) => getMuscleName(item, localeCode)).slice(0, 3).join(", ");
    const measurementKind = card.measurementKind || "weight";

    if (measurementKind === "reps") {
        return `${name}의 평균 반복 횟수와 기준 반복 횟수를 ${sectionLabel} 운동 기준으로 확인할 수 있습니다.`;
    }

    return `${name}의 평균 중량과 기준 중량을 ${sectionLabel} 운동 기준으로 확인할 수 있습니다.${primaryMuscles ? ` 주동근은 ${primaryMuscles}입니다.` : ""}`;
}

function getRelatedTagsFromCard(card, sectionId, localeCode) {
    const primaryMuscles = (card.primaryMuscles?.ja || []).map((item) => getMuscleName(item, localeCode));
    return uniqueList([
        getCategoryLabel(sectionId, localeCode),
        ...(CATEGORY_ALIASES_KO[sectionId] || []),
        ...primaryMuscles,
        ...inferEquipmentTagsKo(card.slug),
        ...(CATEGORY_DEFAULT_TAGS_KO[sectionId] || []),
        getMeasurementCopy(card.measurementKind || "weight", localeCode).pageTerm,
        ...(isBig3(card.slug) ? ["BIG3"] : [])
    ]);
}

function inferEquipmentTagsKo(slug) {
    const tags = [];
    if (slug.includes("dumbbell")) tags.push(EQUIPMENT_TAGS_KO["ダンベル"]);
    if (slug.includes("barbell")) tags.push(EQUIPMENT_TAGS_KO["バーベル"]);
    if (slug.includes("machine")) tags.push(EQUIPMENT_TAGS_KO["マシン"]);
    if (slug.includes("cable")) tags.push(EQUIPMENT_TAGS_KO["ケーブル"]);
    if (slug.includes("smith-machine")) tags.push(EQUIPMENT_TAGS_KO["スミスマシン"]);
    if (/push-ups|pull-ups|chin-ups|dips|muscle-ups|burpees|jumping-jack|mountain-climbers|crunches|sit-ups|leg-raise|knee-raise|toes-to-bar|superman|flutter-kicks|scissor-kicks|russian-twist/.test(slug)) {
        tags.push(EQUIPMENT_TAGS_KO["自重"]);
    }
    if (isBig3(slug)) tags.push("BIG3");
    return uniqueList(tags);
}

function isBig3(slug) {
    return ["bench-press", "deadlift", "squat"].includes(slug);
}

function buildAverageNote(measurementKind) {
    if (measurementKind === "reps") {
        return "참고: 이 기준은 한 세트에서 수행할 수 있는 평균 반복 횟수의 추정치입니다. 체중, 가동 범위, 템포 같은 개인 요인에 따라 달라질 수 있습니다. 자세한 데이터는 아래 표에서 확인하세요.";
    }

    return "참고: 이 기준은 평균적인 리프터의 1RM을 기준으로 한 추정치입니다. 체중, 나이 등 개인 요인에 따라 달라질 수 있습니다. 자세한 데이터는 아래 표에서 확인하세요.";
}

function buildStandardsNote(exercise, unit, measurementKind) {
    if (measurementKind === "reps") {
        return "참고: 표의 수치는 한 세트에서 수행할 수 있는 반복 횟수의 기준입니다. 체중별 데이터는 상대적 부담을, 나이별 데이터는 경향 차이를 보는 데 활용하세요.";
    }

    const tags = inferEquipmentTagsKo(exercise.slug);
    if (tags.includes("덤벨")) {
        return "참고: 표에 표시된 덤벨 중량은 덤벨 한 개 기준입니다.";
    }

    if (tags.some((tag) => ["머신", "케이블", "스미스머신"].includes(tag))) {
        return "참고: 머신과 케이블의 표시 중량은 제조사마다 차이가 있습니다. 같은 조건의 기구에서 비교하는 기준으로 사용하세요.";
    }

    return `참고: 일반적인 헬스장 바벨은 기본적으로 ${unit === "lb" ? "44lb" : "20kg"}입니다.`;
}

function replaceJapaneseText(html) {
    let next = html;

    Object.entries(MUSCLE_GROUPS_KO).forEach(([ja, ko]) => {
        next = next.replaceAll(ja, ko);
    });

    Object.entries(MUSCLES_KO).forEach(([ja, ko]) => {
        next = next.replaceAll(ja, ko);
    });

    JAPANESE_TO_KOREAN_TEXT.forEach(([ja, ko]) => {
        next = next.replaceAll(ja, ko);
    });

    return next;
}

function toTitleCase(value) {
    return value
        .split("-")
        .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
        .join(" ");
}

function uniqueList(values) {
    return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

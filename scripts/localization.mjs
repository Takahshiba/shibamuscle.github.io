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
        group: "グループ",
        home: "Home",
        language: "言語",
        leg: "脚",
        links: "リンク",
        male: "男性",
        moreWorkouts: "その他のワークアウト",
        muscles: "筋肉",
        musclesHeading: "鍛えられる筋肉",
        privacy: "プライバシーポリシー",
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
        group: "그룹",
        home: "홈",
        language: "언어",
        leg: "하체",
        links: "링크",
        male: "남성",
        moreWorkouts: "다른 운동",
        muscles: "근육",
        musclesHeading: "자극되는 근육",
        privacy: "개인정보 처리방침",
        shoulder: "어깨",
        support: "지원",
        wholeBody: "전신"
    },
    es: {
        ad: "Anuncio",
        arm: "Brazos",
        back: "Espalda",
        breadcrumb: "Ruta de navegación",
        categories: "Categorías",
        chest: "Pecho",
        contact: "Contacto",
        core: "Core",
        data: "Datos",
        female: "Mujeres",
        group: "Grupo",
        home: "Inicio",
        language: "Idioma",
        leg: "Piernas",
        links: "Enlaces",
        male: "Hombres",
        moreWorkouts: "Otros ejercicios",
        muscles: "Músculos",
        musclesHeading: "Músculos trabajados",
        privacy: "Política de privacidad",
        shoulder: "Hombros",
        support: "Soporte",
        wholeBody: "Cuerpo completo"
    },
    fr: {
        ad: "Annonce",
        arm: "Bras",
        back: "Dos",
        breadcrumb: "Fil d'Ariane",
        categories: "Catégories",
        chest: "Pectoraux",
        contact: "Contact",
        core: "Tronc",
        data: "Données",
        female: "Femmes",
        group: "Groupe",
        home: "Accueil",
        language: "Langue",
        leg: "Jambes",
        links: "Liens",
        male: "Hommes",
        moreWorkouts: "Autres exercices",
        muscles: "Muscles",
        musclesHeading: "Muscles ciblés",
        privacy: "Politique de confidentialité",
        shoulder: "Épaules",
        support: "Support",
        wholeBody: "Corps entier"
    }
};

const CATEGORY_NAV = [
    {
        id: "whole-body-section",
        key: "wholeBody",
        icon: "power-clean-white-icon.webp",
        descriptions: {
            ja: "デッドリフト、クリーン、スナッチなど全身連動の基準ページ",
            ko: "데드리프트, 클린, 스내치처럼 전신을 함께 쓰는 운동의 기준 페이지",
            es: "Páginas de referencia para ejercicios globales como peso muerto, clean y snatch",
            fr: "Pages de référence pour les exercices globaux comme le soulevé de terre, le clean et le snatch"
        }
    },
    {
        id: "chest-section",
        key: "chest",
        icon: "bench-press-white-icon.webp",
        descriptions: {
            ja: "プレス系の平均重量と押す種目の比較",
            ko: "프레스 계열 평균 중량과 미는 운동 비교",
            es: "Pesos medios y comparativas de ejercicios de empuje",
            fr: "Charges moyennes et comparaisons des exercices de poussée"
        }
    },
    {
        id: "back-section",
        key: "back",
        icon: "deadlift-white-icon.webp",
        descriptions: {
            ja: "ローイング、プル系、ヒンジ系の比較",
            ko: "로우, 풀, 힌지 계열 운동 비교",
            es: "Comparativas de remos, jalones y bisagras de cadera",
            fr: "Comparaisons des tirages, rowings et mouvements de charnière"
        }
    },
    {
        id: "shoulder-section",
        key: "shoulder",
        icon: "shoulder-press-white-icon.webp",
        descriptions: {
            ja: "プレス、レイズ、安定性の種目一覧",
            ko: "프레스, 레이즈, 안정성 운동 목록",
            es: "Ejercicios de press, elevaciones y estabilidad del hombro",
            fr: "Exercices de développé, d'élévation et de stabilité des épaules"
        }
    },
    {
        id: "arm-section",
        key: "arm",
        icon: "hammer-curl-white-icon.webp",
        descriptions: {
            ja: "カール、トライセプス、前腕の種目",
            ko: "컬, 삼두, 전완 운동",
            es: "Curls, tríceps y ejercicios de antebrazo",
            fr: "Curls, triceps et exercices d'avant-bras"
        }
    },
    {
        id: "leg-section",
        key: "leg",
        icon: "squat-white-icon.webp",
        descriptions: {
            ja: "スクワット、ランジ、ヒップ主導の種目",
            ko: "스쿼트, 런지, 힙 중심 운동",
            es: "Sentadillas, zancadas y ejercicios dominantes de cadera",
            fr: "Squats, fentes et exercices dominants hanche"
        }
    },
    {
        id: "core-section",
        key: "core",
        icon: "sit-ups-white-icon.webp",
        descriptions: {
            ja: "腹筋、回旋、体幹安定の種目",
            ko: "복근, 회전, 코어 안정화 운동",
            es: "Abdominales, rotación y estabilidad del core",
            fr: "Abdominaux, rotation et stabilité du tronc"
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

const CATEGORY_LABELS_ES = {
    "whole-body-section": "Cuerpo completo",
    "chest-section": "Pecho",
    "back-section": "Espalda",
    "shoulder-section": "Hombros",
    "arm-section": "Brazos",
    "leg-section": "Piernas",
    "core-section": "Core"
};

const CATEGORY_ALIASES_ES = {
    "whole-body-section": ["Ejercicios de cuerpo completo", "BIG3 / cuerpo completo"],
    "chest-section": ["Ejercicios de pecho", "Pectoral"],
    "back-section": ["Ejercicios de espalda", "Dorsal ancho"],
    "shoulder-section": ["Ejercicios de hombro", "Deltoides"],
    "arm-section": ["Ejercicios de brazos", "Bíceps", "Tríceps"],
    "leg-section": ["Ejercicios de piernas", "Tren inferior"],
    "core-section": ["Ejercicios de core", "Abdominales"]
};

const CATEGORY_DEFAULT_TAGS_ES = {
    "whole-body-section": ["Cuerpo completo", "Coordinación total"],
    "chest-section": ["Pecho", "Press"],
    "back-section": ["Espalda", "Tirón"],
    "shoulder-section": ["Hombros", "Press"],
    "arm-section": ["Brazos", "Curl"],
    "leg-section": ["Piernas", "Sentadilla"],
    "core-section": ["Core", "Abdominales"]
};

const CATEGORY_LABELS_FR = {
    "whole-body-section": "Corps entier",
    "chest-section": "Pectoraux",
    "back-section": "Dos",
    "shoulder-section": "Épaules",
    "arm-section": "Bras",
    "leg-section": "Jambes",
    "core-section": "Tronc"
};

const CATEGORY_ALIASES_FR = {
    "whole-body-section": ["Exercices corps entier", "BIG3 / corps entier"],
    "chest-section": ["Exercices pectoraux", "Pectoral"],
    "back-section": ["Exercices dos", "Grand dorsal"],
    "shoulder-section": ["Exercices épaules", "Deltoïdes"],
    "arm-section": ["Exercices bras", "Biceps", "Triceps"],
    "leg-section": ["Exercices jambes", "Bas du corps"],
    "core-section": ["Exercices de gainage", "Abdominaux"]
};

const CATEGORY_DEFAULT_TAGS_FR = {
    "whole-body-section": ["Corps entier", "Coordination globale"],
    "chest-section": ["Pectoraux", "Développé"],
    "back-section": ["Dos", "Tirage"],
    "shoulder-section": ["Épaules", "Développé"],
    "arm-section": ["Bras", "Curl"],
    "leg-section": ["Jambes", "Squat"],
    "core-section": ["Tronc", "Abdominaux"]
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

const MUSCLE_GROUPS_ES = {
    "グリップ": "Agarre",
    "主働筋": "Músculos principales",
    "主動筋": "Músculos principales",
    "副働筋": "Músculos secundarios",
    "副動筋": "Músculos secundarios",
    "安定筋": "Estabilizadores"
};

const MUSCLES_ES = {
    "なし": "Ninguno",
    "ハムストリングス": "Isquiotibiales",
    "三角筋": "Deltoides",
    "上腕三頭筋": "Tríceps braquial",
    "上腕二頭筋": "Bíceps braquial",
    "下腿三頭筋": "Tríceps sural",
    "僧帽筋": "Trapecio",
    "内転筋群": "Aductores",
    "前脛骨筋": "Tibial anterior",
    "前腕伸筋群": "Extensores del antebrazo",
    "前腕屈筋群": "Flexores del antebrazo",
    "外腹斜筋": "Oblicuo externo",
    "大円筋": "Redondo mayor",
    "大胸筋": "Pectoral mayor",
    "大胸筋上部": "Pectoral superior",
    "大胸筋下部": "Pectoral inferior",
    "大腿四頭筋": "Cuádriceps",
    "大臀筋": "Glúteo mayor",
    "広背筋": "Dorsal ancho",
    "棘上筋": "Supraespinoso",
    "棘下筋": "Infraespinoso",
    "胸鎖乳突筋": "Esternocleidomastoideo",
    "脊柱起立筋": "Erectores espinales",
    "腹直筋": "Recto abdominal"
};

const MUSCLE_GROUPS_FR = {
    "グリップ": "Prise",
    "主働筋": "Muscles principaux",
    "主動筋": "Muscles principaux",
    "副働筋": "Muscles secondaires",
    "副動筋": "Muscles secondaires",
    "安定筋": "Stabilisateurs"
};

const MUSCLES_FR = {
    "なし": "Aucun",
    "ハムストリングス": "Ischio-jambiers",
    "三角筋": "Deltoïdes",
    "上腕三頭筋": "Triceps brachial",
    "上腕二頭筋": "Biceps brachial",
    "下腿三頭筋": "Triceps sural",
    "僧帽筋": "Trapèzes",
    "内転筋群": "Adducteurs",
    "前脛骨筋": "Tibial antérieur",
    "前腕伸筋群": "Extenseurs de l'avant-bras",
    "前腕屈筋群": "Fléchisseurs de l'avant-bras",
    "外腹斜筋": "Obliques externes",
    "大円筋": "Grand rond",
    "大胸筋": "Grand pectoral",
    "大胸筋上部": "Haut des pectoraux",
    "大胸筋下部": "Bas des pectoraux",
    "大腿四頭筋": "Quadriceps",
    "大臀筋": "Grand fessier",
    "広背筋": "Grand dorsal",
    "棘上筋": "Supra-épineux",
    "棘下筋": "Infra-épineux",
    "胸鎖乳突筋": "Sterno-cléido-mastoïdien",
    "脊柱起立筋": "Érecteurs du rachis",
    "腹直筋": "Grand droit"
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

const EQUIPMENT_TAGS_ES = {
    BIG3: "BIG3",
    "ケーブル": "Cable",
    "スミスマシン": "Máquina Smith",
    "ダンベル": "Mancuernas",
    "バーベル": "Barra",
    "マシン": "Máquina",
    "自重": "Peso corporal"
};

const EQUIPMENT_TAGS_FR = {
    BIG3: "BIG3",
    "ケーブル": "Poulie",
    "スミスマシン": "Smith machine",
    "ダンベル": "Haltères",
    "バーベル": "Barre",
    "マシン": "Machine",
    "自重": "Poids du corps"
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

const EXACT_EXERCISE_NAMES_ES = {
    "ab-wheel-roller": "Rueda abdominal",
    "bench-press": "Press de banca",
    "bodyweight-squat": "Sentadilla con peso corporal",
    "burpees": "Burpees",
    "chin-ups": "Chin-ups",
    "clean": "Clean",
    "clean-and-jerk": "Clean and jerk",
    "clean-and-press": "Clean and press",
    "crunches": "Crunch abdominal",
    "deadlift": "Peso muerto",
    "dips": "Fondos",
    "front-squat": "Sentadilla frontal",
    "glute-bridge": "Puente de glúteos",
    "good-morning": "Good morning",
    "hammer-curl": "Curl martillo",
    "hip-thrust": "Hip thrust",
    "jumping-jack": "Jumping jack",
    "lat-pulldown": "Jalón al pecho",
    "lunge": "Zancada",
    "military-press": "Press militar",
    "mountain-climbers": "Mountain climbers",
    "muscle-ups": "Muscle-ups",
    "pull-ups": "Dominadas",
    "push-ups": "Flexiones",
    "romanian-deadlift": "Peso muerto rumano",
    "russian-twist": "Giro ruso",
    "sit-ups": "Sit-ups",
    "snatch": "Snatch",
    "squat": "Sentadilla",
    "sumo-deadlift": "Peso muerto sumo",
    "sumo-squat": "Sentadilla sumo",
    "superman": "Superman",
    "toes-to-bar": "Toes-to-bar",
    "wall-ball": "Wall ball"
};

const PHRASE_NAME_PARTS_ES = {
    "ab-wheel": "rueda abdominal",
    "back-extension": "extensión lumbar",
    "bench-dips": "fondos en banco",
    "bench-press": "press de banca",
    "bent-arm": "brazos flexionados",
    "bent-over": "inclinado",
    "behind-the-back": "detrás de la espalda",
    "behind-the-neck": "tras nuca",
    "bicep-curl": "curl de bíceps",
    "bodyweight": "peso corporal",
    "bulgarian-split-squat": "sentadilla búlgara",
    "calf-raise": "elevación de gemelos",
    "chest-fly": "apertura de pecho",
    "chest-press": "press de pecho",
    "chest-supported": "con apoyo de pecho",
    "clean-and-jerk": "clean and jerk",
    "clean-and-press": "clean and press",
    "clean-high-pull": "clean high pull",
    "clean-pull": "tirón de clean",
    "close-grip": "agarre cerrado",
    "concentration-curl": "curl de concentración",
    "external-rotation": "rotación externa",
    "ez-bar": "barra EZ",
    "face-pull": "face pull",
    "front-raise": "elevación frontal",
    "front-squat": "sentadilla frontal",
    "glute-bridge": "puente de glúteos",
    "glute-ham-raise": "glute ham raise",
    "glute-kickback": "patada de glúteo",
    "goblet-squat": "sentadilla goblet",
    "hack-squat": "hack squat",
    "hammer-curl": "curl martillo",
    "hang-clean": "hang clean",
    "hang-power-clean": "hang power clean",
    "hang-snatch": "hang snatch",
    "hex-bar": "barra hexagonal",
    "hanging-knee-raise": "elevación de rodillas colgado",
    "hanging-leg-raise": "elevación de piernas colgado",
    "high-pulley": "polea alta",
    "hip-abduction": "abducción de cadera",
    "hip-adduction": "aducción de cadera",
    "hip-extension": "extensión de cadera",
    "hip-thrust": "hip thrust",
    "incline-bench-press": "press de banca inclinado",
    "incline-push-ups": "flexiones inclinadas",
    "inverted-row": "remo invertido",
    "lat-pulldown": "jalón al pecho",
    "lateral-raise": "elevación lateral",
    "leg-curl": "curl femoral",
    "leg-extension": "extensión de pierna",
    "leg-press": "prensa de piernas",
    "leg-raise": "elevación de piernas",
    "muscle-snatch": "muscle snatch",
    "muscle-ups": "muscle-ups",
    "neck-curl": "curl de cuello",
    "neck-extension": "extensión de cuello",
    "neutral-grip": "agarre neutro",
    "nordic-hamstring-curl": "curl nórdico de isquios",
    "one-arm": "a un brazo",
    "overhead-squat": "sentadilla overhead",
    "pin-press": "pin press",
    "pull-through": "pull through",
    "pull-ups": "dominadas",
    "push-jerk": "push jerk",
    "push-press": "push press",
    "push-ups": "flexiones",
    "rack-pull": "rack pull",
    "reverse-fly": "apertura inversa",
    "reverse-grip": "agarre inverso",
    "reverse-hyperextension": "hiperextensión inversa",
    "reverse-wrist-curl": "curl de muñeca inverso",
    "romanchair": "silla romana",
    "romanian-deadlift": "peso muerto rumano",
    "safety-bar": "safety bar",
    "scissor-kicks": "tijeras abdominales",
    "seated-cable-row": "remo sentado en cable",
    "shoulder-press": "press de hombro",
    "side-bend": "flexión lateral",
    "side-crunches": "crunch lateral",
    "side-leg-raise": "elevación lateral de pierna",
    "single-leg": "a una pierna",
    "sit-ups": "sit-ups",
    "smith-machine": "máquina Smith",
    "split-jerk": "split jerk",
    "split-squat": "sentadilla split",
    "squat-jump": "salto con sentadilla",
    "squat-thrust": "squat thrust",
    "stiff-leg-deadlift": "peso muerto con piernas rígidas",
    "straight-arm": "brazos rectos",
    "t-bar": "barra T",
    "tricep-extension": "extensión de tríceps",
    "tricep-pushdown": "jalón de tríceps",
    "tricep-rope": "cuerda de tríceps",
    "upright-row": "remo al mentón",
    "wide-grip": "agarre amplio",
    "wrist-curl": "curl de muñeca",
    "y-raise": "elevación en Y"
};

const TOKEN_NAME_PARTS_ES = {
    abduction: "abducción",
    adduction: "aducción",
    archer: "arquero",
    arnold: "Arnold",
    back: "espalda",
    bar: "barra",
    barbell: "barra",
    bench: "banco",
    bicycle: "bicicleta",
    bicep: "bíceps",
    box: "box",
    cable: "cable",
    calf: "gemelos",
    cheat: "cheat",
    clean: "clean",
    curl: "curl",
    deadlift: "peso muerto",
    decline: "declinado",
    deficit: "con déficit",
    diamond: "diamante",
    donkey: "donkey",
    dumbbell: "mancuernas",
    extension: "extensión",
    fly: "apertura",
    floor: "en el suelo",
    flutter: "flutter",
    front: "frontal",
    glute: "glúteo",
    hamstring: "isquios",
    handstand: "pino",
    hex: "hexagonal",
    high: "alto",
    horizontal: "horizontal",
    incline: "inclinado",
    jefferson: "Jefferson",
    jm: "JM",
    kickback: "patada",
    landmine: "landmine",
    lateral: "lateral",
    log: "log",
    lying: "tumbado",
    machine: "máquina",
    meadows: "Meadows",
    military: "militar",
    one: "un",
    overhead: "overhead",
    paused: "con pausa",
    pendlay: "Pendlay",
    pike: "pike",
    pin: "pin",
    pistol: "pistol",
    power: "power",
    preacher: "predicador",
    press: "press",
    pulldown: "jalón",
    pull: "tirón",
    pullover: "pullover",
    raise: "elevación",
    renegade: "renegade",
    reverse: "inverso",
    ring: "anillas",
    roller: "rueda",
    row: "remo",
    seated: "sentado",
    shrug: "encogimiento",
    sissy: "sissy",
    sled: "trineo",
    snatch: "snatch",
    spider: "spider",
    spoto: "Spoto",
    squat: "sentadilla",
    standing: "de pie",
    strict: "estricto",
    tate: "Tate",
    thruster: "thruster",
    tricep: "tríceps",
    vertical: "vertical",
    viking: "Viking",
    walking: "caminando",
    yates: "Yates",
    zercher: "Zercher",
    zottman: "Zottman",
    z: "Z"
};

const SPANISH_EQUIPMENT_PARTS = new Map([
    ["barra", "con barra"],
    ["mancuernas", "con mancuernas"],
    ["cable", "en cable"],
    ["máquina", "en máquina"],
    ["máquina Smith", "en máquina Smith"],
    ["barra EZ", "con barra EZ"],
    ["barra hexagonal", "con barra hexagonal"],
    ["barra T", "con barra T"],
    ["anillas", "en anillas"],
    ["landmine", "con landmine"]
]);

const SPANISH_POST_MODIFIERS = new Set([
    "a un brazo",
    "a una pierna",
    "agarre amplio",
    "agarre cerrado",
    "agarre inverso",
    "agarre neutro",
    "brazos rectos",
    "con apoyo de pecho",
    "con déficit",
    "con pausa",
    "de pie",
    "declinado",
    "detrás de la espalda",
    "inclinado",
    "sentado",
    "tras nuca",
    "tumbado"
]);

const EXACT_EXERCISE_NAMES_FR = {
    "ab-wheel-roller": "Roue abdominale",
    "arnold-press": "Développé Arnold",
    "back-extension": "Extension lombaire",
    "bench-dips": "Dips sur banc",
    "bench-pin-press": "Développé couché aux pins",
    "bench-press": "Développé couché",
    "bench-pull": "Rowing sur banc",
    "bent-arm-barbell-pullover": "Pull-over barre bras fléchis",
    "bent-over-row": "Rowing buste penché",
    "bicycle-crunches": "Crunch bicyclette",
    "bodyweight-calf-raise": "Mollets au poids du corps",
    "bodyweight-squat": "Squat au poids du corps",
    "box-squat": "Box squat",
    "bulgarian-split-squat": "Squat bulgare",
    "burpees": "Burpees",
    "chest-press": "Chest press",
    "chest-supported-dumbbell-row": "Rowing haltères avec appui poitrine",
    "chin-ups": "Tractions supination",
    "clean": "Clean",
    "clean-and-jerk": "Épaulé-jeté",
    "clean-and-press": "Épaulé-développé",
    "clean-high-pull": "Clean high pull",
    "clean-pull": "Tirage de clean",
    "crunches": "Crunch",
    "deadlift": "Soulevé de terre",
    "decline-crunches": "Crunch décliné",
    "decline-sit-ups": "Sit-up décliné",
    "diamond-push-ups": "Pompes diamant",
    "dips": "Dips",
    "donkey-calf-raise": "Mollets donkey",
    "ez-bar-curl": "Curl barre EZ",
    "face-pull": "Face pull",
    "floor-press": "Développé au sol",
    "flutter-kicks": "Battements de jambes",
    "front-squat": "Front squat",
    "glute-bridge": "Pont fessier",
    "glute-ham-raise": "Glute ham raise",
    "glute-kickback": "Kickback fessier",
    "goblet-squat": "Goblet squat",
    "good-morning": "Good morning",
    "hack-squat": "Hack squat",
    "hammer-curl": "Curl marteau",
    "handstand-push-ups": "Pompes en équilibre",
    "hang-clean": "Hang clean",
    "hang-power-clean": "Hang power clean",
    "hang-snatch": "Hang snatch",
    "hanging-knee-raise": "Relevé de genoux suspendu",
    "hanging-leg-raise": "Relevé de jambes suspendu",
    "hex-bar-deadlift": "Soulevé de terre à la trap bar",
    "hex-bar-shrug": "Shrug à la trap bar",
    "high-pulley-crunches": "Crunch à la poulie haute",
    "hip-abduction": "Abduction de hanche",
    "hip-adduction": "Adduction de hanche",
    "hip-extension": "Extension de hanche",
    "hip-thrust": "Hip thrust",
    "horizontal-leg-press": "Presse à cuisses horizontale",
    "inverted-row": "Rowing inversé",
    "jefferson-deadlift": "Soulevé de terre Jefferson",
    "jefferson-squat": "Squat Jefferson",
    "jm-press": "JM press",
    "jumping-jack": "Jumping jack",
    "lat-pulldown": "Tirage vertical",
    "leg-extension": "Leg extension",
    "log-press": "Log press",
    "lunge": "Fente",
    "meadows-row": "Rowing Meadows",
    "military-press": "Développé militaire",
    "mountain-climbers": "Mountain climbers",
    "muscle-snatch": "Muscle snatch",
    "muscle-ups": "Muscle-ups",
    "neck-curl": "Curl de cou",
    "neck-extension": "Extension de cou",
    "neutral-grip-pull-ups": "Tractions prise neutre",
    "nordic-hamstring-curl": "Nordic curl",
    "overhead-squat": "Overhead squat",
    "pendlay-row": "Rowing Pendlay",
    "pike-push-ups": "Pompes pike",
    "pistol-squat": "Pistol squat",
    "power-clean": "Power clean",
    "power-snatch": "Power snatch",
    "preacher-curl": "Curl pupitre",
    "pull-ups": "Tractions",
    "push-jerk": "Push jerk",
    "push-press": "Push press",
    "push-ups": "Pompes",
    "rack-pull": "Rack pull",
    "renegade-row": "Renegade row",
    "reverse-crunches": "Crunch inversé",
    "reverse-hyperextension": "Hyperextension inversée",
    "ring-dips": "Dips aux anneaux",
    "ring-muscle-ups": "Muscle-ups aux anneaux",
    "romanchair-side-bend": "Flexion latérale à la chaise romaine",
    "romanian-deadlift": "Soulevé de terre roumain",
    "russian-twist": "Russian twist",
    "safety-bar-squat": "Squat à la safety bar",
    "scissor-kicks": "Ciseaux abdominaux",
    "seated-cable-row": "Rowing assis à la poulie",
    "seated-dips-machine": "Dips assis à la machine",
    "shoulder-press": "Développé épaules",
    "side-crunches": "Crunch latéral",
    "side-leg-raise": "Relevé latéral de jambe",
    "side-lunge": "Fente latérale",
    "single-leg-deadlift": "Soulevé de terre une jambe",
    "sissy-squat": "Sissy squat",
    "sit-ups": "Sit-ups",
    "sled-leg-press": "Presse à cuisses",
    "snatch": "Snatch",
    "snatch-deadlift": "Soulevé de terre prise snatch",
    "snatch-pull": "Tirage de snatch",
    "spider-curl": "Spider curl",
    "split-jerk": "Split jerk",
    "split-squat": "Split squat",
    "squat": "Squat",
    "squat-jump": "Squat jump",
    "squat-thrust": "Squat thrust",
    "stiff-leg-deadlift": "Soulevé de terre jambes tendues",
    "strict-curl": "Curl strict",
    "sumo-deadlift": "Soulevé de terre sumo",
    "sumo-squat": "Squat sumo",
    "superman": "Superman",
    "t-bar-row": "Rowing T-bar",
    "thruster": "Thruster",
    "toes-to-bar": "Toes-to-bar",
    "upright-row": "Tirage menton",
    "vertical-leg-press": "Presse à cuisses verticale",
    "walking-lunge": "Fentes marchées",
    "wall-ball": "Wall ball",
    "wrist-curl": "Curl poignets",
    "yates-row": "Rowing Yates",
    "z-press": "Z press",
    "zercher-deadlift": "Soulevé de terre Zercher",
    "zercher-squat": "Squat Zercher",
    "zottman-curl": "Curl Zottman"
};

const PHRASE_NAME_PARTS_FR = {
    "ab-wheel": "roue abdominale",
    "back-extension": "extension lombaire",
    "bench-dips": "dips sur banc",
    "bench-press": "développé couché",
    "bent-arm": "bras fléchis",
    "bent-over": "buste penché",
    "behind-the-back": "derrière le dos",
    "behind-the-neck": "nuque",
    "bicep-curl": "curl biceps",
    "bodyweight": "poids du corps",
    "bulgarian-split-squat": "squat bulgare",
    "calf-raise": "élévation mollets",
    "chest-fly": "écarté pectoraux",
    "chest-press": "chest press",
    "chest-supported": "avec appui poitrine",
    "clean-and-jerk": "épaulé-jeté",
    "clean-and-press": "épaulé-développé",
    "clean-high-pull": "clean high pull",
    "clean-pull": "tirage de clean",
    "close-grip": "prise serrée",
    "concentration-curl": "curl concentration",
    "external-rotation": "rotation externe",
    "ez-bar": "barre EZ",
    "face-pull": "face pull",
    "front-raise": "élévation frontale",
    "front-squat": "front squat",
    "glute-bridge": "pont fessier",
    "glute-ham-raise": "glute ham raise",
    "glute-kickback": "kickback fessier",
    "goblet-squat": "goblet squat",
    "hack-squat": "hack squat",
    "hammer-curl": "curl marteau",
    "hang-clean": "hang clean",
    "hang-power-clean": "hang power clean",
    "hang-snatch": "hang snatch",
    "hex-bar": "trap bar",
    "hanging-knee-raise": "relevé de genoux suspendu",
    "hanging-leg-raise": "relevé de jambes suspendu",
    "high-pulley": "poulie haute",
    "hip-abduction": "abduction de hanche",
    "hip-adduction": "adduction de hanche",
    "hip-extension": "extension de hanche",
    "hip-thrust": "hip thrust",
    "incline-bench-press": "développé incliné",
    "incline-push-ups": "pompes inclinées",
    "inverted-row": "rowing inversé",
    "lat-pulldown": "tirage vertical",
    "lateral-raise": "élévation latérale",
    "leg-curl": "leg curl",
    "leg-extension": "leg extension",
    "leg-press": "presse à cuisses",
    "leg-raise": "relevé de jambes",
    "muscle-snatch": "muscle snatch",
    "muscle-ups": "muscle-ups",
    "neck-curl": "curl de cou",
    "neck-extension": "extension de cou",
    "neutral-grip": "prise neutre",
    "nordic-hamstring-curl": "nordic curl",
    "one-arm": "unilatéral",
    "overhead-squat": "overhead squat",
    "pin-press": "pin press",
    "pull-through": "pull through",
    "pull-ups": "tractions",
    "push-jerk": "push jerk",
    "push-press": "push press",
    "push-ups": "pompes",
    "rack-pull": "rack pull",
    "reverse-fly": "écarté inversé",
    "reverse-grip": "prise inversée",
    "reverse-hyperextension": "hyperextension inversée",
    "reverse-wrist-curl": "curl poignets inversé",
    "romanchair": "chaise romaine",
    "romanian-deadlift": "soulevé de terre roumain",
    "safety-bar": "safety bar",
    "scissor-kicks": "ciseaux abdominaux",
    "seated-cable-row": "rowing assis à la poulie",
    "shoulder-press": "développé épaules",
    "side-bend": "flexion latérale",
    "side-crunches": "crunch latéral",
    "side-leg-raise": "relevé latéral de jambe",
    "single-leg": "une jambe",
    "sit-ups": "sit-ups",
    "smith-machine": "Smith machine",
    "split-jerk": "split jerk",
    "split-squat": "split squat",
    "squat-jump": "squat jump",
    "squat-thrust": "squat thrust",
    "stiff-leg-deadlift": "soulevé de terre jambes tendues",
    "straight-arm": "bras tendus",
    "t-bar": "T-bar",
    "tricep-extension": "extension triceps",
    "tricep-pushdown": "pushdown triceps",
    "tricep-rope": "corde triceps",
    "upright-row": "tirage menton",
    "wide-grip": "prise large",
    "wrist-curl": "curl poignets",
    "y-raise": "élévation en Y"
};

const TOKEN_NAME_PARTS_FR = {
    abduction: "abduction",
    adduction: "adduction",
    archer: "archer",
    arnold: "Arnold",
    back: "dos",
    bar: "barre",
    barbell: "barre",
    bench: "banc",
    bicycle: "bicyclette",
    bicep: "biceps",
    box: "box",
    cable: "poulie",
    calf: "mollets",
    cheat: "cheat",
    clean: "clean",
    curl: "curl",
    deadlift: "soulevé de terre",
    decline: "décliné",
    deficit: "déficit",
    diamond: "diamant",
    donkey: "donkey",
    dumbbell: "haltères",
    extension: "extension",
    fly: "écarté",
    floor: "au sol",
    flutter: "battements",
    front: "avant",
    glute: "fessier",
    hamstring: "ischios",
    handstand: "équilibre",
    hex: "hexagonale",
    high: "haut",
    horizontal: "horizontal",
    incline: "incliné",
    jefferson: "Jefferson",
    jm: "JM",
    kickback: "kickback",
    landmine: "landmine",
    lateral: "latéral",
    log: "log",
    lying: "couché",
    machine: "machine",
    meadows: "Meadows",
    military: "militaire",
    one: "un",
    overhead: "overhead",
    paused: "avec pause",
    pendlay: "Pendlay",
    pike: "pike",
    pin: "pin",
    pistol: "pistol",
    power: "power",
    preacher: "pupitre",
    press: "développé",
    pulldown: "tirage",
    pull: "tirage",
    pullover: "pull-over",
    raise: "élévation",
    renegade: "renegade",
    reverse: "inversé",
    ring: "anneaux",
    roller: "roue",
    row: "rowing",
    seated: "assis",
    shrug: "shrug",
    sissy: "sissy",
    sled: "presse",
    snatch: "snatch",
    spider: "spider",
    spoto: "Spoto",
    squat: "squat",
    standing: "debout",
    strict: "strict",
    tate: "Tate",
    thruster: "thruster",
    tricep: "triceps",
    vertical: "vertical",
    viking: "Viking",
    walking: "marché",
    yates: "Yates",
    zercher: "Zercher",
    zottman: "Zottman",
    z: "Z"
};

const FRENCH_EQUIPMENT_PARTS = new Map([
    ["barre", "à la barre"],
    ["haltères", "aux haltères"],
    ["poulie", "à la poulie"],
    ["machine", "à la machine"],
    ["Smith machine", "à la Smith machine"],
    ["barre EZ", "à la barre EZ"],
    ["trap bar", "à la trap bar"],
    ["T-bar", "à la T-bar"],
    ["anneaux", "aux anneaux"],
    ["landmine", "à la landmine"]
]);

const FRENCH_POST_MODIFIERS = new Set([
    "avec appui poitrine",
    "avec pause",
    "bras fléchis",
    "bras tendus",
    "buste penché",
    "décliné",
    "derrière le dos",
    "déficit",
    "incliné",
    "nuque",
    "prise inversée",
    "prise large",
    "prise neutre",
    "prise serrée",
    "unilatéral",
    "une jambe"
]);

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

const JAPANESE_TO_SPANISH_TEXT = [
    ["その他のワークアウト", "Otros ejercicios"],
    ["ワークアウトデータベース", "Base de datos de ejercicios"],
    ["鍛えられる筋肉", "Músculos trabajados"],
    ["テーブルの見方", "Cómo leer la tabla"],
    ["世界記録", "Récord mundial"],
    ["公式記録", "Récord oficial"],
    ["プライバシーポリシー", "Política de privacidad"],
    ["お問い合わせ", "Contacto"],
    ["リンク", "Enlaces"],
    ["言語", "Idioma"],
    ["男性・体重別", "Hombres por peso corporal"],
    ["女性・体重別", "Mujeres por peso corporal"],
    ["男性・年齢別", "Hombres por edad"],
    ["女性・年齢別", "Mujeres por edad"],
    ["平均レップ数", "Repeticiones medias"],
    ["基準レップ数", "Estándares de repeticiones"],
    ["平均重量", "Peso medio"],
    ["基準重量", "Estándares de fuerza"],
    ["レップ数", "Repeticiones"],
    ["体重別", "Por peso corporal"],
    ["年齢別", "Por edad"],
    ["レベル", "Nivel"],
    ["グループ", "Grupo"],
    ["データ", "Datos"],
    ["説明", "Descripción"],
    ["分布", "Distribución"],
    ["体重", "Peso corporal"],
    ["年齢", "Edad"],
    ["男性", "Hombres"],
    ["女性", "Mujeres"],
    ["筋肉", "Músculos"],
    ["重量", "Peso"],
    ["基礎", "Principiante"],
    ["初級", "Novato"],
    ["中級", "Intermedio"],
    ["上級", "Avanzado"],
    ["プロ", "Élite"],
    ["上位", "Top"],
    ["下位", "Parte inferior"],
    ["正しいフォームを身につけ、1か月以上継続してトレーニングに励む。", "Domina la técnica correcta y entrena de forma constante durante al menos 1 mes."],
    ["6か月以上継続的にトレーニングに励む。", "Entrena de forma constante durante al menos 6 meses."],
    ["２年以上継続的にトレーニングに励む。", "Entrena de forma constante durante al menos 2 años."],
    ["5年以上継続的にトレーニングに励む。", "Entrena de forma constante durante más de 5 años."],
    ["5年以上当該メニューを専門にトレーニング。", "Entrena este ejercicio de forma especializada durante más de 5 años."],
    ["注：", "Nota: "]
].sort((left, right) => right[0].length - left[0].length);

const JAPANESE_TO_FRENCH_TEXT = [
    ["その他のワークアウト", "Autres exercices"],
    ["ワークアウトデータベース", "Base de données de musculation"],
    ["鍛えられる筋肉", "Muscles ciblés"],
    ["テーブルの見方", "Comment lire le tableau"],
    ["世界記録", "Record du monde"],
    ["公式記録", "Record officiel"],
    ["プライバシーポリシー", "Politique de confidentialité"],
    ["お問い合わせ", "Contact"],
    ["リンク", "Liens"],
    ["言語", "Langue"],
    ["男性・体重別", "Hommes par poids de corps"],
    ["女性・体重別", "Femmes par poids de corps"],
    ["男性・年齢別", "Hommes par âge"],
    ["女性・年齢別", "Femmes par âge"],
    ["平均レップ数", "Répétitions moyennes"],
    ["基準レップ数", "Standards de répétitions"],
    ["平均重量", "Charge moyenne"],
    ["基準重量", "Standards de force"],
    ["レップ数", "Répétitions"],
    ["体重別", "Par poids de corps"],
    ["年齢別", "Par âge"],
    ["レベル", "Niveau"],
    ["グループ", "Groupe"],
    ["データ", "Données"],
    ["説明", "Description"],
    ["分布", "Répartition"],
    ["体重", "Poids de corps"],
    ["年齢", "Âge"],
    ["男性", "Hommes"],
    ["女性", "Femmes"],
    ["筋肉", "Muscles"],
    ["重量", "Charge"],
    ["基礎", "Débutant"],
    ["初級", "Novice"],
    ["中級", "Intermédiaire"],
    ["上級", "Avancé"],
    ["プロ", "Élite"],
    ["上位", "Top"],
    ["下位", "Bas"],
    ["正しいフォームを身につけ、1か月以上継続してトレーニングに励む。", "Maîtrise la bonne technique et s'entraîne régulièrement depuis au moins 1 mois."],
    ["6か月以上継続的にトレーニングに励む。", "S'entraîne régulièrement depuis au moins 6 mois."],
    ["２年以上継続的にトレーニングに励む。", "S'entraîne régulièrement depuis au moins 2 ans."],
    ["5年以上継続的にトレーニングに励む。", "S'entraîne régulièrement depuis plus de 5 ans."],
    ["5年以上当該メニューを専門にトレーニング。", "S'entraîne spécifiquement sur cet exercice depuis plus de 5 ans."],
    ["注：", "Note : "]
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

function getCategoryLabels(localeCode) {
    if (localeCode === "ko") return CATEGORY_LABELS_KO;
    if (localeCode === "es") return CATEGORY_LABELS_ES;
    if (localeCode === "fr") return CATEGORY_LABELS_FR;
    return null;
}

function getCategoryAliases(localeCode) {
    if (localeCode === "ko") return CATEGORY_ALIASES_KO;
    if (localeCode === "es") return CATEGORY_ALIASES_ES;
    if (localeCode === "fr") return CATEGORY_ALIASES_FR;
    return {};
}

function getCategoryDefaultTags(localeCode) {
    if (localeCode === "ko") return CATEGORY_DEFAULT_TAGS_KO;
    if (localeCode === "es") return CATEGORY_DEFAULT_TAGS_ES;
    if (localeCode === "fr") return CATEGORY_DEFAULT_TAGS_FR;
    return {};
}

function getEquipmentTags(localeCode) {
    if (localeCode === "ko") return EQUIPMENT_TAGS_KO;
    if (localeCode === "es") return EQUIPMENT_TAGS_ES;
    if (localeCode === "fr") return EQUIPMENT_TAGS_FR;
    return {};
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
    const localizedLabels = getCategoryLabels(localeCode);

    if (typeof sectionOrId === "string") {
        return localizedLabels?.[sectionOrId] || sectionOrId;
    }

    if (!sectionOrId) {
        return localizedLabels?.["whole-body-section"] || "全身";
    }

    if (localeCode !== "ja") {
        return sectionOrId.label?.[localeCode] || sectionOrId.titles?.[localeCode] || localizedLabels?.[sectionOrId.id] || sectionOrId.label?.ja || sectionOrId.titles?.ja || "";
    }

    return sectionOrId.label?.ja || sectionOrId.titles?.ja || sectionOrId.title || "";
}

function getCategoryDescription(sectionOrId, localeCode = "ja") {
    const id = typeof sectionOrId === "string" ? sectionOrId : sectionOrId?.id;
    const navItem = CATEGORY_NAV.find((item) => item.id === id);
    return navItem?.descriptions[localeCode] || navItem?.descriptions.ja || "";
}

function getMeasurementCopy(kind = "weight", localeCode = "ja") {
    if (localeCode === "es") {
        if (kind === "reps") {
            return {
                averageLabel: "Repeticiones medias",
                standardsLabel: "Estándares de repeticiones",
                detailLabel: "Repeticiones",
                pageTerm: "Repeticiones",
                note: "Los valores de la tabla son una referencia de repeticiones posibles en una serie."
            };
        }

        return {
            averageLabel: "Peso medio",
            standardsLabel: "Estándares de fuerza",
            detailLabel: "1RM",
            pageTerm: "Peso",
            note: "Los valores de la tabla son estimaciones basadas en 1RM."
        };
    }

    if (localeCode === "fr") {
        if (kind === "reps") {
            return {
                averageLabel: "Répétitions moyennes",
                standardsLabel: "Standards de répétitions",
                detailLabel: "Répétitions",
                pageTerm: "Répétitions",
                note: "Les valeurs du tableau indiquent une estimation des répétitions possibles sur une série."
            };
        }

        return {
            averageLabel: "Charge moyenne",
            standardsLabel: "Standards de force",
            detailLabel: "1RM",
            pageTerm: "Charge",
            note: "Les valeurs du tableau sont des estimations basées sur le 1RM."
        };
    }

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
    if (localeCode === "es") {
        const slug = exerciseOrCard.slug || "";
        return exerciseOrCard.names?.es || EXACT_EXERCISE_NAMES_ES[slug] || inferSpanishExerciseName(slug);
    }

    if (localeCode === "fr") {
        const slug = exerciseOrCard.slug || "";
        return exerciseOrCard.names?.fr || EXACT_EXERCISE_NAMES_FR[slug] || inferFrenchExerciseName(slug);
    }

    if (localeCode === "ko") {
        const slug = exerciseOrCard.slug || "";
        return exerciseOrCard.names?.ko || EXACT_EXERCISE_NAMES_KO[slug] || inferKoreanExerciseName(slug);
    }

    return exerciseOrCard.names?.ja || exerciseOrCard.name || exerciseOrCard.slug || "";
}

function getMuscleGroupLabel(label, localeCode = "ja") {
    if (localeCode === "es") {
        return MUSCLE_GROUPS_ES[label] || label;
    }

    if (localeCode === "fr") {
        return MUSCLE_GROUPS_FR[label] || label;
    }

    return localeCode === "ko" ? MUSCLE_GROUPS_KO[label] || label : label;
}

function getMuscleName(name, localeCode = "ja") {
    if (localeCode === "es") {
        return MUSCLES_ES[name] || name;
    }

    if (localeCode === "fr") {
        return MUSCLES_FR[name] || name;
    }

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
    if (localeCode === "ja") {
        return exercise.metadata?.summary?.ja || "";
    }

    if (localeCode === "es") {
        const name = getExerciseName(exercise, localeCode);
        const category = getCategoryLabel(section || exercise.categoryId, localeCode);
        const muscles = getLocalizedMuscleGroups(exercise, localeCode)[0]?.items?.slice(0, 3).join(", ") || "músculos principales";

        if (measurementKind === "reps") {
            return `${name} es un ejercicio de ${category.toLowerCase()} centrado en ${muscles}. Puedes consultar las repeticiones medias y los estándares de repeticiones en una sola página.`;
        }

        return `${name} permite consultar el peso medio y los estándares de fuerza como referencia dentro de ${category.toLowerCase()}. Los músculos principales son ${muscles}.`;
    }

    if (localeCode === "fr") {
        const name = getExerciseName(exercise, localeCode);
        const category = getCategoryLabel(section || exercise.categoryId, localeCode);
        const muscles = getLocalizedMuscleGroups(exercise, localeCode)[0]?.items?.slice(0, 3).join(", ") || "muscles principaux";

        if (measurementKind === "reps") {
            return `${name} est un exercice de ${category.toLowerCase()} axé sur ${muscles}. Consulte les répétitions moyennes et les standards de répétitions sur une seule page.`;
        }

        return `${name} permet de consulter la charge moyenne et les standards de force comme repères pour ${category.toLowerCase()}. Les muscles principaux sont ${muscles}.`;
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
    if (localeCode === "ja") {
        return exercise.metadata?.description?.ja || "";
    }

    if (localeCode === "es") {
        const name = getExerciseName(exercise, localeCode);
        const category = getCategoryLabel(section || exercise.categoryId, localeCode);
        const muscles = getLocalizedMuscleGroups(exercise, localeCode)[0]?.items?.slice(0, 3).join(", ") || "músculos principales";

        if (measurementKind === "reps") {
            return `${name} es una opción útil dentro de ${category.toLowerCase()}, especialmente para trabajo con peso corporal o baja carga. Compara repeticiones medias y estándares mientras revisas el estímulo en ${muscles}.`;
        }

        return `${name} es un ejercicio representativo de ${category.toLowerCase()}. Usa principalmente ${muscles} y permite comparar peso medio, estándares de fuerza y ejercicios relacionados.`;
    }

    if (localeCode === "fr") {
        const name = getExerciseName(exercise, localeCode);
        const category = getCategoryLabel(section || exercise.categoryId, localeCode);
        const muscles = getLocalizedMuscleGroups(exercise, localeCode)[0]?.items?.slice(0, 3).join(", ") || "muscles principaux";

        if (measurementKind === "reps") {
            return `${name} est une option utile pour ${category.toLowerCase()}, surtout au poids du corps ou à faible charge. Compare les répétitions moyennes et les standards tout en vérifiant le travail sur ${muscles}.`;
        }

        return `${name} est un exercice représentatif pour ${category.toLowerCase()}. Il sollicite surtout ${muscles} et permet de comparer charge moyenne, standards de force et exercices liés.`;
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
    if (localeCode === "ja") {
        const copy = getMeasurementCopy(measurementKind, "ja");
        const unitLabel = unit === "lb" ? "lb表" : "kg表";
        return {
            title: `${exercise.names.ja}の${copy.averageLabel}・${copy.standardsLabel} | Shiba Muscle`,
            descriptionPrefix: `${exercise.names.ja}の${copy.averageLabel}と${copy.standardsLabel}を${unitLabel}で確認できるページです。`
        };
    }

    if (localeCode === "es") {
        const copy = getMeasurementCopy(measurementKind, "es");
        const name = getExerciseName(exercise, "es");
        const unitLabel = unit === "lb" ? "tabla en lb" : "tabla en kg";

        return {
            title: `${name}: ${copy.averageLabel} y ${copy.standardsLabel} | Shiba Muscle`,
            descriptionPrefix: `Página para consultar ${copy.averageLabel.toLowerCase()} y ${copy.standardsLabel.toLowerCase()} de ${name} con ${unitLabel}.`
        };
    }

    if (localeCode === "fr") {
        const copy = getMeasurementCopy(measurementKind, "fr");
        const name = getExerciseName(exercise, "fr");
        const unitLabel = unit === "lb" ? "tableau en lb" : "tableau en kg";

        return {
            title: `${name} : ${copy.averageLabel} et ${copy.standardsLabel} | Shiba Muscle`,
            descriptionPrefix: `Page pour consulter ${copy.averageLabel.toLowerCase()} et ${copy.standardsLabel.toLowerCase()} de ${name} avec un ${unitLabel}.`
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
    if (localeCode === "ja") {
        const seo = buildExerciseSeo(exercise, measurementKind, unit, "ja");
        const primaryMuscles = exercise.metadata?.primaryMuscles?.ja || [];
        const metricSummary = measurementKind === "reps"
            ? "関連種目もあわせて確認できます。"
            : "体重別・年齢別の基準表と関連種目もあわせて確認できます。";
        const muscleDescription = primaryMuscles.length ? `主働筋は${primaryMuscles.join("・")}。` : "";
        const sectionDescription = section?.label?.ja || section?.titles?.ja ? `${section.label?.ja || section.titles?.ja}の代表種目です。` : "";
        return `${seo.descriptionPrefix}${sectionDescription}${muscleDescription}${metricSummary}`;
    }

    if (localeCode === "es") {
        const seo = buildExerciseSeo(exercise, measurementKind, unit, "es");
        const category = getCategoryLabel(section || exercise.categoryId, "es");
        const primaryMuscles = getLocalizedMuscleGroups(exercise, "es")[0]?.items || [];
        const metricSummary = measurementKind === "reps"
            ? "También puedes revisar ejercicios relacionados."
            : "Incluye tablas por peso corporal, tablas por edad y ejercicios relacionados.";
        const muscleDescription = primaryMuscles.length ? `Los músculos principales son ${primaryMuscles.join(", ")}. ` : "";
        return `${seo.descriptionPrefix} Es una referencia de ${category.toLowerCase()}. ${muscleDescription}${metricSummary}`;
    }

    if (localeCode === "fr") {
        const seo = buildExerciseSeo(exercise, measurementKind, unit, "fr");
        const category = getCategoryLabel(section || exercise.categoryId, "fr");
        const primaryMuscles = getLocalizedMuscleGroups(exercise, "fr")[0]?.items || [];
        const metricSummary = measurementKind === "reps"
            ? "Tu peux aussi consulter les exercices liés."
            : "Inclut des tableaux par poids de corps, des tableaux par âge et des exercices liés.";
        const muscleDescription = primaryMuscles.length ? `Les muscles principaux sont ${primaryMuscles.join(", ")}. ` : "";
        return `${seo.descriptionPrefix} C'est une référence pour ${category.toLowerCase()}. ${muscleDescription}${metricSummary}`;
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
    if (localeCode === "ja") {
        return card;
    }

    const exerciseLike = { slug: card.slug, names: card.names };
    const measurementKind = card.measurementKind || "weight";
    const primaryMuscles = (card.primaryMuscles?.ja || []).map((item) => getMuscleName(item, localeCode));

    return {
        ...card,
        names: {
            ...(card.names || {}),
            [localeCode]: getExerciseName(exerciseLike, localeCode)
        },
        categories: {
            ...(card.categories || {}),
            [localeCode]: formatCardCategory(section.id, card.slug, measurementKind, getRelatedTagsFromCard(card, section.id, localeCode), localeCode)
        },
        description: {
            ...(card.description || {}),
            [localeCode]: buildCardDescription(card, section, localeCode)
        },
        primaryMuscles: {
            ...(card.primaryMuscles || {}),
            [localeCode]: primaryMuscles
        },
        tags: {
            ...(card.tags || {}),
            [localeCode]: getRelatedTagsFromCard(card, section.id, localeCode)
        },
        aliases: {
            ...(card.aliases || {}),
            [localeCode]: getCategoryAliases(localeCode)[section.id] || []
        },
        searchTerms: {
            ...(card.searchTerms || {}),
            [localeCode]: getSearchTerms({ slug: card.slug, names: card.names, metadata: { measurementKind, primaryMuscles: { [localeCode]: primaryMuscles } } }, section.id, localeCode)
        }
    };
}

function getRelatedTags(exercise, sectionId, localeCode = "ja") {
    if (localeCode === "ja") {
        return exercise.metadata?.relatedTags?.ja || [];
    }

    const measurementKind = exercise.metadata?.measurementKind || "weight";
    const primaryMuscles = getLocalizedMuscleGroups(exercise, localeCode)[0]?.items || [];
    const aliases = getCategoryAliases(localeCode);
    const defaultTags = getCategoryDefaultTags(localeCode);

    return uniqueList([
        getCategoryLabel(sectionId, localeCode),
        ...(aliases[sectionId] || []),
        ...primaryMuscles,
        ...inferEquipmentTags(exercise.slug, localeCode),
        ...(defaultTags[sectionId] || []),
        getMeasurementCopy(measurementKind, localeCode).pageTerm,
        ...(isBig3(exercise.slug) ? ["BIG3"] : [])
    ]);
}

function getSearchTerms(exercise, sectionId, localeCode = "ja") {
    if (localeCode === "ja") {
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
    if (locale === "ja") {
        return next;
    }

    const measurementKind = exercise.metadata?.measurementKind || "weight";
    const copy = getMeasurementCopy(measurementKind, locale);
    const name = getExerciseName(exercise, locale);
    const suffix = measurementKind === "weight" ? " [1RM]" : "";
    const isSpanish = locale === "es";
    const isFrench = locale === "fr";

    next = next.replaceAll(exercise.names?.ja || "", name);

    if (block === "average") {
        const heading = isSpanish || isFrench
            ? `${copy.averageLabel} de ${name}${suffix}`
            : `${name} ${copy.averageLabel}${suffix}`;
        next = next.replace(/<h2 class="section-title">[\s\S]*?<\/h2>/i, `<h2 class="section-title">
            ${escapeHtml(heading)}
        </h2>`);
        next = next.replace(/<p class="average-section-note">[\s\S]*?<\/p>/i, `<p class="average-section-note">${escapeHtml(buildAverageNote(measurementKind, locale))}
        </p>`);
    }

    if (block === "standards") {
        const unitLabel = measurementKind === "weight" ? `(${unit})` : "";
        const detailLabel = measurementKind === "weight" ? "1RM" : copy.detailLabel;
        const heading = isSpanish || isFrench
            ? `${copy.standardsLabel} de ${name}${unitLabel ? ` ${unitLabel}` : ""}`
            : `${name} ${copy.standardsLabel}${unitLabel}`;
        next = next.replace(/<h2 class="section-title">[\s\S]*?<\/h2>/i, `<h2 class="section-title">${escapeHtml(heading)}</h2>`);

        if (isSpanish || isFrench) {
            const maleByWeight = isFrench ? `Hommes par poids de corps (${unit}) [${detailLabel}]` : `Hombres por peso corporal (${unit}) [${detailLabel}]`;
            const femaleByWeight = isFrench ? `Femmes par poids de corps (${unit}) [${detailLabel}]` : `Mujeres por peso corporal (${unit}) [${detailLabel}]`;
            const maleByAge = isFrench ? `Hommes par âge [${detailLabel}]` : `Hombres por edad [${detailLabel}]`;
            const femaleByAge = isFrench ? `Femmes par âge [${detailLabel}]` : `Mujeres por edad [${detailLabel}]`;
            next = next.replace(/男性・体重別\((kg|lb)\)データ \[[^\]]+\]/g, maleByWeight);
            next = next.replace(/女性・体重別\((kg|lb)\)データ \[[^\]]+\]/g, femaleByWeight);
            next = next.replace(/男性・年齢別データ \[[^\]]+\]/g, maleByAge);
            next = next.replace(/女性・年齢別データ \[[^\]]+\]/g, femaleByAge);
        } else {
            next = next.replace(/男性・体重別\((kg|lb)\)データ \[[^\]]+\]/g, `남성 체중별(${unit}) 데이터 [${detailLabel}]`);
            next = next.replace(/女性・体重別\((kg|lb)\)データ \[[^\]]+\]/g, `여성 체중별(${unit}) 데이터 [${detailLabel}]`);
            next = next.replace(/男性・年齢別データ \[[^\]]+\]/g, `남성 나이별 데이터 [${detailLabel}]`);
            next = next.replace(/女性・年齢別データ \[[^\]]+\]/g, `여성 나이별 데이터 [${detailLabel}]`);
        }

        next = next.replace(/<p class="average-section-note">[\s\S]*?<\/p>/i, `<p class="average-section-note">${escapeHtml(buildStandardsNote(exercise, unit, measurementKind, locale))}</p>`);
    }

    next = replaceJapaneseText(next, locale);

    if (isSpanish) {
        next = next
            .replace(/alt="male"/g, 'alt="Hombres"')
            .replace(/alt="female"/g, 'alt="Mujeres"')
            .replace(/alt="Male"/g, 'alt="Hombres"')
            .replace(/alt="Female"/g, 'alt="Mujeres"')
            .replace(/alt="Official Record"/g, 'alt="Récord oficial"')
            .replace(/Last Updated:/g, "Actualizado:");
    } else if (isFrench) {
        next = next
            .replace(/alt="male"/g, 'alt="Hommes"')
            .replace(/alt="female"/g, 'alt="Femmes"')
            .replace(/alt="Male"/g, 'alt="Hommes"')
            .replace(/alt="Female"/g, 'alt="Femmes"')
            .replace(/alt="Official Record"/g, 'alt="Record officiel"')
            .replace(/Last Updated:/g, "Mis à jour :")
            .replace(/Men's Raw/g, "Hommes raw")
            .replace(/Men's Equipped/g, "Hommes équipé")
            .replace(/Women's Raw/g, "Femmes raw")
            .replace(/Women's Equipped/g, "Femmes équipé")
            .replace(/Heaviest/g, "Plus lourd")
            .replace(/Overall/g, "toutes catégories")
            .replace(/Official Record/g, "Record officiel");
    } else {
        next = next
            .replace(/alt="male"/g, 'alt="남성"')
            .replace(/alt="female"/g, 'alt="여성"')
            .replace(/alt="Male"/g, 'alt="남성"')
            .replace(/alt="Female"/g, 'alt="여성"')
            .replace(/alt="Official Record"/g, 'alt="공식 기록"')
            .replace(/Last Updated:/g, "업데이트:");
    }

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
    if (localeCode === "es") {
        return String(text || "").replace(/\s*ejercicios?/gi, "").trim();
    }

    if (localeCode === "fr") {
        return String(text || "").replace(/\s*exercices?/gi, "").trim();
    }

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

function inferSpanishExerciseName(slug) {
    const tokens = slug.split("-");
    const parts = [];
    let index = 0;

    while (index < tokens.length) {
        let matched = false;
        for (let size = Math.min(5, tokens.length - index); size > 0; size -= 1) {
            const phrase = tokens.slice(index, index + size).join("-");
            const value = PHRASE_NAME_PARTS_ES[phrase] || TOKEN_NAME_PARTS_ES[phrase];
            if (value) {
                parts.push(value);
                index += size;
                matched = true;
                break;
            }
        }

        if (!matched) {
            const token = tokens[index];
            parts.push(TOKEN_NAME_PARTS_ES[token] || token);
            index += 1;
        }
    }

    const equipment = [];
    const modifiers = [];
    const base = [];

    parts.forEach((part) => {
        if (SPANISH_EQUIPMENT_PARTS.has(part)) {
            equipment.push(SPANISH_EQUIPMENT_PARTS.get(part));
        } else if (SPANISH_POST_MODIFIERS.has(part)) {
            modifiers.push(part);
        } else {
            base.push(part);
        }
    });

    const name = [...base, ...modifiers, ...equipment].join(" ")
        .replace(/press press/g, "press")
        .replace(/curl curl/g, "curl")
        .replace(/remo remo/g, "remo")
        .replace(/peso muerto peso muerto/g, "peso muerto")
        .replace(/sentadilla sentadilla/g, "sentadilla")
        .replace(/\s+/g, " ")
        .trim();

    return capitalizeSpanish(name || slug.replace(/-/g, " "));
}

function inferFrenchExerciseName(slug) {
    const tokens = slug.split("-");
    const parts = [];
    let index = 0;

    while (index < tokens.length) {
        let matched = false;
        for (let size = Math.min(5, tokens.length - index); size > 0; size -= 1) {
            const phrase = tokens.slice(index, index + size).join("-");
            const value = PHRASE_NAME_PARTS_FR[phrase] || TOKEN_NAME_PARTS_FR[phrase];
            if (value) {
                parts.push(value);
                index += size;
                matched = true;
                break;
            }
        }

        if (!matched) {
            const token = tokens[index];
            parts.push(TOKEN_NAME_PARTS_FR[token] || token);
            index += 1;
        }
    }

    const equipment = [];
    const modifiers = [];
    const base = [];

    parts.forEach((part) => {
        if (FRENCH_EQUIPMENT_PARTS.has(part)) {
            equipment.push(FRENCH_EQUIPMENT_PARTS.get(part));
        } else if (FRENCH_POST_MODIFIERS.has(part)) {
            modifiers.push(part);
        } else {
            base.push(part);
        }
    });

    const name = [...base, ...modifiers, ...equipment].join(" ")
        .replace(/développé développé/g, "développé")
        .replace(/curl curl/g, "curl")
        .replace(/rowing rowing/g, "rowing")
        .replace(/soulevé de terre soulevé de terre/g, "soulevé de terre")
        .replace(/squat squat/g, "squat")
        .replace(/\s+/g, " ")
        .trim();

    return capitalizeFrench(name || slug.replace(/-/g, " "));
}

function formatCardCategory(sectionId, slug, measurementKind, tags, localeCode = "ko") {
    const sectionLabel = getCategoryLabel(sectionId, localeCode);
    if (isBig3(slug)) {
        return `${sectionLabel} / BIG3`;
    }

    const localizedEquipment = Object.values(getEquipmentTags(localeCode));
    const bodyweightTag = getEquipmentTags(localeCode)["自重"];
    const equipmentTag = tags.find((tag) => localizedEquipment.includes(tag));
    if (measurementKind === "reps" && tags.includes(bodyweightTag)) {
        return `${sectionLabel} / ${bodyweightTag}`;
    }

    return equipmentTag ? `${sectionLabel} / ${equipmentTag}` : sectionLabel;
}

function buildCardDescription(card, section, localeCode) {
    const name = getExerciseName({ slug: card.slug, names: card.names }, localeCode);
    const sectionLabel = getCategoryLabel(section, localeCode);
    const primaryMuscles = (card.primaryMuscles?.ja || []).map((item) => getMuscleName(item, localeCode)).slice(0, 3).join(", ");
    const measurementKind = card.measurementKind || "weight";

    if (localeCode === "es") {
        if (measurementKind === "reps") {
            return `Consulta repeticiones medias y estándares de ${name} dentro de ${sectionLabel.toLowerCase()}.`;
        }

        return `Consulta el peso medio y los estándares de fuerza de ${name} dentro de ${sectionLabel.toLowerCase()}.${primaryMuscles ? ` Músculos principales: ${primaryMuscles}.` : ""}`;
    }

    if (localeCode === "fr") {
        if (measurementKind === "reps") {
            return `Consulte les répétitions moyennes et les standards de ${name} pour ${sectionLabel.toLowerCase()}.`;
        }

        return `Consulte la charge moyenne et les standards de force de ${name} pour ${sectionLabel.toLowerCase()}.${primaryMuscles ? ` Muscles principaux : ${primaryMuscles}.` : ""}`;
    }

    if (measurementKind === "reps") {
        return `${name}의 평균 반복 횟수와 기준 반복 횟수를 ${sectionLabel} 운동 기준으로 확인할 수 있습니다.`;
    }

    return `${name}의 평균 중량과 기준 중량을 ${sectionLabel} 운동 기준으로 확인할 수 있습니다.${primaryMuscles ? ` 주동근은 ${primaryMuscles}입니다.` : ""}`;
}

function getRelatedTagsFromCard(card, sectionId, localeCode) {
    const primaryMuscles = (card.primaryMuscles?.ja || []).map((item) => getMuscleName(item, localeCode));
    const aliases = getCategoryAliases(localeCode);
    const defaultTags = getCategoryDefaultTags(localeCode);
    return uniqueList([
        getCategoryLabel(sectionId, localeCode),
        ...(aliases[sectionId] || []),
        ...primaryMuscles,
        ...inferEquipmentTags(card.slug, localeCode),
        ...(defaultTags[sectionId] || []),
        getMeasurementCopy(card.measurementKind || "weight", localeCode).pageTerm,
        ...(isBig3(card.slug) ? ["BIG3"] : [])
    ]);
}

function inferEquipmentTags(slug, localeCode = "ko") {
    const equipmentTags = getEquipmentTags(localeCode);
    const tags = [];
    if (slug.includes("dumbbell")) tags.push(equipmentTags["ダンベル"]);
    if (slug.includes("barbell")) tags.push(equipmentTags["バーベル"]);
    if (slug.includes("machine")) tags.push(equipmentTags["マシン"]);
    if (slug.includes("cable")) tags.push(equipmentTags["ケーブル"]);
    if (slug.includes("smith-machine")) tags.push(equipmentTags["スミスマシン"]);
    if (/push-ups|pull-ups|chin-ups|dips|muscle-ups|burpees|jumping-jack|mountain-climbers|crunches|sit-ups|leg-raise|knee-raise|toes-to-bar|superman|flutter-kicks|scissor-kicks|russian-twist/.test(slug)) {
        tags.push(equipmentTags["自重"]);
    }
    if (isBig3(slug)) tags.push("BIG3");
    return uniqueList(tags);
}

function isBig3(slug) {
    return ["bench-press", "deadlift", "squat"].includes(slug);
}

function buildAverageNote(measurementKind, localeCode = "ko") {
    if (localeCode === "es") {
        if (measurementKind === "reps") {
            return "Nota: estos valores son estimaciones de repeticiones medias que pueden realizarse en una serie. Pueden variar según el peso corporal, el rango de movimiento, el tempo y otros factores personales. Consulta los datos detallados en la tabla inferior.";
        }

        return "Nota: estos estándares son estimaciones de 1RM basadas en levantadores promedio. Pueden variar según el peso corporal, la edad y otros factores personales. Consulta los datos detallados en la tabla inferior.";
    }

    if (localeCode === "fr") {
        if (measurementKind === "reps") {
            return "Note : ces valeurs sont des estimations des répétitions moyennes réalisables sur une série. Elles peuvent varier selon le poids de corps, l'amplitude, le tempo et d'autres facteurs personnels. Consulte les données détaillées dans le tableau ci-dessous.";
        }

        return "Note : ces standards sont des estimations de 1RM basées sur des pratiquants moyens. Ils peuvent varier selon le poids de corps, l'âge et d'autres facteurs personnels. Consulte les données détaillées dans le tableau ci-dessous.";
    }

    if (measurementKind === "reps") {
        return "참고: 이 기준은 한 세트에서 수행할 수 있는 평균 반복 횟수의 추정치입니다. 체중, 가동 범위, 템포 같은 개인 요인에 따라 달라질 수 있습니다. 자세한 데이터는 아래 표에서 확인하세요.";
    }

    return "참고: 이 기준은 평균적인 리프터의 1RM을 기준으로 한 추정치입니다. 체중, 나이 등 개인 요인에 따라 달라질 수 있습니다. 자세한 데이터는 아래 표에서 확인하세요.";
}

function buildStandardsNote(exercise, unit, measurementKind, localeCode = "ko") {
    if (localeCode === "es") {
        if (measurementKind === "reps") {
            return "Nota: los valores de la tabla son una referencia de repeticiones posibles en una serie. Usa los datos por peso corporal para estimar la carga relativa y los datos por edad para ver tendencias.";
        }

        const tags = inferEquipmentTags(exercise.slug, localeCode);
        if (tags.includes("Mancuernas")) {
            return "Nota: el peso de mancuerna mostrado en la tabla corresponde a una sola mancuerna.";
        }

        if (tags.some((tag) => ["Máquina", "Cable", "Máquina Smith"].includes(tag))) {
            return "Nota: el peso indicado en máquinas y cables puede variar según el fabricante. Úsalo como referencia para comparar en equipos con condiciones similares.";
        }

        return `Nota: una barra estándar de gimnasio suele pesar ${unit === "lb" ? "44 lb" : "20 kg"}.`;
    }

    if (localeCode === "fr") {
        if (measurementKind === "reps") {
            return "Note : les valeurs du tableau sont une référence des répétitions possibles sur une série. Utilise les données par poids de corps pour estimer la charge relative et les données par âge pour observer les tendances.";
        }

        const tags = inferEquipmentTags(exercise.slug, localeCode);
        if (tags.includes("Haltères")) {
            return "Note : la charge d'haltère indiquée dans le tableau correspond à un seul haltère.";
        }

        if (tags.some((tag) => ["Machine", "Poulie", "Smith machine"].includes(tag))) {
            return "Note : la charge affichée sur les machines et les poulies peut varier selon le fabricant. Utilise ces valeurs comme repères dans des conditions comparables.";
        }

        return `Note : une barre standard de salle de sport pèse généralement ${unit === "lb" ? "44 lb" : "20 kg"}.`;
    }

    if (measurementKind === "reps") {
        return "참고: 표의 수치는 한 세트에서 수행할 수 있는 반복 횟수의 기준입니다. 체중별 데이터는 상대적 부담을, 나이별 데이터는 경향 차이를 보는 데 활용하세요.";
    }

    const tags = inferEquipmentTags(exercise.slug, localeCode);
    if (tags.includes("덤벨")) {
        return "참고: 표에 표시된 덤벨 중량은 덤벨 한 개 기준입니다.";
    }

    if (tags.some((tag) => ["머신", "케이블", "스미스머신"].includes(tag))) {
        return "참고: 머신과 케이블의 표시 중량은 제조사마다 차이가 있습니다. 같은 조건의 기구에서 비교하는 기준으로 사용하세요.";
    }

    return `참고: 일반적인 헬스장 바벨은 기본적으로 ${unit === "lb" ? "44lb" : "20kg"}입니다.`;
}

function replaceJapaneseText(html, localeCode = "ko") {
    let next = html;
    const muscleGroups = localeCode === "fr" ? MUSCLE_GROUPS_FR : localeCode === "es" ? MUSCLE_GROUPS_ES : MUSCLE_GROUPS_KO;
    const muscles = localeCode === "fr" ? MUSCLES_FR : localeCode === "es" ? MUSCLES_ES : MUSCLES_KO;
    const replacements = localeCode === "fr" ? JAPANESE_TO_FRENCH_TEXT : localeCode === "es" ? JAPANESE_TO_SPANISH_TEXT : JAPANESE_TO_KOREAN_TEXT;

    Object.entries(muscleGroups).forEach(([ja, localized]) => {
        next = next.replaceAll(ja, localized);
    });

    Object.entries(muscles).forEach(([ja, localized]) => {
        next = next.replaceAll(ja, localized);
    });

    replacements.forEach(([ja, localized]) => {
        next = next.replaceAll(ja, localized);
    });

    return next;
}

function capitalizeSpanish(value) {
    const text = String(value || "").trim();
    return text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}` : "";
}

function capitalizeFrench(value) {
    const text = String(value || "").trim();
    return text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}` : "";
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

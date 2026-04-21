const HTML_ENTITY_MAP = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"'
};

export {
    buildExerciseDescription,
    buildExerciseMetadata,
    buildExerciseSeo,
    buildExerciseSummary,
    buildMetricNote,
    decodeHtml,
    escapeAttribute,
    escapeHtml,
    extractAverageSnapshot,
    extractFeaturedMuscles,
    extractTableValue,
    findSectionTaxonomy,
    formatCardCategory,
    getMeasurementCopy,
    inferEquipmentTags,
    inferMeasurementKind,
    normalizeText,
    slugTokens,
    stripTags,
    uniqueList
};

function normalizeText(text) {
    return (text || "").replace(/\s+/g, " ").trim();
}

function decodeHtml(value) {
    return String(value || "")
        .replace(/&(#x?[0-9a-fA-F]+|[a-z]+);/g, (_, entity) => {
            if (entity.startsWith("#x")) {
                return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
            }

            if (entity.startsWith("#")) {
                return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
            }

            return HTML_ENTITY_MAP[entity] || `&${entity};`;
        });
}

function stripTags(html) {
    return String(html || "")
        .replace(/<br\s*\/?>/gi, " / ")
        .replace(/<[^>]+>/g, " ");
}

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function escapeAttribute(value) {
    return escapeHtml(value);
}

function uniqueList(values) {
    return [...new Set(values.map((value) => normalizeText(value)).filter(Boolean))];
}

function inferMeasurementKind(exercise) {
    const blocks = Object.values(exercise.variants || {}).flatMap((variant) => {
        return [variant.averageBlock || "", variant.standardsBlock || ""];
    }).join("\n");

    return /レップ数/.test(blocks) ? "reps" : "weight";
}

function getMeasurementCopy(kind) {
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

function findSectionTaxonomy(taxonomy, sectionId) {
    return taxonomy.sections.find((section) => section.id === sectionId) || null;
}

function extractFeaturedMuscles(exercise) {
    const primary = exercise.muscles.find((group) => group.label.includes("主働"))?.items || [];
    if (primary.length) {
        return primary;
    }

    return exercise.muscles[0]?.items || [];
}

function slugTokens(slug) {
    return uniqueList(slug.split("-").filter(Boolean));
}

function inferEquipmentTags(exercise) {
    const slug = exercise.slug;
    const name = exercise.names?.ja || "";
    const tags = [];

    if (/dumbbell|ダンベル/i.test(slug) || /ダンベル/.test(name)) {
        tags.push("ダンベル");
    }

    if (/barbell|バーベル/i.test(slug) || /バーベル/.test(name)) {
        tags.push("バーベル");
    }

    if (/machine|マシン/i.test(slug) || /マシン/.test(name)) {
        tags.push("マシン");
    }

    if (/cable|ケーブル/i.test(slug) || /ケーブル/.test(name)) {
        tags.push("ケーブル");
    }

    if (/smith/.test(slug) || /スミスマシン/.test(name)) {
        tags.push("スミスマシン");
    }

    if (/push-ups|pull-ups|chin-ups|dips|muscle-ups|burpees|jumping-jack|mountain-climbers|crunches|sit-ups|leg-raise|leg-raises|knee-raise|toes-to-bar|superman|plank|flutter-kicks|scissor-kicks|russian-twist/.test(slug)) {
        tags.push("自重");
    }

    if (["bench-press", "deadlift", "squat"].includes(slug)) {
        tags.push("BIG3");
    }

    return uniqueList(tags);
}

function buildExerciseSummary(exercise, section, measurementKind) {
    const primaryMuscles = extractFeaturedMuscles(exercise);
    const sectionLabel = section?.label?.ja || exercise.categoryTitle || "";
    const musclesText = primaryMuscles.slice(0, 3).join("・");

    if (measurementKind === "reps") {
        return `${exercise.names.ja}は${sectionLabel}の中でも${musclesText}を中心に鍛える種目です。平均レップ数と基準レップ数を同じ導線で確認できます。`;
    }

    return `${exercise.names.ja}の平均重量と基準重量を、${sectionLabel}の代表種目として確認できます。主働筋は${musclesText}です。`;
}

function buildExerciseDescription(exercise, section, measurementKind) {
    const primaryMuscles = extractFeaturedMuscles(exercise);
    const musclesText = primaryMuscles.slice(0, 3).join("・");
    const sectionLabel = section?.label?.ja || exercise.categoryTitle || "";

    if (measurementKind === "reps") {
        return `${exercise.names.ja}は${sectionLabel}で使いやすい自重・低負荷寄りの種目です。${musclesText}を中心に鍛えながら、平均レップ数と基準レップ数を比較できます。`;
    }

    return `${exercise.names.ja}は${sectionLabel}の代表種目です。${musclesText}を主働筋として使い、平均重量、基準重量、関連種目を横断して確認できます。`;
}

function buildExerciseSeo(exercise, measurementKind, unit) {
    const copy = getMeasurementCopy(measurementKind);
    const unitLabel = unit === "lb" ? "lb表" : "kg表";

    return {
        title: `${exercise.names.ja}の${copy.averageLabel}・${copy.standardsLabel} | Shiba Muscle`,
        descriptionPrefix: `${exercise.names.ja}の${copy.averageLabel}と${copy.standardsLabel}を${unitLabel}で確認できるページです。`
    };
}

function buildMetricNote(exercise, unit, measurementKind, equipmentTags) {
    if (measurementKind === "reps") {
        return "注：表中の数値は1セットで行えるレップ数の目安です。体重別は相対負荷、年齢別は傾向の違いを見るために使えます。";
    }

    if (equipmentTags.includes("ダンベル")) {
        return "注：表中のダンベルの重さはダンベル1個あたりの重さです。";
    }

    if (equipmentTags.includes("マシン") || equipmentTags.includes("ケーブル") || equipmentTags.includes("スミスマシン")) {
        return "注：マシンやケーブルの表示重量はメーカー差があります。同条件の器具での比較目安として使ってください。";
    }

    return `注：ジムのバーベルは基本的に${unit === "lb" ? "44lb" : "20kg"}です。`;
}

function buildExerciseMetadata(exercise, taxonomy) {
    const measurementKind = inferMeasurementKind(exercise);
    const section = findSectionTaxonomy(taxonomy, exercise.categoryId);
    const primaryMuscles = extractFeaturedMuscles(exercise);
    const equipmentTags = inferEquipmentTags(exercise);
    const legacyTitles = section?.legacyTitles?.ja || [];
    const aliases = section?.aliases?.ja || [];
    const copy = getMeasurementCopy(measurementKind);
    const relatedTags = uniqueList([
        section?.label?.ja,
        ...legacyTitles,
        ...aliases,
        ...primaryMuscles,
        ...equipmentTags,
        ...(section?.defaultTags?.ja || []),
        copy.pageTerm
    ]);
    const searchTerms = uniqueList([
        exercise.names.ja,
        exercise.names.ja.replace(/\s+/g, ""),
        ...slugTokens(exercise.slug),
        ...relatedTags
    ]);

    return {
        category: {
            id: exercise.categoryId,
            label: {
                ja: section?.label?.ja || exercise.categoryTitle || ""
            },
            aliases: {
                ja: uniqueList([...(legacyTitles || []), ...(aliases || [])])
            }
        },
        measurementKind,
        primaryMuscles: {
            ja: primaryMuscles
        },
        description: {
            ja: buildExerciseDescription(exercise, section, measurementKind)
        },
        summary: {
            ja: buildExerciseSummary(exercise, section, measurementKind)
        },
        relatedTags: {
            ja: relatedTags
        },
        searchTerms: {
            ja: searchTerms
        },
        seo: {
            ja: {
                title: buildExerciseSeo(exercise, measurementKind, "kg").title,
                description: buildExerciseSeo(exercise, measurementKind, "kg").descriptionPrefix
            }
        }
    };
}

function formatCardCategory(section, exercise, metadata) {
    const sectionLabel = section?.label?.ja || metadata?.category?.label?.ja || exercise.categoryTitle || "";
    const tags = metadata?.relatedTags?.ja || [];

    if (tags.includes("BIG3")) {
        return `${sectionLabel} / BIG3`;
    }

    if (metadata?.measurementKind === "reps" && tags.includes("自重")) {
        return `${sectionLabel} / 自重`;
    }

    const equipmentTag = tags.find((tag) => ["ダンベル", "バーベル", "マシン", "ケーブル", "スミスマシン"].includes(tag));
    if (equipmentTag) {
        return `${sectionLabel} / ${equipmentTag}`;
    }

    return sectionLabel;
}

function extractTableRows(tableHtml) {
    const body = (tableHtml.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i) || [])[1] || "";

    return Array.from(body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)).map((match) => {
        return Array.from(match[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)).map((cell) => {
            return normalizeText(decodeHtml(stripTags(cell[1])));
        });
    });
}

function extractAverageSnapshot(exercise, unit, rowLabel = "中級") {
    const variant = exercise.variants?.[unit];
    if (!variant?.averageBlock) {
        return null;
    }

    const rows = extractTableRows(variant.averageBlock);
    const row = rows.find((current) => current[0] === rowLabel) || rows[0];
    if (!row) {
        return null;
    }

    return {
        label: row[0],
        male: row[1] || "",
        female: row[2] || ""
    };
}

function extractStandardsTabTable(html, tabId) {
    const pattern = new RegExp(`<div class="tab(?:[^"]*)?"[^>]*id="${tabId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[\\s\\S]*?<table[^>]*>([\\s\\S]*?)<\\/table>`, "i");
    const match = html.match(pattern);
    return match?.[1] || "";
}

function extractTableValue(exercise, unit, section, options = {}) {
    const variant = exercise.variants?.[unit];
    if (!variant) {
        return "";
    }

    if (section === "average") {
        const rows = extractTableRows(variant.averageBlock);
        const row = rows.find((current) => current[0] === options.row);
        if (!row) {
            return "";
        }

        if (options.column === "male") {
            return row[1] || "";
        }

        if (options.column === "female") {
            return row[2] || "";
        }

        return "";
    }

    if (section === "standards") {
        const tableHtml = extractStandardsTabTable(variant.standardsBlock, options.tabId);
        const rows = extractTableRows(tableHtml);
        const headerRow = (tableHtml.match(/<thead[^>]*>\s*<tr[^>]*>([\s\S]*?)<\/tr>\s*<\/thead>/i) || [])[1] || "";
        const headers = Array.from(headerRow.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)).map((cell) => normalizeText(decodeHtml(stripTags(cell[1]))));
        const row = rows.find((current) => current[0] === options.row);
        const columnIndex = headers.findIndex((header) => header === options.column);

        if (!row || columnIndex === -1) {
            return "";
        }

        return row[columnIndex] || "";
    }

    return "";
}

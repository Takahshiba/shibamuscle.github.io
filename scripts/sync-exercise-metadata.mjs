#!/usr/bin/env node

import { join } from "node:path";

import {
    buildExerciseMetadata,
    buildMetricNote,
    findSectionTaxonomy,
    formatCardCategory,
    getMeasurementCopy,
    inferEquipmentTags
} from "./exercise-metadata.mjs";
import {
    EXERCISE_SRC_ROOT,
    buildExerciseFileIndex,
    loadCatalog,
    loadExerciseFiles,
    loadTaxonomy,
    readJson,
    writeJson
} from "./source-data.mjs";

const taxonomy = loadTaxonomy();
const catalog = loadCatalog();
const exerciseFiles = loadExerciseFiles();

let updatedExercises = 0;

for (const file of exerciseFiles) {
    const exercisePath = join(EXERCISE_SRC_ROOT, file);
    const exercise = readJson(exercisePath);
    const metadata = buildExerciseMetadata(exercise, taxonomy);
    const section = findSectionTaxonomy(taxonomy, exercise.categoryId);

    exercise.categoryTitle = section?.label?.ja || exercise.categoryTitle;
    exercise.metadata = metadata;

    const equipmentTags = inferEquipmentTags(exercise);

    Object.entries(exercise.variants || {}).forEach(([unit, variant]) => {
        variant.averageBlock = normalizeAverageBlock(exercise, variant.averageBlock, metadata.measurementKind);
        variant.standardsBlock = normalizeStandardsBlock(exercise, variant.standardsBlock, unit, metadata.measurementKind, equipmentTags);
    });

    writeJson(exercisePath, exercise);
    updatedExercises += 1;
}

const exerciseIndex = buildExerciseFileIndex(exerciseFiles.map((file) => readJson(join(EXERCISE_SRC_ROOT, file))));

catalog.sections = catalog.sections.map((section) => {
    const sectionTaxonomy = findSectionTaxonomy(taxonomy, section.id);
    return {
        ...section,
        titles: {
            ...(section.titles || {}),
            ja: sectionTaxonomy?.label?.ja || section.titles?.ja || ""
        },
        cards: section.cards.map((card) => {
            const exercise = exerciseIndex.bySlug.get(card.slug);
            if (!exercise) {
                return card;
            }

            const metadata = exercise.metadata || buildExerciseMetadata(exercise, taxonomy);
            const sectionSearchTerms = [
                sectionTaxonomy?.label?.ja,
                ...(sectionTaxonomy?.aliases?.ja || []),
                ...(sectionTaxonomy?.legacyTitles?.ja || [])
            ].filter(Boolean);

            return {
                ...card,
                names: {
                    ...(card.names || {}),
                    ja: exercise.names.ja
                },
                categories: {
                    ...(card.categories || {}),
                    ja: formatCardCategory(sectionTaxonomy, exercise, metadata)
                },
                measurementKind: metadata.measurementKind,
                description: {
                    ja: metadata.summary?.ja || metadata.description?.ja || ""
                },
                primaryMuscles: {
                    ja: metadata.primaryMuscles?.ja || []
                },
                tags: {
                    ja: [...new Set([...(metadata.relatedTags?.ja || []), ...(sectionTaxonomy?.defaultTags?.ja || [])])]
                },
                aliases: {
                    ja: [...new Set([...(metadata.category?.aliases?.ja || []), ...sectionSearchTerms])]
                },
                searchTerms: {
                    ja: [...new Set([...(metadata.searchTerms?.ja || []), ...sectionSearchTerms])]
                }
            };
        })
    };
});

writeJson(join(process.cwd(), "src", "catalog.json"), catalog);

console.log(`Synced metadata for ${updatedExercises} exercise sources and normalized src/catalog.json.`);

function normalizeAverageBlock(exercise, html, measurementKind) {
    const copy = getMeasurementCopy(measurementKind);
    const note = measurementKind === "reps"
        ? "注：これらの基準は1セットで行える平均レップ数の目安です。体重、可動域、テンポなどの個人的要因によって変わります。より詳細なデータは以下のとおりです。"
        : "注：これらの基準は平均的なリフターを基準にした1RMの目安です。体重や年齢などの個人的要因によって異なる場合があります。より詳細なデータは以下のとおりです。";

    let next = html || "";
    const suffix = measurementKind === "weight" ? " [1RM]" : "";

    next = next.replace(/<h2 class="section-title">[\s\S]*?<\/h2>/i, `<h2 class="section-title">
            ${exercise.names.ja} ${copy.averageLabel}${suffix}
        </h2>`);
    next = next.replace(/<p class="average-section-note">[\s\S]*?<\/p>/i, `<p class="average-section-note">${note}
        </p>`);

    return next;
}

function normalizeStandardsBlock(exercise, html, unit, measurementKind, equipmentTags) {
    const copy = getMeasurementCopy(measurementKind);
    const note = buildMetricNote(exercise, unit, measurementKind, equipmentTags);
    const unitLabel = measurementKind === "weight" ? `(${unit})` : "";
    const detailLabel = measurementKind === "weight" ? "1RM" : "レップ数";

    let next = html || "";

    next = next.replace(/<h2 class="section-title">[\s\S]*?<\/h2>/i, `<h2 class="section-title">${exercise.names.ja} ${copy.standardsLabel}${unitLabel}</h2>`);
    next = next.replace(/男性・体重別\((kg|lb)\)データ \[[^\]]+\]/g, `男性・体重別(${unit})データ [${detailLabel}]`);
    next = next.replace(/女性・体重別\((kg|lb)\)データ \[[^\]]+\]/g, `女性・体重別(${unit})データ [${detailLabel}]`);
    next = next.replace(/男性・年齢別データ \[[^\]]+\]/g, `男性・年齢別データ [${detailLabel}]`);
    next = next.replace(/女性・年齢別データ \[[^\]]+\]/g, `女性・年齢別データ [${detailLabel}]`);
    next = next.replace(/<p class="average-section-note">[\s\S]*?<\/p>\s*<\/div>\s*<\/div>\s*<\/div>\s*$/i, `<p class="average-section-note">${note}</p>
            </div>
        </div>
    </div>
`);

    return next;
}

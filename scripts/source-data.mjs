import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const SRC_ROOT = join(ROOT, "src");
const EXERCISE_SRC_ROOT = join(SRC_ROOT, "exercises");
const PAGES_ROOT = join(SRC_ROOT, "pages");
const ASSETS_ROOT = join(ROOT, "assets");

const CATALOG_PATH = join(SRC_ROOT, "catalog.json");
const TAXONOMY_PATH = join(SRC_ROOT, "taxonomy.json");
const DISCOVERY_PATH = join(SRC_ROOT, "discovery.json");

export {
    ASSETS_ROOT,
    CATALOG_PATH,
    DISCOVERY_PATH,
    EXERCISE_SRC_ROOT,
    PAGES_ROOT,
    ROOT,
    SRC_ROOT,
    TAXONOMY_PATH,
    buildExerciseFileIndex,
    ensureDirectory,
    getBaseSlugFromFile,
    getUnitFromFile,
    loadCatalog,
    loadDiscovery,
    loadExerciseFiles,
    loadExercises,
    loadPages,
    loadTaxonomy,
    readJson,
    writeJson
};

function readJson(filePath) {
    return JSON.parse(readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
    writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function ensureDirectory(dirPath) {
    mkdirSync(dirPath, { recursive: true });
}

function loadCatalog() {
    return readJson(CATALOG_PATH);
}

function loadTaxonomy() {
    return readJson(TAXONOMY_PATH);
}

function loadDiscovery() {
    return readJson(DISCOVERY_PATH);
}

function loadPages() {
    return readdirSync(PAGES_ROOT)
        .filter((file) => file.endsWith(".json"))
        .sort((left, right) => left.localeCompare(right))
        .map((file) => readJson(join(PAGES_ROOT, file)));
}

function loadExerciseFiles() {
    return readdirSync(EXERCISE_SRC_ROOT)
        .filter((file) => file.endsWith(".json"))
        .sort((left, right) => left.localeCompare(right));
}

function loadExercises() {
    return loadExerciseFiles().map((file) => readJson(join(EXERCISE_SRC_ROOT, file)));
}

function buildExerciseFileIndex(exercises) {
    const bySlug = new Map();
    const byFile = new Map();

    exercises.forEach((exercise) => {
        bySlug.set(exercise.slug, exercise);

        Object.entries(exercise.variants || {}).forEach(([unit, variant]) => {
            byFile.set(variant.file, { exercise, unit });
        });
    });

    return {
        byFile,
        bySlug
    };
}

function getUnitFromFile(file) {
    if (file.startsWith("lb_")) {
        return "lb";
    }

    if (file.startsWith("kg_")) {
        return "kg";
    }

    return null;
}

function getBaseSlugFromFile(file) {
    const unit = getUnitFromFile(file);
    if (!unit) {
        return file.replace(/\.html$/, "");
    }

    return file.replace(/^(kg|lb)_/, "").replace(/\.html$/, "");
}

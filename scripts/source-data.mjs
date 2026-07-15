import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SRC_ROOT = join(ROOT, "src");
const EXERCISE_SRC_ROOT = join(SRC_ROOT, "exercises");
const PAGES_ROOT = join(SRC_ROOT, "pages");
const ASSETS_ROOT = join(ROOT, "assets");

const CATALOG_PATH = join(SRC_ROOT, "catalog.json");
const TAXONOMY_PATH = join(SRC_ROOT, "taxonomy.json");
const DISCOVERY_PATH = join(SRC_ROOT, "discovery.json");
const LOCALES_PATH = join(SRC_ROOT, "locales.json");
const SLUG_ALIASES_PATH = join(SRC_ROOT, "slug-aliases.json");
const sourceCreatedCache = new Map();
const sourceLastmodCache = new Map();

export {
    ASSETS_ROOT,
    CATALOG_PATH,
    DISCOVERY_PATH,
    EXERCISE_SRC_ROOT,
    LOCALES_PATH,
    PAGES_ROOT,
    ROOT,
    SLUG_ALIASES_PATH,
    SRC_ROOT,
    TAXONOMY_PATH,
    buildExerciseFileIndex,
    ensureDirectory,
    getBaseSlugFromFile,
    getSourceCreatedIso,
    getSourceCreatedMs,
    getSourceLastmodIso,
    getSourceLastmodMs,
    getUnitFromFile,
    loadCatalog,
    loadDiscovery,
    loadExerciseFiles,
    loadExercises,
    loadLocales,
    loadPages,
    loadSlugAliases,
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

function getSourceLastmodIso(filePaths) {
    const timestamps = (Array.isArray(filePaths) ? filePaths : [filePaths])
        .filter((filePath) => existsSync(filePath))
        .map((filePath) => getSourceLastmodMs(filePath))
        .filter((timestamp) => Number.isFinite(timestamp));
    const newestTimestamp = timestamps.length ? Math.max(...timestamps) : Date.now();

    return new Date(newestTimestamp).toISOString();
}

function getSourceCreatedIso(filePaths) {
    const timestamps = (Array.isArray(filePaths) ? filePaths : [filePaths])
        .filter((filePath) => existsSync(filePath))
        .map((filePath) => getSourceCreatedMs(filePath))
        .filter((timestamp) => Number.isFinite(timestamp));
    const oldestTimestamp = timestamps.length ? Math.min(...timestamps) : Date.now();

    return new Date(oldestTimestamp).toISOString();
}

function getSourceCreatedMs(filePath) {
    if (sourceCreatedCache.has(filePath)) {
        return sourceCreatedCache.get(filePath);
    }

    const timestamp = getGitFirstCommitMs(filePath) || getFilesystemLastmodMs(filePath);

    sourceCreatedCache.set(filePath, timestamp);
    return timestamp;
}

function getSourceLastmodMs(filePath) {
    if (sourceLastmodCache.has(filePath)) {
        return sourceLastmodCache.get(filePath);
    }

    const lastmodTimestamp = hasUncommittedSourceChange(filePath)
        ? getFilesystemLastmodMs(filePath)
        : getGitLastCommitMs(filePath) || getFilesystemLastmodMs(filePath);
    const createdTimestamp = getSourceCreatedMs(filePath);
    const timestamp = Number.isFinite(createdTimestamp) && Number.isFinite(lastmodTimestamp)
        ? Math.max(createdTimestamp, lastmodTimestamp)
        : lastmodTimestamp;

    sourceLastmodCache.set(filePath, timestamp);
    return timestamp;
}

function hasUncommittedSourceChange(filePath) {
    try {
        return execFileSync("git", ["status", "--porcelain", "--", relativeToRoot(filePath)], {
            cwd: ROOT,
            encoding: "utf8"
        }).trim().length > 0;
    } catch {
        return false;
    }
}

function getGitFirstCommitMs(filePath) {
    try {
        const timestamp = execFileSync("git", ["log", "--follow", "--format=%cI", "--reverse", "--", relativeToRoot(filePath)], {
            cwd: ROOT,
            encoding: "utf8"
        }).trim().split(/\r?\n/)[0] || "";

        return timestamp ? Date.parse(timestamp) : null;
    } catch {
        return null;
    }
}

function getGitLastCommitMs(filePath) {
    try {
        const timestamp = execFileSync("git", ["log", "-1", "--format=%aI", "--", relativeToRoot(filePath)], {
            cwd: ROOT,
            encoding: "utf8"
        }).trim();

        return timestamp ? Date.parse(timestamp) : null;
    } catch {
        return null;
    }
}

function getFilesystemLastmodMs(filePath) {
    try {
        return Math.floor(statSync(filePath).mtime.getTime() / 1000) * 1000;
    } catch {
        return Number.NaN;
    }
}

function relativeToRoot(filePath) {
    return relative(ROOT, filePath).replace(/\\/g, "/");
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

function loadLocales() {
    return readJson(LOCALES_PATH);
}

function loadPages() {
    return readdirSync(PAGES_ROOT)
        .filter((file) => file.endsWith(".json"))
        .sort((left, right) => left.localeCompare(right))
        .map((file) => readJson(join(PAGES_ROOT, file)));
}

function loadSlugAliases() {
    return readJson(SLUG_ALIASES_PATH);
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

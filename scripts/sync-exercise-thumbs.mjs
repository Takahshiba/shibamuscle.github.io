#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const DEFAULT_THUMB_ROOT = "/Users/kokitakashiba/Desktop/shiba/ShibaMuscle/Assets.xcassets/Exercises/Thumbs";
const THUMB_ROOT = process.env.SHIBA_THUMB_ROOT || DEFAULT_THUMB_ROOT;
const MAP_PATH = join(ROOT, "src", "exercise-thumb-map.json");
const EXERCISES_DIR = join(ROOT, "src", "exercises");
const CATALOG_PATH = join(ROOT, "src", "catalog.json");
const DEFAULT_SHARP_MODULE_DIR = "/private/tmp/shiba-thumb-tools/node_modules";

const SOURCE_SLUG_OVERRIDES = new Map([
    ["one-arm-triceps-pushdown", "one-arm-pulldown"],
    ["single-leg-press", "single-leg-leg-press"]
]);

const args = new Set(process.argv.slice(2));

if (args.has("--write-map")) {
    writeMapping();
} else if (args.has("--check")) {
    validateMapping(readMapping());
    console.log("Exercise thumb mapping is valid.");
} else {
    await syncThumbs();
}

function writeMapping() {
    const mapping = buildMapping();
    validateMapping(mapping);
    writeJson(MAP_PATH, mapping);
    console.log(`Wrote ${relative(MAP_PATH)} with ${mapping.length} mapped exercise thumbs.`);
}

async function syncThumbs() {
    const mapping = readMapping();
    validateMapping(mapping);
    const sharp = await loadSharp();

    let updated = 0;
    for (const entry of mapping) {
        if (entry.output.endsWith("-gif.webp")) {
            throw new Error(`${entry.slug}: refusing to write gif WebP output ${entry.output}`);
        }

        const sourcePath = join(THUMB_ROOT, entry.sourceImageset, entry.sourceFile);
        const outputPath = join(ROOT, entry.output.replace(/^\.\//, ""));
        mkdirSync(dirname(outputPath), { recursive: true });

        const source = sharp(sourcePath, { animated: false });
        const metadata = await source.metadata();
        if (metadata.width !== 512 || metadata.height !== 512) {
            throw new Error(`${entry.slug}: expected a 512x512 thumb, got ${metadata.width}x${metadata.height}`);
        }

        await source.webp({ lossless: true }).toFile(outputPath);
        updated += 1;
    }

    console.log(`Synced ${updated} exercise thumb WebP assets from ${THUMB_ROOT}.`);
}

function buildMapping() {
    const catalogImages = readCatalogImages();
    const thumbSourceSlugs = readThumbSourceSlugs();
    const exercises = readExercises();

    return exercises.map((exercise) => {
        const sourceSlug = SOURCE_SLUG_OVERRIDES.get(exercise.slug) || exercise.slug;
        const sourceImageset = `exercise_thumb_${sourceSlug}.imageset`;
        const output = catalogImages.get(exercise.slug);

        if (!output) {
            throw new Error(`${exercise.slug}: missing catalog image`);
        }
        if (!thumbSourceSlugs.has(sourceSlug)) {
            throw new Error(`${exercise.slug}: missing thumb source ${sourceImageset}`);
        }

        return {
            slug: exercise.slug,
            sourceImageset,
            sourceFile: "image.png",
            output
        };
    });
}

function validateMapping(mapping) {
    if (!Array.isArray(mapping)) {
        throw new Error(`${relative(MAP_PATH)} must contain an array`);
    }

    const exercises = readExercises();
    const exerciseSlugs = new Set(exercises.map((exercise) => exercise.slug));
    const mappedSlugs = new Set();
    const catalogImages = readCatalogImages();

    for (const entry of mapping) {
        if (!entry || typeof entry !== "object") {
            throw new Error("Mapping entries must be objects");
        }
        for (const field of ["slug", "sourceImageset", "sourceFile", "output"]) {
            if (typeof entry[field] !== "string" || !entry[field]) {
                throw new Error(`${entry.slug || "<unknown>"}: ${field} is required`);
            }
        }
        if (!exerciseSlugs.has(entry.slug)) {
            throw new Error(`${entry.slug}: mapping references an unknown exercise`);
        }
        if (mappedSlugs.has(entry.slug)) {
            throw new Error(`${entry.slug}: duplicate mapping entry`);
        }
        mappedSlugs.add(entry.slug);

        if (!entry.sourceImageset.startsWith("exercise_thumb_") || !entry.sourceImageset.endsWith(".imageset")) {
            throw new Error(`${entry.slug}: invalid source imageset ${entry.sourceImageset}`);
        }
        const sourcePath = join(THUMB_ROOT, entry.sourceImageset, entry.sourceFile);
        if (!existsSync(sourcePath) || !statSync(sourcePath).isFile()) {
            throw new Error(`${entry.slug}: missing source file ${sourcePath}`);
        }

        const expectedOutput = catalogImages.get(entry.slug);
        if (entry.output !== expectedOutput) {
            throw new Error(`${entry.slug}: output ${entry.output} does not match catalog image ${expectedOutput}`);
        }
        if (!entry.output.startsWith("./assets/") || !entry.output.endsWith(".webp")) {
            throw new Error(`${entry.slug}: output must be a ./assets/*.webp path`);
        }
        if (entry.output.endsWith("-gif.webp")) {
            throw new Error(`${entry.slug}: mapping must not target gif WebP assets`);
        }
    }

    const missing = exercises.map((exercise) => exercise.slug).filter((slug) => !mappedSlugs.has(slug));
    if (missing.length) {
        throw new Error(`Missing mapping entries: ${missing.join(", ")}`);
    }
}

async function loadSharp() {
    const moduleDirs = [
        process.env.SHIBA_SHARP_MODULE_DIR,
        DEFAULT_SHARP_MODULE_DIR
    ].filter(Boolean);

    try {
        return (await import("sharp")).default;
    } catch {
        // Continue to explicit module directories.
    }

    for (const moduleDir of moduleDirs) {
        const candidates = [
            join(moduleDir, "sharp", "dist", "index.mjs"),
            join(moduleDir, "sharp", "dist", "index.cjs"),
            join(moduleDir, "sharp", "lib", "index.js")
        ];
        for (const candidate of candidates) {
            if (!existsSync(candidate)) {
                continue;
            }
            try {
                return (await import(pathToFileURL(candidate).href)).default;
            } catch {
                // Try the next candidate, then report a single actionable error below.
            }
        }
    }

    throw new Error(
        `Unable to load sharp. Install it outside the repo with: npm install --prefix ${DEFAULT_SHARP_MODULE_DIR.replace(/\/node_modules$/, "")} sharp`
    );
}

function readMapping() {
    return JSON.parse(readFileSync(MAP_PATH, "utf8"));
}

function readExercises() {
    return readdirSync(EXERCISES_DIR)
        .filter((file) => file.endsWith(".json"))
        .map((file) => JSON.parse(readFileSync(join(EXERCISES_DIR, file), "utf8")))
        .sort((a, b) => a.slug.localeCompare(b.slug));
}

function readThumbSourceSlugs() {
    return new Set(
        readdirSync(THUMB_ROOT, { withFileTypes: true })
            .filter((entry) => entry.isDirectory() && entry.name.startsWith("exercise_thumb_") && entry.name.endsWith(".imageset"))
            .map((entry) => entry.name.replace(/^exercise_thumb_/, "").replace(/\.imageset$/, ""))
    );
}

function readCatalogImages() {
    const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8"));
    const rows = [];
    collectCatalogRows(catalog, rows);

    const images = new Map();
    for (const row of rows) {
        if (!row.slug || !row.image) {
            continue;
        }
        const existing = images.get(row.slug);
        if (existing && existing !== row.image) {
            throw new Error(`${row.slug}: multiple catalog images found: ${existing}, ${row.image}`);
        }
        images.set(row.slug, row.image);
    }
    return images;
}

function collectCatalogRows(value, rows) {
    if (Array.isArray(value)) {
        for (const item of value) {
            collectCatalogRows(item, rows);
        }
        return;
    }
    if (!value || typeof value !== "object") {
        return;
    }
    if (typeof value.slug === "string" && typeof value.image === "string") {
        rows.push({ slug: value.slug, image: value.image });
    }
    for (const child of Object.values(value)) {
        collectCatalogRows(child, rows);
    }
}

function writeJson(filePath, value) {
    writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function relative(filePath) {
    return filePath.startsWith(ROOT) ? filePath.slice(ROOT.length + 1) : filePath;
}

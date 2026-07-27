#!/usr/bin/env node

import { existsSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { basename, join } from "node:path";
import { spawnSync } from "node:child_process";

const SOURCE_ROOT = process.env.SHIBA_APP_SCREENSHOT_SOURCE || "/Users/kokitakashiba/Desktop/shiba/docs/app-store-screenshots";
const OUTPUT_ROOT = join(process.cwd(), "assets/app/screenshots");
const MAX_DIMENSION = process.env.SHIBA_APP_SCREENSHOT_MAX_DIMENSION || "960";
const JPEG_QUALITY = process.env.SHIBA_APP_SCREENSHOT_JPEG_QUALITY || "76";
const SCREENSHOT_COUNT = 9;

const SCREENSHOT_SETS = [
    { locale: "ja", sourceDir: "store-ja-burnfit-10-6-5" },
    { locale: "ko", sourceDir: "store-ko-KR-burnfit-10-6-5" },
    { locale: "zh-hant", sourceDir: "store-zh-Hant-burnfit-10-6-5" },
    { locale: "zh-hans", sourceDir: "store-zh-Hans-burnfit-10-6-5" },
    { locale: "es", sourceDir: "store-es-ES-burnfit-10-6-5" },
    { locale: "fr", sourceDir: "store-fr-FR-burnfit-10-6-5" },
    { locale: "de", sourceDir: "store-de-DE-burnfit-10-6-5" },
    { locale: "pt-br", sourceDir: "store-pt-BR-burnfit-10-6-5" },
    { locale: "en", sourceDir: "store-en-US-burnfit-10-6-5" }
];

if (!existsSync(SOURCE_ROOT)) {
    if (allExpectedOutputsExist()) {
        console.warn(`Skipping App Store screenshot asset generation because ${SOURCE_ROOT} is unavailable and all outputs already exist.`);
        process.exit(0);
    }

    throw new Error(`App Store screenshot source folder not found: ${SOURCE_ROOT}`);
}

for (const set of SCREENSHOT_SETS) {
    const sourceDir = join(SOURCE_ROOT, set.sourceDir);
    const outputDir = join(OUTPUT_ROOT, set.locale);

    if (!existsSync(sourceDir)) {
        throw new Error(`Missing screenshot source folder for ${set.locale}: ${sourceDir}`);
    }

    const sourceFiles = readdirSync(sourceDir)
        .filter((file) => /^\d{2}-.+\.png$/i.test(file))
        .sort((a, b) => a.localeCompare(b, "en", { numeric: true }))
        .slice(0, SCREENSHOT_COUNT);

    if (sourceFiles.length !== SCREENSHOT_COUNT) {
        throw new Error(`Expected ${SCREENSHOT_COUNT} screenshots for ${set.locale}, found ${sourceFiles.length} in ${sourceDir}`);
    }

    mkdirSync(outputDir, { recursive: true });

    for (const [index, file] of sourceFiles.entries()) {
        const inputPath = join(sourceDir, file);
        const outputPath = join(outputDir, `${String(index + 1).padStart(2, "0")}.jpg`);
        const result = spawnSync("sips", [
            "-s", "format", "jpeg",
            "-s", "formatOptions", JPEG_QUALITY,
            "-Z", MAX_DIMENSION,
            inputPath,
            "--out", outputPath
        ], { encoding: "utf8" });

        if (result.status !== 0) {
            const detail = result.stderr || result.stdout || `sips exited with status ${result.status}`;
            throw new Error(`Failed to generate ${outputPath} from ${basename(inputPath)}: ${detail}`);
        }
    }

    removeStaleOutputs(outputDir);
    console.log(`Generated ${sourceFiles.length} ${set.locale} screenshots.`);
}

console.log("Generated localized App Store screenshot web assets.");

function allExpectedOutputsExist() {
    return SCREENSHOT_SETS.every((set) => {
        return Array.from({ length: SCREENSHOT_COUNT }, (_, index) => {
            const file = `${String(index + 1).padStart(2, "0")}.jpg`;
            return existsSync(join(OUTPUT_ROOT, set.locale, file));
        }).every(Boolean);
    });
}

function removeStaleOutputs(outputDir) {
    for (const file of readdirSync(outputDir)) {
        const match = file.match(/^(\d{2})\.jpg$/);
        if (match && Number(match[1]) > SCREENSHOT_COUNT) {
            unlinkSync(join(outputDir, file));
        }
    }
}

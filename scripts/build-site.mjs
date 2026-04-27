#!/usr/bin/env node

import { spawn } from "node:child_process";
import { existsSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

import { getGeneratedLocales } from "./localization.mjs";

const NORMALIZE_SCRIPT = "scripts/normalize-site.mjs";
const NORMALIZE_CHUNK_SIZE = Number.parseInt(process.env.SHIBA_NORMALIZE_CHUNK_SIZE || "1000", 10);
const NORMALIZE_HTML = process.env.SHIBA_NORMALIZE_HTML === "1";
const generatedLocaleCodes = getGeneratedLocales().map((locale) => locale.code);
const INACTIVE_OUTPUT_DIRS = ["de", "fr", "zh-hans", "zh-hant"];

const activeInactiveLocales = INACTIVE_OUTPUT_DIRS.filter((locale) => generatedLocaleCodes.includes(locale));
if (activeInactiveLocales.length) {
    throw new Error(`${activeInactiveLocales.join(", ")} locale(s) are inactive and must not be generated. Active locales: ${generatedLocaleCodes.join(", ")}`);
}

for (const inactiveOutputDir of INACTIVE_OUTPUT_DIRS) {
    const inactiveDir = join(process.cwd(), inactiveOutputDir);
    if (existsSync(inactiveDir)) {
        rmSync(inactiveDir, { recursive: true, force: true });
    }
}

const steps = [
    ["scripts/sync-exercise-metadata.mjs", "Syncing exercise metadata into src/"],
    ["scripts/build-static-pages.mjs", "Generating shared static pages from src/pages/"],
    ["scripts/build-exercise-pages.mjs", "Generating exercise pages from src/"],
    ["scripts/generate-og-images.mjs", "Generating dedicated OG image assets"],
    [NORMALIZE_SCRIPT, "Normalizing shared head/meta/footer markup"],
    ["scripts/audit-site.mjs", "Running site audit"]
];

for (const [script, label] of steps) {
    console.log(label);
    if (script === NORMALIZE_SCRIPT && NORMALIZE_HTML && NORMALIZE_CHUNK_SIZE > 0) {
        await runNormalizeStep(script);
    } else if (script === NORMALIZE_SCRIPT) {
        await runStep(script, {
            SHIBA_NORMALIZE_FILE_FILTER: "Shift2ics.html",
            SHIBA_NORMALIZE_SKIP_SITEMAP: "1"
        });
        await runStep(script, { SHIBA_NORMALIZE_SITEMAP_ONLY: "1" });
    } else {
        await runStep(script);
    }
}

console.log("Build finished successfully.");

async function runNormalizeStep(script) {
    const total = countGeneratedHtmlFiles();

    for (let offset = 0; offset < total; offset += NORMALIZE_CHUNK_SIZE) {
        const end = Math.min(offset + NORMALIZE_CHUNK_SIZE, total);
        console.log(`Normalizing generated HTML ${offset + 1}-${end} of ${total}`);
        await runStep(script, {
            SHIBA_NORMALIZE_OFFSET: String(offset),
            SHIBA_NORMALIZE_LIMIT: String(NORMALIZE_CHUNK_SIZE),
            SHIBA_NORMALIZE_SKIP_SITEMAP: end < total ? "1" : ""
        });
    }
}

function countGeneratedHtmlFiles() {
    return getGeneratedLocales().reduce((count, locale) => {
        const dir = locale.outputDir ? join(process.cwd(), locale.outputDir) : process.cwd();
        if (!existsSync(dir)) {
            return count;
        }

        return count + readdirSync(dir).filter((file) => file.endsWith(".html")).length;
    }, 0);
}

function runStep(script, env = {}) {
    const startedAt = Date.now();
    const heartbeat = setInterval(() => {
        const elapsedSeconds = Math.round((Date.now() - startedAt) / 1000);
        console.log(`Still running ${script} (${elapsedSeconds}s)...`);
    }, 10000);

    const child = spawn(process.execPath, [script], {
        stdio: "inherit",
        cwd: process.cwd(),
        env: {
            ...process.env,
            ...env
        }
    });

    return new Promise((resolve) => {
        child.on("error", (error) => {
            clearInterval(heartbeat);
            console.error(`${script} failed to start: ${error.message}`);
            process.exit(1);
        });

        child.on("close", (code, signal) => {
            clearInterval(heartbeat);

            if (code === 0) {
                resolve();
                return;
            }

            if (signal) {
                console.error(`${script} exited with signal ${signal}.`);
            }

            process.exit(code ?? 1);
        });
    });
}

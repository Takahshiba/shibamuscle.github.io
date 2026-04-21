#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const steps = [
    ["scripts/sync-exercise-metadata.mjs", "Syncing exercise metadata into src/"],
    ["scripts/build-static-pages.mjs", "Generating shared static pages from src/pages/"],
    ["scripts/build-exercise-pages.mjs", "Generating exercise pages from src/"],
    ["scripts/generate-og-images.mjs", "Generating dedicated OG image assets"],
    ["scripts/normalize-site.mjs", "Normalizing shared head/meta/footer markup"],
    ["scripts/audit-site.mjs", "Running site audit"]
];

for (const [script, label] of steps) {
    console.log(label);
    const result = spawnSync(process.execPath, [script], {
        stdio: "inherit",
        cwd: process.cwd()
    });

    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

console.log("Build finished successfully.");

#!/usr/bin/env node

import { join } from "node:path";
import { writeFileSync } from "node:fs";

import {
    escapeAttribute,
    escapeHtml,
    extractAverageSnapshot,
    getMeasurementCopy
} from "./exercise-metadata.mjs";
import { ASSETS_ROOT, ensureDirectory, loadExercises } from "./source-data.mjs";

const OG_ROOT = join(ASSETS_ROOT, "og");
const EXERCISE_OG_ROOT = join(OG_ROOT, "exercises");

ensureDirectory(EXERCISE_OG_ROOT);

const exercises = loadExercises();

for (const exercise of exercises) {
    const svg = renderExerciseOg(exercise);
    writeFileSync(join(EXERCISE_OG_ROOT, `${exercise.slug}.svg`), svg);
}

console.log(`Generated ${exercises.length} OG SVG assets.`);

function renderExerciseOg(exercise) {
    const measurementCopy = getMeasurementCopy(exercise.metadata?.measurementKind || "weight");
    const snapshot = extractAverageSnapshot(exercise, "kg", "中級") || extractAverageSnapshot(exercise, "kg");
    const primaryMuscles = (exercise.metadata?.primaryMuscles?.ja || []).slice(0, 3).join(" / ");
    const relativeImage = exercise.image.src.replace("./assets/", "../../");
    const valueLabel = snapshot ? `${snapshot.label}の目安` : measurementCopy.averageLabel;
    const valueText = snapshot
        ? `男性 ${snapshot.male} | 女性 ${snapshot.female}`
        : measurementCopy.averageLabel;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="title desc">
  <title id="title">${escapeHtml(exercise.names.ja)}</title>
  <desc id="desc">${escapeHtml(exercise.metadata?.summary?.ja || "")}</desc>
  <defs>
    <linearGradient id="bg" x1="0%" x2="100%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="#111111" />
      <stop offset="100%" stop-color="#030303" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" x2="100%" y1="0%" y2="0%">
      <stop offset="0%" stop-color="#ff9a24" />
      <stop offset="100%" stop-color="#ff6a00" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)" rx="28" />
  <circle cx="1020" cy="160" r="150" fill="#ff6a00" opacity="0.18" />
  <circle cx="1120" cy="560" r="220" fill="#ff9a24" opacity="0.1" />
  <rect x="56" y="48" width="220" height="44" rx="22" fill="url(#accent)" />
  <text x="84" y="77" fill="#130800" font-size="22" font-weight="800" font-family="'Noto Sans JP', sans-serif">Shiba Muscle</text>
  <text x="56" y="170" fill="#ffffff" font-size="64" font-weight="800" font-family="'Noto Sans JP', sans-serif">${escapeHtml(exercise.names.ja)}</text>
  <text x="56" y="232" fill="#ff9a24" font-size="28" font-weight="700" font-family="'Noto Sans JP', sans-serif">${escapeHtml(measurementCopy.averageLabel)} / ${escapeHtml(measurementCopy.standardsLabel)}</text>
  <text x="56" y="302" fill="#d7d7d7" font-size="24" font-family="'Noto Sans JP', sans-serif">${escapeHtml(primaryMuscles)}</text>
  <rect x="56" y="358" width="520" height="152" rx="28" fill="#0a0a0a" stroke="#ff6a00" stroke-opacity="0.34" />
  <text x="92" y="410" fill="#b8b8b8" font-size="22" font-weight="700" font-family="'Noto Sans JP', sans-serif">${escapeHtml(valueLabel)}</text>
  <text x="92" y="474" fill="#ffffff" font-size="42" font-weight="800" font-family="'Noto Sans JP', sans-serif">${escapeHtml(valueText)}</text>
  <text x="92" y="520" fill="#b8b8b8" font-size="22" font-family="'Noto Sans JP', sans-serif">${escapeHtml(exercise.metadata?.category?.label?.ja || "")} / ${escapeHtml(measurementCopy.pageTerm)}</text>
  <rect x="780" y="120" width="320" height="320" rx="36" fill="#111111" stroke="#ff6a00" stroke-opacity="0.34" />
  <image href="${escapeAttribute(relativeImage)}" x="820" y="150" width="240" height="240" preserveAspectRatio="xMidYMid meet" />
  <rect x="780" y="468" width="320" height="82" rx="26" fill="url(#accent)" />
  <text x="820" y="518" fill="#130800" font-size="28" font-weight="800" font-family="'Noto Sans JP', sans-serif">${escapeHtml(exercise.metadata?.relatedTags?.ja?.slice(0, 2).join(" / ") || "")}</text>
</svg>
`;
}

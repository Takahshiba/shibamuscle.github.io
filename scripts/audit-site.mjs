#!/usr/bin/env node

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const ANALYTICS_ID = "G-D9K58THBFM";

const htmlFiles = readdirSync(ROOT)
    .filter((file) => file.endsWith(".html"))
    .sort((left, right) => left.localeCompare(right));

const errors = [];

for (const file of htmlFiles) {
    const html = readFileSync(join(ROOT, file), "utf8");
    const isExercisePage = /^(kg|lb)_/.test(file);
    const isHomePage = file === "index.html";

    assert(!html.includes("precaonnect"), `${file}: precaonnect typo is still present`);
    assert(!html.includes("G-ZPM6B2KLSV"), `${file}: legacy GA id is still present`);
    assert(html.includes(`gtag/js?id=${ANALYTICS_ID}`), `${file}: current GA script is missing`);
    assert((html.match(/<link rel="alternate" hreflang="/g) || []).length === 5, `${file}: hreflang set is incomplete`);
    assert(/<link rel="canonical" href="https:\/\/shibamuscle\.com\//.test(html), `${file}: canonical is missing or malformed`);
    assert(/<meta name="description" content="[^"]+">/.test(html), `${file}: meta description is missing`);

    if (isExercisePage) {
        const expectedLocaleTargets = [
            `https://en.shibamuscle.com/${file}`,
            `https://shibamuscle.com/${file}`,
            `https://cn.shibamuscle.com/${file}`,
            `https://ko.shibamuscle.com/${file}`
        ];

        assert(/<main class="page-main">/.test(html), `${file}: static main wrapper is missing`);
        assert(/<nav class="breadcrumb" aria-label="Breadcrumb">/.test(html), `${file}: static breadcrumb is missing`);
        assert(!/href="#whole-body-section"/.test(html), `${file}: broken in-page category link remains`);
        assert(!/<h1 class="section-title"/.test(html), `${file}: section heading is still h1`);
        expectedLocaleTargets.forEach((target) => {
            assert(html.includes(target), `${file}: localized path link is missing for ${target}`);
        });
        assert(/<meta name="description" content="[^"]+(kg表|lb表)[^"]*(主働筋は|主な筋肉は)[^"]+">/.test(html), `${file}: exercise description is not specific enough`);
        assert(html.includes("/assets/og/exercises/"), `${file}: dedicated exercise OG image is missing`);
    }

    if (isHomePage) {
        assert((html.match(/<h2 id="[^"]+-section" class="section-title">/g) || []).length === 7, `${file}: homepage category sections are incomplete`);
    }

    if (!isHomePage && !/Shift2ics\.html$/.test(file)) {
        assert(/<nav class="breadcrumb" aria-label="Breadcrumb">/.test(html), `${file}: breadcrumb is missing`);
    }
}

if (errors.length) {
    console.error("Site audit failed:\n");
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
}

console.log(`Site audit passed for ${htmlFiles.length} HTML files.`);

function assert(condition, message) {
    if (!condition) {
        errors.push(message);
    }
}

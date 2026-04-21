#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const SRC_ROOT = join(ROOT, "src");
const EXERCISE_SRC_ROOT = join(SRC_ROOT, "exercises");
const CATALOG_PATH = join(SRC_ROOT, "catalog.json");

const exerciseFiles = readdirSync(ROOT)
    .filter((file) => /^(kg|lb)_.+\.html$/.test(file))
    .sort((left, right) => left.localeCompare(right));

const catalog = extractCatalog(loadCatalogSourceHtml());
const cardIndex = new Map(catalog.sections.flatMap((section) => {
    return section.cards.map((card) => [card.slug, { sectionId: section.id, sectionTitle: section.titles.ja }]);
}));

const exercises = new Map();

for (const file of exerciseFiles) {
    const html = readFileSync(join(ROOT, file), "utf8").replace(/\r\n/g, "\n");
    const unit = unitFromFilename(file);
    const slug = slugFromFilename(file);
    const mainContent = extractFirst(html, /<main class="page-main">([\s\S]*?)<\/main>/i);
    const containers = extractTopLevelContainers(mainContent);
    const heroBlock = containers.find((block) => block.includes("main-image-title"));
    const musclesBlock = containers.find((block) => block.includes("muscle-activated-table"));
    const averageBlock = containers.find((block) => block.includes("average-section-table"));
    const standardsBlock = containers.find((block) => block.includes('data-tab-group="Standards Exercise"'));
    const recordsBlock = containers.find((block) => normalizeText(stripTags(block)).includes("世界記録"));
    const aboutBlock = containers.find((block) => block.includes('id="about-table"'));
    const calorieBlock = containers.find((block) => normalizeText(stripTags(block)).includes("10分あたりの消費カロリー"));

    if (!heroBlock || !musclesBlock || !averageBlock || !standardsBlock) {
        throw new Error(`Could not extract required sections from ${file}`);
    }

    const sectionMeta = cardIndex.get(slug) || { sectionId: "whole-body-section", sectionTitle: "全身トレーニング" };
    const entry = exercises.get(slug) || {
        slug,
        names: {},
        categoryId: sectionMeta.sectionId,
        categoryTitle: sectionMeta.sectionTitle,
        image: {
            src: "",
            alt: ""
        },
        muscles: [],
        sharedBlocks: {},
        variants: {}
    };

    entry.names.ja ||= decodeHtml(stripTags(extractFirst(heroBlock, /<h1[^>]*>([\s\S]*?)<\/h1>/i)));
    entry.image.src ||= extractFirst(heroBlock, /<img[^>]+src="([^"]+)"/i);
    entry.image.alt ||= extractFirst(heroBlock, /<img[^>]+alt="([^"]*)"/i) || slug;
    entry.muscles = entry.muscles.length ? entry.muscles : extractMuscles(musclesBlock);

    if (recordsBlock && !entry.sharedBlocks.records) {
        entry.sharedBlocks.records = compactBlock(recordsBlock);
    }
    if (aboutBlock && !entry.sharedBlocks.about) {
        entry.sharedBlocks.about = compactBlock(aboutBlock);
    }
    if (calorieBlock && !entry.sharedBlocks.calorie) {
        entry.sharedBlocks.calorie = compactBlock(calorieBlock);
    }

    entry.variants[unit] = {
        file,
        averageBlock: compactBlock(averageBlock),
        standardsBlock: compactBlock(standardsBlock)
    };

    exercises.set(slug, entry);
}

mkdirSync(SRC_ROOT, { recursive: true });
rmSync(EXERCISE_SRC_ROOT, { recursive: true, force: true });
mkdirSync(EXERCISE_SRC_ROOT, { recursive: true });

writeFileSync(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`);

Array.from(exercises.values())
    .sort((left, right) => left.slug.localeCompare(right.slug))
    .forEach((exercise) => {
        writeFileSync(
            join(EXERCISE_SRC_ROOT, `${exercise.slug}.json`),
            `${JSON.stringify(exercise, null, 2)}\n`
        );
    });

console.log(`Extracted ${exercises.size} exercise sources and catalog into src/.`);

function extractCatalog(html) {
    const sectionStart = html.indexOf('id="other-workouts"');
    if (sectionStart === -1) {
        throw new Error("Could not locate exercise catalog heading in index.html");
    }
    const sectionOpenStart = html.lastIndexOf("<h1", sectionStart);
    const sectionEndCandidates = [
        html.indexOf("</main>", sectionOpenStart),
        html.indexOf("<footer", sectionOpenStart),
        html.indexOf('<script src="app.js"', sectionOpenStart),
        html.indexOf("</body>", sectionOpenStart)
    ].filter((index) => index !== -1);
    const sectionEnd = Math.min(...sectionEndCandidates);
    const sectionMarkup = html.slice(sectionOpenStart, sectionEnd);

    const sections = [];
    const headingPattern = /<h2 id="([^"]+)" class="section-title">([\s\S]*?)<\/h2>/g;
    let headingMatch;

    while ((headingMatch = headingPattern.exec(sectionMarkup))) {
        const [, id, titleMarkup] = headingMatch;
        const cardsStart = sectionMarkup.indexOf('<div class="exercise-cards-container">', headingPattern.lastIndex);
        if (cardsStart === -1) {
            continue;
        }

        const cardsContainer = extractBalancedDiv(sectionMarkup, cardsStart);
        sections.push({
            id,
            titles: {
                ja: decodeHtml(stripTags(titleMarkup))
            },
            cards: Array.from(cardsContainer.block.matchAll(/<a class="card-link" href="(kg_[^"]+\.html)">[\s\S]*?<img src="([^"]+)" alt="([^"]*)"[\s\S]*?<div class="name">([\s\S]*?)<\/div>[\s\S]*?<div class="category">([\s\S]*?)<\/div>[\s\S]*?<\/a>/g)).map((cardMatch) => {
                const [, href, image, imageAlt, nameMarkup, categoryMarkup] = cardMatch;
                return {
                    slug: slugFromFilename(href),
                    names: {
                        ja: decodeHtml(stripTags(nameMarkup))
                    },
                    categories: {
                        ja: decodeHtml(stripTags(categoryMarkup))
                    },
                    image,
                    imageAlt: imageAlt || slugFromFilename(href)
                };
            })
        });

        headingPattern.lastIndex = cardsContainer.end;
    }

    return {
        locale: "ja",
        sections
    };
}

function extractTopLevelContainers(mainContent) {
    const blocks = [];
    let cursor = 0;

    while (true) {
        const start = mainContent.indexOf('<div class="container"', cursor);
        if (start === -1) {
            break;
        }

        let index = start;
        let depth = 0;

        while (index < mainContent.length) {
            const nextOpen = mainContent.indexOf("<div", index);
            const nextClose = mainContent.indexOf("</div>", index);

            if (nextClose === -1) {
                throw new Error("Unbalanced container markup while extracting exercise source");
            }

            if (nextOpen !== -1 && nextOpen < nextClose) {
                depth += 1;
                index = nextOpen + 4;
                continue;
            }

            depth -= 1;
            index = nextClose + 6;

            if (depth === 0) {
                blocks.push(mainContent.slice(start, index).trim());
                cursor = index;
                break;
            }
        }
    }

    return blocks;
}

function extractMuscles(block) {
    const tbody = extractFirst(block, /<tbody>([\s\S]*?)<\/tbody>/i);

    return Array.from(tbody.matchAll(/<tr>([\s\S]*?)<\/tr>/g)).map((rowMatch) => {
        const rowMarkup = rowMatch[1];
        const labelMarkup = extractFirst(rowMarkup, /<(?:th|td)[^>]*>([\s\S]*?)<\/(?:th|td)>/i);
        const itemMatches = Array.from(rowMarkup.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi));
        const itemsMarkup = itemMatches[itemMatches.length - 1]?.[1] || "";
        return {
            label: decodeHtml(stripTags(labelMarkup)),
            items: decodeHtml(stripTags(itemsMarkup))
                .split(/[、,]/)
                .map((item) => item.trim())
                .filter(Boolean)
        };
    }).filter((group) => group.label && group.label !== "グループ" && group.label !== "筋肉");
}

function compactBlock(block) {
    return `${block.trim()}\n`;
}

function loadCatalogSourceHtml() {
    const currentHtml = readFileSync(join(ROOT, "index.html"), "utf8").replace(/\r\n/g, "\n");
    const currentCatalog = extractCatalog(currentHtml);

    if (currentCatalog.sections.length >= 3) {
        return currentHtml;
    }

    try {
        const committedHtml = execFileSync("git", ["show", "HEAD:index.html"], {
            cwd: ROOT,
            encoding: "utf8"
        }).replace(/\r\n/g, "\n");
        const committedCatalog = extractCatalog(committedHtml);

        if (committedCatalog.sections.length > currentCatalog.sections.length) {
            return committedHtml;
        }
    } catch {
        // Fall back to the current working tree copy when git is unavailable.
    }

    return currentHtml;
}

function unitFromFilename(file) {
    return file.startsWith("lb_") ? "lb" : "kg";
}

function slugFromFilename(file) {
    return file.replace(/^(kg|lb)_/, "").replace(/\.html$/, "");
}

function extractFirst(text, pattern) {
    const match = text.match(pattern);
    return match?.[1]?.trim() || "";
}

function stripTags(text) {
    return text
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function decodeHtml(text) {
    return text
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
}

function normalizeText(text) {
    return (text || "").replace(/\s+/g, " ").trim();
}

function extractBalancedDiv(text, start) {
    let index = start;
    let depth = 0;

    while (index < text.length) {
        const nextOpen = text.indexOf("<div", index);
        const nextClose = text.indexOf("</div>", index);

        if (nextClose === -1) {
            throw new Error("Unbalanced div markup while extracting catalog");
        }

        if (nextOpen !== -1 && nextOpen < nextClose) {
            depth += 1;
            index = nextOpen + 4;
            continue;
        }

        depth -= 1;
        index = nextClose + 6;

        if (depth === 0) {
            return {
                block: text.slice(start, index).trim(),
                end: index
            };
        }
    }

    throw new Error("Unbalanced div markup while extracting catalog");
}

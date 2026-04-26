#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, posix } from "node:path";

import {
    JAPANESE_LEFTOVER_PATTERNS,
    absoluteUrlForFile,
    getGeneratedLocales,
    getLocaleConfigs,
    getLocaleConfig,
    stripIntentionalLanguageSwitchText
} from "./localization.mjs";

const ROOT = process.cwd();
const ANALYTICS_ID = "G-D9K58THBFM";
const htmlEntries = listHtmlEntries();
const availableHtml = new Set(htmlEntries.map((entry) => entry.relativePath));
const sitemap = readFileSync(join(ROOT, "sitemap.xml"), "utf8");
const sitemapUrls = new Set(Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)).map((match) => match[1]));
const errors = [];
const auditLocales = getLocaleConfigs().filter((locale) => locale.code !== "de");

for (const entry of htmlEntries) {
    const html = readFileSync(entry.path, "utf8");
    const isExercisePage = /^(kg|lb)_/.test(entry.file);
    const isHomePage = entry.file === "index.html";
    const isToolPage = entry.file === "Shift2ics.html";
    const localeConfig = getLocaleConfig(entry.locale);
    const canonicalUrl = absoluteUrlForFile(entry.file, entry.locale);

    assert(!html.includes("precaonnect"), `${entry.relativePath}: precaonnect typo is still present`);
    assert(!html.includes("G-ZPM6B2KLSV"), `${entry.relativePath}: legacy GA id is still present`);
    assert(html.includes(`gtag/js?id=${ANALYTICS_ID}`), `${entry.relativePath}: current GA script is missing`);
    assert(html.includes(`<html lang="${localeConfig.hreflang}"`), `${entry.relativePath}: html lang is incorrect`);
    assert((html.match(/<link rel="alternate" hreflang="/g) || []).length === auditLocales.length + 1, `${entry.relativePath}: hreflang set is incomplete`);
    assert(html.includes(`<link rel="canonical" href="${canonicalUrl}">`), `${entry.relativePath}: canonical is missing or malformed`);
    assert(/<title>[^<]+<\/title>/.test(html), `${entry.relativePath}: title is missing`);
    assert(/<meta name="description" content="[^"]+">/.test(html), `${entry.relativePath}: meta description is missing`);
    assert(/<h1[\s>]/i.test(html) || isToolPage, `${entry.relativePath}: H1 is missing`);
    assert(sitemapUrls.has(canonicalUrl), `${entry.relativePath}: sitemap is missing ${canonicalUrl}`);

    auditLocales.forEach((locale) => {
        assert(html.includes(`<link rel="alternate" hreflang="${locale.hreflang}" href="${absoluteUrlForFile(entry.file, locale.code)}">`), `${entry.relativePath}: ${locale.code} hreflang target is incorrect`);
    });
    assert(html.includes(`<link rel="alternate" hreflang="x-default" href="${absoluteUrlForFile(entry.file, "ja")}">`), `${entry.relativePath}: x-default hreflang target is incorrect`);

    auditInternalLinks(entry, html);

    if (entry.locale === "ko") {
        auditKoreanHtml(entry, html);
    }

    if (entry.locale === "zh-hant") {
        auditTraditionalChineseHtml(entry, html);
    }

    if (entry.locale === "zh-hans") {
        auditSimplifiedChineseHtml(entry, html);
    }

    if (entry.locale === "es") {
        auditSpanishHtml(entry, html);
    }

    if (entry.locale === "de") {
        auditGermanHtml(entry, html);
    }

    if (entry.locale !== "ja") {
        auditSectionDrift(entry, html);
    }

    if (isExercisePage) {
        assert(/<main class="page-main"/.test(html), `${entry.relativePath}: static main wrapper is missing`);
        assert(/<nav class="breadcrumb" aria-label="/.test(html), `${entry.relativePath}: static breadcrumb is missing`);
        assert(!/href="#whole-body-section"/.test(html), `${entry.relativePath}: broken in-page category link remains`);
        assert(!/<h1 class="section-title"/.test(html), `${entry.relativePath}: section heading is still h1`);
        assert(html.includes("/assets/og/exercises/"), `${entry.relativePath}: dedicated exercise OG image is missing`);

        if (entry.locale === "ko") {
            assert(/<meta name="description" content="[^"]+(kg 기준표|lb 기준표)[^"]*주동근[^"]+">/.test(html), `${entry.relativePath}: Korean exercise description is not specific enough`);
        } else if (entry.locale === "zh-hant") {
            assert(/<meta name="description" content="[^"]+(kg 表|lb 表)[^"]*(主要肌群|相關訓練動作)[^"]+">/.test(html), `${entry.relativePath}: Traditional Chinese exercise description is not specific enough`);
        } else if (entry.locale === "zh-hans") {
            assert(/<meta name="description" content="[^"]+(kg 表|lb 表)[^"]*(主要肌群|相关训练动作)[^"]+">/.test(html), `${entry.relativePath}: Simplified Chinese exercise description is not specific enough`);
        } else if (entry.locale === "es") {
            assert(/<meta name="description" content="[^"]+(tabla en kg|tabla en lb)[^"]*(músculos principales|estándares)[^"]+">/i.test(html), `${entry.relativePath}: Spanish exercise description is not specific enough`);
        } else if (entry.locale === "de") {
            assert(/<meta name="description" content="[^"]+(kg Tabelle|lb Tabelle)[^"]*(Zielmuskulatur|Kraftstandards|Wiederholungsstandards)[^"]+">/i.test(html), `${entry.relativePath}: German exercise description is not specific enough`);
        } else {
            assert(/<meta name="description" content="[^"]+(kg表|lb表)[^"]*(主働筋は|主な筋肉は)[^"]+">/.test(html), `${entry.relativePath}: exercise description is not specific enough`);
        }
    }

    if (isHomePage) {
        assert((html.match(/<h2 id="[^"]+-section" class="section-title">/g) || []).length === 7, `${entry.relativePath}: homepage category sections are incomplete`);
    }

    if (!isHomePage && !isToolPage) {
        assert(/<nav class="breadcrumb" aria-label="/.test(html), `${entry.relativePath}: breadcrumb is missing`);
    }
}

if (errors.length) {
    console.error("Site audit failed:\n");
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
}

console.log(`Site audit passed for ${htmlEntries.length} HTML files.`);

function listHtmlEntries() {
    const entries = [];

    getGeneratedLocales().forEach((locale) => {
        const dir = locale.outputDir ? join(ROOT, locale.outputDir) : ROOT;
        if (!existsSync(dir)) {
            return;
        }

        readdirSync(dir)
            .filter((file) => file.endsWith(".html"))
            .sort((left, right) => left.localeCompare(right))
            .forEach((file) => {
                entries.push({
                    file,
                    locale: locale.code,
                    relativePath: locale.outputDir ? `${locale.outputDir}/${file}` : file,
                    path: join(dir, file)
                });
            });
    });

    return entries;
}

function auditKoreanHtml(entry, html) {
    const normalized = stripIntentionalLanguageSwitchText(html)
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "");

    JAPANESE_LEFTOVER_PATTERNS.forEach((pattern) => {
        assert(!pattern.test(normalized), `${entry.relativePath}: Japanese text remains in Korean output`);
    });

    assert(!/中文/.test(normalized), `${entry.relativePath}: Chinese language text remains outside the language switch`);
}

function auditTraditionalChineseHtml(entry, html) {
    const normalized = stripIntentionalLanguageSwitchText(html)
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "");
    const japaneseOnlyPatterns = [
        /[\u3040-\u30ff]/,
        /ワークアウト|テーブル|カテゴリ|サポート|お問い合わせ|プライバシーポリシー|その他のワークアウト|もっと見る|正しいフォーム|継続|当該メニュー|主働筋|副働筋|安定筋|種目|公式記録|世界記録|基準レップ数|平均レップ数|レップ数|年齢別|体重別|基準重量|男性・|女性・/
    ];

    japaneseOnlyPatterns.forEach((pattern) => {
        assert(!pattern.test(normalized), `${entry.relativePath}: Japanese text remains in Traditional Chinese output`);
    });

    assert(!/[体级练训数据关门类联络隐项标准录图则国]/.test(normalized), `${entry.relativePath}: Simplified Chinese characters appear in Traditional Chinese output`);
    assert(!/cn\.shibamuscle\.com/.test(html), `${entry.relativePath}: legacy Chinese subdomain remains`);
}

function auditSimplifiedChineseHtml(entry, html) {
    const normalized = stripIntentionalLanguageSwitchText(html)
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "");
    const japaneseOnlyPatterns = [
        /[\u3040-\u30ff]/,
        /ワークアウト|テーブル|カテゴリ|サポート|お問い合わせ|プライバシーポリシー|その他のワークアウト|もっと見る|正しいフォーム|継続|当該メニュー|主働筋|副働筋|安定筋|種目|公式記録|基準レップ数|平均レップ数|レップ数|男性・|女性・/
    ];

    japaneseOnlyPatterns.forEach((pattern) => {
        assert(!pattern.test(normalized), `${entry.relativePath}: Japanese text remains in Simplified Chinese output`);
    });

    assert(!/[\u3040-\u30ff]/.test(normalized), `${entry.relativePath}: Japanese kana remains in Simplified Chinese output`);
    assert(!/[體國與為個動練訓數據資標準頁語關聯絡隱項錄圖則廣導覽徑髖鉸鏈協調穩輔後內轉義寫發復聲權條務變經許擾損礙營運責會盡維誤產瀏覽資訊趨勢網顯應確認齡連結臉藥拋懸圓鎖腳較庫選擇繼續歸類進階級學從開啟統總簡雙單區塊裡這舉臥鈴槓繩纜機彎鍵頸歐過頭側滾輪嚴澤茲醫麼視參註別規飛點詢換載設無覆]/.test(normalized), `${entry.relativePath}: Traditional Chinese characters appear in Simplified Chinese output`);
    assert(!/查詢|詢問|支援|切換|回覆|身分|刊載|資訊|使用者|個人化|電子郵件|伺服器|透過|設定/.test(normalized), `${entry.relativePath}: Traditional Chinese phrasing appears in Simplified Chinese output`);
    assert(!/cn\.shibamuscle\.com/.test(html), `${entry.relativePath}: legacy Chinese subdomain remains`);
}

function auditSpanishHtml(entry, html) {
    const normalized = stripIntentionalLanguageSwitchText(html)
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "");

    JAPANESE_LEFTOVER_PATTERNS.forEach((pattern) => {
        assert(!pattern.test(normalized), `${entry.relativePath}: Japanese text remains in Spanish output`);
    });

    assert(!/[\u3040-\u30ff]/.test(normalized), `${entry.relativePath}: Japanese kana remains in Spanish output`);
}

function auditGermanHtml(entry, html) {
    const normalized = stripIntentionalLanguageSwitchText(html)
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "");

    JAPANESE_LEFTOVER_PATTERNS.forEach((pattern) => {
        assert(!pattern.test(normalized), `${entry.relativePath}: Japanese text remains in German output`);
    });

    assert(!/[\u3040-\u30ff]/.test(normalized), `${entry.relativePath}: Japanese kana remains in German output`);
    assert(!/kr\.shibamuscle\.com|cn\.shibamuscle\.com|de\.shibamuscle\.com/.test(html), `${entry.relativePath}: legacy locale subdomain remains`);
}

function auditSectionDrift(entry, localizedHtml) {
    const jaPath = join(ROOT, entry.file);
    if (!existsSync(jaPath)) {
        return;
    }

    const jaHtml = readFileSync(jaPath, "utf8");
    const jaSignature = buildStructureSignature(jaHtml);
    const localizedSignature = buildStructureSignature(localizedHtml);

    assert(JSON.stringify(jaSignature) === JSON.stringify(localizedSignature), `${entry.relativePath}: section/table structure drifted from Japanese canonical page`);
}

function buildStructureSignature(html) {
    return {
        sectionIds: Array.from(html.matchAll(/<h[23]\s+id="([^"]+)"\s+class="section-title"/g)).map((match) => match[1]),
        tables: count(html, /<table\b/g),
        cards: count(html, /class="exercise-card"/g),
        averageTables: count(html, /class="average-section-table"/g),
        standardsGroups: count(html, /data-tab-group="Standards Exercise"/g),
        tabs: count(html, /<div class="tab/g)
    };
}

function auditInternalLinks(entry, html) {
    const links = Array.from(html.matchAll(/<a\b[^>]*href="([^"]+)"/g)).map((match) => match[1]);

    links.forEach((href) => {
        if (shouldSkipHref(href)) {
            return;
        }

        const resolved = resolveInternalHref(entry.relativePath, href);
        if (!resolved.endsWith(".html")) {
            return;
        }

        assert(availableHtml.has(resolved), `${entry.relativePath}: broken internal link to ${href}`);
    });
}

function shouldSkipHref(href) {
    return !href
        || href.startsWith("#")
        || href.startsWith("mailto:")
        || href.startsWith("tel:")
        || href.startsWith("javascript:")
        || /^https?:\/\//i.test(href);
}

function resolveInternalHref(from, href) {
    const withoutHash = href.split("#")[0];
    const baseDir = posix.dirname(from);
    return posix.normalize(posix.join(baseDir === "." ? "" : baseDir, withoutHash));
}

function count(text, pattern) {
    return (text.match(pattern) || []).length;
}

function assert(condition, message) {
    if (!condition) {
        errors.push(message);
    }
}

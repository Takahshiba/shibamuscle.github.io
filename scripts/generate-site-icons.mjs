#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
    copyFileSync,
    existsSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative } from "node:path";
import { deflateSync, inflateSync } from "node:zlib";

const ROOT = process.cwd();
const SOURCE_ICON = join(ROOT, "assets", "app", "shiba-mascot.png");
const ASSETS_DIR = join(ROOT, "assets");

const STANDARD_ICON_SIZES = [16, 24, 32, 36, 48, 72, 96, 128, 144, 152, 160, 192, 196, 256, 384, 512];
const ANDROID_ICON_SIZES = [36, 48, 72, 96, 128, 144, 152, 192, 256, 384, 512];
const APPLE_TOUCH_SIZES = [57, 60, 72, 76, 114, 120, 144, 152, 180];
const SITE_TILE_TARGETS = [
    { file: "site-tile-70x70.png", width: 70, height: 70 },
    { file: "site-tile-150x150.png", width: 150, height: 150 },
    { file: "site-tile-310x310.png", width: 310, height: 310 },
    { file: "site-tile-310x150.png", width: 310, height: 150, fit: 150 }
];
const ICO_SIZES = [16, 24, 32, 48];
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const CRC_TABLE = buildCrcTable();

if (!existsSync(SOURCE_ICON)) {
    throw new Error(`Source icon not found: ${relative(ROOT, SOURCE_ICON)}`);
}

const targets = [
    squareTarget("dumbbell-logo.png", 58),
    ...STANDARD_ICON_SIZES.map((size) => squareTarget(`icon-${size}x${size}.png`, size)),
    ...ANDROID_ICON_SIZES.map((size) => squareTarget(`android-chrome-${size}x${size}.png`, size)),
    ...APPLE_TOUCH_SIZES.flatMap((size) => [
        squareTarget(`apple-touch-icon-${size}x${size}.png`, size),
        squareTarget(`apple-touch-icon-${size}x${size}-precomposed.png`, size)
    ]),
    squareTarget("apple-touch-icon.png", 180),
    squareTarget("apple-touch-icon-precomposed.png", 180),
    ...SITE_TILE_TARGETS.map((target) => ({
        ...target,
        path: join(ASSETS_DIR, target.file),
        fit: target.fit || Math.min(target.width, target.height)
    }))
];

const tempDir = mkdtempSync(join(tmpdir(), "shiba-site-icons-"));

try {
    const generatedPngs = generatePngTargets(tempDir, targets);
    const favicon = buildFavicon(tempDir);

    for (const [targetPath, tempPath] of generatedPngs.entries()) {
        mkdirSync(dirname(targetPath), { recursive: true });
        copyFileSync(tempPath, targetPath);
    }

    writeFileSync(join(ASSETS_DIR, "favicon.ico"), favicon);
    writeFileSync(join(ROOT, "favicon.ico"), favicon);

    console.log(`Generated ${targets.length} PNG icon assets and favicon.ico from ${relative(ROOT, SOURCE_ICON)}.`);
} finally {
    rmSync(tempDir, { recursive: true, force: true });
}

function squareTarget(file, size) {
    return {
        file,
        path: join(ASSETS_DIR, file),
        width: size,
        height: size,
        fit: size
    };
}

function generatePngTargets(tempDir, iconTargets) {
    const generated = new Map();

    for (const target of iconTargets) {
        const tempPath = join(tempDir, target.file);

        if (target.width === target.height) {
            resizePng(SOURCE_ICON, tempPath, target.width, target.height);
        } else {
            const fittedPath = join(tempDir, `${basename(target.file, ".png")}-fit.png`);
            resizePng(SOURCE_ICON, fittedPath, target.fit, target.fit);
            const fitted = decodePng(readFileSync(fittedPath));
            const centered = centerImage(fitted, target.width, target.height);
            writeFileSync(tempPath, encodePng(centered.width, centered.height, centered.rgba));
        }

        generated.set(target.path, tempPath);
    }

    return generated;
}

function resizePng(input, output, width, height) {
    const result = spawnSync("sips", [
        "-s",
        "format",
        "png",
        "-z",
        String(height),
        String(width),
        input,
        "--out",
        output
    ], {
        cwd: ROOT,
        encoding: "utf8"
    });

    if (result.error) {
        throw result.error;
    }

    if (result.status !== 0) {
        throw new Error(`sips failed for ${basename(output)}:\n${result.stderr || result.stdout}`);
    }
}

function buildFavicon(tempDir) {
    const entries = ICO_SIZES.map((size) => {
        const tempPath = join(tempDir, `favicon-${size}x${size}.png`);
        resizePng(SOURCE_ICON, tempPath, size, size);
        return {
            width: size,
            height: size,
            bytes: readFileSync(tempPath)
        };
    });

    const headerSize = 6;
    const entrySize = 16;
    let imageOffset = headerSize + entries.length * entrySize;

    const header = Buffer.alloc(headerSize);
    header.writeUInt16LE(0, 0);
    header.writeUInt16LE(1, 2);
    header.writeUInt16LE(entries.length, 4);

    const directory = entries.map((entry) => {
        const buffer = Buffer.alloc(entrySize);
        buffer.writeUInt8(entry.width >= 256 ? 0 : entry.width, 0);
        buffer.writeUInt8(entry.height >= 256 ? 0 : entry.height, 1);
        buffer.writeUInt8(0, 2);
        buffer.writeUInt8(0, 3);
        buffer.writeUInt16LE(1, 4);
        buffer.writeUInt16LE(32, 6);
        buffer.writeUInt32LE(entry.bytes.length, 8);
        buffer.writeUInt32LE(imageOffset, 12);
        imageOffset += entry.bytes.length;
        return buffer;
    });

    return Buffer.concat([header, ...directory, ...entries.map((entry) => entry.bytes)]);
}

function centerImage(source, width, height) {
    const rgba = Buffer.alloc(width * height * 4, 0);
    const offsetX = Math.floor((width - source.width) / 2);
    const offsetY = Math.floor((height - source.height) / 2);

    if (offsetX < 0 || offsetY < 0) {
        throw new Error(`Cannot fit ${source.width}x${source.height} image into ${width}x${height} canvas.`);
    }

    for (let y = 0; y < source.height; y += 1) {
        const sourceStart = y * source.width * 4;
        const sourceEnd = sourceStart + source.width * 4;
        const targetStart = ((y + offsetY) * width + offsetX) * 4;
        source.rgba.copy(rgba, targetStart, sourceStart, sourceEnd);
    }

    return { width, height, rgba };
}

function decodePng(buffer) {
    if (!buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
        throw new Error("Invalid PNG signature.");
    }

    let offset = PNG_SIGNATURE.length;
    let width = 0;
    let height = 0;
    let bitDepth = 0;
    let colorType = 0;
    const idatChunks = [];

    while (offset < buffer.length) {
        const length = buffer.readUInt32BE(offset);
        const type = buffer.toString("ascii", offset + 4, offset + 8);
        const dataStart = offset + 8;
        const dataEnd = dataStart + length;
        const data = buffer.subarray(dataStart, dataEnd);
        offset = dataEnd + 4;

        if (type === "IHDR") {
            width = data.readUInt32BE(0);
            height = data.readUInt32BE(4);
            bitDepth = data.readUInt8(8);
            colorType = data.readUInt8(9);

            if (data.readUInt8(10) !== 0 || data.readUInt8(11) !== 0 || data.readUInt8(12) !== 0) {
                throw new Error("Unsupported PNG compression, filter, or interlace method.");
            }
        } else if (type === "IDAT") {
            idatChunks.push(data);
        } else if (type === "IEND") {
            break;
        }
    }

    if (bitDepth !== 8) {
        throw new Error(`Unsupported PNG bit depth: ${bitDepth}`);
    }

    const channels = channelsForColorType(colorType);
    const stride = width * channels;
    const inflated = inflateSync(Buffer.concat(idatChunks));
    const rgba = Buffer.alloc(width * height * 4);
    let inputOffset = 0;
    let previous = Buffer.alloc(stride, 0);

    for (let y = 0; y < height; y += 1) {
        const filter = inflated.readUInt8(inputOffset);
        inputOffset += 1;
        const row = Buffer.from(inflated.subarray(inputOffset, inputOffset + stride));
        inputOffset += stride;
        unfilterRow(row, previous, channels, filter);
        copyRowToRgba(row, rgba, y, width, channels, colorType);
        previous = row;
    }

    return { width, height, rgba };
}

function channelsForColorType(colorType) {
    if (colorType === 6) {
        return 4;
    }
    if (colorType === 2) {
        return 3;
    }
    if (colorType === 4) {
        return 2;
    }
    if (colorType === 0) {
        return 1;
    }

    throw new Error(`Unsupported PNG color type: ${colorType}`);
}

function unfilterRow(row, previous, bytesPerPixel, filter) {
    for (let i = 0; i < row.length; i += 1) {
        const left = i >= bytesPerPixel ? row[i - bytesPerPixel] : 0;
        const up = previous[i] || 0;
        const upLeft = i >= bytesPerPixel ? previous[i - bytesPerPixel] || 0 : 0;

        if (filter === 1) {
            row[i] = (row[i] + left) & 0xff;
        } else if (filter === 2) {
            row[i] = (row[i] + up) & 0xff;
        } else if (filter === 3) {
            row[i] = (row[i] + Math.floor((left + up) / 2)) & 0xff;
        } else if (filter === 4) {
            row[i] = (row[i] + paethPredictor(left, up, upLeft)) & 0xff;
        } else if (filter !== 0) {
            throw new Error(`Unsupported PNG filter: ${filter}`);
        }
    }
}

function paethPredictor(left, up, upLeft) {
    const estimate = left + up - upLeft;
    const leftDistance = Math.abs(estimate - left);
    const upDistance = Math.abs(estimate - up);
    const upLeftDistance = Math.abs(estimate - upLeft);

    if (leftDistance <= upDistance && leftDistance <= upLeftDistance) {
        return left;
    }
    if (upDistance <= upLeftDistance) {
        return up;
    }
    return upLeft;
}

function copyRowToRgba(row, rgba, y, width, channels, colorType) {
    for (let x = 0; x < width; x += 1) {
        const sourceOffset = x * channels;
        const targetOffset = (y * width + x) * 4;

        if (colorType === 6) {
            row.copy(rgba, targetOffset, sourceOffset, sourceOffset + 4);
        } else if (colorType === 2) {
            row.copy(rgba, targetOffset, sourceOffset, sourceOffset + 3);
            rgba[targetOffset + 3] = 255;
        } else if (colorType === 4) {
            rgba[targetOffset] = row[sourceOffset];
            rgba[targetOffset + 1] = row[sourceOffset];
            rgba[targetOffset + 2] = row[sourceOffset];
            rgba[targetOffset + 3] = row[sourceOffset + 1];
        } else {
            rgba[targetOffset] = row[sourceOffset];
            rgba[targetOffset + 1] = row[sourceOffset];
            rgba[targetOffset + 2] = row[sourceOffset];
            rgba[targetOffset + 3] = 255;
        }
    }
}

function encodePng(width, height, rgba) {
    const raw = Buffer.alloc((width * 4 + 1) * height);
    let offset = 0;

    for (let y = 0; y < height; y += 1) {
        raw[offset] = 0;
        offset += 1;
        rgba.copy(raw, offset, y * width * 4, (y + 1) * width * 4);
        offset += width * 4;
    }

    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr.writeUInt8(8, 8);
    ihdr.writeUInt8(6, 9);
    ihdr.writeUInt8(0, 10);
    ihdr.writeUInt8(0, 11);
    ihdr.writeUInt8(0, 12);

    return Buffer.concat([
        PNG_SIGNATURE,
        pngChunk("IHDR", ihdr),
        pngChunk("IDAT", deflateSync(raw, { level: 9 })),
        pngChunk("IEND", Buffer.alloc(0))
    ]);
}

function pngChunk(type, data) {
    const typeBuffer = Buffer.from(type, "ascii");
    const length = Buffer.alloc(4);
    const crc = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);
    crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
    return Buffer.concat([length, typeBuffer, data, crc]);
}

function buildCrcTable() {
    const table = [];
    for (let n = 0; n < 256; n += 1) {
        let c = n;
        for (let k = 0; k < 8; k += 1) {
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }
        table[n] = c >>> 0;
    }
    return table;
}

function crc32(buffer) {
    let crc = 0xffffffff;
    for (const byte of buffer) {
        crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
}

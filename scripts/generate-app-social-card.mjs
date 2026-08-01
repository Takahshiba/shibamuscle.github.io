#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deflateSync, inflateSync } from "node:zlib";

import { ASSETS_ROOT } from "./source-data.mjs";

const WIDTH = 1200;
const HEIGHT = 630;
const OUTPUT_PATH = join(ASSETS_ROOT, "app", "shiba-social-card.png");
const appAsset = (file) => join(ASSETS_ROOT, "app", file);

function main() {
    const card = createImage(WIDTH, HEIGHT);
    const share = readPng(appAsset("website/share-summary.png"));
    const analytics = readPng(appAsset("website/analytics.png"));
    const heatmap = readPng(appAsset("website/heatmap.png"));
    const today = readPng(appAsset("website/today.png"));
    const mascot = readPng(appAsset("shiba-mascot.png"));

    renderBackground(card);
    drawRadialGlow(card, 950, 118, 440, [255, 106, 0], 0.34);
    drawRadialGlow(card, 190, 530, 290, [255, 154, 36], 0.2);
    fillRoundedRect(card, 36, 32, 1128, 566, 28, [255, 255, 255, 20]);
    fillRoundedRect(card, 52, 48, 1096, 534, 22, [3, 3, 3, 184]);

    drawText(card, "SHIBA", 78, 78, 10, [255, 154, 36, 255]);
    drawText(card, "LIFT", 82, 168, 5, [255, 255, 255, 245]);
    drawText(card, "TRACK", 82, 212, 5, [255, 255, 255, 245]);
    drawText(card, "SHARE", 82, 256, 5, [255, 255, 255, 245]);
    drawText(card, "WORKOUT PROOF", 84, 316, 3, [214, 214, 214, 255]);
    drawText(card, "SHIBAMUSCLE.COM", 84, 548, 3, [255, 154, 36, 255]);
    drawImageContain(card, mascot, 106, 338, 150, 150);

    fillRoundedRect(card, 330, 342, 232, 150, 22, [7, 6, 5, 218]);
    fillRoundedRect(card, 346, 358, 200, 118, 16, [255, 106, 0, 34]);
    drawText(card, "SAVE SHARE", 364, 382, 4, [255, 255, 255, 255]);
    drawText(card, "THE WORK", 370, 434, 4, [255, 154, 36, 255]);

    [
        [share, 600, 74, 184, 430],
        [analytics, 770, 112, 184, 430],
        [heatmap, 940, 70, 176, 430]
    ].forEach(([image, x, y, width, height]) => {
        fillRoundedRect(card, x - 8, y + 14, width + 16, height + 8, 34, [0, 0, 0, 128]);
        fillRoundedRect(card, x - 3, y - 3, width + 6, height + 6, 30, [255, 106, 0, 80]);
        drawImageCover(card, image, x, y, width, height, 28);
    });

    fillRoundedRect(card, 610, 518, 500, 42, 10, [255, 106, 0, 224]);
    drawText(card, "FAST PRIVATE FOCUSED", 646, 532, 2, [19, 8, 0, 255]);

    writeFileSync(OUTPUT_PATH, encodePng(card));
    console.log("Generated app social card asset.");
}

function createImage(width, height) {
    return {
        width,
        height,
        pixels: new Uint8Array(width * height * 4)
    };
}

function readPng(filePath) {
    const buffer = readFileSync(filePath);
    const signature = buffer.subarray(0, 8);
    if (signature.toString("hex") !== "89504e470d0a1a0a") {
        throw new Error(`${filePath}: invalid PNG signature`);
    }

    let offset = 8;
    let width = 0;
    let height = 0;
    let bitDepth = 0;
    let colorType = 0;
    const idat = [];

    while (offset < buffer.length) {
        const length = buffer.readUInt32BE(offset);
        const type = buffer.subarray(offset + 4, offset + 8).toString("ascii");
        const data = buffer.subarray(offset + 8, offset + 8 + length);
        offset += 12 + length;

        if (type === "IHDR") {
            width = data.readUInt32BE(0);
            height = data.readUInt32BE(4);
            bitDepth = data[8];
            colorType = data[9];
            if (data[12] !== 0) {
                throw new Error(`${filePath}: interlaced PNG is not supported`);
            }
        } else if (type === "IDAT") {
            idat.push(data);
        } else if (type === "IEND") {
            break;
        }
    }

    if (bitDepth !== 8 || ![2, 6].includes(colorType)) {
        throw new Error(`${filePath}: only 8-bit RGB/RGBA PNG assets are supported`);
    }

    const channels = colorType === 6 ? 4 : 3;
    const inflated = inflateSync(Buffer.concat(idat));
    const raw = unfilterPngRows(inflated, width, height, channels);
    const pixels = new Uint8Array(width * height * 4);

    for (let source = 0, target = 0; target < pixels.length; target += 4) {
        pixels[target] = raw[source++];
        pixels[target + 1] = raw[source++];
        pixels[target + 2] = raw[source++];
        pixels[target + 3] = channels === 4 ? raw[source++] : 255;
    }

    return { width, height, pixels };
}

function unfilterPngRows(data, width, height, channels) {
    const rowLength = width * channels;
    const output = new Uint8Array(rowLength * height);
    let inputOffset = 0;

    for (let y = 0; y < height; y += 1) {
        const filter = data[inputOffset];
        inputOffset += 1;
        const rowOffset = y * rowLength;
        const previousRowOffset = (y - 1) * rowLength;

        for (let x = 0; x < rowLength; x += 1) {
            const left = x >= channels ? output[rowOffset + x - channels] : 0;
            const up = y > 0 ? output[previousRowOffset + x] : 0;
            const upLeft = y > 0 && x >= channels ? output[previousRowOffset + x - channels] : 0;
            const value = data[inputOffset + x];

            output[rowOffset + x] = (value + getPngFilterPrediction(filter, left, up, upLeft)) & 255;
        }

        inputOffset += rowLength;
    }

    return output;
}

function getPngFilterPrediction(filter, left, up, upLeft) {
    if (filter === 0) return 0;
    if (filter === 1) return left;
    if (filter === 2) return up;
    if (filter === 3) return Math.floor((left + up) / 2);
    if (filter === 4) return paeth(left, up, upLeft);
    throw new Error(`Unsupported PNG filter ${filter}`);
}

function paeth(left, up, upLeft) {
    const estimate = left + up - upLeft;
    const leftDistance = Math.abs(estimate - left);
    const upDistance = Math.abs(estimate - up);
    const upLeftDistance = Math.abs(estimate - upLeft);
    if (leftDistance <= upDistance && leftDistance <= upLeftDistance) return left;
    return upDistance <= upLeftDistance ? up : upLeft;
}

function encodePng(image) {
    const rowLength = image.width * 4;
    const raw = Buffer.alloc((rowLength + 1) * image.height);

    for (let y = 0; y < image.height; y += 1) {
        const rowStart = y * (rowLength + 1);
        raw[rowStart] = 0;
        raw.set(image.pixels.subarray(y * rowLength, (y + 1) * rowLength), rowStart + 1);
    }

    return Buffer.concat([
        Buffer.from("89504e470d0a1a0a", "hex"),
        pngChunk("IHDR", Buffer.from([
            ...uint32(image.width),
            ...uint32(image.height),
            8,
            6,
            0,
            0,
            0
        ])),
        pngChunk("IDAT", deflateSync(raw, { level: 9 })),
        pngChunk("IEND", Buffer.alloc(0))
    ]);
}

function pngChunk(type, data) {
    const typeBuffer = Buffer.from(type, "ascii");
    const length = Buffer.from(uint32(data.length));
    const crc = Buffer.from(uint32(crc32(Buffer.concat([typeBuffer, data]))));
    return Buffer.concat([length, typeBuffer, data, crc]);
}

function uint32(value) {
    return [
        (value >>> 24) & 255,
        (value >>> 16) & 255,
        (value >>> 8) & 255,
        value & 255
    ];
}

const CRC_TABLE = new Uint32Array(256).map((_, index) => {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
        value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    return value >>> 0;
});

function crc32(buffer) {
    let crc = 0xffffffff;
    for (const byte of buffer) {
        crc = CRC_TABLE[(crc ^ byte) & 255] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function renderBackground(image) {
    for (let y = 0; y < image.height; y += 1) {
        for (let x = 0; x < image.width; x += 1) {
            const t = (x / image.width) * 0.64 + (y / image.height) * 0.36;
            setPixel(image, x, y, [
                Math.round(3 + 20 * t),
                Math.round(3 + 10 * t),
                Math.round(3 + 4 * t),
                255
            ]);
        }
    }
}

function drawRadialGlow(image, cx, cy, radius, color, opacity) {
    const left = Math.max(0, Math.floor(cx - radius));
    const right = Math.min(image.width - 1, Math.ceil(cx + radius));
    const top = Math.max(0, Math.floor(cy - radius));
    const bottom = Math.min(image.height - 1, Math.ceil(cy + radius));

    for (let y = top; y <= bottom; y += 1) {
        for (let x = left; x <= right; x += 1) {
            const distance = Math.hypot(x - cx, y - cy) / radius;
            if (distance > 1) continue;
            const alpha = Math.round(255 * opacity * (1 - distance) ** 2);
            blendPixel(image, x, y, [color[0], color[1], color[2], alpha]);
        }
    }
}

function fillRoundedRect(image, x, y, width, height, radius, color) {
    const left = Math.max(0, Math.floor(x));
    const right = Math.min(image.width, Math.ceil(x + width));
    const top = Math.max(0, Math.floor(y));
    const bottom = Math.min(image.height, Math.ceil(y + height));

    for (let py = top; py < bottom; py += 1) {
        for (let px = left; px < right; px += 1) {
            if (insideRoundedRect(px + 0.5 - x, py + 0.5 - y, width, height, radius)) {
                blendPixel(image, px, py, color);
            }
        }
    }
}

function insideRoundedRect(x, y, width, height, radius) {
    const innerX = x < radius ? radius : x > width - radius ? width - radius : x;
    const innerY = y < radius ? radius : y > height - radius ? height - radius : y;
    return Math.hypot(x - innerX, y - innerY) <= radius;
}

function drawImageContain(target, source, x, y, width, height) {
    drawScaledImage(target, source, x, y, width, height, {
        scale: Math.min(width / source.width, height / source.height),
        radius: 0
    });
}

function drawImageCover(target, source, x, y, width, height, radius) {
    drawScaledImage(target, source, x, y, width, height, {
        scale: Math.max(width / source.width, height / source.height),
        radius
    });
}

function drawScaledImage(target, source, x, y, width, height, { scale, radius }) {
    const renderedWidth = source.width * scale;
    const renderedHeight = source.height * scale;
    const offsetX = (width - renderedWidth) / 2;
    const offsetY = (height - renderedHeight) / 2;

    for (let dy = 0; dy < height; dy += 1) {
        for (let dx = 0; dx < width; dx += 1) {
            if (radius && !insideRoundedRect(dx + 0.5, dy + 0.5, width, height, radius)) {
                continue;
            }

            const sx = (dx - offsetX) / scale;
            const sy = (dy - offsetY) / scale;
            if (sx < 0 || sy < 0 || sx >= source.width || sy >= source.height) {
                continue;
            }

            const color = sampleBilinear(source, sx, sy);
            blendPixel(target, x + dx, y + dy, color);
        }
    }
}

function sampleBilinear(image, x, y) {
    const x0 = Math.max(0, Math.floor(x));
    const y0 = Math.max(0, Math.floor(y));
    const x1 = Math.min(image.width - 1, x0 + 1);
    const y1 = Math.min(image.height - 1, y0 + 1);
    const tx = x - x0;
    const ty = y - y0;
    const c00 = getPixel(image, x0, y0);
    const c10 = getPixel(image, x1, y0);
    const c01 = getPixel(image, x0, y1);
    const c11 = getPixel(image, x1, y1);

    return [0, 1, 2, 3].map((channel) => {
        const top = c00[channel] * (1 - tx) + c10[channel] * tx;
        const bottom = c01[channel] * (1 - tx) + c11[channel] * tx;
        return Math.round(top * (1 - ty) + bottom * ty);
    });
}

function drawText(image, text, x, y, scale, color) {
    let cursor = x;
    for (const character of text.toUpperCase()) {
        if (character === " ") {
            cursor += scale * 4;
            continue;
        }

        const glyph = FONT[character] || FONT["?"];
        glyph.forEach((row, rowIndex) => {
            Array.from(row).forEach((cell, columnIndex) => {
                if (cell === "1") {
                    fillRect(image, cursor + columnIndex * scale, y + rowIndex * scale, scale, scale, color);
                }
            });
        });
        cursor += (glyph[0].length + 1) * scale;
    }
}

function fillRect(image, x, y, width, height, color) {
    const left = Math.max(0, Math.floor(x));
    const right = Math.min(image.width, Math.ceil(x + width));
    const top = Math.max(0, Math.floor(y));
    const bottom = Math.min(image.height, Math.ceil(y + height));
    for (let py = top; py < bottom; py += 1) {
        for (let px = left; px < right; px += 1) {
            blendPixel(image, px, py, color);
        }
    }
}

function getPixel(image, x, y) {
    const offset = (y * image.width + x) * 4;
    return [
        image.pixels[offset],
        image.pixels[offset + 1],
        image.pixels[offset + 2],
        image.pixels[offset + 3]
    ];
}

function setPixel(image, x, y, color) {
    const offset = (y * image.width + x) * 4;
    image.pixels[offset] = color[0];
    image.pixels[offset + 1] = color[1];
    image.pixels[offset + 2] = color[2];
    image.pixels[offset + 3] = color[3];
}

function blendPixel(image, x, y, color) {
    if (x < 0 || y < 0 || x >= image.width || y >= image.height) return;
    const offset = (y * image.width + x) * 4;
    const alpha = (color[3] ?? 255) / 255;
    const inverse = 1 - alpha;

    image.pixels[offset] = Math.round(color[0] * alpha + image.pixels[offset] * inverse);
    image.pixels[offset + 1] = Math.round(color[1] * alpha + image.pixels[offset + 1] * inverse);
    image.pixels[offset + 2] = Math.round(color[2] * alpha + image.pixels[offset + 2] * inverse);
    image.pixels[offset + 3] = 255;
}

const FONT = {
    "?": ["111", "001", "011", "010", "000", "010", "000"],
    ".": ["0", "0", "0", "0", "0", "1", "0"],
    "%": ["10001", "00010", "00100", "01000", "10001", "00000", "00000"],
    "0": ["111", "101", "101", "101", "101", "101", "111"],
    "1": ["010", "110", "010", "010", "010", "010", "111"],
    "2": ["111", "001", "001", "111", "100", "100", "111"],
    "3": ["111", "001", "001", "111", "001", "001", "111"],
    "4": ["101", "101", "101", "111", "001", "001", "001"],
    "5": ["111", "100", "100", "111", "001", "001", "111"],
    "6": ["111", "100", "100", "111", "101", "101", "111"],
    "7": ["111", "001", "001", "010", "010", "010", "010"],
    "8": ["111", "101", "101", "111", "101", "101", "111"],
    "9": ["111", "101", "101", "111", "001", "001", "111"],
    A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
    B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
    C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
    D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
    E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
    F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
    G: ["01111", "10000", "10000", "10111", "10001", "10001", "01111"],
    H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
    I: ["111", "010", "010", "010", "010", "010", "111"],
    J: ["00111", "00010", "00010", "00010", "10010", "10010", "01100"],
    K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
    L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
    M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
    N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
    O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
    P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
    Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
    R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
    S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
    T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
    U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
    V: ["10001", "10001", "10001", "10001", "01010", "01010", "00100"],
    W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
    X: ["10001", "01010", "00100", "00100", "00100", "01010", "10001"],
    Y: ["10001", "01010", "00100", "00100", "00100", "00100", "00100"],
    Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"]
};

main();

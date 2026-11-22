import { NextResponse } from "next/server";
import { deflateSync } from "node:zlib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const FIRESTORE_URL = "https://firestore.googleapis.com/v1/projects/zara-shadi-service/databases/(default)/documents/settings/branding";

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const name = Buffer.from(type);
  const body = Buffer.concat([name, data]);
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body), 8 + data.length);
  return out;
}

function makeFallbackPng(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const purple = [124, 58, 237, 255];
  const white = [255, 255, 255, 255];
  const outerR = size * 0.245;
  const innerR = size * 0.215;
  const outerX = size * 0.43;
  const centerY = size * 0.51;
  const innerX = size * 0.535;
  const innerY = size * 0.455;
  const starX = size * 0.69;
  const starY = size * 0.30;
  const starR = size * 0.075;

  function inStar(x, y) {
    const points = [];
    for (let i = 0; i < 10; i++) {
      const angle = -Math.PI / 2 + i * Math.PI / 5;
      const radius = i % 2 === 0 ? starR : starR * 0.43;
      points.push([starX + Math.cos(angle) * radius, starY + Math.sin(angle) * radius]);
    }
    let inside = false;
    for (let i = 0, j = 9; i < 10; j = i++) {
      const [xi, yi] = points[i];
      const [xj, yj] = points[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - outerX;
      const dy = y - centerY;
      const outer = dx * dx + dy * dy <= outerR * outerR;
      const ix = x - innerX;
      const iy = y - innerY;
      const inner = ix * ix + iy * iy <= innerR * innerR;
      const whiteShape = (outer && !inner) || inStar(x, y);
      const color = whiteShape ? white : purple;
      const offset = (y * size + x) * 4;
      pixels[offset] = color[0];
      pixels[offset + 1] = color[1];
      pixels[offset + 2] = color[2];
      pixels[offset + 3] = color[3];
    }
  }

  const scanlines = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    const target = y * (1 + size * 4);
    scanlines[target] = 0;
    pixels.copy(scanlines, target + 1, y * size * 4, (y + 1) * size * 4);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(scanlines)),
    pngChunk("IEND", Buffer.alloc(0))
  ]);
}

export async function GET(request) {
  const requestedSize = new URL(request.url).searchParams.get("size");
  const size = requestedSize === "192" ? 192 : 512;

  try {
    const response = await fetch(FIRESTORE_URL, { cache: "no-store" });
    if (response.ok) {
      const doc = await response.json();
      const fields = doc?.fields || {};
      const value =
        fields["appIcon" + size]?.stringValue ||
        fields.appIcon512?.stringValue ||
        fields.appIcon?.stringValue ||
        "";
      const match = value.match(/^data:image\/png;base64,(.+)$/s);
      if (match) {
        const bytes = Buffer.from(match[1], "base64");
        const isPng = bytes.length > 24 &&
          bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
          bytes.toString("ascii", 12, 16) === "IHDR";
        if (isPng) {
          return new NextResponse(bytes, {
            status: 200,
            headers: {
              "Content-Type": "image/png",
              "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"
            }
          });
        }
      }
    }
  } catch (error) {}

  return new NextResponse(makeFallbackPng(size), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600"
    }
  });
}

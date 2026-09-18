/**
 * Gera os ícones/splash do ValiFood (PNG) desenhando o símbolo da marca em
 * vetor (mesma geometria do componente `LogoMark`).
 *
 * Uso: node tools/generate-assets.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const ROOT = path.resolve(import.meta.dirname, '..');
const ASSETS = path.join(ROOT, 'assets');

const BRAND = {
  primary: [0x08, 0x5d, 0x38],
  accent: [0xa8, 0xd9, 0x6c],
  white: [0xff, 0xff, 0xff],
};

/* ------------------------------ PNG encoder ------------------------------- */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let crc = -1;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0; // filtro "none"
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ------------------------------- Geometria -------------------------------- */

// Mesmas coordenadas do componente LogoMark (viewBox 100x100).
const ARM_LEFT = { ax: 23, ay: 20, bx: 45, by: 74 };
const ARM_RIGHT = { ax: 45, ay: 74, bx: 60, by: 36 };
const STROKE_RADIUS = 17 / 2;
const LEAF = { cx: 60, cy: 42, angle: -40, halfLength: 23, halfWidth: 12.5 };

function distanceToSegment(px, py, { ax, ay, bx, by }) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function insideStroke(px, py) {
  return (
    distanceToSegment(px, py, ARM_LEFT) <= STROKE_RADIUS ||
    distanceToSegment(px, py, ARM_RIGHT) <= STROKE_RADIUS
  );
}

function insideLeaf(px, py) {
  const radians = (LEAF.angle * Math.PI) / 180;
  const ux = Math.cos(radians);
  const uy = Math.sin(radians);
  const dx = px - LEAF.cx;
  const dy = py - LEAF.cy;
  const t = Math.abs(dx * ux + dy * uy) / LEAF.halfLength;
  const s = Math.abs(-dx * uy + dy * ux) / LEAF.halfWidth;
  return t ** 1.6 + s ** 1.6 <= 1; // superelipse = folha com pontas
}

/* ------------------------------- Renderer --------------------------------- */

const SAMPLES = 3; // antialiasing por supersampling 3x3
const VIEWBOX = 100;

/** Bounding box do símbolo em coordenadas do viewBox (amostragem fina). */
function computeBounds() {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const step = 0.25;
  for (let y = 0; y <= VIEWBOX; y += step) {
    for (let x = 0; x <= VIEWBOX; x += step) {
      if (insideStroke(x, y) || insideLeaf(x, y)) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, minY, maxX, maxY };
}

const BOUNDS = computeBounds();
const BOUNDS_CENTER = {
  x: (BOUNDS.minX + BOUNDS.maxX) / 2,
  y: (BOUNDS.minY + BOUNDS.maxY) / 2,
};
const BOUNDS_SIZE = Math.max(BOUNDS.maxX - BOUNDS.minX, BOUNDS.maxY - BOUNDS.minY);

/**
 * Desenha o símbolo (V + folha) num buffer RGBA.
 * @param {object} options
 * @param {number} options.size    lado da imagem em pixels
 * @param {number[]} options.vColor     cor RGB do "V"
 * @param {number[]} options.leafColor  cor RGB da folha
 * @param {number} options.fill    fração do lado ocupada pelo símbolo (0–1)
 * @param {number[]|null} options.backgroundColor cor de fundo opcional
 */
function renderMark({ size, vColor, leafColor, fill = 0.7, backgroundColor = null }) {
  const rgba = Buffer.alloc(size * size * 4);
  const center = size / 2;
  // pixels por unidade do viewBox
  const scale = (size * fill) / BOUNDS_SIZE;
  const toViewBox = (value) => (value - center) / scale + BOUNDS_CENTER.x;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let vCoverage = 0;
      let leafCoverage = 0;
      for (let sy = 0; sy < SAMPLES; sy += 1) {
        for (let sx = 0; sx < SAMPLES; sx += 1) {
          const px = toViewBox(x + (sx + 0.5) / SAMPLES);
          const py = (y + (sy + 0.5) / SAMPLES - center) / scale + BOUNDS_CENTER.y;
          if (insideLeaf(px, py)) leafCoverage += 1;
          else if (insideStroke(px, py)) vCoverage += 1;
        }
      }
      const total = SAMPLES * SAMPLES;
      const vAlpha = vCoverage / total;
      const leafAlpha = leafCoverage / total;
      const index = (y * size + x) * 4;

      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      if (backgroundColor) {
        [r, g, b] = backgroundColor;
        a = 1;
      }
      // Compõe o "V" e depois a folha por cima.
      if (vAlpha > 0) {
        r = r * (1 - vAlpha) + vColor[0] * vAlpha;
        g = g * (1 - vAlpha) + vColor[1] * vAlpha;
        b = b * (1 - vAlpha) + vColor[2] * vAlpha;
        a = Math.max(a, vAlpha);
      }
      if (leafAlpha > 0) {
        r = r * (1 - leafAlpha) + leafColor[0] * leafAlpha;
        g = g * (1 - leafAlpha) + leafColor[1] * leafAlpha;
        b = b * (1 - leafAlpha) + leafColor[2] * leafAlpha;
        a = Math.max(a, leafAlpha);
      }

      rgba[index] = Math.round(r);
      rgba[index + 1] = Math.round(g);
      rgba[index + 2] = Math.round(b);
      rgba[index + 3] = Math.round(Math.min(1, a) * 255);
    }
  }
  return rgba;
}

function write(fileName, size, rgba) {
  const target = path.join(ASSETS, fileName);
  fs.writeFileSync(target, encodePng(size, size, rgba));
  console.log(`✓ ${fileName} (${size}x${size}, ${fs.statSync(target).byteLength} bytes)`);
}

/* --------------------------------- Build ---------------------------------- */

// Ícone do app: fundo verde da marca + símbolo claro.
write('icon.png', 1024, renderMark({
  size: 1024,
  backgroundColor: BRAND.primary,
  vColor: BRAND.white,
  leafColor: BRAND.accent,
  fill: 0.66,
}));

// Adaptive icon (Android): frente transparente + fundo sólido.
write('android-icon-foreground.png', 1024, renderMark({
  size: 1024,
  vColor: BRAND.white,
  leafColor: BRAND.accent,
  fill: 0.5,
}));
write('android-icon-background.png', 1024, renderMark({
  size: 1024,
  backgroundColor: BRAND.primary,
  vColor: BRAND.primary,
  leafColor: BRAND.primary,
  fill: 0.5,
}));
write('android-icon-monochrome.png', 1024, renderMark({
  size: 1024,
  vColor: BRAND.white,
  leafColor: BRAND.white,
  fill: 0.5,
}));

// Splash: símbolo colorido sobre o fundo claro definido no app.json.
write('splash-icon.png', 512, renderMark({
  size: 512,
  vColor: BRAND.primary,
  leafColor: BRAND.accent,
  fill: 0.74,
}));

// Ícone de notificação do Android: silhueta branca sobre transparente.
write('notification-icon.png', 96, renderMark({
  size: 96,
  vColor: BRAND.white,
  leafColor: BRAND.white,
  fill: 0.8,
}));

// Favicon do bundle web.
write('favicon.png', 48, renderMark({
  size: 48,
  backgroundColor: BRAND.primary,
  vColor: BRAND.white,
  leafColor: BRAND.accent,
  fill: 0.7,
}));

console.log('\nAssets gerados em', ASSETS);
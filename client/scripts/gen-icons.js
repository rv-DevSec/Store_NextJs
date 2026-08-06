const zlib = require('zlib');
const fs = require('fs');

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePNG(width, height, rgbaFn) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = rgbaFn(x, y, width, height);
      const o = y * (stride + 1) + 1 + x * 4;
      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
      raw[o + 3] = a;
    }
  }

  const idat = zlib.deflateSync(raw, { level: 9 });
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

const hexToRgb = (hex) => {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

const BLUE = hexToRgb('#2563eb');
const BLUE_DARK = hexToRgb('#1d4ed8');
const WHITE = [255, 255, 255];

const blend = (fg, bg, alpha) => [
  Math.round(fg[0] * alpha + bg[0] * (1 - alpha)),
  Math.round(fg[1] * alpha + bg[1] * (1 - alpha)),
  Math.round(fg[2] * alpha + bg[2] * (1 - alpha)),
];

function gearIcon(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const d = Math.min(w, h);
  const rOuter = d * 0.38;
  const rInner = d * 0.16;
  const nTeeth = 12;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);

  const tooth = Math.floor((angle + Math.PI) / ((2 * Math.PI) / nTeeth));
  const toothStart = -Math.PI + tooth * ((2 * Math.PI) / nTeeth);
  const toothAngle = (angle - toothStart) / ((2 * Math.PI) / nTeeth);

  let rEdge;
  if (toothAngle < 0.5) {
    const t = toothAngle / 0.5;
    rEdge = rOuter * 0.78 + (rOuter - rOuter * 0.78) * Math.sin(t * Math.PI);
  } else {
    const t = (toothAngle - 0.5) / 0.5;
    rEdge = rOuter - (rOuter - rOuter * 0.78) * Math.sin(t * Math.PI);
  }

  if (dist < rInner) return WHITE;
  if (dist < rEdge) return WHITE;
  return null;
}

function makeIcon(size) {
  return encodePNG(size, size, (x, y, w, h) => {
    const bg = blend(BLUE, BLUE_DARK, y / h * 0.4);
    const gear = gearIcon(x, y, w, h);
    if (gear) return [...gear, 255];
    return [...bg, 255];
  });
}

function makeOg() {
  const w = 1200;
  const h = 630;
  return encodePNG(w, h, (x, y) => {
    const t = x / w;
    const bg = blend(BLUE, BLUE_DARK, 0.3 + t * 0.2);
    const dx = x - w * 0.5;
    const dy = y - h * 0.5;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 130) return [255, 255, 255, 255];
    if (dist < 170 && dist >= 130) return [255, 255, 255, 80];
    return [...bg, 255];
  });
}

const outDir = './public';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(`${outDir}/favicon.png`, makeIcon(64));
fs.writeFileSync(`${outDir}/icon.png`, makeIcon(256));
fs.writeFileSync(`${outDir}/apple-touch-icon.png`, makeIcon(180));
fs.writeFileSync(`${outDir}/og-image.png`, makeOg());
console.log('Generated icons:', fs.readdirSync(outDir).join(', '));

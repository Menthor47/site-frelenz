import { inflateSync } from 'node:zlib';
import { faviconPng, iconitaApple } from '../../src/lib/iconite';

// Iconițele PNG (§5.4; auditul din 2026-10-24, SEO-02). favicon.svg rămâne iconița principală; PNG-ul de 96×96 e pentru
// programele care nu citesc SVG, iar iconița Apple (180×180) e pentru ecranul de start al iPhone-ului, unde iOS umple
// transparența cu negru, deci are fundal opac.

/** Un PNG RGBA pe 8 biți, decodat: lățimea, înălțimea și culoarea [r, g, b, a] a unui pixel. */
function decodeaza(png: Uint8Array) {
  const v = new DataView(png.buffer, png.byteOffset, png.byteLength);
  const latime = v.getUint32(16);
  const inaltime = v.getUint32(20);
  if (png[24] !== 8 || png[25] !== 6) throw new Error('PNG-ul nu e RGBA pe 8 biți');
  const idat: Uint8Array[] = [];
  for (let i = 8; i < png.length; i += 12 + v.getUint32(i)) {
    if (String.fromCharCode(...png.subarray(i + 4, i + 8)) === 'IDAT') idat.push(png.subarray(i + 8, i + 8 + v.getUint32(i)));
  }
  const brut = inflateSync(Buffer.concat(idat));
  const rand = latime * 4;
  const px = new Uint8Array(rand * inaltime);
  // Filtrele PNG (0–4): fiecare octet se reface din cel din stânga (a), cel de deasupra (b) și cel din stânga-sus (c).
  for (let y = 0; y < inaltime; y++) {
    const filtru = brut[y * (rand + 1)] ?? 0;
    for (let x = 0; x < rand; x++) {
      const a = x >= 4 ? (px[y * rand + x - 4] ?? 0) : 0;
      const b = y > 0 ? (px[(y - 1) * rand + x] ?? 0) : 0;
      const c = x >= 4 && y > 0 ? (px[(y - 1) * rand + x - 4] ?? 0) : 0;
      const p = a + b - c;
      const paeth = Math.abs(p - a) <= Math.abs(p - b) && Math.abs(p - a) <= Math.abs(p - c) ? a : Math.abs(p - b) <= Math.abs(p - c) ? b : c;
      const predictie = [0, a, b, (a + b) >> 1, paeth][filtru] ?? 0;
      px[y * rand + x] = ((brut[y * (rand + 1) + 1 + x] ?? 0) + predictie) & 0xff;
    }
  }
  return { latime, inaltime, pixel: (x: number, y: number) => [...px.subarray((y * latime + x) * 4, (y * latime + x) * 4 + 4)] };
}

/** --blue (#2D6CDF), opac: miezul stației. */
const ALBASTRU = [45, 108, 223, 255];
/** --noapte (#0E1116), opac: fundalul antetului. */
const NOAPTE = [14, 17, 22, 255];

test('favicon-ul PNG: 96×96, stația albastră în mijloc, colțurile transparente, ca în favicon.svg', () => {
  const { latime, inaltime, pixel } = decodeaza(faviconPng());
  expect([latime, inaltime]).toEqual([96, 96]);
  expect(pixel(48, 48)).toEqual(ALBASTRU);
  expect(pixel(0, 0)[3]).toBe(0);
});

test('iconița Apple: 180×180, stația albastră în mijloc, pe fundalul opac al antetului', () => {
  const { latime, inaltime, pixel } = decodeaza(iconitaApple());
  expect([latime, inaltime]).toEqual([180, 180]);
  expect(pixel(90, 90)).toEqual(ALBASTRU);
  expect(pixel(0, 0)).toEqual(NOAPTE);
  expect(pixel(179, 179)).toEqual(NOAPTE);
});

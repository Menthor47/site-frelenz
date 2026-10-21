// Confirmă că fișierele woff2 livrate în dist/_astro conțin ș și ț cu virgulă (U+0218–U+021B).
// Subsetul „latin-ext” se recunoaște după `unicode-range` din @font-face (numele fișierelor sunt hash-uri):
// orice fișier al cărui interval acoperă U+0218 trebuie să aibă toate cele patru glife.
// Folosire: node scripts/check-font-glyphs.mjs [director-dist]
import { existsSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { create } from 'fontkit';

const OBLIGATORII = [0x0218, 0x0219, 0x021a, 0x021b]; // Ș ș Ț ț
const hex = (cp) => `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;

function* fisiere(dir) {
  for (const intrare of readdirSync(dir, { withFileTypes: true })) {
    const cale = join(dir, intrare.name);
    if (intrare.isDirectory()) yield* fisiere(cale);
    else if (intrare.isFile()) yield cale;
  }
}

/** "U+0000-00FF,U+0131,U+4??" -> [[0, 255], [305, 305], [1024, 1279]] */
export function parseUnicodeRange(valoare) {
  return valoare
    .split(',')
    .map((parte) => parte.trim().replace(/^U\+/i, ''))
    .filter(Boolean)
    .map((parte) => {
      if (parte.includes('?')) return [parseInt(parte.replaceAll('?', '0'), 16), parseInt(parte.replaceAll('?', 'F'), 16)];
      const [lo, hi = lo] = parte.split('-');
      return [parseInt(lo, 16), parseInt(hi, 16)];
    });
}

/** Pentru fiecare woff2 din @font-face: numele fișierului -> intervalele `unicode-range` (sau null dacă lipsește). */
export function intervaleDinCss(texte) {
  const rezultat = new Map();
  for (const text of texte) {
    for (const [bloc] of text.matchAll(/@font-face\s*\{[^}]*\}/g)) {
      const url = /url\(\s*["']?([^)"']+?\.woff2)(?:[?#][^)"']*)?["']?\s*\)/i.exec(bloc)?.[1];
      if (!url) continue;
      const interval = /unicode-range\s*:\s*([^;}]+)/i.exec(bloc)?.[1];
      rezultat.set(basename(url), interval ? parseUnicodeRange(interval) : null);
    }
  }
  return rezultat;
}

const acopera = (intervale, cp) => intervale === null || intervale.some(([lo, hi]) => cp >= lo && cp <= hi);

export function verifica(dist) {
  const astro = join(dist, '_astro');
  const erori = [];
  const woff2 = existsSync(astro) ? [...fisiere(astro)].filter((f) => extname(f) === '.woff2') : [];
  if (woff2.length === 0) return { erori: [`niciun fișier .woff2 în ${astro}`], latinExt: 0, total: 0 };

  const surse = [...fisiere(dist)]
    .filter((f) => ['.html', '.css'].includes(extname(f)))
    .map((f) => readFileSync(f, 'utf8'));
  const intervale = intervaleDinCss(surse);

  let latinExt = 0;
  for (const fisier of woff2) {
    const nume = basename(fisier);
    if (!intervale.has(nume)) {
      erori.push(`${nume}: nu e referit de niciun @font-face, deci nu știu ce subset este`);
      continue;
    }
    const interval = intervale.get(nume);
    if (!acopera(interval, 0x0218)) continue; // subsetul „latin”: nu trebuie să aibă ș/ț
    latinExt += 1;
    const font = create(readFileSync(fisier));
    const lipsa = OBLIGATORII.filter((cp) => !font.hasGlyphForCodePoint(cp));
    if (lipsa.length > 0) erori.push(`${nume} (latin-ext): lipsesc ${lipsa.map(hex).join(', ')}`);
  }
  if (latinExt === 0) erori.push('niciun fișier woff2 nu acoperă U+0218–U+021B (lipsește subsetul latin-ext)');
  return { erori, latinExt, total: woff2.length };
}

// realpath pe ambele părți: printr-un symlink/junction argv[1] nu e realpath-uit, iar import.meta.url da.
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  const dist = resolve(process.argv[2] ?? 'dist');
  if (!existsSync(dist)) {
    console.error(`check-font-glyphs: ${dist} lipsește. Rulează întâi \`npm run build\`.`);
    process.exit(1);
  }
  const { erori, latinExt, total } = verifica(dist);
  if (erori.length > 0) {
    for (const eroare of erori) console.error(`check-font-glyphs: ${eroare}`);
    process.exit(1);
  }
  console.log(`check-font-glyphs: ${latinExt} din ${total} fișiere woff2 sunt latin-ext și conțin U+0218–U+021B.`);
}

// Build-ul cade dacă găsește sedile în loc de virgulă (spec §5.3):
// U+015E Ş, U+015F ş, U+0162 Ţ, U+0163 ţ. Forma corectă are virgulă: Ș ș Ț ț (U+0218–U+021B).
// Se verifică dist/**/*.{html,txt,xml} și tot ce e sub src/. Ieșire cu cod 1 la prima sedilă.
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SEDILE = /[\u015E\u015F\u0162\u0163]/g;

/** Indexurile (în text) ale caracterelor U+015E, U+015F, U+0162 și U+0163. */
export function findCedilla(text) {
  return Array.from(text.matchAll(SEDILE), (m) => m.index);
}

const NUME = {
  '\u015E': 'U+015E (Ş)',
  '\u015F': 'U+015F (ş)',
  '\u0162': 'U+0162 (Ţ)',
  '\u0163': 'U+0163 (ţ)',
};

function* fisiere(dir) {
  for (const intrare of readdirSync(dir, { withFileTypes: true })) {
    const cale = join(dir, intrare.name);
    if (intrare.isDirectory()) yield* fisiere(cale);
    else if (intrare.isFile()) yield cale;
  }
}

function esteBinar(continut) {
  return continut.subarray(0, 8192).includes(0);
}

/** Primul fișier cu sedilă dintre cele date, sub forma `{ fisier, linie, coloana, caracter }`, sau `null`. */
export function primaSedila(caiFisiere) {
  for (const fisier of caiFisiere) {
    const brut = readFileSync(fisier);
    if (esteBinar(brut)) continue;
    const text = brut.toString('utf8');
    const [index] = findCedilla(text);
    if (index === undefined) continue;
    const inainte = text.slice(0, index).split('\n');
    return {
      fisier,
      linie: inainte.length,
      coloana: (inainte.at(-1) ?? '').length + 1,
      caracter: text.charAt(index),
    };
  }
  return null;
}

function main(radacina) {
  const dist = join(radacina, 'dist');
  const src = join(radacina, 'src');
  if (!existsSync(dist)) {
    console.error('check-cedilla: dist/ lipsește. Rulează întâi `npm run build`.');
    return 1;
  }
  const caiDist = [...fisiere(dist)].filter((f) => ['.html', '.txt', '.xml'].includes(extname(f)));
  const caiSrc = existsSync(src) && statSync(src).isDirectory() ? [...fisiere(src)] : [];
  const gasita = primaSedila([...caiDist, ...caiSrc]);
  if (gasita) {
    console.error(
      `check-cedilla: sedilă ${NUME[gasita.caracter]} în ${gasita.fisier}:${gasita.linie}:${gasita.coloana}. ` +
        'Folosește ș/ț cu virgulă (U+0218–U+021B).',
    );
    return 1;
  }
  console.log(`check-cedilla: fără sedile în ${caiDist.length} fișiere din dist/ și ${caiSrc.length} din src/.`);
  return 0;
}

// realpath pe ambele părți: printr-un symlink/junction argv[1] nu e realpath-uit, iar import.meta.url da.
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  process.exit(main(process.cwd()));
}

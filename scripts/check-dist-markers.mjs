// Build-ul de producție nu are voie să conțină „[DE COMPLETAT” nicăieri (§2 #17, §10 punctul 8):
// niciun fișier text din dist/ (HTML, txt, xml, css, js, json). Ieșire cu cod 1 la primul marcaj, la un dist/ lipsă sau gol.
// Folosire: node scripts/check-dist-markers.mjs [director-dist]
import { existsSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MARCAJ = '[DE COMPLETAT';

function* fisiere(dir) {
  for (const intrare of readdirSync(dir, { withFileTypes: true })) {
    const cale = join(dir, intrare.name);
    if (intrare.isDirectory()) yield* fisiere(cale);
    else if (intrare.isFile()) yield cale;
  }
}

/** Fișierele text ale directorului, fără cele binare (imagini, fonturi). */
function fisiereText(dir) {
  const rezultat = [];
  for (const fisier of fisiere(dir)) {
    const brut = readFileSync(fisier);
    if (!brut.subarray(0, 8192).includes(0)) rezultat.push({ fisier, text: brut.toString('utf8') });
  }
  return rezultat;
}

/** Marcajele din `dir`, ca `{ fisier, linie }`. */
export function gasesteMarcaje(dir) {
  const gasite = [];
  for (const { fisier, text } of fisiereText(dir)) {
    let index = text.indexOf(MARCAJ);
    while (index !== -1) {
      gasite.push({ fisier, linie: text.slice(0, index).split('\n').length });
      index = text.indexOf(MARCAJ, index + MARCAJ.length);
    }
  }
  return gasite;
}

// realpath pe ambele părți: printr-un symlink/junction argv[1] nu e realpath-uit, iar import.meta.url da.
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  const dir = resolve(process.argv[2] ?? 'dist');
  if (!existsSync(dir)) {
    console.error(`check-dist-markers: ${dir} lipsește. Rulează întâi \`npm run build\`.`);
    process.exit(1);
  }
  const text = fisiereText(dir);
  if (text.length === 0) {
    console.error(`check-dist-markers: niciun fișier text în ${dir}; un build gol nu poate fi verificat.`);
    process.exit(1);
  }
  const gasite = gasesteMarcaje(dir);
  if (gasite.length > 0) {
    const pe = new Map();
    for (const { fisier, linie } of gasite) pe.set(fisier, [...(pe.get(fisier) ?? []), linie]);
    for (const [fisier, linii] of pe) {
      console.error(`check-dist-markers: „${MARCAJ}” în ${fisier} (${linii.length}×, linia ${linii[0]})`);
    }
    console.error('Marcajele se completează în src/ (sau se scot) înainte de lansare; vezi `npm run report:placeholders`.');
    process.exit(1);
  }
  console.log(`check-dist-markers: niciun „${MARCAJ}” în ${text.length} fișiere text din ${dir}.`);
}

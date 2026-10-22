// check:launch (§11): refuză lansarea până când datele firmei, domeniul, aprobările și marcajele blocante sunt în regulă.
// Rulează după `npm run build` (dist/ de producție) și după `npm run report:placeholders`. Citește:
//   - src/site.config.ts (domeniul);
//   - dist/_intern/aprobari.json (rutele construite și aprobarea lor, din src/lib/routes.ts);
//   - reports/placeholders.json (marcajele rămase în sursă, cu rândul din registru);
//   - fișierele text din dist/ (niciun „[DE COMPLETAT” nu are voie să ajungă acolo).
// O pagină din dist/ care lipsește din aprobari.json contează ca neaprobată. Avertismentele nu blochează.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RADACINA = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(RADACINA, 'dist');

/** Domeniul din src/site.config.ts până îl alege Alex (registrul, #3). */
const DOMENIU_PROVIZORIU = 'site-provizoriu.example';

/**
 * Motivele de refuz, fiecare o dată, în ordinea verificărilor. Gol = se poate lansa.
 * @param {{ site: { url: string }, aprobari: Record<string, boolean>, paginiDist: string[], marcaje: { fisier: string, nr: number, blocheaza: boolean }[], distHtml: string[] }} stare
 */
export function verificaLansarea({ site, aprobari, paginiDist, marcaje, distHtml }) {
  const motive = new Set();
  if (new URL(site.url).hostname === DOMENIU_PROVIZORIU) motive.add('domeniul e încă provizoriu');
  for (const m of marcaje) if (m.blocheaza) motive.add(`marcaj blocant #${m.nr} în ${m.fisier}`);
  for (const [cale, aprobat] of Object.entries(aprobari)) if (!aprobat) motive.add(`pagină neaprobată: ${cale}`);
  for (const cale of paginiDist) if (!Object.hasOwn(aprobari, cale)) motive.add(`pagină neaprobată: ${cale}`);
  if (distHtml.some((text) => text.includes('[DE COMPLETAT'))) motive.add('marcaj în dist/');
  return [...motive];
}

/**
 * Ce trebuie verificat de mână înainte de lansare, fără să blocheze: datele scrise în texte (ghiduri, pagini legale)
 * și dependențele de dezvoltare cu vulnerabilități cunoscute.
 * @param {{ date: { cale: string, data: string }[] }} stare
 */
export function avertismenteLansare({ date }) {
  return [
    ...date.map(({ cale, data }) => `${cale}: data din text e ${data}; pune data aprobării, dacă e alta`),
    'rulează `npm audit`: wrangler 4.148.0 avea o vulnerabilitate în dezvoltare (sharp, prin miniflare); actualizează înainte de deploy',
  ];
}

/** Calea paginii pentru un fișier HTML din dist/: `servicii/seo/index.html` → `/servicii/seo/`, `404.html` → `/404/`. */
function caleaPaginii(fisier) {
  const rel = relative(DIST, fisier).split(sep).join('/');
  if (rel === '404.html') return '/404/';
  return `/${rel.replace(/index\.html$/, '')}`;
}

function* fisiere(dir) {
  for (const intrare of readdirSync(dir)) {
    const cale = join(dir, intrare);
    if (statSync(cale).isDirectory()) {
      if (intrare !== '_intern') yield* fisiere(cale);
    } else yield cale;
  }
}

async function main() {
  const fisierAprobari = join(DIST, '_intern', 'aprobari.json');
  if (!existsSync(fisierAprobari)) throw new Error('lipsește dist/_intern/aprobari.json: rulează întâi `npm run build`');
  const { draft, pagini } = JSON.parse(readFileSync(fisierAprobari, 'utf8'));
  if (draft) throw new Error('dist/ e construit cu DRAFT=1; check:launch se rulează pe build-ul de producție');

  const { site } = await import(pathToFileURL(join(RADACINA, 'src', 'site.config.ts')).href);
  const marcaje = JSON.parse(readFileSync(join(RADACINA, 'reports', 'placeholders.json'), 'utf8'));
  const toate = [...fisiere(DIST)];
  const distHtml = toate.filter((f) => ['.html', '.txt', '.xml'].includes(extname(f))).map((f) => readFileSync(f, 'utf8'));
  const paginiDist = toate.filter((f) => extname(f) === '.html').map(caleaPaginii);
  const aprobari = Object.fromEntries(pagini.map((p) => [p.cale, p.aprobat]));

  const motive = verificaLansarea({ site, aprobari, paginiDist, marcaje, distHtml });
  for (const a of avertismenteLansare({ date: pagini.filter((p) => p.data !== undefined) })) console.warn(`avertisment: ${a}`);
  if (motive.length > 0) {
    console.error(`check:launch: lansarea e refuzată (${motive.length} motive):\n  - ${motive.join('\n  - ')}`);
    process.exit(1);
  }
  console.log('check:launch: totul e în regulă pentru lansare.');
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
